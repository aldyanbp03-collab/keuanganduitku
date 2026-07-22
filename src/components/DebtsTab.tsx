import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { formatThousand, parseThousand } from '../utils/format';
import { 
  HandCoins, 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  TrendingUp, 
  TrendingDown, 
  Scale, 
  Trash2, 
  Edit3, 
  ArrowUpRight, 
  ArrowDownLeft, 
  X,
  Wallet
} from 'lucide-react';
import { DebtRecord, DebtType } from '../types';

interface DebtsTabProps {
  debts: DebtRecord[];
  onAddDebt: (debt: Omit<DebtRecord, 'id'>, recordTransaction?: boolean, paymentSource?: string) => void;
  onUpdateDebt: (debt: DebtRecord) => void;
  onDeleteDebt: (id: string) => void;
  onPayDebt: (debtId: string, paymentAmount: number, paymentSource: string, note?: string) => void;
}

export default function DebtsTab({
  debts,
  onAddDebt,
  onUpdateDebt,
  onDeleteDebt,
  onPayDebt
}: DebtsTabProps) {
  const [filterType, setFilterType] = useState<'all' | 'hutang' | 'piutang' | 'unpaid' | 'paid'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDebt, setEditingDebt] = useState<DebtRecord | null>(null);
  const [payingDebt, setPayingDebt] = useState<DebtRecord | null>(null);
  const [debtToDelete, setDebtToDelete] = useState<DebtRecord | null>(null);

  // Form State for Add / Edit
  const [formType, setFormType] = useState<DebtType>('piutang');
  const [formPersonName, setFormPersonName] = useState('');
  const [formTotalAmount, setFormTotalAmount] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formNote, setFormNote] = useState('');
  const [formRecordTx, setFormRecordTx] = useState(true);
  const [formPaymentSource, setFormPaymentSource] = useState('Cash');

  // Form State for Pay Modal
  const [payAmount, setPayAmount] = useState('');
  const [paySource, setPaySource] = useState('Cash');
  const [payNote, setPayNote] = useState('');

  const formatIDR = (num: number) => {
    return 'Rp ' + num.toLocaleString('id-ID');
  };

  // Calculations
  const totalHutang = debts
    .filter(d => d.type === 'hutang')
    .reduce((acc, curr) => acc + curr.remainingAmount, 0);

  const totalPiutang = debts
    .filter(d => d.type === 'piutang')
    .reduce((acc, curr) => acc + curr.remainingAmount, 0);

  const netBalance = totalPiutang - totalHutang;

  // Filtered List
  const filteredDebts = debts.filter(d => {
    const matchesSearch = d.personName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.note && d.note.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterType === 'all') return true;
    if (filterType === 'hutang') return d.type === 'hutang';
    if (filterType === 'piutang') return d.type === 'piutang';
    if (filterType === 'unpaid') return d.status !== 'paid';
    if (filterType === 'paid') return d.status === 'paid';
    return true;
  });

  const handleOpenAddModal = (type: DebtType = 'piutang') => {
    setFormType(type);
    setFormPersonName('');
    setFormTotalAmount('');
    setFormDueDate('');
    setFormNote('');
    setFormRecordTx(true);
    setFormPaymentSource('Cash');
    setEditingDebt(null);
    setShowAddModal(true);
  };

  const handleOpenEditModal = (debt: DebtRecord) => {
    setEditingDebt(debt);
    setFormType(debt.type);
    setFormPersonName(debt.personName);
    setFormTotalAmount(formatThousand(debt.totalAmount));
    setFormDueDate(debt.dueDate);
    setFormNote(debt.note || '');
    setFormRecordTx(false);
    setShowAddModal(true);
  };

  const handleSaveDebt = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseThousand(formTotalAmount);
    if (!formPersonName || isNaN(amountNum) || amountNum <= 0) return;

    if (editingDebt) {
      // Edit existing debt
      const updated: DebtRecord = {
        ...editingDebt,
        personName: formPersonName,
        type: formType,
        totalAmount: amountNum,
        dueDate: formDueDate || editingDebt.dueDate,
        note: formNote
      };
      onUpdateDebt(updated);
    } else {
      // Create new debt
      const newRecord: Omit<DebtRecord, 'id'> = {
        personName: formPersonName,
        type: formType,
        totalAmount: amountNum,
        remainingAmount: amountNum,
        dueDate: formDueDate || new Date().toISOString().split('T')[0],
        createdDate: new Date().toISOString().split('T')[0],
        note: formNote,
        status: 'unpaid'
      };
      onAddDebt(newRecord, formRecordTx, formPaymentSource);
    }

    setShowAddModal(false);
  };

  const handleOpenPayModal = (debt: DebtRecord) => {
    setPayingDebt(debt);
    setPayAmount(formatThousand(debt.remainingAmount));
    setPaySource('Cash');
    setPayNote('');
  };

  const handleSubmitPay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingDebt) return;
    const amountNum = parseThousand(payAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    onPayDebt(payingDebt.id, amountNum, paySource, payNote);
    setPayingDebt(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 text-white p-5 sm:p-6 rounded-2xl shadow-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <HandCoins className="w-5 h-5" />
            </span>
            <h2 className="text-lg sm:text-xl font-display font-extrabold tracking-tight">
              Pencatatan Hutang & Piutang
            </h2>
          </div>
          <p className="text-slate-400 text-xs sm:text-sm">
            Pantau pinjaman uang yang harus Anda bayar (Hutang) dan yang harus Anda tagih (Piutang).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => handleOpenAddModal('piutang')}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Catat Piutang
          </button>
          <button
            onClick={() => handleOpenAddModal('hutang')}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 font-bold text-xs sm:text-sm rounded-xl transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            Catat Hutang
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Total Piutang Card */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-emerald-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
              Piutang Saya (Harus Ditagih)
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-display font-black text-emerald-600 font-mono">
            {formatIDR(totalPiutang)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Uang Anda yang dipinjam oleh orang lain
          </p>
        </div>

        {/* Total Hutang Card */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-amber-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
              Hutang Saya (Harus Dibayar)
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-display font-black text-amber-600 font-mono">
            {formatIDR(totalHutang)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Uang yang Anda pinjam dari pihak lain
          </p>
        </div>

        {/* Posisi Bersih Card */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
              Posisi Bersih (Piutang - Hutang)
            </span>
            <div className={`p-2 rounded-xl ${netBalance >= 0 ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'}`}>
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-xl sm:text-2xl font-display font-black font-mono ${netBalance >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
            {formatIDR(netBalance)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {netBalance >= 0 ? 'Kondisi finansial piutang positif' : 'Kewajiban hutang lebih besar dari piutang'}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama peminjam / catatan..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'Semua' },
            { id: 'piutang', label: 'Piutang' },
            { id: 'hutang', label: 'Hutang' },
            { id: 'unpaid', label: 'Belum Lunas' },
            { id: 'paid', label: 'Lunas' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                filterType === tab.id
                  ? 'bg-slate-900 text-white font-bold'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* List of Debt / Receivable Records */}
      {filteredDebts.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 shadow-xs space-y-3">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
            <HandCoins className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-700">Belum Ada Catatan Hutang atau Piutang</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Gunakan tombol di atas untuk mencatat hutang atau piutang baru Anda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredDebts.map((item) => {
            const isHutang = item.type === 'hutang';
            const paidAmount = item.totalAmount - item.remainingAmount;
            const percentagePaid = Math.min(100, Math.round((paidAmount / item.totalAmount) * 100));
            const isPaid = item.status === 'paid' || item.remainingAmount <= 0;

            // Check due date status
            const today = new Date().toISOString().split('T')[0];
            const isOverdue = !isPaid && item.dueDate && item.dueDate < today;

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl p-5 border transition shadow-xs flex flex-col justify-between ${
                  isPaid 
                    ? 'border-slate-200 opacity-90' 
                    : isHutang 
                      ? 'border-amber-200 hover:border-amber-300' 
                      : 'border-emerald-200 hover:border-emerald-300'
                }`}
              >
                <div>
                  {/* Top Header Row */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg border flex items-center gap-1 ${
                        isHutang
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {isHutang ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                        {isHutang ? 'Hutang Saya' : 'Piutang Saya'}
                      </span>

                      {/* Status badge */}
                      {isPaid ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-600 rounded-md border border-slate-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Lunas
                        </span>
                      ) : isOverdue ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-red-50 text-red-600 rounded-md border border-red-200 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Lewat Jatuh Tempo
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-600 rounded-md border border-blue-200 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Belum Lunas
                        </span>
                      )}
                    </div>

                    {/* Edit/Delete icons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                        title="Edit Catatan"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDebtToDelete(item)}
                        className="p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 rounded-lg transition cursor-pointer"
                        title="Hapus Catatan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Person Name & Note */}
                  <h3 className="font-display font-extrabold text-slate-900 text-base sm:text-lg tracking-tight">
                    {item.personName}
                  </h3>
                  {item.note && (
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                      {item.note}
                    </p>
                  )}

                  {/* Amount Breakdown */}
                  <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-150/60 grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Sisa Tagihan
                      </span>
                      <span className={`text-base font-display font-black font-mono ${isPaid ? 'text-slate-400 line-through' : isHutang ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {formatIDR(item.remainingAmount)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Total Awal
                      </span>
                      <span className="text-sm font-semibold text-slate-700 font-mono">
                        {formatIDR(item.totalAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                      <span>Terbayar: {formatIDR(paidAmount)}</span>
                      <span>{percentagePaid}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${isPaid ? 'bg-slate-400' : isHutang ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${percentagePaid}%` }}
                      />
                    </div>
                  </div>

                  {/* Due Date Indicator */}
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <span>Jatuh Tempo: <strong className="text-slate-800">{item.dueDate || '-'}</strong></span>
                  </div>
                </div>

                {/* Bottom Action Button */}
                {!isPaid && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={() => handleOpenPayModal(item)}
                      className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                        isHutang
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/10'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/10'
                      }`}
                    >
                      <Wallet className="w-4 h-4" />
                      {isHutang ? 'Bayar / Cicil Hutang' : 'Terima Pembayaran / Tagih'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* --- ADD / EDIT MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-display font-extrabold text-sm sm:text-base flex items-center gap-2">
                <HandCoins className="w-4 h-4 text-emerald-400" />
                {editingDebt ? 'Edit Catatan Hutang/Piutang' : 'Catat Hutang / Piutang Baru'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDebt} className="p-5 space-y-4">
              {/* Type Selection */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Jenis Transaksi Pinjaman
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setFormType('piutang')}
                    className={`py-2 text-xs font-bold rounded-lg transition ${
                      formType === 'piutang'
                        ? 'bg-emerald-500 text-slate-950 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Piutang Saya (Meminjamkan)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormType('hutang')}
                    className={`py-2 text-xs font-bold rounded-lg transition ${
                      formType === 'hutang'
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Hutang Saya (Meminjam)
                  </button>
                </div>
              </div>

              {/* Person / Entity Name */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  {formType === 'hutang' ? 'Nama Pemberi Pinjaman (Pemberi Hutang)' : 'Nama Peminjam Uang (Penghutang)'}
                </label>
                <input
                  type="text"
                  required
                  value={formPersonName}
                  onChange={(e) => setFormPersonName(e.target.value)}
                  placeholder={formType === 'hutang' ? 'Contoh: Budi, Koperasi, Bank BCA' : 'Contoh: Ahmad, Siti'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none transition"
                />
              </div>

              {/* Amount & Due Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Nominal Total (Rp)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={formTotalAmount}
                    onChange={(e) => setFormTotalAmount(formatThousand(e.target.value))}
                    placeholder="Contoh: 1.000.000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none transition font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Tanggal Jatuh Tempo
                  </label>
                  <input
                    type="date"
                    required
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none transition"
                  />
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Catatan / Keterangan
                </label>
                <input
                  type="text"
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  placeholder="Opsional (misal: modal pulsa, keperluan darurat)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none transition"
                />
              </div>

              {/* Record Transaction Option (Only when creating new) */}
              {!editingDebt && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formRecordTx}
                      onChange={(e) => setFormRecordTx(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span className="text-xs font-bold text-slate-700">
                      Catat otomatis ke riwayat Arus Kas saat ini
                    </span>
                  </label>

                  {formRecordTx && (
                    <div className="pt-2 border-t border-slate-200/80">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Sumber Dompet / Rekening
                      </label>
                      <select
                        value={formPaymentSource}
                        onChange={(e) => setFormPaymentSource(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800"
                      >
                        <option value="Cash">Tunai (Cash Wallet)</option>
                        <option value="Debit">Rekening Bank (Debit)</option>
                      </select>
                      <p className="text-[10px] text-slate-500 mt-1">
                        {formType === 'hutang' 
                          ? 'Pemasukan uang pinjaman akan menambah saldo dompet.' 
                          : 'Pengeluaran meminjamkan uang akan mengurangi saldo dompet.'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Simpan Catatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- PAY / SETTLE MODAL --- */}
      {payingDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-display font-extrabold text-sm sm:text-base flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-400" />
                {payingDebt.type === 'hutang' ? 'Pelunasan / Cicilan Hutang' : 'Penerimaan Pelunasan Piutang'}
              </h3>
              <button
                onClick={() => setPayingDebt(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitPay} className="p-5 space-y-4">
              {/* Summary */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs font-bold text-slate-800">{payingDebt.personName}</p>
                <div className="flex justify-between items-center text-xs text-slate-500 mt-1 font-mono">
                  <span>Sisa Tagihan:</span>
                  <strong className="text-slate-900">{formatIDR(payingDebt.remainingAmount)}</strong>
                </div>
              </div>

              {/* Payment Amount */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Nominal Yang Dibayarkan (Rp)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(formatThousand(e.target.value))}
                  placeholder="Contoh: 500.000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none transition font-mono"
                />
              </div>

              {/* Payment Source */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Sumber / Tujuan Dompet
                </label>
                <select
                  value={paySource}
                  onChange={(e) => setPaySource(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none transition"
                >
                  <option value="Cash">Tunai (Cash Wallet)</option>
                  <option value="Debit">Rekening Bank (Debit)</option>
                </select>
              </div>

              {/* Note */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Catatan Pembayaran
                </label>
                <input
                  type="text"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  placeholder="Opsional (misal: Angsuran ke-1)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none transition"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPayingDebt(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Proses & Catat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Debt Deletion */}
      <AnimatePresence>
        {debtToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDebtToDelete(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white border border-slate-200 rounded-2xl w-full max-w-[340px] shadow-2xl relative z-10 p-5 text-center overflow-hidden"
            >
              <div className="mx-auto w-12 h-12 bg-rose-50 text-rose-600 border border-rose-100 rounded-full flex items-center justify-center mb-3">
                <Trash2 className="w-5 h-5" />
              </div>
              
              <h3 className="font-display font-bold text-slate-800 text-base mb-1">
                Hapus Catatan {debtToDelete.type === 'hutang' ? 'Utang' : 'Piutang'}?
              </h3>
              <p className="text-slate-500 text-xs leading-relaxed mb-4">
                Apakah Anda yakin ingin menghapus catatan {debtToDelete.type === 'hutang' ? 'utang' : 'piutang'} dengan <strong className="text-slate-800 font-semibold">"{debtToDelete.personName}"</strong>?
              </p>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-left mb-5 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Nominal:</span>
                  <span className="font-semibold font-mono text-slate-800">{formatIDR(debtToDelete.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sisa:</span>
                  <span className="font-semibold font-mono text-rose-600">{formatIDR(debtToDelete.remainingAmount)}</span>
                </div>
              </div>
              
              <div className="flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => setDebtToDelete(null)}
                  className="flex-1 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteDebt(debtToDelete.id);
                    setDebtToDelete(null);
                  }}
                  className="flex-1 py-2.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition cursor-pointer"
                >
                  Ya, Hapus
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
