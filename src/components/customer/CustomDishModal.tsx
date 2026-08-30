import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ChefHat,
  Plus,
  Minus,
  Check,
  UtensilsCrossed,
  Package,
  Sparkles,
  Info,
  Ban,
  HeartCrack,
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';

const COMMON_EXCLUSIONS = [
  { id: 'coriander', label: 'ไม่ใส่ผักชี 🌿' },
  { id: 'chili', label: 'ไม่ใส่พริก / ไม่เผ็ด 🌶️' },
  { id: 'garlic', label: 'ไม่ใส่กระเทียม 🧄' },
  { id: 'onion', label: 'ไม่ใส่หอมใหญ่ 🧅' },
  { id: 'spring_onion', label: 'ไม่ใส่ต้นหอม/คื่นช่าย 🍃' },
  { id: 'msg', label: 'ไม่ใส่ผงชูรส (No MSG) ✨' },
  { id: 'sugar', label: 'ไม่ใส่น้ำตาล / ไม่หวาน 🍬' },
  { id: 'bean_sprouts', label: 'ไม่ใส่ถั่วงอก 🌱' },
  { id: 'peanuts', label: 'ไม่ใส่ถั่วลิสง / แพ้ถั่ว 🥜' },
  { id: 'oyster_sauce', label: 'ไม่ใส่น้ำมันหอย 🦪' },
  { id: 'seafood', label: 'แพ้อาหารทะเล / กุ้ง 🦐' },
  { id: 'beef', label: 'ไม่ทานเนื้อวัว 🥩' },
  { id: 'pork', label: 'ไม่ทานหมู 🐷' },
  { id: 'vegetarian', label: 'มังสวิรัติ / เจ 🥗' },
];

export const CustomDishModal: React.FC = () => {
  const {
    isCustomDishModalOpen,
    setIsCustomDishModalOpen,
    addCustomDishToCart,
    orderType,
    selectedTable,
    storeStatus,
    showToast,
  } = useRestaurant();

  const [dishName, setDishName] = useState('');
  const [preferences, setPreferences] = useState('');
  const [selectedExclusions, setSelectedExclusions] = useState<string[]>([]);
  const [customExclusionInput, setCustomExclusionInput] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [packagingType, setPackagingType] = useState<'dine_in' | 'takeaway'>(
    orderType === 'dine_in' ? 'dine_in' : 'takeaway'
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isCustomDishModalOpen) return null;

  const toggleExclusion = (label: string) => {
    setSelectedExclusions((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    );
  };

  const handleAddCustomExclusion = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    if (!customExclusionInput.trim()) return;

    const formatted = customExclusionInput.trim().startsWith('ไม่')
      ? customExclusionInput.trim()
      : `ไม่ใส่${customExclusionInput.trim()}`;

    if (!selectedExclusions.includes(formatted)) {
      setSelectedExclusions((prev) => [...prev, formatted]);
    }
    setCustomExclusionInput('');
  };

  const removeExclusionTag = (item: string) => {
    setSelectedExclusions((prev) => prev.filter((x) => x !== item));
  };

  const handleAddDish = () => {
    if (!storeStatus.isOpen) {
      showToast(`ร้านปิดทำการในขณะนี้ (${storeStatus.statusText}) ไม่สามารถสั่งเมนูพิเศษได้`, 'warning');
      return;
    }

    if (!dishName.trim()) {
      setValidationError('กรุณาระบุชื่อเมนูอาหารที่คุณอยากทาน');
      return;
    }

    addCustomDishToCart({
      dishName: dishName.trim(),
      description: preferences.trim() || undefined,
      preferences: preferences.trim() || undefined,
      excludedIngredients: selectedExclusions,
      quantity,
      packagingType,
      notes: preferences.trim() || undefined,
    });

    // Reset & close
    setDishName('');
    setPreferences('');
    setSelectedExclusions([]);
    setCustomExclusionInput('');
    setQuantity(1);
    setValidationError(null);
    setIsCustomDishModalOpen(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          id="custom-dish-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsCustomDishModalOpen(false)}
          className="fixed inset-0 bg-stone-950/85 backdrop-blur-md"
        />

        {/* Dialog Card */}
        <motion.div
          id="custom-dish-modal-dialog"
          initial={{ opacity: 0, scale: 0.94, y: 25 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 25 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="relative w-full max-w-2xl bg-[#111112] rounded-3xl border border-[#FF5C00]/30 shadow-2xl overflow-hidden z-10 my-auto flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-[#161618] via-[#111112] to-[#161618]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF5C00] to-[#FF8A00] text-white flex items-center justify-center shadow-lg shadow-[#FF5C00]/30 shrink-0">
                <ChefHat className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-black text-xl text-white">
                    สั่งเมนูพิเศษตามใจคุณ
                  </h3>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#FF5C00]/20 text-[#FF5C00] border border-[#FF5C00]/30">
                    Custom Order
                  </span>
                </div>
                <p className="text-xs text-stone-400 mt-0.5">
                  พิมพ์บอกเชฟได้เลยว่าอยากทานอะไร และไม่อยากใส่อะไร (ทางร้านคิดราคาให้หลังบ้าน)
                </p>
              </div>
            </div>

            <button
              id="btn-close-custom-dish-modal"
              onClick={() => setIsCustomDishModalOpen(false)}
              className="w-10 h-10 rounded-2xl bg-[#161618] hover:bg-[#202024] text-stone-300 hover:text-white border border-white/10 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Form Body */}
          <div className="overflow-y-auto p-6 space-y-6 flex-1 custom-scrollbar">
            {/* Validation Error Alert */}
            {validationError && (
              <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-600/80 text-rose-200 text-xs font-bold flex items-center gap-2">
                <span>⚠️</span>
                <span>{validationError}</span>
              </div>
            )}

            {/* 1. Dish Name Input (สิ่งที่อยากกิน) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-black text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#FF5C00]" />
                  <span>1. เมนูที่อยากรับประทาน (สิ่งที่อยากกิน) *</span>
                </label>
                <span className="text-[11px] text-[#FF5C00] font-bold">จำเป็นต้องระบุ</span>
              </div>
              <input
                id="input-custom-dish-name"
                type="text"
                value={dishName}
                onChange={(e) => {
                  setDishName(e.target.value);
                  setValidationError(null);
                }}
                placeholder="เช่น ข้าวกะเพราเนื้อสับไข่ดาวกรอบ, แกงจืดเต้าหู้หมูสับสาหร่าย, ข้าวผัดต้มยำกุ้ง, ไข่เจียวปูกรอบฟู..."
                className="w-full p-4 rounded-2xl bg-[#161618] border border-white/15 text-sm sm:text-base font-bold text-white placeholder-stone-500 focus:outline-none focus:border-[#FF5C00] focus:ring-2 focus:ring-[#FF5C00]/20 transition-all"
                autoFocus
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[11px] text-stone-400 font-medium mr-1">ตัวอย่างเมนูยอดนิยม:</span>
                {[
                  'ข้าวกะเพราไข่ข้นกุ้งสับ',
                  'ข้าวไข่เจียวหมูสับกรอบ',
                  'แกงจืดเต้าหู้หมูสับ',
                  'ผัดซีอิ๊วหมูหมักนุ่ม',
                  'ต้มยำกุ้งน้ำข้นโบราณ',
                ].map((eg) => (
                  <button
                    key={eg}
                    type="button"
                    onClick={() => {
                      setDishName(eg);
                      setValidationError(null);
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-xl bg-white/5 hover:bg-[#FF5C00]/20 hover:text-[#FF5C00] text-stone-300 border border-white/10 transition-colors cursor-pointer"
                  >
                    + {eg}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Dislikes / Excluded Ingredients (สิ่งที่ไม่อยากกิน / ไม่อยากใส่อะไร) */}
            <div className="space-y-3 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-black text-white flex items-center gap-1.5">
                    <Ban className="w-4 h-4 text-rose-400" />
                    <span>2. สิ่งที่ไม่อยากกิน / ไม่อยากใส่ / ข้อจำกัดการทาน</span>
                  </label>
                  <p className="text-xs text-stone-400 mt-0.5">
                    แตะเลือกรายการที่ไม่ต้องการใส่ หรือพิมพ์ระบุเองด้านล่าง
                  </p>
                </div>
                {selectedExclusions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedExclusions([])}
                    className="text-[11px] text-stone-400 hover:text-rose-400 font-bold underline cursor-pointer"
                  >
                    ล้างที่เลือกทั้งหมด
                  </button>
                )}
              </div>

              {/* Quick Select Exclusions Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {COMMON_EXCLUSIONS.map((item) => {
                  const isSelected = selectedExclusions.includes(item.label);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      id={`exclusion-chip-${item.id}`}
                      onClick={() => toggleExclusion(item.label)}
                      className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all text-left flex items-center justify-between gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-rose-950/60 border-rose-500 text-rose-200 shadow-md shadow-rose-950/40'
                          : 'bg-[#161618] border-white/10 hover:border-white/20 text-stone-300'
                      }`}
                    >
                      <span className="truncate">{item.label}</span>
                      <div
                        className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-rose-500 text-white' : 'border border-white/20'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Free-text input for custom exclusions */}
              <div className="flex gap-2 pt-1">
                <input
                  id="input-custom-exclusion-text"
                  type="text"
                  value={customExclusionInput}
                  onChange={(e) => setCustomExclusionInput(e.target.value)}
                  onKeyDown={handleAddCustomExclusion}
                  placeholder="พิมพ์สิ่งที่ไม่ต้องการใส่เพิ่มเติม เช่น ไม่ใส่คื่นช่าย, ไม่เอามันหมู, แยกน้ำราด..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#161618] border border-white/15 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-rose-500 transition-all font-medium"
                />
                <button
                  type="button"
                  id="btn-add-custom-exclusion"
                  onClick={handleAddCustomExclusion}
                  className="px-4 py-2.5 rounded-xl bg-rose-900/50 hover:bg-rose-800/80 text-rose-200 border border-rose-600/50 text-xs font-black uppercase tracking-wider transition-all cursor-pointer shrink-0"
                >
                  + เพิ่มข้อห้าม
                </button>
              </div>

              {/* Selected Exclusions Display */}
              {selectedExclusions.length > 0 && (
                <div className="p-3 rounded-2xl bg-rose-950/30 border border-rose-500/30 space-y-1.5">
                  <div className="text-[11px] font-bold text-rose-300 flex items-center gap-1">
                    <Ban className="w-3.5 h-3.5 text-rose-400" />
                    <span>เชฟจะไม่ใส่สิ่งเหล่านี้ในจานของคุณ:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedExclusions.map((ex, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-rose-900/60 text-rose-100 text-xs font-bold border border-rose-500/40 flex items-center gap-1.5 shadow-sm"
                      >
                        <span>{ex}</span>
                        <button
                          type="button"
                          onClick={() => removeExclusionTag(ex)}
                          className="hover:text-white text-rose-300 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Cooking Preferences / Special Requests */}
            <div className="space-y-2 pt-4 border-t border-white/10">
              <label className="text-sm font-black text-white block">
                3. รายละเอียดการปรุง / วิธีการทำที่ต้องการ (เพิ่มเติม)
              </label>
              <textarea
                id="input-custom-dish-preferences"
                rows={2}
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
                placeholder="เช่น ขอไข่ดาวกรอบไข่แดงเยิ้มๆ, ผัดแบบแห้งๆ หอมกลิ่นกระทะ, ขอใส่น้ำมันน้อยๆ..."
                className="w-full p-3.5 rounded-2xl bg-[#161618] border border-white/15 text-xs sm:text-sm text-white placeholder-stone-500 focus:outline-none focus:border-[#FF5C00] transition-all resize-none font-medium"
              />
            </div>

            {/* 4. Serving / Packaging Mode */}
            <div className="space-y-3 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">4. รูปแบบการรับประทาน</h4>
                  <p className="text-xs text-stone-400">เลือกสำหรับจานนี้ (รวมในบิลเดียวกันได้)</p>
                </div>
                <span className="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-md bg-[#FF5C00]/15 text-[#FF5C00] border border-[#FF5C00]/30">
                  {packagingType === 'dine_in' ? '🍽️ ทานที่ร้าน' : '🛍️ สั่งกลับบ้าน'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div
                  id="custom-packaging-dine-in"
                  onClick={() => setPackagingType('dine_in')}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    packagingType === 'dine_in'
                      ? 'bg-[#FF5C00]/15 border-[#FF5C00] text-white shadow-md shadow-[#FF5C00]/10'
                      : 'bg-[#161618] border-white/10 hover:border-white/20 text-stone-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <UtensilsCrossed
                        className={`w-4 h-4 ${packagingType === 'dine_in' ? 'text-[#FF5C00]' : 'text-stone-400'}`}
                      />
                      <span className="text-sm font-bold">ทานที่ร้าน</span>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center ${
                        packagingType === 'dine_in' ? 'bg-[#FF5C00] text-white' : 'border border-white/20'
                      }`}
                    >
                      {packagingType === 'dine_in' && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                  <p className="text-[11px] text-stone-400">
                    {orderType === 'dine_in' && selectedTable
                      ? `เสิร์ฟในจานที่โต๊ะ ${selectedTable}`
                      : 'เสิร์ฟในจานที่โต๊ะอาหาร'}
                  </p>
                </div>

                <div
                  id="custom-packaging-takeaway"
                  onClick={() => setPackagingType('takeaway')}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    packagingType === 'takeaway'
                      ? 'bg-[#FF5C00]/15 border-[#FF5C00] text-white shadow-md shadow-[#FF5C00]/10'
                      : 'bg-[#161618] border-white/10 hover:border-white/20 text-stone-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Package
                        className={`w-4 h-4 ${packagingType === 'takeaway' ? 'text-[#FF5C00]' : 'text-stone-400'}`}
                      />
                      <span className="text-sm font-bold">สั่งกลับบ้าน</span>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center ${
                        packagingType === 'takeaway' ? 'bg-[#FF5C00] text-white' : 'border border-white/20'
                      }`}
                    >
                      {packagingType === 'takeaway' && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                  <p className="text-[11px] text-stone-400">ใส่กล่อง/ถุงห่อ พร้อมถือกลับบ้าน</p>
                </div>
              </div>
            </div>

            {/* Back-Office Pricing Notice Card */}
            <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/40 flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <h5 className="font-bold text-amber-300">
                  ระบบคิดราคาหลังบ้าน (Pricing by Restaurant)
                </h5>
                <p className="text-stone-300 leading-relaxed">
                  เมื่อคุณกดสั่ง รายการนี้จะส่งตรงถึงครัวทันที ทางร้านจะประเมินราคาตามวัตถุดิบจริงและใส่ราคาลงในบิลหลังบ้านให้คุณโดยอัตโนมัติ
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Actions Bar */}
          <div className="p-4 sm:p-6 bg-[#0A0A0B] border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Quantity Stepper */}
            <div className="flex items-center bg-[#161618] border border-white/10 rounded-2xl p-1 shadow-inner">
              <button
                id="btn-custom-decrease-qty"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-xl bg-[#202024] hover:bg-[#28282e] text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-12 text-center font-black text-lg text-white font-mono">
                {quantity}
              </span>
              <button
                id="btn-custom-increase-qty"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-10 h-10 rounded-xl bg-[#202024] hover:bg-[#28282e] text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Submit Button */}
            {storeStatus.isOpen ? (
              <motion.button
                id="btn-submit-custom-dish"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAddDish}
                className="w-full sm:w-auto flex-1 flex items-center justify-between px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#FF5C00] to-[#FF8A00] hover:from-[#FF7729] hover:to-[#FFA033] text-white font-black uppercase tracking-wider shadow-xl shadow-[#FF5C00]/25 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <ChefHat className="w-5 h-5" />
                  <span>เพิ่มเมนูพิเศษลงตะกร้า</span>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-black/30 border border-white/20">
                  ⏳ คิดราคาหลังบ้าน
                </span>
              </motion.button>
            ) : (
              <button
                id="btn-submit-custom-dish"
                disabled
                className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-stone-900 border border-rose-500/20 text-rose-400 font-bold text-xs uppercase tracking-wider cursor-not-allowed opacity-80"
              >
                <Ban className="w-4 h-4 text-rose-400" />
                <span>ร้านปิดทำการชั่วคราว (งดรับออเดอร์)</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
