/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShoppingBag, PiggyBank } from 'lucide-react';
import { Transaction, Category, CreditCard, SavingGoal } from '../types';
import ExpensesTab from './ExpensesTab';
import SavingsTab from './SavingsTab';

interface ExpensesSavingsTabProps {
  // Expenses Props
  transactions: Transaction[];
  categories: Category[];
  creditCards: CreditCard[];
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => void;
  onDeleteTransaction: (id: string) => void;
  onSelectTransaction?: (tx: Transaction) => void;
  monthlyBudget?: number;
  onUpdateMonthlyBudget?: (newBudget: number) => void;

  // Savings Props
  savingGoals: SavingGoal[];
  onAddGoal: (goal: Omit<SavingGoal, 'id' | 'status'>) => void;
  onDeleteGoal: (id: string) => void;
  onAdjustSavings: (id: string, amount: number, type: 'deposit' | 'withdraw') => void;

  initialSubTab?: 'expenses' | 'savings';
}

export default function ExpensesSavingsTab({
  transactions,
  categories,
  creditCards,
  onAddTransaction,
  onDeleteTransaction,
  onSelectTransaction,
  monthlyBudget,
  onUpdateMonthlyBudget,
  savingGoals,
  onAddGoal,
  onDeleteGoal,
  onAdjustSavings,
  initialSubTab = 'expenses'
}: ExpensesSavingsTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'expenses' | 'savings'>(initialSubTab);

  return (
    <div className="space-y-6">
      {/* Sub-Tab Navigation Header (Pill switchers) */}
      <div className="flex bg-slate-900/90 p-1.5 rounded-2xl w-full sm:w-auto self-start border border-slate-800 shadow-md">
        <button
          type="button"
          onClick={() => setActiveSubTab('expenses')}
          className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeSubTab === 'expenses'
              ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Belanja & Pengeluaran</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
            activeSubTab === 'expenses' ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-300'
          }`}>
            {transactions.filter(t => t.type === 'expense').length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('savings')}
          className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeSubTab === 'savings'
              ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <PiggyBank className="w-4 h-4" />
          <span>Sasaran Tabungan</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
            activeSubTab === 'savings' ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-300'
          }`}>
            {savingGoals.length}
          </span>
        </button>
      </div>

      {/* Render Active Sub-Tab */}
      {activeSubTab === 'expenses' ? (
        <ExpensesTab
          transactions={transactions}
          categories={categories}
          creditCards={creditCards}
          savingGoals={savingGoals}
          onAddTransaction={onAddTransaction}
          onDeleteTransaction={onDeleteTransaction}
          onSelectTransaction={onSelectTransaction}
          monthlyBudget={monthlyBudget}
          onUpdateMonthlyBudget={onUpdateMonthlyBudget}
        />
      ) : (
        <SavingsTab
          savingGoals={savingGoals}
          onAddGoal={onAddGoal}
          onDeleteGoal={onDeleteGoal}
          onAdjustSavings={onAdjustSavings}
        />
      )}
    </div>
  );
}
