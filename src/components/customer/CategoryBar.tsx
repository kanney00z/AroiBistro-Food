import React from 'react';
import { motion } from 'motion/react';
import {
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
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';

interface CategoryBarProps {
  selectedCategory: string;
  onSelectCategory: (catId: string) => void;
}

export const categoryIconMap: Record<string, React.ElementType> = {
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

export const CategoryBar: React.FC<CategoryBarProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  const { categories, menuItems } = useRestaurant();

  return (
    <div id="category-navigation-bar" className="sticky top-16 sm:top-20 z-30 bg-[#0A0A0B]/95 backdrop-blur-md py-2.5 sm:py-3.5 -mx-3 sm:-mx-6 lg:-mx-8 px-3 sm:px-6 lg:px-8 border-b border-white/10 mb-6 sm:mb-8 transition-all">
      <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto no-scrollbar py-1">
        {categories.map((cat) => {
          const Icon = categoryIconMap[cat.iconName] || Tag;
          const isActive = selectedCategory === cat.id;
          
          const count = cat.id === 'all'
            ? menuItems.length
            : menuItems.filter((m) => m.category === cat.id).length;

          return (
            <button
              key={cat.id}
              id={`cat-button-${cat.id}`}
              onClick={() => onSelectCategory(cat.id)}
              className={`relative group shrink-0 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'text-white font-extrabold'
                  : 'bg-[#161618] text-stone-300 hover:text-white hover:bg-[#202024] border border-white/10'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="active-category-pill"
                  className="absolute inset-0 bg-[#FF5C00] rounded-2xl shadow-lg shadow-[#FF5C00]/30"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#FF5C00] group-hover:scale-110 transition-transform'}`} />
                <span>{cat.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-black ${
                    isActive
                      ? 'bg-black/30 text-white'
                      : 'bg-white/10 text-stone-300'
                  }`}
                >
                  {count}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
