import React, { useState, useEffect } from 'react';
import {
  ChefHat,
  Sparkles,
  ArrowLeft,
  Volume2,
  VolumeX,
  Store,
  Clock,
  TrendingUp,
  Database,
  Radio,
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';

export const AdminHeader: React.FC = () => {
  const {
    settings,
    updateSettings,
    setIsAdminMode,
    orders,
    realtimeStatus,
    setIsDatabaseModalOpen,
  } = useRestaurant();

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const activeOrdersCount = orders.filter(
    (o) => o.orderStatus === 'pending' || o.orderStatus === 'cooking'
  ).length;

  const todayRevenue = orders
    .filter((o) => o.orderStatus !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  const getRealtimeBadge = () => {
    switch (realtimeStatus) {
      case 'connected':
        return {
          bg: 'bg-emerald-950/50 border-emerald-500/40 text-emerald-400',
          dot: 'bg-emerald-400 animate-pulse',
          text: 'Supabase Realtime สด',
        };
      case 'connecting':
        return {
          bg: 'bg-amber-950/50 border-amber-500/40 text-amber-400',
          dot: 'bg-amber-400 animate-ping',
          text: 'กำลังเชื่อมต่อ...',
        };
      case 'error':
        return {
          bg: 'bg-rose-950/50 border-rose-500/40 text-rose-400',
          dot: 'bg-rose-400',
          text: 'ข้อผิดพลาด Realtime',
        };
      default:
        return {
          bg: 'bg-[#1a1a1c] border-white/10 text-stone-300 hover:border-[#FF5C00]/40',
          dot: 'bg-stone-500',
          text: 'เชื่อมต่อ Supabase',
        };
    }
  };

  const badge = getRealtimeBadge();

  return (
    <header id="admin-header" className="bg-[#0A0A0B] border-b border-white/10 sticky top-0 z-40 transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2 sm:gap-4">
          
          {/* Logo & Admin Status */}
          <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-[#FF5C00] p-0.5 shadow-lg shadow-[#FF5C00]/20 flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-[#0A0A0B] rounded-[10px] sm:rounded-[14px] flex items-center justify-center text-[#FF5C00]">
                <ChefHat className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-display font-black text-base sm:text-xl tracking-tight text-white uppercase truncate max-w-[100px] xs:max-w-[140px] sm:max-w-none">
                  {settings.name}
                </span>
                <span className="text-[9px] sm:text-[10px] font-black tracking-widest px-1.5 sm:px-2 py-0.5 rounded-md bg-[#FF5C00]/20 text-[#FF5C00] border border-[#FF5C00]/30 shrink-0">
                  BACKOFFICE
                </span>
              </div>
              <p className="text-xs text-stone-400 hidden sm:block font-medium">
                ระบบบริหารจัดการร้านอาหารและห้องครัวเรียลไทม์
              </p>
            </div>
          </div>

          {/* Quick Metrics ticker in Header */}
          <div className="hidden lg:flex items-center gap-4 bg-[#111112] px-4 py-2 rounded-2xl border border-white/10 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#FF5C00] animate-pulse" />
              <span className="text-stone-400 font-bold uppercase text-[10px] tracking-wider">ออเดอร์ในครัว:</span>
              <strong className="text-[#FF5C00] font-black font-mono text-sm">{activeOrdersCount}</strong>
            </div>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-stone-400 font-bold uppercase text-[10px] tracking-wider">ยอดขายรวม:</span>
              <strong className="text-emerald-400 font-black font-mono text-sm">
                ฿{todayRevenue.toLocaleString()}
              </strong>
            </div>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-1.5 text-stone-400 font-mono font-bold">
              <Clock className="w-3.5 h-3.5 text-[#FF5C00]" />
              <span>{currentTime.toLocaleTimeString('th-TH')}</span>
            </div>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Supabase Realtime Sync Button */}
            <button
              id="btn-admin-supabase-sync"
              onClick={() => setIsDatabaseModalOpen(true)}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-black tracking-wider border transition-all cursor-pointer ${badge.bg}`}
              title="ตั้งค่าเชื่อมต่อฐานข้อมูล Supabase และระบบซิงค์ Realtime ทุกเครื่อง"
            >
              <div className={`w-2 h-2 rounded-full shrink-0 ${badge.dot}`} />
              <Database className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">{badge.text}</span>
              <span className="sm:hidden">DB Sync</span>
            </button>

            {/* Audio Toggle */}
            <button
              id="btn-admin-sound-toggle"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 sm:p-2.5 rounded-xl border transition-all cursor-pointer ${
                soundEnabled
                  ? 'bg-[#FF5C00]/15 border-[#FF5C00]/40 text-[#FF5C00]'
                  : 'bg-[#161618] border-white/10 text-stone-500'
              }`}
              title={soundEnabled ? 'เสียงแจ้งเตือน: เปิด' : 'เสียงแจ้งเตือน: ปิด'}
              aria-label="เปิดปิดเสียงแจ้งเตือน"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Store Status Toggle */}
            <button
              id="btn-admin-store-status"
              onClick={() => updateSettings({ isOpen: !settings.isOpen })}
              className={`hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider border transition-all cursor-pointer ${
                settings.isOpen
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-400'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>{settings.isOpen ? 'ร้านเปิดบริการ' : 'ปิดรับออเดอร์'}</span>
            </button>

            {/* Return to Customer Storefront View */}
            <button
              id="btn-return-to-storefront"
              onClick={() => setIsAdminMode(false)}
              className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl bg-[#FF5C00] hover:bg-[#FF7729] text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-[#FF5C00]/20 transition-all cursor-pointer whitespace-nowrap"
              title="กลับไปหน้าหลักสำหรับลูกค้าสั่งอาหาร"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              <span className="hidden xs:inline sm:inline">กลับหน้าร้าน</span>
              <span className="xs:hidden">หน้าร้าน</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
