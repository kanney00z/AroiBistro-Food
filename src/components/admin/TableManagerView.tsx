import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  QrCode,
  CheckCircle2,
  X,
  Receipt,
  Trash2,
  Check,
  ChefHat,
  Edit3,
  Plus,
  Search,
  AlertTriangle,
  Sparkles,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Table, TableStatus, Order } from '../../types';
import { QrCodeCard } from '../common/QrCodeCard';
import { buildTableOrderUrl } from '../../utils/qrCode';

const DEFAULT_ZONES = ['Main Hall', 'Terrace', 'VIP Room', 'Bar Area'];

export const TableManagerView: React.FC = () => {
  const {
    tables,
    addTable,
    updateTable,
    deleteTable,
    updateTableStatus,
    updateTableGuestCount,
    clearTableBill,
    updateOrderItemPrice,
    orders,
    showToast,
    settings,
    scanTable,
    setIsAdminMode,
  } = useRestaurant();

  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Modals
  const [qrModalTable, setQrModalTable] = useState<Table | null>(null);
  const [billModalTable, setBillModalTable] = useState<{ table: Table; order: Order } | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'promptpay' | 'cash' | 'credit_card'>('promptpay');
  const [editingPriceItemId, setEditingPriceItemId] = useState<string | null>(null);
  const [customPriceInput, setCustomPriceInput] = useState<string>('');

  // Add Table Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableZone, setNewTableZone] = useState('Main Hall');
  const [newCustomZone, setNewCustomZone] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState(4);
  const [newTableStatus, setNewTableStatus] = useState<TableStatus>('available');

  // Edit Table Modal State
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [editTableNumber, setEditTableNumber] = useState('');
  const [editTableZone, setEditTableZone] = useState('Main Hall');
  const [editCustomZone, setEditCustomZone] = useState('');
  const [editTableCapacity, setEditTableCapacity] = useState(4);
  const [editTableStatus, setEditTableStatus] = useState<TableStatus>('available');

  // Delete Confirmation Modal State
  const [deletingTable, setDeletingTable] = useState<Table | null>(null);

  // Compute all unique zones dynamically
  const allZones = useMemo(() => {
    const tableZones = tables.map((t) => t.zone).filter(Boolean);
    const combined = Array.from(new Set([...DEFAULT_ZONES, ...tableZones]));
    return combined;
  }, [tables]);

  // Next suggested table number helper
  const getSuggestedNextTableNumber = () => {
    const tNumbers = tables
      .map((t) => {
        const match = t.number.match(/^T-(\d+)$/i);
        return match ? parseInt(match[1], 10) : null;
      })
      .filter((n): n is number => n !== null);

    if (tNumbers.length === 0) return 'T-01';
    const maxNum = Math.max(...tNumbers);
    return `T-${String(maxNum + 1).padStart(2, '0')}`;
  };

  const handleOpenAddModal = () => {
    setNewTableNumber(getSuggestedNextTableNumber());
    setNewTableZone(allZones[0] || 'Main Hall');
    setNewCustomZone('');
    setNewTableCapacity(4);
    setNewTableStatus('available');
    setIsAddModalOpen(true);
  };

  const handleSaveAddTable = (e: React.FormEvent) => {
    e.preventDefault();
    const finalNumber = newTableNumber.trim();
    if (!finalNumber) {
      showToast('กรุณาระบุชื่อหรือหมายเลขโต๊ะ', 'warning');
      return;
    }

    const finalZone = newTableZone === '__custom__' ? (newCustomZone.trim() || 'Main Hall') : newTableZone;

    addTable({
      number: finalNumber,
      zone: finalZone,
      capacity: Number(newTableCapacity) || 4,
      status: newTableStatus,
    });

    setIsAddModalOpen(false);
  };

  const handleOpenEditModal = (table: Table) => {
    setEditingTable(table);
    setEditTableNumber(table.number);
    const isKnownZone = allZones.includes(table.zone);
    if (isKnownZone) {
      setEditTableZone(table.zone);
      setEditCustomZone('');
    } else {
      setEditTableZone('__custom__');
      setEditCustomZone(table.zone);
    }
    setEditTableCapacity(table.capacity);
    setEditTableStatus(table.status);
  };

  const handleSaveEditTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTable) return;

    const finalNumber = editTableNumber.trim();
    if (!finalNumber) {
      showToast('กรุณาระบุชื่อหรือหมายเลขโต๊ะ', 'warning');
      return;
    }

    // Check duplicate number if changed
    if (
      finalNumber.toLowerCase() !== editingTable.number.toLowerCase() &&
      tables.some((t) => t.id !== editingTable.id && t.number.toLowerCase() === finalNumber.toLowerCase())
    ) {
      showToast(`มีโต๊ะ "${finalNumber}" ในระบบแล้ว กรุณาใช้ชื่ออื่น`, 'warning');
      return;
    }

    const finalZone = editTableZone === '__custom__' ? (editCustomZone.trim() || 'Main Hall') : editTableZone;

    updateTable(editingTable.id, {
      number: finalNumber,
      zone: finalZone,
      capacity: Number(editTableCapacity) || 4,
      status: editTableStatus,
    });

    setEditingTable(null);
  };

  const handleConfirmDelete = () => {
    if (!deletingTable) return;
    deleteTable(deletingTable.id);
    setDeletingTable(null);
  };

  // Filter tables
  const filteredTables = tables.filter((t) => {
    if (selectedZone !== 'all' && t.zone !== selectedZone) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchNum = t.number.toLowerCase().includes(q);
      const matchZone = t.zone.toLowerCase().includes(q);
      return matchNum || matchZone;
    }
    return true;
  });

  const statusColors: Record<TableStatus, { bg: string; text: string; border: string; label: string }> = {
    available: { bg: 'bg-emerald-950/30', text: 'text-emerald-400', border: 'border-emerald-500/40', label: 'ว่าง (Available)' },
    occupied: { bg: 'bg-[#FF5C00]/15', text: 'text-[#FF5C00]', border: 'border-[#FF5C00]/50', label: 'มีลูกค้า (Occupied)' },
    reserved: { bg: 'bg-blue-950/30', text: 'text-blue-400', border: 'border-blue-500/40', label: 'จองแล้ว (Reserved)' },
    billing: { bg: 'bg-purple-950/30', text: 'text-purple-400', border: 'border-purple-500/40', label: 'รอเช็คบิล (Billing)' },
  };

  const handleSettleAndClear = (tableId: string, tableNumber: string) => {
    clearTableBill(tableId);
    setBillModalTable(null);
  };

  return (
    <div id="admin-table-manager-view" className="space-y-6 pb-12">
      
      {/* Top Header & Action Bar */}
      <div className="bg-[#111112] p-6 rounded-3xl border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-black text-xl text-white uppercase tracking-wider">
                ผังโต๊ะ & จัดการโต๊ะอาหาร
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-[#FF5C00]/20 text-[#FF5C00] text-xs font-mono font-bold border border-[#FF5C00]/30">
                {tables.length} โต๊ะ
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-1 font-medium">
              เพิ่ม/ลบ/ตั้งชื่อโต๊ะ จัดโซน ตรวจสถานะโต๊ะ รับชำระเงิน และเคลียร์บิลได้ทันที
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              id="btn-add-new-table"
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#FF5C00] hover:bg-[#FF7729] text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-[#FF5C00]/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มโต๊ะใหม่</span>
            </button>
          </div>
        </div>

        {/* Search & Zone Filters */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2 border-t border-white/5">
          {/* Search bar */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาตามชื่อ/หมายเลขโต๊ะ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[#161618] border border-white/10 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#FF5C00] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Zone Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
            <button
              onClick={() => setSelectedZone('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedZone === 'all'
                  ? 'bg-[#FF5C00] text-white font-black shadow-md'
                  : 'bg-[#161618] text-stone-400 hover:text-white border border-white/10'
              }`}
            >
              ทุกโซน ({tables.length})
            </button>
            {allZones.map((z) => {
              const count = tables.filter((t) => t.zone === z).length;
              return (
                <button
                  key={z}
                  onClick={() => setSelectedZone(z)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedZone === z
                      ? 'bg-[#FF5C00] text-white font-black shadow-md'
                      : 'bg-[#161618] text-stone-400 hover:text-white border border-white/10'
                  }`}
                >
                  {z} {count > 0 && <span className="opacity-70 text-[10px]">({count})</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Table Status Legend Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#111112] border border-white/10 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <span className="label-caps">สถานะโต๊ะ:</span>
          {Object.entries(statusColors).map(([status, cfg]) => {
            const count = tables.filter((t) => t.status === status).length;
            return (
              <div key={status} className="flex items-center gap-1.5 font-bold">
                <span className={`w-3 h-3 rounded-full border ${cfg.border} ${cfg.bg}`} />
                <span className="text-stone-300">
                  {cfg.label} <span className="font-mono text-stone-500">({count})</span>
                </span>
              </div>
            );
          })}
        </div>

        <div className="text-[11px] text-stone-400 font-medium">
          💡 สามารถกด <strong className="text-stone-200">แก้ไข (✏️)</strong> เพื่อเปลี่ยนชื่อโต๊ะ/ย้ายโซน หรือ <strong className="text-red-400">ลบ (🗑️)</strong> โต๊ะได้
        </div>
      </div>

      {/* Tables Grid Layout */}
      {filteredTables.length === 0 ? (
        <div className="p-12 text-center bg-[#111112] rounded-3xl border border-white/10 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-stone-500">
            <Users className="w-6 h-6" />
          </div>
          <h4 className="text-stone-300 font-bold text-sm">ไม่พบโต๊ะที่ตรงกับเงื่อนไข</h4>
          <p className="text-xs text-stone-500">ลองเปลี่ยนการค้นหา หรือกดปุ่ม "เพิ่มโต๊ะใหม่" เพื่อเริ่มสร้างโต๊ะ</p>
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF5C00] text-white text-xs font-bold"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มโต๊ะใหม่</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredTables.map((table) => {
            const cfg = statusColors[table.status];
            const activeOrder = orders.find(
              (o) =>
                o.id === table.currentOrderId ||
                o.orderNumber === table.currentOrderId ||
                (o.tableNumber === table.number && o.orderStatus !== 'completed' && o.orderStatus !== 'cancelled')
            );

            const isOccupiedOrBilling = table.status === 'occupied' || table.status === 'billing' || !!activeOrder;

            return (
              <div
                key={table.id}
                id={`table-card-${table.id}`}
                className={`p-5 rounded-3xl border ${cfg.border} ${cfg.bg} backdrop-blur-md flex flex-col justify-between shadow-xl space-y-4 transition-all hover:border-white/20`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-display font-black text-xl text-white font-mono truncate" title={table.number}>
                        {table.number}
                      </h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#0A0A0B] border border-white/10 text-stone-400 font-bold uppercase truncate max-w-[120px]">
                        {table.zone}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-stone-400 font-medium">
                      <Users className="w-3.5 h-3.5 text-stone-500" />
                      <span>{table.capacity} ที่นั่ง</span>
                      {table.guestCount && table.guestCount > 0 ? (
                        <span className="text-stone-300 font-bold">({table.guestCount} ท่าน)</span>
                      ) : null}
                    </div>
                  </div>

                  {/* Card Action Buttons (Edit, Delete, QR) */}
                  <div className="flex items-center gap-1">
                    <button
                      id={`btn-edit-table-${table.id}`}
                      onClick={() => handleOpenEditModal(table)}
                      className="p-2 rounded-xl bg-[#0A0A0B] hover:bg-[#202024] border border-white/10 text-stone-300 hover:text-white transition-all cursor-pointer"
                      title="แก้ไข/เปลี่ยนชื่อโต๊ะ"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      id={`btn-delete-table-${table.id}`}
                      onClick={() => setDeletingTable(table)}
                      className="p-2 rounded-xl bg-[#0A0A0B] hover:bg-red-950/60 border border-white/10 hover:border-red-500/40 text-stone-400 hover:text-red-400 transition-all cursor-pointer"
                      title="ลบโต๊ะนี้"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      id={`btn-table-qr-${table.id}`}
                      onClick={() => setQrModalTable(table)}
                      className="p-2 rounded-xl bg-[#0A0A0B] hover:bg-[#202024] border border-white/10 text-[#FF5C00] transition-all hover:scale-105 cursor-pointer"
                      title="ดู/พิมพ์ QR Code โต๊ะนี้"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Status Switcher Select */}
                <div className="space-y-1.5">
                  <label className="label-caps block">
                    สถานะโต๊ะ
                  </label>
                  <select
                    value={table.status}
                    onChange={(e) => updateTableStatus(table.id, e.target.value as TableStatus)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0A0A0B] border border-white/10 text-xs text-white font-bold focus:outline-none focus:border-[#FF5C00] cursor-pointer"
                  >
                    <option value="available">🟢 ว่าง (Available)</option>
                    <option value="occupied">🟡 มีลูกค้า (Occupied)</option>
                    <option value="reserved">🔵 จองแล้ว (Reserved)</option>
                    <option value="billing">🟣 กำลังเช็คบิล (Billing)</option>
                  </select>
                </div>

                {/* Active Order snippet if occupied */}
                {activeOrder && (
                  <div className="p-3.5 rounded-2xl bg-[#0A0A0B] border border-white/10 text-xs space-y-2">
                    <div className="flex items-center justify-between text-stone-400">
                      <span className="flex items-center gap-1 font-medium">
                        <Receipt className="w-3.5 h-3.5 text-[#FF5C00]" />
                        บิลปัจจุบัน:
                      </span>
                      <div className="flex items-center gap-1">
                        <strong className="font-mono text-[#FF5C00] font-black">#{activeOrder.orderNumber}</strong>
                        {(activeOrder.roundsCount || 1) > 1 && (
                          <span className="text-[9px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.2 rounded border border-amber-500/30">
                            รอบ {activeOrder.roundsCount}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-white font-medium pt-1 border-t border-white/5">
                      <span className="text-stone-400">ยอดรวมทั้งสิ้น:</span>
                      <span className="font-mono font-black text-emerald-400 text-sm">
                        ฿{activeOrder.total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                {/* Quick Bill Clearing Actions */}
                {isOccupiedOrBilling ? (
                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      id={`btn-clear-table-${table.id}`}
                      onClick={() => handleSettleAndClear(table.id, table.number)}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-900/30 transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>จ่ายเงินแล้ว เคลียร์บิลโต๊ะ</span>
                    </button>

                    {activeOrder && (
                      <button
                        onClick={() => setBillModalTable({ table, order: activeOrder })}
                        className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#0A0A0B] hover:bg-[#161618] border border-white/10 text-stone-300 hover:text-white font-bold text-xs transition-colors cursor-pointer"
                      >
                        <Receipt className="w-3.5 h-3.5 text-[#FF5C00]" />
                        <span>ดูรายละเอียดบิล & เช็คบิล</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="py-2 text-center text-xs font-bold text-emerald-400/80 bg-emerald-950/20 rounded-xl border border-emerald-500/20">
                    ✓ โต๊ะว่าง พร้อมรับลูกค้า
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* ADD TABLE MODAL */}
      {/* ======================================================== */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="fixed inset-0 bg-black/85 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              className="relative w-full max-w-md bg-[#111112] rounded-3xl border border-white/10 shadow-2xl overflow-hidden z-10 my-auto flex flex-col"
            >
              {/* Header */}
              <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#0A0A0B]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#FF5C00]/20 border border-[#FF5C00]/40 flex items-center justify-center text-[#FF5C00]">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-display font-black text-white">เพิ่มโต๊ะอาหารใหม่</h4>
                    <p className="text-xs text-stone-400">สร้างโต๊ะใหม่ในระบบและสร้าง QR Code อัตโนมัติ</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-[#161618] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSaveAddTable} className="p-6 space-y-4">
                {/* Table Name / Number */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-stone-200">
                      ชื่อ / หมายเลขโต๊ะ <span className="text-[#FF5C00]">*</span>
                    </label>
                    <span className="text-[10px] text-stone-500">เช่น T-09, VIP-1, โต๊ะริมน้ำ</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={newTableNumber}
                    onChange={(e) => setNewTableNumber(e.target.value)}
                    placeholder="เช่น T-09 หรือ โต๊ะ 1"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0B] border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-[#FF5C00]"
                  />
                  {/* Quick Preset Buttons */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-stone-500">ตัวอย่าง:</span>
                    {['T-01', 'T-05', 'VIP-1', 'ริมระเบียง 1'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setNewTableNumber(preset)}
                        className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 text-stone-400 hover:text-white text-[10px] font-mono border border-white/5"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Zone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-200">โซนที่ตั้ง (Zone)</label>
                  <select
                    value={newTableZone}
                    onChange={(e) => setNewTableZone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0B] border border-white/10 text-white text-xs font-bold focus:outline-none focus:border-[#FF5C00]"
                  >
                    {allZones.map((z) => (
                      <option key={z} value={z}>
                        {z}
                      </option>
                    ))}
                    <option value="__custom__">+ กำหนดโซนใหม่เอง...</option>
                  </select>

                  {newTableZone === '__custom__' && (
                    <input
                      type="text"
                      placeholder="พิมพ์ชื่อโซนใหม่ เช่น ดาดฟ้า, สวนหลังร้าน"
                      value={newCustomZone}
                      onChange={(e) => setNewCustomZone(e.target.value)}
                      className="w-full mt-2 px-3.5 py-2 rounded-xl bg-[#0A0A0B] border border-white/10 text-white text-xs focus:outline-none focus:border-[#FF5C00]"
                    />
                  )}
                </div>

                {/* Capacity */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-stone-200">จำนวนที่นั่ง (ที่นั่ง)</label>
                    <span className="text-xs font-mono font-bold text-[#FF5C00]">{newTableCapacity} ที่นั่ง</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {[2, 4, 6, 8, 10].map((cap) => (
                      <button
                        key={cap}
                        type="button"
                        onClick={() => setNewTableCapacity(cap)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                          newTableCapacity === cap
                            ? 'bg-[#FF5C00] text-white border-[#FF5C00] font-black'
                            : 'bg-[#0A0A0B] text-stone-400 border-white/10 hover:text-white'
                        }`}
                      >
                        {cap}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={newTableCapacity}
                    onChange={(e) => setNewTableCapacity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full mt-1 px-3.5 py-2 rounded-xl bg-[#0A0A0B] border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-[#FF5C00]"
                    placeholder="หรือระบุจำนวนเอง..."
                  />
                </div>

                {/* Initial Status */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-200">สถานะเริ่มต้น</label>
                  <select
                    value={newTableStatus}
                    onChange={(e) => setNewTableStatus(e.target.value as TableStatus)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0B] border border-white/10 text-white text-xs font-bold focus:outline-none focus:border-[#FF5C00]"
                  >
                    <option value="available">🟢 ว่าง (พร้อมรับลูกค้า)</option>
                    <option value="reserved">🔵 จองแล้ว (Reserved)</option>
                  </select>
                </div>

                {/* Buttons */}
                <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-[#161618] hover:bg-[#202024] border border-white/10 text-stone-300 text-xs font-bold cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#FF5C00] hover:bg-[#FF7729] text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-[#FF5C00]/20 cursor-pointer"
                  >
                    บันทึก & เพิ่มโต๊ะ
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* EDIT TABLE MODAL */}
      {/* ======================================================== */}
      <AnimatePresence>
        {editingTable && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingTable(null)}
              className="fixed inset-0 bg-black/85 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              className="relative w-full max-w-md bg-[#111112] rounded-3xl border border-white/10 shadow-2xl overflow-hidden z-10 my-auto flex flex-col"
            >
              {/* Header */}
              <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#0A0A0B]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#FF5C00]/20 border border-[#FF5C00]/40 flex items-center justify-center text-[#FF5C00]">
                    <Edit3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-display font-black text-white">
                      แก้ไขข้อมูลโต๊ะ: {editingTable.number}
                    </h4>
                    <p className="text-xs text-stone-400">เปลี่ยนชื่อโต๊ะ โซน หรือจำนวนที่นั่ง</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingTable(null)}
                  className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-[#161618] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSaveEditTable} className="p-6 space-y-4">
                {/* Table Name / Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-200">
                    ชื่อ / หมายเลขโต๊ะ <span className="text-[#FF5C00]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editTableNumber}
                    onChange={(e) => setEditTableNumber(e.target.value)}
                    placeholder="เช่น T-01 หรือ โต๊ะริมระเบียง"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0B] border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-[#FF5C00]"
                  />
                </div>

                {/* Zone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-200">โซนที่ตั้ง (Zone)</label>
                  <select
                    value={editTableZone}
                    onChange={(e) => setEditTableZone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0B] border border-white/10 text-white text-xs font-bold focus:outline-none focus:border-[#FF5C00]"
                  >
                    {allZones.map((z) => (
                      <option key={z} value={z}>
                        {z}
                      </option>
                    ))}
                    <option value="__custom__">+ กำหนดโซนใหม่เอง...</option>
                  </select>

                  {editTableZone === '__custom__' && (
                    <input
                      type="text"
                      placeholder="พิมพ์ชื่อโซนใหม่..."
                      value={editCustomZone}
                      onChange={(e) => setEditCustomZone(e.target.value)}
                      className="w-full mt-2 px-3.5 py-2 rounded-xl bg-[#0A0A0B] border border-white/10 text-white text-xs focus:outline-none focus:border-[#FF5C00]"
                    />
                  )}
                </div>

                {/* Capacity */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-stone-200">จำนวนที่นั่ง (ที่นั่ง)</label>
                    <span className="text-xs font-mono font-bold text-[#FF5C00]">{editTableCapacity} ที่นั่ง</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {[2, 4, 6, 8, 10].map((cap) => (
                      <button
                        key={cap}
                        type="button"
                        onClick={() => setEditTableCapacity(cap)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                          editTableCapacity === cap
                            ? 'bg-[#FF5C00] text-white border-[#FF5C00] font-black'
                            : 'bg-[#0A0A0B] text-stone-400 border-white/10 hover:text-white'
                        }`}
                      >
                        {cap}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={editTableCapacity}
                    onChange={(e) => setEditTableCapacity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full mt-1 px-3.5 py-2 rounded-xl bg-[#0A0A0B] border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-[#FF5C00]"
                    placeholder="หรือระบุจำนวนเอง..."
                  />
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-200">สถานะโต๊ะ</label>
                  <select
                    value={editTableStatus}
                    onChange={(e) => setEditTableStatus(e.target.value as TableStatus)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0B] border border-white/10 text-white text-xs font-bold focus:outline-none focus:border-[#FF5C00]"
                  >
                    <option value="available">🟢 ว่าง (Available)</option>
                    <option value="occupied">🟡 มีลูกค้า (Occupied)</option>
                    <option value="reserved">🔵 จองแล้ว (Reserved)</option>
                    <option value="billing">🟣 กำลังเช็คบิล (Billing)</option>
                  </select>
                </div>

                {/* Buttons */}
                <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setEditingTable(null)}
                    className="px-4 py-2.5 rounded-xl bg-[#161618] hover:bg-[#202024] border border-white/10 text-stone-300 text-xs font-bold cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#FF5C00] hover:bg-[#FF7729] text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-[#FF5C00]/20 cursor-pointer"
                  >
                    บันทึกการเปลี่ยนแปลง
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* DELETE TABLE CONFIRMATION MODAL */}
      {/* ======================================================== */}
      <AnimatePresence>
        {deletingTable && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeletingTable(null)}
              className="fixed inset-0 bg-black/85 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              className="relative w-full max-w-md bg-[#111112] rounded-3xl border border-red-500/30 shadow-2xl overflow-hidden z-10 my-auto flex flex-col p-6 space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="text-center space-y-1.5">
                <h4 className="text-base font-display font-black text-white">
                  ยืนยันการลบโต๊ะ "{deletingTable.number}" ?
                </h4>
                <p className="text-xs text-stone-400">
                  โซน: <strong className="text-white">{deletingTable.zone}</strong> • {deletingTable.capacity} ที่นั่ง
                </p>
                <p className="text-xs text-red-300/80 pt-1">
                  เมื่อลบแล้ว โต๊ะนี้และ QR Code ประจำโต๊ะจะไม่สามารถใช้งานได้อีก
                </p>
              </div>

              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setDeletingTable(null)}
                  className="flex-1 py-2.5 rounded-xl bg-[#161618] hover:bg-[#202024] border border-white/10 text-stone-300 text-xs font-bold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-red-900/40 cursor-pointer"
                >
                  ยืนยันลบโต๊ะ
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* BILL & SETTLEMENT MODAL */}
      {/* ======================================================== */}
      <AnimatePresence>
        {billModalTable && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setBillModalTable(null)}
              className="fixed inset-0 bg-black/85 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              className="relative w-full max-w-lg bg-[#111112] rounded-3xl border border-white/10 shadow-2xl overflow-hidden z-10 my-auto flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#0A0A0B]">
                <div>
                  <h4 className="text-base font-display font-black text-white">
                    เช็คบิล & ชำระเงิน: โต๊ะ {billModalTable.table.number}
                  </h4>
                  <p className="text-xs text-stone-400 mt-0.5">
                    บิล #{billModalTable.order.orderNumber} • รวม {billModalTable.order.roundsCount || 1} รอบ
                  </p>
                </div>
                <button
                  onClick={() => setBillModalTable(null)}
                  className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-[#161618] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
                
                {/* Items List */}
                <div className="p-4 rounded-2xl bg-[#0A0A0B] border border-white/10 space-y-3">
                  <div className="flex justify-between text-xs font-bold text-stone-400 border-b border-white/10 pb-2">
                    <span>รายการอาหาร ({billModalTable.order.items.length} รายการ)</span>
                    <span>รวม (฿)</span>
                  </div>

                  <div className="space-y-2.5 divide-y divide-white/5">
                    {billModalTable.order.items.map((it, idx) => {
                      const isCustom = it.customDishDetails?.isCustomDish;
                      const isPending = it.customDishDetails?.isPricePending || (isCustom && it.itemTotal === 0);
                      const isEditing = editingPriceItemId === (it.id || String(idx));

                      return (
                        <div key={idx} className="pt-2.5 first:pt-0 flex justify-between items-start text-xs gap-3">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {isCustom && (
                                <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-[#FF5C00]/20 text-[#FF5C00] border border-[#FF5C00]/30 flex items-center gap-1">
                                  <ChefHat className="w-2.5 h-2.5" />
                                  <span>เมนูพิเศษ</span>
                                </span>
                              )}
                              <span className="font-bold text-white">
                                {it.quantity}x {it.menuItem.name}
                              </span>
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                  it.packagingType === 'takeaway'
                                    ? 'bg-amber-500/20 text-amber-300'
                                    : 'bg-white/10 text-stone-300'
                                }`}
                              >
                                {it.packagingType === 'takeaway' ? '🛍️ กลับบ้าน' : '🍽️ ทานร้าน'}
                              </span>
                              {it.round && (
                                <span className="text-[9px] font-mono text-stone-500">
                                  (รอบ {it.round})
                                </span>
                              )}
                            </div>

                            {/* Chef special note */}
                            {isCustom && it.customDishDetails && (
                              <div className="text-[11px] text-amber-300 bg-amber-950/30 p-2 rounded-xl border border-amber-500/20">
                                <strong>คำขอพิเศษ:</strong> "{it.customDishDetails.chefInstructions}"
                              </div>
                            )}

                            {/* Option selections */}
                            {it.selectedOptions && it.selectedOptions.length > 0 && (
                              <div className="text-[10px] text-stone-400">
                                {it.selectedOptions.map((o) => o.choiceName).join(', ')}
                              </div>
                            )}
                          </div>

                          {/* Price Tag or Pricing Button */}
                          <div className="text-right">
                            {isPending ? (
                              isEditing ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    min="0"
                                    value={customPriceInput}
                                    onChange={(e) => setCustomPriceInput(e.target.value)}
                                    placeholder="ระบุราคา..."
                                    className="w-20 px-2 py-1 rounded-lg bg-[#161618] border border-[#FF5C00] text-xs text-white font-mono"
                                  />
                                  <button
                                    onClick={() => {
                                      const num = parseFloat(customPriceInput);
                                      if (!isNaN(num) && num >= 0) {
                                        updateOrderItemPrice(
                                          billModalTable.order.id,
                                          it.id || String(idx),
                                          num
                                        );
                                        setEditingPriceItemId(null);
                                        setCustomPriceInput('');
                                      }
                                    }}
                                    className="p-1 rounded-lg bg-emerald-600 text-white"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setEditingPriceItemId(it.id || String(idx));
                                    setCustomPriceInput(String(it.itemTotal || ''));
                                  }}
                                  className="px-2 py-1 rounded-lg bg-[#FF5C00] hover:bg-[#FF7729] text-white text-[10px] font-bold animate-pulse"
                                >
                                  กำหนดราคา
                                </button>
                              )
                            ) : (
                              <div className="font-mono font-bold text-white">
                                ฿{it.itemTotal.toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Calculation Summary */}
                <div className="p-4 rounded-2xl bg-[#0A0A0B] border border-white/10 space-y-2 text-xs">
                  <div className="flex justify-between text-stone-400">
                    <span>ยอดรวมค่าอาหาร:</span>
                    <span className="font-mono">฿{billModalTable.order.subtotal.toLocaleString()}</span>
                  </div>
                  {billModalTable.order.discount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>ส่วนลด:</span>
                      <span className="font-mono">-฿{billModalTable.order.discount.toLocaleString()}</span>
                    </div>
                  )}
                  {billModalTable.order.serviceCharge > 0 && (
                    <div className="flex justify-between text-stone-400">
                      <span>Service Charge:</span>
                      <span className="font-mono">+฿{billModalTable.order.serviceCharge.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-black text-white pt-2 border-t border-white/10">
                    <span>ยอดสุทธิที่ต้องชำระ:</span>
                    <span className="font-mono text-emerald-400 text-xl">
                      ฿{billModalTable.order.total.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="space-y-2">
                  <label className="label-caps block">เลือกช่องทางรับชำระเงิน</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'promptpay', label: 'พร้อมเพย์ QR', icon: '📱' },
                      { id: 'cash', label: 'เงินสด (Cash)', icon: '💵' },
                      { id: 'credit_card', label: 'บัตรเครดิต', icon: '💳' },
                    ].map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setSelectedPaymentMethod(method.id as any)}
                        className={`p-3 rounded-2xl border flex flex-col items-center gap-1 text-xs font-bold transition-all cursor-pointer ${
                          selectedPaymentMethod === method.id
                            ? 'bg-[#FF5C00]/20 border-[#FF5C00] text-white shadow-md'
                            : 'bg-[#0A0A0B] border-white/10 text-stone-400 hover:text-white'
                        }`}
                      >
                        <span className="text-lg">{method.icon}</span>
                        <span>{method.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-5 border-t border-white/10 bg-[#0A0A0B] flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handleSettleAndClear(billModalTable.table.id, billModalTable.table.number)}
                  className="flex-1 py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>บันทึกรับเงิน & เคลียร์บิลโต๊ะทันที</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBillModalTable(null)}
                  className="px-4 py-3.5 rounded-2xl bg-[#161618] hover:bg-[#202024] border border-white/10 text-stone-300 text-xs font-bold cursor-pointer"
                >
                  ยกเลิก
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* QR CODE MODAL FOR TABLE */}
      {/* ======================================================== */}
      <AnimatePresence>
        {qrModalTable && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setQrModalTable(null)}
              className="fixed inset-0 bg-black/85 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              className="relative w-full max-w-sm bg-[#111112] rounded-3xl border border-white/10 shadow-2xl overflow-hidden z-10 my-auto flex flex-col p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#FF5C00]/20 border border-[#FF5C00]/40 flex items-center justify-center text-[#FF5C00]">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-display font-black text-white uppercase tracking-wider">
                      QR Code โต๊ะ {qrModalTable.number}
                    </h4>
                    <p className="text-[10px] text-stone-400 font-medium">
                      โซน: {qrModalTable.zone} • รองรับ {qrModalTable.capacity} ที่นั่ง
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setQrModalTable(null)}
                  className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-[#161618] border border-transparent hover:border-white/10 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Dynamic QR Code Card with Real QR Code Generation */}
              <QrCodeCard
                url={buildTableOrderUrl(qrModalTable.number)}
                title={`โต๊ะ ${qrModalTable.number}`}
                tableNumber={qrModalTable.number}
                zone={qrModalTable.zone}
                showSimulateButton={true}
                onSimulateScan={() => {
                  const targetNum = qrModalTable.number;
                  setQrModalTable(null);
                  scanTable(targetNum);
                  setIsAdminMode(false);
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
