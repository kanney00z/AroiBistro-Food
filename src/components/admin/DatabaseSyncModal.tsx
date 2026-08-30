import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Database,
  Radio,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  UploadCloud,
  DownloadCloud,
  ExternalLink,
  X,
  Server,
  Key,
  Globe,
  Wifi,
  WifiOff,
  Code2,
  Terminal,
  ShieldCheck,
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import {
  getStoredSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig,
  testSupabaseConnection,
  SUPABASE_SQL_SETUP_SCRIPT,
} from '../../services/supabaseService';
import { realtimeManager, CLIENT_ID } from '../../services/realtimeSync';

interface DatabaseSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DatabaseSyncModal: React.FC<DatabaseSyncModalProps> = ({ isOpen, onClose }) => {
  const {
    realtimeStatus,
    realtimeDetail,
    reconnectSupabase,
    pushAllToCloud,
    pullAllFromCloud,
    showToast,
  } = useRestaurant();

  const currentConfig = getStoredSupabaseConfig();
  const [urlInput, setUrlInput] = useState(currentConfig.url || '');
  const [keyInput, setKeyInput] = useState(currentConfig.anonKey || '');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'sql' | 'status'>('config');

  if (!isOpen) return null;

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim() || !keyInput.trim()) {
      showToast('กรุณากรอกทั้ง Supabase URL และ Anon Key', 'warning');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const res = await testSupabaseConnection({
      url: urlInput.trim(),
      anonKey: keyInput.trim(),
    });

    setIsTesting(false);
    setTestResult(res);

    if (res.success) {
      saveSupabaseConfig(urlInput.trim(), keyInput.trim());
      await reconnectSupabase();
      showToast('เชื่อมต่อ Supabase Realtime เรียบร้อยแล้ว! 🚀', 'success');
    } else {
      showToast(res.message, 'warning');
    }
  };

  const handleClearConfig = async () => {
    clearSupabaseConfig();
    setUrlInput('');
    setKeyInput('');
    setTestResult(null);
    await reconnectSupabase();
    showToast('ล้างการเชื่อมต่อ Supabase เรียบร้อยแล้ว (กลับสู่โหมด Local)', 'info');
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SETUP_SCRIPT);
    setCopiedSql(true);
    showToast('คัดลอกคำสั่ง SQL สำหรับ Supabase ไปยัง Clipboard แล้ว!', 'success');
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const handlePushAll = async () => {
    setIsPushing(true);
    const res = await pushAllToCloud();
    setIsPushing(false);
    if (res.success) {
      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'warning');
    }
  };

  const handlePullAll = async () => {
    setIsPulling(true);
    const res = await pullAllFromCloud();
    setIsPulling(false);
    if (res.success) {
      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'warning');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-2xl rounded-3xl bg-[#111112] border border-white/15 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between bg-[#161618]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-display font-black text-white uppercase tracking-wider">
                  Supabase Realtime Database Hub
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold border border-emerald-500/30">
                  REAL-TIME SYNC
                </span>
              </div>
              <p className="text-xs text-stone-400 font-medium">
                เชื่อมต่อฐานข้อมูล Supabase เพื่อให้ทุกเครื่องแสดงผลและอัปเดตตรงกันทันที 100% โดยไม่ต้องรีเฟรชหน้าเว็บ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[#202024] hover:bg-[#28282E] text-stone-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Status Bar */}
        <div className="px-6 py-3 bg-[#0D0D0E] border-b border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span
              className={`w-3 h-3 rounded-full ${
                realtimeStatus === 'connected'
                  ? 'bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50'
                  : realtimeStatus === 'connecting'
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-rose-500'
              }`}
            />
            <span className="text-stone-300 font-bold">
              สถานะ Realtime:{' '}
              <strong
                className={
                  realtimeStatus === 'connected'
                    ? 'text-emerald-400 font-black'
                    : realtimeStatus === 'connecting'
                    ? 'text-amber-400 font-black'
                    : 'text-stone-400 font-bold'
                }
              >
                {realtimeStatus === 'connected'
                  ? '🟢 เชื่อมต่อสดแล้ว (ซิงค์ทุกเครื่องทันที)'
                  : realtimeStatus === 'connecting'
                  ? '🟡 กำลังเชื่อมต่อ...'
                  : realtimeStatus === 'not_configured'
                  ? '⚪ ยังไม่ได้ต่อ Supabase (โหมด Multi-Tab Local)'
                  : '🔴 ขัดข้อง'}
              </strong>
            </span>
          </div>

          <div className="text-[11px] font-mono text-stone-400">
            Client ID: <span className="text-[#FF5C00]">{CLIENT_ID.slice(0, 14)}...</span>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-white/10 bg-[#141416] px-4 pt-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`px-4 py-2 rounded-t-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'config'
                ? 'bg-[#111112] text-white border-t border-x border-white/10 font-black'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Server className="w-3.5 h-3.5 text-[#FF5C00]" />
            <span>1. ตั้งค่าการเชื่อมต่อ (Credentials)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sql')}
            className={`px-4 py-2 rounded-t-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'sql'
                ? 'bg-[#111112] text-white border-t border-x border-white/10 font-black'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>2. คัดลอก SQL สร้างตาราง (SQL Script)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('status')}
            className={`px-4 py-2 rounded-t-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'status'
                ? 'bg-[#111112] text-white border-t border-x border-white/10 font-black'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>3. จัดการข้อมูล (Sync / Upload)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* TAB 1: Config */}
          {activeTab === 'config' && (
            <form onSubmit={handleTestAndSave} className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#161618] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-400" />
                    <span>Supabase Project URL</span>
                  </span>
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-[#FF5C00] hover:underline flex items-center gap-1"
                  >
                    <span>เปิด Supabase Dashboard</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <input
                  type="url"
                  placeholder="https://xyzcompany.supabase.co"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0B] border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-emerald-500 font-bold"
                  required
                />
                <p className="text-[10px] text-stone-500 font-medium">
                  ดูได้จากเมนู Project Settings -&gt; API -&gt; Project URL ใน Supabase
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#161618] border border-white/10 space-y-2">
                <span className="text-xs font-black text-white flex items-center gap-2">
                  <Key className="w-4 h-4 text-amber-400" />
                  <span>Supabase Project Anon / Public Key</span>
                </span>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0B] border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                  required
                />
                <p className="text-[10px] text-stone-500 font-medium">
                  ดูได้จากเมนู Project Settings -&gt; API -&gt; Project API keys -&gt; anon public
                </p>
              </div>

              {testResult && (
                <div
                  className={`p-4 rounded-2xl border flex items-start gap-3 ${
                    testResult.success
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <p className="text-xs font-bold">{testResult.message}</p>
                    {testResult.success && (
                      <p className="text-[11px] text-stone-400">
                        ระบบทำการเชื่อมต่อ Realtime WebSocket และพร้อมซิงค์ข้อมูลสดทุกการกระทำแล้ว!
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                {currentConfig.url && (
                  <button
                    type="button"
                    onClick={handleClearConfig}
                    className="px-4 py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-400 text-xs font-bold transition-all cursor-pointer"
                  >
                    ตัดการเชื่อมต่อ (Disconnect)
                  </button>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="submit"
                    disabled={isTesting}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/25 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isTesting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>กำลังทดสอบการเชื่อมต่อ...</span>
                      </>
                    ) : (
                      <>
                        <Radio className="w-4 h-4" />
                        <span>ทดสอบ & เชื่อมต่อ Realtime ทันที</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: SQL Script */}
          {activeTab === 'sql' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#161618] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-black text-white">
                    <Code2 className="w-4 h-4 text-emerald-400" />
                    <span>คำสั่ง SQL สร้างตาราง & เปิด Realtime ใน Supabase</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopySql}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all cursor-pointer shadow"
                  >
                    {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSql ? 'คัดลอกสำเร็จ! ✨' : 'คัดลอกโค้ด SQL ทั้งหมด'}</span>
                  </button>
                </div>

                <p className="text-xs text-stone-300 font-medium leading-relaxed">
                  วิธีติดตั้ง: เข้าไปที่ <strong className="text-emerald-400">Supabase Dashboard</strong> -&gt; เมนู <strong className="text-emerald-400">SQL Editor</strong> -&gt; วางโค้ดนี้แล้วกด <strong className="text-emerald-400">RUN</strong> (สร้าง 6 ตาราง: orders, menu_items, tables, categories, promos, settings และเปิด Realtime ให้อัตโนมัติ)
                </p>

                <div className="relative rounded-xl bg-[#0A0A0B] border border-white/10 p-3 max-h-60 overflow-y-auto">
                  <pre className="text-[11px] font-mono text-emerald-300/90 whitespace-pre leading-relaxed">
                    {SUPABASE_SQL_SETUP_SCRIPT}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Data Management */}
          {activeTab === 'status' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-[#161618] border border-white/10 space-y-4">
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>จัดการข้อมูลระหว่างเครื่องและระบบคลาวด์ Supabase</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Push button */}
                  <div className="p-4 rounded-xl bg-[#0A0A0B] border border-white/10 space-y-2">
                    <span className="text-xs font-black text-white block">
                      ⬆️ อัปโหลดข้อมูลปัจจุบันขึ้น Supabase
                    </span>
                    <p className="text-[11px] text-stone-400">
                      ส่งเมนูอาหาร ผังโต๊ะ โค้ดส่วนลด และออเดอร์ทั้งหมดขึ้นไปยังฐานข้อมูล Supabase เพื่อเริ่มต้น
                    </p>
                    <button
                      type="button"
                      onClick={handlePushAll}
                      disabled={isPushing || realtimeStatus !== 'connected'}
                      className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#FF5C00] hover:bg-[#FF7729] text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40"
                    >
                      {isPushing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                      <span>{isPushing ? 'กำลังอัปโหลด...' : 'อัปโหลดขึ้น Cloud เดี๋ยวนี้'}</span>
                    </button>
                  </div>

                  {/* Pull button */}
                  <div className="p-4 rounded-xl bg-[#0A0A0B] border border-white/10 space-y-2">
                    <span className="text-xs font-black text-white block">
                      ⬇️ ดึงข้อมูลล่าสุดจาก Supabase
                    </span>
                    <p className="text-[11px] text-stone-400">
                      ดึงข้อมูลออเดอร์ เมนู และการตั้งค่าล่าสุดจาก Supabase Cloud มาแสดงผลบนเครื่องนี้
                    </p>
                    <button
                      type="button"
                      onClick={handlePullAll}
                      disabled={isPulling || realtimeStatus !== 'connected'}
                      className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40"
                    >
                      {isPulling ? <RefreshCw className="w-4 h-4 animate-spin" /> : <DownloadCloud className="w-4 h-4" />}
                      <span>{isPulling ? 'กำลังดึงข้อมูล...' : 'ดึงข้อมูลล่าสุด (Pull All)'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-[#161618] border-t border-white/10 flex items-center justify-between">
          <span className="text-xs text-stone-400 font-medium">
            ⚡ ซิงค์อัตโนมัติ 0.1s เมื่อมีออเดอร์ใหม่ หรือแก้ไขเมนู/โต๊ะ
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#202024] hover:bg-[#28282E] text-white text-xs font-bold transition-all cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </motion.div>
    </div>
  );
};
