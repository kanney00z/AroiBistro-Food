import React from 'react';
import { motion } from 'motion/react';
import {
  ShoppingBag,
  UtensilsCrossed,
  Bike,
  Package,
  LayoutDashboard,
  Clock,
  MapPin,
  Sparkles,
  QrCode,
  Check,
  Lock,
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { OrderType } from '../../types';

interface NavbarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ searchQuery, setSearchQuery }) => {
  const {
    settings,
    storeStatus,
    orderType,
    setOrderType,
    selectedTable,
    isTableScanned,
    setIsTableScannerModalOpen,
    cartItemCount,
    setIsCartDrawerOpen,
    setIsAdminAuthModalOpen,
    activeCustomerOrder,
    setIsOrderTrackerOpen,
  } = useRestaurant();

  const diningModes: { type: OrderType; label: string; icon: React.ElementType }[] = [
    { type: 'dine_in', label: 'ทานที่ร้าน', icon: UtensilsCrossed },
    { type: 'pickup', label: 'รับกลับบ้าน', icon: Package },
  ];

  return (
    <header id="customer-navbar" className="sticky top-0 z-40 w-full bg-[#0A0A0B]/95 backdrop-blur-xl border-b border-white/10 transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2 sm:gap-4">
          
          {/* Logo & Brand Identity */}
          <div
            className="flex items-center gap-2 sm:gap-3.5 cursor-pointer select-none group min-w-0"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-[#FF5C00] p-0.5 shadow-lg shadow-[#FF5C00]/25 group-hover:scale-105 transition-transform duration-300 shrink-0">
              <div className="w-full h-full bg-[#0A0A0B] rounded-[10px] sm:rounded-[14px] flex items-center justify-center text-[#FF5C00]">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-display font-black text-base sm:text-xl tracking-tight text-white group-hover:text-[#FF5C00] transition-colors truncate max-w-[110px] xs:max-w-[150px] sm:max-w-none">
                  {settings.name}
                </span>
                {storeStatus.isOpen ? (
                  <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 sm:px-2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>เปิด</span>
                  </span>
                ) : (
                  <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 sm:px-2 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    <span>ร้านปิด</span>
                  </span>
                )}
              </div>
              <p className="label-caps hidden md:block truncate max-w-xs text-stone-400">
                {settings.tagline}
              </p>
            </div>
          </div>

          {/* Desktop Dining Mode Toggle (Pill Selector) */}
          <div className="hidden md:flex items-center bg-[#161618] p-1.5 rounded-2xl border border-white/10 shadow-inner">
            {diningModes.map((mode) => {
              const Icon = mode.icon;
              const isActive = orderType === mode.type;
              return (
                <button
                  key={mode.type}
                  id={`dining-mode-${mode.type}`}
                  onClick={() => setOrderType(mode.type)}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'text-white font-extrabold'
                      : 'text-stone-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-dining-pill"
                      className="absolute inset-0 bg-[#FF5C00] rounded-xl shadow-md shadow-[#FF5C00]/30"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <Icon className="w-4 h-4" />
                    {mode.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Desktop Table badge or Location pill */}
          {orderType === 'dine_in' && (
            <div className="hidden md:block">
              {selectedTable ? (
                <button
                  type="button"
                  id="btn-nav-scanned-table"
                  onClick={() => setIsTableScannerModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-500/40 text-xs text-emerald-300 font-semibold transition-all cursor-pointer group shadow-sm"
                  title="คลิกเพื่อเปลี่ยนโต๊ะ"
                >
                  <UtensilsCrossed className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span>ที่นั่ง:</span>
                  <strong className="text-white font-mono font-bold">{selectedTable}</strong>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    {isTableScanned ? '✓ สแกนแล้ว' : '✓ ทานที่ร้าน'}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  id="btn-nav-scan-table-prompt"
                  onClick={() => setIsTableScannerModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#161618] hover:bg-[#202024] border border-white/10 hover:border-[#FF5C00]/50 text-xs text-stone-300 hover:text-white font-bold transition-all cursor-pointer shadow-sm"
                  title="คลิกเพื่อเลือกโต๊ะหรือสแกน QR Code"
                >
                  <UtensilsCrossed className="w-3.5 h-3.5 text-[#FF5C00]" />
                  <span>ระบุโต๊ะ / สแกน QR</span>
                </button>
              )}
            </div>
          )}

          {/* Right Action Icons & Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            
            {/* Live Order Tracker Trigger (If active order) */}
            {activeCustomerOrder && (
              <motion.button
                id="btn-nav-order-tracker"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setIsOrderTrackerOpen(true)}
                className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/60 transition-all text-xs font-bold cursor-pointer"
                title="คลิกเพื่อติดตามสถานะออเดอร์"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="hidden lg:inline">ติดตามออเดอร์</span>
                <span className="font-mono font-bold text-white text-[11px] sm:text-xs">
                  #{activeCustomerOrder.orderNumber.replace('ORD-', '')}
                </span>
              </motion.button>
            )}

            {/* Switch to Admin Backoffice (Protected by PIN) */}
            <button
              id="btn-switch-to-admin"
              onClick={() => setIsAdminAuthModalOpen(true)}
              className="flex items-center justify-center gap-1.5 p-2 sm:px-3.5 sm:py-2 rounded-xl bg-[#161618] hover:bg-[#202024] text-stone-300 hover:text-white border border-white/10 hover:border-white/20 transition-all text-xs font-bold cursor-pointer group"
              title="เข้าสู่ระบบจัดการหลังบ้านแอดมิน (เฉพาะเจ้าหน้าที่)"
              aria-label="เข้าสู่ระบบหลังบ้านแอดมิน"
            >
              <Lock className="w-4 h-4 text-[#FF5C00] group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">หลังบ้านแอดมิน</span>
            </button>

            {/* Cart Drawer Trigger Button */}
            <motion.button
              id="btn-open-cart-drawer"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setIsCartDrawerOpen(true)}
              className="relative flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-[#FF5C00] hover:bg-[#FF7729] text-white font-bold shadow-lg shadow-[#FF5C00]/25 cursor-pointer transition-all shrink-0"
              aria-label="ดูตะกร้าสินค้า"
            >
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
              {cartItemCount > 0 && (
                <motion.span
                  id="cart-item-badge"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  key={cartItemCount}
                  className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 flex items-center justify-center min-w-[18px] h-4.5 sm:min-w-[20px] sm:h-5 px-1 rounded-full bg-white text-[#0A0A0B] border-2 border-[#0A0A0B] text-[10px] sm:text-[11px] font-black shadow-sm font-mono"
                >
                  {cartItemCount}
                </motion.span>
              )}
            </motion.button>
          </div>
        </div>

        {/* Mobile Dining Mode Bar & Table Selector */}
        <div className="flex md:hidden items-center justify-between gap-2 py-2 border-t border-white/10">
          <div className="flex items-center bg-[#161618] p-1 rounded-xl border border-white/10 flex-1">
            {diningModes.map((mode) => {
              const Icon = mode.icon;
              const isActive = orderType === mode.type;
              return (
                <button
                  key={mode.type}
                  id={`mobile-dining-mode-${mode.type}`}
                  onClick={() => setOrderType(mode.type)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#FF5C00] text-white shadow-sm font-black'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{mode.label}</span>
                </button>
              );
            })}
          </div>

          {/* Table Button on Mobile (Only when dine_in) */}
          {orderType === 'dine_in' && (
            <button
              type="button"
              id="mobile-btn-table-picker"
              onClick={() => setIsTableScannerModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer shrink-0 ${
                selectedTable
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  : 'bg-[#161618] border-white/10 text-stone-300 hover:border-[#FF5C00]/50'
              }`}
            >
              <UtensilsCrossed className={`w-3.5 h-3.5 ${selectedTable ? 'text-emerald-400' : 'text-[#FF5C00]'}`} />
              <span className="font-mono">{selectedTable ? `โต๊ะ ${selectedTable}` : 'ระบุโต๊ะ'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
