import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  Tag,
  ArrowRight,
  UtensilsCrossed,
  Package,
  Bike,
  MapPin,
  Compass,
  Building,
  Sparkles,
  ChefHat,
  Ban,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    isCartDrawerOpen,
    setIsCartDrawerOpen,
    updateCartItemQuantity,
    updateCartItemPackagingType,
    removeFromCart,
    clearCart,
    orderType,
    setOrderType,
    selectedTable,
    setSelectedTable,
    isTableScanned,
    scanTable,
    selectTableManually,
    clearScannedTable,
    setIsTableScannerModalOpen,
    deliveryLocation,
    setIsMapPickerOpen,
    showToast,
    activeTableOrder,
    isAddingToExistingOrder,
    tables,
    appliedPromo,
    applyPromoCode,
    removePromoCode,
    cartSubtotal,
    cartDiscount,
    cartServiceCharge,
    cartDeliveryFee,
    cartTotal,
    storeStatus,
    setIsCheckoutModalOpen,
    setIsCustomDishModalOpen,
  } = useRestaurant();

  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState<string | null>(null);

  if (!isCartDrawerOpen) return null;

  const dineInCount = cart.filter((ci) => (ci.packagingType || 'dine_in') === 'dine_in').reduce((s, i) => s + i.quantity, 0);
  const takeawayCount = cart.filter((ci) => ci.packagingType === 'takeaway').reduce((s, i) => s + i.quantity, 0);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    const res = applyPromoCode(promoInput);
    if (!res.success) {
      setPromoError(res.message);
    } else {
      setPromoError(null);
      setPromoInput('');
    }
  };

  const handleProceedToCheckout = () => {
    if (!storeStatus.isOpen) {
      showToast(`ร้านปิดทำการในขณะนี้ (${storeStatus.statusText}) ไม่สามารถดำเนินการสั่งอาหารได้`, 'warning');
      return;
    }
    setIsCartDrawerOpen(false);
    setIsCheckoutModalOpen(true);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        
        {/* Backdrop */}
        <motion.div
          id="cart-drawer-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsCartDrawerOpen(false)}
          className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm transition-opacity"
        />

        <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
          <motion.div
            id="cart-drawer-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="w-full sm:w-[440px] md:w-[480px] bg-[#111112] border-l border-white/10 shadow-2xl flex flex-col justify-between"
          >
            
            {/* Drawer Header */}
            <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between bg-[#0A0A0B]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FF5C00]/15 border border-[#FF5C00]/30 flex items-center justify-center text-[#FF5C00]">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-black text-lg text-white">ตะกร้าอาหารของคุณ</h3>
                  <p className="text-xs text-stone-400 font-mono">
                    {cart.length > 0 ? `${cart.length} ITEMS` : 'EMPTY CART'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {cart.length > 0 && (
                  <button
                    id="btn-clear-cart"
                    onClick={clearCart}
                    className="text-[11px] font-bold uppercase tracking-wider text-stone-400 hover:text-rose-400 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    ล้างตะกร้า
                  </button>
                )}
                <button
                  id="btn-close-cart-drawer"
                  onClick={() => setIsCartDrawerOpen(false)}
                  className="w-9 h-9 rounded-xl bg-[#161618] hover:bg-[#202024] text-stone-300 hover:text-white border border-white/10 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6 custom-scrollbar">
              
              {/* Order Mode Pill Selector in Cart */}
              <div className="bg-[#0A0A0B] p-1.5 rounded-2xl border border-white/10 flex items-center justify-between gap-1">
                {[
                  { type: 'dine_in', label: 'ทานที่ร้าน', icon: UtensilsCrossed },
                  { type: 'pickup', label: 'รับกลับ', icon: Package },
                  { type: 'delivery', label: 'เดลิเวอรี่', icon: Bike },
                ].map((m) => {
                  const Icon = m.icon;
                  const active = orderType === m.type;
                  return (
                    <button
                      key={m.type}
                      onClick={() => setOrderType(m.type as any)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        active
                          ? 'bg-[#FF5C00] text-white shadow-md shadow-[#FF5C00]/25'
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Dining Mode Specific Inputs */}
              {orderType === 'dine_in' && (
                <div className="p-4 rounded-2xl bg-[#161618] border border-white/10 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <label className="label-caps flex items-center gap-1.5">
                      <UtensilsCrossed className="w-3.5 h-3.5 text-[#FF5C00]" />
                      <span>จุดรับประทาน / โต๊ะอาหาร</span>
                    </label>
                    <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      ✨ สั่งได้ทันที ไม่ต้องสแกน
                    </span>
                  </div>

                  {selectedTable ? (
                    <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-stone-300">ตำแหน่งที่นั่ง:</span>
                            <strong className="text-base font-mono font-black text-white">{selectedTable}</strong>
                          </div>
                          <span className="text-[10px] text-emerald-400 font-bold">
                            {isTableScanned ? '✓ สแกน QR Code แล้ว' : '✓ เลือกโต๊ะทานที่ร้าน (สั่งปกติ)'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          id="btn-cart-rescan-table"
                          onClick={() => setIsTableScannerModalOpen(true)}
                          className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
                        >
                          เปลี่ยน
                        </button>
                        <button
                          type="button"
                          onClick={() => clearScannedTable()}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-stone-400 hover:text-rose-300 text-xs transition-all cursor-pointer"
                          title="ยกเลิกโต๊ะ"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-[#0A0A0B] border border-white/10 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-stone-300 font-medium">เลือกโต๊ะที่นั่งของคุณ (แตะเลือกได้ทันที):</span>
                        <span className="text-[11px] text-stone-500 font-mono">T-01 ถึง T-08</span>
                      </div>

                      {/* Quick table chips */}
                      <div className="grid grid-cols-4 gap-1.5">
                        {tables.slice(0, 8).map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => selectTableManually(t.number)}
                            className="py-1.5 px-2 rounded-xl bg-[#161618] hover:bg-[#FF5C00] hover:text-white border border-white/10 hover:border-[#FF5C00] text-xs font-mono font-bold text-stone-300 transition-all text-center cursor-pointer"
                          >
                            {t.number}
                          </button>
                        ))}
                      </div>

                      {/* Counter or Custom Table Option */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => selectTableManually('สั่งที่เคาน์เตอร์')}
                          className="flex-1 py-2 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-stone-200 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <UtensilsCrossed className="w-3.5 h-3.5 text-[#FF5C00]" />
                          <span>สั่งที่เคาน์เตอร์ / พนักงานจัดโต๊ะ</span>
                        </button>

                        <button
                          type="button"
                          id="btn-cart-scan-table"
                          onClick={() => setIsTableScannerModalOpen(true)}
                          className="py-2 px-3 rounded-xl bg-[#FF5C00]/15 hover:bg-[#FF5C00]/25 border border-[#FF5C00]/40 text-[#FF5C00] font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                          title="สแกน QR ประจำโต๊ะ"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>สแกน QR</span>
                        </button>
                      </div>

                      <p className="text-[11px] text-stone-400 leading-snug">
                        💡 หากยังไม่ทราบโต๊ะ สามารถกดดำเนินการสั่งอาหารได้ทันที และแจ้งพนักงานเมื่ออาหารพร้อมเสิร์ฟ
                      </p>
                    </div>
                  )}
                </div>
              )}

              {orderType === 'pickup' && (
                <div className="p-4 rounded-2xl bg-[#161618] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-stone-200">
                      <Package className="w-4 h-4 text-amber-400" />
                      <span className="label-caps">สั่งแบบปกติ: รับกลับบ้าน</span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-400">ไม่ต้องสแกนโต๊ะ</span>
                  </div>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    อาหารจะถูกจัดเตรียมใส่กล่องพร้อมให้เข้ามารับที่เคาน์เตอร์หน้าร้าน สามารถกดสั่งและชำระเงินได้ทันที
                  </p>
                </div>
              )}

              {orderType === 'delivery' && (
                <div className="p-4 rounded-2xl bg-[#161618] border border-white/10 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-stone-200">
                      <Bike className="w-4 h-4 text-[#FF5C00]" />
                      <span className="label-caps">จัดส่งเดลิเวอรี่ (Delivery)</span>
                    </div>
                    <span className="text-[11px] font-bold text-[#FF5C00] bg-[#FF5C00]/10 px-2 py-0.5 rounded-full border border-[#FF5C00]/20">
                      🛵 ปักหมุดแผนที่ GPS
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#0A0A0B] border border-white/10 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <MapPin className="w-4 h-4 text-[#FF5C00] shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white leading-tight line-clamp-2">
                            {deliveryLocation?.address || 'ยังไม่ได้ปักหมุดตำแหน่ง'}
                          </div>
                          {deliveryLocation?.buildingDetails && (
                            <div className="text-[11px] text-stone-400 mt-0.5 flex items-center gap-1">
                              <Building className="w-3 h-3 text-amber-400 shrink-0" />
                              <span className="truncate">{deliveryLocation.buildingDetails}</span>
                            </div>
                          )}
                          <div className="text-[10px] text-stone-500 font-mono mt-1">
                            ระยะทาง ~{deliveryLocation?.distanceKm || 0.5} กม. | พิกัด {deliveryLocation?.lat.toFixed(4)}, {deliveryLocation?.lng.toFixed(4)}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        id="btn-cart-open-map-picker"
                        onClick={() => setIsMapPickerOpen(true)}
                        className="px-3 py-1.5 rounded-xl bg-[#FF5C00] hover:bg-[#FF7729] text-white text-xs font-bold shadow-md shadow-[#FF5C00]/25 transition-all cursor-pointer shrink-0"
                      >
                        {deliveryLocation ? 'เปลี่ยนหมุด' : 'ปักหมุด'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Existing Bill Notice */}
              {isAddingToExistingOrder && activeTableOrder && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>พบรายการที่สั่งไว้ก่อนหน้า</span>
                    </div>
                    <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      บิล #{activeTableOrder.orderNumber} (รอบที่ {(activeTableOrder.roundsCount || 1) + 1})
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-200/90 leading-relaxed">
                    อาหารที่คุณเลือกจะถูก<strong>เพิ่มเข้าไปในบิลเดิม #{activeTableOrder.orderNumber} {activeTableOrder.tableNumber ? `(โต๊ะ ${activeTableOrder.tableNumber})` : ''}</strong> ทันที ไม่ต้องเปิดบิลใหม่!
                  </p>
                </div>
              )}

              {/* Mixed Packaging Summary Pill (Dine-in vs Takeaway in same bill) */}
              {cart.length > 0 && (
                <div className="p-3 rounded-xl bg-[#161618] border border-white/10 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-stone-400 font-medium">รวมในบิลนี้:</span>
                    <span className="px-2 py-0.5 rounded-md bg-stone-800 text-stone-200 font-bold flex items-center gap-1">
                      <UtensilsCrossed className="w-3 h-3 text-[#FF5C00]" />
                      ทานที่ร้าน {dineInCount} ที่
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-stone-800 text-stone-200 font-bold flex items-center gap-1">
                      <Package className="w-3 h-3 text-amber-400" />
                      กลับบ้าน {takeawayCount} ที่
                    </span>
                  </div>
                  <span className="text-[10px] text-stone-400 font-mono">1 บิล</span>
                </div>
              )}

              {/* Items List */}
              {cart.length === 0 ? (
                <div className="text-center py-12 text-stone-500 space-y-4">
                  <ShoppingBag className="w-16 h-16 mx-auto text-stone-600 stroke-[1.2]" />
                  <div>
                    <p className="text-base font-bold text-stone-300">ตะกร้าของคุณว่างเปล่า</p>
                    <p className="text-xs text-stone-500 mt-1">เลือกเมนูแสนอร่อยหรือสั่งเมนูพิเศษตามใจคุณ</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCartDrawerOpen(false);
                      setIsCustomDishModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#FF5C00]/20 hover:bg-[#FF5C00]/30 text-[#FF5C00] border border-[#FF5C00]/30 text-xs font-black transition-all cursor-pointer shadow-sm"
                  >
                    <ChefHat className="w-4 h-4" />
                    <span>✨ สั่งทำเมนูพิเศษตามใจคุณ</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((cartItem) => {
                    const isTakeaway = cartItem.packagingType === 'takeaway';
                    const isCustom = cartItem.customDishDetails?.isCustomDish;
                    const isPricePending = cartItem.customDishDetails?.isPricePending || (isCustom && cartItem.itemTotal === 0);

                    return (
                      <motion.div
                        key={cartItem.id}
                        id={`cart-item-${cartItem.id}`}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className={`p-3.5 rounded-2xl border flex flex-col gap-2.5 group transition-all ${
                          isCustom
                            ? 'bg-[#181512] border-[#FF5C00]/30 shadow-md shadow-[#FF5C00]/5'
                            : 'bg-[#161618] border-white/10'
                        }`}
                      >
                        <div className="flex gap-3">
                          {/* Image Thumbnail */}
                          <div className="relative shrink-0">
                            <img
                              src={cartItem.menuItem.image}
                              alt={cartItem.menuItem.name}
                              className="w-16 h-16 rounded-xl object-cover bg-[#0A0A0B] border border-white/10"
                              referrerPolicy="no-referrer"
                            />
                            {isCustom && (
                              <div className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-[#FF5C00] text-white flex items-center justify-center text-[10px] shadow-md">
                                ✨
                              </div>
                            )}
                          </div>

                          {/* Info & Options */}
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <div className="flex items-start justify-between gap-1">
                                <div className="min-w-0">
                                  {isCustom && (
                                    <span className="text-[10px] font-black text-[#FF5C00] uppercase tracking-wider block">
                                      ✨ เมนูพิเศษสั่งทำ
                                    </span>
                                  )}
                                  <h4 className="text-sm font-bold text-white truncate">
                                    {cartItem.menuItem.name}
                                  </h4>
                                </div>
                                <button
                                  onClick={() => removeFromCart(cartItem.id)}
                                  className="text-stone-500 hover:text-rose-400 p-1 transition-colors cursor-pointer shrink-0"
                                  title="ลบรายการนี้"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Selected Option Tags */}
                              {cartItem.selectedOptions.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {cartItem.selectedOptions.map((opt, i) => (
                                    <span
                                      key={i}
                                      className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/5 text-stone-300 border border-white/10"
                                    >
                                      {opt.choiceName} {opt.priceDelta > 0 && `(+฿${opt.priceDelta})`}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Excluded ingredients tags */}
                              {cartItem.excludedIngredients && cartItem.excludedIngredients.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {cartItem.excludedIngredients.map((ex, i) => (
                                    <span
                                      key={i}
                                      className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-500/30 flex items-center gap-1"
                                    >
                                      <Ban className="w-2.5 h-2.5 text-rose-400 shrink-0" />
                                      <span>{ex}</span>
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Special notes */}
                              {cartItem.specialInstructions && (
                                <p className="text-[11px] text-[#FF5C00] font-medium italic mt-1 truncate">
                                  * {cartItem.specialInstructions}
                                </p>
                              )}
                            </div>

                            {/* Quantity controls and Total */}
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
                              <div className="flex items-center bg-[#0A0A0B] border border-white/10 rounded-lg p-0.5">
                                <button
                                  onClick={() => updateCartItemQuantity(cartItem.id, -1)}
                                  className="w-6 h-6 rounded bg-[#161618] hover:bg-[#202024] text-stone-300 flex items-center justify-center transition-colors cursor-pointer"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-7 text-center text-xs font-black font-mono text-white">
                                  {cartItem.quantity}
                                </span>
                                <button
                                  onClick={() => updateCartItemQuantity(cartItem.id, 1)}
                                  className="w-6 h-6 rounded bg-[#161618] hover:bg-[#202024] text-stone-300 flex items-center justify-center transition-colors cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              <div className="text-right">
                                {isPricePending ? (
                                  <span className="text-xs font-black font-mono px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    ⏳ รอคิดราคาหลังบ้าน
                                  </span>
                                ) : (
                                  <span className="text-sm font-black font-mono text-[#FF5C00]">
                                    ฿{cartItem.itemTotal.toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Inline Packaging Selector for this Item */}
                        <div className="flex items-center justify-between pt-2 border-t border-white/5 bg-[#0A0A0B]/60 -mx-3.5 -mb-3.5 px-3.5 py-2 rounded-b-2xl">
                          <span className="text-[11px] text-stone-400 font-medium">รูปแบบเสิร์ฟ:</span>
                          <div className="flex items-center gap-1 bg-[#161618] p-0.5 rounded-lg border border-white/10">
                            <button
                              type="button"
                              onClick={() => updateCartItemPackagingType(cartItem.id, 'dine_in')}
                              className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                                !isTakeaway
                                  ? 'bg-[#FF5C00] text-white shadow-sm'
                                  : 'text-stone-400 hover:text-white'
                              }`}
                            >
                              <UtensilsCrossed className="w-3 h-3" />
                              <span>ทานที่ร้าน</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => updateCartItemPackagingType(cartItem.id, 'takeaway')}
                              className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                                isTakeaway
                                  ? 'bg-amber-600 text-white shadow-sm'
                                  : 'text-stone-400 hover:text-white'
                              }`}
                            >
                              <Package className="w-3 h-3" />
                              <span>กลับบ้าน</span>
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}

                  {/* Add Custom Dish CTA in Cart */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsCartDrawerOpen(false);
                      setIsCustomDishModalOpen(true);
                    }}
                    className="w-full p-3 rounded-2xl bg-[#181512] hover:bg-[#201a14] border border-[#FF5C00]/30 hover:border-[#FF5C00] flex items-center justify-center gap-2 text-xs font-black text-[#FF5C00] transition-all cursor-pointer"
                  >
                    <ChefHat className="w-4 h-4" />
                    <span>+ พิมพ์สั่งเมนูพิเศษเพิ่มเติม (Custom Order)</span>
                  </button>
                </div>
              )}

              {/* Promo Code Form */}
              {cart.length > 0 && (
                <div className="pt-2">
                  {appliedPromo ? (
                    <div className="p-3.5 rounded-2xl bg-emerald-950/50 border border-emerald-600/60 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Tag className="w-4 h-4 text-emerald-400" />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black font-mono text-emerald-300">
                              {appliedPromo.code}
                            </span>
                            <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.2 rounded bg-emerald-800 text-white font-bold">
                              APPLIED
                            </span>
                          </div>
                          <p className="text-[11px] text-emerald-400/80 mt-0.5">
                            {appliedPromo.description}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={removePromoCode}
                        className="text-xs text-emerald-400 hover:text-rose-400 font-bold px-2 py-1 cursor-pointer"
                      >
                        ยกเลิก
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyPromo} className="space-y-1.5">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                          <input
                            type="text"
                            placeholder="กรอกโค้ดส่วนลด เช่น AROI10"
                            value={promoInput}
                            onChange={(e) => {
                              setPromoInput(e.target.value.toUpperCase());
                              setPromoError(null);
                            }}
                            className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-[#0A0A0B] border border-white/10 text-xs text-white uppercase tracking-wider placeholder:normal-case placeholder-stone-500 focus:outline-none focus:border-[#FF5C00] font-mono font-bold"
                          />
                        </div>
                        <button
                          type="submit"
                          className="px-4 py-2.5 rounded-xl bg-[#161618] hover:bg-[#202024] text-white border border-white/10 text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                        >
                          ใช้โค้ด
                        </button>
                      </div>
                      {promoError && (
                        <p className="text-[11px] text-rose-400 pl-1 font-medium">{promoError}</p>
                      )}
                    </form>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Billing Summary & Checkout Trigger */}
            {cart.length > 0 && (
              <div className="p-4 sm:p-6 bg-[#0A0A0B] border-t border-white/10 space-y-3">
                {/* Cost Breakdown */}
                <div className="space-y-1.5 text-xs text-stone-300">
                  {cart.some((ci) => ci.customDishDetails?.isPricePending || (ci.customDishDetails?.isCustomDish && ci.itemTotal === 0)) && (
                    <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between text-xs text-amber-300 mb-2">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>มีเมนูสั่งทำตามใจ รอร้านประเมินราคา</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 font-black shrink-0">
                        ⏳ คิดราคาหลังบ้าน
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>ยอดรวมอาหาร (Subtotal)</span>
                    <span className="font-mono font-bold text-white">฿{cartSubtotal.toLocaleString()}</span>
                  </div>

                  {cartDiscount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>ส่วนลดโปรโมชั่น ({appliedPromo?.code})</span>
                      <span className="font-mono font-black">-฿{cartDiscount.toLocaleString()}</span>
                    </div>
                  )}

                  {cartServiceCharge > 0 && (
                    <div className="flex justify-between">
                      <span>ค่าบริการ Service Charge (10%)</span>
                      <span className="font-mono font-bold text-white">฿{cartServiceCharge.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-baseline pt-2 border-t border-white/10 text-white">
                    <span className="text-sm font-extrabold">ยอดชำระสุทธิ (Total)</span>
                    <span className="text-2xl font-black font-mono text-[#FF5C00]">
                      ฿{cartTotal.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Store Closed Warning Banner */}
                {!storeStatus.isOpen && (
                  <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-xs">
                    <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-rose-200">ขณะนี้ร้านปิดทำการ ({storeStatus.statusText})</p>
                      <p className="text-[11px] text-rose-300/80 mt-0.5 leading-relaxed">
                        {storeStatus.statusDetail} • {storeStatus.nextOpenText} (ไม่สามารถดำเนินการส่งออเดอร์ได้ในเวลานี้)
                      </p>
                    </div>
                  </div>
                )}

                {/* Checkout Button */}
                {storeStatus.isOpen ? (
                  <motion.button
                    id="btn-proceed-to-checkout"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleProceedToCheckout}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-[#FF5C00] hover:bg-[#FF7729] text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-[#FF5C00]/25 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {cart.some((ci) => ci.customDishDetails?.isPricePending || (ci.customDishDetails?.isCustomDish && ci.itemTotal === 0))
                        ? (orderType === 'delivery'
                            ? 'ระบุที่อยู่จัดส่ง & ส่งให้ร้านประเมินราคา 🛵'
                            : 'ส่งออเดอร์ให้ร้านประเมินราคา ⏳')
                        : (isAddingToExistingOrder && activeTableOrder
                            ? `ยืนยันสั่งเพิ่มเข้าบิลเดิม #${activeTableOrder.orderNumber} (+฿${cartTotal.toLocaleString()})`
                            : `ดำเนินการสั่งและชำระเงิน (฿${cartTotal.toLocaleString()})`)}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                ) : (
                  <button
                    id="btn-proceed-to-checkout"
                    disabled
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-stone-900 border border-rose-500/20 text-rose-400 font-bold text-xs uppercase tracking-wider cursor-not-allowed opacity-80"
                  >
                    <Ban className="w-4 h-4 text-rose-400" />
                    <span>ร้านปิดทำการชั่วคราว (ไม่สามารถกดสั่งอาหารได้)</span>
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};
