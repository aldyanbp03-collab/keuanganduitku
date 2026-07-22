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
  HandCoins,
  X,
  Calendar,
  FileText
} from 'lucide-react';
import { CreditCard, DebtRecord } from '../types';
import DebtsTab from './DebtsTab';

interface CardsTabProps {
  creditCards: CreditCard[];
  onAddCard: (card: Omit<CreditCard, 'id'>) => void;
  onDeleteCard: (id: string) => void;
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
  onAddCard,
  onDeleteCard,
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

  // Form states for adding card
  const [cardName, setCardName] = useState('');
  const [lastFour, setLastFour] = useState('');
  const [limit, setLimit] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [colorTheme, setColorTheme] = useState('from-blue-600 to-indigo-800');

  // Form states for paying/charging
  const [amountInput, setAmountInput] = useState('');
  const [chargeTitle, setChargeTitle] = useState('');
  const [chargeCategory, setChargeCategory] = useState('Makanan & Minuman');
  const [chargeDate, setChargeDate] = useState(new Date().toISOString().split('T')[0]);
  const [chargeNote, setChargeNote] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleCreateCard = (e: React.FormEvent) => {
    e.preventDefault();
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
      color: colorTheme
    });

    // Reset Form
    setCardName('');
    setLastFour('');
    setLimit('');
    setDueDate('');
    setErrorMsg('');
    setShowAddForm(false);
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
    const remainingLimit = card.limitAmount - card.usedAmount;
    if (amountVal > remainingLimit) {
      setErrorMsg(`Transaksi melebihi sisa limit kartu kredit Anda (${formatIDR(remainingLimit)}).`);
      return;
    }

    onSimulateCharge(
      card.id, 
      amountVal, 
      chargeTitle, 
      chargeCategory, 
      chargeDate || new Date().toISOString().split('T')[0],
      chargeNote || `Transaksi kartu kredit ${card.cardName}`
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
                <CardIcon className="w-7 h-7 text-emerald-600" /> Kelola Kartu Kredit
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Monitoring sisa limit, jatuh tempo, dan bayar tagihan kartu kredit Anda secara disiplin.
              </p>
            </div>
            
            <button
              onClick={() => {
                setShowAddForm(!showAddForm);
                setErrorMsg('');
              }}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" /> Hubungkan Kartu Baru
            </button>
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
              <h3 className="font-display font-bold text-slate-800 text-sm">Hubungkan Rekening Kartu Kredit Baru</h3>
              
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Nama Kartu Kredit (Penerbit)</label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="Contoh: BCA Everyday, Mandiri Sky"
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
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Jatuh Tempo Pembayaran</label>
                  <input
                    type="text"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    placeholder="Contoh: Tiap Tanggal 15"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs sm:text-sm focus:border-emerald-500 focus:outline-hidden transition"
                  />
                </div>
              </div>

              {/* Theme Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">Pilih Tema Visual Kartu</label>
                <div className="flex flex-wrap gap-2.5">
                  {[
                    { value: 'from-blue-600 to-indigo-800', label: 'BCA Blue' },
                    { value: 'from-slate-800 to-slate-950', label: 'Mandiri Signature Black' },
                    { value: 'from-red-600 to-amber-700', label: 'HSBC Red' },
                    { value: 'from-teal-600 to-emerald-800', label: 'BSI Teal' },
                    { value: 'from-violet-600 to-fuchsia-800', label: 'CIMB Purple' }
                  ].map((theme) => (
                    <button
                      key={theme.value}
                      type="button"
                      onClick={() => setColorTheme(theme.value)}
                      className={`px-3 py-2 text-xs font-semibold rounded-xl border transition ${colorTheme === theme.value ? 'bg-slate-900 border-slate-900 text-white shadow-xs' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className={`w-3.5 h-3.5 rounded-sm bg-gradient-to-br ${theme.value}`} />
                        <span>{theme.label}</span>
                      </div>
                    </button>
                  ))}
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
                  Hubungkan Rekening Kartu
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive Credit Card Deck */}
      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-6">
        {creditCards.map((card) => {
          const usedPercent = (card.usedAmount / card.limitAmount) * 100;
          const remainingLimit = card.limitAmount - card.usedAmount;
          
          return (
            <div 
              key={card.id}
              className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all relative flex flex-col justify-between"
            >
              <div>
                
                {/* Physical card visualization - Beautiful UI */}
                <div className={`w-full max-w-md md:max-w-lg lg:max-w-none mx-auto md:mx-0 bg-gradient-to-br ${card.color} text-white rounded-2xl p-5 shadow-lg relative overflow-hidden aspect-[1.586/1] flex flex-col justify-between border border-white/10`}>
                  
                  {/* Hologram card chip & Wi-Fi signal */}
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider">KARTU KREDIT</span>
                      <span className="text-sm font-display font-extrabold tracking-wide mt-0.5">{card.cardName}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* Delete button (Trash icon) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCardToDelete(card);
                        }}
                        className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg border border-rose-400/50 transition cursor-pointer flex items-center justify-center shrink-0 shadow-sm"
                        title="Hapus Kartu Kredit"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Metallic golden chip */}
                      <div className="w-10 h-7 bg-amber-400/80 rounded-md border border-amber-300/60 shadow-inner relative overflow-hidden shrink-0">
                        <div className="absolute inset-y-0 left-1/3 w-px bg-slate-900/10" />
                        <div className="absolute inset-y-0 right-1/3 w-px bg-slate-900/10" />
                        <div className="absolute inset-x-0 top-1/2 h-px bg-slate-900/10" />
                      </div>
                    </div>
                  </div>

                  {/* Card number representation */}
                  <div className="my-3 flex items-center justify-between">
                    <span className="font-mono text-base sm:text-lg tracking-[0.2em] font-medium text-white/90">
                      ••••  ••••  ••••  {card.lastFourDigits}
                    </span>
                  </div>

                  {/* Limit bar and due date info inside card */}
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

                </div>

                {/* Utilization Progress Bar */}
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

              </div>

              {/* Pay Bill / Charge Card Buttons */}
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

        </>
      )}

    </div>
  );
}
