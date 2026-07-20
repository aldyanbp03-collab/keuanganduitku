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

export const DEFAULT_SAVING_GOALS: SavingGoal[] = [];

export const DEFAULT_CREDIT_CARDS: CreditCard[] = [];

export const DEFAULT_FAMILY_MEMBERS: FamilyMember[] = [];

export const DEFAULT_TRANSACTIONS: Transaction[] = [];

export const DEFAULT_NOTIFICATIONS: NotificationItem[] = [];

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'id',
  currency: 'IDR',
  pushNotifications: true,
  budgetWarningLimit: 80,
  darkMode: false
};
