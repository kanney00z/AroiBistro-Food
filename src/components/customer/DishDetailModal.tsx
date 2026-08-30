import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Plus,
  Minus,
  Star,
  Clock,
  Sparkles,
  Flame,
  Check,
  ShoppingBag,
  UtensilsCrossed,
  Package,
  Ban,
} from 'lucide-react';
import { MenuItem, SelectedOption } from '../../types';
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
];

interface DishDetailModalProps {
  dish: MenuItem | null;
  onClose: () => void;
}

export const DishDetailModal: React.FC<DishDetailModalProps> = ({ dish, onClose }) => {
  const { addToCart, orderType, selectedTable, storeStatus, showToast } = useRestaurant();

  const [quantity, setQuantity] = useState(1);
  const [selectedChoices, setSelectedChoices] = useState<Record<string, string[]>>({});
  const [selectedExclusions, setSelectedExclusions] = useState<string[]>([]);
  const [customExclusionInput, setCustomExclusionInput] = useState('');
  const [packagingType, setPackagingType] = useState<'dine_in' | 'takeaway'>(
    orderType === 'dine_in' ? 'dine_in' : 'takeaway'
  );
  const [specialNotes, setSpecialNotes] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Initialize default choices when modal opens
  useEffect(() => {
    if (dish && dish.optionGroups) {
      const initial: Record<string, string[]> = {};
      dish.optionGroups.forEach((group) => {
        if (group.required && group.choices.length > 0) {
          // Select the first choice by default for required single-select
          initial[group.id] = [group.choices[0].id];
        } else {
          initial[group.id] = [];
        }
      });
      setSelectedChoices(initial);
      setSelectedExclusions([]);
      setCustomExclusionInput('');
      setQuantity(1);
      setPackagingType(orderType === 'dine_in' ? 'dine_in' : 'takeaway');
      setSpecialNotes('');
      setValidationError(null);
    }
  }, [dish, orderType]);

  if (!dish) return null;

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

  const handleSingleSelect = (groupId: string, choiceId: string) => {
    setSelectedChoices((prev) => ({
      ...prev,
      [groupId]: [choiceId],
    }));
    setValidationError(null);
  };

  const handleMultiSelect = (groupId: string, choiceId: string, maxSelect = 99) => {
    setSelectedChoices((prev) => {
      const current = prev[groupId] || [];
      if (current.includes(choiceId)) {
        return { ...prev, [groupId]: current.filter((id) => id !== choiceId) };
      } else {
        if (current.length >= maxSelect) {
          return prev;
        }
        return { ...prev, [groupId]: [...current, choiceId] };
      }
    });
  };

  // Calculate dynamic price
  let optionsPriceDelta = 0;
  const flatSelectedOptions: SelectedOption[] = [];

  if (dish.optionGroups) {
    dish.optionGroups.forEach((group) => {
      const chosenIds = selectedChoices[group.id] || [];
      chosenIds.forEach((cId) => {
        const choiceObj = group.choices.find((c) => c.id === cId);
        if (choiceObj) {
          optionsPriceDelta += choiceObj.priceDelta;
          flatSelectedOptions.push({
            groupId: group.id,
            groupName: group.name,
            choiceId: choiceObj.id,
            choiceName: choiceObj.name,
            priceDelta: choiceObj.priceDelta,
          });
        }
      });
    });
  }

  const unitPrice = dish.price + optionsPriceDelta;
  const totalPrice = unitPrice * quantity;

  const handleAddToCart = () => {
    if (!storeStatus.isOpen) {
      showToast(`ร้านปิดทำการในขณะนี้ (${storeStatus.statusText}) ไม่สามารถสั่งอาหารได้`, 'warning');
      return;
    }

    // Validate required groups
    if (dish.optionGroups) {
      for (const group of dish.optionGroups) {
        const chosen = selectedChoices[group.id] || [];
        if (group.required && chosen.length === 0) {
          setValidationError(`กรุณาเลือก "${group.name}" ก่อนดำเนินการต่อ`);
          return;
        }
      }
    }

    addToCart(dish, flatSelectedOptions, quantity, specialNotes, packagingType, selectedExclusions);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        
        {/* Backdrop */}
        <motion.div
          id="dish-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-stone-950/80 backdrop-blur-md"
        />

        {/* Modal Dialog Card */}
        <motion.div
          id="dish-detail-modal-dialog"
          initial={{ opacity: 0, scale: 0.92, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 30 }}
          transition={{ type: 'spring', damping: 28, stiffness: 350 }}
          className="relative w-full max-w-2xl bg-[#111112] rounded-3xl border border-white/10 shadow-2xl overflow-hidden z-10 my-auto flex flex-col max-h-[90vh]"
        >
          {/* Close button */}
          <button
            id="btn-close-dish-modal"
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-[#0A0A0B]/80 backdrop-blur-md border border-white/10 text-stone-300 hover:text-white flex items-center justify-center transition-all cursor-pointer hover:scale-110"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Scrollable Content Container */}
          <div className="overflow-y-auto flex-1 custom-scrollbar">
            {/* Dish Hero Image */}
            <div className="relative h-64 sm:h-72 w-full bg-[#0A0A0B]">
              <img
                src={dish.image}
                alt={dish.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111112] via-[#111112]/30 to-transparent" />

              <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    {dish.isChefSpecial && (
                      <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#FF5C00] text-white text-[10px] font-black uppercase tracking-wider">
                        <Sparkles className="w-3 h-3" />
                        เชฟแนะนำ
                      </span>
                    )}
                    {dish.isPopular && (
                      <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-white text-[#0A0A0B] text-[10px] font-black uppercase tracking-wider">
                        <Flame className="w-3 h-3 text-[#FF5C00]" />
                        ยอดนิยม
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white font-display">{dish.name}</h2>
                  <p className="text-stone-300 text-xs uppercase font-bold tracking-wider">{dish.nameEn}</p>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0A0A0B]/80 backdrop-blur-md border border-white/10 text-white font-mono font-bold text-sm">
                  <Star className="w-4 h-4 fill-[#FF5C00] text-[#FF5C00]" />
                  <span>{dish.rating}</span>
                  <span className="text-stone-400 text-xs font-normal">({dish.reviewsCount})</span>
                </div>
              </div>
            </div>

            {/* Dish Meta & Description */}
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4 text-xs text-stone-300 bg-[#161618] p-3.5 rounded-2xl border border-white/10 font-medium">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#FF5C00]" />
                  <span>เวลาปรุง ~{dish.prepTimeMinutes} นาที</span>
                </div>
                {dish.calories && (
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-white">{dish.calories}</span>
                    <span className="text-stone-400">kcal</span>
                  </div>
                )}
                {dish.isSpicy !== undefined && dish.isSpicy > 0 && (
                  <div className="flex items-center gap-1 text-rose-400 font-bold">
                    <span>ความเผ็ดระดับ {dish.isSpicy} {'🌶️'.repeat(dish.isSpicy)}</span>
                  </div>
                )}
              </div>

              <div>
                <h4 className="label-caps mb-1.5">รายละเอียดเมนู</h4>
                <p className="text-sm text-stone-300 leading-relaxed font-normal">{dish.description}</p>
              </div>

              {/* Validation Alert */}
              {validationError && (
                <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-600/80 text-rose-300 text-xs font-bold flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{validationError}</span>
                </div>
              )}

              {/* Option Groups */}
              {dish.optionGroups && dish.optionGroups.map((group) => {
                const isMulti = !group.required || (group.maxSelect && group.maxSelect > 1);
                const selectedList = selectedChoices[group.id] || [];

                return (
                  <div key={group.id} className="space-y-3 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-white">{group.name}</h4>
                        {group.nameEn && <span className="text-xs text-stone-400">{group.nameEn}</span>}
                      </div>
                      <span className={`text-[10px] uppercase font-black px-2.5 py-0.5 rounded-md ${
                        group.required
                          ? 'bg-[#FF5C00]/20 text-[#FF5C00] border border-[#FF5C00]/40'
                          : 'bg-white/10 text-stone-300'
                      }`}>
                        {group.required ? 'จำเป็นต้องเลือก' : `เลือกได้สูงสุด ${group.maxSelect || 'หลายรายการ'}`}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {group.choices.map((choice) => {
                        const isChosen = selectedList.includes(choice.id);

                        return (
                          <div
                            key={choice.id}
                            id={`option-choice-${choice.id}`}
                            onClick={() => {
                              if (isMulti) {
                                handleMultiSelect(group.id, choice.id, group.maxSelect);
                              } else {
                                handleSingleSelect(group.id, choice.id);
                              }
                            }}
                            className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                              isChosen
                                ? 'bg-[#FF5C00]/15 border-[#FF5C00] text-white shadow-sm'
                                : 'bg-[#161618] border-white/10 hover:border-white/20 text-stone-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded-lg flex items-center justify-center transition-colors ${
                                isChosen ? 'bg-[#FF5C00] text-white font-bold' : 'border border-white/20'
                              }`}>
                                {isChosen && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>
                              <span className="text-xs sm:text-sm font-bold">{choice.name}</span>
                            </div>

                            {choice.priceDelta > 0 && (
                              <span className="text-xs font-black text-[#FF5C00] font-mono">
                                +฿{choice.priceDelta}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Packaging / Dining Type (Dine-in vs Takeaway) */}
              <div className="space-y-3 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">รูปแบบการรับประทาน</h4>
                    <p className="text-xs text-stone-400">เลือกสำหรับจานนี้ (สามารถรวมในบิลเดียวกันได้)</p>
                  </div>
                  <span className="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-md bg-[#FF5C00]/15 text-[#FF5C00] border border-[#FF5C00]/30">
                    {packagingType === 'dine_in' ? '🍽️ ทานที่ร้าน' : '🛍️ สั่งกลับบ้าน'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {/* Dine In Choice */}
                  <div
                    id="opt-packaging-dine-in"
                    onClick={() => setPackagingType('dine_in')}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      packagingType === 'dine_in'
                        ? 'bg-[#FF5C00]/15 border-[#FF5C00] text-white shadow-md shadow-[#FF5C00]/10'
                        : 'bg-[#161618] border-white/10 hover:border-white/20 text-stone-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <UtensilsCrossed className={`w-4 h-4 ${packagingType === 'dine_in' ? 'text-[#FF5C00]' : 'text-stone-400'}`} />
                        <span className="text-sm font-bold">ทานที่ร้าน</span>
                      </div>
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                        packagingType === 'dine_in' ? 'bg-[#FF5C00] text-white' : 'border border-white/20'
                      }`}>
                        {packagingType === 'dine_in' && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                    <p className="text-[11px] text-stone-400">
                      {orderType === 'dine_in' && selectedTable ? `เสิร์ฟในจานที่โต๊ะ ${selectedTable}` : 'เสิร์ฟในจานที่โต๊ะอาหาร'}
                    </p>
                  </div>

                  {/* Takeaway Choice */}
                  <div
                    id="opt-packaging-takeaway"
                    onClick={() => setPackagingType('takeaway')}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      packagingType === 'takeaway'
                        ? 'bg-[#FF5C00]/15 border-[#FF5C00] text-white shadow-md shadow-[#FF5C00]/10'
                        : 'bg-[#161618] border-white/10 hover:border-white/20 text-stone-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Package className={`w-4 h-4 ${packagingType === 'takeaway' ? 'text-[#FF5C00]' : 'text-stone-400'}`} />
                        <span className="text-sm font-bold">สั่งกลับบ้าน</span>
                      </div>
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                        packagingType === 'takeaway' ? 'bg-[#FF5C00] text-white' : 'border border-white/20'
                      }`}>
                        {packagingType === 'takeaway' && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                    <p className="text-[11px] text-stone-400">
                      ใส่กล่อง/ถุงห่อ พร้อมถือกลับบ้าน
                    </p>
                  </div>
                </div>
              </div>

              {/* Excluded Ingredients & Allergens (สิ่งที่ไม่อยากกิน / ไม่อยากใส่) */}
              <div className="space-y-3 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-black text-stone-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Ban className="w-3.5 h-3.5 text-rose-400" />
                      <span>สิ่งที่ไม่อยากกิน / ไม่อยากใส่ (Exclusions)</span>
                    </label>
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      แตะเลือกสิ่งที่ไม่ต้องการใส่ หรือพิมพ์ระบุเอง
                    </p>
                  </div>
                  {selectedExclusions.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedExclusions([])}
                      className="text-[11px] text-stone-400 hover:text-rose-400 font-bold underline cursor-pointer"
                    >
                      ล้างที่เลือก
                    </button>
                  )}
                </div>

                {/* Exclusions Chips */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {COMMON_EXCLUSIONS.map((item) => {
                    const isSelected = selectedExclusions.includes(item.label);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        id={`dish-exclusion-${item.id}`}
                        onClick={() => toggleExclusion(item.label)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-left flex items-center justify-between gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-rose-950/60 border-rose-500 text-rose-200 shadow-sm shadow-rose-950/40'
                            : 'bg-[#161618] border-white/10 hover:border-white/20 text-stone-300'
                        }`}
                      >
                        <span className="truncate">{item.label}</span>
                        <div
                          className={`w-3.5 h-3.5 rounded-md flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-rose-500 text-white' : 'border border-white/20'
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Free-text input for custom exclusions */}
                <div className="flex gap-2 pt-1">
                  <input
                    id="input-dish-custom-exclusion"
                    type="text"
                    value={customExclusionInput}
                    onChange={(e) => setCustomExclusionInput(e.target.value)}
                    onKeyDown={handleAddCustomExclusion}
                    placeholder="พิมพ์สิ่งที่ไม่ต้องการใส่เพิ่มเติม เช่น ไม่ใส่คื่นช่าย, ไม่เอามันหมู..."
                    className="flex-1 px-3.5 py-2 rounded-xl bg-[#161618] border border-white/15 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-rose-500 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomExclusion}
                    className="px-3.5 py-2 rounded-xl bg-rose-900/50 hover:bg-rose-800/80 text-rose-200 border border-rose-600/50 text-xs font-bold transition-all cursor-pointer shrink-0"
                  >
                    + เพิ่ม
                  </button>
                </div>

                {/* Selected Exclusions Display */}
                {selectedExclusions.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-500/30 flex flex-wrap gap-1.5">
                    {selectedExclusions.map((ex, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-rose-900/70 text-rose-100 text-[11px] font-bold border border-rose-500/40 flex items-center gap-1"
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
                )}
              </div>

              {/* Special Instructions Note */}
              <div className="space-y-2 pt-4 border-t border-white/10">
                <label className="label-caps block">
                  หมายเหตุเพิ่มเติมถึงเชฟ (ถ้ามี)
                </label>
                <textarea
                  id="dish-special-instructions"
                  rows={2}
                  value={specialNotes}
                  onChange={(e) => setSpecialNotes(e.target.value)}
                  placeholder="เช่น ไม่ใส่ผักชี, แยกซอส, ขอเผ็ดน้อยเป็นพิเศษ..."
                  className="w-full p-3.5 rounded-2xl bg-[#161618] border border-white/10 text-xs sm:text-sm text-white placeholder-stone-600 focus:outline-none focus:border-[#FF5C00] transition-all resize-none font-medium"
                />
              </div>
            </div>
          </div>

          {/* Sticky Bottom Actions Bar */}
          <div className="p-4 sm:p-6 bg-[#0A0A0B] border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            
            {/* Quantity Stepper */}
            <div className="flex items-center bg-[#161618] border border-white/10 rounded-2xl p-1 shadow-inner">
              <button
                id="btn-decrease-qty"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-xl bg-[#202024] hover:bg-[#28282e] text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-12 text-center font-black text-lg text-white font-mono">
                {quantity}
              </span>
              <button
                id="btn-increase-qty"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-10 h-10 rounded-xl bg-[#202024] hover:bg-[#28282e] text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Add to Cart Button with Live Total Price */}
            {storeStatus.isOpen ? (
              <motion.button
                id="btn-submit-add-to-cart"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAddToCart}
                className="w-full sm:w-auto flex-1 flex items-center justify-between px-6 py-3.5 rounded-2xl bg-[#FF5C00] hover:bg-[#FF7729] text-white font-black uppercase tracking-wider shadow-xl shadow-[#FF5C00]/25 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  <span>เพิ่มลงตะกร้า</span>
                </div>
                <div className="text-lg font-black font-mono">
                  ฿{totalPrice.toLocaleString()}
                </div>
              </motion.button>
            ) : (
              <button
                id="btn-submit-add-to-cart"
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
