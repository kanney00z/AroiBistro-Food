import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';

export const Toast: React.FC = () => {
  const { toastMessage } = useRestaurant();

  return (
    <AnimatePresence>
      {toastMessage && (
        <motion.div
          id="global-toast-notification"
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl backdrop-blur-md bg-[#111112]/95 border border-white/15 text-white max-w-md"
        >
          {toastMessage.type === 'success' && (
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          )}
          {toastMessage.type === 'info' && (
            <div className="w-8 h-8 rounded-xl bg-[#FF5C00]/20 text-[#FF5C00] flex items-center justify-center shrink-0 border border-[#FF5C00]/30">
              <Info className="w-5 h-5" />
            </div>
          )}
          {toastMessage.type === 'warning' && (
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
              <AlertTriangle className="w-5 h-5" />
            </div>
          )}
          <span className="text-xs font-bold leading-snug tracking-wide">{toastMessage.text}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
