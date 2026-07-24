/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { formatThousand, parseThousand } from '../utils/format';
import { 
  PiggyBank, 
  PlusCircle, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar, 
  Target, 
  Info,
  Trash2,
  AlertCircle,
  TrendingUp,
  Sparkles,
  Wallet,
  CreditCard as CreditCardIcon,
  ShoppingBag,
  X,
  Search,
  Filter,
  History,
  Tag,
  ArrowDownLeft,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronsUpDown
} from 'lucide-react';
import { SavingGoal, CreditCard, Category, Transaction } from '../types';

interface SavingsTabProps {
  savingGoals: SavingGoal[];
  creditCards?: CreditCard[];
  categories?: Category[];
  transactions?: Transaction[];
  onDeleteTransaction?: (id: string) => void;
  onSelectTransaction?: (tx: Transaction) => void;
  onAddGoal: (goal: Omit<SavingGoal, 'id' | 'status'>) => void;
  onDeleteGoal: (id: string) => void;
  onAdjustSavings: (
    id: string, 
    amount: number, 
    type: 'deposit' | 'withdraw',
    withdrawDestination?: {
      target: 'cash' | 'credit_card' | 'expense';
      creditCardId?: string;
      expenseCategory?: string;
      expenseTitle?: string;
    }
  ) => void;
}

export default function SavingsTab({
  savingGoals,
  creditCards = [],
  categories = [],
  transactions = [],
  onDeleteTransaction,
  onSelectTransaction,
  onAddGoal,
  onDeleteGoal,
  onAdjustSavings
}: SavingsTabProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState<string | null>(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState<string | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<SavingGoal | null>(null);
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);

  // Goal filters
  const [goalSearch, setGoalSearch] = useState('');
  const [goalStatusFilter, setGoalStatusFilter] = useState<'all' | 'active' | 'completed'>('all');

  // Savings History filters
  const [historySearch, setHistorySearch] = useState('');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<'all' | 'deposit' | 'withdraw'>('all');
  const [historyGoalFilter, setHistoryGoalFilter] = useState<string>('all');
  const [historyDateFilter, setHistoryDateFilter] = useState<'all' | 'this_month' | 'last_30_days'>('all');

  // Form states for new goal
  const [newTitle, setNewTitle] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newDeadline, setNewDeadline] = useState('');

  // Form states for deposit/withdraw
  const [adjustAmount, setAdjustAmount] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Withdraw target options
  const [withdrawTarget, setWithdrawTarget] = useState<'cash' | 'credit_card' | 'expense'>('cash');
  const [selectedCcId, setSelectedCcId] = useState<string>('');
  const [expenseCategory, setExpenseCategory] = useState<string>('Belanja');
  const [expenseTitle, setExpenseTitle] = useState<string>('');

  const formatIDR = (num: number) => {
    return 'Rp ' + num.toLocaleString('id-ID');
  };

  // 1. Filtered Goals
  const filteredSavingGoals = savingGoals.filter(goal => {
    const matchesSearch = goalSearch === '' || 
      goal.title.toLowerCase().includes(goalSearch.toLowerCase());
    
    if (!matchesSearch) return false;

    if (goalStatusFilter === 'active') return goal.status !== 'completed' && goal.currentAmount < goal.targetAmount;
    if (goalStatusFilter === 'completed') return goal.status === 'completed' || goal.currentAmount >= goal.targetAmount;
    
    return true;
  });

  // 2. Identify and Filter Savings Transactions
  const allSavingsTxs = transactions.filter(t => {
    return (
      t.relatedSavingGoalId ||
      t.paymentSource === 'Tabungan' ||
      t.category === 'Tabungan' ||
      t.title.toLowerCase().includes('setor tabungan') ||
      t.title.toLowerCase().includes('tarik tabungan') ||
      t.title.toLowerCase().includes('belanja tabungan') ||
      (t.title.toLowerCase().includes('pelunasan kk') && t.paymentSource === 'Tabungan')
    );
  });

  // Totals
  const totalDepositAmount = allSavingsTxs
    .filter(t => t.title.toLowerCase().includes('setor tabungan') || (t.note && t.note.toLowerCase().includes('alokasi dana ke goal')))
    .reduce((acc, t) => acc + t.amount, 0);

  const totalWithdrawAmount = allSavingsTxs
    .filter(t => !t.title.toLowerCase().includes('setor tabungan') && !(t.note && t.note.toLowerCase().includes('alokasi dana ke goal')))
    .reduce((acc, t) => acc + t.amount, 0);

  // Filtered History
  const filteredSavingsTxs = allSavingsTxs.filter(t => {
    // Search
    const matchesSearch = historySearch === '' || 
      t.title.toLowerCase().includes(historySearch.toLowerCase()) ||
      (t.note && t.note.toLowerCase().includes(historySearch.toLowerCase()));
    
    if (!matchesSearch) return false;

    // Type: deposit vs withdraw
    const isDeposit = t.title.toLowerCase().includes('setor tabungan') || (t.note && t.note.toLowerCase().includes('alokasi dana ke goal'));
    if (historyTypeFilter === 'deposit' && !isDeposit) return false;
    if (historyTypeFilter === 'withdraw' && isDeposit) return false;

    // Goal Filter
    if (historyGoalFilter !== 'all') {
      const selectedGoal = savingGoals.find(g => g.id === historyGoalFilter);
      const isMatchGoalId = t.relatedSavingGoalId === historyGoalFilter;
      const isMatchGoalTitle = selectedGoal && t.title.toLowerCase().includes(selectedGoal.title.toLowerCase());
      if (!isMatchGoalId && !isMatchGoalTitle) return false;
    }

    // Date Filter
    if (historyDateFilter !== 'all') {
      const txDate = new Date(t.date);
      const now = new Date();
      if (historyDateFilter === 'this_month') {
        if (txDate.getMonth() !== now.getMonth() || txDate.getFullYear() !== now.getFullYear()) return false;
      } else if (historyDateFilter === 'last_30_days') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        if (txDate < thirtyDaysAgo) return false;
      }
    }

    return true;
  });

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newTarget || !newDeadline) {
      setErrorMsg('Semua kolom wajib diisi untuk membuat sasaran.');
      return;
    }
    const targetVal = parseThousand(newTarget);
    if (isNaN(targetVal) || targetVal <= 0) {
      setErrorMsg('Nominal target tabungan harus diisi angka positif.');
      return;
    }

    onAddGoal({
      title: newTitle,
      targetAmount: targetVal,
      currentAmount: 0,
      deadline: newDeadline
    });

    // Reset Form
    setNewTitle('');
    setNewTarget('');
    setNewDeadline('');
    setErrorMsg('');
    setShowAddForm(false);
  };

  const handleDepositSubmit = (e: React.FormEvent, goalId: string) => {
    e.preventDefault();
    const amountVal = parseThousand(adjustAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      setErrorMsg('Nominal setoran harus berupa angka positif.');
      return;
    }

    onAdjustSavings(goalId, amountVal, 'deposit');
    setAdjustAmount('');
    setErrorMsg('');
    setShowDepositModal(null);
  };

  const handleWithdrawSubmit = (e: React.FormEvent, goal: SavingGoal) => {
    e.preventDefault();
    const amountVal = parseThousand(adjustAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      setErrorMsg('Nominal penarikan harus berupa angka positif.');
      return;
    }
    if (amountVal > goal.currentAmount) {
      setErrorMsg(`Penarikan melebihi saldo tabungan saat ini (${formatIDR(goal.currentAmount)}).`);
      return;
    }

    if (withdrawTarget === 'credit_card') {
      if (!creditCards || creditCards.length === 0) {
        setErrorMsg('Belum ada kartu kredit terhubung. Pilih tujuan penarikan lain atau tambahkan kartu kredit terlebih dahulu.');
        return;
      }
    }

    const ccId = selectedCcId || (creditCards.length > 0 ? creditCards[0].id : '');

    onAdjustSavings(goal.id, amountVal, 'withdraw', {
      target: withdrawTarget,
      creditCardId: withdrawTarget === 'credit_card' ? ccId : undefined,
      expenseCategory: withdrawTarget === 'expense' ? (expenseCategory || 'Belanja') : undefined,
      expenseTitle: withdrawTarget === 'expense' ? (expenseTitle.trim() || `Belanja Tabungan (${goal.title})`) : undefined
    });

    setAdjustAmount('');
    setExpenseTitle('');
    setErrorMsg('');
    setShowWithdrawModal(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-display font-extrabold text-slate-950 flex items-center gap-2">
            <PiggyBank className="w-7 h-7 text-emerald-600" /> Kelola Sasaran Tabungan
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Wujudkan impian masa depan Anda dengan menyisihkan anggaran secara berkala.
          </p>
        </div>
        
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setErrorMsg('');
          }}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" /> Tambah Sasaran Baru
        </button>
      </div>

      {/* Goal Creation Form (Collabsable) */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleCreateGoal} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="font-display font-bold text-slate-800 text-sm">Buat Target Tabungan Baru</h3>
              
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Nama Tabungan / Impian</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Contoh: Beli Laptop Rian, DP Mobil"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs sm:text-sm focus:border-emerald-500 focus:outline-hidden transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Target Nominal (Rp)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={newTarget}
                    onChange={(e) => setNewTarget(formatThousand(e.target.value))}
                    placeholder="Contoh: 15.000.000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs sm:text-sm focus:border-emerald-500 focus:outline-hidden transition font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Batas Waktu (Deadline)</label>
                  <input
                    type="date"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs sm:text-sm focus:border-emerald-500 focus:outline-hidden transition"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-slate-500 hover:text-slate-800 text-xs font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition"
                >
                  Simpan Target Tabungan
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Target Goals Filter Bar */}
      <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={goalSearch}
            onChange={(e) => setGoalSearch(e.target.value)}
            placeholder="Cari target tabungan..."
            className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-hidden"
          />
          {goalSearch && (
            <button
              onClick={() => setGoalSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'Semua Target' },
            { id: 'active', label: 'Dalam Proses' },
            { id: 'completed', label: 'Tercapai 🎉' }
          ].map(status => (
            <button
              key={status.id}
              type="button"
              onClick={() => setGoalStatusFilter(status.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                goalStatusFilter === status.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {status.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid List of Saving Goals */}
      {filteredSavingGoals.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center text-slate-400 text-xs">
          Tidak ada sasaran tabungan yang sesuai dengan kata kunci / filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredSavingGoals.map((goal) => {
          const goalPercentage = (goal.currentAmount / goal.targetAmount) * 100;
          const remainingAmount = goal.targetAmount - goal.currentAmount;
          
          return (
            <div 
              key={goal.id}
              className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all relative flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="p-2.5 bg-emerald-500/10 text-emerald-700 border border-emerald-500/10 rounded-xl">
                    <Target className="w-5 h-5" />
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setGoalToDelete(goal)}
                    className="p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 rounded-lg transition-all cursor-pointer"
                    title="Hapus sasaran"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Info */}
                <div className="mt-4">
                  <h3 className="font-display font-bold text-slate-800 text-sm">{goal.title}</h3>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono mt-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> Limit: {goal.deadline}
                  </div>
                </div>

                {/* Progress Circle & Text */}
                <div className="mt-6 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Terkumpul</span>
                    <span className="text-base sm:text-lg font-display font-extrabold text-slate-900">{formatIDR(goal.currentAmount)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Sasaran</span>
                    <span className="text-xs font-bold text-slate-600 font-mono">{formatIDR(goal.targetAmount)}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-3.5 space-y-1.5">
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${goalPercentage >= 100 ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-indigo-600'}`} 
                      style={{ width: `${Math.min(goalPercentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span>{Math.round(goalPercentage)}% Terpenuhi</span>
                    {remainingAmount > 0 ? (
                      <span>Kekurangan: {formatIDR(remainingAmount)}</span>
                    ) : (
                      <span className="text-emerald-600 font-bold flex items-center gap-1">
                        <Sparkles className="w-3 h-3 animate-pulse" /> Target Terlampaui!
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Deposit/Withdraw Buttons */}
              <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg('');
                    setShowDepositModal(goal.id);
                  }}
                  className="py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" /> Setor
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg('');
                    setShowWithdrawModal(goal.id);
                  }}
                  className="py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 rounded-lg transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" /> Tarik
                </button>
              </div>

              {/* Deposit Modal Pop-over */}
              <AnimatePresence>
                {showDepositModal === goal.id && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute inset-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl p-5 flex flex-col justify-between z-10"
                  >
                    <form onSubmit={(e) => handleDepositSubmit(e, goal.id)} className="space-y-3 flex flex-col justify-between h-full">
                      <div>
                        <h4 className="font-display font-bold text-slate-800 dark:text-slate-100 text-sm">Setor Dana ke Tabungan</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Sisihkan saldo tunai Anda ke {goal.title}.</p>
                        
                        {errorMsg && (
                          <div className="p-2 bg-red-50 border border-red-100 text-red-600 dark:bg-red-950/40 dark:border-red-900/60 dark:text-red-300 text-[10px] rounded-lg mt-2">
                            {errorMsg}
                          </div>
                        )}

                        <div className="mt-3">
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Nominal Setoran (Rp)</label>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={adjustAmount}
                            onChange={(e) => setAdjustAmount(formatThousand(e.target.value))}
                            placeholder="Contoh: 500.000"
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-hidden font-mono"
                            autoFocus
                          />
                          <div className="mt-2 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                            Otomatis memotong Saldo Tunai (Cash)
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => {
                            setAdjustAmount('');
                            setErrorMsg('');
                            setShowDepositModal(null);
                          }}
                          className="px-3 py-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 text-xs font-bold transition"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-lg transition shadow-xs"
                        >
                          Konfirmasi Setor
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Withdraw Modal Dialog (Centered Backdrop Overlay) */}
              <AnimatePresence>
                {showWithdrawModal === goal.id && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl p-5 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
                    >
                      <form onSubmit={(e) => handleWithdrawSubmit(e, goal)} className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-display font-extrabold text-slate-900 dark:text-slate-100 text-base sm:text-lg flex items-center gap-2">
                              <ArrowDownRight className="w-5 h-5 text-rose-500" />
                              Tarik Dana Tabungan
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              Tarik dari <span className="font-bold text-slate-800 dark:text-slate-200">{goal.title}</span> (Saldo: {formatIDR(goal.currentAmount)})
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setAdjustAmount('');
                              setErrorMsg('');
                              setShowWithdrawModal(null);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition cursor-pointer"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        {errorMsg && (
                          <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/50 dark:border-rose-900 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                            <span>{errorMsg}</span>
                          </div>
                        )}

                        {/* Tujuan Penarikan Dana */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                            Tujuan Penarikan Dana
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            <button
                              type="button"
                              onClick={() => setWithdrawTarget('cash')}
                              className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                                withdrawTarget === 'cash'
                                  ? 'bg-emerald-50 border-emerald-500 text-emerald-800 dark:bg-emerald-950/60 dark:border-emerald-500 dark:text-emerald-300 font-bold'
                                  : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 hover:bg-slate-100'
                              }`}
                            >
                              <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              <span className="text-xs">Uang Cash</span>
                              <span className="text-[9px] text-slate-400 font-normal">Saldo Tunai</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setWithdrawTarget('credit_card')}
                              className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                                withdrawTarget === 'credit_card'
                                  ? 'bg-indigo-50 border-indigo-500 text-indigo-800 dark:bg-indigo-950/60 dark:border-indigo-500 dark:text-indigo-300 font-bold'
                                  : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 hover:bg-slate-100'
                              }`}
                            >
                              <CreditCardIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                              <span className="text-xs">Kartu Kredit</span>
                              <span className="text-[9px] text-slate-400 font-normal">Pelunasan CC</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setWithdrawTarget('expense')}
                              className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                                withdrawTarget === 'expense'
                                  ? 'bg-rose-50 border-rose-500 text-rose-800 dark:bg-rose-950/60 dark:border-rose-500 dark:text-rose-300 font-bold'
                                  : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 hover:bg-slate-100'
                              }`}
                            >
                              <ShoppingBag className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                              <span className="text-xs">Belanja</span>
                              <span className="text-[9px] text-slate-400 font-normal">Pengeluaran</span>
                            </button>
                          </div>
                        </div>

                        {/* Dynamic Input based on target */}
                        {withdrawTarget === 'cash' && (
                          <div className="p-2.5 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                            <span>Dana akan otomatis masuk dan menambah <strong>Saldo Tunai (Cash)</strong>.</span>
                          </div>
                        )}

                        {withdrawTarget === 'credit_card' && (
                          <div className="space-y-2 p-3 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 rounded-xl">
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                              Pilih Kartu Kredit untuk Dilunasi
                            </label>
                            {creditCards.length > 0 ? (
                              <select
                                value={selectedCcId || creditCards[0]?.id || ''}
                                onChange={(e) => setSelectedCcId(e.target.value)}
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:border-indigo-500 focus:outline-hidden"
                              >
                                {creditCards.map(cc => (
                                  <option key={cc.id} value={cc.id}>
                                    {cc.cardName} (Terpakai: {formatIDR(cc.usedAmount)})
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <p className="text-xs text-amber-600 dark:text-amber-400">
                                ⚠️ Belum ada data kartu kredit. Tambahkan terlebih dahulu di menu Kredit.
                              </p>
                            )}
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              Tagihan kartu kredit terpakai akan otomatis berkurang sebesar nominal tarik.
                            </p>
                          </div>
                        )}

                        {withdrawTarget === 'expense' && (
                          <div className="space-y-3 p-3 bg-rose-50/60 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 rounded-xl">
                            <div>
                              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Nama Keperluan / Belanja
                              </label>
                              <input
                                type="text"
                                value={expenseTitle}
                                onChange={(e) => setExpenseTitle(e.target.value)}
                                placeholder={`Contoh: Belanja Keperluan (${goal.title})`}
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:border-rose-500 focus:outline-hidden"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Kategori Belanja
                              </label>
                              <select
                                value={expenseCategory}
                                onChange={(e) => setExpenseCategory(e.target.value)}
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:border-rose-500 focus:outline-hidden"
                              >
                                {categories.length > 0 ? (
                                  categories.map(c => (
                                    <option key={c.id} value={c.name}>{c.name}</option>
                                  ))
                                ) : (
                                  <>
                                    <option value="Belanja">Belanja</option>
                                    <option value="Makanan & Minuman">Makanan & Minuman</option>
                                    <option value="Hiburan">Hiburan</option>
                                    <option value="Tagihan & Utilitas">Tagihan & Utilitas</option>
                                    <option value="Elektronik">Elektronik</option>
                                    <option value="Lain-lain">Lain-lain</option>
                                  </>
                                )}
                              </select>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              Transaksi akan langsung dicatat sebagai pengeluaran belanja menggunakan dana tabungan.
                            </p>
                          </div>
                        )}

                        {/* Nominal Input */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Nominal Tarik (Rp)
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={adjustAmount}
                            onChange={(e) => setAdjustAmount(formatThousand(e.target.value))}
                            placeholder={`Maksimal ${formatIDR(goal.currentAmount)}`}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 font-mono font-bold placeholder:font-normal placeholder:text-slate-400 focus:border-rose-500 focus:outline-hidden"
                            autoFocus
                          />
                        </div>

                        {/* Action buttons */}
                        <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={() => {
                              setAdjustAmount('');
                              setErrorMsg('');
                              setShowWithdrawModal(null);
                            }}
                            className="px-4 py-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 text-xs font-bold transition cursor-pointer"
                          >
                            Batal
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                          >
                            <ArrowDownRight className="w-4 h-4" />
                            Konfirmasi Tarik
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

            </div>
          );
        })}
      </div>
      )}

      {/* HISTORI TRANSAKSI TABUNGAN (PEMASUKAN & PENARIKAN TABUNGAN) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl border border-emerald-500/20">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-slate-900 text-base">
                Histori Setor & Penarikan Tabungan
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Catatan riwayat mutasi dana masuk (Setor) dan keluar (Tarik / Belanja) dari tabungan
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full shrink-0 self-start sm:self-auto">
            {filteredSavingsTxs.length} Transaksi Tabungan
          </span>
        </div>

        {/* Summary Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-emerald-50/70 border border-emerald-200/60 rounded-xl">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
              TOTAL SETOR TABUNGAN (+)
            </span>
            <span className="text-sm sm:text-base font-extrabold text-emerald-700 font-mono mt-0.5 block">
              +{formatIDR(totalDepositAmount)}
            </span>
          </div>

          <div className="p-3 bg-rose-50/70 border border-rose-200/60 rounded-xl">
            <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">
              TOTAL DITARIK / BELANJA (-)
            </span>
            <span className="text-sm sm:text-base font-extrabold text-rose-700 font-mono mt-0.5 block">
              -{formatIDR(totalWithdrawAmount)}
            </span>
          </div>

          <div className="p-3 bg-indigo-50/70 border border-indigo-200/60 rounded-xl">
            <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider block">
              MUTASI TABUNGAN NET
            </span>
            <span className={`text-sm sm:text-base font-extrabold font-mono mt-0.5 block ${totalDepositAmount - totalWithdrawAmount >= 0 ? 'text-indigo-700' : 'text-rose-600'}`}>
              {totalDepositAmount - totalWithdrawAmount >= 0 ? '+' : ''}{formatIDR(totalDepositAmount - totalWithdrawAmount)}
            </span>
          </div>
        </div>

        {/* FILTER CONTROLS BAR FOR SAVINGS HISTORY - Styled like requested image */}
        <div className="bg-[#0f141f] border border-[#1f283a] rounded-2xl p-3 sm:p-3.5 shadow-md space-y-2.5">
          {/* Row 1: Search */}
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              placeholder="Cari transaksi tabungan..."
              className="w-full bg-[#182030] border border-[#26334a] rounded-xl pl-10 pr-9 py-2.5 text-sm font-medium text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/80 transition"
            />
            {historySearch && (
              <button
                type="button"
                onClick={() => setHistorySearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Row 2: Filters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Type Filter */}
            <div className="relative w-full">
              <select
                value={historyTypeFilter}
                onChange={(e) => setHistoryTypeFilter(e.target.value as any)}
                className="w-full appearance-none bg-[#182030] hover:bg-[#202b40] border border-[#26334a] rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-200 focus:outline-none transition cursor-pointer pr-9"
              >
                <option value="all" className="bg-[#0f141f]">Semua Jenis (Setor & Tarik)</option>
                <option value="deposit" className="bg-[#0f141f]">Pemasukan (Setor Tabungan)</option>
                <option value="withdraw" className="bg-[#0f141f]">Penarikan / Belanja Tabungan</option>
              </select>
              <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Goal Target Filter */}
            <div className="relative w-full">
              <select
                value={historyGoalFilter}
                onChange={(e) => setHistoryGoalFilter(e.target.value)}
                className="w-full appearance-none bg-[#182030] hover:bg-[#202b40] border border-[#26334a] rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-200 focus:outline-none transition cursor-pointer pr-9"
              >
                <option value="all" className="bg-[#0f141f]">Semua Sasaran Tabungan</option>
                {savingGoals.map(g => (
                  <option key={g.id} value={g.id} className="bg-[#0f141f]">{g.title}</option>
                ))}
              </select>
              <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Date Filter */}
            <div className="relative w-full">
              <select
                value={historyDateFilter}
                onChange={(e) => setHistoryDateFilter(e.target.value as any)}
                className="w-full appearance-none bg-[#182030] hover:bg-[#202b40] border border-[#26334a] rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-200 focus:outline-none transition cursor-pointer pr-9"
              >
                <option value="all" className="bg-[#0f141f]">Semua Tanggal</option>
                <option value="this_month" className="bg-[#0f141f]">Bulan Ini</option>
                <option value="last_30_days" className="bg-[#0f141f]">30 Hari Terakhir</option>
              </select>
              <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* TRANSACTION LIST */}
        {filteredSavingsTxs.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs flex flex-col items-center justify-center">
            <Info className="w-8 h-8 text-slate-300 mb-2" />
            <span>Tidak ada histori transaksi tabungan yang sesuai dengan filter.</span>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto pr-1">
            {filteredSavingsTxs.map(tx => {
              const isDeposit = tx.title.toLowerCase().includes('setor tabungan') || (tx.note && tx.note.toLowerCase().includes('alokasi dana ke goal'));
              
              let goalName = 'Tabungan';
              if (tx.relatedSavingGoalId) {
                const matchedGoal = savingGoals.find(g => g.id === tx.relatedSavingGoalId);
                if (matchedGoal) goalName = matchedGoal.title;
              } else {
                const colonSplit = tx.title.split(':');
                if (colonSplit.length > 1) {
                  goalName = colonSplit[1].trim();
                }
              }

              return (
                <div
                  key={tx.id}
                  onClick={() => onSelectTransaction && onSelectTransaction(tx)}
                  className="py-3 px-2 flex items-center justify-between group hover:bg-slate-50 rounded-xl transition cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
                      isDeposit 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                        : 'bg-rose-50 text-rose-600 border-rose-200'
                    }`}>
                      {isDeposit ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-800 truncate group-hover:text-emerald-700 transition-colors">
                          {tx.title}
                        </span>
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                          🎯 {goalName}
                        </span>
                        {tx.paymentSource && (
                          <span className="text-[9px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                            {tx.paymentSource}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                        {tx.date} {tx.note ? `• ${tx.note}` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-2">
                    <span className={`text-xs sm:text-sm font-bold font-mono ${
                      isDeposit ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {isDeposit ? '+' : '-'}{formatIDR(tx.amount)}
                    </span>

                    {onDeleteTransaction && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTxToDelete(tx);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Hapus Catatan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Advisory Card */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 flex items-start gap-4">
        <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl shrink-0">
          <TrendingUp className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h4 className="font-semibold text-slate-800 text-xs sm:text-sm">Strategi Tabungan Sehat</h4>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl leading-relaxed">
            Menyisihkan minimal 20% dari total pemasukan di awal bulan terbukti secara signifikan mempercepat penyelesaian target tabungan sebesar 3.5x lebih cepat daripada menabung sisa pengeluaran di akhir bulan.
          </p>
        </div>
      </div>

      {/* Confirmation Modal for Goal Deletion */}
      <AnimatePresence>
        {goalToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setGoalToDelete(null)}
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
              
              <h3 className="font-display font-bold text-slate-800 text-base mb-1">Hapus Sasaran Tabungan?</h3>
              <p className="text-slate-500 text-xs leading-relaxed mb-4">
                Apakah Anda yakin ingin menghapus sasaran tabungan <strong className="text-slate-800 font-semibold">"{goalToDelete.title}"</strong>?
              </p>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-left mb-5 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Terkumpul:</span>
                  <span className="font-semibold font-mono text-emerald-600">{formatIDR(goalToDelete.currentAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Target:</span>
                  <span className="font-semibold font-mono text-slate-800">{formatIDR(goalToDelete.targetAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tenggat:</span>
                  <span className="font-semibold text-slate-700">{goalToDelete.deadline}</span>
                </div>
              </div>
              
              <div className="flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => setGoalToDelete(null)}
                  className="flex-1 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteGoal(goalToDelete.id);
                    setGoalToDelete(null);
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
              
              <h3 className="font-display font-bold text-slate-800 text-base mb-1">Hapus Riwayat Transaksi?</h3>
              <p className="text-slate-500 text-xs leading-relaxed mb-4">
                Apakah Anda yakin ingin menghapus catatan transaksi <strong className="text-slate-800 font-semibold">"{txToDelete.title}"</strong>?
              </p>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-left mb-5 space-y-1 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Nominal:</span>
                  <span className="font-semibold text-slate-800">{formatIDR(txToDelete.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Tanggal:</span>
                  <span className="text-slate-700">{txToDelete.date}</span>
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
                    if (onDeleteTransaction) {
                      onDeleteTransaction(txToDelete.id);
                    }
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

    </div>
  );
}
