import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RestaurantProvider, useRestaurant } from './context/RestaurantContext';
import { Navbar } from './components/customer/Navbar';
import { HeroBanner } from './components/customer/HeroBanner';
import { CategoryBar } from './components/customer/CategoryBar';
import { MenuGrid } from './components/customer/MenuGrid';
import { DishDetailModal } from './components/customer/DishDetailModal';
import { CustomDishModal } from './components/customer/CustomDishModal';
import { TableScannerModal } from './components/customer/TableScannerModal';
import { CartDrawer } from './components/customer/CartDrawer';
import { CheckoutModal } from './components/customer/CheckoutModal';
import { OrderTrackerModal } from './components/customer/OrderTrackerModal';
import { MapPickerModal } from './components/customer/MapPickerModal';
import { Toast } from './components/common/Toast';

// Admin Components
import { AdminHeader } from './components/admin/AdminHeader';
import { AdminNav } from './components/admin/AdminNav';
import { KdsOrdersView } from './components/admin/KdsOrdersView';
import { DashboardView } from './components/admin/DashboardView';
import { MenuManagerView } from './components/admin/MenuManagerView';
import { TableManagerView } from './components/admin/TableManagerView';
import { PromoManagerView } from './components/admin/PromoManagerView';
import { SettingsView } from './components/admin/SettingsView';
import { HeroBannerCustomizerModal } from './components/admin/HeroBannerCustomizerModal';
import { AdminAuthModal } from './components/admin/AdminAuthModal';
import { DatabaseSyncModal } from './components/admin/DatabaseSyncModal';

import { ShoppingBag, Sparkles, ChefHat, Clock, ArrowRight } from 'lucide-react';

const CustomerStorefront: React.FC = () => {
  const {
    menuItems,
    selectedDishForModal,
    setSelectedDishForModal,
    cartItemCount,
    cartTotal,
    setIsCartDrawerOpen,
  } = useRestaurant();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Filter items based on category, search, and chips
  const filteredMenuItems = menuItems.filter((item) => {
    // Category match
    if (selectedCategory !== 'all' && item.category !== selectedCategory) {
      return false;
    }

    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchEn = item.nameEn.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      if (!matchName && !matchEn && !matchDesc) return false;
    }

    // Chip filter match
    if (activeFilter === 'chef' && !item.isChefSpecial) return false;
    if (activeFilter === 'popular' && !item.isPopular) return false;
    if (activeFilter === 'spicy' && (!item.isSpicy || item.isSpicy < 1)) return false;
    if (activeFilter === 'vegetarian' && !item.isVegetarian) return false;

    return true;
  });

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white flex flex-col selection:bg-[#FF5C00] selection:text-white max-w-full overflow-x-hidden">
      
      {/* Customer Header */}
      <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full max-w-full">
        
        {/* Promotional Hero Banner & Search Filter Bar */}
        <HeroBanner
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
        />

        {/* Sticky Category Bar */}
        <CategoryBar
          selectedCategory={selectedCategory}
          onSelectCategory={(catId) => setSelectedCategory(catId)}
        />

        {/* Section Heading */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display font-black text-xl sm:text-2xl text-white tracking-tight uppercase">
              {selectedCategory === 'all'
                ? 'เมนูทั้งหมด (All Menus)'
                : `หมวดหมู่: ${menuItems.find((m) => m.category === selectedCategory)?.name || selectedCategory}`}
            </h2>
            <p className="text-xs text-stone-400 mt-0.5 font-medium">
              พบ {filteredMenuItems.length} รายการอาหารพร้อมเสิร์ฟ
            </p>
          </div>
        </div>

        {/* Menu Cards Grid */}
        <MenuGrid
          items={filteredMenuItems}
          onSelectDish={(dish) => setSelectedDishForModal(dish)}
        />
      </main>

      {/* Floating Bottom Quick-Action Bar for Mobile & Desktop */}
      <AnimatePresence>
        {cartItemCount > 0 && (
          <motion.div
            id="floating-cart-bar"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40"
          >
            <button
              onClick={() => setIsCartDrawerOpen(true)}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-[#FF5C00] hover:bg-[#FF7729] text-white font-bold shadow-2xl shadow-[#FF5C00]/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer border border-white/20"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0A0A0B] text-[#FF5C00] flex items-center justify-center font-mono font-black text-sm border border-white/10">
                  {cartItemCount}
                </div>
                <div className="text-left">
                  <div className="text-sm font-display font-black leading-tight uppercase tracking-wider">ดูรายการในตะกร้า</div>
                  <div className="text-[11px] text-white/80 font-medium">กดเพื่อเลือกชำระเงิน</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xl font-black font-mono tracking-tight">฿{cartTotal.toLocaleString()}</span>
                <ArrowRight className="w-5 h-5" />
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Customer Modals */}
      <DishDetailModal
        dish={selectedDishForModal}
        onClose={() => setSelectedDishForModal(null)}
      />
      <CustomDishModal />
      <TableScannerModal />

      <CartDrawer />
      <CheckoutModal />
      <OrderTrackerModal />
      <MapPickerModal />

      {/* Footer */}
      <footer className="bg-[#111112] border-t border-white/10 py-10 mt-16 text-center text-xs text-stone-400 space-y-2">
        <div className="flex items-center justify-center gap-2 text-white font-display font-black uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-[#FF5C00]" />
          <span>AroiBistro Premium Food & Dining System</span>
        </div>
        <p className="font-medium">รสชาติไทยร่วมสมัย คัดสรรวัตถุดิบพรีเมียม สดใหม่ทุกจาน</p>
        <p className="text-[11px] text-stone-500 font-mono">© 2026 AroiBistro All Rights Reserved.</p>
      </footer>
    </div>
  );
};

const AdminBackoffice: React.FC = () => {
  const { adminActiveTab } = useRestaurant();

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white flex flex-col selection:bg-[#FF5C00] selection:text-white max-w-full overflow-x-hidden">
      <AdminHeader />
      <AdminNav />

      <main className="flex-1 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full max-w-full pt-4 sm:pt-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={adminActiveTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
          >
            {adminActiveTab === 'orders' && <KdsOrdersView />}
            {adminActiveTab === 'dashboard' && <DashboardView />}
            {adminActiveTab === 'menu' && <MenuManagerView />}
            {adminActiveTab === 'tables' && <TableManagerView />}
            {adminActiveTab === 'promos' && <PromoManagerView />}
            {adminActiveTab === 'settings' && <SettingsView />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <RestaurantProvider>
      <MainAppContent />
      <HeroBannerCustomizerModal />
      <AdminAuthModal />
      <DatabaseSyncModal />
      <Toast />
    </RestaurantProvider>
  );
}

const MainAppContent: React.FC = () => {
  const { isAdminMode } = useRestaurant();

  return (
    <AnimatePresence mode="wait">
      {isAdminMode ? (
        <motion.div
          key="admin-view"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <AdminBackoffice />
        </motion.div>
      ) : (
        <motion.div
          key="customer-view"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <CustomerStorefront />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
