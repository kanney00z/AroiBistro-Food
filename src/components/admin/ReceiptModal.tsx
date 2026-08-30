import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Printer, CheckCircle2, Sparkles } from 'lucide-react';
import { Order } from '../../types';
import { useRestaurant } from '../../context/RestaurantContext';

interface ReceiptModalProps {
  order: Order | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ order, onClose }) => {
  const { settings, showToast } = useRestaurant();

  if (!order) return null;

  const handlePrint = () => {
    showToast('กำลังส่งคำสั่งพิมพ์ไปยังเครื่องพิมพ์สลิปความร้อน (Thermal Printer)...', 'info');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-stone-950/85 backdrop-blur-md"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          className="relative w-full max-w-sm bg-[#111112] rounded-3xl border border-white/10 shadow-2xl overflow-hidden z-10 my-auto flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#0A0A0B]">
            <h4 className="text-sm font-display font-black text-white flex items-center gap-1.5 uppercase">
              <Printer className="w-4 h-4 text-[#FF5C00]" />
              <span>พิมพ์ใบเสร็จรับเงิน / สลิปครัว</span>
            </h4>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-[#161618] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Thermal Paper Look-alike Container */}
          <div className="p-6 bg-[#FAFAF9] text-stone-950 font-mono text-xs shadow-inner space-y-4 select-all">
            <div className="text-center space-y-1">
              <h3 className="font-black text-base tracking-tight">{settings.name}</h3>
              <p className="text-[10px] text-stone-700 font-bold">{settings.nameEn}</p>
              <p className="text-[9px] text-stone-600 leading-tight">{settings.address}</p>
              <p className="text-[10px] text-stone-700">โทร: {settings.phone}</p>
            </div>

            <div className="border-t border-b border-dashed border-stone-400 py-2 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>เลขที่บิล:</span>
                <strong className="font-bold">{order.orderNumber}</strong>
              </div>
              <div className="flex justify-between">
                <span>วันที่-เวลา:</span>
                <span>{new Date(order.createdAt).toLocaleString('th-TH')}</span>
              </div>
              <div className="flex justify-between">
                <span>ประเภท:</span>
                <span className="font-bold uppercase">
                  {order.orderType === 'dine_in' ? `ทานที่ร้าน (โต๊ะ ${order.tableNumber})` : 'รับกลับบ้าน (Takeaway)'}
                </span>
              </div>
              {(order.roundsCount || 1) > 1 && (
                <div className="flex justify-between font-bold text-amber-800">
                  <span>สั่งอาหารสะสม:</span>
                  <span>รวม {order.roundsCount} รอบ</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>ลูกค้า:</span>
                <span>{order.customerName} ({order.customerPhone})</span>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-2">
              <div className="flex justify-between font-bold border-b border-dashed border-stone-400 pb-1">
                <span>รายการ</span>
                <span>รวม (฿)</span>
              </div>

              {order.items.map((it, idx) => {
                const isTakeaway = it.packagingType === 'takeaway';
                return (
                  <div key={idx} className="space-y-0.5">
                    <div className="flex justify-between items-start">
                      <span className="font-medium">
                        <strong className="font-bold mr-1">{it.quantity}x</strong>
                        {it.menuItem.name}
                        <span className="text-[9px] font-bold ml-1 px-1 py-0.2 rounded bg-stone-200">
                          {isTakeaway ? '🛍️ กลับบ้าน' : '🍽️ ทานร้าน'}
                        </span>
                        {it.round && (
                          <span className="text-[9px] text-stone-500 ml-1">
                            (ร.{it.round})
                          </span>
                        )}
                      </span>
                      <span className="font-bold">{it.itemTotal.toFixed(2)}</span>
                    </div>
                    {it.selectedOptions.length > 0 && (
                      <div className="pl-3 text-[10px] text-stone-600">
                        + {it.selectedOptions.map((o) => o.choiceName).join(', ')}
                      </div>
                    )}
                    {it.specialInstructions && (
                      <div className="pl-3 text-[10px] text-rose-700 italic font-semibold">
                        * {it.specialInstructions}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Totals */}
            <div className="border-t border-dashed border-stone-400 pt-2 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>ยอดรวมสินค้า:</span>
                <span>฿{order.subtotal.toFixed(2)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-rose-700 font-bold">
                  <span>ส่วนลด ({order.promoCodeApplied}):</span>
                  <span>-฿{order.discount.toFixed(2)}</span>
                </div>
              )}
              {order.serviceCharge > 0 && (
                <div className="flex justify-between">
                  <span>ค่าบริการ (Service Charge):</span>
                  <span>฿{order.serviceCharge.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black border-t border-stone-900 pt-1">
                <span>ยอดสุทธิ (Total):</span>
                <span>฿{order.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="text-center pt-3 border-t border-dashed border-stone-400 text-[10px] space-y-1">
              <p className="font-bold">ชำระผ่าน: {order.paymentMethod.toUpperCase()} (ชำระแล้ว ✓)</p>
              <p>ขอบพระคุณที่ใช้บริการ อร่อยบิสโทร</p>
              <p className="text-[9px] text-stone-500">VAT Included • ออกโดยระบบ AroiBistro POS</p>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-4 bg-[#0A0A0B] border-t border-white/10 flex gap-2">
            <button
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#FF5C00] hover:bg-[#FF7729] text-white font-black text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-lg shadow-[#FF5C00]/20"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์สลิป (Print Slip)</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-[#161618] hover:bg-[#202024] border border-white/10 text-stone-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
            >
              ปิด
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
