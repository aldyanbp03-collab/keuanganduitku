/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { formatThousand, parseThousand } from '../utils/format';
import { 
  CreditCard as CardIcon, 
  PlusCircle, 
  Trash2, 
  Wallet, 
  Receipt, 
  AlertCircle,
  HelpCircle,
  Sparkles,
  Zap,
  ArrowDownRight,
  ArrowUpRight,
  ArrowRightLeft,
  HandCoins,
  X,
  Calendar,
  FileText,
  BarChart3,
  TrendingUp,
  PieChart,
  Tag,
  ChevronDown,
  ChevronUp,
  Eye,
  Search,
  Filter,
  ChevronsUpDown,
  Info
} from 'lucide-react';
import { CreditCard, DebtRecord, Transaction } from '../types';
import DebtsTab from './DebtsTab';

interface CardsTabProps {
  creditCards: CreditCard[];
  transactions?: Transaction[];
  onDeleteTransaction?: (id: string) => void;
  onSelectTransaction?: (tx: Transaction) => void;
  onAddCard: (card: Omit<CreditCard, 'id'>) => void;
  onDeleteCard: (id: string) => void;
  onUpdateCard?: (card: CreditCard) => void;
  onTransferDebit?: (sourceId: string, targetId: string, amount: number, note?: string) => void;
  onPayCardBill: (id: string, amount: number) => void;
  onSimulateCharge: (id: string, amount: number, title: string, category: string, date?: string, note?: string) => void;
  
  // Debts Props
  debts: DebtRecord[];
  onAddDebt: (debt: Omit<DebtRecord, 'id'>, recordTransaction?: boolean, paymentSource?: string) => void;
  onUpdateDebt: (debt: DebtRecord) => void;
  onDeleteDebt: (id: string) => void;
  onPayDebt: (debtId: string, paymentAmount: number, paymentSource: string, note?: string) => void;
  initialSubTab?: 'cards' | 'debts';
}

export default function CardsTab({
  creditCards,
  transactions = [],
  onDeleteTransaction,
  onSelectTransaction,
  onAddCard,
  onDeleteCard,
  onUpdateCard,
  onTransferDebit,
  onPayCardBill,
  onSimulateCharge,
  debts,
  onAddDebt,
  onUpdateDebt,
  onDeleteDebt,
  onPayDebt,
  initialSubTab = 'cards'
}: CardsTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'cards' | 'debts'>(initialSubTab);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPayModal, setShowPayModal] = useState<string | null>(null);
  const [showChargeModal, setShowChargeModal] = useState<string | null>(null);
  const [cardToDelete, setCardToDelete] = useState<CreditCard | null>(null);
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);
  const [expandedCardTxs, setExpandedCardTxs] = useState<{ [cardId: string]: boolean }>({});

  // Filter for card view: all, credit, debit
  const [filterCardType, setFilterCardType] = useState<'all' | 'debit' | 'credit'>('all');

  // Form states for adding card
  const [cardType, setCardType] = useState<'credit' | 'debit'>('credit');
  const [cardName, setCardName] = useState('');
  const [bankName, setBankName] = useState('');
  const [lastFour, setLastFour] = useState('');
  const [limit, setLimit] = useState('');
  const [cardBalance, setCardBalance] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [colorTheme, setColorTheme] = useState('from-blue-600 to-indigo-800');

  // Transfer Modal State
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferSourceId, setTransferSourceId] = useState('');
  const [transferTargetId, setTransferTargetId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNote, setTransferNote] = useState('');
  const [transferError, setTransferError] = useState('');

  // Top Up Modal State (for Debit Cards)
  const [showTopUpModal, setShowTopUpModal] = useState<CreditCard | null>(null);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpNote, setTopUpNote] = useState('');

  // Form states for paying/charging
  const [amountInput, setAmountInput] = useState('');
  const [chargeTitle, setChargeTitle] = useState('');
  const [chargeCategory, setChargeCategory] = useState('Makanan & Minuman');
  const [chargeDate, setChargeDate] = useState(new Date().toISOString().split('T')[0]);
  const [chargeNote, setChargeNote] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Search & Filter states for Credit Card Transactions
  const [txSearch, setTxSearch] = useState('');
  const [selectedCardFilter, setSelectedCardFilter] = useState('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');
  const [showFilters, setShowFilters] = useState(false);

  // Credit Card Transactions Filter Logic
  const allCreditCardTxs = transactions.filter(t => 
    Boolean(t.relatedCreditCardId) || 
    creditCards.some(c => c.id === t.paymentSource || c.id === t.relatedCreditCardId) ||
    t.paymentSource === 'Kartu Kredit'
  );

  const filteredCreditCardTxs = allCreditCardTxs.filter(t => {
    // 1. Search Query
    if (txSearch) {
      const q = txSearch.toLowerCase();
      const cardObj = creditCards.find(c => c.id === t.relatedCreditCardId || c.id === t.paymentSource);
      const cardName = cardObj ? cardObj.cardName.toLowerCase() : '';
      const matchesTitle = t.title.toLowerCase().includes(q);
      const matchesCategory = t.category.toLowerCase().includes(q);
      const matchesNote = t.note ? t.note.toLowerCase().includes(q) : false;
      const matchesCard = cardName.includes(q);
      if (!matchesTitle && !matchesCategory && !matchesNote && !matchesCard) return false;
    }

    // 2. Card Filter
    if (selectedCardFilter !== 'all') {
      const isMatch = t.relatedCreditCardId === selectedCardFilter || t.paymentSource === selectedCardFilter;
      if (!isMatch) return false;
    }

    // 3. Category Filter
    if (selectedCategoryFilter !== 'all') {
      if (t.category !== selectedCategoryFilter) return false;
    }

    // 4. Start & End Date
    const matchesStartDate = startDate ? t.date >= startDate : true;
    const matchesEndDate = endDate ? t.date <= endDate : true;
    if (!matchesStartDate || !matchesEndDate) return false;

    return true;
  });

  const sortedCreditCardTxs = [...filteredCreditCardTxs].sort((a, b) => {
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

  const handleCreateCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (cardType === 'debit') {
      if (!cardName || !lastFour || !cardBalance) {
        setErrorMsg('Nama kartu/rekening, 4 digit terakhir, dan saldo awal wajib diisi.');
        return;
      }
      if (lastFour.length !== 4 || isNaN(parseInt(lastFour))) {
        setErrorMsg('4 digit terakhir harus berupa angka.');
        return;
      }
      const balanceVal = parseThousand(cardBalance);
      if (isNaN(balanceVal) || balanceVal < 0) {
        setErrorMsg('Saldo awal harus berupa angka non-negatif.');
        return;
      }

      onAddCard({
        cardName,
        lastFourDigits: lastFour,
        limitAmount: 0,
        usedAmount: 0,
        balance: balanceVal,
        dueDate: dueDate || '12/28',
        color: colorTheme,
        cardType: 'debit',
        bankName: bankName || 'Bank'
      });
    } else {
      if (!cardName || !lastFour || !limit || !dueDate) {
        setErrorMsg('Semua kolom kartu kredit wajib diisi.');
        return;
      }
      if (lastFour.length !== 4 || isNaN(parseInt(lastFour))) {
        setErrorMsg('4 digit terakhir harus berupa angka.');
        return;
      }
      const limitVal = parseThousand(limit);
      if (isNaN(limitVal) || limitVal <= 0) {
        setErrorMsg('Limit kartu harus angka positif.');
        return;
      }

      onAddCard({
        cardName,
        lastFourDigits: lastFour,
        limitAmount: limitVal,
        usedAmount: 0,
        dueDate,
        color: colorTheme,
        cardType: 'credit',
        bankName: bankName || 'Bank'
      });
    }

    // Reset Form
    setCardName('');
    setBankName('');
    setLastFour('');
    setLimit('');
    setCardBalance('');
    setDueDate('');
    setErrorMsg('');
    setShowAddForm(false);
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError('');

    if (!transferSourceId || !transferTargetId) {
      setTransferError('Pilih kartu debit asal dan kartu debit tujuan.');
      return;
    }
    if (transferSourceId === transferTargetId) {
      setTransferError('Kartu debit asal dan tujuan tidak boleh sama.');
      return;
    }

    const amt = parseThousand(transferAmount);
    if (isNaN(amt) || amt <= 0) {
      setTransferError('Nominal transfer harus berupa angka positif.');
      return;
    }

    const sourceCard = creditCards.find(c => c.id === transferSourceId);
    if (!sourceCard) {
      setTransferError('Kartu debit asal tidak ditemukan.');
      return;
    }

    const currentBalance = sourceCard.balance || 0;
    if (amt > currentBalance) {
      setTransferError(`Saldo kartu debit asal tidak mencukupi (${formatIDR(currentBalance)}).`);
      return;
    }

    if (onTransferDebit) {
      onTransferDebit(transferSourceId, transferTargetId, amt, transferNote);
    } else if (onUpdateCard) {
      const targetCard = creditCards.find(c => c.id === transferTargetId);
      if (targetCard) {
        onUpdateCard({ ...sourceCard, balance: Math.max(0, currentBalance - amt) });
        onUpdateCard({ ...targetCard, balance: (targetCard.balance || 0) + amt });
      }
    }

    // Reset Form
    setTransferSourceId('');
    setTransferTargetId('');
    setTransferAmount('');
    setTransferNote('');
    setTransferError('');
    setShowTransferModal(false);
  };

  const handleTopUpSubmit = (e: React.FormEvent, card: CreditCard) => {
    e.preventDefault();
    const amt = parseThousand(topUpAmount);
    if (isNaN(amt) || amt <= 0) {
      setErrorMsg('Nominal top up harus berupa angka positif.');
      return;
    }

    if (onUpdateCard) {
      onUpdateCard({
        ...card,
        balance: (card.balance || 0) + amt
      });
    }

    setTopUpAmount('');
    setTopUpNote('');
    setErrorMsg('');
    setShowTopUpModal(null);
  };

  const handlePaySubmit = (e: React.FormEvent, card: CreditCard) => {
    e.preventDefault();
    const amountVal = parseThousand(amountInput);
    if (isNaN(amountVal) || amountVal <= 0) {
      setErrorMsg('Nominal pembayaran harus berupa angka positif.');
      return;
    }
    if (amountVal > card.usedAmount) {
      setErrorMsg(`Nominal melebihi tagihan terpakai saat ini (${formatIDR(card.usedAmount)}).`);
      return;
    }

    onPayCardBill(card.id, amountVal);
    setAmountInput('');
    setErrorMsg('');
    setShowPayModal(null);
  };

  const handleChargeSubmit = (e: React.FormEvent, card: CreditCard) => {
    e.preventDefault();
    if (!chargeTitle) {
      setErrorMsg('Nama toko / belanja wajib diisi.');
      return;
    }
    const amountVal = parseThousand(amountInput);
    if (isNaN(amountVal) || amountVal <= 0) {
      setErrorMsg('Nominal transaksi harus berupa angka positif.');
      return;
    }

    if (card.cardType === 'debit') {
      const currentBalance = card.balance || 0;
      if (amountVal > currentBalance) {
        setErrorMsg(`Saldo kartu debit tidak mencukupi (${formatIDR(currentBalance)}).`);
        return;
      }

      if (onUpdateCard) {
        onUpdateCard({ ...card, balance: Math.max(0, currentBalance - amountVal) });
      }
    } else {
      const remainingLimit = card.limitAmount - card.usedAmount;
      if (amountVal > remainingLimit) {
        setErrorMsg(`Transaksi melebihi sisa limit kartu kredit Anda (${formatIDR(remainingLimit)}).`);
        return;
      }
    }

    onSimulateCharge(
      card.id, 
      amountVal, 
      chargeTitle, 
      chargeCategory, 
      chargeDate || new Date().toISOString().split('T')[0],
      chargeNote || `Transaksi ${card.cardType === 'debit' ? 'kartu debit' : 'kartu kredit'} ${card.cardName}`
    );
    setAmountInput('');
    setChargeTitle('');
    setChargeNote('');
    setErrorMsg('');
    setShowChargeModal(null);
  };

  const formatIDR = (num: number) => {
    return 'Rp ' + num.toLocaleString('id-ID');
  };

  return (
    <div className="space-y-6">
      
      {/* Sub Tab Switcher: Kartu Kredit vs Hutang & Piutang */}
      <div className="flex bg-slate-900 p-1.5 rounded-2xl w-full sm:w-fit border border-slate-800 shadow-md gap-1.5">
        <button
          type="button"
          onClick={() => setActiveSubTab('cards')}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
            activeSubTab === 'cards'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10 font-extrabold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <CardIcon className={`w-4 h-4 ${activeSubTab === 'cards' ? 'text-slate-950' : 'text-emerald-400'}`} />
          <span>Kartu Kredit</span>
          <span className={`text-[10px] px-2 py-0.5 font-mono font-bold rounded-md ${
            activeSubTab === 'cards' ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-300'
          }`}>
            {creditCards.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('debts')}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
            activeSubTab === 'debts'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10 font-extrabold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <HandCoins className={`w-4 h-4 ${activeSubTab === 'debts' ? 'text-slate-950' : 'text-amber-400'}`} />
          <span>Hutang & Piutang</span>
          <span className={`text-[10px] px-2 py-0.5 font-mono font-bold rounded-md ${
            activeSubTab === 'debts' ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-300'
          }`}>
            {debts.length}
          </span>
        </button>
      </div>

      {activeSubTab === 'debts' ? (
        <DebtsTab
          debts={debts}
          onAddDebt={onAddDebt}
          onUpdateDebt={onUpdateDebt}
          onDeleteDebt={onDeleteDebt}
          onPayDebt={onPayDebt}
        />
      ) : (
        <>
          {/* Tab Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-display font-extrabold text-slate-950 flex items-center gap-2">
                <CardIcon className="w-7 h-7 text-emerald-600" /> Kelola Kartu Kredit & Debit
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Monitoring saldo kartu debit, sisa limit kredit, jatuh tempo, serta transfer antar kartu debit.
              </p>
            </div>
            
            <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  setShowTransferModal(true);
                  setTransferError('');
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <ArrowRightLeft className="w-4 h-4 text-emerald-200" /> Transfer Antar Debit
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowAddForm(!showAddForm);
                  setErrorMsg('');
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <PlusCircle className="w-4 h-4 text-emerald-400" /> Tambah Kartu Baru
              </button>
            </div>
          </div>

      {/* Card Addition Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleCreateCard} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-display font-bold text-slate-800 text-sm">Hubungkan Kartu Baru</h3>
                
                {/* Card Type Switcher */}
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setCardType('credit');
                      setColorTheme('from-blue-600 to-indigo-800');
                    }}
                    className={`px-3 py-1.5 rounded-lg transition ${cardType === 'credit' ? 'bg-white text-slate-900 shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    💳 Kartu Kredit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCardType('debit');
                      setColorTheme('from-emerald-600 to-teal-800');
                    }}
                    className={`px-3 py-1.5 rounded-lg transition ${cardType === 'debit' ? 'bg-emerald-500 text-slate-950 shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    🏦 Kartu Debit
                  </button>
                </div>
              </div>
              
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    {cardType === 'debit' ? 'Nama Kartu / Rekening' : 'Nama Kartu Kredit'}
                  </label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder={cardType === 'debit' ? 'Contoh: BCA Debit Utama, Jago' : 'Contoh: BCA Everyday, Mandiri Sky'}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs sm:text-sm focus:border-emerald-500 focus:outline-hidden transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Bank / Penerbit</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="Contoh: BCA, Mandiri, BRI, Jago"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs sm:text-sm focus:border-emerald-500 focus:outline-hidden transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">4 Digit Terakhir</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={lastFour}
                    onChange={(e) => setLastFour(e.target.value)}
                    placeholder="Contoh: 1234"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs sm:text-sm focus:border-emerald-500 focus:outline-hidden transition"
                  />
                </div>

                {cardType === 'debit' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Saldo Awal Kartu (Rp)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={cardBalance}
                      onChange={(e) => setCardBalance(formatThousand(e.target.value))}
                      placeholder="Contoh: 5.000.000"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs sm:text-sm focus:border-emerald-500 focus:outline-hidden transition font-mono"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Limit Belanja Kartu (Rp)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={limit}
                      onChange={(e) => setLimit(formatThousand(e.target.value))}
                      placeholder="Contoh: 20.000.000"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs sm:text-sm focus:border-emerald-500 focus:outline-hidden transition font-mono"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    {cardType === 'debit' ? 'Masa Berlaku / Catatan' : 'Jatuh Tempo Pembayaran'}
                  </label>
                  <input
                    type="text"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    placeholder={cardType === 'debit' ? 'Contoh: 12/28' : 'Contoh: Tiap Tanggal 15'}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs sm:text-sm focus:border-emerald-500 focus:outline-hidden transition"
                  />
                </div>

                {/* Theme Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-2">Pilih Tema Visual Kartu</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'from-emerald-600 to-teal-800', label: 'Emerald' },
                      { value: 'from-blue-600 to-indigo-800', label: 'BCA Blue' },
                      { value: 'from-slate-800 to-slate-950', label: 'Mandiri Black' },
                      { value: 'from-cyan-600 to-blue-900', label: 'Cyan Cyber' },
                      { value: 'from-red-600 to-amber-700', label: 'HSBC Red' },
                      { value: 'from-violet-600 to-fuchsia-800', label: 'CIMB Purple' }
                    ].map((theme) => (
                      <button
                        key={theme.value}
                        type="button"
                        onClick={() => setColorTheme(theme.value)}
                        className={`px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition ${colorTheme === theme.value ? 'bg-slate-900 border-slate-900 text-white shadow-xs' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className={`w-3 h-3 rounded-sm bg-gradient-to-br ${theme.value}`} />
                          <span>{theme.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
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
                  Simpan Kartu Baru
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cards Filtering & Overview Cards */}
      {creditCards.length > 0 && (() => {
        const debitCardsList = creditCards.filter(c => c.cardType === 'debit');
        const creditCardsList = creditCards.filter(c => c.cardType !== 'debit');

        const totalDebitBalance = debitCardsList.reduce((acc, c) => acc + (c.balance || 0), 0);
        const totalCreditLimit = creditCardsList.reduce((acc, c) => acc + c.limitAmount, 0);
        const totalCreditUsed = creditCardsList.reduce((acc, c) => acc + c.usedAmount, 0);

        return (
          <div className="space-y-4">
            {/* Top Summary Indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">TOTAL SALDO DEBIT</span>
                  <span className="text-base sm:text-lg font-extrabold text-emerald-600 font-mono mt-0.5 block">
                    {formatIDR(totalDebitBalance)}
                  </span>
                  <span className="text-[10px] text-slate-400">{debitCardsList.length} Kartu Debit</span>
                </div>
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">TOTAL LIMIT KREDIT</span>
                  <span className="text-base sm:text-lg font-extrabold text-blue-600 font-mono mt-0.5 block">
                    {formatIDR(totalCreditLimit)}
                  </span>
                  <span className="text-[10px] text-slate-400">{creditCardsList.length} Kartu Kredit</span>
                </div>
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">TOTAL TERPAKAI KREDIT</span>
                  <span className="text-base sm:text-lg font-extrabold text-rose-600 font-mono mt-0.5 block">
                    {formatIDR(totalCreditUsed)}
                  </span>
                  <span className="text-[10px] text-slate-400">Tagihan Berjalan</span>
                </div>
                <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
                  <ArrowDownRight className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Quick Filter Tabs & Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold w-fit border border-slate-200">
                <button
                  type="button"
                  onClick={() => setFilterCardType('all')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${filterCardType === 'all' ? 'bg-white text-slate-900 shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Semua Kartu ({creditCards.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterCardType('debit')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${filterCardType === 'debit' ? 'bg-emerald-500 text-slate-950 shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Kartu Debit ({debitCardsList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterCardType('credit')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${filterCardType === 'credit' ? 'bg-blue-600 text-white shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Kartu Kredit ({creditCardsList.length})
                </button>
              </div>

              {debitCardsList.length >= 2 && (
                <button
                  type="button"
                  onClick={() => {
                    setShowTransferModal(true);
                    setTransferSourceId(debitCardsList[0]?.id || '');
                    setTransferTargetId(debitCardsList[1]?.id || '');
                    setTransferError('');
                  }}
                  className="text-xs font-extrabold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-600" /> Transfer Antar Debit
                </button>
              )}
            </div>
          </div>
        );
      })()}

      {/* Interactive Card Deck */}
      {(() => {
        const visibleCards = creditCards.filter(c => {
          if (filterCardType === 'debit') return c.cardType === 'debit';
          if (filterCardType === 'credit') return c.cardType !== 'debit';
          return true;
        });

        if (visibleCards.length === 0) {
          return (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center text-slate-400">
              <CardIcon className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">
                {filterCardType === 'debit' ? 'Belum ada kartu debit terhubung.' : filterCardType === 'credit' ? 'Belum ada kartu kredit terhubung.' : 'Belum ada kartu terhubung.'}
              </p>
              <p className="text-xs text-slate-400 mt-1">Klik tombol "Tambah Kartu Baru" untuk menambahkan.</p>
            </div>
          );
        }

        return (
          <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-6">
            {visibleCards.map((card) => {
              const isDebit = card.cardType === 'debit';
              const usedPercent = card.limitAmount > 0 ? (card.usedAmount / card.limitAmount) * 100 : 0;
              const remainingLimit = card.limitAmount - card.usedAmount;
              const debitCardsList = creditCards.filter(c => c.cardType === 'debit');

              return (
                <div 
                  key={card.id}
                  className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all relative flex flex-col justify-between"
                >
                  <div>
                    {/* Physical card visualization */}
                    <div className={`w-full max-w-md md:max-w-lg lg:max-w-none mx-auto md:mx-0 bg-gradient-to-br ${card.color || (isDebit ? 'from-emerald-600 to-teal-800' : 'from-blue-600 to-indigo-800')} text-white rounded-2xl p-5 shadow-lg relative overflow-hidden aspect-[1.586/1] flex flex-col justify-between border border-white/10`}>
                      
                      {/* Hologram card chip & Wi-Fi signal */}
                      <div className="flex items-start justify-between">
                        <div className="flex flex-col">
                          <span className={`text-[10px] font-bold text-white/90 uppercase tracking-wider px-2 py-0.5 rounded-md w-fit ${isDebit ? 'bg-emerald-950/40 border border-emerald-400/30' : 'bg-blue-950/40 border border-blue-400/30'}`}>
                            {isDebit ? '🏦 KARTU DEBIT' : '💳 KARTU KREDIT'}
                          </span>
                          <span className="text-sm sm:text-base font-display font-extrabold tracking-wide mt-1.5">{card.cardName}</span>
                          {card.bankName && (
                            <span className="text-[10px] text-white/70 font-semibold">{card.bankName}</span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCardToDelete(card);
                            }}
                            className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg border border-rose-400/50 transition cursor-pointer flex items-center justify-center shrink-0 shadow-sm"
                            title={`Hapus ${isDebit ? 'Kartu Debit' : 'Kartu Kredit'}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          <div className="w-10 h-7 bg-amber-400/80 rounded-md border border-amber-300/60 shadow-inner relative overflow-hidden shrink-0">
                            <div className="absolute inset-y-0 left-1/3 w-px bg-slate-900/10" />
                            <div className="absolute inset-y-0 right-1/3 w-px bg-slate-900/10" />
                            <div className="absolute inset-x-0 top-1/2 h-px bg-slate-900/10" />
                          </div>
                        </div>
                      </div>

                      {/* Card number representation */}
                      <div className="my-2 flex items-center justify-between">
                        <span className="font-mono text-base sm:text-lg tracking-[0.2em] font-medium text-white/90">
                          ••••  ••••  ••••  {card.lastFourDigits}
                        </span>
                      </div>

                      {/* Card Bottom Details */}
                      {isDebit ? (
                        <div className="flex items-end justify-between pt-2 border-t border-white/15">
                          <div>
                            <span className="text-[8px] font-bold text-white/70 uppercase block">SALDO UTAMA</span>
                            <span className="font-mono text-sm sm:text-base font-extrabold text-white">{formatIDR(card.balance || 0)}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[8px] font-bold text-white/70 uppercase block">BERLAKU S.D</span>
                            <span className="text-[10px] font-semibold text-white bg-white/15 px-2 py-0.5 rounded-md inline-block">
                              {card.dueDate || '12/28'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-end justify-between pt-2 border-t border-white/15">
                          <div>
                            <span className="text-[8px] font-bold text-white/60 uppercase block">LIMIT UTAMA</span>
                            <span className="font-mono text-xs font-bold text-white/90">{formatIDR(card.limitAmount)}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[8px] font-bold text-white/60 uppercase block">JATUH TEMPO</span>
                            <span className="text-[10px] font-semibold text-white bg-white/10 px-2 py-0.5 rounded-md inline-block">
                              {card.dueDate}
                            </span>
                          </div>
                        </div>
                      )}

                    </div>

                    {/* Progress Bar / Balance Card Box */}
                    {isDebit ? (
                      <div className="mt-4 p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Wallet className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="text-xs font-bold text-slate-700">Saldo Kartu Debit</span>
                        </div>
                        <span className="text-sm font-extrabold font-mono text-emerald-700">
                          {formatIDR(card.balance || 0)}
                        </span>
                      </div>
                    ) : (
                      <div className="mt-5 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-medium text-slate-500">Penggunaan Limit</span>
                          <span className={`font-bold font-mono ${usedPercent >= 80 ? 'text-red-500' : 'text-slate-800'}`}>
                            {formatIDR(card.usedAmount)} / {formatIDR(card.limitAmount)}
                          </span>
                        </div>
                        
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${usedPercent >= 80 ? 'bg-red-500' : usedPercent >= 50 ? 'bg-orange-500' : 'bg-emerald-500'}`} 
                            style={{ width: `${Math.min(usedPercent, 100)}%` }}
                          />
                        </div>

                        <div className="flex justify-between items-center text-[10px] text-slate-400">
                          <span>{Math.round(usedPercent)}% Terpakai</span>
                          <span>Sisa Limit: {formatIDR(remainingLimit)}</span>
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Action Buttons */}
                  {isDebit ? (
                    <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setTransferSourceId(card.id);
                          const otherDebit = debitCardsList.find(d => d.id !== card.id);
                          setTransferTargetId(otherDebit ? otherDebit.id : '');
                          setTransferAmount('');
                          setTransferNote('');
                          setTransferError('');
                          setShowTransferModal(true);
                        }}
                        className="py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] sm:text-xs rounded-lg transition flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-200 shrink-0" /> Transfer
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setErrorMsg('');
                          setTopUpAmount('');
                          setTopUpNote('');
                          setShowTopUpModal(card);
                        }}
                        className="py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] sm:text-xs rounded-lg transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Wallet className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Top Up
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setErrorMsg('');
                          setAmountInput('');
                          setChargeTitle('');
                          setChargeCategory('Makanan & Minuman');
                          setChargeDate(new Date().toISOString().split('T')[0]);
                          setChargeNote('');
                          setShowChargeModal(card.id);
                        }}
                        className="py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] sm:text-xs border border-slate-200 rounded-lg transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <ArrowDownRight className="w-3.5 h-3.5 text-rose-500 shrink-0" /> Transaksi
                      </button>
                    </div>
                  ) : (
                    <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMsg('');
                          setShowPayModal(card.id);
                        }}
                        className="py-1.5 bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Wallet className="w-3.5 h-3.5 text-emerald-400" /> Bayar Tagihan
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMsg('');
                          setAmountInput('');
                          setChargeTitle('');
                          setChargeCategory('Makanan & Minuman');
                          setChargeDate(new Date().toISOString().split('T')[0]);
                          setChargeNote('');
                          setShowChargeModal(card.id);
                        }}
                        className="py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 rounded-lg transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" /> Transaksi Baru
                      </button>
                    </div>
                  )}

              {/* Per-Card Transaction History List */}
              {(() => {
                const cardTxs = transactions.filter(t => t.relatedCreditCardId === card.id || t.paymentSource === card.id);
                const isExpanded = expandedCardTxs[card.id] !== false;

                return (
                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <button
                        type="button"
                        onClick={() => setExpandedCardTxs(prev => ({ ...prev, [card.id]: !isExpanded }))}
                        className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer"
                      >
                        <Receipt className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Transaksi {card.cardName}</span>
                        <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
                          {cardTxs.length}
                        </span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                      </button>

                      {cardTxs.length > 0 && (
                        <span className="text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400">
                          Total: -{formatIDR(cardTxs.reduce((sum, t) => sum + t.amount, 0))}
                        </span>
                      )}
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          {cardTxs.length === 0 ? (
                            <div className="p-3 text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 text-[11px]">
                              Belum ada riwayat transaksi gesek untuk kartu ini.
                            </div>
                          ) : (
                            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1 mt-1">
                              {cardTxs.map(tx => (
                                <div
                                  key={tx.id}
                                  onClick={() => onSelectTransaction && onSelectTransaction(tx)}
                                  className="p-2.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-2 transition cursor-pointer group"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="p-1.5 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-lg shrink-0">
                                      <Tag className="w-3 h-3" />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                          {tx.title}
                                        </span>
                                        <span className="text-[9px] font-semibold text-slate-400 bg-white dark:bg-slate-900 px-1.5 py-0.2 rounded border border-slate-200 dark:border-slate-700 shrink-0">
                                          {tx.category}
                                        </span>
                                      </div>
                                      <span className="text-[10px] text-slate-400 font-mono block">
                                        {tx.date} {tx.note ? `• ${tx.note}` : ''}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-xs font-bold font-mono text-rose-600 dark:text-rose-400">
                                      -{formatIDR(tx.amount)}
                                    </span>
                                    {onDeleteTransaction && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setTxToDelete(tx);
                                        }}
                                        className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-md transition cursor-pointer"
                                        title="Hapus Transaksi"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })()}

              {/* Pay Bill Modal Overlay - Fixed Popup */}
              <AnimatePresence>
                {showPayModal === card.id && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => {
                        setAmountInput('');
                        setErrorMsg('');
                        setShowPayModal(null);
                      }}
                      className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs"
                    />

                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 15 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 15 }}
                      className="bg-white border border-slate-200 rounded-2xl w-full max-w-[380px] shadow-2xl relative z-10 overflow-hidden"
                    >
                      <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                            <Wallet className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div>
                            <h4 className="font-display font-bold text-white text-sm">Bayar Tagihan Kartu Kredit</h4>
                            <p className="text-[11px] text-slate-400 mt-0.5">Kartu: {card.cardName} (•••• {card.lastFourDigits})</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setAmountInput('');
                            setErrorMsg('');
                            setShowPayModal(null);
                          }}
                          className="p-1 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <form onSubmit={(e) => handlePaySubmit(e, card)} className="p-4 space-y-4">
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Lunasi sebagian atau seluruh tagihan kartu kredit berjalan menggunakan Saldo Utama Anda.
                        </p>
                        
                        {errorMsg && (
                          <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                            <span>{errorMsg}</span>
                          </div>
                        )}

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                              Nominal Pembayaran (Rp)
                            </label>
                            <span className="text-[11px] font-mono font-bold text-rose-600">
                              Tagihan: {formatIDR(card.usedAmount)}
                            </span>
                          </div>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={amountInput}
                            onChange={(e) => setAmountInput(formatThousand(e.target.value))}
                            placeholder={`Contoh: ${formatThousand(card.usedAmount)}`}
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-hidden font-mono font-bold"
                            autoFocus
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => {
                              setAmountInput('');
                              setErrorMsg('');
                              setShowPayModal(null);
                            }}
                            className="px-4 py-2 text-slate-600 hover:text-slate-900 text-xs font-bold rounded-xl hover:bg-slate-100 transition cursor-pointer"
                          >
                            Batal
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md shadow-emerald-500/20 transition cursor-pointer"
                          >
                            Konfirmasi Bayar
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {/* Simulate Card Charge Modal Overlay - Fixed Popup */}
              <AnimatePresence>
                {showChargeModal === card.id && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => {
                        setAmountInput('');
                        setChargeTitle('');
                        setChargeNote('');
                        setErrorMsg('');
                        setShowChargeModal(null);
                      }}
                      className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs"
                    />

                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 15 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 15 }}
                      className="bg-white border border-slate-200 rounded-2xl w-full max-w-[420px] shadow-2xl relative z-10 overflow-hidden"
                    >
                      <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
                            <ArrowDownRight className="w-4 h-4 text-rose-400" />
                          </div>
                          <div>
                            <h4 className="font-display font-bold text-white text-sm">Simulasi Gesek Kartu Baru</h4>
                            <p className="text-[11px] text-slate-400 mt-0.5">Kartu: {card.cardName} (•••• {card.lastFourDigits})</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setAmountInput('');
                            setChargeTitle('');
                            setChargeNote('');
                            setErrorMsg('');
                            setShowChargeModal(null);
                          }}
                          className="p-1 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <form onSubmit={(e) => handleChargeSubmit(e, card)} className="p-4 space-y-3.5">
                        {errorMsg && (
                          <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                            <span>{errorMsg}</span>
                          </div>
                        )}

                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Nama Toko / Belanja
                          </label>
                          <input
                            type="text"
                            value={chargeTitle}
                            onChange={(e) => setChargeTitle(e.target.value)}
                            placeholder="Contoh: Belanja Bulanan Superindo"
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-hidden font-medium"
                            autoFocus
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                              Nominal (Rp)
                            </label>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={amountInput}
                              onChange={(e) => setAmountInput(formatThousand(e.target.value))}
                              placeholder="Contoh: 150.000"
                              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-hidden font-mono font-bold"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                              Kategori
                            </label>
                            <select
                              value={chargeCategory}
                              onChange={(e) => setChargeCategory(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-hidden font-medium"
                            >
                              <option value="Makanan & Minuman">Makanan & Minuman</option>
                              <option value="Belanja Bulanan">Belanja Bulanan</option>
                              <option value="Transportasi">Transportasi</option>
                              <option value="Tagihan & Utilitas">Tagihan & Utilitas</option>
                              <option value="Hiburan & Liburan">Hiburan & Liburan</option>
                              <option value="Lain-lain">Lain-lain</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-500" /> Tanggal Transaksi
                          </label>
                          <input
                            type="date"
                            value={chargeDate}
                            onChange={(e) => setChargeDate(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-hidden font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                            <FileText className="w-3 h-3 text-slate-500" /> Catatan Tambahan (Opsional)
                          </label>
                          <input
                            type="text"
                            value={chargeNote}
                            onChange={(e) => setChargeNote(e.target.value)}
                            placeholder="Contoh: Promo cashback 10%, cicilan 0%"
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-hidden font-medium"
                          />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 mt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setAmountInput('');
                              setChargeTitle('');
                              setChargeNote('');
                              setErrorMsg('');
                              setShowChargeModal(null);
                            }}
                            className="px-4 py-2 text-slate-600 hover:text-slate-900 text-xs font-bold rounded-xl hover:bg-slate-100 transition cursor-pointer"
                          >
                            Batal
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md shadow-emerald-500/20 transition cursor-pointer flex items-center gap-1.5"
                          >
                            <Zap className="w-3.5 h-3.5 fill-slate-950" /> Gesek Kartu
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
        );
      })()}

      {/* RIWAYAT & LOG TRANSAKSI KARTU KREDIT SECTION */}
      <div className="bg-[#131825] border border-[#232d3f] rounded-2xl p-4 sm:p-5 shadow-md space-y-4">
        {/* Header Title & Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#232d3f]">
          <div>
            <h3 className="font-display font-bold text-slate-100 text-base flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-400" /> Log & Riwayat Transaksi Kartu Kredit
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Cari dan filter riwayat penggunaan kartu kredit berdasarkan kata kunci, tanggal, kategori, dan jenis kartu.
            </p>
          </div>
          {filteredCreditCardTxs.length > 0 && (
            <div className="text-left sm:text-right self-start sm:self-auto">
              <span className="text-[11px] text-slate-400 block">Total Pengeluaran Kartu</span>
              <span className="text-sm sm:text-base font-bold font-mono text-rose-400">
                -{formatIDR(filteredCreditCardTxs.reduce((sum, t) => sum + t.amount, 0))}
              </span>
            </div>
          )}
        </div>

        {/* Filter Controls Bar - Exact match to Riwayat Pembukuan & Log Belanja */}
        <div className="bg-[#0f141f] border border-[#1f283a] rounded-2xl p-3.5 sm:p-4 shadow-xl space-y-3">
          
          {/* Row 1: Full-width Search Bar */}
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={txSearch}
              onChange={(e) => setTxSearch(e.target.value)}
              placeholder="Cari transaksi kartu kredit..."
              className="w-full bg-[#182030] border border-[#26334a] rounded-xl pl-10 pr-9 py-2.5 sm:py-3 text-sm font-medium text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/80 transition"
            />
            {txSearch && (
              <button
                type="button"
                onClick={() => setTxSearch('')}
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
                  
                  {/* PILIH KARTU KREDIT */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      KARTU KREDIT
                    </label>
                    <div className="relative w-full">
                      <select
                        value={selectedCardFilter}
                        onChange={(e) => setSelectedCardFilter(e.target.value)}
                        className="w-full appearance-none bg-[#182030] hover:bg-[#202b40] border border-[#26334a] rounded-xl px-4 py-2.5 sm:py-3 text-slate-200 text-sm font-medium focus:outline-none transition cursor-pointer pr-10"
                      >
                        <option value="all" className="bg-[#0f141f]">Semua Kartu Kredit</option>
                        {creditCards.map((c) => (
                          <option key={c.id} value={c.id} className="bg-[#0f141f]">{c.cardName} (•••• {c.lastFourDigits})</option>
                        ))}
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
                        value={selectedCategoryFilter}
                        onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                        className="w-full appearance-none bg-[#182030] hover:bg-[#202b40] border border-[#26334a] rounded-xl px-4 py-2.5 sm:py-3 text-slate-200 text-sm font-medium focus:outline-none transition cursor-pointer pr-10"
                      >
                        <option value="all" className="bg-[#0f141f]">Semua Kategori</option>
                        {Array.from(new Set(allCreditCardTxs.map(t => t.category))).filter(Boolean).map((cat) => (
                          <option key={cat} value={cat} className="bg-[#0f141f]">{cat}</option>
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
                      className="w-full bg-[#182030] border border-[#26334a] rounded-xl px-4 py-2.5 sm:py-3 text-slate-200 text-sm font-medium focus:outline-none focus:border-emerald-500 transition cursor-pointer color-scheme-dark"
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
                      className="w-full bg-[#182030] border border-[#26334a] rounded-xl px-4 py-2.5 sm:py-3 text-slate-200 text-sm font-medium focus:outline-none focus:border-emerald-500 transition cursor-pointer color-scheme-dark"
                    />
                  </div>

                  {/* Reset Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setTxSearch('');
                        setSelectedCardFilter('all');
                        setSelectedCategoryFilter('all');
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

        {/* Transaction List Output */}
        {sortedCreditCardTxs.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs flex flex-col items-center justify-center">
            <Info className="w-8 h-8 text-slate-500 stroke-1 mb-2" />
            <span>Tidak ada transaksi kartu kredit yang sesuai dengan filter.</span>
          </div>
        ) : (
          <div className="divide-y divide-[#232d3f] max-h-[380px] overflow-y-auto pr-1">
            {sortedCreditCardTxs.map((tx) => {
              const cardObj = creditCards.find(c => c.id === tx.relatedCreditCardId || c.id === tx.paymentSource);
              const cardLabel = cardObj ? `${cardObj.cardName} (•••• ${cardObj.lastFourDigits})` : 'Kartu Kredit';

              return (
                <div
                  key={tx.id}
                  onClick={() => onSelectTransaction && onSelectTransaction(tx)}
                  className="py-3 px-2 hover:bg-[#182030]/60 rounded-xl flex items-center justify-between gap-3 transition cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20 shrink-0">
                      <Tag className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-100 truncate group-hover:text-emerald-400 transition-colors">
                          {tx.title}
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-md shrink-0">
                          {cardLabel}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400 bg-[#182030] border border-[#26334a] px-2 py-0.5 rounded-md shrink-0">
                          {tx.category}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 font-mono block mt-0.5">
                        {tx.date} {tx.note ? `• ${tx.note}` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-bold font-mono text-rose-400">
                      -{formatIDR(tx.amount)}
                    </span>
                    {onDeleteTransaction && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTxToDelete(tx);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/50 rounded-lg transition cursor-pointer"
                        title="Hapus Transaksi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Advisory Alert for Credit Card Utilization */}
      <div className="bg-amber-50/75 border border-amber-200 rounded-2xl p-4 flex items-start gap-3.5">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-bold text-amber-800">Batas Penggunaan Aman Kartu Kredit</h4>
          <p className="text-[11px] text-amber-700 leading-relaxed mt-0.5 max-w-3xl">
            Untuk menjaga skor kredit perbankan dalam kondisi prima, usahakan rasio penggunaan (utilisasi) limit kartu kredit Anda <strong>tidak melebihi 30%</strong> dari total limit kredit yang disediakan.
          </p>
        </div>
      </div>

      {/* Debit Card Transfer Modal Overlay */}
      <AnimatePresence>
        {showTransferModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowTransferModal(false);
                setTransferError('');
              }}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white border border-slate-200 rounded-2xl w-full max-w-[420px] shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                    <ArrowRightLeft className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-white text-sm">Transfer Antar Kartu Debit</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Kirim saldo dari satu kartu debit ke kartu debit lain</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowTransferModal(false);
                    setTransferError('');
                  }}
                  className="p-1 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleTransferSubmit} className="p-4 space-y-4">
                {transferError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{transferError}</span>
                  </div>
                )}

                {/* Source Debit Card */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Dari Kartu Debit (Asal)
                  </label>
                  <select
                    value={transferSourceId}
                    onChange={(e) => setTransferSourceId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-hidden font-medium cursor-pointer"
                  >
                    <option value="">-- Pilih Kartu Asal --</option>
                    {creditCards.filter(c => c.cardType === 'debit').map((c) => (
                      <option key={`src-${c.id}`} value={c.id}>
                        {c.cardName} (•••• {c.lastFourDigits}) - Saldo: {formatIDR(c.balance || 0)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Debit Card */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Ke Kartu Debit (Tujuan)
                  </label>
                  <select
                    value={transferTargetId}
                    onChange={(e) => setTransferTargetId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-hidden font-medium cursor-pointer"
                  >
                    <option value="">-- Pilih Kartu Tujuan --</option>
                    {creditCards.filter(c => c.cardType === 'debit' && c.id !== transferSourceId).map((c) => (
                      <option key={`tgt-${c.id}`} value={c.id}>
                        {c.cardName} (•••• {c.lastFourDigits}) - Saldo: {formatIDR(c.balance || 0)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Nominal Transfer */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nominal Transfer (Rp)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(formatThousand(e.target.value))}
                    placeholder="Contoh: 500.000"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-hidden font-mono font-bold"
                  />
                </div>

                {/* Catatan Transfer */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Catatan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={transferNote}
                    onChange={(e) => setTransferNote(e.target.value)}
                    placeholder="Contoh: Pindah dana tabungan harian"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowTransferModal(false);
                      setTransferError('');
                    }}
                    className="px-4 py-2 text-slate-600 hover:text-slate-900 text-xs font-bold rounded-xl hover:bg-slate-100 transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer"
                  >
                    Proses Transfer
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Top Up Debit Card Modal Overlay */}
      <AnimatePresence>
        {showTopUpModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTopUpModal(null)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white border border-slate-200 rounded-2xl w-full max-w-[380px] shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                    <Wallet className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-white text-sm">Top Up Saldo Debit</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">{showTopUpModal.cardName} (•••• {showTopUpModal.lastFourDigits})</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTopUpModal(null)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={(e) => handleTopUpSubmit(e, showTopUpModal)} className="p-4 space-y-4">
                {errorMsg && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                      Nominal Top Up (Rp)
                    </label>
                    <span className="text-[11px] font-mono font-bold text-emerald-600">
                      Saldo Saat Ini: {formatIDR(showTopUpModal.balance || 0)}
                    </span>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(formatThousand(e.target.value))}
                    placeholder="Contoh: 1.000.000"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-hidden font-mono font-bold"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Catatan / Sumber Top Up (Opsional)
                  </label>
                  <input
                    type="text"
                    value={topUpNote}
                    onChange={(e) => setTopUpNote(e.target.value)}
                    placeholder="Contoh: Setor tunai ATM / Setor gaji"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowTopUpModal(null)}
                    className="px-4 py-2 text-slate-600 hover:text-slate-900 text-xs font-bold rounded-xl hover:bg-slate-100 transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer"
                  >
                    Tambah Saldo
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Confirmation Dialog for Card Deletion */}
      <AnimatePresence>
        {cardToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCardToDelete(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white border border-slate-200 rounded-xl w-full max-w-[320px] shadow-2xl relative z-10 p-5 text-center overflow-hidden"
            >
              <div className="mx-auto w-12 h-12 bg-red-50 text-red-500 border border-red-100 rounded-full flex items-center justify-center mb-3">
                <Trash2 className="w-5 h-5" />
              </div>
              
              <h3 className="font-display font-bold text-slate-800 text-sm mb-1.5">Hapus Kartu Kredit?</h3>
              <p className="text-slate-500 text-xs leading-relaxed mb-5">
                Apakah Anda yakin ingin menghapus kartu kredit <strong className="text-slate-700">"{cardToDelete.cardName}"</strong>? Semua transaksi terkait akan tetap tersimpan di riwayat.
              </p>
              
              <div className="flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => setCardToDelete(null)}
                  className="flex-1 py-2 text-xs font-bold text-slate-500 hover:text-slate-850 hover:bg-slate-50 border border-slate-200 rounded-lg transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteCard(cardToDelete.id);
                    setCardToDelete(null);
                  }}
                  className="flex-1 py-2 text-xs font-bold bg-red-600 hover:bg-red-505 hover:bg-red-500 text-white rounded-lg shadow-xs hover:shadow-sm transition cursor-pointer"
                >
                  Ya, Hapus
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Confirmation Dialog for Card Transaction Deletion */}
      <AnimatePresence>
        {txToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setTxToDelete(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white border border-slate-200 rounded-xl w-full max-w-[340px] shadow-2xl relative z-10 p-5 text-center overflow-hidden"
            >
              <div className="mx-auto w-12 h-12 bg-red-50 text-red-500 border border-red-100 rounded-full flex items-center justify-center mb-3">
                <Trash2 className="w-5 h-5" />
              </div>
              
              <h3 className="font-display font-bold text-slate-800 text-sm mb-1.5">Hapus Transaksi Kartu?</h3>
              <p className="text-slate-500 text-xs leading-relaxed mb-5">
                Apakah Anda yakin ingin menghapus catatan transaksi <strong className="text-slate-700">"{txToDelete.title}"</strong> ({formatIDR(txToDelete.amount)})?
              </p>
              
              <div className="flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => setTxToDelete(null)}
                  className="flex-1 py-2 text-xs font-bold text-slate-500 hover:text-slate-850 hover:bg-slate-50 border border-slate-200 rounded-lg transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onDeleteTransaction) onDeleteTransaction(txToDelete.id);
                    setTxToDelete(null);
                  }}
                  className="flex-1 py-2 text-xs font-bold bg-red-600 hover:bg-red-500 text-white rounded-lg shadow-xs hover:shadow-sm transition cursor-pointer"
                >
                  Ya, Hapus
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

        </>
      )}

    </div>
  );
}
