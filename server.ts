import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import admin from 'firebase-admin';
import { getApps, initializeApp, getApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { serviceAccount } from './firebase-service-account.js';

const PORT = 3000;

// Initialize Firebase Admin with dynamic fallback to local persistent file store
let db: FirebaseFirestore.Firestore;

class PersistentMockFirestore {
  private filePath = process.env.VERCEL
    ? path.join('/tmp', 'database-mock.json')
    : path.join(process.cwd(), 'database-mock.json');
  private collections: Record<string, Record<string, any>> = {};

  constructor() {
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const fileContent = fs.readFileSync(this.filePath, 'utf8');
        this.collections = JSON.parse(fileContent);
        console.log('Loaded mock database successfully from local storage.');
      } else {
        console.log('No local mock database file found. Initializing empty.');
      }
    } catch (err) {
      console.error('Failed to load local mock database:', err);
    }
  }

  private save() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.collections, null, 2), 'utf8');
    } catch (err) {
      console.error('Failed to save local mock database:', err);
    }
  }

  collection(name: string) {
    if (!this.collections[name]) {
      this.collections[name] = {};
    }
    const col = this.collections[name];
    return {
      doc: (id: string) => ({
        get: async () => ({
          exists: col[id] !== undefined,
          data: () => col[id] ? { ...col[id] } : undefined,
        }),
        set: async (data: any, opts?: any) => {
          if (opts?.merge && col[id]) {
            col[id] = { ...col[id], ...data };
          } else {
            col[id] = { ...data };
          }
          this.save();
        },
        update: async (data: any) => {
          if (col[id]) {
            col[id] = { ...col[id], ...data };
            this.save();
          }
        },
        delete: async () => {
          delete col[id];
          this.save();
        }
      }),
      where: (field: string, op: string, val: any) => ({
        get: async () => {
          const docs = Object.entries(col).filter(([key, item]) => {
            if (op === '==') return item[field] === val;
            return false;
          });
          return {
            docs: docs.map(([key, d]) => ({
              id: key,
              data: () => ({ ...d })
            }))
          };
        }
      }),
      get: async () => ({
        docs: Object.entries(col).map(([key, d]) => ({
          id: key,
          data: () => ({ ...d })
        }))
      })
    } as any;
  }
}

async function initializeFirebase() {
  if (db) {
    return;
  }

  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    let projectId = 'gen-lang-client-0053714344';
    let databaseId = 'ai-studio-dompetkita-8178a977-dd36-4d01-ac6a-1a04aaf9886e';

    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (config.projectId) projectId = config.projectId;
        if (config.firestoreDatabaseId) databaseId = config.firestoreDatabaseId;
      } catch (e) {
        console.error('Error parsing firebase-applet-config.json:', e);
      }
    }

    // Initialize Admin if not already initialized
    let app;
    if (getApps().length === 0) {
      let initConfig: any = {
        projectId: projectId,
      };

      let hasSA = false;
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        try {
          const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
          initConfig.credential = cert(sa);
          hasSA = true;
          console.log('Using Firebase Service Account from environment variables.');
        } catch (e) {
          console.error('Error parsing FIREBASE_SERVICE_ACCOUNT env var:', e);
        }
      }

      if (!hasSA && serviceAccount) {
        try {
          initConfig.credential = cert(serviceAccount as any);
          console.log('Using fallback Firebase Service Account from firebase-service-account.ts.');
        } catch (e) {
          console.error('Error using fallback service account:', e);
        }
      }

      app = initializeApp(initConfig);
    } else {
      app = getApp();
    }

    // Use getFirestore with custom databaseId
    const tempDb = getFirestore(app, databaseId);
    
    // Eagerly verify write permissions
    console.log('Verifying cloud database write permissions...');
    const testId = 'test_' + Date.now();
    await tempDb.collection('test_connection').doc(testId).set({ timestamp: new Date().toISOString() });
    await tempDb.collection('test_connection').doc(testId).delete();
    
    db = tempDb;
    console.log(`Firebase Admin initialized successfully targeting Firestore database: ${databaseId}`);
  } catch (error) {
    console.error('Failed to initialize or write to Firebase Admin, using local persistent fallback store:', error);
    db = new PersistentMockFirestore() as any;
  }
}


// Helpers for Auth
function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

// Default Data Seed Helper
async function seedUserData(userId: string) {
  const DEFAULT_CATEGORIES = [
    { id: 'cat-in-1', name: 'Gaji', type: 'income', iconName: 'Briefcase', color: 'bg-emerald-500' },
    { id: 'cat-in-2', name: 'Bonus & Insentif', type: 'income', iconName: 'Award', color: 'bg-teal-500' },
    { id: 'cat-in-3', name: 'Investasi', type: 'income', iconName: 'TrendingUp', color: 'bg-cyan-500' },
    { id: 'cat-in-4', name: 'Lain-lain', type: 'income', iconName: 'PlusCircle', color: 'bg-slate-500' },
    { id: 'cat-ex-1', name: 'Makanan & Minuman', type: 'expense', iconName: 'Utensils', color: 'bg-amber-500' },
    { id: 'cat-ex-2', name: 'Belanja Bulanan', type: 'expense', iconName: 'ShoppingBag', color: 'bg-blue-500' },
    { id: 'cat-ex-3', name: 'Transportasi', type: 'expense', iconName: 'Car', color: 'bg-indigo-500' },
    { id: 'cat-ex-4', name: 'Tagihan & Utilitas', type: 'expense', iconName: 'Receipt', color: 'bg-orange-500' },
    { id: 'cat-ex-5', name: 'Hiburan & Liburan', type: 'expense', iconName: 'Gamepad2', color: 'bg-pink-500' },
    { id: 'cat-ex-6', name: 'Pendidikan', type: 'expense', iconName: 'GraduationCap', color: 'bg-violet-500' },
    { id: 'cat-ex-7', name: 'Kesehatan', type: 'expense', iconName: 'HeartPulse', color: 'bg-red-500' },
    { id: 'cat-ex-8', name: 'Lain-lain', type: 'expense', iconName: 'HelpCircle', color: 'bg-slate-500' }
  ];

  const DEFAULT_SAVING_GOALS = [
    { id: 'goal-1', title: 'DP Rumah Baru 🏠', targetAmount: 150000000, currentAmount: 25000000, deadline: '2027-12-31', status: 'active' },
    { id: 'goal-2', title: 'Dana Darurat 🎯', targetAmount: 20000000, currentAmount: 5000000, deadline: '2026-12-31', status: 'active' },
    { id: 'goal-3', title: 'Liburan Akhir Tahun ✈', targetAmount: 15000000, currentAmount: 15000000, deadline: '2026-12-15', status: 'completed' }
  ];

  const DEFAULT_CREDIT_CARDS = [
    { id: 'card-1', cardName: 'BCA Everyday Card', lastFourDigits: '4321', limitAmount: 15000000, usedAmount: 2450000, dueDate: 'Tiap Tanggal 15', color: 'from-blue-600 to-indigo-800' },
    { id: 'card-2', cardName: 'Mandiri Signature', lastFourDigits: '8765', limitAmount: 30000000, usedAmount: 1200000, dueDate: 'Tiap Tanggal 20', color: 'from-slate-800 to-slate-950' }
  ];

  const DEFAULT_FAMILY_MEMBERS = [
    { id: 'fam-1', name: 'Rian (Ayah)', monthlyLimit: 8000000, monthlySpent: 3500000, avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
    { id: 'fam-2', name: 'Siti (Ibu)', monthlyLimit: 10000000, monthlySpent: 4200000, avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
    { id: 'fam-3', name: 'Adit (Anak)', monthlyLimit: 1500000, monthlySpent: 850000, avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80' }
  ];

  const DEFAULT_TRANSACTIONS = [
    { id: 'tx-1', title: 'Gaji Bulanan PT ABC', amount: 15000000, type: 'income', category: 'Gaji', date: new Date().toISOString().split('T')[0], note: 'Gaji pokok bulanan', paymentSource: 'Debit', familyMemberId: 'fam-1' },
    { id: 'tx-2', title: 'Belanja Bulanan Superindo', amount: 1250000, type: 'expense', category: 'Belanja Bulanan', date: new Date().toISOString().split('T')[0], note: 'Kebutuhan pokok dapur', paymentSource: 'Debit', familyMemberId: 'fam-2' },
    { id: 'tx-3', title: 'Starbucks Coffee', amount: 85000, type: 'expense', category: 'Makanan & Minuman', date: new Date().toISOString().split('T')[0], note: 'Kopi sore santai', paymentSource: 'card-1', familyMemberId: 'fam-1', relatedCreditCardId: 'card-1' },
    { id: 'tx-4', title: 'Alokasi DP Rumah Baru', amount: 5000000, type: 'expense', category: 'Lain-lain', date: new Date().toISOString().split('T')[0], note: 'Transfer bulanan ke tabungan impian', paymentSource: 'Debit', familyMemberId: 'fam-1', relatedSavingGoalId: 'goal-1' }
  ];

  const DEFAULT_NOTIFICATIONS = [
    { id: 'notif-1', title: 'Registrasi Berhasil', message: 'Selamat datang di DompetKita! Atur sasaran tabungan dan anggaran bulanan keluarga Anda sekarang.', date: new Date().toISOString().split('T')[0], read: false, type: 'success' }
  ];

  const DEFAULT_SETTINGS = {
    language: 'id',
    currency: 'IDR',
    pushNotifications: true,
    budgetWarningLimit: 80,
    darkMode: false
  };

  // Seed settings
  await db.collection('settings').doc(userId).set(DEFAULT_SETTINGS);

  // Seed others using batched writes or sequential loops
  for (const cat of DEFAULT_CATEGORIES) {
    await db.collection('categories').doc(`${userId}_${cat.id}`).set({ ...cat, userId });
  }
  for (const goal of DEFAULT_SAVING_GOALS) {
    await db.collection('saving_goals').doc(`${userId}_${goal.id}`).set({ ...goal, userId });
  }
  for (const card of DEFAULT_CREDIT_CARDS) {
    await db.collection('credit_cards').doc(`${userId}_${card.id}`).set({ ...card, userId });
  }
  for (const fam of DEFAULT_FAMILY_MEMBERS) {
    await db.collection('family_members').doc(`${userId}_${fam.id}`).set({ ...fam, userId });
  }
  for (const tx of DEFAULT_TRANSACTIONS) {
    await db.collection('transactions').doc(`${userId}_${tx.id}`).set({ ...tx, userId });
  }
  for (const notif of DEFAULT_NOTIFICATIONS) {
    await db.collection('notifications').doc(`${userId}_${notif.id}`).set({ ...notif, userId });
  }
}

async function purgeDemoData() {
  try {
    const snap = await db.collection('users').get();
    for (const doc of snap.docs) {
      const data = doc.data();
      if (data.isDemo || doc.id.startsWith('usr_demo_') || (data.email && data.email.endsWith('@dompetkita.id'))) {
        console.log(`Purging demo user: ${doc.id}`);
        await doc.ref.delete();
      }
    }
    
    const colList = ['transactions', 'saving_goals', 'credit_cards', 'family_members', 'categories', 'notifications', 'settings'];
    for (const colName of colList) {
      const colSnap = await db.collection(colName).get();
      for (const doc of colSnap.docs) {
        const data = doc.data();
        if (doc.id.startsWith('usr_demo_') || (data.userId && data.userId.startsWith('usr_demo_'))) {
          await doc.ref.delete();
        }
      }
    }
    console.log('Purged demo users successfully.');
  } catch (err) {
    console.error('Failed to purge demo users on start:', err);
  }
}

const app = express();
app.use(express.json());

let initialized = false;
let initPromise: Promise<void> | null = null;

async function doInitialization() {
  await initializeFirebase();
  await purgeDemoData();
}

app.use(async (req, res, next) => {
  if (!initialized) {
    if (!initPromise) {
      initPromise = doInitialization().then(() => {
        initialized = true;
      });
    }
    await initPromise;
  }
  next();
});

// Middleware Auth Checker
const requireAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Sesi kedaluwarsa atau tidak valid. Silakan masuk kembali.' });
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Sesi kedaluwarsa atau tidak valid. Silakan masuk kembali.' });
    }
    
    // Verify that user exists in Firestore
    const userDoc = await db.collection('users').doc(token).get();
    if (!userDoc.exists) {
      return res.status(401).json({ error: 'Pengguna tidak ditemukan.' });
    }

    req.body.currentUserId = token;
    next();
  };

  // Auth APIs
  app.post('/api/auth/register', async (req, res) => {
    const { name, email, password, avatarUrl } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nama, Email, dan Kata Sandi wajib diisi.' });
    }

    const emailNormalized = email.toLowerCase().trim();
    
    try {
      // Check if user exists
      const existingUserQuery = await db.collection('users').where('email', '==', emailNormalized).get();
      if (existingUserQuery.docs.length > 0) {
        return res.status(400).json({ error: 'Alamat email ini sudah terdaftar.' });
      }

      const salt = generateSalt();
      const passwordHash = hashPassword(password, salt);
      const userId = 'usr_' + crypto.randomUUID();

      const newUser = {
        id: userId,
        name,
        email: emailNormalized,
        avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        salt,
        passwordHash,
        selectedMemberId: 'fam-1',
        createdAt: new Date().toISOString()
      };

      await db.collection('users').doc(userId).set(newUser);
      
      // Seed original default data for newly registered user so they have a fully ready experience!
      await seedUserData(userId);

      res.status(201).json({
        message: 'Registrasi berhasil!',
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          avatarUrl: newUser.avatarUrl,
          selectedMemberId: 'fam-1'
        }
      });
    } catch (err: any) {
      console.error('Registration error:', err);
      res.status(500).json({ error: 'Terjadi kesalahan pada server saat pendaftaran.' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan kata sandi wajib diisi.' });
    }

    const emailNormalized = email.toLowerCase().trim();

    try {
      // Find user
      const userQuery = await db.collection('users').where('email', '==', emailNormalized).get();
      if (userQuery.docs.length === 0) {
        return res.status(400).json({ error: 'Email atau kata sandi Anda salah.' });
      }

      const userDoc = userQuery.docs[0];
      const userData = userDoc.data();

      // Check password
      const calculatedHash = hashPassword(password, userData.salt);
      if (calculatedHash !== userData.passwordHash) {
        return res.status(400).json({ error: 'Email atau kata sandi Anda salah.' });
      }

      res.json({
        token: userData.id,
        user: {
          name: userData.name,
          email: userData.email,
          avatarUrl: userData.avatarUrl,
          selectedMemberId: userData.selectedMemberId || 'fam-1'
        }
      });
    } catch (err: any) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Terjadi kesalahan sistem saat masuk.' });
    }
  });

  // Get all registered users from the database for account selection
  app.get('/api/auth/users', async (req, res) => {
    try {
      const usersSnap = await db.collection('users').get();
      const list = usersSnap.docs
        .map(doc => doc.data())
        .filter(u => !u.isDemo && !u.id.startsWith('usr_demo_') && !u.email.endsWith('@dompetkita.id'))
        .map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          avatarUrl: u.avatarUrl
        }));
      res.json(list);
    } catch (err) {
      console.error('Failed to fetch registered users:', err);
      res.status(500).json({ error: 'Gagal mengambil daftar pengguna.' });
    }
  });

  // Login instantly using user ID from the selection list
  app.post('/api/auth/login-by-id', async (req, res) => {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'User ID wajib diisi.' });
    }

    try {
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
      }

      const userData = userDoc.data()!;
      res.json({
        token: userData.id,
        user: {
          name: userData.name,
          email: userData.email,
          avatarUrl: userData.avatarUrl,
          selectedMemberId: userData.selectedMemberId || 'fam-1'
        }
      });
    } catch (err: any) {
      console.error('Login by ID error:', err);
      res.status(500).json({ error: 'Gagal masuk dengan pilihan akun.' });
    }
  });

  // Fully delete user profile and all associated data from the database
  app.delete('/api/auth/delete-account', requireAuth, async (req, res) => {
    const userId = req.body.currentUserId;
    try {
      // Delete core user doc
      await db.collection('users').doc(userId).delete();
      // Delete settings
      await db.collection('settings').doc(userId).delete();
      
      // Delete user's transactions
      const txs = await db.collection('transactions').get();
      for (const doc of txs.docs) {
        if (doc.id.startsWith(`${userId}_`)) {
          await doc.ref.delete();
        }
      }
      
      // Delete user's saving goals
      const goals = await db.collection('saving_goals').get();
      for (const doc of goals.docs) {
        if (doc.id.startsWith(`${userId}_`)) {
          await doc.ref.delete();
        }
      }

      // Delete user's credit cards
      const cards = await db.collection('credit_cards').get();
      for (const doc of cards.docs) {
        if (doc.id.startsWith(`${userId}_`)) {
          await doc.ref.delete();
        }
      }

      // Delete family members
      const members = await db.collection('family_members').get();
      for (const doc of members.docs) {
        if (doc.id.startsWith(`${userId}_`)) {
          await doc.ref.delete();
        }
      }

      // Delete categories
      const categories = await db.collection('categories').get();
      for (const doc of categories.docs) {
        if (doc.id.startsWith(`${userId}_`)) {
          await doc.ref.delete();
        }
      }

      // Delete notifications
      const notifications = await db.collection('notifications').get();
      for (const doc of notifications.docs) {
        if (doc.id.startsWith(`${userId}_`)) {
          await doc.ref.delete();
        }
      }

      res.json({ success: true });
    } catch (err) {
      console.error('Error deleting account:', err);
      res.status(500).json({ error: 'Gagal menghapus seluruh data akun dari database.' });
    }
  });

  app.get('/api/auth/me', requireAuth, async (req, res) => {
    const userId = req.body.currentUserId;
    try {
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        return res.status(404).json({ error: 'Profil tidak ditemukan.' });
      }
      const data = userDoc.data()!;
      res.json({
        user: {
          name: data.name,
          email: data.email,
          avatarUrl: data.avatarUrl,
          selectedMemberId: data.selectedMemberId || 'fam-1'
        }
      });
    } catch (err) {
      res.status(500).json({ error: 'Gagal mengambil data profil.' });
    }
  });

  // Settings APIs
  app.get('/api/settings', requireAuth, async (req, res) => {
    const userId = req.body.currentUserId;
    try {
      const settingsDoc = await db.collection('settings').doc(userId).get();
      if (!settingsDoc.exists) {
        return res.json({ language: 'id', currency: 'IDR', pushNotifications: true, budgetWarningLimit: 80, darkMode: false });
      }
      res.json(settingsDoc.data());
    } catch (err) {
      res.status(500).json({ error: 'Gagal mengambil setelan.' });
    }
  });

  app.post('/api/settings', requireAuth, async (req, res) => {
    const userId = req.body.currentUserId;
    const { language, currency, pushNotifications, budgetWarningLimit, darkMode } = req.body;
    try {
      const payload = { language, currency, pushNotifications, budgetWarningLimit, darkMode: !!darkMode };
      await db.collection('settings').doc(userId).set(payload, { merge: true });
      res.json({ success: true, settings: payload });
    } catch (err) {
      res.status(500).json({ error: 'Gagal memperbarui setelan.' });
    }
  });

  // Transactions CRUD
  app.get('/api/transactions', requireAuth, async (req, res) => {
    const userId = req.body.currentUserId;
    try {
      const snap = await db.collection('transactions').where('userId', '==', userId).get();
      const list = snap.docs.map(doc => {
        const d = doc.data();
        const { userId: _, ...tx } = d;
        return tx;
      });
      // Sort by date descending
      list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      res.json(list);
    } catch (err) {
      res.status(500).json({ error: 'Gagal mengambil transaksi.' });
    }
  });

  app.post('/api/transactions', requireAuth, async (req, res) => {
    const userId = req.body.currentUserId;
    const tx = req.body;
    delete tx.currentUserId;
    
    if (!tx.id) tx.id = 'tx_' + crypto.randomUUID();
    tx.userId = userId;

    try {
      await db.collection('transactions').doc(`${userId}_${tx.id}`).set(tx);
      res.status(201).json(tx);
    } catch (err) {
      res.status(500).json({ error: 'Gagal membuat transaksi.' });
    }
  });

  app.put('/api/transactions/:id', requireAuth, async (req, res) => {
    const userId = req.body.currentUserId;
    const { id } = req.params;
    const tx = req.body;
    delete tx.currentUserId;
    tx.userId = userId;
    tx.id = id;

    try {
      await db.collection('transactions').doc(`${userId}_${id}`).set(tx, { merge: true });
      res.json(tx);
    } catch (err) {
      res.status(500).json({ error: 'Gagal mengedit transaksi.' });
    }
  });

  app.delete('/api/transactions/:id', requireAuth, async (req, res) => {
    const userId = req.body.currentUserId;
    const { id } = req.params;
    try {
      await db.collection('transactions').doc(`${userId}_${id}`).delete();
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Gagal menghapus transaksi.' });
    }
  });

  // Credit Cards CRUD
  app.get('/api/credit-cards', requireAuth, async (req, res) => {
    const userId = req.body.currentUserId;
    try {
      const snap = await db.collection('credit_cards').where('userId', '==', userId).get();
      res.json(snap.docs.map(doc => {
        const { userId: _, ...card } = doc.data();
        return card;
      }));
    } catch (err) {
      res.status(500).json({ error: 'Gagal mengambil kartu kredit.' });
    }
  });

  app.post('/api/credit-cards', requireAuth, async (req, res) => {
    const userId = req.body.currentUserId;
    const card = req.body;
    delete card.currentUserId;

    if (!card.id) card.id = 'card_' + crypto.randomUUID();
    card.userId = userId;

    try {
      await db.collection('credit_cards').doc(`${userId}_${card.id}`).set(card);
      res.status(201).json(card);
    } catch (err) {
      res.status(500).json({ error: 'Gagal menyimpan kartu kredit.' });
    }
  });

  app.put('/api/credit-cards/:id', requireAuth, async (req, res) => {
    const userId = req.body.currentUserId;
    const { id } = req.params;
    const card = req.body;
    delete card.currentUserId;
    card.userId = userId;
    card.id = id;

    try {
      await db.collection('credit_cards').doc(`${userId}_${id}`).set(card, { merge: true });
      res.json(card);
    } catch (err) {
      res.status(500).json({ error: 'Gagal mengedit kartu kredit.' });
    }
  });

  app.delete('/api/credit-cards/:id', requireAuth, async (req, res) => {
    const userId = req.body.currentUserId;
    const { id } = req.params;
    try {
      await db.collection('credit_cards').doc(`${userId}_${id}`).delete();
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Gagal menghapus kartu kredit.' });
    }
  });

  // Saving Goals CRUD
  app.get('/api/saving-goals', requireAuth, async (req, res) => {
    const userId = req.body.currentUserId;
    try {
      const snap = await db.collection('saving_goals').where('userId', '==', userId).get();
      res.json(snap.docs.map(doc => {
        const { userId: _, ...goal } = doc.data();
        return goal;
      }));
    } catch (err) {
      res.status(500).json({ error: 'Gagal mengambil target tabungan.' });
    }
  });

  app.post('/api/saving-goals', requireAuth, async (req, res) => {
    const userId = req.body.currentUserId;
    const goal = req.body;
    delete goal.currentUserId;

    if (!goal.id) goal.id = 'goal_' + crypto.randomUUID();
    goal.userId = userId;

    try {
      await db.collection('saving_goals').doc(`${userId}_${goal.id}`).set(goal);
      res.status(201).json(goal);
    } catch (err) {
      res.status(500).json({ error: 'Gagal menyimpan target tabungan.' });
    }
  });

  app.put('/api/saving-goals/:id', requireAuth, async (req, res) => {
    const userId = req.body.currentUserId;
    const { id } = req.params;
    const goal = req.body;
    delete goal.currentUserId;
    goal.userId = userId;
    goal.id = id;

    try {
      await db.collection('saving_goals').doc(`${userId}_${id}`).set(goal, { merge: true });
      res.json(goal);
    } catch (err) {
      res.status(500).json({ error: 'Gagal mengedit target tabungan.' });
    }
  });

  app.delete('/api/saving-goals/:id', requireAuth, async (req, res) => {
    const userId = req.body.currentUserId;
    const { id } = req.params;
    try {
      await db.collection('saving_goals').doc(`${userId}_${id}`).delete();
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Gagal menghapus target tabungan.' });
    }
  });

  // Family Members CRUD
  app.get('/api/family-members', requireAuth, async (req, res) => {
    const userId = req.body.currentUserId;
    try {
      const snap = await db.collection('family_members').where('userId', '==', userId).get();
      res.json(snap.docs.map(doc => {
        const { userId: _, ...fam } = doc.data();
        return fam;
      }));
    } catch (err) {
      res.status(500).json({ error: 'Gagal mengambil anggota keluarga.' });
    }
  });

  app.post('/api/family-members', requireAuth, async (req, res) => {
    const userId = req.body.currentUserId;
    const fam = req.body;
    delete fam.currentUserId;

    if (!fam.id) fam.id = 'fam_' + crypto.randomUUID();
    fam.userId = userId;

    try {
      await db.collection('family_members').doc(`${userId}_${fam.id}`).set(fam);
      res.status(201).json(fam);
    } catch (err) {
      res.status(500).json({ error: 'Gagal menambah anggota keluarga.' });
    }
  });

  app.put('/api/family-members/:id', requireAuth, async (req, res) => {
    const userId = req.body.currentUserId;
    const { id } = req.params;
    const fam = req.body;
    delete fam.currentUserId;
    fam.userId = userId;
    fam.id = id;

    try {
      await db.collection('family_members').doc(`${userId}_${id}`).set(fam, { merge: true });
      res.json(fam);
    } catch (err) {
      res.status(500).json({ error: 'Gagal memperbarui anggota keluarga.' });
    }
  });

  app.delete('/api/family-members/:id', requireAuth, async (req, res) => {
    const userId = req.body.currentUserId;
    const { id } = req.params;
    try {
      await db.collection('family_members').doc(`${userId}_${id}`).delete();
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Gagal menghapus anggota keluarga.' });
    }
  });

  // Categories CRUD
  app.get('/api/categories', requireAuth, async (req, res) => {
    const userId = req.body.currentUserId;
    try {
      const snap = await db.collection('categories').where('userId', '==', userId).get();
      res.json(snap.docs.map(doc => {
        const { userId: _, ...cat } = doc.data();
        return cat;
      }));
    } catch (err) {
      res.status(500).json({ error: 'Gagal mengambil kategori.' });
    }
  });

  app.post('/api/categories', requireAuth, async (req, res) => {
    const userId = req.body.currentUserId;
    const cat = req.body;
    delete cat.currentUserId;

    if (!cat.id) cat.id = 'cat_' + crypto.randomUUID();
    cat.userId = userId;

    try {
      await db.collection('categories').doc(`${userId}_${cat.id}`).set(cat);
      res.status(201).json(cat);
    } catch (err) {
      res.status(500).json({ error: 'Gagal menyimpan kategori.' });
    }
  });

  app.put('/api/categories/:id', requireAuth, async (req, res) => {
    const userId = req.body.currentUserId;
    const { id } = req.params;
    const cat = req.body;
    delete cat.currentUserId;
    cat.userId = userId;
    cat.id = id;

    try {
      await db.collection('categories').doc(`${userId}_${id}`).set(cat, { merge: true });
      res.json(cat);
    } catch (err) {
      res.status(500).json({ error: 'Gagal memperbarui kategori.' });
    }
  });

  app.delete('/api/categories/:id', requireAuth, async (req, res) => {
    const userId = req.body.currentUserId;
    const { id } = req.params;
    try {
      await db.collection('categories').doc(`${userId}_${id}`).delete();
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Gagal menghapus kategori.' });
    }
  });

  // Notifications CRUD
  app.get('/api/notifications', requireAuth, async (req, res) => {
    const userId = req.body.currentUserId;
    try {
      const snap = await db.collection('notifications').where('userId', '==', userId).get();
      const list = snap.docs.map(doc => {
        const { userId: _, ...notif } = doc.data();
        return notif;
      });
      list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      res.json(list);
    } catch (err) {
      res.status(500).json({ error: 'Gagal mengambil notifikasi.' });
    }
  });

  app.put('/api/notifications/:id', requireAuth, async (req, res) => {
    const userId = req.body.currentUserId;
    const { id } = req.params;
    const notif = req.body;
    delete notif.currentUserId;
    notif.userId = userId;
    notif.id = id;

    try {
      await db.collection('notifications').doc(`${userId}_${id}`).set(notif, { merge: true });
      res.json(notif);
    } catch (err) {
      res.status(500).json({ error: 'Gagal mengedit notifikasi.' });
    }
  });

  app.post('/api/notifications', requireAuth, async (req, res) => {
    const userId = req.body.currentUserId;
    const notif = req.body;
    delete notif.currentUserId;

    if (!notif.id) notif.id = 'notif_' + crypto.randomUUID();
    notif.userId = userId;

    try {
      await db.collection('notifications').doc(`${userId}_${notif.id}`).set(notif);
      res.status(201).json(notif);
    } catch (err) {
      res.status(500).json({ error: 'Gagal menyimpan notifikasi.' });
    }
  });

  app.delete('/api/notifications/:id', requireAuth, async (req, res) => {
    const userId = req.body.currentUserId;
    const { id } = req.params;
    try {
      await db.collection('notifications').doc(`${userId}_${id}`).delete();
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Gagal menghapus notifikasi.' });
    }
  });

  // Lazy Gemini Client initialization
  let aiClient: GoogleGenAI | null = null;
  const getGeminiClient = (): GoogleGenAI => {
    if (!aiClient) {
      const key = process.env.GEMINI_API_KEY;
      if (!key) {
        throw new Error('GEMINI_API_KEY is not defined');
      }
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return aiClient;
  };

  // AI Barcode Scanner endpoint
  app.post('/api/scan-barcode', requireAuth, async (req, res) => {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'Gambar tidak boleh kosong.' });
    }

    try {
      let mimeType = 'image/jpeg';
      let base64Data = image;

      if (image.includes(';base64,')) {
        const parts = image.split(';base64,');
        mimeType = parts[0].replace('data:', '');
        base64Data = parts[1];
      }

      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          {
            text: 'Analisislah gambar barcode produk ini (bisa berupa foto barcode saja, atau foto kemasan produk yang menampilkan barcode). Temukan nilai barcode jika memungkinkan, dan cari tahu produk apakah ini di Indonesia. Jika gambar tidak menyertakan barcode yang valid, analisis produk yang tampak pada gambar. Kembalikan data dalam format JSON dengan struktur yang tepat sesuai skema yang diminta.'
          }
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              productName: {
                type: Type.STRING,
                description: 'Nama produk komplit yang terdeteksi atau diidentifikasi.'
              },
              barcode: {
                type: Type.STRING,
                description: '13-digit EAN barcode atau nilai barcode yang terdeteksi. Berikan null jika tidak terdeteksi.'
              },
              estimatedPrice: {
                type: Type.INTEGER,
                description: 'Perkiraan harga wajar dalam Rupiah untuk produk ini di minimarket/supermarket Indonesia.'
              },
              category: {
                type: Type.STRING,
                description: 'Kategori pengeluaran. Harus salah satu dari: "Makanan & Minuman", "Belanja Bulanan", "Kesehatan", "Lain-lain".'
              },
              notes: {
                type: Type.STRING,
                description: 'Keterangan tambahan atau rincian spesifikasi produk.'
              }
            },
            required: ['productName', 'estimatedPrice', 'category', 'notes']
          }
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error('Gemini did not return any text.');
      }

      const result = JSON.parse(text.trim());
      res.json(result);
    } catch (err: any) {
      console.error('Barcode scan error:', err);
      // Elegant fallback if GEMINI_API_KEY is missing or the call fails
      res.status(200).json({
        productName: 'Aqua Botol 600ml (Simulasi)',
        barcode: '8991001110023',
        estimatedPrice: 3500,
        category: 'Makanan & Minuman',
        notes: 'Pencatatan otomatis via simulasi sensor barcode (Gemini offline/tidak aktif).'
      });
    }
  });


async function setupViteAndListen() {
  // Serve frontend files
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

setupViteAndListen().catch((err) => {
  console.error('Failed to initialize server or setup Vite:', err);
});

export default app;
