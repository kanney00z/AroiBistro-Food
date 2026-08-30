import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Star, Clock, Flame, Sparkles, AlertCircle } from 'lucide-react';
import { MenuItem } from '../../types';
import { useRestaurant } from '../../context/RestaurantContext';

interface MenuGridProps {
  items: MenuItem[];
  onSelectDish: (item: MenuItem) => void;
}

export const MenuGrid: React.FC<MenuGridProps> = ({ items, onSelectDish }) => {
  const { addToCart } = useRestaurant();

  const handleQuickAdd = (e: React.MouseEvent, item: MenuItem) => {
    e.stopPropagation();
    if (!item.available) return;

    // If item has required options, open modal instead
    const hasRequiredOptions = item.optionGroups && item.optionGroups.some((g) => g.required);
    if (hasRequiredOptions) {
      onSelectDish(item);
    } else {
      addToCart(item, [], 1);
    }
  };

  if (items.length === 0) {
    return (
      <div id="no-menu-items-found" className="text-center py-20 bg-stone-900/50 rounded-3xl border border-dashed border-stone-800 my-8">
        <AlertCircle className="w-12 h-12 text-stone-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-stone-200">ไม่พบเมนูที่คุณค้นหา</h3>
        <p className="text-sm text-stone-400 mt-1">ลองเปลี่ยนคำค้นหา หรือเลือกหมวดหมู่อื่นดูนะครับ</p>
      </div>
    );
  }

  return (
    <div id="menu-items-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-16">
      <AnimatePresence mode="popLayout">
        {items.map((item, index) => {
          const isSoldOut = !item.available;

          return (
            <motion.div
              key={item.id}
              id={`dish-card-${item.id}`}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25, delay: index * 0.04 }}
              onClick={() => onSelectDish(item)}
              className={`group relative flex flex-col rounded-3xl bg-[#161618] border border-white/10 hover:border-[#FF5C00]/60 hover:bg-[#1c1c20] transition-all duration-300 shadow-xl overflow-hidden cursor-pointer ${
                isSoldOut ? 'opacity-70 grayscale-[30%]' : ''
              }`}
            >
              {/* Image Container with Badges */}
              <div className="relative w-full h-52 overflow-hidden bg-[#0A0A0B]">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-[#161618] via-transparent to-transparent opacity-90" />

                {/* Top Badges */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                  {item.isChefSpecial && (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#FF5C00] text-white text-[10px] font-black uppercase tracking-wider shadow-md shadow-[#FF5C00]/30">
                      <Sparkles className="w-3 h-3" />
                      เชฟแนะนำ
                    </span>
                  )}
                  {item.isPopular && (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white text-[#0A0A0B] text-[10px] font-black uppercase tracking-wider shadow-md">
                      <Flame className="w-3 h-3 text-[#FF5C00]" />
                      ยอดนิยม
                    </span>
                  )}
                </div>

                {/* Rating Badge */}
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#0A0A0B]/85 backdrop-blur-md border border-white/15 text-xs text-white font-mono font-bold">
                  <Star className="w-3.5 h-3.5 fill-[#FF5C00] text-[#FF5C00]" />
                  <span>{item.rating}</span>
                </div>

                {/* Sold out overlay banner */}
                {isSoldOut && (
                  <div className="absolute inset-0 bg-[#0A0A0B]/80 backdrop-blur-xs flex items-center justify-center">
                    <span className="px-4 py-1.5 rounded-xl bg-rose-950/90 border border-rose-500 text-rose-300 font-black text-xs uppercase tracking-wider">
                      หมดชั่วคราว (Sold Out)
                    </span>
                  </div>
                )}

                {/* Bottom Meta Pill on Image */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-stone-300">
                  <div className="flex items-center gap-1 bg-[#0A0A0B]/80 px-2.5 py-1 rounded-lg border border-white/10 font-mono font-medium">
                    <Clock className="w-3 h-3 text-[#FF5C00]" />
                    <span>~{item.prepTimeMinutes} นาที</span>
                  </div>
                  {item.isSpicy && item.isSpicy > 0 && (
                    <div className="flex items-center gap-0.5 bg-[#0A0A0B]/80 px-2 py-1 rounded-lg border border-white/10 text-rose-400 font-medium">
                      <span>{'🌶️'.repeat(item.isSpicy)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Content Details */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-extrabold text-base text-white group-hover:text-[#FF5C00] transition-colors line-clamp-1">
                    {item.name}
                  </h3>
                  <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider mt-0.5 mb-2 line-clamp-1">
                    {item.nameEn}
                  </p>
                  <p className="text-xs text-stone-300 leading-relaxed line-clamp-2">
                    {item.description}
                  </p>
                </div>

                {/* Price and Add to Cart Action */}
                <div className="pt-4 mt-2 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <span className="label-caps block">PRICE</span>
                    <div className="text-xl font-black font-mono text-[#FF5C00] tracking-tight">
                      ฿{item.price.toLocaleString()}
                    </div>
                  </div>

                  <motion.button
                    id={`quick-add-${item.id}`}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    disabled={isSoldOut}
                    onClick={(e) => handleQuickAdd(e, item)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md ${
                      isSoldOut
                        ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
                        : 'bg-[#FF5C00] hover:bg-[#FF7729] text-white shadow-[#FF5C00]/25'
                    }`}
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>เลือก</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
