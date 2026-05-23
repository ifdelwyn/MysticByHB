import fs from 'fs';
import path from 'path';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: 'guest' | 'user' | 'admin';
  createdAt: string;
}

export interface Payment {
  id: string;
  userId: string;
  method: 'momo' | 'bank' | 'usdt';
  amount: number;
  orderCode: string;
  status: 'pending' | 'success' | 'failed';
  serviceType?: string;
  momoTransactionId?: string;
  usdtTxnHash?: string;
  createdAt: string;
}

export interface AISession {
  id: string;
  userId: string;
  type: 'tarot' | 'astrology' | 'coach';
  input: string;
  aiResultJSON: string; // Stored as stringified JSON detail
  voiceUrl?: string; // Cache base64 or link
  createdAt: string;
}

export interface BankTransfer {
  id: string;
  orderCode: string;
  userId: string;
  amount: number;
  status: 'pending' | 'success' | 'failed';
  verifiedByAdmin?: string; // admin email
  verifiedAt?: string;
  createdAt: string;
}

// Ensure database directory exists
const DB_DIR = path.resolve('./data');
const DB_PATH = path.join(DB_DIR, 'database.json');

interface Schema {
  users: User[];
  payments: Payment[];
  aiSessions: AISession[];
  bankTransfers: BankTransfer[];
}

const defaultSchema: Schema = {
  users: [
    {
      id: 'admin-1',
      email: 'lehuybao17112007@gmail.com', // Pre-populated admin as per metadata / user session
      passwordHash: '$2a$10$r8p6RsmNqf5M41T/c9vKeO3b67946U7o1c87h766K874c76g7v76K', // simple pass
      role: 'admin',
      createdAt: new Date().toISOString(),
    }
  ],
  payments: [],
  aiSessions: [],
  bankTransfers: [],
};

function readDB(): Schema {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify(defaultSchema, null, 2), 'utf-8');
      return defaultSchema;
    }
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading DB, using default:', err);
    return defaultSchema;
  }
}

function writeDB(data: Schema): void {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing DB:', err);
  }
}

export const db = {
  getUsers: (): User[] => readDB().users,
  addUser: (user: User) => {
    const data = readDB();
    data.users.push(user);
    writeDB(data);
  },
  updateUserRole: (id: string, role: 'guest' | 'user' | 'admin') => {
    const data = readDB();
    const u = data.users.find(x => x.id === id);
    if (u) {
      u.role = role;
      writeDB(data);
    }
  },

  getPayments: (): Payment[] => readDB().payments,
  addPayment: (p: Payment) => {
    const data = readDB();
    data.payments.push(p);
    writeDB(data);
  },
  updatePaymentStatus: (orderCode: string, status: 'success' | 'failed', txnId?: string) => {
    const data = readDB();
    const p = data.payments.find(x => x.orderCode === orderCode);
    if (p) {
      p.status = status;
      if (txnId) p.momoTransactionId = txnId;
      writeDB(data);
    }
  },

  getAISessions: (): AISession[] => readDB().aiSessions,
  addAISession: (sess: AISession) => {
    const data = readDB();
    data.aiSessions.push(sess);
    writeDB(data);
  },

  getBankTransfers: (): BankTransfer[] => readDB().bankTransfers,
  addBankTransfer: (bt: BankTransfer) => {
    const data = readDB();
    data.bankTransfers.push(bt);
    writeDB(data);
  },
  updateBankTransferStatus: (orderCode: string, status: 'success' | 'failed', adminEmail: string) => {
    const data = readDB();
    
    // update in bankTransfers
    const bt = data.bankTransfers.find(x => x.orderCode === orderCode);
    if (bt) {
      bt.status = status;
      bt.verifiedByAdmin = adminEmail;
      bt.verifiedAt = new Date().toISOString();
    }
    
    // update in payments
    const p = data.payments.find(x => x.orderCode === orderCode);
    if (p) {
      p.status = status;
    }
    
    writeDB(data);
  }
};
