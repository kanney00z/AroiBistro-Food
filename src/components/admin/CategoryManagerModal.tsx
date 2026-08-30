import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  Check,
  FolderPlus,
  Layers,
  Utensils,
  Sparkles,
  Flame,
  Soup,
  Wheat,
  Salad,
  Cake,
  Coffee,
  Tag,
  Pizza,
  Fish,
  Beef,
  Wine,
  AlertTriangle,
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Category } from '../../types';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVAILABLE_ICONS = [
  { name: 'Utensils', label: 'ช้อนส้อม', icon: Utensils },
  { name: 'Flame', label: 'ไฟ/ผัด', icon: Flame },
  { name: 'Soup', label: 'ต้ม/แกง', icon: Soup },
  { name: 'Wheat', label: 'เส้น/ข้าว', icon: Wheat },
  { name: 'Salad', label: 'สลัด/ยำ', icon: Salad },
  { name: 'Beef', label: 'เนื้อ/สเต๊ก', icon: Beef },
  { name: 'Fish', label: 'ซีฟู้ด/ปลา', icon: Fish },
  { name: 'Pizza', label: 'ของทานเล่น/พิซซ่า', icon: Pizza },
  { name: 'Cake', label: 'ของหวาน', icon: Cake },
  { name: 'Coffee', label: 'เครื่องดื่ม/กาแฟ', icon: Coffee },
  { name: 'Wine', label: 'เครื่องดื่มพิเศษ', icon: Wine },
  { name: 'Sparkles', label: 'เมนูพิเศษ', icon: Sparkles },
  { name: 'Tag', label: 'แท็กทั่วไป', icon: Tag },
];

const iconMap: Record<string, React.ElementType> = {
  Utensils,
  Sparkles,
  Flame,
  Soup,
  Wheat,
  Salad,
  Cake,
  Coffee,
  Tag,
  Pizza,
  Fish,
  Beef,
  Wine,
};

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { categories, addCategory, updateCategory, deleteCategory, menuItems, showToast } = useRestaurant();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [iconName, setIconName] = useState('Utensils');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleStartAdd = () => {
    setCategoryToDelete(null);
    setEditingId(null);
    setName('');
    setNameEn('');
    setIconName('Utensils');
    setDescription('');
    setIsAddingNew(true);
  };

  const handleStartEdit = (cat: Category) => {
    setCategoryToDelete(null);
    setEditingId(cat.id);
    setName(cat.name);
    setNameEn(cat.nameEn || '');
    setIconName(cat.iconName || 'Utensils');
    setDescription(cat.description || '');
    setIsAddingNew(false);
  };

  const handleConfirmDelete = () => {
    if (!categoryToDelete) return;
    deleteCategory(categoryToDelete.id);
    setCategoryToDelete(null);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('กรุณาระบุชื่อหมวดหมู่อาหาร', 'warning');
      return;
    }

    if (editingId) {
      updateCategory(editingId, {
        name: name.trim(),
        nameEn: nameEn.trim() || undefined,
        iconName,
        description: description.trim() || undefined,
      });
      setEditingId(null);
    } else {
      addCategory({
        name: name.trim(),
        nameEn: nameEn.trim() || undefined,
        iconName,
        description: description.trim() || undefined,
      });
      setIsAddingNew(false);
    }

    setName('');
    setNameEn('');
    setIconName('Utensils');
    setDescription('');
  };

  const handleCancelForm = () => {
    setIsAddingNew(false);
    setEditingId(null);
    setName('');
    setNameEn('');
    setIconName('Utensils');
    setDescription('');
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
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          className="relative w-full max-w-2xl bg-[#111112] rounded-3xl border border-white/10 shadow-2xl overflow-hidden z-10 my-auto flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#0A0A0B]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FF5C00]/15 border border-[#FF5C00]/30 flex items-center justify-center text-[#FF5C00]">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-black text-lg text-white uppercase tracking-wider">
                  จัดการหมวดหมู่อาหาร (Category Manager)
                </h3>
                <p className="text-xs text-stone-400 font-medium">
                  เพิ่ม ลบ และจัดระเบียบหมวดหมู่เมนูของร้านได้อย่างอิสระ
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-[#161618] hover:bg-[#202024] border border-white/10 text-stone-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Area */}
          <div className="overflow-y-auto p-6 space-y-6 flex-1 custom-scrollbar">
            
            {/* Action Bar: Add Category Button */}
            {!isAddingNew && !editingId && (
              <div className="flex items-center justify-between bg-[#161618] p-4 rounded-2xl border border-white/10">
                <div className="text-xs text-stone-300">
                  <span>มีหมวดหมู่ทั้งหมด </span>
                  <strong className="text-white font-mono">{categories.length}</strong>
                  <span> หมวด</span>
                </div>
                <button
                  id="btn-open-add-category"
                  onClick={handleStartAdd}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF5C00] hover:bg-[#FF7729] text-white font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>เพิ่มหมวดหมู่ใหม่</span>
                </button>
              </div>
            )}

            {/* Add / Edit Category Form */}
            {(isAddingNew || editingId) && (
              <motion.form
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleSaveCategory}
                className="p-5 rounded-2xl bg-[#0A0A0B] border-2 border-[#FF5C00]/50 space-y-4 shadow-xl"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h4 className="font-display font-black text-sm text-[#FF5C00] uppercase tracking-wider flex items-center gap-2">
                    <FolderPlus className="w-4 h-4" />
                    {editingId ? 'แก้ไขหมวดหมู่อาหาร' : 'เพิ่มหมวดหมู่ใหม่'}
                  </h4>
                  <button
                    type="button"
                    onClick={handleCancelForm}
                    className="text-stone-400 hover:text-white text-xs font-bold"
                  >
                    ยกเลิก
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label-caps block mb-1">
                      ชื่อหมวดหมู่ (ภาษาไทย) *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="เช่น สเต๊ก & กริลล์, อาหารอีสาน..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#161618] border border-white/10 text-xs sm:text-sm text-white placeholder-stone-600 focus:outline-none focus:border-[#FF5C00] font-medium"
                    />
                  </div>

                  <div>
                    <label className="label-caps block mb-1">
                      ชื่อภาษาอังกฤษ (English Name)
                    </label>
                    <input
                      type="text"
                      value={nameEn}
                      onChange={(e) => setNameEn(e.target.value)}
                      placeholder="e.g. Steak & Grill, Isan Foods..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#161618] border border-white/10 text-xs sm:text-sm text-white placeholder-stone-600 focus:outline-none focus:border-[#FF5C00] font-medium"
                    />
                  </div>
                </div>

                {/* Icon Selection */}
                <div>
                  <label className="label-caps block mb-1.5">
                    เลือกไอคอนสัญลักษณ์
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {AVAILABLE_ICONS.map((item) => {
                      const IconComponent = item.icon;
                      const isSelected = iconName === item.name;
                      return (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => setIconName(item.name)}
                          className={`flex items-center gap-2 p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#FF5C00] text-white border-[#FF5C00] shadow-sm'
                              : 'bg-[#161618] text-stone-300 border-white/10 hover:border-white/20'
                          }`}
                        >
                          <IconComponent className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-[#FF5C00]'}`} />
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="label-caps block mb-1">
                    คำอธิบายหมวดหมู่ (ไม่บังคับ)
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="เช่น คัดสรรวัตถุดิบพรีเมียม ปรุงสดใหม่ทุกจาน"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#161618] border border-white/10 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-[#FF5C00] font-medium"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleCancelForm}
                    className="px-4 py-2 rounded-xl bg-[#161618] text-stone-300 hover:text-white text-xs font-bold cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#FF5C00] hover:bg-[#FF7729] text-white font-black text-xs uppercase tracking-wider shadow-md cursor-pointer"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>{editingId ? 'บันทึกการแก้ไข' : 'ยืนยันเพิ่มหมวดหมู่'}</span>
                  </button>
                </div>
              </motion.form>
            )}

            {/* Delete Confirmation Alert Banner */}
            {categoryToDelete && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-2xl bg-rose-950/40 border-2 border-rose-500/50 space-y-3 shadow-xl"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-white flex items-center gap-2">
                      <span>ยืนยันการลบหมวดหมู่:</span>
                      <span className="text-rose-400 font-black">"{categoryToDelete.name}"</span>
                    </h4>
                    <p className="text-xs text-stone-300 mt-1 leading-relaxed">
                      เมนูอาหารที่อยู่ในหมวดนี้ (
                      {menuItems.filter((m) => m.category === categoryToDelete.id).length} เมนู
                      ) จะถูกย้ายไปที่หมวด <strong>"ทั้งหมด"</strong> โดยอัตโนมัติ และไม่มีรายการอาหารใดสูญหาย
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-rose-500/20">
                  <button
                    type="button"
                    id="btn-cancel-delete-category"
                    onClick={() => setCategoryToDelete(null)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    id="btn-confirm-delete-category"
                    onClick={handleConfirmDelete}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-rose-950 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>ยืนยันลบหมวดหมู่นี้</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Existing Categories List */}
            <div className="space-y-3">
              <h4 className="label-caps">รายการหมวดหมู่ทั้งหมด</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {categories.map((cat) => {
                  const Icon = iconMap[cat.iconName] || Tag;
                  const count = cat.id === 'all'
                    ? menuItems.length
                    : menuItems.filter((m) => m.category === cat.id).length;

                  const isProtected = cat.id === 'all';
                  const isBeingDeleted = categoryToDelete?.id === cat.id;

                  return (
                    <div
                      key={cat.id}
                      className={`p-4 rounded-2xl border flex items-center justify-between gap-3 group transition-all ${
                        isBeingDeleted
                          ? 'bg-rose-950/30 border-rose-500/50 shadow-md ring-1 ring-rose-500/40'
                          : 'bg-[#161618] border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[#0A0A0B] border border-white/10 flex items-center justify-center text-[#FF5C00] shrink-0">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h5 className="font-bold text-sm text-white truncate">{cat.name}</h5>
                            <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded bg-white/10 text-stone-300">
                              {count} เมนู
                            </span>
                          </div>
                          {cat.nameEn && (
                            <p className="text-[11px] text-stone-400 font-medium truncate">{cat.nameEn}</p>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        {!isProtected && (
                          <>
                            <button
                              type="button"
                              id={`btn-edit-category-${cat.id}`}
                              onClick={() => handleStartEdit(cat)}
                              className="p-2 rounded-xl bg-[#0A0A0B] hover:bg-[#202024] text-stone-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
                              title="แก้ไขหมวดหมู่"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              id={`btn-delete-category-${cat.id}`}
                              onClick={() => {
                                setIsAddingNew(false);
                                setEditingId(null);
                                setCategoryToDelete(cat);
                              }}
                              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                                isBeingDeleted
                                  ? 'bg-rose-600 text-white border-rose-500'
                                  : 'bg-[#0A0A0B] hover:bg-rose-950/80 text-stone-400 hover:text-rose-400 border border-white/10'
                              }`}
                              title="ลบหมวดหมู่"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {isProtected && (
                          <span className="text-[10px] text-stone-500 font-bold px-2 py-1 rounded bg-[#0A0A0B]">
                            หมวดหมู่หลัก
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="p-4 sm:p-6 bg-[#0A0A0B] border-t border-white/10 flex items-center justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-[#161618] hover:bg-[#202024] text-white text-xs font-bold uppercase tracking-wider border border-white/10 transition-all cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
