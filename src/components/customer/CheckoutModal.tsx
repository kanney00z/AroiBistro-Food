import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  QrCode,
  CreditCard,
  Banknote,
  CheckCircle2,
  Lock,
  Sparkles,
  Phone,
  User,
  Clock,
  ArrowRight,
  Upload,
  UtensilsCrossed,
  Image as ImageIcon,
  Trash2,
  ZoomIn,
  Camera,
  Copy,
  Check,
  Download,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useRestaurant } from '../../context/RestaurantContext';
import { PaymentMethod } from '../../types';
import { compressImageFile } from '../../utils/imageCompressor';
import { generatePromptPayQrDataUrl } from '../../utils/promptpay';
import { downloadDataUrl } from '../../utils/qrCode';

export const CheckoutModal: React.FC = () => {
  const {
    isCheckoutModalOpen,
    setIsCheckoutModalOpen,
    cart,
    cartTotal,
    cartSubtotal,
    cartDiscount,
    cartServiceCharge,
    orderType,
    selectedTable,
    setSelectedTable,
    selectTableManually,
    isTableScanned,
    setIsTableScannerModalOpen,
    tables,
    activeTableOrder,
    isAddingToExistingOrder,
    customerInfo,
    setCustomerInfo,
    createOrder,
    settings,
    storeStatus,
    showToast,
  } = useRestaurant();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('promptpay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [slipImage, setSlipImage] = useState<string | null>(null);
  const [slipFileName, setSlipFileName] = useState<string>('');
  const [isViewingSlipFull, setIsViewingSlipFull] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [promptPayQrUrl, setPromptPayQrUrl] = useState<string>('');
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [isCopiedPromptPay, setIsCopiedPromptPay] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate real EMVCo PromptPay QR Code
  useEffect(() => {
    if (!isCheckoutModalOpen || paymentMethod !== 'promptpay') return;

    let isMounted = true;
    setIsGeneratingQr(true);

    generatePromptPayQrDataUrl(settings.promptPayId || '0821062891', cartTotal, {
      width: 400,
      margin: 1,
      darkColor: '#000000',
      lightColor: '#ffffff',
    })
      .then((url) => {
        if (isMounted) {
          setPromptPayQrUrl(url);
          setIsGeneratingQr(false);
        }
      })
      .catch((err) => {
        console.error('Error generating PromptPay QR:', err);
        if (isMounted) setIsGeneratingQr(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isCheckoutModalOpen, paymentMethod, settings.promptPayId, cartTotal]);

  const handleCopyPromptPayId = () => {
    const id = settings.promptPayId || '0821062891';
    navigator.clipboard.writeText(id);
    setIsCopiedPromptPay(true);
    showToast(`คัดลอกหมายเลขพร้อมเพย์ ${id} เรียบร้อยแล้ว`, 'success');
    setTimeout(() => setIsCopiedPromptPay(false), 2500);
  };

  const handleDownloadPromptPayQr = () => {
    if (!promptPayQrUrl) return;
    const filename = `PromptPay_฿${cartTotal}_${settings.promptPayId}.png`;
    downloadDataUrl(promptPayQrUrl, filename);
    showToast('ดาวน์โหลดภาพ QR Code พร้อมเพย์แล้ว', 'success');
  };

  // Paste slip from clipboard support
  useEffect(() => {
    if (!isCheckoutModalOpen || paymentMethod !== 'promptpay') return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            processSlipFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isCheckoutModalOpen, paymentMethod]);

  if (!isCheckoutModalOpen) return null;

  const dineInItemsCount = cart.filter((c) => (c.packagingType || 'dine_in') === 'dine_in').reduce((s, i) => s + i.quantity, 0);
  const takeawayItemsCount = cart.filter((c) => c.packagingType === 'takeaway').reduce((s, i) => s + i.quantity, 0);

  const processSlipFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('กรุณาเลือกไฟล์รูปภาพ (JPG, PNG, WEBP)', 'warning');
      return;
    }

    try {
      const compressedDataUrl = await compressImageFile(file, {
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.7,
      });

      setSlipImage(compressedDataUrl);
      setSlipFileName(file.name || `slip_${Date.now()}.jpg`);
      showToast('แนบรูปภาพสลิปโอนเงินสำเร็จ! 🧾', 'success');
    } catch (err) {
      console.error('Error compressing slip image:', err);
      // Fallback: standard FileReader
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setSlipImage(result);
          setSlipFileName(file.name || `slip_${Date.now()}.png`);
          showToast('แนบรูปภาพสลิปโอนเงินสำเร็จ! 🧾', 'success');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processSlipFile(files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processSlipFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveSlip = () => {
    setSlipImage(null);
    setSlipFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    showToast('ลบรูปสลิปเรียบร้อยแล้ว', 'info');
  };

  const handleConfirmOrder = () => {
    if (!storeStatus.isOpen) {
      showToast(`ร้านปิดทำการในขณะนี้ (${storeStatus.statusText}) ไม่สามารถส่งออเดอร์ได้`, 'warning');
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      // Trigger festive confetti celebration
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#fbbf24', '#10b981', '#ffffff'],
        });
      } catch (e) {
        console.error(e);
      }

      createOrder(paymentMethod, slipImage || undefined);
      setIsProcessing(false);
    }, 1000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        
        {/* Backdrop */}
        <motion.div
          id="checkout-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => !isProcessing && setIsCheckoutModalOpen(false)}
          className="fixed inset-0 bg-stone-950/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          id="checkout-modal-dialog"
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          className="relative w-full max-w-xl bg-[#111112] rounded-3xl border border-white/10 shadow-2xl overflow-hidden z-10 my-auto flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#0A0A0B]">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-black text-xl text-white">
                  {isAddingToExistingOrder && activeTableOrder
                    ? `สั่งอาหารเพิ่มเข้าบิลเดิม #${activeTableOrder.orderNumber} (รอบที่ ${(activeTableOrder?.roundsCount || 1) + 1})`
                    : 'ยืนยันการสั่งและชำระเงิน'}
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> SECURE
                </span>
              </div>
              <p className="text-xs text-stone-400 font-bold uppercase tracking-wider mt-0.5">
                {isAddingToExistingOrder && activeTableOrder
                  ? `เพิ่มรายการเข้าบิลเดิม #${activeTableOrder.orderNumber} ${activeTableOrder.tableNumber ? `• โต๊ะ ${activeTableOrder.tableNumber}` : ''}`
                  : orderType === 'dine_in'
                  ? `ทานที่ร้าน • โต๊ะ ${selectedTable || 'เคาน์เตอร์'}`
                  : `รับอาหารกลับบ้าน`}
              </p>
            </div>

            <button
              id="btn-close-checkout-modal"
              disabled={isProcessing}
              onClick={() => setIsCheckoutModalOpen(false)}
              className="w-9 h-9 rounded-xl bg-[#161618] hover:bg-[#202024] text-stone-300 hover:text-white border border-white/10 flex items-center justify-center transition-colors disabled:opacity-50 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="overflow-y-auto p-6 space-y-6 flex-1 custom-scrollbar">
            {/* Store Closed Notice */}
            {!storeStatus.isOpen && (
              <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/50 flex items-start gap-3">
                <Clock className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <h4 className="font-bold text-rose-200">
                    แจ้งเตือน: ขณะนี้ร้านปิดทำการ ({storeStatus.statusText})
                  </h4>
                  <p className="text-stone-300 leading-relaxed">
                    {storeStatus.statusDetail} • <strong>{storeStatus.nextOpenText}</strong>
                  </p>
                  <p className="text-rose-300 font-medium text-[11px]">
                    ระบบปิดรับออเดอร์ในขณะนี้ ไม่สามารถกดสั่งอาหารได้ กรุณาสั่งอาหารใหม่อีกครั้งเมื่อร้านเปิดให้บริการ
                  </p>
                </div>
              </div>
            )}

            {/* Existing Bill Notice */}
            {orderType === 'dine_in' && isAddingToExistingOrder && activeTableOrder && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <h4 className="font-bold text-amber-300">
                    รวมเข้าบิลเดิม: โต๊ะ {selectedTable} (#{activeTableOrder.orderNumber})
                  </h4>
                  <p className="text-stone-300 leading-relaxed">
                    ระบบจะเพิ่ม {cart.length} รายการนี้เข้าสู่บิลเดิมและส่งเข้าครัวเพื่อเริ่มปรุงรอบที่ {(activeTableOrder.roundsCount || 1) + 1}
                  </p>
                </div>
              </div>
            )}

            {/* Packaging Summary Box */}
            <div className="p-3.5 rounded-2xl bg-[#0A0A0B] border border-white/10 flex items-center justify-between text-xs">
              <span className="text-stone-400 font-medium">รายการในบิลนี้ ({cart.length} รายการ):</span>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-stone-800 text-stone-200 font-bold">
                  🍽️ ทานที่ร้าน {dineInItemsCount} ที่
                </span>
                <span className="px-2 py-0.5 rounded-md bg-stone-800 text-stone-200 font-bold">
                  🛍️ สั่งกลับบ้าน {takeawayItemsCount} ที่
                </span>
              </div>
            </div>
            
            {/* Customer Details Form */}
            <div className="space-y-3">
              <h4 className="label-caps">
                ข้อมูลผู้สั่งอาหาร
              </h4>

              {/* Dine-in Table Selector / Status */}
              {orderType === 'dine_in' && (
                <div className="p-3.5 rounded-2xl bg-[#0A0A0B] border border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="label-caps text-[#FF5C00] flex items-center gap-1.5">
                      <UtensilsCrossed className="w-3.5 h-3.5" />
                      โต๊ะอาหาร / จุดรับประทานที่ร้าน
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      ไม่ต้องสแกนก็สั่งได้
                    </span>
                  </div>

                  {selectedTable ? (
                    <div className="p-2.5 rounded-xl bg-[#161618] border border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">
                          ✓
                        </div>
                        <div>
                          <div className="text-xs text-stone-300">
                            ที่นั่งของคุณ: <strong className="text-white font-mono font-bold">{selectedTable}</strong>
                          </div>
                          <span className="text-[10px] text-stone-400">
                            {isTableScanned ? 'สแกน QR Code แล้ว' : 'สั่งทานที่ร้าน (ปกติ)'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setIsTableScannerModalOpen(true)}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white text-xs font-bold cursor-pointer"
                        >
                          เปลี่ยน
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedTable('')}
                          className="p-1 rounded-lg bg-white/5 hover:bg-rose-500/20 text-stone-400 hover:text-rose-300 text-xs cursor-pointer"
                          title="ล้างโต๊ะ"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-stone-400">
                        เลือกโต๊ะที่นั่งของคุณ หรือเลือกสั่งที่เคาน์เตอร์:
                      </p>
                      <div className="grid grid-cols-4 gap-1.5">
                        {tables.slice(0, 8).map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => selectTableManually(t.number)}
                            className="py-1 px-2 rounded-xl bg-[#161618] hover:bg-[#FF5C00] hover:text-white border border-white/10 hover:border-[#FF5C00] text-xs font-mono font-bold text-stone-300 transition-all text-center cursor-pointer"
                          >
                            {t.number}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => selectTableManually('สั่งที่เคาน์เตอร์')}
                          className="flex-1 py-1.5 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-stone-200 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                        >
                          <span>สั่งที่เคาน์เตอร์ / พนักงานจัดโต๊ะ</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsTableScannerModalOpen(true)}
                          className="py-1.5 px-2.5 rounded-xl bg-[#FF5C00]/15 hover:bg-[#FF5C00]/25 border border-[#FF5C00]/40 text-[#FF5C00] text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                        >
                          <QrCode className="w-3 h-3" />
                          <span>สแกน QR</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                  <input
                    type="text"
                    id="input-customer-name"
                    placeholder="ชื่อผู้ติดต่อ (เช่น คุณพงศกร)"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-[#0A0A0B] border border-white/10 text-xs sm:text-sm text-white placeholder-stone-500 focus:outline-none focus:border-[#FF5C00] font-medium"
                  />
                </div>

                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                  <input
                    type="tel"
                    id="input-customer-phone"
                    placeholder="เบอร์โทรศัพท์ (เช่น 081-234-5678)"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo((prev) => ({ ...prev, phone: e.target.value }))}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-[#0A0A0B] border border-white/10 text-xs sm:text-sm text-white placeholder-stone-500 focus:outline-none focus:border-[#FF5C00] font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-3 pt-3 border-t border-white/10">
              <h4 className="label-caps">
                ช่องทางการชำระเงิน
              </h4>

              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { id: 'promptpay', name: 'พร้อมเพย์ QR', desc: 'สแกนจ่ายทันที', icon: QrCode },
                  { id: 'credit_card', name: 'บัตรเครดิต', desc: 'Visa / Master', icon: CreditCard },
                  { id: 'cash', name: 'เงินสด', desc: 'ชำระเมื่อรับอาหาร', icon: Banknote },
                ].map((pm) => {
                  const Icon = pm.icon;
                  const isSelected = paymentMethod === pm.id;
                  return (
                    <button
                      key={pm.id}
                      id={`payment-method-${pm.id}`}
                      onClick={() => setPaymentMethod(pm.id as PaymentMethod)}
                      className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#FF5C00]/15 border-[#FF5C00] text-white ring-1 ring-[#FF5C00]'
                          : 'bg-[#161618] border-white/10 hover:border-white/20 text-stone-400'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-[#FF5C00]' : 'text-stone-400'}`} />
                      <div>
                        <div className="font-bold text-xs sm:text-sm text-white">{pm.name}</div>
                        <div className="text-[10px] text-stone-400 font-medium">{pm.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Payment Details Display */}
              {paymentMethod === 'promptpay' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 sm:p-5 rounded-2xl bg-[#0A0A0B] border border-white/10 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row items-center gap-5">
                    {/* Real Scannable PromptPay QR Code Display */}
                    <div className="w-full sm:w-auto flex flex-col items-center">
                      <div className="p-3.5 bg-white rounded-2xl shadow-xl border border-stone-200 flex flex-col items-center w-[200px] text-stone-900">
                        {/* Thai QR Payment Header */}
                        <div className="w-full bg-[#003B71] text-white py-1 px-2 rounded-t-lg text-center flex items-center justify-center gap-1 mb-2">
                          <span className="font-bold text-[11px] tracking-wide">THAI QR PAYMENT</span>
                        </div>

                        {/* QR Code Image Container */}
                        <div className="w-[170px] h-[170px] bg-white flex items-center justify-center rounded-lg overflow-hidden border border-stone-100 p-1 relative">
                          {promptPayQrUrl ? (
                            <img
                              src={promptPayQrUrl}
                              alt="PromptPay QR Code"
                              className="w-full h-full object-contain select-all"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center gap-2 text-stone-400">
                              <QrCode className="w-12 h-12 animate-pulse text-[#003B71]" />
                              <span className="text-[10px] font-medium">กำลังสร้าง QR...</span>
                            </div>
                          )}
                        </div>

                        {/* PromptPay Label & Phone/ID */}
                        <div className="w-full text-center mt-2 pt-1 border-t border-stone-100">
                          <div className="text-[9px] font-bold text-stone-500 uppercase tracking-wider">
                            พร้อมเพย์ (PROMPTPAY)
                          </div>
                          <div className="text-xs font-black font-mono tracking-wider text-[#003B71]">
                            {settings.promptPayId || '0821062891'}
                          </div>
                        </div>
                      </div>

                      {/* Quick Action Buttons for PromptPay QR */}
                      <div className="flex items-center gap-1.5 mt-2 w-full max-w-[200px]">
                        <button
                          type="button"
                          onClick={handleCopyPromptPayId}
                          className="flex-1 py-1.5 px-2 rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-colors border border-white/10 cursor-pointer"
                          title="คัดลอกเบอร์พร้อมเพย์"
                        >
                          {isCopiedPromptPay ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">คัดลอกแล้ว</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-[#FF5C00]" />
                              <span>คัดลอกเบอร์</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={handleDownloadPromptPayQr}
                          className="py-1.5 px-2 rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-colors border border-white/10 cursor-pointer"
                          title="ดาวน์โหลด QR Code"
                        >
                          <Download className="w-3 h-3 text-[#FF5C00]" />
                        </button>
                      </div>
                    </div>

                    {/* QR Instructions & Amount */}
                    <div className="space-y-3 text-xs text-stone-300 flex-1 text-center sm:text-left">
                      <div className="font-bold text-sm text-white flex items-center justify-center sm:justify-start gap-1.5">
                        <Sparkles className="w-4 h-4 text-[#FF5C00]" />
                        <span>สแกน QR Code เพื่อชำระเงิน</span>
                      </div>

                      <div className="p-3 rounded-xl bg-[#161618] border border-white/10 space-y-1">
                        <div className="text-[11px] text-stone-400">ยอดชำระสุทธิ (THB):</div>
                        <div className="text-2xl font-black font-mono text-[#FF5C00]">
                          ฿{cartTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10px] text-stone-400">
                          ร้าน: <strong className="text-white">{settings.name}</strong> • พร้อมเพย์: <strong className="text-white font-mono">{settings.promptPayId || '0821062891'}</strong>
                        </div>
                      </div>

                      <p className="text-stone-400 font-medium text-[11px] leading-relaxed">
                        📱 สามารถเปิดแอปธนาคารใดก็ได้ (K PLUS, SCB Easy, Krungthai NEXT, KMA ฯลฯ) เพื่อสแกนจ่ายเงินได้ทันที
                      </p>
                      <p className="text-[10px] text-stone-500">
                        * เมื่อโอนเงินเสร็จแล้ว สามารถแนบรูปสลิปด้านล่างเพื่อให้ร้านตรวจสอบได้ทันที
                      </p>
                    </div>
                  </div>

                  {/* Real Slip Upload Area */}
                  <div className="pt-2 border-t border-white/10">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleFileInputChange}
                      className="hidden"
                      id="slip-image-file-input"
                    />

                    {slipImage ? (
                      /* Uploaded Slip Preview Card */
                      <div className="p-3.5 rounded-2xl bg-[#161618] border border-emerald-500/40 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          {/* Thumbnail with Zoom Click */}
                          <div
                            onClick={() => setIsViewingSlipFull(true)}
                            className="relative w-14 h-14 rounded-xl overflow-hidden border border-white/10 shrink-0 group cursor-pointer"
                            title="คลิกเพื่อดูรูปสลิปขนาดเต็ม"
                          >
                            <img
                              src={slipImage}
                              alt="Transfer Slip Preview"
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <ZoomIn className="w-4 h-4 text-white" />
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                              <CheckCircle2 className="w-4 h-4 shrink-0" />
                              <span className="truncate">แนบรูปสลิปเรียบร้อยแล้ว</span>
                            </div>
                            <p className="text-[11px] text-stone-400 truncate mt-0.5 font-mono">
                              {slipFileName || 'slip_image.png'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                          <button
                            type="button"
                            onClick={() => setIsViewingSlipFull(true)}
                            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <ZoomIn className="w-3.5 h-3.5" />
                            <span>ดูรูปสลิป</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveSlip}
                            className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>เปลี่ยนรูป</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Drag & Drop Upload Zone */
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDraggingOver(true);
                        }}
                        onDragLeave={() => setIsDraggingOver(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`p-4 sm:p-5 rounded-2xl border-2 border-dashed text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
                          isDraggingOver
                            ? 'border-[#FF5C00] bg-[#FF5C00]/10'
                            : 'border-white/15 bg-[#161618] hover:border-[#FF5C00]/50 hover:bg-[#1c1c20]'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-[#FF5C00] shadow-sm">
                          <Camera className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs sm:text-sm font-bold text-white flex items-center justify-center gap-1.5">
                            <Upload className="w-3.5 h-3.5 text-[#FF5C00]" />
                            <span>คลิกเพื่อแนบรูปสลิป / ถ่ายภาพสลิปโอนเงิน</span>
                          </p>
                          <p className="text-[11px] text-stone-400">
                            รองรับไฟล์ JPG, PNG หรือลากไฟล์มาวาง / กด Paste (Ctrl+V) ได้เลย
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {paymentMethod === 'credit_card' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-2xl bg-[#0A0A0B] border border-white/10 space-y-3"
                >
                  <div className="flex items-center justify-between text-xs text-stone-400">
                    <span>การชำระด้วยบัตรเครดิต / เดบิต</span>
                    <span className="text-[10px] font-mono text-[#FF5C00]">256-bit SSL Encrypted</span>
                  </div>
                  <input
                    type="text"
                    defaultValue="4532 •••• •••• 8892"
                    disabled
                    className="w-full px-3.5 py-2 rounded-xl bg-[#161618] border border-white/10 text-xs font-mono text-white"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      defaultValue="08/28"
                      disabled
                      className="w-full px-3 py-2 rounded-xl bg-[#161618] border border-white/10 text-xs font-mono text-white"
                    />
                    <input
                      type="text"
                      defaultValue="•••"
                      disabled
                      className="w-full px-3 py-2 rounded-xl bg-[#161618] border border-white/10 text-xs font-mono text-white"
                    />
                  </div>
                </motion.div>
              )}
            </div>

            {/* Order Final Summary */}
            <div className="p-4 rounded-2xl bg-[#0A0A0B] border border-white/10 space-y-2 text-xs">
              <div className="flex justify-between text-stone-400">
                <span>ยอดรวมอาหาร</span>
                <span className="font-mono font-bold text-white">฿{cartSubtotal.toLocaleString()}</span>
              </div>
              {cartDiscount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>ส่วนลด</span>
                  <span className="font-mono font-bold">-฿{cartDiscount.toLocaleString()}</span>
                </div>
              )}
              {cartServiceCharge > 0 && (
                <div className="flex justify-between text-stone-400">
                  <span>Service Charge (10%)</span>
                  <span className="font-mono font-bold text-white">฿{cartServiceCharge.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-white/10 font-bold text-white">
                <span className="text-sm font-black uppercase">ยอดชำระทั้งหมด</span>
                <span className="text-xl font-black font-mono text-[#FF5C00]">
                  ฿{cartTotal.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Sticky Action Footer */}
          <div className="p-4 sm:p-5 md:p-6 bg-[#0A0A0B] border-t border-white/10 flex items-center justify-between gap-3">
            <button
              disabled={isProcessing}
              onClick={() => setIsCheckoutModalOpen(false)}
              className="px-4 sm:px-5 py-3.5 rounded-2xl bg-[#161618] hover:bg-[#202024] border border-white/10 text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
            >
              ย้อนกลับ
            </button>

            {storeStatus.isOpen ? (
              <motion.button
                id="btn-confirm-place-order"
                whileHover={{ scale: isProcessing ? 1 : 1.02 }}
                whileTap={{ scale: isProcessing ? 1 : 0.98 }}
                disabled={isProcessing}
                onClick={handleConfirmOrder}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 sm:px-6 rounded-2xl bg-[#FF5C00] hover:bg-[#FF7729] text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-xl shadow-[#FF5C00]/25 transition-all cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>กำลังส่งออเดอร์เข้าครัว...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span className="truncate">ยืนยันการสั่งอาหาร (฿{cartTotal.toLocaleString()})</span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </div>
                )}
              </motion.button>
            ) : (
              <button
                id="btn-confirm-place-order"
                disabled
                className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 sm:px-6 rounded-2xl bg-stone-900 border border-rose-500/20 text-rose-400 font-bold text-xs uppercase tracking-wider cursor-not-allowed opacity-80"
              >
                <span>ร้านปิดทำการชั่วคราว (ไม่สามารถส่งออเดอร์ได้)</span>
              </button>
            )}
          </div>
        </motion.div>

        {/* Full Image Lightbox Modal for Slip Inspection */}
        <AnimatePresence>
          {isViewingSlipFull && slipImage && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative max-w-lg w-full bg-[#111112] rounded-3xl border border-white/15 p-4 shadow-2xl space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-[#FF5C00]" />
                    <span>รูปสลิปการโอนเงิน</span>
                  </h4>
                  <button
                    onClick={() => setIsViewingSlipFull(false)}
                    className="p-1.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="rounded-2xl overflow-hidden bg-black max-h-[70vh] flex items-center justify-center border border-white/10">
                  <img
                    src={slipImage}
                    alt="Full Slip"
                    className="max-h-[65vh] w-auto object-contain"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsViewingSlipFull(false)}
                    className="px-4 py-2 rounded-xl bg-[#FF5C00] text-white text-xs font-bold cursor-pointer"
                  >
                    ปิดหน้าต่าง
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );
};
