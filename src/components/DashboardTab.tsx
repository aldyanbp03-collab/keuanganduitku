/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PlusCircle, 
  MinusCircle, 
  Wallet, 
  CreditCard as CardIcon, 
  PiggyBank, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  ChevronRight,
  TrendingUp,
  Receipt,
  Sparkles,
  Zap,
  Info
} from 'lucide-react';
import { Transaction, SavingGoal, CreditCard, Category } from '../types';

interface DashboardTabProps {
  transactions: Transaction[];
  savingGoals: SavingGoal[];
  creditCards: CreditCard[];
  categories: Category[];
  profileName: string;
  onOpenIncomeForm: () => void;
  onOpenExpenseForm: () => void;
  onSelectTransaction?: (tx: Transaction) => void;
}

export default function DashboardTab({
  transactions,
  savingGoals,
  creditCards,
  categories,
  profileName,
  onOpenIncomeForm,
  onOpenExpenseForm,
  onSelectTransaction
}: DashboardTabProps) {
  // Calculate stats
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  // Total Saldo (hanya menghitung transaksi Tunai / Cash)
  const cashIncome = transactions
    .filter(t => t.type === 'income' && t.paymentSource === 'Cash')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const cashExpense = transactions
    .filter(t => t.type === 'expense' && t.paymentSource === 'Cash')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalBalance = cashIncome - cashExpense;

  // Calculate savings progress
  const totalTargetSavings = savingGoals.reduce((acc, g) => acc + g.targetAmount, 0);
  const totalCurrentSavings = savingGoals.reduce((acc, g) => acc + g.currentAmount, 0);
  const savingsPercentage = totalTargetSavings > 0 ? (totalCurrentSavings / totalTargetSavings) * 100 : 0;

  // Calculate credit card stats
  const totalLimit = creditCards.reduce((acc, c) => acc + c.limitAmount, 0);
  const totalUsed = creditCards.reduce((acc, c) => acc + c.usedAmount, 0);
  const creditCardLimitRemaining = totalLimit - totalUsed;

  // Calculate dynamic 4th metric: Total Pengeluaran Diambil Dari Uang Tabungan & Penghasilan
  // It is the sum of expenses paid with Cash/Debit + transfers to Savings Goals
  const expensesFromIncome = transactions
    .filter(t => t.type === 'expense' && (t.paymentSource === 'Cash' || t.paymentSource === 'Debit'))
    .reduce((acc, curr) => acc + curr.amount, 0);

  const expensesToSavings = transactions
    .filter(t => t.type === 'expense' && t.relatedSavingGoalId)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpenseTabunganPenghasilan = expensesFromIncome + expensesToSavings;

  // Group transactions by category for expense analysis
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  const expenseByCategory = expenseTransactions.reduce((acc: { [key: string]: number }, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {});

  const totalExpenseComputed = Object.values(expenseByCategory).reduce((a, b) => a + b, 0);

  // Sorted list of categories by spending amount
  const sortedExpenses = Object.entries(expenseByCategory)
    .map(([categoryName, amount]) => {
      const categoryObj = categories.find(c => c.name === categoryName);
      return {
        name: categoryName,
        amount,
        percentage: totalExpenseComputed > 0 ? (amount / totalExpenseComputed) * 100 : 0,
        color: categoryObj?.color || 'bg-slate-500'
      };
    })
    .sort((a, b) => b.amount - a.amount);

  // Dynamic weekly cashflow calculation
  const weeklyStats = [
    { name: 'Minggu 1', income: 0, expense: 0 },
    { name: 'Minggu 2', income: 0, expense: 0 },
    { name: 'Minggu 3', income: 0, expense: 0 },
    { name: 'Minggu 4', income: 0, expense: 0 },
  ];

  transactions.forEach(t => {
    if (!t.date) return;
    const day = parseInt(t.date.split('-')[2]) || 1;
    let weekIndex = 0;
    if (day <= 7) weekIndex = 0;
    else if (day <= 14) weekIndex = 1;
    else if (day <= 21) weekIndex = 2;
    else weekIndex = 3;

    if (t.type === 'income') {
      weeklyStats[weekIndex].income += t.amount;
    } else {
      weeklyStats[weekIndex].expense += t.amount;
    }
  });

  const maxWeeklyVal = Math.max(
    ...weeklyStats.map(w => Math.max(w.income, w.expense)),
    1000000 // default max scale of 1Jt to keep a nice layout
  );

  const formatCompactIDR = (num: number) => {
    if (num >= 1000000) {
      return `Rp ${(num / 1000000).toFixed(num % 1000000 === 0 ? 0 : 1)}Jt`;
    }
    if (num >= 1000) {
      return `Rp ${(num / 1000).toFixed(0)}Rb`;
    }
    return `Rp ${num}`;
  };

  // Format Rupiah
  const formatIDR = (num: number) => {
    return 'Rp ' + num.toLocaleString('id-ID');
  };

  // Quick Stats cards data (highly minimized, added 4th metric)
  const statsCards = [
    {
      id: 'saldo',
      title: 'Total Saldo',
      value: formatIDR(totalBalance),
      icon: <Wallet className="w-4 h-4 text-emerald-600" />,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      desc: 'Dompet Tunai (Khusus Cash)'
    },
    {
      id: 'tabungan',
      title: 'Terkumpul di Tabungan',
      value: formatIDR(totalCurrentSavings),
      icon: <PiggyBank className="w-4 h-4 text-indigo-600" />,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-100',
      desc: `Kemajuan: ${Math.round(savingsPercentage)}%`
    },
    {
      id: 'kk',
      title: 'Limit Kartu Kredit',
      value: formatIDR(creditCardLimitRemaining),
      icon: <CardIcon className="w-4 h-4 text-slate-700" />,
      color: 'bg-slate-100 text-slate-800 border-slate-200/50',
      desc: `Terpakai: ${formatIDR(totalUsed)}`
    },
    {
      id: 'pengeluaran-utama',
      title: 'Pengeluaran Tabungan/Gaji',
      value: formatIDR(totalExpenseTabunganPenghasilan),
      icon: <Receipt className="w-4 h-4 text-rose-600" />,
      color: 'bg-rose-50 text-rose-700 border-rose-100',
      desc: 'Tunai, Debit & Transfer Tabungan'
    }
  ];

  return (
    <div className="space-y-5">
      
      {/* Welcome Banner - Highly Minimized & Elegant */}
      <div className="bg-gradient-to-r from-slate-900 to-emerald-950 rounded-2xl p-4 sm:p-5 text-white border border-emerald-900/40 relative overflow-hidden shadow-xs">
        <div className="absolute right-0 top-0 w-80 h-full bg-emerald-500/5 rounded-full filter blur-3xl -z-0" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Real-Time Tracker</span>
            </div>
            <h2 className="text-lg sm:text-xl font-display font-bold">
              Halo, {profileName}! 👋
            </h2>
            <p className="text-slate-300 text-xs mt-0.5 max-w-xl">
              Keuangan Anda bulan ini terpantau <span className="text-emerald-400 font-bold">Sangat Sehat</span>. Sisa saldo aman terkendali.
            </p>
          </div>
          
          {/* Main Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenIncomeForm}
              className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-650 text-slate-950 font-bold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Pemasukan
            </button>
            <button
              onClick={onOpenExpenseForm}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 rounded-xl transition flex items-center gap-1 cursor-pointer"
            >
              <MinusCircle className="w-3.5 h-3.5 text-emerald-400" /> Pengeluaran
            </button>
          </div>
        </div>
      </div>

      {/* Stats Widgets - Clean, Minimalist 2x2 grid on mobile, 4 columns on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {statsCards.map((card) => (
          <div 
            key={card.id} 
            className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] sm:text-xs font-semibold text-slate-500 truncate" title={card.title}>{card.title}</span>
              <div className={`p-1.5 rounded-lg border shrink-0 ${card.color}`}>
                {card.icon}
              </div>
            </div>
            <div className="mt-2.5">
              <h3 className="text-sm sm:text-base md:text-lg font-display font-extrabold text-slate-900 tracking-tight font-mono truncate">
                {card.value}
              </h3>
              <p className="text-[9px] text-slate-400 truncate mt-0.5" title={card.desc}>{card.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 landscape:grid-cols-2 lg:grid-cols-12 gap-5">
        
        {/* Weekly Cashflow Chart */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs landscape:col-span-1 lg:col-span-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold text-slate-800 text-sm">Aliran Arus Kas Bulanan</h3>
              <p className="text-[11px] text-slate-500">Perbandingan antara seluruh pemasukan dan pengeluaran.</p>
            </div>
            <div className="flex items-center gap-3.5 text-xs font-semibold">
              <div className="flex items-center gap-1 text-emerald-600">
                <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block" />
                <span>Masuk</span>
              </div>
              <div className="flex items-center gap-1 text-rose-500">
                <span className="w-2 h-2 bg-rose-500 rounded-full inline-block" />
                <span>Keluar</span>
              </div>
            </div>
          </div>

          {/* Graphical Cashflow Bars */}
          <div className="flex gap-2 h-56 mt-2 relative">
            {/* Y-Axis Labels Column */}
            <div className="flex flex-col justify-between text-[9px] text-slate-450 font-mono text-right w-10 pb-5 select-none shrink-0">
              <span>{formatCompactIDR(maxWeeklyVal)}</span>
              <span>{formatCompactIDR(maxWeeklyVal * 0.66)}</span>
              <span>{formatCompactIDR(maxWeeklyVal * 0.33)}</span>
              <span>0</span>
            </div>

            {/* Grid Container */}
            <div className="relative flex-1 h-full pb-5">
              {/* Background horizontal grid lines */}
              <div className="absolute inset-x-0 top-0 bottom-5 flex flex-col justify-between pointer-events-none">
                <div className="border-b border-slate-100 w-full h-0" />
                <div className="border-b border-slate-100 w-full h-0" />
                <div className="border-b border-slate-100 w-full h-0" />
                <div className="border-b border-slate-200/80 w-full h-0" />
              </div>

              {/* Bars container */}
              <div className="relative z-10 h-full flex items-end justify-around px-1 sm:px-3">
                {weeklyStats.map((week, idx) => {
                  const incHeight = maxWeeklyVal > 0 ? (week.income / maxWeeklyVal) * 85 : 0;
                  const expHeight = maxWeeklyVal > 0 ? (week.expense / maxWeeklyVal) * 85 : 0;
                  return (
                    <div key={idx} className="flex flex-col items-center gap-1.5 group w-12 h-full justify-end">
                      <div className="flex items-end gap-1 h-[85%] pb-0.5">
                        <div 
                          className="w-2.5 bg-emerald-500/85 hover:bg-emerald-500 rounded-t-sm transition-all duration-300 relative group cursor-pointer shadow-2xs"
                          style={{ height: `${Math.max(week.income > 0 ? 4 : 0, incHeight)}%` }}
                        >
                          <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] font-mono px-1.5 py-0.5 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-20 shadow-xs">
                            {formatIDR(week.income)}
                          </span>
                        </div>
                        <div 
                          className="w-2.5 bg-rose-500/85 hover:bg-rose-500 rounded-t-sm transition-all duration-300 relative group cursor-pointer shadow-2xs"
                          style={{ height: `${Math.max(week.expense > 0 ? 4 : 0, expHeight)}%` }}
                        >
                          <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] font-mono px-1.5 py-0.5 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-20 shadow-xs">
                            {formatIDR(week.expense)}
                          </span>
                        </div>
                      </div>
                      <span className="text-[9px] font-semibold text-slate-400">{week.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-3 text-center">
            <div className="bg-slate-50/70 rounded-lg p-2">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Pemasukan</span>
              <span className="text-xs sm:text-sm font-bold text-emerald-650 font-mono flex items-center justify-center gap-1 mt-0.5">
                <ArrowUpRight className="w-3.5 h-3.5 shrink-0" /> {formatIDR(totalIncome)}
              </span>
            </div>
            <div className="bg-slate-50/70 rounded-lg p-2">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Pengeluaran</span>
              <span className="text-xs sm:text-sm font-bold text-rose-500 font-mono flex items-center justify-center gap-1 mt-0.5">
                <ArrowDownRight className="w-3.5 h-3.5 shrink-0" /> {formatIDR(totalExpense)}
              </span>
            </div>
          </div>
        </div>

        {/* Expenses Category Breakdown */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs landscape:col-span-1 lg:col-span-4 flex flex-col justify-between">
          <div>
            <h3 className="font-display font-bold text-slate-800 text-sm mb-1">Distribusi Pengeluaran</h3>
            <p className="text-[11px] text-slate-500 mb-4">Pengeluaran berdasarkan kategori terbesar bulan ini.</p>
            
            {sortedExpenses.length === 0 ? (
              <div className="text-center py-12 flex flex-col items-center text-slate-400">
                <Receipt className="w-8 h-8 stroke-1 mb-2" />
                <span className="text-xs">Belum ada pengeluaran tercatat</span>
              </div>
            ) : (
              <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                {sortedExpenses.map((expense) => (
                  <div key={expense.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${expense.color}`} />
                        <span className="font-medium text-slate-700">{expense.name}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-900">{formatIDR(expense.amount)}</span>
                    </div>
                    <div className="relative w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${expense.color}`}
                        style={{ width: `${expense.percentage}%` }}
                      />
                    </div>
                    <div className="text-right text-[10px] text-slate-400">
                      {Math.round(expense.percentage)}% dari anggaran belanja
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 bg-emerald-500/5 rounded-xl p-3 border border-emerald-500/10 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-[10px] leading-relaxed text-slate-600">
              <strong>Saran Finansial AI:</strong> Pengeluaran terbesar Anda ada di <strong>{sortedExpenses[0]?.name || 'Belanja'}</strong>. Pertimbangkan mengalokasikan Rp 250.000 lebih banyak ke tabungan minggu depan.
            </p>
          </div>
        </div>

      </div>

      {/* Saving and Recent Activities */}
      <div className="grid grid-cols-1 landscape:grid-cols-2 lg:grid-cols-12 gap-6">
        
        {/* Recent Transactions List */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs landscape:col-span-1 lg:col-span-7">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold text-slate-800 text-sm">Aktivitas Transaksi Terbaru</h3>
              <p className="text-[11px] text-slate-500">Catatan transaksi keuangan Anda baru-baru ini.</p>
            </div>
            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase bg-slate-100 px-2.5 py-1 rounded-full">
              <Clock className="w-3 h-3 text-slate-500" /> Real-Time
            </span>
          </div>

          <div className="space-y-3">
            {transactions.slice(0, 4).map((tx) => {
              const categoryObj = categories.find(c => c.name === tx.category);
              return (
                <div 
                  key={tx.id} 
                  onClick={() => onSelectTransaction?.(tx)}
                  className="flex items-center justify-between p-3 bg-slate-50/60 border border-slate-100 rounded-xl hover:border-emerald-300 hover:bg-emerald-50/20 transition-all group cursor-pointer active:scale-[0.98]"
                  title="Klik untuk detail transaksi"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-xl text-white shadow-2xs shrink-0 ${categoryObj?.color || 'bg-slate-500'}`}>
                      {tx.type === 'income' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-slate-800 text-xs sm:text-sm truncate group-hover:text-emerald-700 transition-colors">{tx.title}</h4>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{tx.category}</span>
                        <span className="w-1 h-1 bg-slate-355 rounded-full inline-block" />
                        <span className="text-[9px] font-mono text-slate-450">{tx.date}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-xs sm:text-sm font-bold font-mono ${tx.type === 'income' ? 'text-emerald-600' : 'text-slate-850'}`}>
                      {tx.type === 'income' ? '+' : '-'} {formatIDR(tx.amount)}
                    </span>
                    <span className="text-[9px] block text-slate-450 mt-0.5 font-mono">{tx.paymentSource === 'Cash' || tx.paymentSource === 'Debit' ? tx.paymentSource : 'Kartu Kredit'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Savings progress overview */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs landscape:col-span-1 lg:col-span-5 flex flex-col justify-between">
          <div>
            <h3 className="font-display font-bold text-slate-800 text-sm mb-1">Status Target Tabungan</h3>
            <p className="text-[11px] text-slate-500 mb-4">Kemajuan akumulasi tabungan masa depan Anda.</p>

            <div className="space-y-4">
              {savingGoals.length === 0 ? (
                <div className="text-center py-8 px-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <p className="text-xs text-slate-400 font-medium">Belum ada target tabungan aktif.</p>
                  <p className="text-[10px] text-slate-400 mt-1">Tambahkan target baru di tab Tabungan.</p>
                </div>
              ) : (
                savingGoals.slice(0, 3).map((goal) => {
                  const goalPercentage = (goal.currentAmount / goal.targetAmount) * 100;
                  return (
                    <div key={goal.id} className="p-3 bg-slate-50/60 border border-slate-100 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">{goal.title}</span>
                        <span className="font-bold text-emerald-600">{Math.round(goalPercentage)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-full rounded-full" 
                          style={{ width: `${goalPercentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                        <span>{formatIDR(goal.currentAmount)}</span>
                        <span>Target: {formatIDR(goal.targetAmount)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {savingGoals.length > 0 ? (
            <div className="mt-5 bg-gradient-to-br from-indigo-900 to-indigo-950 text-white rounded-xl p-4 flex items-center justify-between shadow-md border border-indigo-950">
              <div>
                <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider block">Sasaran Impian Terdekat</span>
                <h4 className="font-display font-bold text-sm mt-1">{savingGoals[0]?.title}</h4>
                <p className="text-[11px] text-indigo-200 mt-0.5">Butuh {formatIDR(Math.max(0, (savingGoals[0]?.targetAmount || 0) - (savingGoals[0]?.currentAmount || 0)))} lagi sebelum {savingGoals[0]?.deadline || 'Agustus 2026'}.</p>
              </div>
              <div className="p-2.5 bg-white/10 text-indigo-200 rounded-xl border border-white/10">
                <TrendingUp className="w-5 h-5 animate-bounce" />
              </div>
            </div>
          ) : (
            <div className="mt-5 bg-slate-50 border border-slate-200/60 rounded-xl p-4 flex items-center justify-between text-slate-500">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Sasaran Impian Terdekat</span>
                <p className="text-[11px] text-slate-400 mt-1">Belum ada target tabungan yang dikonfigurasi.</p>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
