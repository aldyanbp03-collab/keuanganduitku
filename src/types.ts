/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  currency: string;
}

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  note?: string;
  paymentSource: string; // 'Cash', 'Debit', or Card ID / Saving Goal ID
  relatedSavingGoalId?: string; // If transaction is a transfer to/from savings
  relatedCreditCardId?: string; // If transaction is charged to or a payment of a credit card
}

export interface SavingGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  status: 'active' | 'completed';
}

export interface CreditCard {
  id: string;
  cardName: string;
  lastFourDigits: string;
  limitAmount: number;
  usedAmount: number;
  dueDate: string; // e.g., "Tanggal 15" or "2026-08-15"
  color: string; // Tailwind color class for card bg
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  iconName: string; // Lucide icon identifier
  color: string; // hex or tailwind class
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'alert' | 'info' | 'success';
}

export interface AppSettings {
  language: 'id' | 'en';
  currency: string;
  pushNotifications: boolean;
  budgetWarningLimit: number; // e.g., 80 for 80%
  darkMode?: boolean;
}
