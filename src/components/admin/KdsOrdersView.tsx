import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChefHat,
  Clock,
  Printer,
  CheckCircle2,
  AlertCircle,
  UtensilsCrossed,
  Bike,
  Package,
  XCircle,
  Play,
  Check,
  Search,
  Filter,
  Ban,
  Edit3,
  Trash2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  CheckCheck,
  X,
  MapPin,
  Compass,
  ExternalLink,
  Image as ImageIcon,
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Order, OrderStatus, OrderType } from '../../types';
import { ReceiptModal } from './ReceiptModal';

export const KdsOrdersView: React.FC = () => {
  const {
    orders,
    updateOrderStatus,
    cancelOrder,
    deleteOrder,
    clearCompletedOrders,
    clearTableBill,
    updateOrderItemPrice,
    showToast,
  } = useRestaurant();

  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [editingPriceKey, setEditingPriceKey] = useState<string | null>(null);
  const [priceInput, setPriceInput] = useState<string>('');

  // Delete states
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [isConfirmingClearAll, setIsConfirmingClearAll] = useState<boolean>(false);
  const [showAllCompleted, setShowAllCompleted] = useState<boolean>(false);
  const [viewingSlipOrder, setViewingSlipOrder] = useState<Order | null>(null);

  // Filter orders
  const filteredOrders = orders.filter((ord) => {
    if (selectedTypeFilter !== 'all' && ord.orderType !== selectedTypeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = ord.orderNumber.toLowerCase().includes(q);
      const matchName = ord.customerName.toLowerCase().includes(q);
      const matchTable = ord.tableNumber?.toLowerCase().includes(q);
      return matchNum || matchName || matchTable;
    }
    return true;
  });

  const pendingOrders = filteredOrders.filter((o) => o.orderStatus === 'pending');
  const cookingOrders = filteredOrders.filter((o) => o.orderStatus === 'cooking');
  const readyOrders = filteredOrders.filter((o) => o.orderStatus === 'ready' || o.orderStatus === 'delivering');
  const completedOrders = filteredOrders.filter((o) => o.orderStatus === 'completed');

  const getTimeAgo = (dateStr: string) => {
    const minutes = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (minutes < 1) return 'เมื่อสักครู่';
    if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
    const hours = Math.floor(minutes / 60);
    return `${hours} ชม. ที่แล้ว`;
  };

  const renderOrderCard = (order: Order) => {
    const isLate = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000) > 20;
    const dineInCount = order.items.filter((i) => (i.packagingType || 'dine_in') === 'dine_in').reduce((s, i) => s + i.quantity, 0);
    const takeawayCount = order.items.filter((i) => i.packagingType === 'takeaway').reduce((s, i) => s + i.quantity, 0);

    return (
      <motion.div
        key={order.id}
        id={`kds-card-${order.id}`}
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`p-4 rounded-2xl bg-[#161618] border flex flex-col justify-between shadow-xl transition-all ${
          order.orderStatus === 'pending'
            ? 'border-[#FF5C00]/80 shadow-[#FF5C00]/10'
            : order.orderStatus === 'cooking'
            ? 'border-orange-500/80 shadow-orange-500/10'
            : order.orderStatus === 'ready'
            ? 'border-emerald-500/80 shadow-emerald-500/10'
            : 'border-white/10 opacity-80'
        }`}
      >
        {/* Card Header */}
        <div>
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-mono font-black text-sm text-white">
                {order.orderNumber}
              </span>
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                  order.orderType === 'dine_in'
                    ? 'bg-[#FF5C00]/20 text-[#FF5C00] border border-[#FF5C00]/30'
                    : order.orderType === 'delivery'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                }`}
              >
                {order.orderType === 'dine_in' && `โต๊ะ ${order.tableNumber}`}
                {order.orderType === 'pickup' && 'รับกลับ'}
                {order.orderType === 'delivery' && '🛵 เดลิเวอรี่'}
              </span>

              {(order.roundsCount || 1) > 1 && (
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  รอบ {order.roundsCount}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-stone-400">
              <Clock className={`w-3.5 h-3.5 ${isLate ? 'text-rose-400 animate-pulse' : 'text-[#FF5C00]'}`} />
              <span className={isLate ? 'text-rose-400 font-bold' : ''}>
                {getTimeAgo(order.createdAt)}
              </span>
            </div>
          </div>

          {/* Customer info & Packaging summary */}
          <div className="py-2 text-xs text-stone-300 flex items-center justify-between">
            <span className="font-bold text-white">{order.customerName}</span>
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold">
              {dineInCount > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-stone-800 text-stone-300 border border-white/5">
                  🍽️ {dineInCount}
                </span>
              )}
              {takeawayCount > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-500/20">
                  🛍️ {takeawayCount}
                </span>
              )}
              {order.orderType === 'delivery' && (
                <span className="px-1.5 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-500/20">
                  🛵 ส่ง
                </span>
              )}
            </div>
          </div>

          {/* Delivery address & Pin coordinates if delivery */}
          {(order.deliveryLocation || order.deliveryAddress) && (
            <div className="text-[11px] text-stone-300 bg-[#0A0A0B] p-2.5 rounded-xl border border-white/10 mb-2 space-y-1.5 font-medium">
              <div className="flex items-start justify-between gap-1.5 text-white">
                <div className="flex items-start gap-1.5 flex-1 min-w-0">
                  <MapPin className="w-3.5 h-3.5 text-[#FF5C00] shrink-0 mt-0.5" />
                  <span className="line-clamp-2 text-xs font-bold text-stone-200">
                    {order.deliveryLocation?.address || order.deliveryAddress}
                  </span>
                </div>
                {order.deliveryLocation?.lat && order.deliveryLocation?.lng && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${order.deliveryLocation.lat},${order.deliveryLocation.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#FF5C00]/20 hover:bg-[#FF5C00]/30 text-[#FF5C00] text-[10px] font-bold border border-[#FF5C00]/30 shrink-0 transition-colors"
                    title="เปิดแผนที่นำทาง Google Maps"
                  >
                    <Compass className="w-3 h-3" />
                    <span>แผนที่</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>

              {(order.deliveryLocation?.distanceKm !== undefined ||
                order.deliveryLocation?.buildingDetails ||
                order.deliveryLocation?.driverNote) && (
                <div className="text-[10px] text-stone-400 space-y-0.5 pt-1 border-t border-white/5">
                  {order.deliveryLocation?.distanceKm !== undefined && (
                    <div className="text-[#FF5C00] font-mono font-bold">
                      📍 ระยะทาง: ~{order.deliveryLocation.distanceKm} กม.
                      {order.deliveryFee ? ` (ค่าส่ง ฿${order.deliveryFee})` : ''}
                    </div>
                  )}
                  {order.deliveryLocation?.buildingDetails && (
                    <div className="text-amber-300">🏢 {order.deliveryLocation.buildingDetails}</div>
                  )}
                  {order.deliveryLocation?.driverNote && (
                    <div className="text-sky-300">💬 โน้ต: {order.deliveryLocation.driverNote}</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Order Items */}
          <div className="space-y-2.5 py-2.5 border-t border-b border-white/10 my-2">
            {order.items.map((it, idx) => {
              const isTakeaway = it.packagingType === 'takeaway';
              const isCustom = it.customDishDetails?.isCustomDish;
              const isPending = it.customDishDetails?.isPricePending || (isCustom && it.itemTotal === 0);
              const itemKey = `${order.id}-${it.id || idx}`;
              const isEditing = editingPriceKey === itemKey;

              return (
                <div key={idx} className="text-xs space-y-1">
                  <div className="flex justify-between items-start font-medium text-white gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <strong className="text-[#FF5C00] font-mono font-black text-sm">{it.quantity}x</strong>
                      {isCustom && (
                        <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-[#FF5C00]/20 text-[#FF5C00] border border-[#FF5C00]/30">
                          ✨ เมนูพิเศษ
                        </span>
                      )}
                      <span className="font-bold">{it.menuItem.name}</span>
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.2 rounded ${
                          isTakeaway
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-white/10 text-stone-300'
                        }`}
                      >
                        {isTakeaway ? '🛍️ กลับบ้าน' : '🍽️ ทานร้าน'}
                      </span>
                      {it.round && (
                        <span className="text-[9px] font-mono text-stone-400">
                          (ร.{it.round})
                        </span>
                      )}
                    </div>

                    <div className="shrink-0 flex items-center gap-1">
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            autoFocus
                            value={priceInput}
                            onChange={(e) => setPriceInput(e.target.value)}
                            placeholder="ราคา"
                            className="w-14 px-1 py-0.5 rounded bg-[#0A0A0B] border border-[#FF5C00] text-xs font-mono font-bold text-white text-right"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const p = parseFloat(priceInput);
                              if (!isNaN(p) && p >= 0) {
                                updateOrderItemPrice(order.id, it.id, p);
                                setEditingPriceKey(null);
                                showToast(`ระบุราคา ฿${p} สำเร็จ!`, 'success');
                              }
                            }}
                            className="px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold"
                          >
                            บันทึก
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          {isPending ? (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPriceKey(itemKey);
                                setPriceInput(String(it.menuItem.price || ''));
                              }}
                              className="px-1.5 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-0.5"
                            >
                              <Edit3 className="w-2.5 h-2.5" />
                              <span>ใส่ราคา</span>
                            </button>
                          ) : (
                            <div className="flex items-center gap-1">
                              <span className="font-mono text-stone-300 text-[11px] font-bold">฿{it.itemTotal}</span>
                              {isCustom && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingPriceKey(itemKey);
                                    setPriceInput(String(it.menuItem.price || ''));
                                  }}
                                  className="text-stone-500 hover:text-[#FF5C00]"
                                >
                                  <Edit3 className="w-2.5 h-2.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {it.selectedOptions && it.selectedOptions.length > 0 && (
                    <div className="pl-6 text-[11px] text-stone-400 font-normal">
                      {it.selectedOptions.map((o) => o.choiceName).join(', ')}
                    </div>
                  )}

                  {/* Excluded Ingredients in KDS (High visibility for kitchen) */}
                  {it.excludedIngredients && it.excludedIngredients.length > 0 && (
                    <div className="pl-6 flex flex-wrap gap-1 pt-0.5">
                      <span className="text-[10px] font-black text-rose-400 uppercase tracking-wider flex items-center gap-0.5">
                        <Ban className="w-3 h-3 text-rose-400" />
                        <span>ไม่อยากใส่:</span>
                      </span>
                      {it.excludedIngredients.map((ex, exIdx) => (
                        <span
                          key={exIdx}
                          className="text-[10px] font-black px-1.5 py-0.2 rounded bg-rose-950/80 text-rose-200 border border-rose-500/60"
                        >
                          {ex}
                        </span>
                      ))}
                    </div>
                  )}

                  {it.specialInstructions && (
                    <div className="pl-6 text-[10px] text-[#FF5C00] font-bold italic">
                      * {it.specialInstructions}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Notes */}
          {order.notes && (
            <p className="text-[11px] text-[#FF5C00] bg-[#FF5C00]/10 p-2 rounded-xl border border-[#FF5C00]/20 mb-2 font-medium">
              หมายเหตุ: {order.notes}
            </p>
          )}

          {/* Uploaded Slip Badge */}
          {order.slipImage && (
            <div className="mb-2">
              <button
                type="button"
                onClick={() => setViewingSlipOrder(order)}
                className="w-full p-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300 font-bold transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-black/40 overflow-hidden border border-emerald-500/40 shrink-0">
                    <img
                      src={order.slipImage}
                      alt="Slip Thumbnail"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span>🧾 ตรวจสอบสลิปโอนเงิน</span>
                </div>
                <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-200">
                  คลิกดูรูป
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Card Actions & Advance Status */}
        <div className="pt-3 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-stone-400 font-bold uppercase text-[10px] tracking-wider">ยอดชำระ:</span>
            <span className="font-mono font-black text-[#FF5C00] text-sm">฿{order.total.toLocaleString()}</span>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => setReceiptOrder(order)}
              className="p-2 rounded-xl bg-[#0A0A0B] hover:bg-[#202024] border border-white/10 text-stone-300 hover:text-white transition-colors cursor-pointer"
              title="ดูใบเสร็จ / พิมพ์สลิป"
            >
              <Printer className="w-4 h-4" />
            </button>

            {order.slipImage && (
              <button
                onClick={() => setViewingSlipOrder(order)}
                className="p-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 transition-colors cursor-pointer"
                title="ดูรูปภาพสลิปการโอนเงิน"
              >
                <ImageIcon className="w-4 h-4" />
              </button>
            )}

            {/* Workflow Transition Buttons */}
            {order.orderStatus === 'pending' && (
              <button
                id={`btn-start-cooking-${order.id}`}
                onClick={() => updateOrderStatus(order.id, 'cooking')}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#FF5C00] hover:bg-[#FF7729] text-white font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>เริ่มปรุงอาหาร (Start)</span>
              </button>
            )}

            {order.orderStatus === 'cooking' && (
              <button
                id={`btn-mark-ready-${order.id}`}
                onClick={() => updateOrderStatus(order.id, 'ready')}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
              >
                <ChefHat className="w-3.5 h-3.5" />
                <span>ปรุงเสร็จแล้ว (Ready)</span>
              </button>
            )}

            {(order.orderStatus === 'ready' || order.orderStatus === 'delivering') && (
              <button
                id={`btn-mark-complete-${order.id}`}
                onClick={() => updateOrderStatus(order.id, 'completed')}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
                title={order.orderType === 'dine_in' ? 'เสิร์ฟสำเร็จและเคลียร์โต๊ะอัตโนมัติ' : 'เสร็จสิ้นออเดอร์'}
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>{order.orderType === 'dine_in' ? 'เสิร์ฟเสร็จ & ปิดบิลโต๊ะ' : 'เสร็จสิ้น (Complete)'}</span>
              </button>
            )}

            {order.orderStatus === 'completed' && (
              <div className="flex-1 flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-2.5 py-1.5 rounded-xl flex items-center gap-1.5">
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>เสร็จสิ้น & ชำระแล้ว</span>
                </span>
                <button
                  type="button"
                  id={`btn-delete-order-${order.id}`}
                  onClick={() => setOrderToDelete(order)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-bold transition-all cursor-pointer"
                  title="ลบออเดอร์นี้จากประวัติ"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>ลบ</span>
                </button>
              </div>
            )}

            {order.orderStatus === 'cancelled' && (
              <div className="flex-1 flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-rose-400 bg-rose-950/50 border border-rose-500/30 px-2.5 py-1.5 rounded-xl flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>ยกเลิกแล้ว</span>
                </span>
                <button
                  type="button"
                  id={`btn-delete-cancelled-order-${order.id}`}
                  onClick={() => setOrderToDelete(order)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-bold transition-all cursor-pointer"
                  title="ลบออเดอร์นี้จากระบบ"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>ลบ</span>
                </button>
              </div>
            )}

            {order.orderStatus !== 'completed' && order.orderStatus !== 'cancelled' && (
              <button
                onClick={() => cancelOrder(order.id)}
                className="p-2 rounded-xl bg-[#0A0A0B] hover:bg-rose-950/80 border border-white/10 text-stone-500 hover:text-rose-400 transition-colors cursor-pointer"
                title="ยกเลิกออเดอร์"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div id="admin-kds-view" className="space-y-6 pb-12">
      
      {/* Top Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#111112] p-4 rounded-3xl border border-white/10">
        
        {/* Dining Type Filter */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto no-scrollbar">
          {[
            { id: 'all', label: 'ทั้งหมด' },
            { id: 'dine_in', label: '🍽️ ทานที่ร้าน' },
            { id: 'pickup', label: '🛍️ รับกลับ' },
            { id: 'delivery', label: '🛵 เดลิเวอรี่' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedTypeFilter(f.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedTypeFilter === f.id
                  ? 'bg-[#FF5C00] text-white font-black shadow-sm'
                  : 'bg-[#161618] text-stone-400 hover:text-white border border-white/10'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search by Order # or Table # */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
          <input
            type="text"
            placeholder="ค้นหาเลขที่บิล, โต๊ะ, ชื่อ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 rounded-xl bg-[#0A0A0B] border border-white/10 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#FF5C00] font-medium"
          />
        </div>
      </div>

      {/* Kanban Workflow Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Column 1: Pending / New Orders */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FF5C00]/10 border border-[#FF5C00]/30">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#FF5C00] animate-ping" />
              <h4 className="font-display font-black text-sm text-[#FF5C00] uppercase tracking-wider">1. รอรับ & เตรียมคิว</h4>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-[#FF5C00] text-white text-xs font-black font-mono">
              {pendingOrders.length}
            </span>
          </div>

          <div className="space-y-4">
            {pendingOrders.length === 0 ? (
              <div className="p-8 text-center bg-[#111112] rounded-2xl border border-dashed border-white/10 text-stone-500 text-xs font-medium">
                ไม่มีออเดอร์รอรับคิว
              </div>
            ) : (
              pendingOrders.map(renderOrderCard)
            )}
          </div>
        </div>

        {/* Column 2: In Kitchen Cooking */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-orange-500/10 border border-orange-500/30">
            <div className="flex items-center gap-2">
              <ChefHat className="w-4 h-4 text-orange-400" />
              <h4 className="font-display font-black text-sm text-orange-300 uppercase tracking-wider">2. กำลังปรุงในครัว</h4>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-orange-500 text-white text-xs font-black font-mono">
              {cookingOrders.length}
            </span>
          </div>

          <div className="space-y-4">
            {cookingOrders.length === 0 ? (
              <div className="p-8 text-center bg-[#111112] rounded-2xl border border-dashed border-white/10 text-stone-500 text-xs font-medium">
                ครัวว่าง พร้อมรับออเดอร์ใหม่
              </div>
            ) : (
              cookingOrders.map(renderOrderCard)
            )}
          </div>
        </div>

        {/* Column 3: Ready for Serving / Dispatch */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4 text-emerald-400" />
              <h4 className="font-display font-black text-sm text-emerald-300 uppercase tracking-wider">3. พร้อมเสิร์ฟ / จัดส่ง</h4>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-white text-xs font-black font-mono">
              {readyOrders.length}
            </span>
          </div>

          <div className="space-y-4">
            {readyOrders.length === 0 ? (
              <div className="p-8 text-center bg-[#111112] rounded-2xl border border-dashed border-white/10 text-stone-500 text-xs font-medium">
                ไม่มีอาหารรอเสิร์ฟ
              </div>
            ) : (
              readyOrders.map(renderOrderCard)
            )}
          </div>
        </div>
      </div>

      {/* Completed Orders Accordion / History */}
      {completedOrders.length > 0 && (
        <div className="mt-10 p-6 rounded-3xl bg-[#111112] border border-white/10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div>
              <h4 className="font-display font-black text-sm text-stone-200 flex items-center gap-2 uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>ประวัติออเดอร์ที่เสร็จสมบูรณ์วันนี้ ({completedOrders.length} รายการ)</span>
              </h4>
              <p className="text-xs text-stone-400 mt-0.5">
                ยอดขายรวมที่เสร็จสิ้น: <strong className="text-emerald-400 font-mono font-bold">฿{completedOrders.reduce((sum, o) => sum + o.total, 0).toLocaleString()}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              {completedOrders.length > 6 && (
                <button
                  type="button"
                  id="btn-toggle-show-all-completed"
                  onClick={() => setShowAllCompleted(!showAllCompleted)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#161618] hover:bg-[#202024] text-stone-300 hover:text-white border border-white/10 text-xs font-bold transition-colors cursor-pointer"
                >
                  {showAllCompleted ? (
                    <>
                      <ChevronUp className="w-3.5 h-3.5" />
                      <span>ย่อเหลือ 6 รายการ</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" />
                      <span>ดูทั้งหมด ({completedOrders.length})</span>
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                id="btn-clear-all-completed-orders"
                onClick={() => setIsConfirmingClearAll(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-bold transition-all cursor-pointer shadow-sm"
                title="ล้างประวัติออเดอร์ที่เสร็จสมบูรณ์ทั้งหมด"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ลบประวัติที่เสร็จทั้งหมด</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(showAllCompleted ? completedOrders : completedOrders.slice(0, 6)).map(renderOrderCard)}
          </div>

          {!showAllCompleted && completedOrders.length > 6 && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setShowAllCompleted(true)}
                className="text-xs text-stone-400 hover:text-white font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <span>ดูออเดอร์ที่เสร็จสมบูรณ์เพิ่มเติมอีก {completedOrders.length - 6} รายการ...</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Delete Single Order Confirmation Modal */}
      <AnimatePresence>
        {orderToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOrderToDelete(null)}
              className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-[#161618] border-2 border-rose-500/50 rounded-3xl p-6 shadow-2xl z-10 space-y-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-display font-black text-base text-white">
                    ยืนยันลบประวัติออเดอร์
                  </h4>
                  <p className="text-xs text-stone-300 mt-1">
                    คุณต้องการลบออเดอร์ <strong className="text-white font-mono">{orderToDelete.orderNumber}</strong> ({orderToDelete.customerName}) ยอดรวม <strong>฿{orderToDelete.total.toLocaleString()}</strong> ออกจากระบบใช่หรือไม่?
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#0A0A0B] border border-white/5 text-xs text-stone-400 space-y-1">
                <div className="flex justify-between">
                  <span>ประเภทการสั่ง:</span>
                  <span className="text-white font-medium">
                    {orderToDelete.orderType === 'dine_in' ? `ทานที่ร้าน (โต๊ะ ${orderToDelete.tableNumber})` : orderToDelete.orderType === 'delivery' ? 'เดลิเวอรี่' : 'รับกลับบ้าน'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>จำนวนเมนู:</span>
                  <span className="text-white font-medium">
                    {orderToDelete.items.reduce((s, i) => s + i.quantity, 0)} รายการ
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  id="btn-cancel-delete-single-order"
                  onClick={() => setOrderToDelete(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  id="btn-confirm-delete-single-order"
                  onClick={() => {
                    deleteOrder(orderToDelete.id);
                    setOrderToDelete(null);
                  }}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-rose-950 transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>ยืนยันลบออเดอร์นี้</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Clear All Completed Orders Confirmation Modal */}
      <AnimatePresence>
        {isConfirmingClearAll && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsConfirmingClearAll(false)}
              className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-[#161618] border-2 border-rose-500/50 rounded-3xl p-6 shadow-2xl z-10 space-y-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-display font-black text-base text-white">
                    ยืนยันลบประวัติออเดอร์ที่เสร็จสมบูรณ์ทั้งหมด
                  </h4>
                  <p className="text-xs text-stone-300 mt-1">
                    การดำเนินการนี้จะลบประวัติออเดอร์ที่เสร็จสิ้นทั้งหมดจำนวน <strong className="text-rose-400 font-bold">{completedOrders.length} รายการ</strong> ออกจากหน้าครัวทันที
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  id="btn-cancel-clear-all-completed"
                  onClick={() => setIsConfirmingClearAll(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  id="btn-confirm-clear-all-completed"
                  onClick={() => {
                    clearCompletedOrders();
                    setIsConfirmingClearAll(false);
                  }}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-rose-950 transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>ยืนยันลบทั้งหมด ({completedOrders.length} รายการ)</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Thermal Receipt Print Modal */}
      <ReceiptModal order={receiptOrder} onClose={() => setReceiptOrder(null)} />

      {/* Slip Image Lightbox Modal */}
      <AnimatePresence>
        {viewingSlipOrder && viewingSlipOrder.slipImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className="relative max-w-lg w-full bg-[#111112] rounded-3xl border border-white/15 p-5 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <h4 className="font-bold text-white text-base flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-emerald-400" />
                    <span>สลิปโอนเงิน ออเดอร์ #{viewingSlipOrder.orderNumber}</span>
                  </h4>
                  <p className="text-xs text-stone-400 font-mono mt-0.5">
                    ลูกค้า: {viewingSlipOrder.customerName} ({viewingSlipOrder.customerPhone}) • ยอดชำระ ฿{viewingSlipOrder.total.toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setViewingSlipOrder(null)}
                  className="p-1.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="rounded-2xl overflow-hidden bg-black max-h-[65vh] flex items-center justify-center border border-white/10 shadow-inner">
                <img
                  src={viewingSlipOrder.slipImage}
                  alt={`Slip for order ${viewingSlipOrder.orderNumber}`}
                  className="max-h-[60vh] w-auto object-contain"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20">
                  ✓ ชำระผ่าน พร้อมเพย์ QR
                </span>
                <button
                  type="button"
                  onClick={() => setViewingSlipOrder(null)}
                  className="px-5 py-2 rounded-xl bg-[#FF5C00] hover:bg-[#FF7729] text-white text-xs font-bold transition-all cursor-pointer"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
