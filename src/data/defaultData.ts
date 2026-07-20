/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Category, SavingGoal, CreditCard, FamilyMember, Transaction, NotificationItem, AppSettings } from '../types';

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
  {
    id: 'goal-1',
    title: 'Dana Darurat 6 Bulan',
    targetAmount: 24000000,
    currentAmount: 0,
    deadline: '2026-12-31',
    status: 'active'
  },
  {
    id: 'goal-2',
    title: 'Liburan Keluarga Bali',
    targetAmount: 12000000,
    currentAmount: 0,
    deadline: '2026-08-15',
    status: 'active'
  },
  {
    id: 'goal-3',
    title: 'Beli Laptop Rian',
    targetAmount: 8500000,
    currentAmount: 0,
    deadline: '2026-10-01',
    status: 'active'
  }
];

export const DEFAULT_CREDIT_CARDS: CreditCard[] = [
  {
    id: 'card-1',
    cardName: 'BCA Everyday Card',
    lastFourDigits: '8821',
    limitAmount: 15000000,
    usedAmount: 0,
    dueDate: 'Tiap Tanggal 10',
    color: 'from-blue-600 to-indigo-800'
  },
  {
    id: 'card-2',
    cardName: 'Mandiri Signature',
    lastFourDigits: '4490',
    limitAmount: 40000000,
    usedAmount: 0,
    dueDate: 'Tiap Tanggal 25',
    color: 'from-slate-800 to-slate-950'
  }
];

export const DEFAULT_FAMILY_MEMBERS: FamilyMember[] = [
  {
    id: 'fam-1',
    name: 'Budi (Ayah)',
    role: 'Orang Tua',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    monthlySpent: 0
  },
  {
    id: 'fam-2',
    name: 'Siti (Ibu)',
    role: 'Orang Tua',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    monthlySpent: 0
  },
  {
    id: 'fam-3',
    name: 'Rian (Anak)',
    role: 'Anak',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    monthlyLimit: 1500000,
    monthlySpent: 0
  }
];

export const DEFAULT_TRANSACTIONS: Transaction[] = [];

export const DEFAULT_NOTIFICATIONS: NotificationItem[] = [];

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'id',
  currency: 'IDR',
  pushNotifications: true,
  budgetWarningLimit: 80
};
