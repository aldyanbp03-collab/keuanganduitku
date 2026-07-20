/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, Scan, FileText, CheckCircle2, AlertCircle, RefreshCw, Eye } from 'lucide-react';

interface OcrScannerProps {
  onScanComplete: (extractedData: {
    title: string;
    amount: number;
    category: string;
    note: string;
  }) => void;
}

interface PresetReceipt {
  id: string;
  merchantName: string;
  total: number;
  category: string;
  items: string[];
  date: string;
  fileName: string;
}

const PRESET_RECEIPTS: PresetReceipt[] = [
  {
    id: 'receipt-1',
    merchantName: 'KFC Kemang',
    total: 84500,
    category: 'Makanan & Minuman',
    items: ['2x Super Besar 2', '1x French Fries L', '1x Pepsi Blue'],
    date: '2026-07-19',
    fileName: 'struk_kfc_kemang.jpg'
  },
  {
    id: 'receipt-2',
    merchantName: 'Alfamart Ampera',
    total: 148200,
    category: 'Belanja Bulanan',
    items: ['1x Rinso Liquid 800ml', '2x Indomie Goreng Cup', '1x Aqua Dus', '2x Cadbury Dairy'],
    date: '2026-07-18',
    fileName: 'alfamart_belanja_harian.png'
  },
  {
    id: 'receipt-3',
    merchantName: 'Cinema XXI Plaza Senayan',
    total: 95000,
    category: 'Hiburan & Liburan',
    items: ['2x Tiket Nonton IMAX', '1x Popcorn Large', '1x Coca Cola'],
    date: '2026-07-17',
    fileName: 'cinema_xxi_95k.png'
  }
];

export default function OcrScanner({ onScanComplete }: OcrScannerProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [scanningStatus, setScanningStatus] = useState<'idle' | 'uploading' | 'scanning' | 'success' | 'error'>('idle');
  const [scanProgress, setScanProgress] = useState(0);
  const [scanningSteps, setScanningSteps] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<PresetReceipt | null>(null);
  const [fileName, setFileName] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const processMockScan = (preset: PresetReceipt) => {
    setSelectedPreset(preset);
    setFileName(preset.fileName);
    setScanningStatus('uploading');
    setScanningSteps([]);
    setScanProgress(0);

    // Step 1: Uploading
    setTimeout(() => {
      setScanningStatus('scanning');
      addStep('Mengunggah berkas struk...');
      setScanProgress(20);
      
      // Step 2: Extracting Merchant & Date
      setTimeout(() => {
        addStep(`AI mendeteksi Merchant: ${preset.merchantName}`);
        setScanProgress(50);
        
        // Step 3: Extracting Items
        setTimeout(() => {
          addStep(`Membaca item: ${preset.items.slice(0, 2).join(', ')}...`);
          setScanProgress(80);
          
          // Step 4: Finalizing total
          setTimeout(() => {
            addStep(`Ekstraksi sukses! Nominal: Rp ${preset.total.toLocaleString('id-ID')}`);
            setScanProgress(100);
            setScanningStatus('success');
            
            // Pass complete data to form
            onScanComplete({
              title: preset.merchantName,
              amount: preset.total,
              category: preset.category,
              note: `Simulasi AI Scan dari struk: ${preset.items.join(', ')}`
            });
          }, 1000);
        }, 1200);
      }, 1000);
    }, 800);
  };

  const addStep = (text: string) => {
    setCurrentStep(text);
    setScanningSteps(prev => [...prev, text]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFileSelected(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      handleFileSelected(file);
    }
  };

  const handleFileSelected = (file: File) => {
    // Generate a matching mock transaction based on the filename or generic
    const nameLower = file.name.toLowerCase();
    let selectedMock: PresetReceipt = {
      id: 'custom-receipt',
      merchantName: 'Supermarket Lokal',
      total: 125000,
      category: 'Belanja Bulanan',
      items: ['Belanja harian', 'Bahan masakan'],
      date: '2026-07-19',
      fileName: file.name
    };

    if (nameLower.includes('kfc') || nameLower.includes('makan') || nameLower.includes('food')) {
      selectedMock = { ...PRESET_RECEIPTS[0], fileName: file.name };
    } else if (nameLower.includes('alfa') || nameLower.includes('indo') || nameLower.includes('belanja')) {
      selectedMock = { ...PRESET_RECEIPTS[1], fileName: file.name };
    } else if (nameLower.includes('xxi') || nameLower.includes('nonton') || nameLower.includes('bioskop') || nameLower.includes('tiket')) {
      selectedMock = { ...PRESET_RECEIPTS[2], fileName: file.name };
    }

    processMockScan(selectedMock);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const resetScanner = () => {
    setScanningStatus('idle');
    setScanningSteps([]);
    setScanProgress(0);
    setSelectedPreset(null);
    setFileName('');
  };

  return (
    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 shadow-xs">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
          <Scan className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-display font-semibold text-slate-800 text-sm">Fitur Catat Instan dengan AI OCR</h4>
          <p className="text-xs text-slate-500">Unggah foto struk belanja Anda, biarkan AI DompetKita mencatatnya secara otomatis.</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {scanningStatus === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {/* Drag & Drop Area */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={triggerFileSelect}
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
                isDragActive
                  ? 'border-emerald-500 bg-emerald-50/50 scale-[0.99]'
                  : 'border-slate-300 hover:border-slate-400 hover:bg-slate-100/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
              <Upload className="w-10 h-10 text-slate-400 mb-3" />
              <p className="text-sm font-medium text-slate-700">Tarik struk ke sini atau klik untuk memilih berkas</p>
              <p className="text-xs text-slate-400 mt-1">Mendukung file gambar PNG, JPG, JPEG (maksimal 5MB)</p>
            </div>

            {/* Presets Demo - Sleek Vertical Stack */}
            <div className="mt-5">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Coba Cepat dengan Contoh Struk (Preset):
              </span>
              <div className="flex flex-col gap-2">
                {PRESET_RECEIPTS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => processMockScan(preset)}
                    className="flex items-center justify-between p-3 bg-white border border-slate-200/80 rounded-xl hover:border-emerald-500 hover:bg-emerald-50/10 transition-all text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-100 transition-colors shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">{preset.category}</span>
                        <span className="text-sm font-semibold text-slate-850 truncate block group-hover:text-emerald-700">
                          {preset.merchantName}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-bold text-slate-900 font-mono">
                        Rp {preset.total.toLocaleString('id-ID')}
                      </span>
                      <span className="text-[10px] block text-slate-400 font-mono mt-0.5">{preset.date}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Uploading & Scanning Overlay */}
        {(scanningStatus === 'uploading' || scanningStatus === 'scanning') && (
          <motion.div
            key="scanning"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white border border-slate-200/60 rounded-xl p-6 flex flex-col items-center justify-center relative overflow-hidden min-h-[260px]"
          >
            {/* Holographic glowing scanner line */}
            {scanningStatus === 'scanning' && (
              <div className="absolute inset-x-0 top-0 h-1 bg-emerald-500 shadow-[0_0_15px_#10b981,0_0_30px_#10b981] animate-[bounce_3s_infinite_ease-in-out]" />
            )}

            <div className="relative mb-4">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 animate-pulse">
                <RefreshCw className="w-7 h-7 animate-spin duration-3000" />
              </div>
            </div>

            <h5 className="font-semibold text-slate-800 text-sm mb-1">
              {scanningStatus === 'uploading' ? 'Mengunggah Berkas...' : 'AI Membaca Struk...'}
            </h5>
            <p className="text-xs text-slate-400 mb-4 font-mono">{fileName}</p>

            {/* Progress Bar */}
            <div className="w-full max-w-xs bg-slate-100 rounded-full h-1.5 mb-4">
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${scanProgress}%` }}
              />
            </div>

            {/* Extraction Steps logs */}
            <div className="w-full max-w-sm bg-slate-50 border border-slate-100 rounded-lg p-3 text-left font-mono text-[10px] leading-relaxed text-slate-600 max-h-24 overflow-y-auto">
              <span className="text-slate-400 font-semibold block border-b border-slate-100 pb-1 mb-1">LOG DEKODER AI:</span>
              {scanningSteps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-1.5">
                  <span className="text-emerald-500">✔</span>
                  <span>{step}</span>
                </div>
              ))}
              {currentStep && (
                <div className="flex items-center gap-1.5 text-emerald-600 font-semibold animate-pulse">
                  <span className="animate-spin text-xs">⟳</span>
                  <span>{currentStep}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Scan Success View */}
        {scanningStatus === 'success' && selectedPreset && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-5"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase bg-emerald-100/80 px-2 py-0.5 rounded-full">AI Ekstraksi Sukses</span>
                  <h5 className="font-semibold text-slate-800 text-sm mt-1">Data Struk Berhasil Disalin ke Formulir!</h5>
                </div>
              </div>
              <button
                type="button"
                onClick={resetScanner}
                className="text-xs text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1 rounded-lg"
              >
                <RefreshCw className="w-3 h-3" /> Scan Lagi
              </button>
            </div>

            <div className="bg-white border border-emerald-100 rounded-xl p-4 grid grid-cols-2 gap-3.5 shadow-2xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Merchant / Toko</span>
                <span className="text-sm font-semibold text-slate-800">{selectedPreset.merchantName}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Pengeluaran</span>
                <span className="text-sm font-bold text-emerald-600 font-mono">Rp {selectedPreset.total.toLocaleString('id-ID')}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kategori Terpilih</span>
                <span className="text-xs font-semibold bg-slate-100 px-2.5 py-0.5 rounded-md text-slate-600 inline-block mt-0.5">{selectedPreset.category}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Daftar Belanja</span>
                <span className="text-[11px] text-slate-500 block truncate" title={selectedPreset.items.join(', ')}>
                  {selectedPreset.items.join(', ')}
                </span>
              </div>
            </div>
            
            <p className="text-[11px] text-slate-500 mt-3 text-center">
              Silakan sesuaikan form nominal, tanggal, atau ubah sumber pembayaran di bawah, lalu klik <strong>"Simpan Pengeluaran"</strong>.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
