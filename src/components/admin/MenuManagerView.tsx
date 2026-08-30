import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Search,
  Sparkles,
  Flame,
  Star,
  Clock,
  X,
  Image as ImageIcon,
  Upload,
  Link as LinkIcon,
  Grid,
  Check,
  RefreshCw,
  FolderTree,
  Sliders,
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { MenuItem, OptionGroup } from '../../types';
import { CategoryManagerModal } from './CategoryManagerModal';
import { OptionGroupsEditor } from './OptionGroupsEditor';

// Preset sample food photo library for 1-click selection
const PRESET_FOOD_IMAGES = [
  {
    name: 'ข้าวซอยเนื้อ / แกง',
    category: 'จานหลัก',
    url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'ต้มยำกุ้งแม่น้ำ',
    category: 'ต้ม/แกง',
    url: 'https://images.unsplash.com/photo-1548943487-a2e4e43b4853?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'สเต๊กเนื้อริบอายพรีเมียม',
    category: 'สเต๊ก/ย่าง',
    url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'สปาเก็ตตี้คาโบนาร่า / พาสต้า',
    category: 'พาสต้า',
    url: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'พิซซ่าเตาฟืนทรัฟเฟิล',
    category: 'พิซซ่า',
    url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'แซลมอนย่างซีอิ๊ว / ซาชิมิ',
    category: 'ซีฟู้ด',
    url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'เบอร์เกอร์เนื้อแบล็คแองกัส',
    category: 'เบอร์เกอร์',
    url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'สลัดร็อกเก็ตอกไก่ย่าง',
    category: 'สลัด/ทานเล่น',
    url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'ฮะเก๋า / ติ่มซำจักรพรรดิ',
    category: 'ทานเล่น',
    url: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'ข้าวเหนียวมะม่วงน้ำดอกไม้',
    category: 'ของหวาน',
    url: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'โทสต์เนยสดคาราเมล',
    category: 'ของหวาน',
    url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'มัทฉะลาเต้พรีเมียม / ชาเขียว',
    category: 'เครื่องดื่ม',
    url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'กาแฟสด Dirty Coffee / ลาเต้',
    category: 'เครื่องดื่ม',
    url: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'ม็อกเทลผลไม้สดซิกเนเจอร์',
    category: 'เครื่องดื่ม',
    url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80',
  },
];

export const MenuManagerView: React.FC = () => {
  const {
    categories,
    menuItems,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    toggleItemAvailability,
    showToast,
  } = useRestaurant();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<'details' | 'options'>('details');
  const [imageTab, setImageTab] = useState<'upload' | 'preset' | 'url'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State for Add / Edit
  const [formData, setFormData] = useState<{
    name: string;
    nameEn: string;
    description: string;
    price: number;
    category: string;
    image: string;
    prepTimeMinutes: number;
    isPopular: boolean;
    isChefSpecial: boolean;
    isSpicy: number;
    available: boolean;
    optionGroups: OptionGroup[];
  }>({
    name: '',
    nameEn: '',
    description: '',
    price: 150,
    category: 'mains',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    prepTimeMinutes: 15,
    isPopular: false,
    isChefSpecial: false,
    isSpicy: 0,
    available: true,
    optionGroups: [],
  });

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('กรุณาเลือกไฟล์รูปภาพเท่านั้น (JPG, PNG, WEBP, GIF)', 'warning');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast('ขนาดไฟล์ภาพต้องไม่เกิน 10MB', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setFormData((prev) => ({ ...prev, image: result }));
        showToast(`เลือกรูปภาพ "${file.name}" สำเร็จ`, 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setImageTab('upload');
    setActiveModalTab('details');
    const firstCategory = categories.find((c) => c.id !== 'all')?.id || 'mains';
    setFormData({
      name: '',
      nameEn: '',
      description: '',
      price: 180,
      category: firstCategory,
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80',
      prepTimeMinutes: 15,
      isPopular: false,
      isChefSpecial: false,
      isSpicy: 0,
      available: true,
      optionGroups: [],
    });
    setIsEditModalOpen(true);
  };

  const handleOpenEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setImageTab('upload');
    setActiveModalTab('details');
    setFormData({
      name: item.name,
      nameEn: item.nameEn,
      description: item.description,
      price: item.price,
      category: item.category,
      image: item.image,
      prepTimeMinutes: item.prepTimeMinutes,
      isPopular: !!item.isPopular,
      isChefSpecial: !!item.isChefSpecial,
      isSpicy: item.isSpicy || 0,
      available: item.available,
      optionGroups: item.optionGroups || [],
    });
    setIsEditModalOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingItem) {
      updateMenuItem(editingItem.id, formData);
    } else {
      addMenuItem({
        ...formData,
        rating: 5.0,
        reviewsCount: 1,
      });
    }

    setIsEditModalOpen(false);
  };

  const filteredItems = menuItems.filter((item) => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.nameEn.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div id="admin-menu-manager-view" className="space-y-6 pb-12">
      
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#111112] p-6 rounded-3xl border border-white/10">
        <div>
          <h3 className="font-display font-black text-lg text-white uppercase tracking-wider">รายการเมนูอาหาร & คลังสต็อก</h3>
          <p className="text-xs text-stone-400 mt-0.5 font-medium">
            จัดการรายการอาหาร ปรับราคา กำหนดตัวเลือกย่อย (พิเศษ/ไม่ใส่ผัก/ท็อปปิ้ง) และเพิ่ม-ลบหมวดหมู่
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Manage Categories Button */}
          <button
            id="btn-manage-categories"
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#161618] hover:bg-[#202024] text-stone-200 hover:text-white border border-white/10 text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
          >
            <FolderTree className="w-4 h-4 text-[#FF5C00]" />
            <span>จัดการหมวดหมู่ ({categories.length})</span>
          </button>

          {/* Add New Menu Item Button */}
          <button
            id="btn-add-new-dish"
            onClick={handleOpenAddModal}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#FF5C00] hover:bg-[#FF7729] text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-[#FF5C00]/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มเมนูอาหารใหม่</span>
          </button>
        </div>
      </div>

      {/* Category Pills & Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Category Filter */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#FF5C00] text-white font-black shadow-md'
                  : 'bg-[#111112] text-stone-400 hover:text-white border border-white/10'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
          <input
            type="text"
            placeholder="ค้นหาชื่อเมนู..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 rounded-xl bg-[#111112] border border-white/10 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#FF5C00] font-medium"
          />
        </div>
      </div>

      {/* Dishes Catalog Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            id={`admin-dish-${item.id}`}
            className="rounded-3xl bg-[#111112] border border-white/10 overflow-hidden flex flex-col justify-between shadow-xl"
          >
            <div>
              {/* Thumbnail */}
              <div className="relative h-44 w-full bg-[#0A0A0B]">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                
                <div className="absolute top-3 left-3 flex gap-1">
                  {item.isChefSpecial && (
                    <span className="px-2 py-0.5 rounded-md bg-[#FF5C00] text-white font-black text-[10px] uppercase tracking-wider">
                      เชฟแนะนำ
                    </span>
                  )}
                  {item.isPopular && (
                    <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white font-black text-[10px] uppercase tracking-wider">
                      ยอดนิยม
                    </span>
                  )}
                </div>

                {/* In Stock Badge Button */}
                <button
                  onClick={() => toggleItemAvailability(item.id)}
                  className={`absolute top-3 right-3 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg backdrop-blur-md border transition-all cursor-pointer ${
                    item.available
                      ? 'bg-emerald-950/85 border-emerald-500/80 text-emerald-300'
                      : 'bg-rose-950/85 border-rose-500/80 text-rose-300'
                  }`}
                >
                  {item.available ? '● พร้อมเสิร์ฟ' : '✕ ของหมด'}
                </button>
              </div>

              {/* Details */}
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-1">
                  <div>
                    <h4 className="font-bold text-sm text-white line-clamp-1">{item.name}</h4>
                    <p className="text-[11px] text-stone-400 line-clamp-1 font-medium">{item.nameEn}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-black text-[#FF5C00] text-sm">
                      ฿{item.price.toLocaleString()}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-stone-400 line-clamp-2 font-medium">{item.description}</p>

                {/* Options Count Badge */}
                {item.optionGroups && item.optionGroups.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {item.optionGroups.map((og) => (
                      <span
                        key={og.id}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/5 text-stone-300 border border-white/10 flex items-center gap-1"
                      >
                        <Sliders className="w-2.5 h-2.5 text-[#FF5C00]" />
                        <span>{og.name}</span>
                        <span className="text-stone-500 font-mono">({og.choices.length})</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Actions Bar */}
            <div className="p-4 pt-2 border-t border-white/10 flex items-center justify-between gap-2">
              <button
                onClick={() => toggleItemAvailability(item.id)}
                className="text-xs font-bold text-stone-400 hover:text-[#FF5C00] transition-colors cursor-pointer"
              >
                {item.available ? 'กดเพื่อเปลี่ยนเป็นหมด' : 'กดเพื่อเปิดขาย'}
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  id={`btn-edit-dish-${item.id}`}
                  onClick={() => handleOpenEditModal(item)}
                  className="p-2 rounded-xl bg-[#161618] hover:bg-[#202024] border border-white/10 text-stone-200 hover:text-white transition-colors cursor-pointer"
                  title="แก้ไขเมนู"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  id={`btn-delete-dish-${item.id}`}
                  onClick={() => deleteMenuItem(item.id)}
                  className="p-2 rounded-xl bg-[#161618] hover:bg-rose-950/80 border border-white/10 text-stone-400 hover:text-rose-400 transition-colors cursor-pointer"
                  title="ลบเมนู"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Dish Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditModalOpen(false)}
              className="fixed inset-0 bg-black/85 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              className="relative w-full max-w-2xl bg-[#111112] rounded-3xl border border-white/10 shadow-2xl overflow-hidden z-10 my-auto flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#0A0A0B]">
                <div>
                  <h3 className="font-display font-black text-lg text-white uppercase tracking-wider">
                    {editingItem ? 'แก้ไขเมนูอาหาร' : 'เพิ่มเมนูอาหารใหม่'}
                  </h3>
                  <p className="text-xs text-stone-400 font-medium">
                    กำหนดข้อมูลทั่วไป รูปภาพ และตัวเลือกย่อย (เช่น ธรรมดา/พิเศษ, สิ่งที่ไม่ใส่)
                  </p>
                </div>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="w-9 h-9 rounded-xl bg-[#161618] hover:bg-[#202024] border border-white/10 text-stone-300 hover:text-white flex items-center justify-center cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Tabs between General Info & Sub-Options */}
              <div className="flex border-b border-white/10 bg-[#0A0A0B] px-6">
                <button
                  type="button"
                  onClick={() => setActiveModalTab('details')}
                  className={`py-3 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                    activeModalTab === 'details'
                      ? 'border-[#FF5C00] text-white'
                      : 'border-transparent text-stone-400 hover:text-stone-200'
                  }`}
                >
                  1. ข้อมูลทั่วไป & รูปภาพ
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModalTab('options')}
                  className={`py-3 px-4 text-xs font-black uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                    activeModalTab === 'options'
                      ? 'border-[#FF5C00] text-white'
                      : 'border-transparent text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <span>2. ตัวเลือกเมนูย่อย / ระดับ / ท็อปปิ้ง</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-[#FF5C00]/20 text-[#FF5C00]">
                    {formData.optionGroups.length}
                  </span>
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSaveForm} className="overflow-y-auto p-6 space-y-5 flex-1 custom-scrollbar">
                
                {/* TAB 1: Details & Image */}
                {activeModalTab === 'details' && (
                  <div className="space-y-4">
                    <div>
                      <label className="label-caps block mb-1">
                        ชื่ออาหาร (ภาษาไทย) *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="เช่น ข้าวผัดเนื้อปูก้อน Jumbo"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0B] border border-white/10 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-[#FF5C00] font-medium"
                      />
                    </div>

                    <div>
                      <label className="label-caps block mb-1">
                        ชื่อภาษาอังกฤษ (English Name)
                      </label>
                      <input
                        type="text"
                        value={formData.nameEn}
                        onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                        placeholder="e.g. Jumbo Crab Meat Fried Rice"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0B] border border-white/10 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-[#FF5C00] font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label-caps block mb-1">
                          ราคาเริ่มต้น (฿) *
                        </label>
                        <input
                          type="number"
                          required
                          min={0}
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0B] border border-white/10 text-sm text-white font-mono font-bold focus:outline-none focus:border-[#FF5C00]"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="label-caps block">
                            หมวดหมู่ *
                          </label>
                          <button
                            type="button"
                            onClick={() => setIsCategoryModalOpen(true)}
                            className="text-[10px] text-[#FF5C00] hover:underline font-bold"
                          >
                            + เพิ่มหมวดใหม่
                          </button>
                        </div>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0B] border border-white/10 text-sm text-white focus:outline-none focus:border-[#FF5C00] font-medium cursor-pointer"
                        >
                          {categories.filter((c) => c.id !== 'all').map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} {c.nameEn ? `(${c.nameEn})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Image Selection Section */}
                    <div className="space-y-3 pt-1">
                      <div className="flex items-center justify-between">
                        <label className="label-caps block">
                          รูปภาพเมนูอาหาร (Dish Image) *
                        </label>
                        <span className="text-[10px] text-stone-400 font-bold">
                          เลือกอัปโหลดไฟล์ หรือ เลือกจากคลังภาพ
                        </span>
                      </div>

                      {/* Active Selected Image Preview Box */}
                      <div className="p-3 rounded-2xl bg-[#0A0A0B] border border-white/10 flex items-center gap-4">
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-[#161618] border border-white/10 shrink-0">
                          {formData.image ? (
                            <img
                              src={formData.image}
                              alt="Menu Preview"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-stone-500">
                              <ImageIcon className="w-8 h-8" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">รูปภาพปัจจุบัน</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FF5C00]/20 text-[#FF5C00] border border-[#FF5C00]/30">
                              พร้อมใช้งาน
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-400 truncate mt-0.5 font-mono">
                            {formData.image.startsWith('data:') ? 'ไฟล์ภาพที่อัปโหลดจากเครื่อง (Base64)' : formData.image}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="text-[11px] font-bold text-[#FF5C00] hover:text-[#FF7729] flex items-center gap-1 cursor-pointer"
                            >
                              <Upload className="w-3 h-3" />
                              <span>เลือกไฟล์ใหม่</span>
                            </button>
                            <span className="text-stone-600">•</span>
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80' })}
                              className="text-[11px] font-medium text-stone-400 hover:text-white flex items-center gap-1 cursor-pointer"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>รีเซ็ตค่าเริ่มต้น</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Method Selection Tabs */}
                      <div className="flex items-center gap-1.5 p-1 bg-[#0A0A0B] rounded-xl border border-white/10 text-xs">
                        <button
                          type="button"
                          onClick={() => setImageTab('upload')}
                          className={`flex-1 py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            imageTab === 'upload'
                              ? 'bg-[#FF5C00] text-white shadow-sm'
                              : 'text-stone-400 hover:text-white'
                          }`}
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>อัปโหลดจากเครื่อง</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setImageTab('preset')}
                          className={`flex-1 py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            imageTab === 'preset'
                              ? 'bg-[#FF5C00] text-white shadow-sm'
                              : 'text-stone-400 hover:text-white'
                          }`}
                        >
                          <Grid className="w-3.5 h-3.5" />
                          <span>คลังภาพตัวอย่าง</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setImageTab('url')}
                          className={`flex-1 py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            imageTab === 'url'
                              ? 'bg-[#FF5C00] text-white shadow-sm'
                              : 'text-stone-400 hover:text-white'
                          }`}
                        >
                          <LinkIcon className="w-3.5 h-3.5" />
                          <span>ลิงก์ URL</span>
                        </button>
                      </div>

                      {/* Tab 1: File Upload & Drag-Drop */}
                      {imageTab === 'upload' && (
                        <div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleImageFile(e.target.files[0]);
                              }
                            }}
                          />
                          <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`p-6 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                              isDragging
                                ? 'border-[#FF5C00] bg-[#FF5C00]/10 scale-[1.01]'
                                : 'border-white/15 bg-[#0A0A0B] hover:border-white/30 hover:bg-[#161618]'
                            }`}
                          >
                            <div className="w-12 h-12 rounded-2xl bg-[#161618] border border-white/10 flex items-center justify-center text-[#FF5C00] mb-3 shadow-inner">
                              <Upload className="w-6 h-6" />
                            </div>
                            <p className="text-xs font-bold text-white mb-1">
                              คลิกเพื่อเลือกไฟล์ภาพ หรือ ลากรูปมาวางที่นี่
                            </p>
                            <p className="text-[11px] text-stone-400">
                              รองรับไฟล์ PNG, JPG, JPEG, WEBP หรือ GIF (สูงสุด 10MB)
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Tab 2: Preset Library Grid */}
                      {imageTab === 'preset' && (
                        <div className="space-y-2">
                          <div className="text-[11px] text-stone-400 font-medium">
                            คลิกเลือกภาพอาหารสำเร็จรูปที่ต้องการ:
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto p-1 custom-scrollbar">
                            {PRESET_FOOD_IMAGES.map((preset, idx) => {
                              const isSelected = formData.image === preset.url;
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    setFormData({ ...formData, image: preset.url });
                                    showToast(`เลือกรูป "${preset.name}" เรียบร้อย`, 'success');
                                  }}
                                  className={`group relative rounded-xl overflow-hidden border text-left transition-all cursor-pointer aspect-[4/3] ${
                                    isSelected
                                      ? 'border-[#FF5C00] ring-2 ring-[#FF5C00]/50'
                                      : 'border-white/10 hover:border-white/30'
                                  }`}
                                >
                                  <img
                                    src={preset.url}
                                    alt={preset.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-2">
                                    <span className="text-[9px] font-bold uppercase text-[#FF5C00]">
                                      {preset.category}
                                    </span>
                                    <span className="text-[11px] font-bold text-white leading-tight truncate">
                                      {preset.name}
                                    </span>
                                  </div>
                                  {isSelected && (
                                    <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#FF5C00] text-white flex items-center justify-center shadow-md">
                                      <Check className="w-3 h-3 stroke-[3]" />
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Tab 3: Direct URL Input */}
                      {imageTab === 'url' && (
                        <div className="space-y-2">
                          <input
                            type="url"
                            value={formData.image}
                            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                            placeholder="https://images.unsplash.com/..."
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0B] border border-white/10 text-xs text-white font-mono focus:outline-none focus:border-[#FF5C00]"
                          />
                          <p className="text-[10px] text-stone-400 font-medium">
                            วางลิงก์รูปภาพโดยตรงจากอินเทอร์เน็ต เช่น Unsplash หรือ Cloud CDN
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="label-caps block mb-1">
                        คำอธิบายและวัตถุดิบ
                      </label>
                      <textarea
                        rows={2}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="รายละเอียดรสชาติ วัตถุดิบเด่น..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0B] border border-white/10 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#FF5C00] resize-none font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <label className="flex items-center gap-2 text-xs font-bold text-stone-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isChefSpecial}
                          onChange={(e) => setFormData({ ...formData, isChefSpecial: e.target.checked })}
                          className="w-4 h-4 rounded text-[#FF5C00] focus:ring-[#FF5C00] bg-[#0A0A0B] border-white/20 accent-[#FF5C00]"
                        />
                        <span>⭐ เชฟแนะนำ (Signature)</span>
                      </label>

                      <label className="flex items-center gap-2 text-xs font-bold text-stone-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isPopular}
                          onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                          className="w-4 h-4 rounded text-[#FF5C00] focus:ring-[#FF5C00] bg-[#0A0A0B] border-white/20 accent-[#FF5C00]"
                        />
                        <span>🔥 ยอดนิยม (Popular)</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* TAB 2: Option Groups / Modifiers Editor */}
                {activeModalTab === 'options' && (
                  <div className="space-y-4">
                    <OptionGroupsEditor
                      optionGroups={formData.optionGroups}
                      onChange={(updatedGroups) =>
                        setFormData({ ...formData, optionGroups: updatedGroups })
                      }
                    />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
                  {activeModalTab === 'details' ? (
                    <button
                      type="button"
                      onClick={() => setActiveModalTab('options')}
                      className="px-4 py-2.5 rounded-xl bg-[#161618] hover:bg-[#202024] border border-white/10 text-[#FF5C00] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>ไปตั้งค่าตัวเลือกย่อย ({formData.optionGroups.length}) &rarr;</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveModalTab('details')}
                      className="px-4 py-2.5 rounded-xl bg-[#161618] hover:bg-[#202024] border border-white/10 text-stone-300 hover:text-white text-xs font-bold cursor-pointer"
                    >
                      &larr; กลับหน้าข้อมูลทั่วไป
                    </button>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl bg-[#161618] hover:bg-[#202024] border border-white/10 text-stone-300 hover:text-white text-xs font-bold cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-[#FF5C00] hover:bg-[#FF7729] text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-[#FF5C00]/25 cursor-pointer"
                    >
                      บันทึกข้อมูลเมนู
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Category Manager Modal */}
      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
      />
    </div>
  );
};

