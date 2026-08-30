import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Tag,
  Plus,
  CheckCircle2,
  XCircle,
  Percent,
  DollarSign,
  Gift,
  Trash2,
  AlertTriangle,
  X,
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { PromoCode } from '../../types';

export const PromoManagerView: React.FC = () => {
  const { promos, togglePromoActive, addPromo, deletePromo } = useRestaurant();

  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [value, setValue] = useState(10);
  const [minOrder, setMinOrder] = useState(300);
  const [maxDiscount, setMaxDiscount] = useState<number | undefined>(100);
  const [description, setDescription] = useState('');
  const [promoToDelete, setPromoToDelete] = useState<PromoCode | null>(null);

  const handleCreatePromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    const newPromo: PromoCode = {
      code: code.trim().toUpperCase(),
      discountType,
      value: Number(value),
      minOrder: Number(minOrder),
      maxDiscount: discountType === 'percentage' && maxDiscount ? Number(maxDiscount) : undefined,
      active: true,
      description: description || `ส่วนลด ${value}${discountType === 'percentage' ? '%' : '฿'} เมื่อสั่งครบ ฿${minOrder}`,
    };

    addPromo(newPromo);
    setCode('');
    setDescription('');
  };

  const handleConfirmDelete = () => {
    if (promoToDelete) {
      deletePromo(promoToDelete.code);
      setPromoToDelete(null);
    }
  };

  return (
    <div id="admin-promo-manager-view" className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="bg-[#111112] p-6 rounded-3xl border border-white/10">
        <h3 className="font-display font-black text-lg text-white uppercase tracking-wider">โปรโมชั่น & คูปองส่วนลด</h3>
        <p className="text-xs text-stone-400 mt-0.5 font-medium">
          สร้างและจัดการโค้ดส่วนลดเพื่อกระตุ้นยอดขายและดึงดูดลูกค้า
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Create New Promo Code Form */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-[#111112] border border-white/10 shadow-xl space-y-4">
          <h4 className="font-display font-black text-sm text-white flex items-center gap-2 uppercase tracking-wider">
            <Plus className="w-4 h-4 text-[#FF5C00]" />
            <span>สร้างโค้ดส่วนลดใหม่</span>
          </h4>

          <form onSubmit={handleCreatePromo} className="space-y-4">
            <div>
              <label className="label-caps block mb-1">
                รหัสโค้ด (Promo Code) *
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="เช่น AROI20, CHEF50"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0B] border border-white/10 text-sm font-mono uppercase tracking-wider text-white focus:outline-none focus:border-[#FF5C00] font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-caps block mb-1">
                  ประเภทส่วนลด
                </label>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0A0A0B] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF5C00] font-bold cursor-pointer"
                >
                  <option value="percentage">เปอร์เซ็นต์ (%)</option>
                  <option value="fixed">จำนวนเงินคงที่ (฿)</option>
                </select>
              </div>

              <div>
                <label className="label-caps block mb-1">
                  มูลค่าส่วนลด *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={value}
                  onChange={(e) => setValue(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-[#0A0A0B] border border-white/10 text-xs font-mono text-white font-bold focus:outline-none focus:border-[#FF5C00]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-caps block mb-1">
                  ยอดสั่งขั้นต่ำ (฿)
                </label>
                <input
                  type="number"
                  min={0}
                  value={minOrder}
                  onChange={(e) => setMinOrder(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-[#0A0A0B] border border-white/10 text-xs font-mono text-white font-bold focus:outline-none focus:border-[#FF5C00]"
                />
              </div>

              {discountType === 'percentage' && (
                <div>
                  <label className="label-caps block mb-1">
                    ลดสูงสุด (฿)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={maxDiscount || ''}
                    onChange={(e) => setMaxDiscount(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="ไม่จำกัด"
                    className="w-full px-3 py-2 rounded-xl bg-[#0A0A0B] border border-white/10 text-xs font-mono text-white font-bold focus:outline-none focus:border-[#FF5C00]"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="label-caps block mb-1">
                คำอธิบายโปรโมชั่น
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="เช่น ลดพิเศษ 10% สำหรับยอด 400฿ ขึ้นไป"
                className="w-full px-3 py-2 rounded-xl bg-[#0A0A0B] border border-white/10 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#FF5C00] resize-none font-medium"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-[#FF5C00] hover:bg-[#FF7729] text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-[#FF5C00]/25 transition-all cursor-pointer"
            >
              บันทึกโค้ดส่วนลด
            </button>
          </form>
        </div>

        {/* Right: Active Promo Codes List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-display font-black text-sm text-white uppercase tracking-wider">
              โค้ดโปรโมชั่นทั้งหมด ({promos.length} รายการ)
            </h4>
            <span className="text-xs text-stone-400 font-medium">
              สามารถเปิด/ปิด หรือลบโค้ดได้ตามต้องการ
            </span>
          </div>

          {promos.length === 0 ? (
            <div className="p-8 rounded-3xl bg-[#111112] border border-white/10 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-stone-400 mx-auto">
                <Tag className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-stone-300">ยังไม่มีโค้ดโปรโมชั่นในระบบ</p>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                สร้างโค้ดโปรโมชั่นใหม่จากแบบฟอร์มด้านซ้าย เพื่อมอบส่วนลดพิเศษให้ลูกค้า
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {promos.map((p) => (
                <div
                  key={p.code}
                  id={`promo-item-${p.code}`}
                  className={`p-4 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                    p.active
                      ? 'bg-[#111112] border-white/10 shadow-lg'
                      : 'bg-[#111112]/40 border-white/5 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-[#FF5C00]/15 border border-[#FF5C00]/30 flex items-center justify-center text-[#FF5C00] shrink-0">
                      <Gift className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-base font-mono font-black text-[#FF5C00] tracking-wider">
                          {p.code}
                        </strong>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-[#161618] text-white border border-white/10">
                          {p.discountType === 'percentage' ? `ลด ${p.value}%` : `ลด ${p.value}฿`}
                        </span>
                      </div>
                      <p className="text-xs text-stone-300 font-medium mt-0.5 truncate">{p.description}</p>
                      <span className="text-[11px] text-stone-500 font-medium">
                        สั่งขั้นต่ำ ฿{p.minOrder} {p.maxDiscount ? `(ลดสูงสุด ฿${p.maxDiscount})` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {/* Toggle Active Status */}
                    <button
                      type="button"
                      id={`btn-toggle-promo-${p.code}`}
                      onClick={() => togglePromoActive(p.code)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                        p.active
                          ? 'bg-emerald-950/85 border border-emerald-500/80 text-emerald-300 hover:bg-emerald-900/90'
                          : 'bg-[#161618] text-stone-500 border border-white/10 hover:text-stone-300'
                      }`}
                      title={p.active ? 'คลิกเพื่อปิดใช้งาน' : 'คลิกเพื่อเปิดใช้งาน'}
                    >
                      {p.active ? '● เปิดใช้งาน' : 'ปิดใช้งาน'}
                    </button>

                    {/* Delete Promo Button */}
                    <button
                      type="button"
                      id={`btn-delete-promo-${p.code}`}
                      onClick={() => setPromoToDelete(p)}
                      className="p-2 rounded-xl bg-rose-950/40 hover:bg-rose-600 border border-rose-500/30 hover:border-rose-500 text-rose-400 hover:text-white transition-all cursor-pointer shadow-sm group"
                      title={`ลบโค้ดโปรโมชั่น ${p.code}`}
                    >
                      <Trash2 className="w-4 h-4 transition-transform group-hover:scale-110" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal (Iframe-Safe) */}
      <AnimatePresence>
        {promoToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md rounded-3xl bg-[#111112] border border-rose-500/30 p-6 shadow-2xl space-y-5"
            >
              <button
                onClick={() => setPromoToDelete(null)}
                className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-stone-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div>
                <h4 className="font-display font-black text-lg text-white">
                  ยืนยันการลบโค้ดโปรโมชั่น?
                </h4>
                <p className="text-sm text-stone-300 mt-2">
                  คุณต้องการลบโค้ดโปรโมชั่น <strong className="font-mono text-[#FF5C00] font-black">{promoToDelete.code}</strong> ใช่หรือไม่? 
                  ข้อมูลโค้ดจะถูกลบออกจากระบบทันที
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-[#161618] border border-white/10 text-xs text-stone-400 space-y-1">
                <div className="flex justify-between">
                  <span>ประเภทส่วนลด:</span>
                  <span className="text-white font-bold">
                    {promoToDelete.discountType === 'percentage' ? `ลด ${promoToDelete.value}%` : `ลด ${promoToDelete.value}฿`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>ยอดสั่งขั้นต่ำ:</span>
                  <span className="text-white font-mono font-bold">฿{promoToDelete.minOrder}</span>
                </div>
                {promoToDelete.description && (
                  <p className="text-[11px] text-stone-500 pt-1 border-t border-white/5 truncate">
                    {promoToDelete.description}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  id="btn-cancel-delete-promo"
                  onClick={() => setPromoToDelete(null)}
                  className="px-4 py-2.5 rounded-xl bg-[#161618] hover:bg-[#202024] text-stone-300 hover:text-white text-xs font-bold transition-colors cursor-pointer border border-white/10"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  id="btn-confirm-delete-promo"
                  onClick={handleConfirmDelete}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-rose-600/30 flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>ยืนยันการลบ</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
