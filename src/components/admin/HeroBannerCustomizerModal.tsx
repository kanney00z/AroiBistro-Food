import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Sparkles,
  Image as ImageIcon,
  Check,
  RotateCcw,
  Save,
  Upload,
  Layers,
  Type,
  Tag,
  Star,
  Flame,
  ShieldCheck,
  Clock,
  ChefHat,
  Eye,
  Sliders,
  Palette,
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { HeroBannerSettings } from '../../types';
import { DEFAULT_HERO_BANNER } from '../../data/mockData';
import { compressImageFile } from '../../utils/imageCompressor';

// Curated high-res signature food photo presets
const FOOD_PRESETS = [
  {
    name: 'เนื้อวากิว & ทรัฟเฟิล',
    url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1000&q=80',
    title: 'เนื้อวากิวออสเตรเลีย & ทรัฟเฟิลสด',
    price: 'เริ่มต้นเพียง ฿340',
  },
  {
    name: 'สเต๊กเนื้อริบอายพรีเมียม',
    url: 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=1000&q=80',
    title: 'Australian Black Angus Ribeye',
    price: '฿790',
  },
  {
    name: 'พาสต้าทรัฟเฟิลเส้นสด',
    url: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281691?auto=format&fit=crop&w=1000&q=80',
    title: 'Fettuccine Black Truffle Cream',
    price: '฿380',
  },
  {
    name: 'ผัดไทยกุ้งแม่น้ำอยุธยา',
    url: 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=1000&q=80',
    title: 'ผัดไทยกุ้งแม่น้ำเผาโบราณ',
    price: '฿320',
  },
  {
    name: 'ต้มยำกุ้งแม่น้ำน้ำข้น',
    url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1000&q=80',
    title: 'ต้มยำกุ้งแม่น้ำหม้อไฟโบราณ',
    price: '฿390',
  },
  {
    name: 'ดงบุริแซลมอน & อิคุระ',
    url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=1000&q=80',
    title: 'Salmon Ikura Donburi Special',
    price: '฿420',
  },
  {
    name: 'พิซซ่าเตาถ่านทรัฟเฟิล',
    url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1000&q=80',
    title: 'Artisan Truffle & Burrata Pizza',
    price: '฿460',
  },
  {
    name: 'มัทฉะบิงซูพรีเมียม',
    url: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=1000&q=80',
    title: 'Kyoto Uji Matcha Bingsu',
    price: '฿260',
  },
];

export const HeroBannerCustomizerModal: React.FC = () => {
  const {
    isHeroCustomizerOpen,
    setIsHeroCustomizerOpen,
    settings,
    updateHeroBannerSettings,
    resetHeroBannerToDefault,
  } = useRestaurant();

  const currentBanner = settings.heroBanner || DEFAULT_HERO_BANNER;

  const [formData, setFormData] = useState<HeroBannerSettings>(currentBanner);
  const [activeTab, setActiveTab] = useState<'text' | 'card' | 'features'>('text');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isHeroCustomizerOpen) {
      setFormData(settings.heroBanner || DEFAULT_HERO_BANNER);
    }
  }, [isHeroCustomizerOpen, settings.heroBanner]);

  if (!isHeroCustomizerOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateHeroBannerSettings(formData);
    setIsHeroCustomizerOpen(false);
  };

  const handleReset = () => {
    resetHeroBannerToDefault();
    setFormData(DEFAULT_HERO_BANNER);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const compressedDataUrl = await compressImageFile(file, { maxWidth: 1200, maxHeight: 1200, quality: 0.85 });
      setFormData((prev) => ({ ...prev, cardImageUrl: compressedDataUrl }));
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsHeroCustomizerOpen(false)}
          className="fixed inset-0 bg-stone-950/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          className="relative w-full max-w-4xl bg-[#111112] rounded-3xl border border-white/15 shadow-2xl overflow-hidden z-10 my-auto flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between bg-[#0A0A0B]">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#FF5C00]/20 border border-[#FF5C00]/40 text-[#FF5C00] flex items-center justify-center shadow-lg shrink-0">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-black text-lg sm:text-xl text-white">
                    ปรับแต่งหน้าเมนู & แบนเนอร์หัวเว็บ
                  </h3>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#FF5C00] text-white">
                    Menu Customizer
                  </span>
                </div>
                <p className="text-xs text-stone-400 mt-0.5">
                  ปรับเปลี่ยนข้อความพาดหัว, ภาพเมนูไฮไลท์, สโลแกน, และโปรโมชั่นที่แสดงบนหน้าแรกของลูกค้า
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsHeroCustomizerOpen(false)}
              className="w-10 h-10 rounded-2xl bg-[#161618] hover:bg-[#202024] text-stone-300 hover:text-white border border-white/10 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-white/10 bg-[#161618] px-4 sm:px-6 gap-2 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab('text')}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'text'
                  ? 'border-[#FF5C00] text-white'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <Type className="w-4 h-4" />
              <span>1. ข้อความพาดหัวหลัก</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('card')}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'card'
                  ? 'border-[#FF5C00] text-white'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>2. การ์ดเมนูไฮไลท์ & รูปภาพ</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('features')}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'features'
                  ? 'border-[#FF5C00] text-white'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <Tag className="w-4 h-4" />
              <span>3. ฟีเจอร์ โค้ดส่วนลด & ปุ่ม</span>
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSave} className="overflow-y-auto p-4 sm:p-6 space-y-6 flex-1 custom-scrollbar">
            
            {/* Live Interactive Mini-Preview Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-stone-400 font-bold">
                <span className="flex items-center gap-1.5 text-[#FF5C00]">
                  <Eye className="w-4 h-4" /> ตัวอย่างผลลัพธ์แบบเรียลไทม์ (Live Preview)
                </span>
                <span className="text-[11px] text-stone-500 font-mono">หน้าตาที่จะแสดงบนเว็บลูกค้า</span>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-[#0A0A0B] border border-white/10 shadow-inner grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                <div className="md:col-span-7 space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#161618] border border-white/10 text-[10px] text-white font-bold tracking-wider">
                    <Sparkles className="w-3 h-3 text-[#FF5C00]" />
                    <span>{formData.badgeText || 'CULINARY EXCELLENCE 2026'}</span>
                  </div>
                  <h4 className="font-display font-black text-lg sm:text-xl text-white leading-tight">
                    {formData.titleLine1 || 'CRAFTED FLAVORS.'} <br />
                    <span className="text-[#FF5C00]">{formData.titleLine2 || 'UNCOMPROMISED TASTE.'}</span>
                  </h4>
                  <p className="text-xs text-stone-300 line-clamp-2 leading-relaxed">
                    {formData.subtitle || 'คัดสรรเนื้อวากิวออสเตรเลีย พาสต้าทรัฟเฟิลเส้นสด...'}
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10px] text-stone-400 font-medium">✓ {formData.feature1Text}</span>
                    <span className="text-[10px] text-stone-400 font-medium">✓ {formData.feature2Text}</span>
                  </div>
                </div>

                <div className="md:col-span-5">
                  <div className="relative rounded-xl overflow-hidden border border-white/10 h-32 sm:h-36 group">
                    <img
                      src={formData.cardImageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between">
                      <div>
                        <span className="text-[9px] font-bold uppercase text-white bg-[#FF5C00] px-1.5 py-0.5 rounded">
                          {formData.cardBadge || "CHEF'S SIGNATURE"}
                        </span>
                        <p className="text-white text-xs font-bold truncate mt-0.5">{formData.cardTitle}</p>
                        <p className="text-stone-300 text-[10px] font-mono">{formData.cardSubtitle}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-lg bg-[#FF5C00] text-white text-xs font-mono font-black">
                        ★ {formData.cardRating || '4.9'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* TAB 1: Main Headline & Texts */}
            {activeTab === 'text' && (
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider">
                    ป้ายข้อความด้านบน (Top Badge)
                  </label>
                  <input
                    type="text"
                    value={formData.badgeText}
                    onChange={(e) => setFormData({ ...formData, badgeText: e.target.value })}
                    placeholder="เช่น CULINARY EXCELLENCE 2026"
                    className="w-full px-4 py-3 rounded-2xl bg-[#161618] border border-white/10 text-sm text-white focus:outline-none focus:border-[#FF5C00] font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider">
                      หัวข้อหลัก บรรทัดที่ 1 (Title Line 1)
                    </label>
                    <input
                      type="text"
                      value={formData.titleLine1}
                      onChange={(e) => setFormData({ ...formData, titleLine1: e.target.value })}
                      placeholder="เช่น CRAFTED FLAVORS."
                      className="w-full px-4 py-3 rounded-2xl bg-[#161618] border border-white/10 text-sm text-white focus:outline-none focus:border-[#FF5C00] font-bold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider">
                      หัวข้อหลัก บรรทัดที่ 2 (Title Line 2 - สีส้มเด่น)
                    </label>
                    <input
                      type="text"
                      value={formData.titleLine2}
                      onChange={(e) => setFormData({ ...formData, titleLine2: e.target.value })}
                      placeholder="เช่น UNCOMPROMISED TASTE."
                      className="w-full px-4 py-3 rounded-2xl bg-[#161618] border border-[#FF5C00]/40 text-sm text-[#FF5C00] focus:outline-none focus:border-[#FF5C00] font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider">
                    คำอธิบายสโลแกนใต้หัวข้อ (Subtitle Description)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    placeholder="ระบุจุดเด่น วัตถุดิบ ความพิเศษของร้าน..."
                    className="w-full px-4 py-3 rounded-2xl bg-[#161618] border border-white/10 text-sm text-white focus:outline-none focus:border-[#FF5C00] resize-none font-medium"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: Highlight Dish Card & Image */}
            {activeTab === 'card' && (
              <div className="space-y-5 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider">
                      ป้ายกำกับการ์ด (Card Badge)
                    </label>
                    <input
                      type="text"
                      value={formData.cardBadge}
                      onChange={(e) => setFormData({ ...formData, cardBadge: e.target.value })}
                      placeholder="เช่น CHEF'S SIGNATURE"
                      className="w-full px-4 py-3 rounded-2xl bg-[#161618] border border-white/10 text-sm text-white focus:outline-none focus:border-[#FF5C00] font-bold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider">
                      ชื่อเมนูไฮไลท์ (Dish Title)
                    </label>
                    <input
                      type="text"
                      value={formData.cardTitle}
                      onChange={(e) => setFormData({ ...formData, cardTitle: e.target.value })}
                      placeholder="เช่น เนื้อวากิวออสเตรเลีย & ทรัฟเฟิลสด"
                      className="w-full px-4 py-3 rounded-2xl bg-[#161618] border border-white/10 text-sm text-white focus:outline-none focus:border-[#FF5C00] font-bold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider">
                      ราคา / คำบรรยาย (Subtitle / Price)
                    </label>
                    <input
                      type="text"
                      value={formData.cardSubtitle}
                      onChange={(e) => setFormData({ ...formData, cardSubtitle: e.target.value })}
                      placeholder="เช่น เริ่มต้นเพียง ฿340"
                      className="w-full px-4 py-3 rounded-2xl bg-[#161618] border border-white/10 text-sm text-white focus:outline-none focus:border-[#FF5C00]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider">
                    คะแนนดาวรีวิว (Rating)
                  </label>
                  <input
                    type="text"
                    value={formData.cardRating}
                    onChange={(e) => setFormData({ ...formData, cardRating: e.target.value })}
                    placeholder="เช่น 4.9"
                    className="w-32 px-4 py-3 rounded-2xl bg-[#161618] border border-white/10 text-sm text-white focus:outline-none focus:border-[#FF5C00] font-mono font-bold"
                  />
                </div>

                {/* Preset Signature Dish Image Gallery (1-Click selection) */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider">
                      เลือกรูปภาพเมนูพรีเมียมสำเร็จรูป (1-Click Presets)
                    </label>
                    <span className="text-[11px] text-stone-400">คลิกที่รูปเพื่อเลือกทันที</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {FOOD_PRESETS.map((preset, idx) => {
                      const isChosen = formData.cardImageUrl === preset.url;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              cardImageUrl: preset.url,
                              cardTitle: preset.title,
                              cardSubtitle: preset.price,
                            }));
                          }}
                          className={`relative rounded-xl overflow-hidden border-2 text-left transition-all group cursor-pointer ${
                            isChosen
                              ? 'border-[#FF5C00] shadow-lg shadow-[#FF5C00]/30 scale-[1.02]'
                              : 'border-white/10 hover:border-white/30'
                          }`}
                        >
                          <img
                            src={preset.url}
                            alt={preset.name}
                            className="w-full h-20 sm:h-24 object-cover group-hover:scale-105 transition-transform"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                          <div className="absolute bottom-1.5 left-2 right-2 text-white">
                            <p className="text-[11px] font-bold truncate">{preset.name}</p>
                            <p className="text-[9px] text-stone-300 font-mono">{preset.price}</p>
                          </div>
                          {isChosen && (
                            <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#FF5C00] text-white flex items-center justify-center shadow">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Image URL & Upload */}
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider">
                    หรือ ใส่ลิงก์ URL รูปภาพ / อัปโหลดรูปภาพของคุณเอง
                  </label>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="url"
                      value={formData.cardImageUrl}
                      onChange={(e) => setFormData({ ...formData, cardImageUrl: e.target.value })}
                      placeholder="วาง URL รูปภาพ เช่น https://images.unsplash.com/..."
                      className="flex-1 px-4 py-3 rounded-2xl bg-[#161618] border border-white/10 text-xs sm:text-sm text-white focus:outline-none focus:border-[#FF5C00] font-mono"
                    />

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      className="hidden"
                    />

                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="px-5 py-3 rounded-2xl bg-[#202024] hover:bg-[#28282e] border border-white/15 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
                    >
                      <Upload className="w-4 h-4 text-[#FF5C00]" />
                      <span>{isUploading ? 'กำลังบีบอัดรูป...' : 'อัปโหลดรูปจากเครื่อง'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Features & Promos & Buttons */}
            {activeTab === 'features' && (
              <div className="space-y-5 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>ข้อความจุดเด่น 1 (Feature 1)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.feature1Text}
                      onChange={(e) => setFormData({ ...formData, feature1Text: e.target.value })}
                      placeholder="เช่น วัตถุดิบนำเข้าเกรด A+"
                      className="w-full px-4 py-3 rounded-2xl bg-[#161618] border border-white/10 text-sm text-white focus:outline-none focus:border-[#FF5C00]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-[#FF5C00]" />
                      <span>ข้อความจุดเด่น 2 (Feature 2)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.feature2Text}
                      onChange={(e) => setFormData({ ...formData, feature2Text: e.target.value })}
                      placeholder="เช่น เสิร์ฟด่วน 15-20 นาที"
                      className="w-full px-4 py-3 rounded-2xl bg-[#161618] border border-white/10 text-sm text-white focus:outline-none focus:border-[#FF5C00]"
                    />
                  </div>
                </div>

                {/* Custom Dish Button Options */}
                <div className="p-4 rounded-2xl bg-[#161618] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ChefHat className="w-5 h-5 text-[#FF5C00]" />
                      <div>
                        <h4 className="text-sm font-bold text-white">ปุ่มสั่งทำเมนูพิเศษตามใจคุณ</h4>
                        <p className="text-xs text-stone-400">เปิดให้ลูกค้ากดสั่งอาหารที่ไม่อยู่ในเล่มเมนูได้</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.showCustomDishButton}
                        onChange={(e) => setFormData({ ...formData, showCustomDishButton: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-stone-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF5C00]" />
                    </label>
                  </div>

                  {formData.showCustomDishButton && (
                    <div className="pt-2">
                      <label className="block text-xs font-bold text-stone-400 mb-1">
                        ข้อความบนปุ่ม (Button Text)
                      </label>
                      <input
                        type="text"
                        value={formData.customDishButtonText}
                        onChange={(e) => setFormData({ ...formData, customDishButtonText: e.target.value })}
                        placeholder="เช่น ✨ สั่งทำเมนูพิเศษตามใจคุณ"
                        className="w-full px-4 py-2.5 rounded-xl bg-[#0A0A0B] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF5C00]"
                      />
                    </div>
                  )}
                </div>

                {/* Promo Codes Quick Badges */}
                <div className="p-4 rounded-2xl bg-[#161618] border border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Tag className="w-5 h-5 text-[#FF5C00]" />
                      <div>
                        <h4 className="text-sm font-bold text-white">แถบป้ายโค้ดส่วนลดโปรโมชั่นด่วน</h4>
                        <p className="text-xs text-stone-400">ปุ่มคัดลอกโค้ดส่วนลด 1-คลิก บนหน้าแบนเนอร์</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.showPromoCodes}
                        onChange={(e) => setFormData({ ...formData, showPromoCodes: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-stone-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF5C00]" />
                    </label>
                  </div>

                  {formData.showPromoCodes && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div className="p-3 rounded-xl bg-[#0A0A0B] border border-white/10 space-y-2">
                        <span className="text-[11px] font-bold text-[#FF5C00]">โค้ดโปรโมชั่นที่ 1</span>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={formData.promoCode1}
                            onChange={(e) => setFormData({ ...formData, promoCode1: e.target.value.toUpperCase() })}
                            placeholder="AROI10"
                            className="w-1/2 px-3 py-2 rounded-lg bg-[#161618] border border-white/10 text-xs text-white uppercase font-mono font-bold"
                          />
                          <input
                            type="text"
                            value={formData.promoLabel1}
                            onChange={(e) => setFormData({ ...formData, promoLabel1: e.target.value })}
                            placeholder="ลด 10%"
                            className="w-1/2 px-3 py-2 rounded-lg bg-[#161618] border border-white/10 text-xs text-white"
                          />
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-[#0A0A0B] border border-white/10 space-y-2">
                        <span className="text-[11px] font-bold text-amber-400">โค้ดโปรโมชั่นที่ 2</span>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={formData.promoCode2}
                            onChange={(e) => setFormData({ ...formData, promoCode2: e.target.value.toUpperCase() })}
                            placeholder="WELCOME50"
                            className="w-1/2 px-3 py-2 rounded-lg bg-[#161618] border border-white/10 text-xs text-white uppercase font-mono font-bold"
                          />
                          <input
                            type="text"
                            value={formData.promoLabel2}
                            onChange={(e) => setFormData({ ...formData, promoLabel2: e.target.value })}
                            placeholder="ลด 50฿"
                            className="w-1/2 px-3 py-2 rounded-lg bg-[#161618] border border-white/10 text-xs text-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sticky Action Footer */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-3 rounded-2xl bg-[#161618] hover:bg-[#202024] border border-white/10 text-stone-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">คืนค่าเริ่มต้น</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsHeroCustomizerOpen(false)}
                  className="px-4 sm:px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-2xl bg-[#FF5C00] hover:bg-[#FF7729] text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-xl shadow-[#FF5C00]/25 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>บันทึกการปรับแต่ง</span>
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
