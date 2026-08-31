import React, { useState } from 'react';
import {
  Store,
  Clock,
  QrCode,
  DollarSign,
  MapPin,
  Phone,
  Save,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Plus,
  Trash2,
  Sparkles,
  ExternalLink,
  Copy,
  Printer,
  Download,
  Info,
  Power,
  ShieldAlert,
  Sliders,
  Image as ImageIcon,
  Database,
  Radio,
  RefreshCw,
  UploadCloud,
  DownloadCloud,
  MessageSquare,
  Send,
  Bell,
  Key,
  Eye,
  EyeOff,
  Smartphone,
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { SpecialHoliday } from '../../types';
import { QrCodeCard } from '../common/QrCodeCard';
import {
  THAI_DAY_NAMES,
  THAI_DAY_SHORT_NAMES,
  formatDateISO,
} from '../../utils/storeHours';
import { buildStorefrontOrderUrl, buildTableOrderUrl } from '../../utils/qrCode';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    storeStatus,
    toggleWeeklyClosedDay,
    addSpecialHoliday,
    removeSpecialHoliday,
    setStoreManualOpen,
    tables,
    scanTable,
    setIsAdminMode,
    setIsHeroCustomizerOpen,
    realtimeStatus,
    realtimeDetail,
    setIsDatabaseModalOpen,
    pushAllToCloud,
    pullAllFromCloud,
    sendLineTestNotification,
    showToast,
  } = useRestaurant();

  const [formData, setFormData] = useState({ ...settings });
  const [newHolidayDate, setNewHolidayDate] = useState<string>(formatDateISO(new Date()));
  const [newHolidayTitle, setNewHolidayTitle] = useState<string>('');
  const [newHolidayNote, setNewHolidayNote] = useState<string>('');
  const [selectedQrTab, setSelectedQrTab] = useState<'store' | 'table'>('store');
  const [selectedTableForQr, setSelectedTableForQr] = useState<string>(tables[0]?.number || 'T-01');
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [isTestingLine, setIsTestingLine] = useState(false);
  const [lineTestResult, setLineTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showLineToken, setShowLineToken] = useState(false);

  const handleTestLine = async () => {
    setIsTestingLine(true);
    setLineTestResult(null);
    const res = await sendLineTestNotification(formData.lineChannelAccessToken, formData.lineTargetId);
    setIsTestingLine(false);
    setLineTestResult({
      success: res.success,
      message: res.message,
    });
    if (res.success) {
      showToast('ส่งการแจ้งเตือนเข้า LINE สำเร็จ! 🔔', 'success');
    } else {
      showToast(`ส่งไม่สำเร็จ: ${res.message}`, 'warning');
    }
  };

  const handlePushAll = async () => {
    setIsPushing(true);
    const res = await pushAllToCloud();
    setIsPushing(false);
    if (res.success) {
      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'warning');
    }
  };

  const handlePullAll = async () => {
    setIsPulling(true);
    const res = await pullAllFromCloud();
    setIsPulling(false);
    if (res.success) {
      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'warning');
    }
  };

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
  };

  const handleAddHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolidayDate || !newHolidayTitle.trim()) {
      showToast('กรุณาระบุวันที่และชื่อวันหยุดพิเศษ', 'warning');
      return;
    }
    addSpecialHoliday({
      date: newHolidayDate,
      title: newHolidayTitle.trim(),
      note: newHolidayNote.trim() || undefined,
    });
    setNewHolidayTitle('');
    setNewHolidayNote('');
  };

  const currentTableObj = tables.find((t) => t.number === selectedTableForQr);

  return (
    <div id="admin-settings-view" className="space-y-8 pb-16">
      
      {/* Top Header Banner */}
      <div className="bg-[#111112] p-6 sm:p-8 rounded-3xl border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF5C00]/15 border border-[#FF5C00]/30 text-[#FF5C00] text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Store Configuration & QR Hub</span>
          </div>
          <h3 className="font-display font-black text-2xl text-white tracking-tight">
            ตั้งค่าเวลาเปิด-ปิดร้าน, วันหยุด & สร้าง QR Code
          </h3>
          <p className="text-xs sm:text-sm text-stone-400 font-medium max-w-2xl">
            ควบคุมเวลาทำการ วันหยุดประจำสัปดาห์ วันหยุดเทศกาล และดาวน์โหลด QR Code สำหรับให้ลูกค้าสแกนสั่งอาหาร
          </p>
        </div>

        {/* Master Live Store Status Pill */}
        <div className="flex flex-col items-start md:items-end gap-2 bg-[#161618] p-4 rounded-2xl border border-white/10 w-full md:w-auto">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
            สถานะร้านค้าขณะนี้ (Real-Time Status):
          </span>
          <div className="flex items-center gap-2.5">
            <span
              className={`w-3.5 h-3.5 rounded-full ${
                storeStatus.isOpen
                  ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse'
                  : 'bg-rose-500 shadow-lg shadow-rose-500/50'
              }`}
            />
            <strong
              className={`text-base font-black ${
                storeStatus.isOpen ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {storeStatus.statusText}
            </strong>
          </div>
          <span className="text-xs text-stone-300 font-medium">
            {storeStatus.statusDetail}
          </span>
        </div>
      </div>

      {/* Master Real-time & Supabase Cloud Sync Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#161618] to-[#101012] border border-[#FF5C00]/30 shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FF5C00]/20 border border-[#FF5C00]/40 flex items-center justify-center text-[#FF5C00]">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-display font-black text-lg text-white uppercase tracking-wider">
                  Supabase Cloud Database & Real-time Sync
                </h4>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                  realtimeStatus === 'connected'
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
                    : realtimeStatus === 'connecting'
                    ? 'bg-amber-950/60 border-amber-500/40 text-amber-400'
                    : 'bg-stone-800 border-white/10 text-stone-300'
                }`}>
                  {realtimeStatus === 'connected' ? '⚡ LIVE REALTIME' : realtimeStatus === 'connecting' ? 'CONNECTING...' : 'CONFIG REQUIRED'}
                </span>
              </div>
              <p className="text-xs text-stone-400 font-medium">
                เชื่อมต่อฐานข้อมูล Supabase เพื่อให้ทุกเครื่อง (ลูกค้า/แคชเชียร์/ครัว/ผู้จัดการ) อัปเดตข้อมูลตรงกันสดๆ ทันที ไม่ต้องรีเฟรชหน้าเว็บ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsDatabaseModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#FF5C00] hover:bg-[#FF7729] text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-[#FF5C00]/25 transition-all cursor-pointer whitespace-nowrap"
          >
            <Database className="w-4 h-4" />
            <span>ตั้งค่า Supabase / รัน SQL</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Realtime Status Indicator */}
          <div className="bg-[#0A0A0B] p-4 rounded-2xl border border-white/10 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] text-stone-400 font-bold uppercase tracking-wider">สถานะการเชื่อมต่อสด</span>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  realtimeStatus === 'connected'
                    ? 'bg-emerald-400 animate-pulse'
                    : realtimeStatus === 'connecting'
                    ? 'bg-amber-400 animate-ping'
                    : 'bg-stone-500'
                }`} />
                <span className="text-sm font-bold text-white font-mono">
                  {realtimeStatus === 'connected' ? 'เชื่อมต่อสมบูรณ์ (Connected)' : realtimeStatus === 'connecting' ? 'กำลังเชื่อมต่อ...' : 'ยังไม่ได้เชื่อมต่อ'}
                </span>
              </div>
            </div>
          </div>

          {/* 1-Click Push Button */}
          <button
            type="button"
            onClick={handlePushAll}
            disabled={isPushing}
            className="bg-[#0A0A0B] hover:bg-[#161618] p-4 rounded-2xl border border-white/10 hover:border-[#FF5C00]/40 text-left transition-all cursor-pointer disabled:opacity-50"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#FF5C00] font-bold uppercase tracking-wider">อัปโหลดขึ้นคลาวด์</span>
              <UploadCloud className="w-4 h-4 text-[#FF5C00]" />
            </div>
            <div className="text-sm font-bold text-white mt-1">
              {isPushing ? 'กำลังส่งข้อมูล...' : 'ส่งข้อมูลทั้งหมดขึ้น Supabase 📤'}
            </div>
            <p className="text-[10px] text-stone-400 mt-0.5">บันทึกเมนู, โต๊ะ, ออเดอร์, การตั้งค่า</p>
          </button>

          {/* 1-Click Pull Button */}
          <button
            type="button"
            onClick={handlePullAll}
            disabled={isPulling}
            className="bg-[#0A0A0B] hover:bg-[#161618] p-4 rounded-2xl border border-white/10 hover:border-emerald-500/40 text-left transition-all cursor-pointer disabled:opacity-50"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider">ดึงข้อมูลจากคลาวด์</span>
              <DownloadCloud className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-sm font-bold text-white mt-1">
              {isPulling ? 'กำลังดึงข้อมูล...' : 'ดึงข้อมูลสดจาก Supabase 📥'}
            </div>
            <p className="text-[10px] text-stone-400 mt-0.5">ซิงค์ข้อมูลล่าสุดจากเครื่องอื่นลงเครื่องนี้</p>
          </button>
        </div>
      </div>

      {/* SECTION 1: Operating Hours & Holiday Management (Core Feature) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#111112] border border-white/10 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FF5C00]/20 border border-[#FF5C00]/40 flex items-center justify-center text-[#FF5C00]">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-display font-black text-lg text-white uppercase tracking-wider">
                1. จัดการเวลาเปิด-ปิดร้าน & วันหยุด (Store Hours & Holidays)
              </h4>
              <p className="text-xs text-stone-400 font-medium">
                กำหนดเวลาทำการรายวัน วันหยุดประจำสัปดาห์ และวันหยุดนักขัตฤกษ์
              </p>
            </div>
          </div>

          {/* Quick Manual Override Switch */}
          <div className="flex items-center gap-3 bg-[#161618] px-4 py-2 rounded-2xl border border-white/10">
            <span className="text-xs font-bold text-stone-300">สวิตช์เปิด-ปิดฉุกเฉิน:</span>
            <button
              type="button"
              id="btn-toggle-manual-open"
              onClick={() => setStoreManualOpen(!settings.isOpen)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                settings.isOpen
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950'
                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-950'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{settings.isOpen ? 'เปิดร้านอยู่' : 'ปิดร้านชั่วคราว'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Hours & Auto-Schedule */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Auto Schedule Checkbox */}
            <div className="p-4 rounded-2xl bg-[#161618] border border-white/10 space-y-2">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.autoScheduleEnabled}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setFormData({ ...formData, autoScheduleEnabled: val });
                    updateSettings({ autoScheduleEnabled: val });
                  }}
                  className="w-5 h-5 rounded text-[#FF5C00] bg-[#0A0A0B] border-white/20 focus:ring-[#FF5C00]"
                />
                <div>
                  <span className="text-sm font-black text-white block">
                    เปิดระบบตรวจจับเวลาเปิด-ปิด & วันหยุดอัตโนมัติ (Auto-Schedule)
                  </span>
                  <span className="text-xs text-stone-400 font-medium block">
                    ระบบจะเปิดรับออเดอร์เฉพาะในช่วงเวลาทำการ และปิดอัตโนมัติเมื่อถึงเวลาปิดหรือเป็นวันหยุด
                  </span>
                </div>
              </label>
            </div>

            {/* Open / Close Time Inputs */}
            <div className="p-5 rounded-2xl bg-[#161618] border border-white/10 space-y-4">
              <h5 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#FF5C00]" />
                <span>เวลาเปิด-ปิดทำการประจำวัน</span>
              </h5>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-caps block mb-1.5 text-stone-300">
                    เวลาเปิดร้าน (Open Time)
                  </label>
                  <input
                    type="time"
                    id="input-open-time"
                    value={formData.openTime}
                    onChange={(e) => {
                      setFormData({ ...formData, openTime: e.target.value });
                      updateSettings({ openTime: e.target.value });
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-[#0A0A0B] border border-white/10 text-base font-mono text-white focus:outline-none focus:border-[#FF5C00] font-black shadow-inner"
                  />
                </div>

                <div>
                  <label className="label-caps block mb-1.5 text-stone-300">
                    เวลาปิดร้าน (Close Time)
                  </label>
                  <input
                    type="time"
                    id="input-close-time"
                    value={formData.closeTime}
                    onChange={(e) => {
                      setFormData({ ...formData, closeTime: e.target.value });
                      updateSettings({ closeTime: e.target.value });
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-[#0A0A0B] border border-white/10 text-base font-mono text-white focus:outline-none focus:border-[#FF5C00] font-black shadow-inner"
                  />
                </div>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] text-stone-400 font-bold">ปุ่มลัดเวลา:</span>
                {[
                  { label: '10:30 - 22:00', open: '10:30', close: '22:00' },
                  { label: '11:00 - 23:00', open: '11:00', close: '23:00' },
                  { label: '09:00 - 21:00', open: '09:00', close: '21:00' },
                  { label: '17:00 - 02:00 (ดึก)', open: '17:00', close: '02:00' },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, openTime: preset.open, closeTime: preset.close });
                      updateSettings({ openTime: preset.open, closeTime: preset.close });
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#202024] hover:bg-[#2a2a30] text-stone-300 hover:text-white text-[11px] font-mono font-bold transition-all border border-white/5 cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Weekly Closed Days (วันหยุดประจำสัปดาห์) */}
            <div className="p-5 rounded-2xl bg-[#161618] border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#FF5C00]" />
                  <span>วันหยุดประจำสัปดาห์ (Weekly Closed Days)</span>
                </h5>
                <span className="text-[10px] text-stone-400 font-medium">คลิกเพื่อเลือกวันหยุด</span>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {THAI_DAY_NAMES.map((dayName, idx) => {
                  const isClosed = settings.weeklyClosedDays?.includes(idx);
                  return (
                    <button
                      key={dayName}
                      type="button"
                      id={`btn-weekly-day-${idx}`}
                      onClick={() => toggleWeeklyClosedDay(idx)}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all cursor-pointer ${
                        isClosed
                          ? 'bg-rose-950/60 border-rose-500/60 text-rose-300 shadow-md shadow-rose-950'
                          : 'bg-[#0A0A0B] border-white/10 text-stone-300 hover:text-white hover:border-white/30'
                      }`}
                      title={isClosed ? `${dayName} เป็นวันหยุดร้าน` : `${dayName} เปิดทำการปกติ`}
                    >
                      <span className="text-[11px] font-black">{THAI_DAY_SHORT_NAMES[idx]}</span>
                      <span className="text-[9px] uppercase tracking-tighter mt-0.5 font-bold">
                        {isClosed ? '🔴 หยุด' : '🟢 เปิด'}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="text-[11px] text-stone-400">
                {settings.weeklyClosedDays && settings.weeklyClosedDays.length > 0 ? (
                  <p>
                    📌 ร้านหยุดประจำทุก: {' '}
                    <strong className="text-rose-400">
                      {settings.weeklyClosedDays.map((d) => THAI_DAY_NAMES[d]).join(', ')}
                    </strong>
                  </p>
                ) : (
                  <p className="text-emerald-400">✨ เปิดบริการทุกวัน ไม่มีวันหยุดประจำสัปดาห์</p>
                )}
              </div>
            </div>

            {/* Custom Closed Notice Message */}
            <div className="p-5 rounded-2xl bg-[#161618] border border-white/10 space-y-2">
              <label className="label-caps block text-stone-300">
                ข้อความประกาศเตือนลูกค้าเมื่อร้านปิด (Closed Notice Message)
              </label>
              <textarea
                rows={2}
                value={formData.closedMessage || ''}
                onChange={(e) => {
                  setFormData({ ...formData, closedMessage: e.target.value });
                  updateSettings({ closedMessage: e.target.value });
                }}
                placeholder="เช่น ขณะนี้ร้านอยู่นอกเวลาทำการ หรือเป็นวันหยุดประจำร้าน ขออภัยในความไม่สะดวกครับ"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0B] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF5C00] resize-none font-medium"
              />
            </div>
          </div>

          {/* Right Column: Special Holidays & Vacation Dates */}
          <div className="lg:col-span-6 space-y-6">
            <div className="p-5 rounded-2xl bg-[#161618] border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-[#FF5C00]" />
                  <span>วันหยุดพิเศษ & ปิดปรับปรุงร้าน (Special Holidays)</span>
                </h5>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FF5C00]/20 text-[#FF5C00] font-mono font-bold">
                  {settings.specialHolidays?.length || 0} วัน
                </span>
              </div>

              {/* Form to Add New Holiday */}
              <form onSubmit={handleAddHoliday} className="p-4 rounded-xl bg-[#0A0A0B] border border-white/10 space-y-3">
                <div className="text-xs font-black text-stone-200">➕ เพิ่มวันหยุดพิเศษใหม่</div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label-caps block mb-1 text-stone-400">เลือกวันที่หยุด</label>
                    <input
                      type="date"
                      value={newHolidayDate}
                      onChange={(e) => setNewHolidayDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#161618] border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-[#FF5C00] font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="label-caps block mb-1 text-stone-400">ชื่อวันหยุด / เทศกาล</label>
                    <input
                      type="text"
                      placeholder="เช่น วันหยุดสงกรานต์"
                      value={newHolidayTitle}
                      onChange={(e) => setNewHolidayTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#161618] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF5C00] font-bold"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="label-caps block mb-1 text-stone-400">หมายเหตุเพิ่มเติม (Optional)</label>
                  <input
                    type="text"
                    placeholder="เช่น ปิดบริการ 1 วัน เพื่อทำความสะอาด Big Cleaning"
                    value={newHolidayNote}
                    onChange={(e) => setNewHolidayNote(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#161618] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF5C00]"
                  />
                </div>

                <button
                  type="submit"
                  id="btn-add-holiday-submit"
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#FF5C00] hover:bg-[#FF7729] text-white font-black text-xs uppercase tracking-wider shadow-md shadow-[#FF5C00]/25 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>บันทึกวันหยุดพิเศษนี้</span>
                </button>
              </form>

              {/* List of Configured Holidays */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {settings.specialHolidays && settings.specialHolidays.length > 0 ? (
                  settings.specialHolidays.map((hol) => (
                    <div
                      key={hol.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#0A0A0B] border border-white/10 hover:border-white/20 transition-all"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono text-[11px] font-black border border-rose-500/30">
                            {hol.date}
                          </span>
                          <strong className="text-xs text-white font-bold">{hol.title}</strong>
                        </div>
                        {hol.note && (
                          <p className="text-[11px] text-stone-400 font-medium">{hol.note}</p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => removeSpecialHoliday(hol.id)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="ลบวันหยุดนี้"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="p-6 rounded-xl bg-[#0A0A0B] border border-dashed border-white/10 text-center text-xs text-stone-500 font-medium">
                    ยังไม่มีวันหยุดพิเศษที่กำหนดไว้
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: QR Code Hub & Generator (Core Feature) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#111112] border border-white/10 shadow-2xl space-y-6">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-[#FF5C00]/20 border border-[#FF5C00]/40 flex items-center justify-center text-[#FF5C00]">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-display font-black text-lg text-white uppercase tracking-wider">
              2. สร้าง & พิมพ์ QR Code สั่งอาหาร (QR Code Ordering Hub)
            </h4>
            <p className="text-xs text-stone-400 font-medium">
              สร้าง QR Code หน้าร้าน หรือ QR Code ประจำแต่ละโต๊ะ สำหรับให้ลูกค้าสแกนเพื่อเปิดเมนูสั่งอาหารทันที
            </p>
          </div>
        </div>

        {/* Mode Selector: Storefront QR vs Table QR */}
        <div className="flex items-center gap-3 border-b border-white/10 pb-3">
          <button
            type="button"
            onClick={() => setSelectedQrTab('store')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              selectedQrTab === 'store'
                ? 'bg-[#FF5C00] text-white shadow-md'
                : 'bg-[#161618] text-stone-400 hover:text-white border border-white/10'
            }`}
          >
            🏪 QR Code สั่งอาหารหน้าร้าน & ออนไลน์ (Storefront QR)
          </button>

          <button
            type="button"
            onClick={() => setSelectedQrTab('table')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              selectedQrTab === 'table'
                ? 'bg-[#FF5C00] text-white shadow-md'
                : 'bg-[#161618] text-stone-400 hover:text-white border border-white/10'
            }`}
          >
            🪑 QR Code ประจำโต๊ะ (Table Tent Cards)
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Information & Table Selector */}
          <div className="lg:col-span-7 space-y-4">
            {selectedQrTab === 'store' ? (
              <div className="p-6 rounded-2xl bg-[#161618] border border-white/10 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-black">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>General Customer Menu URL</span>
                </div>

                <h5 className="text-base font-black text-white">
                  QR Code เมนูสั่งอาหารส่วนกลาง (สำหรับตั้งหน้าร้าน, โซเชียล, หรือใบปลิว)
                </h5>

                <p className="text-xs text-stone-300 leading-relaxed font-medium">
                  เมื่อลูกค้าใช้สมาร์ตโฟน (iPhone, Android) สแกน QR Code นี้ ระบบจะเปิดหน้าแรกของร้าน{' '}
                  <strong className="text-[#FF5C00]">"{settings.name}"</strong> ทันที โดยลูกค้าสามารถเลือกได้ว่าจะสั่งทานที่ร้าน หรือรับกลับบ้าน
                </p>

                <div className="p-3.5 rounded-xl bg-[#0A0A0B] border border-white/10 space-y-1">
                  <span className="label-caps text-stone-400">Direct Menu Link:</span>
                  <div className="text-xs font-mono text-[#FF5C00] font-bold break-all">
                    {buildStorefrontOrderUrl()}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-[#161618] border border-white/10 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-500/30 text-amber-400 text-xs font-black">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Table Specific Direct QR</span>
                </div>

                <h5 className="text-base font-black text-white">
                  เลือกโต๊ะอาหารเพื่อสร้างป้าย QR Code ประจำโต๊ะ
                </h5>

                <p className="text-xs text-stone-300 leading-relaxed font-medium">
                  เมื่อลูกค้าสแกน QR Code ประจำโต๊ะนี้ ระบบจะระบุหมายเลขโต๊ะอัตโนมัติทันที ลูกค้าสามารถสั่งอาหารเข้าสู่ครัว KDS ได้ทันทีโดยไม่ต้องระบุหมายเลขโต๊ะเอง
                </p>

                {/* Table Picker Grid */}
                <div className="space-y-2">
                  <label className="label-caps block text-stone-400">
                    เลือกหมายเลขโต๊ะ:
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {tables.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedTableForQr(t.number)}
                        className={`py-2 px-1 rounded-xl text-xs font-mono font-black border transition-all cursor-pointer ${
                          selectedTableForQr === t.number
                            ? 'bg-[#FF5C00] border-[#FF5C00] text-white shadow-md'
                            : 'bg-[#0A0A0B] border-white/10 text-stone-300 hover:text-white'
                        }`}
                      >
                        {t.number}
                      </button>
                    ))}
                  </div>
                </div>

                {currentTableObj && (
                  <div className="p-3.5 rounded-xl bg-[#0A0A0B] border border-white/10 space-y-1">
                    <span className="label-caps text-stone-400">Table Direct Order Link:</span>
                    <div className="text-xs font-mono text-emerald-400 font-bold break-all">
                      {buildTableOrderUrl(currentTableObj.number)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Interactive Live QR Generator Card */}
          <div className="lg:col-span-5 flex justify-center">
            {selectedQrTab === 'store' ? (
              <QrCodeCard
                url={buildStorefrontOrderUrl()}
                title={settings.name}
                subtitle="สแกนเพื่อเปิดดูเมนู & สั่งอาหารออนไลน์"
                showSimulateButton={true}
                onSimulateScan={() => {
                  setIsAdminMode(false);
                  showToast('เปิดหน้าเมนูสั่งอาหารของลูกค้าแล้ว', 'success');
                }}
              />
            ) : (
              <QrCodeCard
                url={buildTableOrderUrl(selectedTableForQr)}
                title={`โต๊ะ ${selectedTableForQr}`}
                tableNumber={selectedTableForQr}
                zone={currentTableObj?.zone}
                showSimulateButton={true}
                onSimulateScan={() => {
                  scanTable(selectedTableForQr);
                  setIsAdminMode(false);
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* SECTION 3: Menu Header & Storefront Customizer */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#111112] border border-white/10 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FF5C00]/20 border border-[#FF5C00]/40 flex items-center justify-center text-[#FF5C00]">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-display font-black text-lg text-white uppercase tracking-wider">
                3. ปรับแต่งหน้าเมนูอาหาร & แบนเนอร์หัวเว็บ (Menu Page Customizer)
              </h4>
              <p className="text-xs text-stone-400 font-medium">
                ปรับเปลี่ยนข้อความพาดหัว, ภาพเมนูซิกเนเจอร์, สโลแกน, และโปรโมชั่นที่แสดงบนหน้าร้านค้า
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-open-menu-customizer"
            onClick={() => setIsHeroCustomizerOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#FF5C00] hover:bg-[#FF7729] text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-[#FF5C00]/25 transition-all cursor-pointer hover:scale-102"
          >
            <Sliders className="w-4 h-4" />
            <span>เปิดหน้าต่างปรับแต่งเมนู</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-[#161618] border border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-[#FF5C00] text-xs font-bold">
              <Sparkles className="w-4 h-4" />
              <span>ข้อความพาดหัว & สโลแกน</span>
            </div>
            <p className="text-stone-300 text-xs font-bold line-clamp-1">
              {settings.heroBanner?.titleLine1 || 'CRAFTED FLAVORS.'} {settings.heroBanner?.titleLine2 || 'UNCOMPROMISED TASTE.'}
            </p>
            <p className="text-[11px] text-stone-400 line-clamp-2">
              {settings.heroBanner?.subtitle || 'คัดสรรเนื้อวากิวออสเตรเลีย พาสต้าทรัฟเฟิลเส้นสด...'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#161618] border border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
              <ImageIcon className="w-4 h-4" />
              <span>การ์ดเมนูไฮไลท์ & รูปภาพ</span>
            </div>
            <p className="text-stone-300 text-xs font-bold line-clamp-1">
              {settings.heroBanner?.cardTitle || 'เนื้อวากิวออสเตรเลีย & ทรัฟเฟิลสด'}
            </p>
            <p className="text-[11px] text-stone-400 font-mono">
              {settings.heroBanner?.cardSubtitle || 'เริ่มต้นเพียง ฿340'} • ★ {settings.heroBanner?.cardRating || '4.9'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#161618] border border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>ปุ่มเมนูพิเศษ & โปรโมชั่น</span>
            </div>
            <p className="text-stone-300 text-xs font-medium">
              ปุ่มเมนูพิเศษ: {settings.heroBanner?.showCustomDishButton !== false ? '✅ เปิดใช้งาน' : '❌ ปิด'}
            </p>
            <p className="text-[11px] text-stone-400">
              โค้ดส่วนลดด่วน: {settings.heroBanner?.promoCode1 || 'AROI10'}, {settings.heroBanner?.promoCode2 || 'WELCOME50'}
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 4: General Store Details & Billing Settings */}
      <form onSubmit={handleSaveAll} className="p-6 sm:p-8 rounded-3xl bg-[#111112] border border-white/10 shadow-2xl space-y-6">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-[#FF5C00]/20 border border-[#FF5C00]/40 flex items-center justify-center text-[#FF5C00]">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-display font-black text-lg text-white uppercase tracking-wider">
              4. ข้อมูลร้านค้า & บัญชีรับเงิน (Store Profile & Payments)
            </h4>
            <p className="text-xs text-stone-400 font-medium">
              ข้อมูลเบอร์โทร ที่อยู่ บัญชีพร้อมเพย์ และอัตราภาษี/เซอร์วิสชาร์จ
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* General info */}
          <div className="space-y-4">
            <div>
              <label className="label-caps block mb-1">ชื่อร้าน (ภาษาไทย)</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0B] border border-white/10 text-sm text-white focus:outline-none focus:border-[#FF5C00] font-bold"
              />
            </div>

            <div>
              <label className="label-caps block mb-1">ชื่อร้านภาษาอังกฤษ (English Name)</label>
              <input
                type="text"
                value={formData.nameEn}
                onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0B] border border-white/10 text-sm text-white focus:outline-none focus:border-[#FF5C00] font-bold"
              />
            </div>

            <div>
              <label className="label-caps block mb-1">สโลแกนร้าน (Tagline)</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0B] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF5C00] font-medium"
              />
            </div>

            <div>
              <label className="label-caps block mb-1">ที่อยู่ร้าน</label>
              <textarea
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0B] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF5C00] resize-none font-medium"
              />
            </div>

            <div>
              <label className="label-caps block mb-1">เบอร์โทรศัพท์ติดต่อ</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0B] border border-white/10 text-sm font-mono text-white focus:outline-none focus:border-[#FF5C00] font-bold"
              />
            </div>

            <div>
              <label className="label-caps block mb-1">
                รหัสผ่าน PIN สำหรับเข้าหลังบ้านแอดมิน (Admin Security PIN)
              </label>
              <input
                type="text"
                value={formData.adminPin || '1234'}
                onChange={(e) => setFormData({ ...formData, adminPin: e.target.value.replace(/\D/g, '').slice(0, 8) })}
                placeholder="เช่น 1234"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0B] border border-white/10 text-sm font-mono text-amber-400 focus:outline-none focus:border-[#FF5C00] font-black tracking-widest"
              />
              <span className="text-[10px] text-stone-500 mt-1 block">
                🔒 ป้องกันไม่ให้ลูกค้าทั่วไปเข้าสู่ระบบจัดการหลังบ้านได้ (ค่าเริ่มต้น: 1234)
              </span>
            </div>
          </div>

          {/* Payment & Charges */}
          <div className="space-y-4">
            <div>
              <label className="label-caps block mb-1">เบอร์พร้อมเพย์รับเงิน (PromptPay ID)</label>
              <input
                type="text"
                value={formData.promptPayId}
                onChange={(e) => setFormData({ ...formData, promptPayId: e.target.value })}
                placeholder="088-888-9999 หรือ เลขบัตรประชาชน"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0B] border border-white/10 text-sm font-mono text-white focus:outline-none focus:border-[#FF5C00] font-bold"
              />
            </div>

            <div className="pt-3 border-t border-white/10 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enableServiceCharge}
                  onChange={(e) => setFormData({ ...formData, enableServiceCharge: e.target.checked })}
                  className="w-5 h-5 rounded text-[#FF5C00] bg-[#0A0A0B] border-white/20 focus:ring-[#FF5C00]"
                />
                <div>
                  <span className="text-xs font-black text-white uppercase tracking-wider block">
                    เปิดใช้งาน Service Charge (10% สำหรับทานที่ร้าน)
                  </span>
                  <span className="text-[11px] text-stone-400 font-medium">
                    คำนวณอัตโนมัติเฉพาะออเดอร์ Dine-in
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* SECTION 5: LINE Official Notification & Flex Message Hub */}
        <div className="mt-8 pt-8 border-t border-white/10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#06C755]/20 border border-[#06C755]/40 flex items-center justify-center text-[#06C755]">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-display font-black text-lg text-white uppercase tracking-wider">
                    5. ระบบแจ้งเตือนออเดอร์เข้า LINE (LINE Messaging API)
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-[#06C755]/20 border border-[#06C755]/40 text-[#06C755] text-[10px] font-black tracking-wider uppercase">
                    Flex Message สวยงาม
                  </span>
                </div>
                <p className="text-xs text-stone-400 font-medium">
                  แจ้งเตือนเข้าห้องแชท LINE ทันทีเมื่อมีออเดอร์ใหม่ หรือลูกค้าสั่งอาหารเพิ่มเข้าบิลเดิม
                </p>
              </div>
            </div>

            {/* Toggle Enable Switch */}
            <label className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-[#0A0A0B] border border-white/10 cursor-pointer hover:border-[#06C755]/50 transition-colors">
              <input
                type="checkbox"
                checked={formData.lineNotifyEnabled ?? true}
                onChange={(e) => setFormData({ ...formData, lineNotifyEnabled: e.target.checked })}
                className="w-5 h-5 rounded text-[#06C755] bg-[#161618] border-white/20 focus:ring-[#06C755]"
              />
              <span className="text-xs font-bold text-white">
                {formData.lineNotifyEnabled ? 'เปิดใช้งาน LINE Notify' : 'ปิดใช้งานชั่วคราว'}
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form Settings */}
            <div className="lg:col-span-7 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="label-caps flex items-center gap-1.5 text-stone-300">
                    <Key className="w-3.5 h-3.5 text-[#06C755]" />
                    <span>Channel Access Token (Long-Lived)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowLineToken(!showLineToken)}
                    className="text-[11px] text-stone-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    {showLineToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showLineToken ? 'ซ่อน Token' : 'แสดง Token'}</span>
                  </button>
                </div>
                <div className="relative">
                  <textarea
                    rows={3}
                    value={formData.lineChannelAccessToken || ''}
                    onChange={(e) => setFormData({ ...formData, lineChannelAccessToken: e.target.value })}
                    placeholder="ใส่ LINE Messaging API Channel Access Token..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0B] border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-[#06C755] resize-none"
                    style={{ WebkitTextSecurity: showLineToken ? 'none' : 'disc' } as any}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-stone-500 mt-1">
                  <span>✅ มีการตั้งค่า Token เริ่มต้นพร้อมใช้งานแล้ว</span>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        lineChannelAccessToken:
                          'XSOp1dJdNKEw9HGD7fRlN4VJX5fWYmS/EYXqWMMq5pHMtWXOizNLp5FEaNyDbmoalfFkqPBxbn/y9cEWse3hl5OEyUUkKZf9Ej/y2DO5+WLhuLDuIvlkx4LT+imCU+Ptl9kklN7nG1FRzPDemE73tgdB04t89/1O/w1cDnyilFU=',
                      })
                    }
                    className="text-[#06C755] hover:underline cursor-pointer"
                  >
                    รีเซ็ตเป็น Token ที่ระบุ
                  </button>
                </div>
              </div>

              <div>
                <label className="label-caps block mb-1.5 text-stone-300">
                  Target User ID / Group ID (ไม่บังคับ)
                </label>
                <input
                  type="text"
                  value={formData.lineTargetId || ''}
                  onChange={(e) => setFormData({ ...formData, lineTargetId: e.target.value })}
                  placeholder="เว้นว่างไว้เพื่อ Broadcast ทุกคน หรือใส่ เช่น U1234abcd..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0B] border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-[#06C755]"
                />
                <p className="text-[11px] text-stone-500 mt-1">
                  💡 หากเว้นว่างไว้ ระบบจะ Broadcast แจ้งเตือนไปยังทุกคนที่เพิ่มเพื่อนบอทไว้
                </p>
              </div>

              {/* Action & Test Send */}
              <div className="p-4 rounded-2xl bg-[#0A0A0B] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#06C755]" />
                    <span className="text-xs font-bold text-white">ทดสอบการส่งการแจ้งเตือน</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleTestLine}
                    disabled={isTestingLine || !formData.lineChannelAccessToken}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#06C755] hover:bg-[#05a847] disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-[#06C755]/20"
                  >
                    {isTestingLine ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>กำลังส่ง...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>ทดสอบส่งเข้า LINE ทันที</span>
                      </>
                    )}
                  </button>
                </div>

                {lineTestResult && (
                  <div
                    className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                      lineTestResult.success
                        ? 'bg-[#06C755]/10 border-[#06C755]/30 text-[#A7F3D0]'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    }`}
                  >
                    {lineTestResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-[#06C755] shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 font-medium">{lineTestResult.message}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Live Visual Flex Message Preview */}
            <div className="lg:col-span-5 flex flex-col">
              <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-[#06C755]" />
                <span>ตัวอย่างการแสดงผลบน LINE (Flex Message Mockup)</span>
              </div>
              
              <div className="flex-1 rounded-2xl bg-[#000000] border border-white/10 p-3 shadow-2xl flex flex-col justify-center">
                {/* Flex Card Container */}
                <div className="rounded-2xl overflow-hidden border border-white/15 bg-[#161618] text-white shadow-xl text-left">
                  {/* Card Header */}
                  <div className="p-3.5 bg-[#1A1A1C] border-b border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-[#FF5C00] tracking-wider">
                        {formData.name || 'AROI BISTRO'}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-[#065F46] text-[#A7F3D0] text-[9px] font-black">
                        🔔 ออเดอร์ใหม่
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-sm font-black text-white">🍽️ โต๊ะ 04</span>
                      <span className="text-xs font-black text-[#FF5C00]">#ORD-9824</span>
                    </div>
                    <span className="text-[10px] text-stone-400 block mt-0.5">
                      🕒 วันนี้ • 18:45 น.
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="p-3.5 bg-[#0D0D0E] space-y-2.5">
                    {/* Customer Box */}
                    <div className="p-2 rounded-lg bg-[#161618] border border-white/5 flex items-center justify-between text-[11px]">
                      <div>
                        <div className="font-bold text-white">👤 คุณพงศกร</div>
                        <div className="text-[10px] text-stone-400">📞 081-234-5678</div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-emerald-400">✓ จ่ายแล้ว</span>
                        <div className="text-[9px] text-stone-500">พร้อมเพย์</div>
                      </div>
                    </div>

                    {/* Items Section */}
                    <div className="space-y-1.5 text-xs">
                      <div className="text-[10px] font-black text-[#FF5C00] uppercase">
                        📋 รายการอาหาร (3 ที่)
                      </div>
                      
                      <div className="border-t border-white/10 pt-1.5 space-y-1.5">
                        <div className="flex justify-between items-start">
                          <div className="flex gap-1.5">
                            <span className="font-bold text-[#FF5C00]">1x</span>
                            <div>
                              <div className="font-bold text-white text-[11px]">สเต็กเนื้อวากิวออสเตรเลีย A5</div>
                              <div className="text-[9px] text-stone-400">• ความสุก: Medium Rare</div>
                            </div>
                          </div>
                          <span className="text-[11px] font-bold text-amber-400">฿890</span>
                        </div>

                        <div className="flex justify-between items-start">
                          <div className="flex gap-1.5">
                            <span className="font-bold text-[#FF5C00]">2x</span>
                            <div>
                              <div className="font-bold text-white text-[11px]">สปาเก็ตตี้คาโบนาร่าทรัฟเฟิล</div>
                              <div className="text-[9px] text-red-400">🚫 ไม่ใส่: พริกไทย</div>
                            </div>
                          </div>
                          <span className="text-[11px] font-bold text-amber-400">฿580</span>
                        </div>
                      </div>
                    </div>

                    {/* Price Breakdown */}
                    <div className="border-t border-white/10 pt-2 space-y-1 text-[11px]">
                      <div className="flex justify-between text-stone-400 text-[10px]">
                        <span>ยอดรวมอาหาร</span>
                        <span>฿1,470</span>
                      </div>
                      <div className="flex justify-between text-emerald-400 text-[10px]">
                        <span>ส่วนลดโปรโมชั่น (AROI10)</span>
                        <span>-฿147</span>
                      </div>
                      <div className="flex justify-between text-stone-400 text-[10px]">
                        <span>Service Charge (10%)</span>
                        <span>฿132.30</span>
                      </div>
                      <div className="flex justify-between text-white font-black text-xs pt-1 border-t border-white/5">
                        <span>ยอดสุทธิ (Total)</span>
                        <span className="text-[#FF5C00] font-black text-sm">฿1,455.30</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="p-2 bg-[#161618] border-t border-white/10 text-center">
                    <span className="text-[9px] text-stone-500 font-medium">
                      ⚡ แจ้งเตือนอัตโนมัติจากระบบครัว KDS • {formData.name || 'AROI BISTRO'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t border-white/10">
          <button
            type="submit"
            id="btn-save-all-settings"
            className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-[#FF5C00] hover:bg-[#FF7729] text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-[#FF5C00]/25 transition-all cursor-pointer hover:scale-102"
          >
            <Save className="w-4 h-4" />
            <span>บันทึกการตั้งค่าทั้งหมด</span>
          </button>
        </div>
      </form>
    </div>
  );
};
