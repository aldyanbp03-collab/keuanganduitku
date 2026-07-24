/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { formatThousand, parseThousand } from '../utils/format';
import { 
  Plus, 
  Coffee, 
  ShoppingBag, 
  Car, 
  Tv, 
  Zap, 
  Trash2,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  CreditCard as CardIcon,
  Sparkles,
  Info,
  X,
  PlusCircle,
  Clock,
  Search,
  Filter,
  ChevronsUpDown,
  ChevronDown
} from 'lucide-react';
import { Transaction, Category, CreditCard, SavingGoal } from '../types';

interface ExpensesTabProps {
  transactions: Transaction[];
  categories: Category[];
  creditCards: CreditCard[];
  savingGoals?: SavingGoal[];
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => void;
  onDeleteTransaction: (id: string) => void;
  onSelectTransaction?: (tx: Transaction) => void;
  monthlyBudget?: number;
  onUpdateMonthlyBudget?: (newBudget: number) => void;
}

export default function ExpensesTab({
  transactions,
  categories,
  creditCards,
  savingGoals = [],
  onAddTransaction,
  onDeleteTransaction,
  onSelectTransaction,
  monthlyBudget = 6500000,
  onUpdateMonthlyBudget
}: ExpensesTabProps) {
  // Modal toggle
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(categories.filter(c => c.type === 'expense')[0]?.name || 'Makanan & Minuman');
  const [source, setSource] = useState('Cash');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Quick budget state
  const [budgetLimit, setBudgetLimit] = useState(monthlyBudget);
  const [editingBudget, setEditingBudget] = useState(false);
  const [tempBudget, setTempBudget] = useState(monthlyBudget.toString());
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);

  // Sync state if prop changes
  useEffect(() => {
    setBudgetLimit(monthlyBudget);
    setTempBudget(formatThousand(monthlyBudget));
  }, [monthlyBudget]);

  // Success indicator
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filter States for Log Belanja
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('all');
  const [expenseSourceFilter, setExpenseSourceFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');
  const [showFilters, setShowFilters] = useState(false);

  // Calculations
  const expensesList = transactions.filter(t => t.type === 'expense');
  const totalExpense = expensesList.reduce((acc, t) => acc + t.amount, 0);
  const budgetPercentage = Math.min((totalExpense / budgetLimit) * 100, 100);
  const isOverBudget = totalExpense > budgetLimit;

  // Filtered Expenses
  const filteredExpenses = expensesList.filter(t => {
    // 1. Search keyword
    const matchesSearch = expenseSearch === '' || 
      t.title.toLowerCase().includes(expenseSearch.toLowerCase()) ||
      (t.note && t.note.toLowerCase().includes(expenseSearch.toLowerCase()));
    if (!matchesSearch) return false;

    // 2. Category
    if (expenseCategoryFilter !== 'all' && t.category !== expenseCategoryFilter) return false;

    // 3. Payment Source
    if (expenseSourceFilter !== 'all') {
      const src = t.paymentSource || 'Cash';
      if (expenseSourceFilter === 'Cash' && src !== 'Cash') return false;
      if (expenseSourceFilter === 'Debit' && src !== 'Debit') return false;
      if (expenseSourceFilter === 'Tabungan' && src !== 'Tabungan' && !t.relatedSavingGoalId) return false;
      if (expenseSourceFilter === 'Kartu Kredit' && (src === 'Cash' || src === 'Debit' || src === 'Tabungan')) return false;
    }

    // 4. Start & End Date
    const matchesStartDate = startDate ? t.date >= startDate : true;
    const matchesEndDate = endDate ? t.date <= endDate : true;
    if (!matchesStartDate || !matchesEndDate) return false;

    return true;
  });

  // Sort Expenses
  const sortedExpenses = [...filteredExpenses].sort((a, b) => {
    if (sortBy === 'date-desc') {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    } else if (sortBy === 'date-asc') {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    } else if (sortBy === 'amount-desc') {
      return b.amount - a.amount;
    } else {
      return a.amount - b.amount;
    }
  });

  const filteredTotal = filteredExpenses.reduce((sum, t) => sum + t.amount, 0);

  // Format IDR
  const formatIDR = (num: number) => {
    return 'Rp ' + num.toLocaleString('id-ID');
  };

  const showToast = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 2500);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseThousand(amount);
    if (!title || isNaN(parsedAmount) || parsedAmount <= 0) return;

    onAddTransaction({
      title,
      amount: parsedAmount,
      type: 'expense',
      category,
      date,
      note,
      paymentSource: source,
      relatedCreditCardId: source.startsWith('card-') ? source : undefined
    });

    // Reset Form
    setTitle('');
    setAmount('');
    setNote('');
    setShowAddModal(false);
    showToast(`"${title}" berhasil ditambahkan ke pengeluaran!`);
  };

  const handleSaveBudget = () => {
    const parsed = parseThousand(tempBudget);
    if (!parsed || isNaN(parsed) || parsed <= 0) return;
    setBudgetLimit(parsed);
    if (onUpdateMonthlyBudget) {
      onUpdateMonthlyBudget(parsed);
    }
    setEditingBudget(false);
    showToast(`Batas anggaran disetel ke ${formatIDR(parsed)}`);
  };

  return (
    <div className="space-y-6 pb-10">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-emerald-500/30 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5"
          >
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-xs font-semibold">{successMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Panel */}
      <div>
        <h2 className="text-xl sm:text-2xl font-display font-extrabold text-slate-950 tracking-tight">
          Catat Pengeluaran Cepat & Pintar
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Alokasi anggaran, pencatatan otomatis, dan visualisasi konsumsi finansial harian Anda.
        </p>
      </div>

      {/* Main Grid: Action CTA Left, Stats Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: GORGEOUS ACTION CTA HERO CARD */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col justify-between relative overflow-hidden h-[280px] lg:h-auto min-h-[240px]">
          {/* Ambient background accent */}
          <div className="absolute -right-20 -top-20 w-60 h-60 bg-rose-500/5 rounded-full filter blur-3xl pointer-events-none" />
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-indigo-500/5 rounded-full filter blur-2xl pointer-events-none" />

          <div className="relative space-y-4">
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-500 rounded-2xl w-fit">
              <PlusCircle className="w-6 h-6 stroke-[2]" />
            </div>
            <div className="space-y-2">
              <h3 className="font-display font-extrabold text-slate-900 text-lg sm:text-xl leading-snug">
                Catat Transaksi Belanja Anda
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md leading-relaxed">
                Pantau pengeluaran bulanan secara akurat. Klik tombol di bawah untuk membuka formulir pengeluaran interaktif instan.
              </p>
            </div>
          </div>

          <div className="relative pt-6">
            <button
              onClick={() => setShowAddModal(true)}
              className="w-full sm:w-auto px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg hover:shadow-xl transition duration-200 cursor-pointer flex items-center justify-center gap-2 group"
            >
              <Plus className="w-4 h-4 text-rose-400 group-hover:rotate-90 transition-transform duration-200" />
              <span>Catat Pengeluaran Baru</span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: DYNAMIC BUDGET CIRCLE */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* MODERN BUDGET RADIAL / LINEAR GAUGE */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-display font-bold text-slate-800 text-sm">Anggaran Belanja Bulanan</h4>
                <p className="text-xs text-slate-500 font-normal mt-0.5">Planning batas maksimal pengeluaran</p>
              </div>
              
              <button
                onClick={() => {
                  if (editingBudget) {
                    handleSaveBudget();
                  } else {
                    setTempBudget(formatThousand(budgetLimit));
                    setEditingBudget(true);
                  }
                }}
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 cursor-pointer"
              >
                {editingBudget ? 'Simpan' : 'Ubah Limit'}
              </button>
            </div>

            {editingBudget && (
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  inputMode="numeric"
                  value={tempBudget}
                  onChange={(e) => setTempBudget(formatThousand(e.target.value))}
                  placeholder="Contoh: 6.500.000"
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-base focus:outline-hidden w-full font-mono"
                />
                <button
                  onClick={() => setEditingBudget(false)}
                  className="text-[10px] text-slate-400 font-bold px-2 py-1 cursor-pointer"
                >
                  Batal
                </button>
              </div>
            )}

            {/* Total expense status */}
            <div className="space-y-4">
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Telah Terpakai</span>
                  <span className="text-lg font-display font-extrabold text-slate-950 font-mono">{formatIDR(totalExpense)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Sisa Plafon</span>
                  <span className={`text-xs font-bold font-mono ${totalExpense > budgetLimit ? 'text-rose-600' : 'text-slate-600'}`}>
                    {totalExpense > budgetLimit ? 'Limit Terlampaui!' : formatIDR(budgetLimit - totalExpense)}
                  </span>
                </div>
              </div>

              {/* Progress bar line */}
              <div className="space-y-1.5">
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-700 ${
                      isOverBudget 
                        ? 'bg-rose-500' 
                        : budgetPercentage > 80 
                        ? 'bg-amber-500' 
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${budgetPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
                  <span>{Math.round(budgetPercentage)}% Terpakai</span>
                  <span>Limit: {formatIDR(budgetLimit)}</span>
                </div>
              </div>

              {/* Contextual Warning */}
              {isOverBudget ? (
                <div className="p-3 bg-rose-50/50 border border-rose-100 rounded-xl flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-rose-700 leading-relaxed font-semibold">
                    Alarm! Anggaran telah melewati batas maksimal bulanan Anda.
                  </p>
                </div>
              ) : budgetPercentage > 80 ? (
                <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-700 leading-relaxed font-semibold">
                    Perhatian: Belanja menyentuh {Math.round(budgetPercentage)}% dari anggaran bulanan.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50/50 border border-emerald-100/55 rounded-xl flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-emerald-700 leading-relaxed font-semibold">
                    Arus kas belanja terpantau aman dan terkendali di bawah batas.
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* RECENTLY RECORDED EXPENSES PREVIEW - Log Belanja Terakhir - With Filters */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="min-w-0">
            <h4 className="font-display font-bold text-slate-800 text-sm">Log Belanja & Pengeluaran</h4>
            <p className="text-xs text-slate-500 font-normal mt-0.5 leading-snug">Histori pengeluaran yang tercatat di sistem</p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
              Total: {formatIDR(filteredTotal)}
            </span>
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full shrink-0 whitespace-nowrap">
              {filteredExpenses.length} Transaksi
            </span>
          </div>
        </div>

        {/* Filter Controls Bar - Exact match to Riwayat Pembukuan */}
        <div className="bg-[#0f141f] border border-[#1f283a] rounded-2xl p-3.5 sm:p-4 shadow-xl space-y-3">
          
          {/* Row 1: Full-width Search Bar */}
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={expenseSearch}
              onChange={(e) => setExpenseSearch(e.target.value)}
              placeholder="Cari pengeluaran..."
              className="w-full bg-[#182030] border border-[#26334a] rounded-xl pl-10 pr-9 py-2.5 sm:py-3 text-sm font-medium text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-rose-500/80 transition"
            />
            {expenseSearch && (
              <button
                type="button"
                onClick={() => setExpenseSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Row 2: Filter Button & Sort Dropdown side-by-side */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center gap-2 rounded-xl py-2.5 sm:py-3 px-4 text-sm font-bold transition cursor-pointer ${
                showFilters 
                  ? 'bg-[#182542] border-2 border-[#3b82f6] text-white shadow-xs' 
                  : 'bg-[#182030] hover:bg-[#202b40] border border-[#26334a] text-slate-200'
              }`}
            >
              <Filter className="w-4 h-4 text-slate-300" />
              <span>Filter</span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            <div className="relative w-full">
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="w-full appearance-none bg-[#182030] hover:bg-[#202b40] border border-[#26334a] rounded-xl py-2.5 sm:py-3 pl-4 pr-10 text-sm font-bold text-slate-200 transition cursor-pointer focus:outline-none"
              >
                <option value="date-desc" className="bg-[#0f141f] text-slate-200">Terbaru</option>
                <option value="date-asc" className="bg-[#0f141f] text-slate-200">Terlama</option>
                <option value="amount-desc" className="bg-[#0f141f] text-slate-200">Nominal Terbesar</option>
                <option value="amount-asc" className="bg-[#0f141f] text-slate-200">Nominal Terkecil</option>
              </select>
              <ChevronsUpDown className="w-4 h-4 text-slate-300 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Collapsible Filters Block */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden pt-3 border-t border-[#1f283a]"
              >
                <div className="space-y-3.5 pb-1">
                  
                  {/* SUMBER PEMBAYARAN */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      SUMBER PEMBAYARAN
                    </label>
                    <div className="relative w-full">
                      <select
                        value={expenseSourceFilter}
                        onChange={(e) => setExpenseSourceFilter(e.target.value)}
                        className="w-full appearance-none bg-[#182030] hover:bg-[#202b40] border border-[#26334a] rounded-xl px-4 py-2.5 sm:py-3 text-slate-200 text-sm font-medium focus:outline-none transition cursor-pointer pr-10"
                      >
                        <option value="all" className="bg-[#0f141f]">Semua Sumber Bayar</option>
                        <option value="Cash" className="bg-[#0f141f]">Tunai (Cash)</option>
                        <option value="Debit" className="bg-[#0f141f]">Debit / ATM</option>
                        <option value="Kartu Kredit" className="bg-[#0f141f]">Kartu Kredit</option>
                        <option value="Tabungan" className="bg-[#0f141f]">Tabungan</option>
                      </select>
                      <ChevronsUpDown className="w-4 h-4 text-slate-300 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* KATEGORI */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      KATEGORI
                    </label>
                    <div className="relative w-full">
                      <select
                        value={expenseCategoryFilter}
                        onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                        className="w-full appearance-none bg-[#182030] hover:bg-[#202b40] border border-[#26334a] rounded-xl px-4 py-2.5 sm:py-3 text-slate-200 text-sm font-medium focus:outline-none transition cursor-pointer pr-10"
                      >
                        <option value="all" className="bg-[#0f141f]">Semua Kategori</option>
                        {categories.filter(c => c.type === 'expense').map((c) => (
                          <option key={c.id} value={c.name} className="bg-[#0f141f]">{c.name}</option>
                        ))}
                      </select>
                      <ChevronsUpDown className="w-4 h-4 text-slate-300 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* TANGGAL MULAI */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      TANGGAL MULAI
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-[#182030] border border-[#26334a] rounded-xl px-4 py-2.5 sm:py-3 text-slate-200 text-sm font-medium focus:outline-none focus:border-rose-500 transition cursor-pointer color-scheme-dark"
                    />
                  </div>

                  {/* TANGGAL SELESAI */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      TANGGAL SELESAI
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-[#182030] border border-[#26334a] rounded-xl px-4 py-2.5 sm:py-3 text-slate-200 text-sm font-medium focus:outline-none focus:border-rose-500 transition cursor-pointer color-scheme-dark"
                    />
                  </div>

                  {/* Reset Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setExpenseSearch('');
                        setExpenseCategoryFilter('all');
                        setExpenseSourceFilter('all');
                        setStartDate('');
                        setEndDate('');
                        setSortBy('date-desc');
                      }}
                      className="w-full bg-[#182030] hover:bg-[#222e47] active:bg-[#283756] text-slate-200 font-semibold text-sm py-3 rounded-xl border border-[#26334a] transition text-center cursor-pointer shadow-xs"
                    >
                      Atur Ulang Semua Filter
                    </button>
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {sortedExpenses.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs flex flex-col items-center justify-center">
            <Info className="w-8 h-8 text-slate-300 stroke-1 mb-2" />
            <span>Tidak ada transaksi pengeluaran yang sesuai dengan filter.</span>
          </div>
        ) : (
          <div className="divide-y divide-slate-100/75 max-h-[380px] overflow-y-auto pr-1">
            {sortedExpenses.map((tx) => {
              const sourceLabel = 
                tx.paymentSource === 'Cash' ? 'Tunai' :
                tx.paymentSource === 'Debit' ? 'Debit' :
                tx.paymentSource === 'Tabungan' || tx.relatedSavingGoalId || (tx.paymentSource && tx.paymentSource.startsWith('goal-')) ? 'Tabungan' :
                'Kartu Kredit';

              return (
                <div 
                  key={tx.id} 
                  onClick={() => onSelectTransaction?.(tx)}
                  className="py-3 flex items-center justify-between group hover:bg-slate-50/75 px-2 rounded-xl transition cursor-pointer active:scale-[0.99]"
                  title="Klik untuk detail & ubah"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center shrink-0">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 truncate group-hover:text-emerald-700 transition-colors">{tx.title}</span>
                        <span className="text-[9px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/60 shrink-0">{tx.category}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">{tx.date} • {sourceLabel}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs sm:text-sm font-bold font-mono text-slate-850">-{formatIDR(tx.amount)}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation(); // Avoid opening details popup
                        setTxToDelete(tx);
                      }}
                      className="p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 rounded-lg transition cursor-pointer shrink-0 shadow-2xs"
                      title="Hapus Catatan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation Modal for Transaction Deletion */}
      <AnimatePresence>
        {txToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setTxToDelete(null)}
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
              
              <h3 className="font-display font-bold text-slate-800 text-base mb-1">Hapus Catatan Belanja?</h3>
              <p className="text-slate-500 text-xs leading-relaxed mb-4">
                Apakah Anda yakin ingin menghapus catatan belanja <strong className="text-slate-800 font-semibold">"{txToDelete.title}"</strong> ({formatIDR(txToDelete.amount)})?
              </p>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-left mb-5 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Kategori:</span>
                  <span className="font-semibold text-slate-700">{txToDelete.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tanggal:</span>
                  <span className="font-semibold text-slate-700">{txToDelete.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sumber:</span>
                  <span className="font-semibold text-slate-700">{txToDelete.paymentSource}</span>
                </div>
              </div>
              
              <div className="flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => setTxToDelete(null)}
                  className="flex-1 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteTransaction(txToDelete.id);
                    setTxToDelete(null);
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


      {/* --- POPUP MODAL: CATAT PENGELUARAN BARU - Clean Input & No Auto-Zoom --- */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Background Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-rose-50/20">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-rose-100 text-rose-600 rounded-lg">
                    <Plus className="w-4 h-4 stroke-[3]" />
                  </div>
                  <h3 className="font-display font-bold text-slate-800 text-sm">Catat Pengeluaran Baru</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form container with Prevent Auto-Zoom (text-base) */}
              <form onSubmit={handleManualSubmit} className="p-4 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nama Transaksi / Merchant</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Starbucks Kopi, KFC, Alfamart"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-slate-800 focus:border-rose-500 focus:outline-hidden transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nominal Belanja (Rp)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      value={amount}
                      onChange={(e) => setAmount(formatThousand(e.target.value))}
                      placeholder="Contoh: 85.000"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-slate-800 focus:border-rose-500 focus:outline-hidden transition font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Kategori</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-slate-800 focus:border-rose-500 focus:outline-hidden transition"
                    >
                      {categories.filter(c => c.type === 'expense').map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sumber Dana</label>
                    <select
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-slate-800 focus:border-rose-500 focus:outline-hidden transition"
                    >
                      <option value="Cash">Tunai (Cash)</option>
                      <option value="Debit">Debit Rekening</option>
                      <option value="Tabungan">Tabungan (Penarikan/Alokasi Tabungan)</option>
                      {creditCards.map(cc => (
                        <option key={cc.id} value={cc.id}>Kartu: {cc.cardName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tanggal Transaksi</label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-slate-800 focus:border-rose-500 focus:outline-hidden transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Catatan Tambahan (Opsional)</label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Contoh: traktiran ulang tahun"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-slate-800 focus:border-rose-500 focus:outline-hidden transition"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-slate-500 hover:text-slate-800 text-xs font-bold transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Simpan Pengeluaran
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
