import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChefHat,
  LayoutDashboard,
  Utensils,
  Grid,
  Tag,
  Settings,
  ChevronRight,
  ChevronLeft,
  LayoutGrid,
  X,
  Check,
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';

export const AdminNav: React.FC = () => {
  const { adminActiveTab, setAdminActiveTab, orders } = useRestaurant();
  const [isGridModalOpen, setIsGridModalOpen] = useState(false);
  const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const activeOrdersCount = orders.filter(
    (o) => o.orderStatus === 'pending' || o.orderStatus === 'cooking'
  ).length;

  const tabs = [
    {
      id: 'orders' as const,
      label: 'ครัว & ออเดอร์สด (KDS)',
      shortLabel: 'ครัวสด (KDS)',
      description: 'กระดานรับออเดอร์สด จัดการสถานะห้องครัว',
      icon: ChefHat,
      badge: activeOrdersCount > 0 ? activeOrdersCount : undefined,
    },
    {
      id: 'dashboard' as const,
      label: 'แดชบอร์ดสรุปยอด',
      shortLabel: 'แดชบอร์ด',
      description: 'ภาพรวมรายได้ ยอดขาย และสินค้าขายดี',
      icon: LayoutDashboard,
    },
    {
      id: 'menu' as const,
      label: 'จัดการเมนู & สต็อก',
      shortLabel: 'เมนู & สต็อก',
      description: 'เพิ่ม ลบ แก้ไขราคา หมวดหมู่ และสต็อกอาหาร',
      icon: Utensils,
    },
    {
      id: 'tables' as const,
      label: 'ผังโต๊ะ & QR Code',
      shortLabel: 'ผังโต๊ะ & QR',
      description: 'จัดการโต๊ะ สร้างและพิมพ์ QR Code ประจำโต๊ะ',
      icon: Grid,
    },
    {
      id: 'promos' as const,
      label: 'โปรโมชั่น & คูปอง',
      shortLabel: 'โปรโมชั่น',
      description: 'สร้างคูปองส่วนลดและโปรโมชั่นเรียกลูกค้า',
      icon: Tag,
    },
    {
      id: 'settings' as const,
      label: 'ตั้งค่าร้านค้า',
      shortLabel: 'ตั้งค่าร้าน',
      description: 'ข้อมูลร้าน เวลาเปิดปิด ภาษี บัญชีธนาคาร และ PIN',
      icon: Settings,
    },
  ];

  const checkScrollability = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScrollability();
    window.addEventListener('resize', checkScrollability);
    return () => window.removeEventListener('resize', checkScrollability);
  }, []);

  // Auto-scroll active tab into view
  useEffect(() => {
    const activeEl = tabRefs.current[adminActiveTab];
    if (activeEl && scrollContainerRef.current) {
      activeEl.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
      setTimeout(checkScrollability, 300);
    }
  }, [adminActiveTab]);

  const scrollBy = (offset: number) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
      setTimeout(checkScrollability, 300);
    }
  };

  const currentTabObj = tabs.find((t) => t.id === adminActiveTab) || tabs[0];

  return (
    <>
      <div id="admin-subnav" className="bg-[#111112] border-b border-white/10 sticky top-16 sm:top-20 z-30 transition-all">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 sm:gap-2 relative">
            
            {/* Scroll Left Button on Mobile / Tablet */}
            {canScrollLeft && (
              <button
                type="button"
                onClick={() => scrollBy(-180)}
                className="hidden xs:flex absolute left-0 z-20 w-8 h-8 rounded-xl bg-black/80 hover:bg-black border border-white/20 items-center justify-center text-white shadow-lg cursor-pointer transition-all -ml-1"
                aria-label="เลื่อนซ้าย"
              >
                <ChevronLeft className="w-4 h-4 text-[#FF5C00]" />
              </button>
            )}

            {/* Main Tabs Horizontal Scroll Track */}
            <div
              ref={scrollContainerRef}
              onScroll={checkScrollability}
              className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-2 sm:py-2.5 flex-1 scroll-smooth"
            >
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = adminActiveTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    ref={(el) => { tabRefs.current[tab.id] = el; }}
                    id={`admin-tab-${tab.id}`}
                    onClick={() => setAdminActiveTab(tab.id)}
                    className={`relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer shrink-0 ${
                      isActive
                        ? 'text-white font-black'
                        : 'text-stone-400 hover:text-white hover:bg-[#161618]'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="active-admin-tab"
                        className="absolute inset-0 bg-[#FF5C00] rounded-xl shadow-md shadow-[#FF5C00]/25"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5 sm:gap-2">
                      <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#FF5C00]'}`} />
                      
                      {/* Responsive Labels: Short on mobile, full on tablet/desktop */}
                      <span className="uppercase tracking-wider text-[11px] sm:text-xs font-bold sm:hidden">
                        {tab.shortLabel}
                      </span>
                      <span className="uppercase tracking-wider text-xs font-bold hidden sm:inline">
                        {tab.label}
                      </span>

                      {tab.badge !== undefined && (
                        <span
                          className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black shrink-0 ${
                            isActive
                              ? 'bg-black text-white'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {tab.badge}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Scroll Right Button on Mobile / Tablet */}
            {canScrollRight && (
              <button
                type="button"
                onClick={() => scrollBy(180)}
                className="hidden xs:flex absolute right-10 sm:right-0 z-20 w-8 h-8 rounded-xl bg-black/80 hover:bg-black border border-white/20 items-center justify-center text-white shadow-lg cursor-pointer transition-all mr-0"
                aria-label="เลื่อนขวา"
              >
                <ChevronRight className="w-4 h-4 text-[#FF5C00]" />
              </button>
            )}

            {/* Quick All-Tabs Grid Switcher Button (Crucial for Mobile) */}
            <div className="shrink-0 flex items-center pl-1 sm:hidden">
              <button
                type="button"
                id="btn-admin-all-tabs"
                onClick={() => setIsGridModalOpen(true)}
                className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-[#161618] hover:bg-[#202024] border border-white/15 text-[#FF5C00] text-xs font-bold transition-all shadow cursor-pointer"
                title="ดูเมนูจัดการทั้งหมด (6 หมวด)"
                aria-label="เปิดเมนูทั้งหมด"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="text-[10px] text-white font-mono font-bold">6</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Mini Breadcrumb/Status Bar */}
        <div className="sm:hidden px-3 py-1.5 bg-[#0D0D0E] border-t border-white/5 flex items-center justify-between text-[11px] text-stone-400">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[#FF5C00] font-bold">กำลังเปิด:</span>
            <span className="text-white font-bold truncate">{currentTabObj.label}</span>
          </div>
          <button
            type="button"
            onClick={() => setIsGridModalOpen(true)}
            className="text-[10px] text-[#FF5C00] font-bold underline flex items-center gap-0.5 shrink-0"
          >
            <span>เปลี่ยนเมนู</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Mobile All-Tabs Grid Modal */}
      <AnimatePresence>
        {isGridModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: 'spring', damping: 28, stiffness: 350 }}
              className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-[#111112] border border-white/15 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#161618]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#FF5C00]/20 border border-[#FF5C00]/40 flex items-center justify-center text-[#FF5C00]">
                    <LayoutGrid className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-display font-black text-white uppercase tracking-wider">
                      เมนูจัดการหลังบ้านทั้งหมด
                    </h3>
                    <p className="text-[10px] text-stone-400">เลือกหมวดหมู่ที่ต้องการเข้าจัดการ</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsGridModalOpen(false)}
                  className="w-8 h-8 rounded-xl bg-[#202024] hover:bg-[#28282E] text-stone-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Grid Content: All 6 Admin Tabs */}
              <div className="p-3 sm:p-4 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = adminActiveTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setAdminActiveTab(tab.id);
                        setIsGridModalOpen(false);
                      }}
                      className={`w-full p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#FF5C00]/15 border-[#FF5C00] shadow-lg shadow-[#FF5C00]/15'
                          : 'bg-[#161618] hover:bg-[#202024] border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          isActive
                            ? 'bg-[#FF5C00] text-white shadow-md'
                            : 'bg-[#202024] text-[#FF5C00] border border-white/10'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h4
                            className={`text-xs font-black uppercase tracking-wider ${
                              isActive ? 'text-white' : 'text-stone-200'
                            }`}
                          >
                            {tab.label}
                          </h4>
                          {tab.badge !== undefined && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-rose-500 text-white">
                              {tab.badge}
                            </span>
                          )}
                          {isActive && (
                            <Check className="w-4 h-4 text-[#FF5C00] shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-stone-400 mt-1 line-clamp-2 leading-relaxed">
                          {tab.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Modal Footer */}
              <div className="p-3 bg-[#0A0A0B] border-t border-white/10 text-center">
                <button
                  type="button"
                  onClick={() => setIsGridModalOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-[#202024] hover:bg-[#28282E] text-stone-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

