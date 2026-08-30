import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Lock,
  Unlock,
  X,
  KeyRound,
  AlertCircle,
  Delete,
  ShieldCheck,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';

export const AdminAuthModal: React.FC = () => {
  const {
    settings,
    isAdminAuthModalOpen,
    setIsAdminAuthModalOpen,
    setIsAdminMode,
    showToast,
  } = useRestaurant();

  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const correctPin = settings.adminPin || '1234';

  useEffect(() => {
    if (isAdminAuthModalOpen) {
      setPin('');
      setErrorMsg('');
      setIsShaking(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isAdminAuthModalOpen]);

  if (!isAdminAuthModalOpen) return null;

  const handleKeyPress = (num: string) => {
    if (pin.length < 8) {
      const newPin = pin + num;
      setPin(newPin);
      setErrorMsg('');
      if (newPin === correctPin) {
        handleSuccess();
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleClear = () => {
    setPin('');
    setErrorMsg('');
  };

  const handleSuccess = () => {
    setIsAdminMode(true);
    setIsAdminAuthModalOpen(false);
    showToast('เข้าสู่ระบบจัดการหลังบ้านสำเร็จ 👨‍🍳', 'success');
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pin === correctPin) {
      handleSuccess();
    } else {
      setIsShaking(true);
      setErrorMsg('รหัส PIN ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
      setTimeout(() => setIsShaking(false), 600);
    }
  };

  const keypadNumbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'];

  return (
    <AnimatePresence>
      <div
        id="admin-auth-modal-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
            x: isShaking ? [-8, 8, -6, 6, -3, 3, 0] : 0,
          }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ duration: isShaking ? 0.4 : 0.2 }}
          className="relative w-full max-w-sm rounded-3xl bg-[#111112] border border-white/10 p-6 sm:p-7 shadow-2xl space-y-5"
        >
          {/* Close Button */}
          <button
            id="btn-close-admin-auth-modal"
            onClick={() => setIsAdminAuthModalOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-stone-400 hover:text-white transition-colors cursor-pointer"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header Icon & Title */}
          <div className="text-center space-y-2 pt-2">
            <div className="w-14 h-14 rounded-2xl bg-[#FF5C00]/15 border border-[#FF5C00]/30 flex items-center justify-center text-[#FF5C00] mx-auto shadow-lg shadow-[#FF5C00]/10">
              <Lock className="w-7 h-7" />
            </div>
            <h3 className="font-display font-black text-xl text-white tracking-tight">
              เข้าสู่ระบบหลังบ้านแอดมิน
            </h3>
            <p className="text-xs text-stone-400 max-w-xs mx-auto leading-relaxed">
              เฉพาะผู้จัดการร้านและพนักงาน กรุณากรอกรหัส PIN เพื่อเข้าถึงระบบจัดการ
            </p>
          </div>

          {/* PIN Display / Input Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative flex justify-center items-center py-2">
              <div className="flex items-center gap-3">
                {[0, 1, 2, 3].map((index) => {
                  const isFilled = pin.length > index;
                  return (
                    <div
                      key={index}
                      className={`w-11 h-12 rounded-xl border flex items-center justify-center text-lg font-mono font-bold transition-all ${
                        isFilled
                          ? 'bg-[#FF5C00]/20 border-[#FF5C00] text-white shadow-md shadow-[#FF5C00]/20'
                          : 'bg-[#161618] border-white/10 text-stone-600'
                      }`}
                    >
                      {isFilled ? (showPin ? pin[index] : '●') : ''}
                    </div>
                  );
                })}
              </div>

              {/* Hidden text input for hardware keyboard support */}
              <input
                ref={inputRef}
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={8}
                value={pin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setPin(val);
                  setErrorMsg('');
                  if (val === correctPin) {
                    handleSuccess();
                  }
                }}
                className="opacity-0 absolute inset-0 w-full h-full cursor-default"
                autoFocus
              />
            </div>

            {/* Error Message */}
            {errorMsg ? (
              <div className="flex items-center justify-center gap-1.5 text-xs text-rose-400 font-bold text-center">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            ) : (
              <div className="flex items-center justify-between px-2 text-[11px] text-stone-500">
                <span>รหัสเริ่มต้นของร้าน: <strong className="text-stone-400 font-mono font-bold">{correctPin}</strong></span>
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="text-stone-400 hover:text-stone-300 flex items-center gap-1 cursor-pointer"
                >
                  {showPin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showPin ? 'ซ่อน' : 'แสดง'}</span>
                </button>
              </div>
            )}

            {/* Custom On-Screen Keypad */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              {keypadNumbers.map((keyVal) => {
                if (keyVal === 'C') {
                  return (
                    <button
                      key={keyVal}
                      type="button"
                      onClick={handleClear}
                      className="h-12 rounded-2xl bg-[#161618] hover:bg-[#202024] border border-white/5 text-stone-400 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center active:scale-95"
                    >
                      ล้าง
                    </button>
                  );
                }
                if (keyVal === '⌫') {
                  return (
                    <button
                      key={keyVal}
                      type="button"
                      onClick={handleDelete}
                      className="h-12 rounded-2xl bg-[#161618] hover:bg-[#202024] border border-white/5 text-stone-400 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center active:scale-95"
                    >
                      <Delete className="w-4 h-4" />
                    </button>
                  );
                }
                return (
                  <button
                    key={keyVal}
                    type="button"
                    onClick={() => handleKeyPress(keyVal)}
                    className="h-12 rounded-2xl bg-[#161618] hover:bg-[#222226] border border-white/10 hover:border-white/20 text-white font-mono font-bold text-lg transition-all cursor-pointer flex items-center justify-center active:scale-95 shadow-sm"
                  >
                    {keyVal}
                  </button>
                );
              })}
            </div>

            {/* Confirm Submit Button */}
            <button
              type="submit"
              id="btn-submit-admin-pin"
              className="w-full py-3 rounded-2xl bg-[#FF5C00] hover:bg-[#FF7729] text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-[#FF5C00]/25 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>ยืนยันรหัสผ่าน</span>
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
