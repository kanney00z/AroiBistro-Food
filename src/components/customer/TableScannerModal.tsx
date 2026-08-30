import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  QrCode,
  X,
  Camera,
  CheckCircle2,
  Sparkles,
  Users,
  Search,
  RotateCcw,
  UtensilsCrossed,
  Info,
  Layers,
  Package,
  Bike,
  Upload,
  AlertCircle,
  VideoOff,
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';

export const TableScannerModal: React.FC = () => {
  const {
    isTableScannerModalOpen,
    setIsTableScannerModalOpen,
    selectedTable,
    isTableScanned,
    scanTable,
    selectTableManually,
    clearScannedTable,
    setOrderType,
    tables,
    showToast,
  } = useRestaurant();

  const [activeTab, setActiveTab] = useState<'quick' | 'camera' | 'tables'>('quick');
  const [manualInput, setManualInput] = useState('');
  const [isScanningAnim, setIsScanningAnim] = useState(true);
  const [scannedSuccessNum, setScannedSuccessNum] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const qrFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isTableScannerModalOpen) {
      setScannedSuccessNum(null);
      setManualInput('');
      setCameraError(null);
    } else {
      stopCamera();
    }
  }, [isTableScannerModalOpen]);

  // Camera stream handler when tab is 'camera'
  useEffect(() => {
    if (isTableScannerModalOpen && activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [activeTab, isTableScannerModalOpen]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('เบราว์เซอร์นี้ไม่รองรับการเปิดกล้องโดยตรง กรุณาเลือกโต๊ะหรืออัปโหลดรูปภาพ');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((err) => console.log('Video play interrupted:', err));
      }
      setIsCameraActive(true);

      // Start BarcodeDetector loop if supported
      if ('BarcodeDetector' in window) {
        try {
          const barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
          scanIntervalRef.current = window.setInterval(async () => {
            if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
              try {
                const barcodes = await barcodeDetector.detect(videoRef.current);
                if (barcodes.length > 0) {
                  const rawVal = barcodes[0].rawValue;
                  handleDetectedQrText(rawVal);
                }
              } catch (e) {
                // frame detection pass
              }
            }
          }, 400);
        } catch (e) {
          console.warn('BarcodeDetector initialization error:', e);
        }
      }
    } catch (err: any) {
      console.warn('Camera access denied or unavailable:', err);
      setIsCameraActive(false);
      setCameraError('ไม่สามารถเข้าถึงกล้องได้ (อาจยังไม่อนุญาตสิทธิ์ หรือเปิดใน iframe) คุณสามารถแตะเลือกโต๊ะด้านล่างได้ทันที');
    }
  };

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const handleDetectedQrText = (text: string) => {
    if (!text) return;
    // Extract table from URL or text (e.g. ?table=T-01 or T-01)
    let matchedTable: string | null = null;
    try {
      const url = new URL(text);
      matchedTable = url.searchParams.get('table');
    } catch {
      // not a full URL
    }

    if (!matchedTable) {
      const tableMatch = text.match(/T-\d{2}|TABLE\s*\d+/i);
      if (tableMatch) {
        matchedTable = tableMatch[0].toUpperCase();
      }
    }

    if (matchedTable) {
      stopCamera();
      handleSelectTable(matchedTable);
    }
  };

  const handleQrFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    showToast('กำลังวิเคราะห์ภาพ QR Code...', 'info');

    // Simulate scanning or if BarcodeDetector is available
    if ('BarcodeDetector' in window) {
      const img = new Image();
      img.onload = async () => {
        try {
          const barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
          const barcodes = await barcodeDetector.detect(img);
          if (barcodes.length > 0) {
            handleDetectedQrText(barcodes[0].rawValue);
            return;
          }
        } catch {}
        // Fallback simulate
        handleSelectTable('T-01');
      };
      img.src = URL.createObjectURL(file);
    } else {
      // Pick first available table for quick simulation
      setTimeout(() => {
        handleSelectTable(tables[0]?.number || 'T-01');
      }, 600);
    }
  };

  const handleSelectTable = (tableNum: string) => {
    setScannedSuccessNum(tableNum);
    setTimeout(() => {
      scanTable(tableNum);
    }, 500);
  };

  const handleManualTableSelect = (tableNum: string) => {
    selectTableManually(tableNum);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;

    let targetNum = manualInput.trim().toUpperCase();
    if (!targetNum.startsWith('T-') && !isNaN(Number(targetNum))) {
      targetNum = `T-${targetNum.padStart(2, '0')}`;
    }

    handleManualTableSelect(targetNum);
  };

  if (!isTableScannerModalOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsTableScannerModalOpen(false)}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-[#111112] rounded-3xl border border-white/10 shadow-2xl overflow-hidden z-10 my-auto flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#0A0A0B]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FF5C00]/20 border border-[#FF5C00]/40 flex items-center justify-center text-[#FF5C00]">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-black text-lg text-white">
                  เลือกโต๊ะ / สแกน QR Code ทานที่ร้าน
                </h3>
                <p className="text-xs text-stone-400">
                  เลือกโต๊ะเอง, สั่งที่เคาน์เตอร์ หรือสแกน QR Code ประจำโต๊ะ
                </p>
              </div>
            </div>

            <button
              type="button"
              id="btn-close-table-scanner"
              onClick={() => setIsTableScannerModalOpen(false)}
              className="w-9 h-9 rounded-xl bg-[#161618] hover:bg-[#202024] text-stone-400 hover:text-white border border-white/10 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Current Table Info Banner if already scanned */}
          {selectedTable && (
            <div className="px-5 py-3 bg-emerald-950/40 border-b border-emerald-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-stone-300">
                  ที่นั่งปัจจุบัน:{' '}
                  <strong className="text-white font-mono text-sm">{selectedTable}</strong>
                  {isTableScanned ? ' (สแกน QR แล้ว)' : ' (เลือกเอง / สั่งปกติ)'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => clearScannedTable()}
                className="text-[11px] font-bold text-rose-400 hover:text-rose-300 underline cursor-pointer"
              >
                ยกเลิก
              </button>
            </div>
          )}

          {/* Tab Switcher */}
          <div className="flex border-b border-white/10 bg-[#0E0E10] p-1 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('quick')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'quick'
                  ? 'bg-[#161618] text-white shadow-sm border border-white/10'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <UtensilsCrossed className="w-3.5 h-3.5 text-[#FF5C00]" />
              <span>เลือกโต๊ะ (ไม่ต้องสแกน)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('camera')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'camera'
                  ? 'bg-[#161618] text-white shadow-sm border border-white/10'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <Camera className="w-3.5 h-3.5 text-[#FF5C00]" />
              <span>สแกนกล้อง</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('tables')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'tables'
                  ? 'bg-[#161618] text-white shadow-sm border border-white/10'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-[#FF5C00]" />
              <span>แผนผังโต๊ะ</span>
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="overflow-y-auto p-5 space-y-5 flex-1 custom-scrollbar">
            {activeTab === 'quick' ? (
              <div className="space-y-4">
                {/* Fast No-Scan Options Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#161618] to-[#0E0E10] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#FF5C00]" />
                      แตะเลือกโต๊ะเพื่อสั่งอาหารได้ทันที
                    </span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md font-bold">
                      สะดวก รวดเร็ว
                    </span>
                  </div>

                  <p className="text-xs text-stone-400">
                    ลูกค้าที่นั่งทานในร้านสามารถแตะเลือกเบอร์โต๊ะที่นั่งอยู่ หรือเลือกสั่งที่เคาน์เตอร์ได้ทันทีโดยไม่ต้องเปิดกล้องสแกน QR Code
                  </p>

                  {/* 1-Click Table Grid */}
                  <div className="grid grid-cols-4 sm:grid-cols-4 gap-2 pt-1">
                    {tables.map((table) => {
                      const isCurrent = selectedTable === table.number;
                      return (
                        <button
                          key={table.id}
                          type="button"
                          id={`btn-manual-table-${table.number}`}
                          onClick={() => handleManualTableSelect(table.number)}
                          className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                            isCurrent
                              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-950 ring-1 ring-emerald-500'
                              : 'bg-[#0A0A0B] hover:bg-[#FF5C00] hover:text-white border-white/10 hover:border-[#FF5C00] text-stone-200'
                          }`}
                        >
                          <span className="text-sm font-mono font-black">{table.number}</span>
                          <span className="text-[10px] opacity-75 font-medium">
                            {table.capacity} ที่นั่ง
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Counter Walk-in Option */}
                <button
                  type="button"
                  onClick={() => handleManualTableSelect('สั่งที่เคาน์เตอร์')}
                  className="w-full p-4 rounded-2xl bg-[#161618] hover:bg-[#202024] border border-white/10 hover:border-[#FF5C00]/40 text-left transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 group-hover:bg-[#FF5C00]/20 text-[#FF5C00] flex items-center justify-center">
                      <UtensilsCrossed className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-[#FF5C00] transition-colors">
                        สั่งที่เคาน์เตอร์ / พนักงานจัดโต๊ะให้
                      </h4>
                      <p className="text-xs text-stone-400">
                        สำหรับลูกค้าที่ยังไม่ได้โต๊ะ หรือสั่งที่หน้าเคาน์เตอร์
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#FF5C00] group-hover:translate-x-1 transition-transform">
                    เลือก →
                  </span>
                </button>

                {/* Manual text input */}
                <form onSubmit={handleManualSubmit} className="pt-1">
                  <label className="label-caps block mb-1.5">
                    หรือพิมพ์หมายเลขโต๊ะ (กรณีเลขโต๊ะพิเศษ)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="เช่น T-01 หรือ 1"
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#0A0A0B] border border-white/10 text-xs sm:text-sm text-white font-mono placeholder-stone-500 focus:outline-none focus:border-[#FF5C00]"
                    />
                    <button
                      type="submit"
                      disabled={!manualInput.trim()}
                      className="px-4 py-2.5 rounded-xl bg-[#FF5C00] hover:bg-[#FF7729] disabled:opacity-40 text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                    >
                      ยืนยัน
                    </button>
                  </div>
                </form>
              </div>
            ) : activeTab === 'camera' ? (
              <div className="space-y-4">
                {/* Camera Viewfinder Box */}
                <div className="relative w-full aspect-square max-w-[280px] mx-auto rounded-3xl bg-black border-2 border-stone-800 overflow-hidden flex flex-col items-center justify-center shadow-inner">
                  {/* Live Video Feed */}
                  <video
                    ref={videoRef}
                    playsInline
                    autoPlay
                    muted
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                      isCameraActive ? 'opacity-100' : 'opacity-0'
                    }`}
                  />

                  {/* Fallback / Loading Background */}
                  {!isCameraActive && (
                    <div className="absolute inset-0 bg-radial from-stone-900 to-black opacity-90 flex flex-col items-center justify-center p-4 text-center">
                      {cameraError ? (
                        <div className="space-y-2">
                          <VideoOff className="w-10 h-10 text-stone-500 mx-auto" />
                          <p className="text-[11px] text-stone-400 leading-tight">
                            {cameraError}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Camera className="w-10 h-10 text-[#FF5C00] animate-pulse mx-auto" />
                          <p className="text-xs text-stone-300 font-bold">กำลังเปิดกล้อง...</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Laser Scanning Beam */}
                  {isScanningAnim && isCameraActive && (
                    <motion.div
                      animate={{
                        top: ['10%', '85%', '10%'],
                        opacity: [0.7, 1, 0.7],
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 2.2,
                        ease: 'easeInOut',
                      }}
                      className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-[#FF5C00] to-transparent shadow-[0_0_15px_#FF5C00] z-20"
                    />
                  )}

                  {/* Corner Guides */}
                  <div className="absolute inset-8 pointer-events-none z-10">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#FF5C00] rounded-tl-xl" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#FF5C00] rounded-tr-xl" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#FF5C00] rounded-bl-xl" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#FF5C00] rounded-br-xl" />
                  </div>

                  {/* Scanner Center Graphic or Success State */}
                  {scannedSuccessNum ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="relative z-30 flex flex-col items-center gap-2 p-4 bg-emerald-950/90 border border-emerald-500 rounded-2xl text-center shadow-xl"
                    >
                      <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                      <span className="text-xs font-bold text-emerald-300">สแกนสำเร็จ!</span>
                      <strong className="text-xl font-mono text-white">{scannedSuccessNum}</strong>
                    </motion.div>
                  ) : (
                    !isCameraActive && !cameraError && (
                      <div className="relative z-10 flex flex-col items-center gap-2 text-stone-500">
                        <QrCode className="w-16 h-16 opacity-30 text-white stroke-[1]" />
                        <span className="text-[11px] font-mono tracking-wider uppercase text-stone-400">
                          เล็งกล้องไปที่ QR โต๊ะ
                        </span>
                      </div>
                    )
                  )}

                  <div className="absolute bottom-2.5 text-[9px] text-stone-400 bg-black/60 px-2.5 py-0.5 rounded-full font-mono z-20">
                    {isCameraActive ? 'LIVE SCANNER ACTIVE' : 'CAMERA STANDBY'}
                  </div>
                </div>

                {/* Upload Image Option */}
                <div className="flex items-center justify-center gap-2">
                  <input
                    type="file"
                    ref={qrFileInputRef}
                    accept="image/*"
                    onChange={handleQrFileUpload}
                    className="hidden"
                    id="qr-file-upload"
                  />
                  <button
                    type="button"
                    onClick={() => qrFileInputRef.current?.click()}
                    className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white border border-white/10 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#FF5C00]" />
                    <span>อัปโหลดรูปภาพ QR Code โต๊ะ</span>
                  </button>
                </div>

                {/* Quick Simulation Click Bar */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-stone-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#FF5C00]" />
                      แตะเลือกโต๊ะได้ทันที:
                    </span>
                    <span className="text-[11px] text-stone-500">1-Tap Select</span>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {tables.slice(0, 8).map((table) => {
                      const isCurrent = selectedTable === table.number;
                      return (
                        <button
                          key={table.id}
                          type="button"
                          id={`btn-quick-scan-${table.number}`}
                          onClick={() => handleSelectTable(table.number)}
                          className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                            isCurrent
                              ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-950'
                              : 'bg-[#161618] hover:bg-[#202024] border-white/10 hover:border-[#FF5C00]/50 text-white'
                          }`}
                        >
                          <span className="text-xs font-mono font-black">{table.number}</span>
                          <span className="text-[9px] text-stone-400 font-medium truncate max-w-full">
                            {table.zone.replace('Main Hall', 'Hall')}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Manual Table Number Input */}
                <form onSubmit={handleManualSubmit} className="pt-2">
                  <label className="label-caps block mb-1.5">
                    หรือระบุหมายเลขโต๊ะด้วยตนเอง
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="เช่น T-01 หรือ 1"
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#0A0A0B] border border-white/10 text-xs sm:text-sm text-white font-mono placeholder-stone-500 focus:outline-none focus:border-[#FF5C00]"
                    />
                    <button
                      type="submit"
                      disabled={!manualInput.trim()}
                      className="px-4 py-2.5 rounded-xl bg-[#FF5C00] hover:bg-[#FF7729] disabled:opacity-40 text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                    >
                      ยืนยันโต๊ะ
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* All Tables Grid view */
              <div className="space-y-3">
                <p className="text-xs text-stone-400">
                  เลือกโต๊ะเพื่อจำลองการสแกน QR Code ประจำโต๊ะนั้นๆ:
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {tables.map((table) => {
                    const isCurrent = selectedTable === table.number;
                    return (
                      <div
                        key={table.id}
                        onClick={() => handleSelectTable(table.number)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between space-y-2 ${
                          isCurrent
                            ? 'bg-emerald-950/40 border-emerald-500 shadow-lg'
                            : 'bg-[#161618] hover:bg-[#1c1c20] border-white/10 hover:border-[#FF5C00]/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <h4 className="font-mono font-black text-lg text-white group-hover:text-[#FF5C00] transition-colors">
                              {table.number}
                            </h4>
                            {isCurrent && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                โต๊ะของคุณ
                              </span>
                            )}
                          </div>
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              table.status === 'available'
                                ? 'bg-emerald-400'
                                : table.status === 'occupied'
                                ? 'bg-amber-400'
                                : 'bg-stone-500'
                            }`}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-stone-400">
                          <span>{table.zone}</span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {table.capacity} ที่นั่ง
                          </span>
                        </div>

                        <button
                          type="button"
                          className={`w-full py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                            isCurrent
                              ? 'bg-emerald-600 text-white'
                              : 'bg-white/5 group-hover:bg-[#FF5C00] text-stone-300 group-hover:text-white'
                          }`}
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>{isCurrent ? 'สแกนอยู่แล้ว' : 'สแกนเข้าโต๊ะนี้'}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer & Non-dine in shortcut */}
          <div className="p-4 border-t border-white/10 bg-[#0A0A0B] space-y-3">
            {/* If customer is NOT at the restaurant */}
            <div className="p-3 rounded-2xl bg-[#161618] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="text-xs">
                <span className="font-bold text-stone-200 block">ไม่ได้นั่งที่ร้าน?</span>
                <span className="text-[11px] text-stone-400">สั่งแบบปกติโดยไม่ต้องสแกนโต๊ะ</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-scanner-switch-pickup"
                  onClick={() => {
                    setOrderType('pickup');
                    setIsTableScannerModalOpen(false);
                    showToast('เปลี่ยนเป็นสั่งกลับบ้าน (ไม่ต้องสแกนโต๊ะ)', 'info');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-stone-200 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-white/10"
                >
                  <Package className="w-3.5 h-3.5 text-amber-400" />
                  <span>รับกลับบ้าน</span>
                </button>

                <button
                  type="button"
                  id="btn-scanner-switch-delivery"
                  onClick={() => {
                    setOrderType('delivery');
                    setIsTableScannerModalOpen(false);
                    showToast('เปลี่ยนเป็นสั่งเดลิเวอรี่ (ไม่ต้องสแกนโต๊ะ)', 'info');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-stone-200 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-white/10"
                >
                  <Bike className="w-3.5 h-3.5 text-emerald-400" />
                  <span>เดลิเวอรี่</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-stone-400 pt-1">
              <div className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-[#FF5C00]" />
                <span className="text-[11px]">เมื่อสแกนแล้ว รายการอาหารจะส่งตรงไปยังโต๊ะของคุณ</span>
              </div>
              <button
                type="button"
                onClick={() => setIsTableScannerModalOpen(false)}
                className="px-3 py-1.5 rounded-xl bg-[#161618] hover:bg-[#202024] text-stone-300 text-xs font-bold cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
