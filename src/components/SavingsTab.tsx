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
  Sparkles
} from 'lucide-react';
import { SavingGoal } from '../types';

interface SavingsTabProps {
  savingGoals: SavingGoal[];
  onAddGoal: (goal: Omit<SavingGoal, 'id' | 'status'>) => void;
  onDeleteGoal: (id: string) => void;
  onAdjustSavings: (id: string, amount: number, type: 'deposit' | 'withdraw') => void;
}

export default function SavingsTab({
  savingGoals,
  onAddGoal,
  onDeleteGoal,
  onAdjustSavings
}: SavingsTabProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState<string | null>(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState<string | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<SavingGoal | null>(null);

  // Form states for new goal
  const [newTitle, setNewTitle] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newDeadline, setNewDeadline] = useState('');

  // Form states for deposit/withdraw
  const [adjustAmount, setAdjustAmount] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

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

    onAdjustSavings(goal.id, amountVal, 'withdraw');
    setAdjustAmount('');
    setErrorMsg('');
    setShowWithdrawModal(null);
  };

  const formatIDR = (num: number) => {
    return 'Rp ' + num.toLocaleString('id-ID');
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

      {/* Grid List of Saving Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
        {savingGoals.map((goal) => {
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

              {/* Withdraw Modal Pop-over */}
              <AnimatePresence>
                {showWithdrawModal === goal.id && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute inset-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl p-5 flex flex-col justify-between z-10"
                  >
                    <form onSubmit={(e) => handleWithdrawSubmit(e, goal)} className="space-y-3 flex flex-col justify-between h-full">
                      <div>
                        <h4 className="font-display font-bold text-slate-800 dark:text-slate-100 text-sm">Tarik Dana Tabungan</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Tarik dana dari {goal.title} kembali ke Saldo Tunai.</p>
                        
                        {errorMsg && (
                          <div className="p-2 bg-red-50 border border-red-100 text-red-600 dark:bg-red-950/40 dark:border-red-900/60 dark:text-red-300 text-[10px] rounded-lg mt-2">
                            {errorMsg}
                          </div>
                        )}

                        <div className="mt-3">
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Nominal Tarik (Rp)</label>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={adjustAmount}
                            onChange={(e) => setAdjustAmount(formatThousand(e.target.value))}
                            placeholder={`Maksimal ${formatIDR(goal.currentAmount)}`}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-hidden font-mono"
                            autoFocus
                          />
                          <div className="mt-2 text-[10px] font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></span>
                            Otomatis menambah Saldo Tunai (Cash)
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => {
                            setAdjustAmount('');
                            setErrorMsg('');
                            setShowWithdrawModal(null);
                          }}
                          className="px-3 py-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 text-xs font-bold transition"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-lg transition shadow-xs"
                        >
                          Konfirmasi Tarik
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          );
        })}
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

    </div>
  );
}
