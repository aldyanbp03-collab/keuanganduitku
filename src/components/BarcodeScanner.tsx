/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  Upload, 
  Barcode, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  StopCircle,
  Database,
  Sliders,
  CreditCard
} from 'lucide-react';

interface BarcodeScannerProps {
  onScanComplete: (extractedData: {
    title: string;
    amount: number;
    category: string;
    note: string;
  }) => void;
  onInstantSave: (extractedData: {
    title: string;
    amount: number;
    category: string;
    note: string;
    paymentSource: string;
  }) => void;
  creditCards: {
    id: string;
    cardName: string;
    lastFourDigits: string;
  }[];
}

export default function BarcodeScanner({ onScanComplete, onInstantSave, creditCards }: BarcodeScannerProps) {
  const [localPaymentSource, setLocalPaymentSource] = useState('Cash');
  const [isDragActive, setIsDragActive] = useState(false);
  const [scanningStatus, setScanningStatus] = useState<'idle' | 'camera_active' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Camera state
  const [hasCameraAccess, setHasCameraAccess] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Scan result state
  const [scanResult, setScanResult] = useState<{
    productName: string;
    barcode: string;
    estimatedPrice: number;
    category: string;
    notes: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stop camera when component unmounts
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setScanningStatus('camera_active');
    setErrorMessage('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setHasCameraAccess(true);
    } catch (err) {
      console.error('Camera access error:', err);
      setHasCameraAccess(false);
      setScanningStatus('idle');
      setErrorMessage('Gagal mengakses kamera. Silakan pilih opsi Unggah File Gambar.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const capturePhotoAndScan = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64Image = canvas.toDataURL('image/jpeg', 0.85);
      
      stopCamera();
      sendImageToBackend(base64Image);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result && typeof event.target.result === 'string') {
        sendImageToBackend(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const sendImageToBackend = async (base64Image: string) => {
    setScanningStatus('processing');
    setErrorMessage('');
    
    const token = localStorage.getItem('dk_token');
    if (!token) {
      setScanningStatus('error');
      setErrorMessage('Sesi tidak valid, silakan masuk kembali.');
      return;
    }

    try {
      const response = await fetch('/api/scan-barcode', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ image: base64Image })
      });

      if (!response.ok) {
        throw new Error('Server returned an error status.');
      }

      const data = await response.json();
      
      setScanResult(data);
      setScanningStatus('success');

    } catch (err: any) {
      console.error('Failed scanning barcode:', err);
      setScanningStatus('error');
      setErrorMessage(err.message || 'Gagal memproses gambar barcode.');
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const resetScanner = () => {
    stopCamera();
    setScanningStatus('idle');
    setScanResult(null);
    setErrorMessage('');
  };

  return (
    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 shadow-xs">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-rose-100 text-rose-600 rounded-xl">
          <Barcode className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-display font-semibold text-slate-800 text-sm">Pencatatan Instan via Barcode AI</h4>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {scanningStatus === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Split options: Camera scan vs Image upload */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={startCamera}
                className="flex flex-col items-center justify-center p-5 bg-white border border-slate-200 rounded-xl hover:border-rose-500 hover:bg-rose-50/5 transition duration-200 text-center cursor-pointer group"
              >
                <div className="p-3 bg-rose-50 text-rose-500 rounded-full group-hover:bg-rose-100 transition duration-200 mb-3">
                  <Camera className="w-6 h-6" />
                </div>
                <span className="text-sm font-semibold text-slate-800">Gunakan Kamera</span>
                <span className="text-xs text-slate-400 mt-1">Scan live dari kamera ponsel/laptop</span>
              </button>

              <button
                type="button"
                onClick={triggerFileSelect}
                className="flex flex-col items-center justify-center p-5 bg-white border border-slate-200 rounded-xl hover:border-rose-500 hover:bg-rose-50/5 transition duration-200 text-center cursor-pointer group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <div className="p-3 bg-rose-50 text-rose-500 rounded-full group-hover:bg-rose-100 transition duration-200 mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <span className="text-sm font-semibold text-slate-800">Unggah Foto Produk</span>
                <span className="text-xs text-slate-400 mt-1">Pilih gambar kemasan atau barcode produk</span>
              </button>
            </div>

            {/* Drag & Drop Area */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={triggerFileSelect}
              className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
                isDragActive
                  ? 'border-rose-500 bg-rose-50/50 scale-[0.99]'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-100/50'
              }`}
            >
              <p className="text-xs font-medium text-slate-500">
                Atau seret & letakkan berkas gambar kemasan/barcode di sini
              </p>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="flex items-start gap-2 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-150">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}
          </motion.div>
        )}

        {/* Live Camera Feed */}
        {scanningStatus === 'camera_active' && (
          <motion.div
            key="camera"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center space-y-4"
          >
            <div className="relative w-full max-w-sm rounded-xl overflow-hidden border border-slate-300 bg-black aspect-video flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                className="w-full h-full object-cover"
              />
              
              {/* Overlay Laser Scan Guide */}
              <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-0.5 bg-red-500 shadow-[0_0_8px_#ef4444,0_0_15px_#ef4444] animate-pulse" />
              
              {/* Scan box borders */}
              <div className="absolute inset-x-8 top-10 bottom-10 border-2 border-dashed border-white/40 rounded-lg flex items-center justify-center pointer-events-none">
                <span className="text-[10px] text-white/80 bg-black/50 px-2 py-1 rounded-md font-mono uppercase tracking-widest">Arahkan Barcode</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={capturePhotoAndScan}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-sm"
              >
                <Camera className="w-4 h-4" /> Ambil Foto & Analisis
              </button>
              
              <button
                type="button"
                onClick={resetScanner}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                <StopCircle className="w-4 h-4" /> Stop Kamera
              </button>
            </div>

            {/* Hidden canvas for video capturing */}
            <canvas ref={canvasRef} className="hidden" />
          </motion.div>
        )}

        {/* Processing State */}
        {scanningStatus === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white border border-slate-200/60 rounded-xl p-6 flex flex-col items-center justify-center min-h-[220px]"
          >
            <div className="relative mb-4">
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 animate-pulse">
                <RefreshCw className="w-7 h-7 animate-spin duration-3000" />
              </div>
            </div>
            
            <h5 className="font-semibold text-slate-800 text-sm mb-1 animate-pulse">AI Sedang Menganalisis...</h5>
            <p className="text-xs text-slate-400 max-w-xs text-center">Gemini AI sedang memindai barcode, mengenali nama produk, serta memetakan kategori harga produk.</p>
          </motion.div>
        )}

        {/* Scan Success View */}
        {scanningStatus === 'success' && scanResult && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="bg-rose-50/50 border border-rose-200 rounded-xl p-5 space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-rose-600 shrink-0" />
                <div>
                  <span className="text-[9px] font-bold text-rose-800 uppercase bg-rose-100/80 px-2 py-0.5 rounded-full">AI Barcode Terdeteksi</span>
                  <h5 className="font-semibold text-slate-800 text-sm mt-1 font-display">Produk Berhasil Diidentifikasi!</h5>
                </div>
              </div>
              <button
                type="button"
                onClick={resetScanner}
                className="text-xs text-slate-500 hover:text-slate-850 font-medium flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1 rounded-lg cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> Scan Lagi
              </button>
            </div>

            <div className="bg-white border border-rose-100 rounded-xl p-4 grid grid-cols-2 gap-3.5 shadow-2xs">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Produk Terdeteksi</span>
                <span className="text-xs font-bold text-slate-800 block truncate" title={scanResult.productName}>{scanResult.productName}</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Perkiraan Harga</span>
                <span className="text-xs font-extrabold text-rose-600 font-sans whitespace-nowrap">Rp {scanResult.estimatedPrice.toLocaleString('id-ID')}</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Kategori</span>
                <span className="text-[10px] font-semibold bg-slate-100 px-2 py-0.5 rounded-md text-slate-600 inline-block mt-0.5">{scanResult.category}</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">No. Barcode (EAN)</span>
                <span className="text-[11px] text-slate-500 block font-mono">{scanResult.barcode || 'Tidak Ada Barcode'}</span>
              </div>
            </div>

            {/* Payment Source Selection */}
            <div className="bg-white border border-slate-200/60 rounded-xl p-4 space-y-2.5 shadow-2xs">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Sumber Pembayaran (Pencatatan Instan)
              </label>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-50 text-rose-500 rounded-lg shrink-0">
                  <CreditCard className="w-4 h-4" />
                </div>
                <select
                  value={localPaymentSource}
                  onChange={(e) => setLocalPaymentSource(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-850 focus:border-rose-500 focus:outline-hidden transition"
                >
                  <option value="Cash">Tunai (Cash Wallet)</option>
                  <option value="Debit">Rekening Bank (Debit)</option>
                  {creditCards.map(c => (
                    <option key={c.id} value={c.id}>Kartu: {c.cardName} ({c.lastFourDigits})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  if (scanResult) {
                    onInstantSave({
                      title: scanResult.productName,
                      amount: scanResult.estimatedPrice,
                      category: scanResult.category,
                      note: `Pencatatan Instan via Barcode: [${scanResult.barcode || 'N/A'}]. ${scanResult.notes}`,
                      paymentSource: localPaymentSource
                    });
                  }
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl transition duration-200 shadow-sm cursor-pointer"
              >
                <Database className="w-4.5 h-4.5" /> Simpan Langsung ke DB
              </button>

              <button
                type="button"
                onClick={() => {
                  if (scanResult) {
                    onScanComplete({
                      title: scanResult.productName,
                      amount: scanResult.estimatedPrice,
                      category: scanResult.category,
                      note: `Barcode Terdeteksi: [${scanResult.barcode || 'N/A'}]. ${scanResult.notes}`
                    });
                  }
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-150 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition duration-200 cursor-pointer"
              >
                <Sliders className="w-4 h-4" /> Sesuaikan di Form Manual
              </button>
            </div>

            <p className="text-[9px] text-slate-400 text-center leading-relaxed">
              Pilih <strong>"Simpan Langsung ke DB"</strong> untuk membukukan pengeluaran ini secara instan ke database, atau <strong>"Sesuaikan di Form Manual"</strong> jika Anda perlu mengedit rincian belanja.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
