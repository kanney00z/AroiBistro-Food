import React from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  Tag,
  Flame,
  ShieldCheck,
  Clock,
  Search,
  X,
  ChefHat,
  QrCode,
  CheckCircle2,
  AlertOctagon,
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { DEFAULT_HERO_BANNER } from '../../data/mockData';

interface HeroBannerProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  searchQuery,
  setSearchQuery,
  activeFilter,
  setActiveFilter,
}) => {
  const {
    settings,
    storeStatus,
    applyPromoCode,
    setIsCustomDishModalOpen,
    orderType,
    setOrderType,
    selectedTable,
    isTableScanned,
    setIsTableScannerModalOpen,
  } = useRestaurant();

  const hero = settings.heroBanner || DEFAULT_HERO_BANNER;

  const filterChips = [
    { id: 'all', label: 'ทั้งหมด' },
    { id: 'chef', label: '⭐ เชฟแนะนำ' },
    { id: 'popular', label: '🔥 ขายดีที่สุด' },
    { id: 'spicy', label: '🌶️ อาหารรสจัด' },
    { id: 'vegetarian', label: '🌱 มังสวิรัติ' },
  ];

  return (
    <div id="customer-hero-section" className="relative overflow-hidden pt-6 pb-4">
      {/* Background Decorative Glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-10 right-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Store Closed / Holiday Notice Alert Banner */}
      {!storeStatus.isOpen && (
        <div className="mb-6 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-rose-950/70 border border-rose-500/60 shadow-xl flex items-start gap-3 sm:gap-4 backdrop-blur-md max-w-full overflow-hidden">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0 mt-0.5">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h4 className="font-black text-rose-200 text-xs sm:text-base flex items-center gap-1.5 break-words">
                <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
                <span>ขณะนี้ร้านปิดทำการ ({storeStatus.statusText})</span>
              </h4>
              <span className="text-[10px] sm:text-[11px] px-2 sm:px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30 shrink-0">
                {storeStatus.nextOpenText}
              </span>
            </div>
            <p className="text-xs text-stone-300 font-medium leading-relaxed break-words">
              {storeStatus.statusDetail}
            </p>
            <p className="text-[10px] sm:text-[11px] text-rose-300/90 font-semibold break-words">
              ⛔ ระบบงดรับออเดอร์ในขณะนี้ ไม่สามารถกดสั่งอาหารได้ (คุณสามารถดูรายการอาหารในเมนูได้ตามปกติ)
            </p>
          </div>
        </div>
      )}

      {/* Main Promo Banner Card */}
      <div className="relative rounded-2xl sm:rounded-3xl bg-[#111112] border border-white/10 p-3.5 sm:p-6 md:p-8 lg:p-10 shadow-2xl overflow-hidden mb-6 sm:mb-8 group">
        
        {/* Subtle Background Accent Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#FF5C00]/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-center">
          
          {/* Left Column: Text & Offers */}
          <div className="lg:col-span-7 space-y-3 sm:space-y-4 min-w-0">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-md bg-[#161618] border border-white/10 text-white label-caps max-w-full">
              <Sparkles className="w-3.5 h-3.5 text-[#FF5C00] shrink-0" />
              <span className="text-white truncate">{hero.badgeText || 'CULINARY EXCELLENCE 2026'}</span>
            </div>

            <h1 className="hero-text text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white tracking-tight break-words leading-tight">
              <span className="block">{hero.titleLine1 || 'CRAFTED FLAVORS.'}</span>
              <span className="block text-[#FF5C00] mt-0.5 sm:mt-1">
                {hero.titleLine2 || 'UNCOMPROMISED TASTE.'}
              </span>
            </h1>

            <p className="text-stone-300 text-xs sm:text-sm md:text-base leading-relaxed max-w-xl font-medium break-words">
              {hero.subtitle || 'คัดสรรเนื้อวากิวออสเตรเลีย พาสต้าทรัฟเฟิลเส้นสด และกุ้งแม่น้ำอยุธยา ปรุงด้วยความพิถีพิถันจากเชฟระดับพรีเมียม'}
            </p>

            {/* Dining Mode & Table Status Alert */}
            <div className="pt-1 w-full">
              {orderType === 'dine_in' ? (
                isTableScanned && selectedTable ? (
                  <div className="w-full inline-flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 sm:px-4 sm:py-2.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>คุณนั่งอยู่ที่โต๊ะ:</span>
                      <strong className="text-white font-mono text-sm">{selectedTable}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsTableScannerModalOpen(true)}
                      className="text-[11px] text-emerald-400 hover:text-emerald-200 underline font-semibold cursor-pointer self-start sm:self-auto"
                    >
                      สแกนเปลี่ยนโต๊ะ
                    </button>
                  </div>
                ) : (
                  <div className="w-full inline-flex flex-col sm:flex-row sm:items-center gap-2 p-3 sm:px-4 sm:py-3 rounded-2xl bg-[#FF5C00]/15 border border-[#FF5C00]/40 text-xs text-stone-200 shadow-md">
                    <div className="flex items-center gap-2 text-[#FF5C00] font-bold">
                      <QrCode className="w-4 h-4 animate-bounce shrink-0" />
                      <span>สแกน QR ประจำโต๊ะของคุณ</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        id="btn-hero-scan-table"
                        onClick={() => setIsTableScannerModalOpen(true)}
                        className="px-3 py-1.5 rounded-xl bg-[#FF5C00] hover:bg-[#FF7729] text-white font-black text-xs uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer shadow"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>สแกน QR โต๊ะ</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrderType('pickup')}
                        className="text-[11px] font-bold text-stone-300 hover:text-white underline cursor-pointer"
                      >
                        สั่งกลับบ้าน (ไม่ต้องสแกน)
                      </button>
                    </div>
                  </div>
                )
              ) : (
                <div className="w-full inline-flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 sm:px-4 sm:py-2.5 rounded-2xl bg-[#161618] border border-white/10 text-xs text-stone-300">
                  <span className="flex items-center gap-1.5 text-stone-200 font-semibold">
                    🛍️ สั่งแบบปกติ (รับกลับบ้าน)
                    <span className="text-stone-400 font-normal hidden sm:inline">• สั่งได้ทันที ไม่ต้องสแกนโต๊ะ</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setOrderType('dine_in');
                      setIsTableScannerModalOpen(true);
                    }}
                    className="text-[11px] font-bold text-[#FF5C00] hover:text-[#FF7729] flex items-center gap-1 cursor-pointer underline"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>ถ้านั่งที่ร้าน คลิกสแกน QR โต๊ะ</span>
                  </button>
                </div>
              )}
            </div>

            {/* Quick Promo Codes Pill Card */}
            {hero.showPromoCodes && (
              <div className="pt-1 flex flex-wrap items-center gap-2">
                {hero.promoCode1 && (
                  <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-[#161618] border border-white/10 text-xs">
                    <Tag className="w-3.5 h-3.5 text-[#FF5C00] shrink-0" />
                    <span className="label-caps text-stone-400 text-[10px]">PROMO:</span>
                    <strong className="text-white font-mono font-black text-xs sm:text-sm tracking-wider">{hero.promoCode1}</strong>
                    <button
                      id="btn-copy-promo-1"
                      onClick={() => applyPromoCode(hero.promoCode1)}
                      className="ml-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-[#FF5C00] hover:bg-[#FF7729] text-white text-[10px] sm:text-[11px] font-black tracking-wide transition-all uppercase cursor-pointer"
                    >
                      {hero.promoLabel1 || 'ใช้โค้ด'}
                    </button>
                  </div>
                )}

                {hero.promoCode2 && (
                  <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-[#161618] border border-white/10 text-xs">
                    <Flame className="w-3.5 h-3.5 text-[#FF5C00] shrink-0" />
                    <span className="label-caps text-stone-400 text-[10px]">PROMO:</span>
                    <strong className="text-white font-mono font-black text-xs sm:text-sm tracking-wider">{hero.promoCode2}</strong>
                    <button
                      id="btn-copy-promo-2"
                      onClick={() => applyPromoCode(hero.promoCode2)}
                      className="ml-1 sm:ml-2 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-white hover:bg-stone-200 text-[#0A0A0B] text-[10px] sm:text-[11px] font-black tracking-wide transition-all uppercase cursor-pointer"
                    >
                      {hero.promoLabel2 || 'ใช้โค้ด'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Feature Badges & Custom Order Button */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-3 text-xs text-stone-400 font-semibold flex-wrap">
                {hero.feature1Text && (
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#22C55E] shrink-0" />
                    <span className="text-stone-300">{hero.feature1Text}</span>
                  </div>
                )}
                {hero.feature2Text && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#FF5C00] shrink-0" />
                    <span className="text-stone-300">{hero.feature2Text}</span>
                  </div>
                )}
              </div>

              {hero.showCustomDishButton && (
                <button
                  type="button"
                  id="btn-hero-custom-dish"
                  onClick={() => setIsCustomDishModalOpen(true)}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF5C00] to-amber-600 hover:from-[#FF7729] hover:to-amber-500 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#FF5C00]/20 transition-all cursor-pointer hover:scale-105"
                >
                  <ChefHat className="w-4 h-4 shrink-0" />
                  <span>{hero.customDishButtonText || '✨ สั่งทำเมนูพิเศษตามใจคุณ'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Hero Food Visual Banner */}
          <div className="lg:col-span-5 relative mt-2 lg:mt-0">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl group"
            >
              <img
                src={hero.cardImageUrl || DEFAULT_HERO_BANNER.cardImageUrl}
                alt={hero.cardTitle || 'Signature Dish'}
                className="w-full h-52 sm:h-64 md:h-72 object-cover group-hover:scale-105 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-[#0A0A0B]/30 to-transparent" />
              
              <div className="absolute bottom-3.5 left-3.5 right-3.5 sm:bottom-4 sm:left-4 sm:right-4 flex items-end justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-white bg-[#FF5C00] px-2.5 py-0.5 rounded-md">
                    {hero.cardBadge || "CHEF'S SIGNATURE"}
                  </span>
                  <h3 className="text-white font-extrabold text-base sm:text-lg mt-1 font-display">
                    {hero.cardTitle || 'เนื้อวากิวออสเตรเลีย & ทรัฟเฟิลสด'}
                  </h3>
                  <p className="text-stone-300 text-xs font-mono font-bold">
                    {hero.cardSubtitle || 'เริ่มต้นเพียง ฿340'}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#FF5C00] text-white font-mono font-black flex items-center justify-center shadow-lg text-sm shrink-0">
                  {hero.cardRating?.startsWith('★') ? hero.cardRating : `★ ${hero.cardRating || '4.9'}`}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Search & Dietary Filters Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
        
        {/* Search Input with Realtime Filter */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            id="menu-search-input"
            type="text"
            placeholder="ค้นหาชื่ออาหาร, วัตถุดิบ, หรือเครื่องดื่ม..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-10 py-3 rounded-2xl bg-[#161618] border border-white/10 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-[#FF5C00] transition-all shadow-inner font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Dietary / Preference Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {filterChips.map((chip) => {
            const isSelected = activeFilter === chip.id;
            return (
              <button
                key={chip.id}
                id={`filter-chip-${chip.id}`}
                onClick={() => setActiveFilter(chip.id)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-[#FF5C00] text-white shadow-lg shadow-[#FF5C00]/25 scale-105'
                    : 'bg-[#161618] hover:bg-[#202024] text-stone-300 border border-white/10 hover:border-white/20'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
