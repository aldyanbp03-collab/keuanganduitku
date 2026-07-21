/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet, 
  PiggyBank, 
  CreditCard as CardIcon, 
  Users, 
  Settings as SettingsIcon, 
  History, 
  Bell, 
  LogOut, 
  Plus, 
  Minus, 
  X, 
  AlertCircle, 
  Sparkles, 
  Check, 
  ArrowRight, 
  Scan, 
  Receipt,
  FileText, 
  Info,
  Menu
} from 'lucide-react';

import { 
  UserProfile, 
  Transaction, 
  SavingGoal, 
  CreditCard, 
  FamilyMember, 
  Category, 
  NotificationItem, 
  AppSettings 
} from './types';

import { 
  DEFAULT_CATEGORIES, 
  DEFAULT_SAVING_GOALS, 
  DEFAULT_CREDIT_CARDS, 
  DEFAULT_FAMILY_MEMBERS, 
  DEFAULT_TRANSACTIONS, 
  DEFAULT_NOTIFICATIONS, 
  DEFAULT_SETTINGS 
} from './data/defaultData';

// Modular Tab Components
import AuthScreen from './components/AuthScreen';
import DashboardTab from './components/DashboardTab';
import TransactionsTab from './components/TransactionsTab';
import SavingsTab from './components/SavingsTab';
import CardsTab from './components/CardsTab';
import ExpensesTab from './components/ExpensesTab';
import SettingsTab from './components/SettingsTab';
import BarcodeScanner from './components/BarcodeScanner';
import EditTransactionModal from './components/EditTransactionModal';

export default function App() {
  // --- STATE INITIALIZATION & API SYNCING ---
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('dk_token');
  });

  const [user, setUser] = useState<{ name: string; email: string; avatarUrl: string; selectedMemberId: string } | null>(() => {
    const saved = localStorage.getItem('dk_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(DEFAULT_TRANSACTIONS);
  const [savingGoals, setSavingGoals] = useState<SavingGoal[]>(DEFAULT_SAVING_GOALS);
  const [creditCards, setCreditCards] = useState<CreditCard[]>(DEFAULT_CREDIT_CARDS);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>(DEFAULT_FAMILY_MEMBERS);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [notifications, setNotifications] = useState<NotificationItem[]>(DEFAULT_NOTIFICATIONS);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'expenses' | 'savings' | 'cards' | 'transactions' | 'settings'>('dashboard');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Modal / Wizard drawer states
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Post-income Workflow Wizard State
  const [workflowIncomeTx, setWorkflowIncomeTx] = useState<Transaction | null>(null);
  const [workflowStep, setWorkflowStep] = useState<'select' | 'transfer_savings' | 'pay_cc' | 'completed'>('select');
  const [wfSelectedGoalId, setWfSelectedGoalId] = useState('');
  const [wfSelectedCardId, setWfSelectedCardId] = useState('');
  const [wfAmount, setWfAmount] = useState('');
  const [wfError, setWfError] = useState('');

  // Expense form state
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('');
  const [expenseSource, setExpenseSource] = useState('Cash');
  const [expenseNote, setExpenseNote] = useState('');
  const [expenseInputMethod, setExpenseInputMethod] = useState<'manual' | 'receipt'>('manual');

  // Income form state
  const [incomeTitle, setIncomeTitle] = useState('');
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeCategory, setIncomeCategory] = useState('');
  const [incomeSource, setIncomeSource] = useState('Cash');
  const [incomeNote, setIncomeNote] = useState('');

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Synchronize dark mode class on document element
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  // Load all user data from DB when token changes
  useEffect(() => {
    if (!token) return;

    const loadAllData = async () => {
      setIsLoading(true);
      try {
        const headers = { 'Authorization': `Bearer ${token}` };
        
        const handleResponse = async (r: Response) => {
          if (r.status === 401) {
            localStorage.removeItem('dk_token');
            localStorage.removeItem('dk_user');
            setToken(null);
            setUser(null);
            return null;
          }
          if (!r.ok) {
            throw new Error(`HTTP error! status: ${r.status}`);
          }
          return r.json();
        };

        const [
          resTx,
          resGoals,
          resCards,
          resMembers,
          resCats,
          resNotifs,
          resSettings
        ] = await Promise.all([
          fetch('/api/transactions', { headers }).then(handleResponse),
          fetch('/api/saving-goals', { headers }).then(handleResponse),
          fetch('/api/credit-cards', { headers }).then(handleResponse),
          fetch('/api/family-members', { headers }).then(handleResponse),
          fetch('/api/categories', { headers }).then(handleResponse),
          fetch('/api/notifications', { headers }).then(handleResponse),
          fetch('/api/settings', { headers }).then(handleResponse)
        ]);

        if (
          resTx === null ||
          resGoals === null ||
          resCards === null ||
          resMembers === null ||
          resCats === null ||
          resNotifs === null ||
          resSettings === null
        ) {
          return;
        }

        if (Array.isArray(resTx)) setTransactions(resTx);
        if (Array.isArray(resGoals)) setSavingGoals(resGoals);
        if (Array.isArray(resCards)) setCreditCards(resCards);
        if (Array.isArray(resMembers)) setFamilyMembers(resMembers);
        if (Array.isArray(resCats)) setCategories(resCats);
        if (Array.isArray(resNotifs)) setNotifications(resNotifs);
        if (resSettings && !resSettings.error) setSettings(resSettings);
      } catch (err) {
        console.warn('Gagal memuat data dari server atau sesi telah berakhir. Kembali menggunakan setelan lokal.', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadAllData();
  }, [token]);

  // Server sync background helpers
  const syncAddTransaction = async (tx: Transaction) => {
    if (!token) return;
    try {
      await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(tx)
      });
    } catch (e) {
      console.error('Transaction sync error:', e);
    }
  };

  const syncUpdateTransaction = async (tx: Transaction) => {
    if (!token) return;
    try {
      await fetch(`/api/transactions/${tx.id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(tx)
      });
    } catch (e) {
      console.error('Transaction edit sync error:', e);
    }
  };

  const syncDeleteTransaction = async (id: string) => {
    if (!token) return;
    try {
      await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (e) {
      console.error('Transaction deletion sync error:', e);
    }
  };

  const syncSaveGoal = async (goal: SavingGoal) => {
    if (!token) return;
    try {
      await fetch(`/api/saving-goals/${goal.id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(goal)
      });
    } catch (e) {
      console.error('Saving goal sync error:', e);
    }
  };

  const syncAddSavingGoal = async (goal: SavingGoal) => {
    if (!token) return;
    try {
      await fetch('/api/saving-goals', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(goal)
      });
    } catch (e) {
      console.error('Saving goal addition sync error:', e);
    }
  };

  const syncDeleteSavingGoal = async (id: string) => {
    if (!token) return;
    try {
      await fetch(`/api/saving-goals/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (e) {
      console.error('Saving goal delete sync error:', e);
    }
  };

  const syncCreditCard = async (card: CreditCard) => {
    if (!token) return;
    try {
      await fetch(`/api/credit-cards/${card.id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(card)
      });
    } catch (e) {
      console.error('Credit card sync error:', e);
    }
  };

  const syncAddCreditCard = async (card: CreditCard) => {
    if (!token) return;
    try {
      await fetch('/api/credit-cards', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(card)
      });
    } catch (e) {
      console.error('Credit card addition sync error:', e);
    }
  };

  const syncDeleteCreditCard = async (id: string) => {
    if (!token) return;
    try {
      await fetch(`/api/credit-cards/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (e) {
      console.error('Credit card delete sync error:', e);
    }
  };

  const syncFamilyMember = async (member: FamilyMember) => {
    if (!token) return;
    try {
      await fetch(`/api/family-members/${member.id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(member)
      });
    } catch (e) {
      console.error('Family member sync error:', e);
    }
  };

  const syncAddCategory = async (cat: Category) => {
    if (!token) return;
    try {
      await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(cat)
      });
    } catch (e) {
      console.error('Category addition sync error:', e);
    }
  };

  const syncDeleteCategory = async (id: string) => {
    if (!token) return;
    try {
      await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (e) {
      console.error('Category delete sync error:', e);
    }
  };

  const syncAddNotification = async (notif: NotificationItem) => {
    if (!token) return;
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(notif)
      });
    } catch (e) {
      console.error('Notification creation sync error:', e);
    }
  };

  const syncUpdateNotification = async (notif: NotificationItem) => {
    if (!token) return;
    try {
      await fetch(`/api/notifications/${notif.id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(notif)
      });
    } catch (e) {
      console.error('Notification update sync error:', e);
    }
  };

  const syncSettings = async (newSettings: AppSettings) => {
    if (!token) return;
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
    } catch (e) {
      console.error('Settings sync error:', e);
    }
  };

  // Set default form values once categories load
  useEffect(() => {
    if (categories.length > 0) {
      const firstExp = categories.find(c => c.type === 'expense');
      const firstInc = categories.find(c => c.type === 'income');
      if (firstExp) setExpenseCategory(firstExp.name);
      if (firstInc) setIncomeCategory(firstInc.name);
    }
  }, [categories]);

  // --- HANDLERS FOR TRANSACTION WRITING ---

  const handleLogin = (
    loginUser: { name: string; email: string; avatarUrl: string; selectedMemberId: string },
    loginToken: string
  ) => {
    setUser(loginUser);
    setToken(loginToken);
    localStorage.setItem('dk_token', loginToken);
    localStorage.setItem('dk_user', JSON.stringify(loginUser));
    
    // Add success login notification
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'Masuk Berhasil',
      message: `Selamat datang, Anda masuk sebagai ${loginUser.name}.`,
      date: new Date().toISOString().split('T')[0],
      read: false,
      type: 'success'
    };
    setNotifications(prev => [newNotif, ...prev]);
    syncAddNotification(newNotif);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('dk_token');
    localStorage.removeItem('dk_user');
    setActiveTab('dashboard');
  };

  const handleDeleteAccount = async () => {
    if (token) {
      try {
        await fetch('/api/auth/delete-account', {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (err) {
        console.error('Failed to delete account on backend:', err);
      }
    }

    localStorage.removeItem('dk_token');
    localStorage.removeItem('dk_user');

    setUser(null);
    setToken(null);
    setTransactions([]);
    setSavingGoals([]);
    setCreditCards([]);
    setFamilyMembers([]);
    setCategories([]);
    setNotifications([]);
    setSettings(DEFAULT_SETTINGS);
    setActiveTab('dashboard');
  };

  const handleAddTransaction = (newTx: Omit<Transaction, 'id'>) => {
    const txId = `tx-${Date.now()}`;
    const txWithId: Transaction = { ...newTx, id: txId };
    
    setTransactions(prev => [txWithId, ...prev]);
    syncAddTransaction(txWithId);

    // Update family member's spending if it's an expense and associated with a member
    if (newTx.type === 'expense' && newTx.familyMemberId) {
      setFamilyMembers(prev => prev.map(member => {
        if (member.id === newTx.familyMemberId) {
          const updatedSpent = member.monthlySpent + newTx.amount;
          const updatedMember = { ...member, monthlySpent: updatedSpent };
          syncFamilyMember(updatedMember);
          
          // Trigger Budget limits threshold check
          if (member.monthlyLimit && updatedSpent > member.monthlyLimit) {
            triggerNotification(
              'Batas Limit Terlampaui!',
              `Pengeluaran ${member.name} telah melebihi batas bulanan (${formatIDR(updatedSpent)} / ${formatIDR(member.monthlyLimit)}).`,
              'alert'
            );
          } else if (member.monthlyLimit && updatedSpent >= (member.monthlyLimit * (settings.budgetWarningLimit / 100))) {
            triggerNotification(
              'Limit Anggaran Mendekati Batas',
              `Pengeluaran ${member.name} telah mencapai ${settings.budgetWarningLimit}% dari alokasi limit bulanan.`,
              'info'
            );
          }

          return updatedMember;
        }
        return member;
      }));
    }

    // Update credit card utilization if charged to credit card
    if (newTx.type === 'expense' && newTx.relatedCreditCardId) {
      setCreditCards(prev => prev.map(card => {
        if (card.id === newTx.relatedCreditCardId) {
          const updatedUsed = card.usedAmount + newTx.amount;
          const updatedCard = { ...card, usedAmount: updatedUsed };
          syncCreditCard(updatedCard);
          
          if (updatedUsed >= card.limitAmount * 0.9) {
            triggerNotification(
              'Limit Kartu Hampir Habis',
              `Penggunaan kartu ${card.cardName} telah mencapai 90% dari limit kredit utama.`,
              'alert'
            );
          }

          return updatedCard;
        }
        return card;
      }));
    }

    // Return the created transaction for downstream wizard flow
    return txWithId;
  };

  const handleDeleteTransaction = (id: string) => {
    const target = transactions.find(t => t.id === id);
    if (!target) return;

    setTransactions(prev => prev.filter(t => t.id !== id));
    syncDeleteTransaction(id);

    // Reverse spending logic on family members
    if (target.type === 'expense' && target.familyMemberId) {
      setFamilyMembers(prev => prev.map(member => {
        if (member.id === target.familyMemberId) {
          const updatedMember = { ...member, monthlySpent: Math.max(0, member.monthlySpent - target.amount) };
          syncFamilyMember(updatedMember);
          return updatedMember;
        }
        return member;
      }));
    }

    // Reverse card charge if deleted
    if (target.type === 'expense' && target.relatedCreditCardId) {
      setCreditCards(prev => prev.map(card => {
        if (card.id === target.relatedCreditCardId) {
          const updatedCard = { ...card, usedAmount: Math.max(0, card.usedAmount - target.amount) };
          syncCreditCard(updatedCard);
          return updatedCard;
        }
        return card;
      }));
    }

    // Reverse bill payment if deleted
    if (target.type === 'expense' && target.relatedCreditCardId && target.category === 'Tagihan & Utilitas') {
      setCreditCards(prev => prev.map(card => {
        if (card.id === target.relatedCreditCardId) {
          const updatedCard = { ...card, usedAmount: card.usedAmount + target.amount };
          syncCreditCard(updatedCard);
          return updatedCard;
        }
        return card;
      }));
    }
  };

  const handleUpdateTransaction = (updatedTx: Transaction) => {
    const originalTx = transactions.find(t => t.id === updatedTx.id);
    if (!originalTx) return;

    // Update transactions array
    setTransactions(prev => prev.map(t => t.id === updatedTx.id ? updatedTx : t));
    syncUpdateTransaction(updatedTx);

    // Re-adjust family member spent if changed
    if (originalTx.type === 'expense' && originalTx.familyMemberId) {
      setFamilyMembers(prev => prev.map(m => {
        if (m.id === originalTx.familyMemberId) {
          const updatedMember = { ...m, monthlySpent: Math.max(0, m.monthlySpent - originalTx.amount) };
          syncFamilyMember(updatedMember);
          return updatedMember;
        }
        return m;
      }));
    }
    if (updatedTx.type === 'expense' && updatedTx.familyMemberId) {
      setFamilyMembers(prev => prev.map(m => {
        if (m.id === updatedTx.familyMemberId) {
          const updatedMember = { ...m, monthlySpent: m.monthlySpent + updatedTx.amount };
          syncFamilyMember(updatedMember);
          return updatedMember;
        }
        return m;
      }));
    }

    // Re-adjust card usedAmount if changed
    if (originalTx.type === 'expense' && originalTx.relatedCreditCardId) {
      setCreditCards(prev => prev.map(c => {
        if (c.id === originalTx.relatedCreditCardId) {
          const updatedCard = { ...c, usedAmount: Math.max(0, c.usedAmount - originalTx.amount) };
          syncCreditCard(updatedCard);
          return updatedCard;
        }
        return c;
      }));
    }
    if (updatedTx.type === 'expense' && updatedTx.relatedCreditCardId) {
      setCreditCards(prev => prev.map(c => {
        if (c.id === updatedTx.relatedCreditCardId) {
          const updatedCard = { ...c, usedAmount: c.usedAmount + updatedTx.amount };
          syncCreditCard(updatedCard);
          return updatedCard;
        }
        return c;
      }));
    }

    setSelectedTransaction(null);
    triggerNotification(
      'Transaksi Diperbarui',
      `Transaksi "${updatedTx.title}" berhasil diubah dan disimpan.`,
      'success'
    );
  };

  const triggerNotification = (title: string, message: string, type: 'alert' | 'info' | 'success') => {
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title,
      message,
      date: new Date().toISOString().split('T')[0],
      read: false,
      type
    };
    setNotifications(prev => [newNotif, ...prev]);
    syncAddNotification(newNotif);
  };

  // --- SAVINGS ADJUSTMENT ---
  const handleAdjustSavings = (goalId: string, amount: number, type: 'deposit' | 'withdraw') => {
    let goalTitle = '';
    setSavingGoals(prev => prev.map(goal => {
      if (goal.id === goalId) {
        goalTitle = goal.title;
        const updatedAmount = type === 'deposit' 
          ? goal.currentAmount + amount 
          : Math.max(0, goal.currentAmount - amount);
        
        const isCompletedNow = updatedAmount >= goal.targetAmount;
        
        if (isCompletedNow && goal.currentAmount < goal.targetAmount) {
          triggerNotification(
            'Sasaran Tabungan Tercapai! 🎉',
            `Luar biasa! Target tabungan "${goal.title}" sebesar ${formatIDR(goal.targetAmount)} telah terpenuhi 100%.`,
            'success'
          );
        }

        const updatedGoal = { 
          ...goal, 
          currentAmount: updatedAmount,
          status: isCompletedNow ? 'completed' : 'active' as const
        };
        syncSaveGoal(updatedGoal);
        return updatedGoal;
      }
      return goal;
    }));

    // Record dynamic cash transaction to match this event
    handleAddTransaction({
      title: type === 'deposit' ? `Setor Tabungan: ${goalTitle}` : `Tarik Tabungan: ${goalTitle}`,
      amount: amount,
      type: type === 'deposit' ? 'expense' : 'income',
      category: 'Lain-lain',
      date: new Date().toISOString().split('T')[0],
      note: type === 'deposit' ? `Alokasi dana ke goal: ${goalTitle}` : `Tarik saku dari goal: ${goalTitle}`,
      paymentSource: type === 'deposit' ? 'Debit' : 'Cash',
      familyMemberId: user?.selectedMemberId,
      relatedSavingGoalId: goalId
    });
  };

  // --- CREDIT CARD MANAGEMENT ---
  const handlePayCardBill = (cardId: string, amount: number) => {
    let cardTitle = '';
    setCreditCards(prev => prev.map(card => {
      if (card.id === cardId) {
        cardTitle = card.cardName;
        const updatedCard = { ...card, usedAmount: Math.max(0, card.usedAmount - amount) };
        syncCreditCard(updatedCard);
        return updatedCard;
      }
      return card;
    }));

    // Record expense transaction to balance total balance
    handleAddTransaction({
      title: `Bayar Kartu Kredit ${cardTitle}`,
      amount: amount,
      type: 'expense',
      category: 'Tagihan & Utilitas',
      date: new Date().toISOString().split('T')[0],
      note: `Pelunasan tagihan berjalan kartu ${cardTitle}`,
      paymentSource: 'Debit',
      familyMemberId: user?.selectedMemberId,
      relatedCreditCardId: cardId
    });

    triggerNotification(
      'Pembayaran Tagihan Berhasil',
      `Pembayaran kartu ${cardTitle} sebesar ${formatIDR(amount)} berhasil dibukukan.`,
      'success'
    );
  };

  const handleSimulateCharge = (cardId: string, amount: number, title: string, category: string) => {
    // Adds a card charge, directly calls handleAddTransaction which handles state updating
    handleAddTransaction({
      title,
      amount,
      type: 'expense',
      category,
      date: new Date().toISOString().split('T')[0],
      note: `Transaksi kartu kredit`,
      paymentSource: cardId,
      familyMemberId: user?.selectedMemberId,
      relatedCreditCardId: cardId
    });
  };

  // --- SAVE EXPENSE FORM ---
  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(expenseAmount);
    if (!expenseTitle || isNaN(amt) || amt <= 0) return;

    handleAddTransaction({
      title: expenseTitle,
      amount: amt,
      type: 'expense',
      category: expenseCategory,
      date: new Date().toISOString().split('T')[0],
      note: expenseNote,
      paymentSource: expenseSource,
      familyMemberId: user?.selectedMemberId,
      relatedCreditCardId: expenseSource.startsWith('card-') ? expenseSource : undefined
    });

    // Reset Form & Close
    setExpenseTitle('');
    setExpenseAmount('');
    setExpenseNote('');
    setShowExpenseModal(false);
  };

  // --- SAVE INCOME FORM & TRIGGER POST-INCOME WIZARD ---
  const handleSaveIncome = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(incomeAmount);
    if (!incomeTitle || isNaN(amt) || amt <= 0) return;

    const createdTx = handleAddTransaction({
      title: incomeTitle,
      amount: amt,
      type: 'income',
      category: incomeCategory,
      date: new Date().toISOString().split('T')[0],
      note: incomeNote,
      paymentSource: incomeSource,
      familyMemberId: user?.selectedMemberId
    });

    // Reset Form
    setIncomeTitle('');
    setIncomeAmount('');
    setIncomeNote('');
    setShowIncomeModal(false);

    // Prompt user with the workflow selector wizard!
    setWorkflowIncomeTx(createdTx);
    setWorkflowStep('select');
    setWfAmount('');
    setWfSelectedGoalId(savingGoals[0]?.id || '');
    setWfSelectedCardId(creditCards[0]?.id || '');
    setWfError('');
  };

  // --- POST-INCOME WORKFLOW WIZARD ACTIONS ---
  const executeWorkflowTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workflowIncomeTx) return;

    const transferAmt = parseFloat(wfAmount);
    if (isNaN(transferAmt) || transferAmt <= 0) {
      setWfError('Nominal alokasi harus berupa angka positif.');
      return;
    }
    if (transferAmt > workflowIncomeTx.amount) {
      setWfError(`Alokasi melebihi jumlah pemasukan (${formatIDR(workflowIncomeTx.amount)}).`);
      return;
    }

    // Call deposit
    handleAdjustSavings(wfSelectedGoalId, transferAmt, 'deposit');
    setWorkflowStep('completed');
  };

  const executeWorkflowPayCC = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workflowIncomeTx) return;

    const payAmt = parseFloat(wfAmount);
    if (isNaN(payAmt) || payAmt <= 0) {
      setWfError('Nominal pembayaran harus berupa angka positif.');
      return;
    }
    if (payAmt > workflowIncomeTx.amount) {
      setWfError(`Nominal melebihi jumlah pemasukan (${formatIDR(workflowIncomeTx.amount)}).`);
      return;
    }

    const card = creditCards.find(c => c.id === wfSelectedCardId);
    if (card && payAmt > card.usedAmount) {
      setWfError(`Nominal melebihi tagihan terpakai kartu saat ini (${formatIDR(card.usedAmount)}).`);
      return;
    }

    // Call bill payment
    handlePayCardBill(wfSelectedCardId, payAmt);
    setWorkflowStep('completed');
  };

  const handleReceiptScanComplete = (extracted: { title: string; amount: number; category: string; note: string }) => {
    setExpenseTitle(extracted.title);
    setExpenseAmount(extracted.amount.toString());
    setExpenseCategory(extracted.category);
    setExpenseNote(extracted.note);
    setExpenseInputMethod('manual'); // Return to manual form tab once populated!
  };

  const handleInstantSaveExpense = (extracted: { title: string; amount: number; category: string; note: string; paymentSource: string }) => {
    handleAddTransaction({
      title: extracted.title,
      amount: extracted.amount,
      type: 'expense',
      category: extracted.category,
      date: new Date().toISOString().split('T')[0],
      note: extracted.note,
      paymentSource: extracted.paymentSource,
      familyMemberId: user?.selectedMemberId,
      relatedCreditCardId: extracted.paymentSource.startsWith('card-') ? extracted.paymentSource : undefined
    });

    // Reset fields & Close modal
    setExpenseTitle('');
    setExpenseAmount('');
    setExpenseNote('');
    setShowExpenseModal(false);

    // Trigger Notification
    triggerNotification(
      'Pencatatan Instan Berhasil',
      `Pengeluaran "${extracted.title}" sebesar ${formatIDR(extracted.amount)} berhasil dicatat langsung via AI Scan Struk ke database.`,
      'success'
    );
  };

  // Helper formatting currency
  const formatIDR = (num: number) => {
    return 'Rp ' + num.toLocaleString('id-ID');
  };

  // Unread notifications badge
  const unreadCount = notifications.filter(n => !n.read).length;

  if (!user) {
    return <AuthScreen onLoginSuccess={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row font-sans text-slate-800">
      
      {/* LEFT COLUMN: DESKTOP SIDEBAR NAVIGATION */}
      <aside className="hidden md:flex md:w-64 lg:w-72 bg-slate-900 text-white flex-col justify-between border-r border-slate-800/60 p-4 md:p-6 shrink-0 h-screen sticky top-0 z-40 transition-all duration-300">
        
        <div className="space-y-6 md:space-y-8">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 justify-start">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl shadow-md shrink-0">
              <Wallet className="w-5.5 h-5.5" />
            </div>
            <div className="block">
              <span className="font-display font-extrabold text-lg tracking-tight">Dompet<span className="text-emerald-400">Kita</span></span>
              <span className="text-[10px] block text-slate-500 font-semibold tracking-widest uppercase">Keuangan Keluarga</span>
            </div>
          </div>

          {/* User Profile Selector widget */}
          <div className="bg-slate-800/50 border border-slate-850/60 rounded-2xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-10 h-10 rounded-full border border-slate-700 shadow-xs object-cover shrink-0"
              />
              <div className="min-w-0 block">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Pengguna</span>
                <span className="text-sm font-bold text-white truncate block max-w-[120px]" title={user.name}>{user.name}</span>
              </div>
            </div>
            
            {/* Notification Bell Badge */}
            <button
              onClick={() => {
                setShowNotifications(true);
                setNotifications(prev => prev.map(n => {
                  const updated = { ...n, read: true };
                  syncUpdateNotification(updated);
                  return updated;
                }));
              }}
              className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition block shrink-0"
            >
              <Bell className="w-4.5 h-4.5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
              )}
            </button>
          </div>

          {/* Nav Links */}
          <nav className="space-y-1.5">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: <Wallet className="w-4.5 h-4.5 shrink-0" /> },
              { id: 'expenses', label: 'Catat Pengeluaran', icon: <Plus className="w-4.5 h-4.5 shrink-0" /> },
              { id: 'savings', label: 'Sasaran Tabungan', icon: <PiggyBank className="w-4.5 h-4.5 shrink-0" /> },
              { id: 'cards', label: 'Kartu Kredit', icon: <CardIcon className="w-4.5 h-4.5 shrink-0" /> },
              { id: 'transactions', label: 'Riwayat Transaksi', icon: <History className="w-4.5 h-4.5 shrink-0" /> },
              { id: 'settings', label: 'Pengaturan', icon: <SettingsIcon className="w-4.5 h-4.5 shrink-0" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-start gap-3.5 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-850'
                }`}
                title={tab.label}
              >
                {tab.icon}
                <span className="block">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Logout Section */}
        <div className="pt-4 border-t border-slate-800/80">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-start gap-3.5 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold text-rose-400 hover:bg-rose-500/5 hover:text-rose-300 transition-all cursor-pointer"
            title="Keluar Akun"
          >
            <LogOut className="w-4.5 h-4.5 shrink-0" />
            <span className="block">Keluar Akun</span>
          </button>
        </div>

      </aside>

      {/* MOBILE HEADER */}
      <header className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between sticky top-0 z-40 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg">
            <Wallet className="w-5 h-5" />
          </div>
          <span className="font-display font-extrabold text-sm tracking-tight">Dompet<span className="text-emerald-400">Kita</span></span>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Notifications bell */}
          <button
            onClick={() => {
              setShowNotifications(true);
              setNotifications(prev => prev.map(n => {
                const updated = { ...n, read: true };
                syncUpdateNotification(updated);
                return updated;
              }));
            }}
            className="relative p-2 text-slate-400 rounded-xl"
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>
        </div>
      </header>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800/80 flex justify-around items-center h-16 px-1 shadow-2xl pb-safe">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: <Wallet className="w-5.5 h-5.5" /> },
          { id: 'expenses', label: 'Belanja', icon: <Plus className="w-5.5 h-5.5" /> },
          { id: 'savings', label: 'Tabungan', icon: <PiggyBank className="w-5.5 h-5.5" /> },
          { id: 'cards', label: 'Kartu', icon: <CardIcon className="w-5.5 h-5.5" /> },
          { id: 'transactions', label: 'Riwayat', icon: <History className="w-5.5 h-5.5" /> },
          { id: 'settings', label: 'Setelan', icon: <SettingsIcon className="w-5.5 h-5.5" /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex flex-col items-center justify-center flex-1 h-full py-2 transition-all relative ${
              activeTab === tab.id ? 'text-emerald-400 font-bold' : 'text-slate-400'
            }`}
          >
            <div className={`p-1 rounded-lg transition-all duration-300 ${activeTab === tab.id ? 'scale-110 text-emerald-400' : ''}`}>
              {tab.icon}
            </div>
            <span className="text-[9px] mt-0.5 tracking-tight font-medium">{tab.label}</span>
            {activeTab === tab.id && (
              <span className="absolute bottom-0 w-8 h-1 bg-emerald-500 rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 p-4 landscape:p-3 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full pb-20 md:pb-8 landscape:pb-4">
        
        {/* Render Active Tab */}
        {activeTab === 'dashboard' && (
          <DashboardTab
            transactions={transactions}
            savingGoals={savingGoals}
            creditCards={creditCards}
            familyMembers={familyMembers}
            categories={categories}
            activeMemberId={user?.selectedMemberId || ''}
            profileName={user?.name || 'User'}
            onOpenIncomeForm={() => setShowIncomeModal(true)}
            onOpenExpenseForm={() => setShowExpenseModal(true)}
            onSelectTransaction={setSelectedTransaction}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsTab
            transactions={transactions}
            familyMembers={familyMembers}
            categories={categories}
            onDeleteTransaction={handleDeleteTransaction}
            onSelectTransaction={setSelectedTransaction}
          />
        )}

        {activeTab === 'savings' && (
          <SavingsTab
            savingGoals={savingGoals}
            onAddGoal={(goal) => {
              const newGoal = { ...goal, id: `goal-${Date.now()}`, status: 'active' as const };
              setSavingGoals(prev => [...prev, newGoal]);
              syncAddSavingGoal(newGoal);
            }}
            onDeleteGoal={(id) => {
              setSavingGoals(prev => prev.filter(g => g.id !== id));
              syncDeleteSavingGoal(id);
            }}
            onAdjustSavings={handleAdjustSavings}
          />
        )}

        {activeTab === 'cards' && (
          <CardsTab
            creditCards={creditCards}
            onAddCard={(card) => {
              const newCard = { ...card, id: `card-${Date.now()}` };
              setCreditCards(prev => [...prev, newCard]);
              syncAddCreditCard(newCard);
            }}
            onDeleteCard={(id) => {
              setCreditCards(prev => prev.filter(c => c.id !== id));
              syncDeleteCreditCard(id);
            }}
            onPayCardBill={handlePayCardBill}
            onSimulateCharge={handleSimulateCharge}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpensesTab
            transactions={transactions}
            categories={categories}
            creditCards={creditCards}
            onAddTransaction={handleAddTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onSelectTransaction={setSelectedTransaction}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            categories={categories}
            onAddCategory={(cat) => {
              const newCat = { ...cat, id: `cat-${Date.now()}` };
              setCategories(prev => [...prev, newCat]);
              syncAddCategory(newCat);
            }}
            onDeleteCategory={(id) => {
              setCategories(prev => prev.filter(c => c.id !== id));
              syncDeleteCategory(id);
            }}
            settings={settings}
            onUpdateSettings={(newSettings) => {
              setSettings(newSettings);
              syncSettings(newSettings);
            }}
            onDeleteAccount={handleDeleteAccount}
          />
        )}

      </main>

      {/* --- MODAL DIALOG: CATAT PEMASUKAN --- */}
      <AnimatePresence>
        {showIncomeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Background Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowIncomeModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl relative z-10 overflow-hidden modal-body-scrollable"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-emerald-50/20">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg">
                    <Plus className="w-4 h-4 stroke-[3]" />
                  </div>
                  <h3 className="font-display font-extrabold text-slate-800 text-sm">Catat Pemasukan Baru</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIncomeModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveIncome} className="p-5 space-y-4 modal-form-scrollable">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nama Pemasukan</label>
                  <input
                    type="text"
                    required
                    value={incomeTitle}
                    onChange={(e) => setIncomeTitle(e.target.value)}
                    placeholder="Contoh: Gaji Bulanan PT ABC"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-slate-800 focus:border-emerald-500 focus:outline-hidden transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nominal (Rp)</label>
                    <input
                      type="number"
                      required
                      value={incomeAmount}
                      onChange={(e) => setIncomeAmount(e.target.value)}
                      placeholder="Contoh: 15000000"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-slate-800 focus:border-emerald-500 focus:outline-hidden transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Kategori</label>
                    <select
                      value={incomeCategory}
                      onChange={(e) => setIncomeCategory(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-slate-800 focus:border-emerald-500 focus:outline-hidden transition"
                    >
                      {categories.filter(c => c.type === 'income').map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sumber Rekening</label>
                    <select
                      value={incomeSource}
                      onChange={(e) => setIncomeSource(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-slate-800 focus:border-emerald-500 focus:outline-hidden transition"
                    >
                      <option value="Cash">Tunai (Cash Wallet)</option>
                      <option value="Debit">Rekening Bank (Debit)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Catatan Tambahan</label>
                    <input
                      type="text"
                      value={incomeNote}
                      onChange={(e) => setIncomeNote(e.target.value)}
                      placeholder="Opsional"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-slate-800 focus:border-emerald-500 focus:outline-hidden transition"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowIncomeModal(false)}
                    className="px-4 py-2 text-slate-500 hover:text-slate-800 text-xs font-bold transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Simpan Pemasukan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL DIALOG: CATAT PENGELUARAN --- */}
      <AnimatePresence>
        {showExpenseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Background Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowExpenseModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl relative z-10 overflow-hidden modal-body-scrollable"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-rose-50/20">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-rose-100 text-rose-600 rounded-lg">
                    <Minus className="w-4 h-4 stroke-[3]" />
                  </div>
                  <h3 className="font-display font-extrabold text-slate-800 text-sm">Catat Pengeluaran Baru</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tab Selector inside Expense Modal: Manual vs AI Scanner */}
              <div className="px-5 pt-3 flex border-b border-slate-100 bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => setExpenseInputMethod('manual')}
                  className={`px-4 py-2 text-xs font-semibold border-b-2 -mb-px transition-all ${expenseInputMethod === 'manual' ? 'border-rose-500 text-rose-600 font-bold' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
                >
                  Input Manual
                </button>
                <button
                  type="button"
                  onClick={() => setExpenseInputMethod('receipt')}
                  className={`px-4 py-2 text-xs font-semibold border-b-2 -mb-px transition-all flex items-center gap-1.5 ${expenseInputMethod === 'receipt' ? 'border-rose-500 text-rose-600 font-bold' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
                >
                  <Receipt className="w-3.5 h-3.5 animate-pulse" /> Scan Struk AI
                </button>
              </div>

              {/* Render Selected Input Tab */}
              <div className="p-5 modal-form-scrollable">
                {expenseInputMethod === 'receipt' ? (
                  <BarcodeScanner 
                    onScanComplete={handleReceiptScanComplete} 
                    onInstantSave={handleInstantSaveExpense}
                    creditCards={creditCards}
                  />
                ) : (
                  <form onSubmit={handleSaveExpense} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nama Toko / Keterangan Belanja</label>
                      <input
                        type="text"
                        required
                        value={expenseTitle}
                        onChange={(e) => setExpenseTitle(e.target.value)}
                        placeholder="Contoh: Starbucks Kopi, Grabcar"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-slate-800 focus:border-rose-500 focus:outline-hidden transition"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nominal (Rp)</label>
                        <input
                          type="number"
                          required
                          value={expenseAmount}
                          onChange={(e) => setExpenseAmount(e.target.value)}
                          placeholder="Contoh: 85000"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-slate-800 focus:border-rose-500 focus:outline-hidden transition font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Kategori</label>
                        <select
                          value={expenseCategory}
                          onChange={(e) => setExpenseCategory(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-slate-800 focus:border-rose-500 focus:outline-hidden transition"
                        >
                          {categories.filter(c => c.type === 'expense').map(c => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sumber Pembayaran</label>
                        <select
                          value={expenseSource}
                          onChange={(e) => setExpenseSource(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-slate-800 focus:border-rose-500 focus:outline-hidden transition"
                        >
                          <option value="Cash">Tunai (Cash Wallet)</option>
                          <option value="Debit">Rekening Bank (Debit)</option>
                          {creditCards.map(c => (
                            <option key={c.id} value={c.id}>Kartu: {c.cardName} ({c.lastFourDigits})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Catatan Tambahan</label>
                        <input
                          type="text"
                          value={expenseNote}
                          onChange={(e) => setExpenseNote(e.target.value)}
                          placeholder="Opsional"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-slate-800 focus:border-rose-500 focus:outline-hidden transition"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setShowExpenseModal(false)}
                        className="px-4 py-2 text-slate-500 hover:text-slate-800 text-xs font-bold transition cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                      >
                        Simpan Pengeluaran
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL WIZARD: POST-INCOME WORKFLOW OPTIONS --- */}
      <AnimatePresence>
        {workflowIncomeTx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/75 backdrop-blur-xs"
            />

            {/* Wizard dialog body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl relative z-10 overflow-hidden"
            >
              
              <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-950 text-white border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 rounded-xl ripple-effect">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-emerald-400 tracking-wider uppercase">Langkah Berikutnya</span>
                    <h3 className="font-display font-extrabold text-sm">Alokasi Pemasukan</h3>
                  </div>
                </div>
              </div>

              {/* Wizard Content Switches */}
              <div className="p-5">
                {workflowStep === 'select' && (
                  <div className="space-y-4 text-center">
                    <div className="bg-emerald-50 rounded-2xl p-4 inline-block border border-emerald-100">
                      <Check className="w-8 h-8 text-emerald-600 mx-auto stroke-[3]" />
                    </div>
                    <h4 className="font-display font-extrabold text-slate-800 text-base">Pemasukan Berhasil Dicatat!</h4>
                    <p className="text-xs text-slate-500">
                      Berhasil membukukan <strong className="text-emerald-600 font-mono">{formatIDR(workflowIncomeTx.amount)}</strong>. Apa rencana alokasi keuangan berikutnya?
                    </p>

                    <div className="grid grid-cols-1 gap-2.5 pt-4">
                      <button
                        onClick={() => setWorkflowStep('transfer_savings')}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <PiggyBank className="w-4.5 h-4.5" /> Transfer ke Sasaran Tabungan
                      </button>
                      <button
                        onClick={() => setWorkflowStep('pay_cc')}
                        className="w-full py-3 bg-slate-950 hover:bg-slate-850 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <CardIcon className="w-4.5 h-4.5 text-emerald-400" /> Bayar Tagihan Kartu Kredit
                      </button>
                      <button
                        onClick={() => setWorkflowIncomeTx(null)}
                        className="w-full py-2.5 text-slate-500 hover:text-slate-800 font-bold text-xs transition cursor-pointer"
                      >
                        Simpan Semua di Rekening Utama (Selesai)
                      </button>
                    </div>
                  </div>
                )}

                {/* Wizard: Transfer to savings form */}
                {workflowStep === 'transfer_savings' && (
                  <form onSubmit={executeWorkflowTransfer} className="space-y-4">
                    <h4 className="font-display font-bold text-slate-800 text-sm">Transfer ke Sasaran Tabungan</h4>
                    <p className="text-xs text-slate-500">Sisihkan sebagian pemasukan ini langsung ke tabungan impian Anda.</p>
                    
                    {wfError && (
                      <div className="p-2.5 bg-red-50 border border-red-200 text-red-600 text-[11px] rounded-lg">
                        {wfError}
                      </div>
                    )}

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Pilih Sasaran Tabungan</label>
                        <select
                          value={wfSelectedGoalId}
                          onChange={(e) => setWfSelectedGoalId(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800"
                        >
                          {savingGoals.map(g => (
                            <option key={g.id} value={g.id}>{g.title} ({formatIDR(g.currentAmount)} / {formatIDR(g.targetAmount)})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nominal yang Ditransfer (Rp)</label>
                        <input
                          type="number"
                          required
                          value={wfAmount}
                          onChange={(e) => setWfAmount(e.target.value)}
                          placeholder={`Maksimal ${workflowIncomeTx.amount}`}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800"
                          autoFocus
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setWorkflowStep('select')}
                        className="px-3.5 py-1.5 text-slate-500 text-xs font-bold"
                      >
                        Kembali
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl"
                      >
                        Konfirmasi Transfer
                      </button>
                    </div>
                  </form>
                )}

                {/* Wizard: Pay CC Bill form */}
                {workflowStep === 'pay_cc' && (
                  <form onSubmit={executeWorkflowPayCC} className="space-y-4">
                    <h4 className="font-display font-bold text-slate-800 text-sm">Bayar Tagihan Kartu Kredit</h4>
                    <p className="text-xs text-slate-500">Lunasi tagihan berjalan Anda menggunakan dana pemasukan baru.</p>
                    
                    {wfError && (
                      <div className="p-2.5 bg-red-50 border border-red-200 text-red-600 text-[11px] rounded-lg">
                        {wfError}
                      </div>
                    )}

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Pilih Kartu Kredit</label>
                        <select
                          value={wfSelectedCardId}
                          onChange={(e) => setWfSelectedCardId(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800"
                        >
                          {creditCards.map(c => (
                            <option key={c.id} value={c.id}>{c.cardName} (Tagihan: {formatIDR(c.usedAmount)})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nominal Pembayaran (Rp)</label>
                        <input
                          type="number"
                          required
                          value={wfAmount}
                          onChange={(e) => setWfAmount(e.target.value)}
                          placeholder={`Maksimal ${workflowIncomeTx.amount}`}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800"
                          autoFocus
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setWorkflowStep('select')}
                        className="px-3.5 py-1.5 text-slate-500 text-xs font-bold"
                      >
                        Kembali
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl"
                      >
                        Konfirmasi Pembayaran
                      </button>
                    </div>
                  </form>
                )}

                {/* Wizard: Success complete state */}
                {workflowStep === 'completed' && (
                  <div className="space-y-4 text-center">
                    <div className="bg-emerald-50 rounded-2xl p-4 inline-block border border-emerald-100">
                      <Check className="w-8 h-8 text-emerald-600 mx-auto stroke-[3] animate-bounce" />
                    </div>
                    <h4 className="font-display font-extrabold text-slate-800 text-base">Alokasi Berhasil!</h4>
                    <p className="text-xs text-slate-500">
                      Langkah alokasi pemindahan dana telah sukses dijalankan secara otomatis.
                    </p>

                    <button
                      onClick={() => setWorkflowIncomeTx(null)}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-850 text-white font-bold text-xs rounded-xl mt-4 cursor-pointer"
                    >
                      Kembali ke Dashboard
                    </button>
                  </div>
                )}
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- INTERACTIVE NOTIFICATIONS DRAWER/SHEET --- */}
      <AnimatePresence>
        {showNotifications && (
          <div className="fixed inset-0 z-50 flex justify-end">
            
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNotifications(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            />

            {/* Notification Drawer Body */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white border-l border-slate-200/80 w-full max-w-sm h-full shadow-2xl relative z-10 flex flex-col justify-between"
            >
              
              <div>
                {/* Header */}
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-display font-extrabold text-slate-800 text-sm">Kotak Pesan Notifikasi</h3>
                  </div>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Notifications list */}
                <div className="p-4 space-y-3.5 max-h-[80vh] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="text-center py-16 text-slate-400 text-xs font-semibold flex flex-col items-center">
                      <Bell className="w-8 h-8 text-slate-300 stroke-1 mb-2" />
                      <span>Kotak masuk bersih</span>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div 
                        key={notif.id}
                        className={`p-3.5 border rounded-xl space-y-1.5 transition-all ${notif.read ? 'bg-slate-50/50 border-slate-150' : 'bg-emerald-500/5 border-emerald-100'}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">{notif.date}</span>
                          <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${notif.type === 'alert' ? 'bg-red-100 text-red-800' : notif.type === 'info' ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'}`}>
                            {notif.type}
                          </span>
                        </div>
                        <h4 className="font-semibold text-slate-800 text-xs sm:text-sm">{notif.title}</h4>
                        <p className="text-[11px] leading-relaxed text-slate-500">{notif.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Clear notifications */}
              {notifications.length > 0 && (
                <div className="p-4 border-t border-slate-100">
                  <button
                    onClick={() => setNotifications([])}
                    className="w-full py-2 border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Kosongkan Semua Pesan
                  </button>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- POPUP MODAL: EDIT & REVIEW TRANSACTION LOG --- */}
      <AnimatePresence>
        {selectedTransaction && (
          <EditTransactionModal
            transaction={selectedTransaction}
            categories={categories}
            creditCards={creditCards}
            onClose={() => setSelectedTransaction(null)}
            onSave={handleUpdateTransaction}
            onDelete={(id) => {
              handleDeleteTransaction(id);
              setSelectedTransaction(null);
              triggerNotification('Transaksi Dihapus', 'Transaksi berhasil dihapus secara permanen.', 'info');
            }}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
