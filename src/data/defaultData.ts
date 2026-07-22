/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Category, SavingGoal, CreditCard, Transaction, NotificationItem, AppSettings, DebtRecord } from '../types';

export const DEFAULT_DEBTS: DebtRecord[] = [
  {
    id: 'debt-1',
    personName: 'Budi Santoso',
    type: 'piutang',
    totalAmount: 1500000,
    remainingAmount: 1000000,
    dueDate: '2026-08-15',
    createdDate: new Date().toISOString().split('T')[0],
    note: 'Pinjaman modal usaha pulsa',
    status: 'partially_paid'
  },
  {
    id: 'debt-2',
    personName: 'Koperasi Mandiri',
    type: 'hutang',
    totalAmount: 3000000,
    remainingAmount: 3000000,
    dueDate: '2026-08-30',
    createdDate: new Date().toISOString().split('T')[0],
    note: 'Pinjaman persiapan renovasi dapur',
    status: 'unpaid'
  }
];

export const DEFAULT_CATEGORIES: Category[] = [
  // Income
  { id: 'cat-in-1', name: 'Gaji', type: 'income', iconName: 'Briefcase', color: 'bg-emerald-500' },
  { id: 'cat-in-2', name: 'Bonus & Insentif', type: 'income', iconName: 'Award', color: 'bg-teal-500' },
  { id: 'cat-in-3', name: 'Investasi', type: 'income', iconName: 'TrendingUp', color: 'bg-cyan-500' },
  { id: 'cat-in-4', name: 'Lain-lain', type: 'income', iconName: 'PlusCircle', color: 'bg-slate-500' },
  
  // Expense
  { id: 'cat-ex-1', name: 'Makanan & Minuman', type: 'expense', iconName: 'Utensils', color: 'bg-amber-500' },
  { id: 'cat-ex-2', name: 'Belanja Bulanan', type: 'expense', iconName: 'ShoppingBag', color: 'bg-blue-500' },
  { id: 'cat-ex-3', name: 'Transportasi', type: 'expense', iconName: 'Car', color: 'bg-indigo-500' },
  { id: 'cat-ex-4', name: 'Tagihan & Utilitas', type: 'expense', iconName: 'Receipt', color: 'bg-orange-500' },
  { id: 'cat-ex-5', name: 'Hiburan & Liburan', type: 'expense', iconName: 'Gamepad2', color: 'bg-pink-500' },
  { id: 'cat-ex-6', name: 'Pendidikan', type: 'expense', iconName: 'GraduationCap', color: 'bg-violet-500' },
  { id: 'cat-ex-7', name: 'Kesehatan', type: 'expense', iconName: 'HeartPulse', color: 'bg-red-500' },
  { id: 'cat-ex-8', name: 'Lain-lain', type: 'expense', iconName: 'HelpCircle', color: 'bg-slate-500' }
];

export const DEFAULT_SAVING_GOALS: SavingGoal[] = [
  { id: 'goal-1', title: 'DP Rumah Baru 🏠', targetAmount: 150000000, currentAmount: 25000000, deadline: '2027-12-31', status: 'active' },
  { id: 'goal-2', title: 'Dana Darurat 🎯', targetAmount: 20000000, currentAmount: 5000000, deadline: '2026-12-31', status: 'active' },
  { id: 'goal-3', title: 'Liburan Akhir Tahun ✈', targetAmount: 15000000, currentAmount: 15000000, deadline: '2026-12-15', status: 'completed' }
];

export const DEFAULT_CREDIT_CARDS: CreditCard[] = [
  { id: 'card-1', cardName: 'BCA Everyday Card', lastFourDigits: '4321', limitAmount: 15000000, usedAmount: 2450000, dueDate: 'Tiap Tanggal 15', color: 'from-blue-600 to-indigo-800' },
  { id: 'card-2', cardName: 'Mandiri Signature', lastFourDigits: '8765', limitAmount: 30000000, usedAmount: 1200000, dueDate: 'Tiap Tanggal 20', color: 'from-slate-800 to-slate-950' }
];

export const DEFAULT_TRANSACTIONS: Transaction[] = [
  { id: 'tx-1', title: 'Gaji Bulanan PT ABC', amount: 15000000, type: 'income', category: 'Gaji', date: new Date().toISOString().split('T')[0], note: 'Gaji pokok bulanan', paymentSource: 'Cash' },
  { id: 'tx-2', title: 'Belanja Bulanan Superindo', amount: 1250000, type: 'expense', category: 'Belanja Bulanan', date: new Date().toISOString().split('T')[0], note: 'Kebutuhan pokok dapur', paymentSource: 'Cash' },
  { id: 'tx-3', title: 'Starbucks Coffee', amount: 85000, type: 'expense', category: 'Makanan & Minuman', date: new Date().toISOString().split('T')[0], note: 'Kopi sore santai', paymentSource: 'card-1', relatedCreditCardId: 'card-1' },
  { id: 'tx-4', title: 'Alokasi DP Rumah Baru', amount: 5000000, type: 'expense', category: 'Lain-lain', date: new Date().toISOString().split('T')[0], note: 'Transfer bulanan ke tabungan impian', paymentSource: 'Debit', relatedSavingGoalId: 'goal-1' }
];

export const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  { id: 'notif-1', title: 'Registrasi Berhasil', message: 'Selamat datang di DompetKita! Atur sasaran tabungan dan anggaran bulanan Anda sekarang.', date: new Date().toISOString().split('T')[0], read: false, type: 'success' }
];

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'id',
  currency: 'IDR',
  pushNotifications: true,
  budgetWarningLimit: 80,
  darkMode: false
};
