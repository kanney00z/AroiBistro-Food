import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Clock,
  ChefHat,
  Bell,
  CheckCircle2,
  UtensilsCrossed,
  Bike,
  PhoneCall,
  FileText,
  MapPin,
  Sparkles,
  Plus,
  Package,
  Ban,
  Building,
  ExternalLink,
  Compass,
  Image as ImageIcon,
  ZoomIn,
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { OrderStatus } from '../../types';

export const OrderTrackerModal: React.FC = () => {
  const {
    activeCustomerOrder,
    setActiveCustomerOrder,
    isOrderTrackerOpen,
    setIsOrderTrackerOpen,
    clearTableBill,
    showToast,
    orders,
  } = useRestaurant();

  const [isViewingSlip, setIsViewingSlip] = useState(false);

  // Pick up-to-date order object from orders array
  const currentOrder = orders.find((o) => o.id === activeCustomerOrder?.id) || activeCustomerOrder;

  if (!isOrderTrackerOpen || !currentOrder) return null;

  const steps: { status: OrderStatus; label: string; desc: string; icon: React.ElementType }[] = [
    {
      status: 'pending',
      label: 'รับออเดอร์แล้ว',
      desc: 'ระบบส่งรายการอาหารเข้าครัวเรียบร้อย',
      icon: Bell,
    },
    {
      status: 'cooking',
      label: 'เชฟกำลังปรุงสด',
      desc: 'กำลังรังสรรค์เมนูด้วยความพิถีพิถัน',
      icon: ChefHat,
    },
    {
      status: 'ready',
      label: 'อาหารพร้อมแล้ว',
      desc: currentOrder.orderType === 'dine_in' ? 'กำลังยกเสิร์ฟที่โต๊ะ' : 'แพ็กเกจเรียบร้อยพร้อมรับที่หน้าร้าน',
      icon: UtensilsCrossed,
    },
    {
      status: 'completed',
      label: 'ทานให้อร่อยครับ',
      desc: currentOrder.orderType === 'dine_in' ? 'เสิร์ฟถึงโต๊ะเรียบร้อย' : 'รับอาหารเรียบร้อยแล้ว',
      icon: CheckCircle2,
    },
  ];

  const statusOrderIndex: Record<OrderStatus, number> = {
    pending: 0,
    cooking: 1,
    ready: 2,
    delivering: 2,
    completed: 3,
    cancelled: -1,
  };

  const currentIndex = statusOrderIndex[currentOrder.orderStatus] ?? 0;

  const dineInCount = currentOrder.items.filter((i) => (i.packagingType || 'dine_in') === 'dine_in').reduce((s, i) => s + i.quantity, 0);
  const takeawayCount = currentOrder.items.filter((i) => i.packagingType === 'takeaway').reduce((s, i) => s + i.quantity, 0);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          id="tracker-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOrderTrackerOpen(false)}
          className="fixed inset-0 bg-stone-950/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          id="order-tracker-dialog"
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          className="relative w-full max-w-xl bg-[#111112] rounded-3xl border border-white/10 shadow-2xl overflow-hidden z-10 my-auto flex flex-col max-h-[90vh]"
        >
          {/* Header with Live Status Pulse */}
          <div className="p-6 border-b border-white/10 bg-[#0A0A0B] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#FF5C00]/15 border border-[#FF5C00]/30 flex items-center justify-center text-[#FF5C00]">
                <ChefHat className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-black text-lg text-white">สถานะออเดอร์สด</h3>
                  <span className="font-mono text-xs font-black px-2 py-0.5 rounded-md bg-[#161618] text-[#FF5C00] border border-white/10">
                    #{currentOrder.orderNumber}
                  </span>
                  {(currentOrder.roundsCount || 1) > 1 && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      รอบที่ {currentOrder.roundsCount}
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-400 font-medium">
                  สั่งเมื่อ {new Date(currentOrder.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                </p>
              </div>
            </div>

            <button
              id="btn-close-tracker-modal"
              onClick={() => setIsOrderTrackerOpen(false)}
              className="w-9 h-9 rounded-xl bg-[#161618] hover:bg-[#202024] text-stone-300 hover:text-white border border-white/10 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Tracker Body */}
          <div className="overflow-y-auto p-6 space-y-6 flex-1 custom-scrollbar">
            
            {/* Multi-Round / Mixed Notice */}
            {(currentOrder.roundsCount || 1) > 1 && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-300">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>บิลนี้มีการสั่งอาหารเพิ่ม รวม {currentOrder.roundsCount} รอบ</span>
                </div>
                <span className="font-mono font-bold text-[11px] bg-amber-500/20 px-2 py-0.5 rounded">
                  รวม {currentOrder.items.length} จาน
                </span>
              </div>
            )}

            {/* Live Progress Banner Card */}
            <div className="p-5 rounded-3xl bg-[#161618] border border-[#FF5C00]/40 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF5C00] animate-ping" />
                  <span className="text-xs font-black text-[#FF5C00] uppercase tracking-wider">
                    {currentOrder.orderStatus === 'cooking' && 'กำลังปรุงสดในครัว'}
                    {currentOrder.orderStatus === 'pending' && 'รอคิวเตรียมวัตถุดิบ'}
                    {currentOrder.orderStatus === 'ready' && 'อาหารพร้อมเสิร์ฟ'}
                    {currentOrder.orderStatus === 'delivering' && 'กำลังจัดส่ง'}
                    {currentOrder.orderStatus === 'completed' && 'เสร็จสิ้นเรียบร้อย'}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-xs text-stone-300 font-mono font-bold">
                  <Clock className="w-3.5 h-3.5 text-[#FF5C00]" />
                  <span>ประมาณ {currentOrder.estimatedMinutes || 15} นาที</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-[#0A0A0B] rounded-full overflow-hidden mb-2 border border-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, Math.max(15, (currentIndex + 1) * 22))}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full bg-[#FF5C00] rounded-full"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-stone-400 font-medium">
                <span>
                  {currentOrder.orderType === 'dine_in' && `เสิร์ฟที่โต๊ะ ${currentOrder.tableNumber}`}
                  {currentOrder.orderType === 'pickup' && `รับกลับบ้านที่หน้าร้าน`}
                  {currentOrder.orderType === 'delivery' && `จัดส่งเดลิเวอรี่ตามหมุด GPS`}
                </span>
                <span className="text-[11px] text-stone-300 font-semibold">
                  (ทานร้าน {dineInCount} • กลับบ้าน {takeawayCount})
                </span>
              </div>
            </div>

            {/* Delivery Location Card in Order Tracker */}
            {currentOrder.orderType === 'delivery' && (currentOrder.deliveryLocation || currentOrder.deliveryAddress) && (
              <div className="p-4 rounded-2xl bg-[#161618] border border-[#FF5C00]/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="label-caps text-[#FF5C00] flex items-center gap-1.5">
                    <Bike className="w-3.5 h-3.5" />
                    สถานที่จัดส่ง (Delivery Pin)
                  </span>
                  {currentOrder.deliveryLocation?.distanceKm && (
                    <span className="text-[10px] font-bold text-amber-400 font-mono">
                      ~{currentOrder.deliveryLocation.distanceKm} กม.
                    </span>
                  )}
                </div>

                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#FF5C00] shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-white leading-relaxed">
                      {currentOrder.deliveryLocation?.address || currentOrder.deliveryAddress}
                    </div>
                    {currentOrder.deliveryLocation?.buildingDetails && (
                      <div className="text-[11px] text-stone-300 mt-0.5 flex items-center gap-1">
                        <Building className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>{currentOrder.deliveryLocation.buildingDetails}</span>
                      </div>
                    )}
                    {currentOrder.deliveryLocation?.driverNote && (
                      <div className="text-[11px] text-stone-400 mt-0.5 flex items-center gap-1">
                        <FileText className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>โน้ต: {currentOrder.deliveryLocation.driverNote}</span>
                      </div>
                    )}
                  </div>
                </div>

                {currentOrder.deliveryLocation?.lat && currentOrder.deliveryLocation?.lng && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${currentOrder.deliveryLocation.lat},${currentOrder.deliveryLocation.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-[#FF5C00]/15 hover:bg-[#FF5C00]/25 border border-[#FF5C00]/40 text-[#FF5C00] text-xs font-bold transition-all"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>เปิดดูตำแหน่งบน Google Maps</span>
                    <ExternalLink className="w-3 h-3 ml-0.5" />
                  </a>
                )}
              </div>
            )}

            {/* Step-by-step Timeline */}
            <div className="space-y-4 pl-2">
              <h4 className="label-caps">
                ขั้นตอนการดำเนินการ
              </h4>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
                {steps.map((step, idx) => {
                  const Icon = step.icon;
                  const isDone = idx <= currentIndex;
                  const isCurrent = idx === currentIndex;

                  return (
                    <div key={step.status} className="relative flex items-start gap-4">
                      {/* Step Indicator Dot / Icon */}
                      <div
                        className={`absolute -left-6 top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all ${
                          isCurrent
                            ? 'bg-[#FF5C00] text-white font-bold ring-4 ring-[#FF5C00]/20 shadow-lg shadow-[#FF5C00]/30'
                            : isDone
                            ? 'bg-emerald-500 text-white font-bold'
                            : 'bg-[#161618] text-stone-500 border border-white/10'
                        }`}
                      >
                        {isDone && !isCurrent ? (
                          <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                        ) : (
                          <Icon className="w-3.5 h-3.5" />
                        )}
                      </div>

                      <div>
                        <h5
                          className={`text-sm font-extrabold ${
                            isCurrent
                              ? 'text-[#FF5C00]'
                              : isDone
                              ? 'text-stone-200'
                              : 'text-stone-500'
                          }`}
                        >
                          {step.label}
                        </h5>
                        <p className="text-xs text-stone-400 mt-0.5 font-normal">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Items Breakdown with Packaging & Round Badges */}
            <div className="p-4 rounded-2xl bg-[#0A0A0B] border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="label-caps">รายการอาหารในบิลนี้</span>
                <span className="text-xs text-stone-400 font-mono">{currentOrder.items.length} ITEMS</span>
              </div>

              <div className="space-y-2.5 divide-y divide-white/10">
                {currentOrder.items.map((it, i) => {
                  const isTakeaway = it.packagingType === 'takeaway';
                  const isCustom = it.customDishDetails?.isCustomDish;
                  const isPending = it.customDishDetails?.isPricePending || (isCustom && it.itemTotal === 0);

                  return (
                    <div key={i} className="pt-2.5 first:pt-0 flex justify-between gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {isCustom && (
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-[#FF5C00]/20 text-[#FF5C00] border border-[#FF5C00]/30">
                              ✨ เมนูสั่งทำ
                            </span>
                          )}
                          <span className="font-bold text-white text-sm">
                            {it.quantity}x {it.menuItem.name}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                              isTakeaway
                                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                : 'bg-[#FF5C00]/15 text-[#FF5C00] border border-[#FF5C00]/30'
                            }`}
                          >
                            {isTakeaway ? <Package className="w-3 h-3" /> : <UtensilsCrossed className="w-3 h-3" />}
                            {isTakeaway ? 'สั่งกลับบ้าน' : 'ทานที่ร้าน'}
                          </span>
                          {it.round && (
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-white/10 text-stone-300">
                              รอบ {it.round}
                            </span>
                          )}
                        </div>

                        {it.selectedOptions && it.selectedOptions.length > 0 && (
                          <p className="text-[11px] text-stone-400">
                            {it.selectedOptions.map((o) => o.choiceName).join(', ')}
                          </p>
                        )}

                        {it.excludedIngredients && it.excludedIngredients.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {it.excludedIngredients.map((ex, exIdx) => (
                              <span
                                key={exIdx}
                                className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-950/60 text-rose-300 border border-rose-500/30 flex items-center gap-1"
                              >
                                <Ban className="w-2.5 h-2.5 text-rose-400" />
                                <span>{ex}</span>
                              </span>
                            ))}
                          </div>
                        )}

                        {it.specialInstructions && (
                          <p className="text-[10px] text-[#FF5C00] font-medium italic">* {it.specialInstructions}</p>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        {isPending ? (
                          <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            ⏳ รอคิดราคาหลังบ้าน
                          </span>
                        ) : (
                          <span className="font-mono font-bold text-white">
                            ฿{it.itemTotal.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-white/10 flex justify-between items-center text-sm font-bold">
                <span className="text-stone-300 font-bold uppercase text-xs">ยอดรวมทั้งสิ้น (บิลนี้)</span>
                <span className="font-mono font-black text-[#FF5C00] text-lg">
                  ฿{currentOrder.total.toLocaleString()}
                </span>
              </div>

              {/* Uploaded Slip Info & Thumbnail if Available */}
              {currentOrder.slipImage && (
                <div className="p-3.5 rounded-2xl bg-[#161618] border border-emerald-500/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      onClick={() => setIsViewingSlip(true)}
                      className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 shrink-0 cursor-pointer group relative"
                    >
                      <img
                        src={currentOrder.slipImage}
                        alt="Transfer Slip"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <ZoomIn className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>แนบสลิปโอนเงินแล้ว</span>
                      </div>
                      <p className="text-[10px] text-stone-400 font-mono mt-0.5">
                        ชำระผ่าน พร้อมเพย์ QR Code
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsViewingSlip(true)}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                    <span>ดูรูปสลิป</span>
                  </button>
                </div>
              )}
            </div>

            {/* Dine-in Order More & Settle Bill Action */}
            {currentOrder.orderType === 'dine_in' && (
              <div className="space-y-3">
                {currentOrder.orderStatus !== 'completed' && currentOrder.orderStatus !== 'cancelled' && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-[#FF5C00]/10 via-[#FF5C00]/5 to-transparent border border-[#FF5C00]/30 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div>
                      <h5 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <Plus className="w-4 h-4 text-[#FF5C00]" />
                        <span>ต้องการสั่งอาหารหรือเครื่องดื่มเพิ่ม?</span>
                      </h5>
                      <p className="text-xs text-stone-400 mt-0.5">
                        รายการที่สั่งใหม่จะถูกเพิ่มเข้าบิลเดิมของโต๊ะ {currentOrder.tableNumber} อัตโนมัติ
                      </p>
                    </div>

                    <button
                      id="btn-order-more-same-bill"
                      onClick={() => {
                        setIsOrderTrackerOpen(false);
                        showToast(`เลือกเมนูเพิ่มเติมเพื่อใส่ในบิลเดิม (โต๊ะ ${currentOrder.tableNumber}) ได้เลยครับ`, 'info');
                      }}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#FF5C00] hover:bg-[#FF7729] text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-[#FF5C00]/20 transition-all cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>สั่งเมนูเพิ่มในบิลนี้</span>
                    </button>
                  </div>
                )}

                {/* Settle & Clear Table Button */}
                <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <h5 className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>{currentOrder.orderStatus === 'completed' ? 'มื้ออาหารเสร็จสมบูรณ์' : 'ทานเสร็จและชำระเงินเรียบร้อย?'}</span>
                    </h5>
                    <p className="text-xs text-stone-400 mt-0.5">
                      กดปุ่มเพื่อเคลียร์บิลโต๊ะ {currentOrder.tableNumber} และเปิดโต๊ะให้ว่างสำหรับลูกค้าท่านต่อไป
                    </p>
                  </div>

                  <button
                    id="btn-customer-clear-table"
                    onClick={() => {
                      if (currentOrder.tableNumber) {
                        clearTableBill(currentOrder.tableNumber);
                        setIsOrderTrackerOpen(false);
                        setActiveCustomerOrder(null);
                      }
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/50 transition-all cursor-pointer shrink-0"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>เคลียร์บิลโต๊ะ & ออกจากโต๊ะ</span>
                  </button>
                </div>
              </div>
            )}

            {/* Quick Assistance Actions */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                id="btn-call-waiter"
                onClick={() => showToast('ส่งสัญญาณเรียกพนักงานประจำโต๊ะเรียบร้อยครับ 🛎️', 'info')}
                className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-[#161618] hover:bg-[#202024] border border-white/10 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <Bell className="w-4 h-4 text-[#FF5C00]" />
                <span>เรียกพนักงาน</span>
              </button>

              <button
                id="btn-call-phone"
                onClick={() => showToast('กำลังโทรติดต่อเคาน์เตอร์ร้าน: 02-888-9999', 'info')}
                className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-[#161618] hover:bg-[#202024] border border-white/10 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <PhoneCall className="w-4 h-4 text-emerald-400" />
                <span>ติดต่อร้าน</span>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-[#0A0A0B] border-t border-white/10 text-center flex items-center gap-2">
            {currentOrder.orderStatus === 'completed' || currentOrder.orderStatus === 'cancelled' ? (
              <button
                id="btn-dismiss-completed-tracker"
                onClick={() => {
                  setActiveCustomerOrder(null);
                  setIsOrderTrackerOpen(false);
                  showToast('ปิดการติดตามออเดอร์เรียบร้อยแล้ว ✨', 'info');
                }}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-md"
              >
                ✓ เสร็จสิ้น / ปิดการติดตาม (พร้อมสั่งออเดอร์ใหม่)
              </button>
            ) : (
              <button
                id="btn-close-tracker-bottom"
                onClick={() => setIsOrderTrackerOpen(false)}
                className="w-full py-3 rounded-xl bg-[#161618] hover:bg-[#202024] border border-white/10 text-stone-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
              >
                ย่อหน้าต่าง (ระบบติดตามอัตโนมัติ)
              </button>
            )}
          </div>
        </motion.div>

        {/* Customer Slip Lightbox Modal */}
        <AnimatePresence>
          {isViewingSlip && currentOrder.slipImage && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                className="relative max-w-lg w-full bg-[#111112] rounded-3xl border border-white/15 p-5 shadow-2xl space-y-4"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-emerald-400" />
                    <span>รูปสลิปโอนเงินของคุณ</span>
                  </h4>
                  <button
                    onClick={() => setIsViewingSlip(false)}
                    className="p-1.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="rounded-2xl overflow-hidden bg-black max-h-[65vh] flex items-center justify-center border border-white/10">
                  <img
                    src={currentOrder.slipImage}
                    alt="Uploaded Slip"
                    className="max-h-[60vh] w-auto object-contain"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsViewingSlip(false)}
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
