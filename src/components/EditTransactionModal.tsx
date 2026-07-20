/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * EditTransactionModal.tsx - Minimalist and elegant modal for reviewing/editing/deleting a transaction log.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, Save, Calendar, Tag, CreditCard as CCIcon, PenTool, FileText } from 'lucide-react';
import { Transaction, Category, CreditCard } from '../types';

interface EditTransactionModalProps {
  transaction: Transaction;
  categories: Category[];
  creditCards: CreditCard[];
  onClose: () => void;
  onSave: (updated: Transaction) => void;
  onDelete: (id: string) => void;
}

export default function EditTransactionModal({
  transaction,
  categories,
  creditCards,
  onClose,
  onSave,
  onDelete
}: EditTransactionModalProps) {
  const [title, setTitle] = useState(transaction.title);
  const [amount, setAmount] = useState(transaction.amount.toString());
  const [category, setCategory] = useState(transaction.category);
  const [source, setSource] = useState(transaction.paymentSource);
  const [date, setDate] = useState(transaction.date);
  const [note, setNote] = useState(transaction.note || '');

  const isIncome = transaction.type === 'income';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!title || isNaN(parsedAmount) || parsedAmount <= 0) return;

    onSave({
      ...transaction,
      title,
      amount: parsedAmount,
      category,
      paymentSource: source,
      date,
      note,
      relatedCreditCardId: source.startsWith('card-') ? source : undefined
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
      />

      {/* Modal Box - Minimalist, Compact & Centered */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white border border-slate-200 rounded-xl w-full max-w-[360px] shadow-2xl relative z-10 overflow-hidden"
      >
        {/* Header bar */}
        <div className={`p-3 border-b border-slate-100 flex items-center justify-between ${isIncome ? 'bg-emerald-50/20' : 'bg-rose-50/20'}`}>
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${isIncome ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
              <PenTool className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-slate-800 text-xs">Detail & Edit Transaksi</h3>
              <p className="text-[9px] text-slate-400 font-bold tracking-wide uppercase">{isIncome ? 'Arus Pemasukan' : 'Arus Pengeluaran'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Form Body - text-base prevent zoom, tighter spacing */}
        <form onSubmit={handleSubmit} className="p-3.5 space-y-3">
          
          {/* Title input */}
          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Keterangan / Nama Merchant</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Starbucks Kopi, KFC"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-base sm:text-xs text-slate-800 focus:border-indigo-500 focus:outline-hidden transition"
            />
          </div>

          {/* Amount and Category Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Nominal (Rp)</label>
              <input
                type="number"
                required
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Contoh: 150000"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-base sm:text-xs text-slate-800 focus:border-indigo-500 focus:outline-hidden transition font-mono"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-base sm:text-xs text-slate-800 focus:border-indigo-500 focus:outline-hidden transition"
              >
                {categories.filter(c => c.type === (isIncome ? 'income' : 'expense')).map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Payment Source and Date Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Sumber Dana</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-base sm:text-xs text-slate-800 focus:border-indigo-500 focus:outline-hidden transition"
              >
                {isIncome ? (
                  <>
                    <option value="Cash">Tunai (Cash)</option>
                    <option value="Debit">Debit</option>
                  </>
                ) : (
                  <>
                    <option value="Cash">Tunai (Cash)</option>
                    <option value="Debit">Debit</option>
                    {creditCards.map(cc => (
                      <option key={cc.id} value={cc.id}>Kartu: {cc.cardName}</option>
                    ))}
                  </>
                )}
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Tanggal</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-base sm:text-xs text-slate-800 focus:border-indigo-500 focus:outline-hidden transition font-mono"
              />
            </div>
          </div>

          {/* Optional Note */}
          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Catatan Tambahan (Opsional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Keterangan tambahan"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-base sm:text-xs text-slate-800 focus:border-indigo-500 focus:outline-hidden transition"
            />
          </div>

          {/* Action buttons (Delete, Cancel, Save) */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
            <button
              type="button"
              onClick={() => onDelete(transaction.id)}
              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 font-bold text-[11px] rounded-lg transition flex items-center gap-1 cursor-pointer shrink-0"
              title="Hapus Transaksi"
            >
              <Trash2 className="w-3 h-3" />
              <span>Hapus</span>
            </button>

            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 text-slate-500 hover:text-slate-800 text-[11px] font-bold transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] rounded-lg transition flex items-center gap-1 cursor-pointer shadow-sm hover:shadow"
              >
                <Save className="w-3 h-3 text-emerald-400" />
                <span>Simpan</span>
              </button>
            </div>
          </div>

        </form>
      </motion.div>
    </div>
  );
}
