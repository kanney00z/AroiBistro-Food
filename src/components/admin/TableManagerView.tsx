import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Grid,
  Users,
  QrCode,
  CheckCircle2,
  Clock,
  Printer,
  X,
  Sparkles,
  UtensilsCrossed,
  Receipt,
  CreditCard,
  Banknote,
  Trash2,
  Check,
  Package,
  Ban,
  ChefHat,
  Edit3,
  ExternalLink,
  Copy,
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Table, TableStatus, Order } from '../../types';
import { QrCodeCard } from '../common/QrCodeCard';
import { buildTableOrderUrl } from '../../utils/qrCode';

export const TableManagerView: React.FC = () => {
  const {
    tables,
    updateTableStatus,
    updateTableGuestCount,
    clearTableBill,
    updateOrderItemPrice,
    orders,
    showToast,
    settings,
    scanTable,
    setIsAdminMode,
  } = useRestaurant();

  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [qrModalTable, setQrModalTable] = useState<Table | null>(null);
  const [billModalTable, setBillModalTable] = useState<{ table: Table; order: Order } | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'promptpay' | 'cash' | 'credit_card'>('promptpay');
  const [editingPriceItemId, setEditingPriceItemId] = useState<string | null>(null);
  const [customPriceInput, setCustomPriceInput] = useState<string>('');

  const zones = ['all', 'Main Hall', 'Terrace', 'VIP Room', 'Bar Area'];

  const filteredTables = tables.filter((t) => {
    if (selectedZone !== 'all' && t.zone !== selectedZone) return false;
    return true;
  });

  const statusColors: Record<TableStatus, { bg: string; text: string; border: string; label: string }> = {
    available: { bg: 'bg-emerald-950/30', text: 'text-emerald-400', border: 'border-emerald-500/40', label: 'ว่าง (Available)' },
    occupied: { bg: 'bg-[#FF5C00]/15', text: 'text-[#FF5C00]', border: 'border-[#FF5C00]/50', label: 'มีลูกค้า (Occupied)' },
    reserved: { bg: 'bg-blue-950/30', text: 'text-blue-400', border: 'border-blue-500/40', label: 'จองแล้ว (Reserved)' },
    billing: { bg: 'bg-purple-950/30', text: 'text-purple-400', border: 'border-purple-500/40', label: 'รอเช็คบิล (Billing)' },
  };

  const handleSettleAndClear = (tableId: string, tableNumber: string) => {
    clearTableBill(tableId);
    setBillModalTable(null);
  };

  return (
    <div id="admin-table-manager-view" className="space-y-6 pb-12">
      
      {/* Top Header & Zones Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#111112] p-6 rounded-3xl border border-white/10">
        <div>
          <h3 className="font-display font-black text-lg text-white uppercase tracking-wider">ผังโต๊ะ & จัดการเคลียร์บิล</h3>
          <p className="text-xs text-stone-400 mt-0.5 font-medium">
            ตรวจสถานะโต๊ะ รับชำระเงิน และเคลียร์บิลโต๊ะทันทีเมื่อลูกค้าจ่ายเงินเสร็จ
          </p>
        </div>

        {/* Zone Filter */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto no-scrollbar">
          {zones.map((z) => (
            <button
              key={z}
              onClick={() => setSelectedZone(z)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedZone === z
                  ? 'bg-[#FF5C00] text-white font-black shadow-md'
                  : 'bg-[#161618] text-stone-400 hover:text-white border border-white/10'
              }`}
            >
              {z === 'all' ? 'ทุกโซน' : z}
            </button>
          ))}
        </div>
      </div>

      {/* Table Status Legend Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#111112] border border-white/10 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <span className="label-caps">สถานะโต๊ะ:</span>
          {Object.entries(statusColors).map(([status, cfg]) => (
            <div key={status} className="flex items-center gap-1.5 font-bold">
              <span className={`w-3 h-3 rounded-full border ${cfg.border} ${cfg.bg}`} />
              <span className="text-stone-300">{cfg.label}</span>
            </div>
          ))}
        </div>

        <div className="text-[11px] text-stone-400 font-medium">
          💡 เมื่อลูกค้าจ่ายเงินเสร็จ กดปุ่ม <strong className="text-emerald-400">"จ่ายเงิน & เคลียร์โต๊ะ"</strong> เพื่อเปิดโต๊ะว่างทันที
        </div>
      </div>

      {/* Tables Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredTables.map((table) => {
          const cfg = statusColors[table.status];
          const activeOrder = orders.find(
            (o) =>
              o.id === table.currentOrderId ||
              o.orderNumber === table.currentOrderId ||
              (o.tableNumber === table.number && o.orderStatus !== 'completed' && o.orderStatus !== 'cancelled')
          );

          const isOccupiedOrBilling = table.status === 'occupied' || table.status === 'billing' || !!activeOrder;

          return (
            <div
              key={table.id}
              id={`table-card-${table.id}`}
              className={`p-5 rounded-3xl border ${cfg.border} ${cfg.bg} backdrop-blur-md flex flex-col justify-between shadow-xl space-y-4 transition-all`}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-display font-black text-2xl text-white font-mono">
                      {table.number}
                    </h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#0A0A0B] border border-white/10 text-stone-400 font-bold uppercase">
                      {table.zone}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-stone-400 mt-1 font-medium">
                    <Users className="w-3.5 h-3.5" />
                    <span>{table.capacity} ที่นั่ง</span>
                    {table.guestCount && table.guestCount > 0 ? (
                      <span className="text-stone-300 font-bold">({table.guestCount} ท่าน)</span>
                    ) : null}
                  </div>
                </div>

                {/* QR Code button */}
                <button
                  id={`btn-table-qr-${table.id}`}
                  onClick={() => setQrModalTable(table)}
                  className="w-10 h-10 rounded-2xl bg-[#0A0A0B] hover:bg-[#202024] border border-white/10 text-[#FF5C00] flex items-center justify-center transition-all hover:scale-105 cursor-pointer shadow-md"
                  title="ดู/พิมพ์ QR Code โต๊ะนี้"
                >
                  <QrCode className="w-5 h-5" />
                </button>
              </div>

              {/* Status Switcher Select */}
              <div className="space-y-1.5">
                <label className="label-caps block">
                  สถานะโต๊ะ
                </label>
                <select
                  value={table.status}
                  onChange={(e) => updateTableStatus(table.id, e.target.value as TableStatus)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0A0A0B] border border-white/10 text-xs text-white font-bold focus:outline-none focus:border-[#FF5C00] cursor-pointer"
                >
                  <option value="available">🟢 ว่าง (Available)</option>
                  <option value="occupied">🟡 มีลูกค้า (Occupied)</option>
                  <option value="reserved">🔵 จองแล้ว (Reserved)</option>
                  <option value="billing">🟣 กำลังเช็คบิล (Billing)</option>
                </select>
              </div>

              {/* Active Order snippet if occupied */}
              {activeOrder && (
                <div className="p-3.5 rounded-2xl bg-[#0A0A0B] border border-white/10 text-xs space-y-2">
                  <div className="flex items-center justify-between text-stone-400">
                    <span className="flex items-center gap-1 font-medium">
                      <Receipt className="w-3.5 h-3.5 text-[#FF5C00]" />
                      บิลปัจจุบัน:
                    </span>
                    <div className="flex items-center gap-1">
                      <strong className="font-mono text-[#FF5C00] font-black">#{activeOrder.orderNumber}</strong>
                      {(activeOrder.roundsCount || 1) > 1 && (
                        <span className="text-[9px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.2 rounded border border-amber-500/30">
                          รอบ {activeOrder.roundsCount}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-white font-medium pt-1 border-t border-white/5">
                    <span className="text-stone-400">ยอดรวมทั้งสิ้น:</span>
                    <span className="font-mono font-black text-emerald-400 text-sm">
                      ฿{activeOrder.total.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Quick Bill Clearing Actions */}
              {isOccupiedOrBilling ? (
                <div className="pt-2 flex flex-col gap-2">
                  <button
                    id={`btn-clear-table-${table.id}`}
                    onClick={() => handleSettleAndClear(table.id, table.number)}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-900/30 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>จ่ายเงินแล้ว เคลียร์บิลโต๊ะ</span>
                  </button>

                  {activeOrder && (
                    <button
                      onClick={() => setBillModalTable({ table, order: activeOrder })}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#0A0A0B] hover:bg-[#161618] border border-white/10 text-stone-300 hover:text-white font-bold text-xs transition-colors cursor-pointer"
                    >
                      <Receipt className="w-3.5 h-3.5 text-[#FF5C00]" />
                      <span>ดูรายละเอียดบิล & เช็คบิล</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="py-2 text-center text-xs font-bold text-emerald-400/80 bg-emerald-950/20 rounded-xl border border-emerald-500/20">
                  ✓ โต๊ะว่าง พร้อมรับลูกค้า
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bill & Settlement Modal */}
      <AnimatePresence>
        {billModalTable && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setBillModalTable(null)}
              className="fixed inset-0 bg-black/85 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              className="relative w-full max-w-lg bg-[#111112] rounded-3xl border border-white/10 shadow-2xl overflow-hidden z-10 my-auto flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#0A0A0B]">
                <div>
                  <h4 className="text-base font-display font-black text-white">
                    เช็คบิล & ชำระเงิน: โต๊ะ {billModalTable.table.number}
                  </h4>
                  <p className="text-xs text-stone-400 mt-0.5">
                    บิล #{billModalTable.order.orderNumber} • รวม {billModalTable.order.roundsCount || 1} รอบ
                  </p>
                </div>
                <button
                  onClick={() => setBillModalTable(null)}
                  className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-[#161618] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
                
                {/* Items List */}
                <div className="p-4 rounded-2xl bg-[#0A0A0B] border border-white/10 space-y-3">
                  <div className="flex justify-between text-xs font-bold text-stone-400 border-b border-white/10 pb-2">
                    <span>รายการอาหาร ({billModalTable.order.items.length} รายการ)</span>
                    <span>รวม (฿)</span>
                  </div>

                  <div className="space-y-2.5 divide-y divide-white/5">
                    {billModalTable.order.items.map((it, idx) => {
                      const isCustom = it.customDishDetails?.isCustomDish;
                      const isPending = it.customDishDetails?.isPricePending || (isCustom && it.itemTotal === 0);
                      const isEditing = editingPriceItemId === (it.id || String(idx));

                      return (
                        <div key={idx} className="pt-2.5 first:pt-0 flex justify-between items-start text-xs gap-3">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {isCustom && (
                                <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-[#FF5C00]/20 text-[#FF5C00] border border-[#FF5C00]/30 flex items-center gap-1">
                                  <ChefHat className="w-2.5 h-2.5" />
                                  <span>เมนูพิเศษ</span>
                                </span>
                              )}
                              <span className="font-bold text-white">
                                {it.quantity}x {it.menuItem.name}
                              </span>
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                  it.packagingType === 'takeaway'
                                    ? 'bg-amber-500/20 text-amber-300'
                                    : 'bg-white/10 text-stone-300'
                                }`}
                              >
                                {it.packagingType === 'takeaway' ? '🛍️ กลับบ้าน' : '🍽️ ทานร้าน'}
                              </span>
                              {it.round && (
                                <span className="text-[9px] font-mono text-stone-500">
                                  (รอบ {it.round})
                                </span>
                              )}
                            </div>

                            {it.selectedOptions && it.selectedOptions.length > 0 && (
                              <p className="text-[11px] text-stone-400">
                                + {it.selectedOptions.map((o) => o.choiceName).join(', ')}
                              </p>
                            )}

                            {it.excludedIngredients && it.excludedIngredients.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-0.5">
                                {it.excludedIngredients.map((ex, exIdx) => (
                                  <span
                                    key={exIdx}
                                    className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-950/60 text-rose-300 border border-rose-500/30 flex items-center gap-0.5"
                                  >
                                    <Ban className="w-2.5 h-2.5 text-rose-400" />
                                    <span>{ex}</span>
                                  </span>
                                ))}
                              </div>
                            )}

                            {it.specialInstructions && (
                              <p className="text-[10px] text-[#FF5C00] font-medium italic">
                                * {it.specialInstructions}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {isEditing ? (
                              <div className="flex items-center gap-1">
                                <span className="text-stone-400 text-xs">฿</span>
                                <input
                                  type="number"
                                  min="0"
                                  autoFocus
                                  value={customPriceInput}
                                  onChange={(e) => setCustomPriceInput(e.target.value)}
                                  className="w-16 px-1.5 py-0.5 rounded bg-[#161618] border border-[#FF5C00] text-xs font-mono font-bold text-white text-right focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const parsed = parseFloat(customPriceInput);
                                    if (!isNaN(parsed) && parsed >= 0) {
                                      updateOrderItemPrice(billModalTable.order.id, it.id, parsed);
                                      // Update local state modal reference
                                      const updatedOrder = orders.find((o) => o.id === billModalTable.order.id);
                                      if (updatedOrder) {
                                        setBillModalTable((prev) => (prev ? { ...prev, order: updatedOrder } : null));
                                      }
                                      setEditingPriceItemId(null);
                                      showToast(`อัปเดตราคาเมนู "${it.menuItem.name}" เป็น ฿${parsed} เรียบร้อยแล้ว`, 'success');
                                    }
                                  }}
                                  className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold cursor-pointer"
                                >
                                  บันทึก
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingPriceItemId(null)}
                                  className="px-1.5 py-0.5 text-stone-400 hover:text-stone-200 text-[10px] cursor-pointer"
                                >
                                  ยกเลิก
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                {isPending ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingPriceItemId(it.id || String(idx));
                                      setCustomPriceInput(String(it.menuItem.price || ''));
                                    }}
                                    className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                  >
                                    <Edit3 className="w-2.5 h-2.5" />
                                    <span>ระบุราคา</span>
                                  </button>
                                ) : (
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono font-bold text-white">
                                      ฿{it.itemTotal.toLocaleString()}
                                    </span>
                                    {isCustom && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingPriceItemId(it.id || String(idx));
                                          setCustomPriceInput(String(it.menuItem.price || ''));
                                        }}
                                        title="แก้ไขราคาเมนูสั่งทำ"
                                        className="text-stone-500 hover:text-[#FF5C00] p-0.5 cursor-pointer"
                                      >
                                        <Edit3 className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="p-4 rounded-2xl bg-[#161618] border border-white/10 space-y-2 text-xs">
                  <div className="flex justify-between text-stone-400">
                    <span>ยอดรวมค่าอาหาร:</span>
                    <span className="font-mono text-white">฿{billModalTable.order.subtotal.toLocaleString()}</span>
                  </div>

                  {billModalTable.order.discount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>ส่วนลดโปรโมชั่น:</span>
                      <span className="font-mono">-฿{billModalTable.order.discount.toLocaleString()}</span>
                    </div>
                  )}

                  {billModalTable.order.serviceCharge > 0 && (
                    <div className="flex justify-between text-stone-400">
                      <span>Service Charge (10%):</span>
                      <span className="font-mono text-white">฿{billModalTable.order.serviceCharge.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-white/10 flex justify-between items-center text-sm font-bold">
                    <span className="text-white font-black uppercase">ยอดชำระสุทธิ:</span>
                    <span className="font-mono font-black text-2xl text-emerald-400">
                      ฿{billModalTable.order.total.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div className="space-y-2">
                  <label className="label-caps block">ช่องทางชำระเงินที่ลูกค้าเลือก</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'promptpay', label: 'PromptPay QR', icon: QrCode },
                      { id: 'cash', label: 'เงินสด (Cash)', icon: Banknote },
                      { id: 'credit_card', label: 'บัตรเครดิต', icon: CreditCard },
                    ].map((pm) => {
                      const Icon = pm.icon;
                      const isSelected = selectedPaymentMethod === pm.id;
                      return (
                        <button
                          key={pm.id}
                          type="button"
                          onClick={() => setSelectedPaymentMethod(pm.id as any)}
                          className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#FF5C00]/15 border-[#FF5C00] text-white font-bold'
                              : 'bg-[#0A0A0B] border-white/10 text-stone-400 hover:text-white'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-[#FF5C00]' : ''}`} />
                          <span className="text-[11px]">{pm.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-5 border-t border-white/10 bg-[#0A0A0B] flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    handleSettleAndClear(billModalTable.table.id, billModalTable.table.number);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider shadow-xl shadow-emerald-900/30 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>บันทึกรับเงิน & เคลียร์บิลโต๊ะทันที</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBillModalTable(null)}
                  className="px-4 py-3.5 rounded-2xl bg-[#161618] hover:bg-[#202024] border border-white/10 text-stone-300 text-xs font-bold cursor-pointer"
                >
                  ยกเลิก
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QR Code Modal for Table */}
      <AnimatePresence>
        {qrModalTable && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setQrModalTable(null)}
              className="fixed inset-0 bg-black/85 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              className="relative w-full max-w-sm bg-[#111112] rounded-3xl border border-white/10 shadow-2xl overflow-hidden z-10 my-auto flex flex-col p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#FF5C00]/20 border border-[#FF5C00]/40 flex items-center justify-center text-[#FF5C00]">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-display font-black text-white uppercase tracking-wider">
                      QR Code โต๊ะ {qrModalTable.number}
                    </h4>
                    <p className="text-[10px] text-stone-400 font-medium">
                      โซน: {qrModalTable.zone} • รองรับ {qrModalTable.seats} ที่นั่ง
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setQrModalTable(null)}
                  className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-[#161618] border border-transparent hover:border-white/10 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Dynamic QR Code Card with Real QR Code Generation */}
              <QrCodeCard
                url={buildTableOrderUrl(qrModalTable.number)}
                title={`โต๊ะ ${qrModalTable.number}`}
                tableNumber={qrModalTable.number}
                zone={qrModalTable.zone}
                showSimulateButton={true}
                onSimulateScan={() => {
                  const targetNum = qrModalTable.number;
                  setQrModalTable(null);
                  scanTable(targetNum);
                  setIsAdminMode(false);
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
