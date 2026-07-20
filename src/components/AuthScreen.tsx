/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Wallet, ShieldCheck, Mail, Lock, User, ArrowRight } from 'lucide-react';

interface AuthScreenProps {
  onLoginSuccess: (
    user: { name: string; email: string; avatarUrl: string; selectedMemberId: string },
    token: string
  ) => void;
}

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [customError, setCustomError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // States for database-registered accounts
  const [dbUsers, setDbUsers] = useState<{ id: string; name: string; email: string; avatarUrl: string }[]>([]);
  const [fetchingUsers, setFetchingUsers] = useState(false);

  const fetchDbUsers = async () => {
    setFetchingUsers(true);
    try {
      const res = await fetch('/api/auth/users');
      if (res.ok) {
        const data = await res.json();
        setDbUsers(data);
      }
    } catch (e) {
      console.error('Failed to fetch database users:', e);
    } finally {
      setFetchingUsers(false);
    }
  };

  useEffect(() => {
    if (authMode === 'login') {
      fetchDbUsers();
    }
  }, [authMode]);

  const handleSelectAccountLogin = async (userId: string) => {
    setLoading(true);
    setCustomError('');
    try {
      const response = await fetch('/api/auth/login-by-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Gagal masuk dengan pilihan akun.');
      }
      onLoginSuccess(data.user, data.token);
    } catch (err: any) {
      setCustomError(err.message || 'Gagal masuk dengan pilihan akun.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustomError('');
    setSuccessMsg('');

    if (authMode === 'login') {
      if (!email || !password) {
        setCustomError('Silakan isi email dan kata sandi Anda.');
        return;
      }
      
      setLoading(true);
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Gagal masuk. Silakan periksa kembali email dan sandi Anda.');
        }
        onLoginSuccess(data.user, data.token);
      } catch (err: any) {
        setCustomError(err.message || 'Gagal tersambung ke server.');
      } finally {
        setLoading(false);
      }
    } else if (authMode === 'register') {
      if (!fullName || !email || !password) {
        setCustomError('Semua kolom pendaftaran wajib diisi.');
        return;
      }

      setLoading(true);
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: fullName, email, password })
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Pendaftaran gagal.');
        }
        setSuccessMsg('Pendaftaran berhasil! Menyinkronkan dan menyiapkan dompet baru Anda...');
        setTimeout(() => {
          setAuthMode('login');
          setSuccessMsg('');
          setEmail(email);
        }, 1500);
      } catch (err: any) {
        setCustomError(err.message || 'Gagal mendaftar akun baru.');
      } finally {
        setLoading(false);
      }
    } else {
      if (!email) {
        setCustomError('Silakan masukkan email Anda.');
        return;
      }
      setSuccessMsg('Tautan pemulihan kata sandi telah dikirim ke email Anda.');
    }
  };

  return (
    <div className="min-h-screen overflow-y-auto flex flex-col items-center justify-center bg-slate-900 p-4 sm:p-6 relative overflow-hidden font-sans py-8 landscape:py-4">
      
      {/* Decorative ambient blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full filter blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full filter blur-3xl animate-pulse duration-4000" />

      <div className="w-full max-w-md z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl mb-3.5 shadow-lg">
            <Wallet className="w-8 h-8" />
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
            Dompet<span className="text-emerald-400">Kita</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            Pengelolaan Keuangan Pribadi & Keluarga secara Terintegrasi
          </p>
        </div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl"
        >
          {authMode === 'login' && (
            <>
              <h2 className="font-display font-bold text-xl text-white mb-1">Pilih Akun & Masuk Langsung</h2>
              <p className="text-slate-400 text-xs mb-6">Silakan pilih salah satu akun dari database untuk masuk secara instan.</p>

              {customError && (
                <div className="mb-4 p-3 bg-red-950/40 border border-red-900/60 text-red-300 text-xs rounded-xl flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{customError}</span>
                </div>
              )}

              {successMsg && (
                <div className="mb-4 p-3 bg-emerald-950/40 border border-emerald-900/60 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircleIcon />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* LIST OF DATABASE ACCOUNTS */}
              <div className="mb-6">
                {fetchingUsers ? (
                  <div className="flex justify-center py-4">
                    <span className="text-xs text-slate-400 animate-pulse">Mengambil daftar akun dari database...</span>
                  </div>
                ) : dbUsers.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
                    {dbUsers.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => handleSelectAccountLogin(u.id)}
                        className="flex items-center gap-3 p-3 bg-slate-900/60 border border-slate-700/50 rounded-xl hover:border-emerald-500 hover:bg-slate-900/90 transition text-left cursor-pointer group"
                      >
                        <img
                          src={u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                          alt={u.name}
                          className="w-10 h-10 rounded-full border border-slate-700 group-hover:border-emerald-500 shadow-xs object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-200 group-hover:text-white block truncate">
                            {u.name}
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {u.email}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-amber-950/30 border border-amber-900/40 rounded-xl text-amber-200 text-xs text-center space-y-2">
                    <p className="font-semibold">⚠️ Belum ada akun di database.</p>
                    <p className="text-slate-400">Silakan klik "Daftar Sekarang" di bawah untuk membuat akun baru pertama Anda!</p>
                  </div>
                )}
              </div>

              {/* Traditional Credentials Splitter */}
              <div className="relative flex py-3 items-center">
                <div className="flex-grow border-t border-slate-700/60"></div>
                <span className="flex-shrink mx-3 text-slate-500 text-[10px] font-semibold uppercase tracking-wider">Atau Masuk manual</span>
                <div className="flex-grow border-t border-slate-700/60"></div>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4 mt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Alamat Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@email.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden transition"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Kata Sandi</label>
                    <button
                      type="button"
                      onClick={() => setAuthMode('forgot')}
                      className="text-xs font-medium text-emerald-400 hover:text-emerald-300 hover:underline"
                    >
                      Lupa sandi?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-800 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 mt-2 cursor-pointer"
                >
                  {loading ? 'Memproses...' : 'Masuk ke Dompet'} <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-xs text-slate-400">
                  Belum punya akun?{' '}
                  <button
                    onClick={() => setAuthMode('register')}
                    className="font-semibold text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer"
                  >
                    Daftar Sekarang
                  </button>
                </p>
              </div>
            </>
          )}

          {authMode === 'register' && (
            <>
              <h2 className="font-display font-bold text-xl text-white mb-1">Daftar Akun Baru</h2>
              <p className="text-slate-400 text-xs mb-6">Mulai kelola tabungan bersama keluarga Anda secara sehat.</p>

              {customError && (
                <div className="mb-4 p-3 bg-red-950/40 border border-red-900/60 text-red-300 text-xs rounded-xl flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{customError}</span>
                </div>
              )}

              {successMsg && (
                <div className="mb-4 p-3 bg-emerald-950/40 border border-emerald-900/60 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircleIcon />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Nama Lengkap</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Budi Setiawan"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Alamat Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@email.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Kata Sandi</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimal 8 karakter"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-800 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 mt-2 cursor-pointer"
                >
                  {loading ? 'Mendaftarkan...' : 'Daftar Sekarang'} <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-xs text-slate-400">
                  Sudah memiliki akun?{' '}
                  <button
                    onClick={() => setAuthMode('login')}
                    className="font-semibold text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer"
                  >
                    Masuk Sekarang
                  </button>
                </p>
              </div>
            </>
          )}

          {authMode === 'forgot' && (
            <>
              <h2 className="font-display font-bold text-xl text-white mb-1">Atur Ulang Sandi</h2>
              <p className="text-slate-400 text-xs mb-6">Masukkan email Anda untuk menerima instruksi pemulihan.</p>

              {customError && (
                <div className="mb-4 p-3 bg-red-950/40 border border-red-900/60 text-red-300 text-xs rounded-xl flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{customError}</span>
                </div>
              )}

              {successMsg && (
                <div className="mb-4 p-3 bg-emerald-950/40 border border-emerald-900/60 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircleIcon />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Alamat Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@email.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden transition"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 mt-2 cursor-pointer"
                >
                  Kirim Tautan Atur Ulang <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => setAuthMode('login')}
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer"
                >
                  Kembali ke Halaman Masuk
                </button>
              </div>
            </>
          )}
        </motion.div>

        {/* Footer info */}
        <p className="text-center text-slate-500 text-xs mt-8">
          Keamanan dilindungi dengan HTTPS dan enkripsi database cloud.
        </p>
      </div>
    </div>
  );
}

// Small inline Helper SVG
function CheckCircleIcon() {
  return (
    <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
