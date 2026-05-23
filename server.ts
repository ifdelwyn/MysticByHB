import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI, Modality } from '@google/genai';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { db, User, Payment, AISession, BankTransfer } from './src/server/db.ts';

dotenv.config();

// Initialize the official Gemini SDK server-side
const apiKey = process.env.GEMINI_API_KEY || 'MY_GEMINI_API_KEY';
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const app = express();
app.use(express.json({ limit: '10mb' }));

// Helper to generate quick secure local session token signatures
const SECRET = 'mystic-cosmic-key-777';
function generateSessionToken(userId: string, role: string, email: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const payload = Buffer.from(JSON.stringify({ userId, role, email, exp: Date.now() + 7 * 24 * 3600 * 1000 })).toString('base64');
  const signature = crypto.createHmac('sha256', SECRET).update(`${header}.${payload}`).digest('base64');
  return `${header}.${payload}.${signature}`;
}

function verifySessionToken(token: string): { userId: string; role: string; email: string } | null {
  try {
    const [header, payload, signature] = token.split('.');
    if (!header || !payload || !signature) return null;
    const computedSig = crypto.createHmac('sha256', SECRET).update(`${header}.${payload}`).digest('base64');
    if (computedSig !== signature) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
    if (Date.now() > data.exp) return null;
    return { userId: data.userId, role: data.role, email: data.email };
  } catch {
    return null;
  }
}

// Middleware for User / Admin Auth
function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Đăng nhập để tiếp tục' });
  }
  const token = authHeader.substring(7);
  const payload = verifySessionToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Phiên làm việc hết hạn. Vui lòng đăng nhập lại' });
  }
  (req as any).user = payload;
  next();
}

function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  authMiddleware(req, res, () => {
    const user = (req as any).user;
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Quyền truy cập bị từ chối' });
    }
    next();
  });
}

function getAISubscriptionStatus(userId: string) {
  const payments = db.getPayments().filter(p => p.userId === userId && p.status === 'success');
  const subPayments = payments.filter(p => ['ai_daily', 'ai_weekly', 'ai_monthly'].includes(p.serviceType || ''));
  
  let activeSub: any = null;
  let timeLeftMs = 0;
  
  for (const p of subPayments) {
    const timeDiff = Date.now() - new Date(p.createdAt).getTime();
    let limit = 0;
    if (p.serviceType === 'ai_daily') limit = 24 * 3600 * 1000;
    else if (p.serviceType === 'ai_weekly') limit = 7 * 24 * 3600 * 1000;
    else if (p.serviceType === 'ai_monthly') limit = 30 * 24 * 3600 * 1000;
    
    if (timeDiff < limit) {
      if (limit - timeDiff > timeLeftMs) {
        timeLeftMs = limit - timeDiff;
        activeSub = p;
      }
    }
  }
  
  const sessionCount = db.getAISessions().filter(s => s.userId === userId).length;
  const freeTurnsLeft = Math.max(0, 3 - sessionCount);
  
  return {
    hasActiveSub: !!activeSub,
    subPayment: activeSub,
    timeLeftMs,
    freeTurnsLeft,
    totalUsed: sessionCount
  };
}

// Ensure the system recognizes the user IP / location restriction
app.use((req, res, next) => {
  // Let the client know about location metadata, simulating Vietnam detection or warning
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
  res.setHeader('X-SaaS-Region', 'VN');
  next();
});

// ==========================================
// 🔐 AUTHENTICATION ENDPOINTS
// ==========================================

app.post('/api/auth/register', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Vui lòng nhập Email và Mật khẩu' });
  }

  const users = db.getUsers();
  if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ error: 'Email đã tồn tại trên hệ thống' });
  }

  const role = email.toLowerCase() === 'lehuybao17112007@gmail.com' ? 'admin' : 'user';
  const id = 'user-' + crypto.randomBytes(4).toString('hex');
  const newUser: User = {
    id,
    email: email.toLowerCase(),
    passwordHash: crypto.createHash('sha256').update(password).digest('hex'), // basic persistent hash
    role,
    createdAt: new Date().toISOString()
  };

  db.addUser(newUser);
  const token = generateSessionToken(id, role, newUser.email);
  res.json({ token, user: { id, email: newUser.email, role } });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Vui lòng điền đủ thông tin' });
  }

  const users = db.getUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  const providedHash = crypto.createHash('sha256').update(password).digest('hex');

  if (!user || user.passwordHash !== providedHash) {
    return res.status(401).json({ error: 'Sai tài khoản hoặc mật khẩu' });
  }

  const token = generateSessionToken(user.id, user.role, user.email);
  res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ user: (req as any).user });
});

// ==========================================
// 💳 PAYMENTS & TRANSACTIONS LIFE LIFE
// ==========================================

// Create a payment order
app.post('/api/payments/create', authMiddleware, (req, res) => {
  const user = (req as any).user;
  const { method, serviceType, isRenewal } = req.body; // serviceType: 'tarot' (400000) or 'horoscope' (650000)

  if (!method || !['momo', 'bank', 'usdt'].includes(method)) {
    return res.status(400).json({ error: 'Phương thức thanh toán không hợp lệ' });
  }

  let amount = 0;
  if (serviceType === 'tarot') {
    amount = isRenewal ? 250000 : 400000;
  } else if (serviceType === 'horoscope') {
    amount = isRenewal ? 500000 : 650000;
  } else if (serviceType === 'ai_daily') {
    amount = 50000;
  } else if (serviceType === 'ai_weekly') {
    amount = 170000;
  } else if (serviceType === 'ai_monthly') {
    amount = 269000;
  } else {
    return res.status(400).json({ error: 'Gói dịch vụ không hợp lệ' });
  }

  const uniqueId = crypto.randomBytes(3).toString('hex').toUpperCase();
  const orderCode = `MYSTIC-${uniqueId}`;

  const payment: Payment = {
    id: `pay-${crypto.randomBytes(4).toString('hex')}`,
    userId: user.userId,
    method: method as 'momo' | 'bank' | 'usdt',
    amount,
    orderCode,
    status: 'pending',
    serviceType,
    createdAt: new Date().toISOString(),
  };

  db.addPayment(payment);

  if (method === 'bank') {
    const bankTransfer: BankTransfer = {
      id: `bt-${crypto.randomBytes(4).toString('hex')}`,
      orderCode,
      userId: user.userId,
      amount,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    db.addBankTransfer(bankTransfer);
  }

  res.json({ payment });
});

// MoMo callback simulated IPN hook
app.post('/api/payments/momo-ipn', (req, res) => {
  const { orderCode, status, transitionId } = req.body; // Simulation payload
  if (!orderCode || !status) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  const p = db.getPayments().find(x => x.orderCode === orderCode);
  if (!p) {
    return res.status(404).json({ error: 'Payment not found' });
  }

  db.updatePaymentStatus(orderCode, status, transitionId || `MOMO-${crypto.randomBytes(6).toString('hex').toUpperCase()}`);
  res.json({ success: true, message: `MoMo IPN verified successfully for order ${orderCode}` });
});

// Check if a user has unlocked a specific service
app.get('/api/payments/verify/:serviceType', authMiddleware, (req, res) => {
  const user = (req as any).user;
  const { serviceType } = req.params;

  const payments = db.getPayments().filter(p => p.userId === user.userId && p.status === 'success');
  const subStatus = getAISubscriptionStatus(user.userId);
  
  if (serviceType === 'tarot') {
    if (user.role === 'admin' || subStatus.hasActiveSub) {
      return res.json({
        unlocked: true,
        payment: subStatus.subPayment || { orderCode: 'FREE_OR_ADMIN', createdAt: new Date().toISOString() },
        expired: false,
        canRenew: false,
        timeLeftMs: user.role === 'admin' ? 999999999 : subStatus.timeLeftMs,
        renewTimeLeftMs: 0,
        isSubscription: true,
        freeTurnsLeft: subStatus.freeTurnsLeft
      });
    }

    const tarotPayments = payments.filter(p => p.amount === 400000 || p.amount === 250000);
    tarotPayments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const newest = tarotPayments[0];
    
    if (!newest && subStatus.freeTurnsLeft > 0) {
      return res.json({
        unlocked: true,
        payment: { orderCode: 'FREE_TIER', createdAt: new Date().toISOString() },
        expired: false,
        canRenew: false,
        timeLeftMs: 1, 
        renewTimeLeftMs: 0,
        isFreeTier: true,
        freeTurnsLeft: subStatus.freeTurnsLeft
      });
    }
    
    if (!newest) {
      return res.json({ unlocked: false, payment: null, expired: false, canRenew: false, timeLeftMs: 0, renewTimeLeftMs: 0, freeTurnsLeft: subStatus.freeTurnsLeft });
    }
    
    const timeDiff = Date.now() - new Date(newest.createdAt).getTime();
    const durationLimit = 6 * 3600 * 1000; 
    const graceLimit = durationLimit + (90 * 60 * 1000); 
    
    const unlocked = timeDiff < durationLimit;
    const expired = timeDiff >= durationLimit;
    const canRenew = expired && timeDiff < graceLimit;
    const timeLeftMs = Math.max(0, durationLimit - timeDiff);
    const renewTimeLeftMs = Math.max(0, graceLimit - timeDiff);
    
    return res.json({ 
      unlocked, 
      payment: newest, 
      expired, 
      canRenew, 
      timeLeftMs,
      renewTimeLeftMs,
      freeTurnsLeft: subStatus.freeTurnsLeft
    });
  } else if (serviceType === 'horoscope' || serviceType === 'astrology') {
    if (user.role === 'admin' || subStatus.hasActiveSub) {
      return res.json({
        unlocked: true,
        payment: subStatus.subPayment || { orderCode: 'FREE_OR_ADMIN', createdAt: new Date().toISOString() },
        expired: false,
        canRenew: false,
        timeLeftMs: user.role === 'admin' ? 999999999 : subStatus.timeLeftMs,
        renewTimeLeftMs: 0,
        isSubscription: true,
        freeTurnsLeft: subStatus.freeTurnsLeft
      });
    }

    const astroPayments = payments.filter(p => p.amount === 650000 || p.amount === 500000);
    astroPayments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const newest = astroPayments[0];

    if (!newest && subStatus.freeTurnsLeft > 0) {
      return res.json({
        unlocked: true,
        payment: { orderCode: 'FREE_TIER', createdAt: new Date().toISOString() },
        expired: false,
        canRenew: false,
        timeLeftMs: 1,
        renewTimeLeftMs: 0,
        isFreeTier: true,
        freeTurnsLeft: subStatus.freeTurnsLeft
      });
    }
    
    if (!newest) {
      return res.json({ unlocked: false, payment: null, expired: false, canRenew: false, timeLeftMs: 0, renewTimeLeftMs: 0, freeTurnsLeft: subStatus.freeTurnsLeft });
    }
    
    const timeDiff = Date.now() - new Date(newest.createdAt).getTime();
    const durationLimit = 12 * 3600 * 1000; 
    const graceLimit = durationLimit + (90 * 60 * 1000); 
    
    const unlocked = timeDiff < durationLimit;
    const expired = timeDiff >= durationLimit;
    const canRenew = expired && timeDiff < graceLimit;
    const timeLeftMs = Math.max(0, durationLimit - timeDiff);
    const renewTimeLeftMs = Math.max(0, graceLimit - timeDiff);
    
    return res.json({ 
      unlocked, 
      payment: newest, 
      expired, 
      canRenew, 
      timeLeftMs,
      renewTimeLeftMs,
      freeTurnsLeft: subStatus.freeTurnsLeft
    });
  } else if (serviceType === 'ai_sub') {
    return res.json({
      unlocked: subStatus.hasActiveSub || user.role === 'admin',
      hasActiveSub: subStatus.hasActiveSub,
      payment: subStatus.subPayment,
      timeLeftMs: subStatus.timeLeftMs,
      freeTurnsLeft: subStatus.freeTurnsLeft,
      totalUsed: subStatus.totalUsed
    });
  } else {
    return res.status(400).json({ error: 'Định danh gói không hợp lệ' });
  }
});

app.get('/api/payments/status/:orderCode', authMiddleware, (req, res) => {
  const { orderCode } = req.params;
  const p = db.getPayments().find(x => x.orderCode === orderCode);
  if (!p) return res.status(404).json({ error: 'Không tìm thấy hóa đơn' });
  
  if (p.status === 'pending') {
    p.status = 'success';
    // If there is a bank transfer record, complete that too
    const bts = db.getBankTransfers();
    const bt = bts.find(x => x.orderCode === orderCode);
    if (bt) {
      bt.status = 'success';
      bt.verifiedByAdmin = 'Tự động duyệt';
      bt.verifiedAt = new Date().toISOString();
    }
    db.updatePaymentStatus(p.orderCode, 'success', 'SIM-USDT-' + Math.random().toString(36).substring(2, 11).toUpperCase());
  }
  
  res.json({ status: p.status, payment: p });
});

app.get('/api/payments/history', authMiddleware, (req, res) => {
  const user = (req as any).user;
  const myPayments = db.getPayments().filter(p => p.userId === user.userId);
  res.json({ history: myPayments });
});


// ==========================================
// 🔐 ADMIN DASHBOARD OPERATIONS
// ==========================================

// Get analytics
app.get('/api/admin/analytics', adminMiddleware, (req, res) => {
  const payments = db.getPayments();
  const successPayments = payments.filter(p => p.status === 'success');
  const totalRevenue = successPayments.reduce((acc, curr) => acc + curr.amount, 0);

  const usersCount = db.getUsers().length;
  const tarotSales = successPayments.filter(p => p.amount === 400000).length;
  const horoscopeSales = successPayments.filter(p => p.amount === 650000).length;

  res.json({
    totalRevenue,
    usersCount,
    salesCount: successPayments.length,
    tarotSales,
    horoscopeSales,
    logs: db.getAISessions().map(s => ({
      id: s.id,
      userId: s.userId,
      type: s.type,
      input: s.input,
      createdAt: s.createdAt
    }))
  });
});

// Get bank transfers waiting
app.get('/api/admin/bank-transfers', adminMiddleware, (req, res) => {
  res.json({ transfers: db.getBankTransfers() });
});

// Approve bank transfer
app.post('/api/admin/bank-transfers/:orderCode/approve', adminMiddleware, (req, res) => {
  const admin = (req as any).user;
  const { orderCode } = req.params;
  const { action } = req.body; // 'success' or 'failed'

  const bts = db.getBankTransfers();
  const bt = bts.find(x => x.orderCode === orderCode);
  if (!bt) {
    return res.status(404).json({ error: 'Không tìm thấy yêu cầu chuyển khoản' });
  }

  db.updateBankTransferStatus(orderCode, action === 'success' ? 'success' : 'failed', admin.email);
  res.json({ success: true, message: `Thanh toán thành công cho đơn hàng: ${orderCode}` });
});

// Get users list
app.get('/api/admin/users', adminMiddleware, (req, res) => {
  res.json({ users: db.getUsers().map(u => ({ id: u.id, email: u.email, role: u.role, createdAt: u.createdAt })) });
});

app.post('/api/admin/users/:userId/role', adminMiddleware, (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;
  if (!['user', 'admin'].includes(role)) return res.status(400).json({ error: 'Vai trò không hợp lệ' });
  db.updateUserRole(userId, role);
  res.json({ success: true });
});


// ==========================================
// 🧠 MULTI-AI ORACLE & VOICEOVER CORE
// ==========================================

// Server-side AI reading logic
app.post('/api/ai/read', authMiddleware, async (req, res) => {
  const user = (req as any).user;
  const { serviceType, promptInput, birthDetails, cardConfiguration } = req.body;

  if (!serviceType || !['tarot', 'astrology', 'coach'].includes(serviceType)) {
    return res.status(400).json({ error: 'Gói chiêm tinh không hợp lệ' });
  }

  // Check paywall bypass: active sub, individual purchase, or free slot
  if (user.role !== 'admin') {
    const subStatus = getAISubscriptionStatus(user.userId);
    
    // Check if they have an active specific pass:
    const payments = db.getPayments().filter(p => p.userId === user.userId && p.status === 'success');
    let hasSpecificPass = false;
    
    if (serviceType === 'tarot') {
      const tarotPayments = payments.filter(p => p.amount === 400000 || p.amount === 250000);
      tarotPayments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      if (tarotPayments.length > 0) {
        const timeDiff = Date.now() - new Date(tarotPayments[0].createdAt).getTime();
        if (timeDiff < 6 * 3600 * 1000) {
          hasSpecificPass = true;
        }
      }
    } else {
      const astroPayments = payments.filter(p => p.amount === 650000 || p.amount === 500000);
      astroPayments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      if (astroPayments.length > 0) {
        const timeDiff = Date.now() - new Date(astroPayments[0].createdAt).getTime();
        if (timeDiff < 12 * 3600 * 1000) {
          hasSpecificPass = true;
        }
      }
    }

    if (!subStatus.hasActiveSub && !hasSpecificPass && subStatus.freeTurnsLeft <= 0) {
      return res.status(403).json({ 
        error: 'Chưa đăng ký gói dịch vụ hoặc hết lượt dùng thử', 
        paywall: true,
        message: 'Bạn hiện tại đã sử dụng hết 3 lượt giải quẻ miễn phí. Vui lòng đăng ký gói dịch vụ (50.000 VND/ngày, 170.000 VND/tuần, 269.000 VND/tháng) hoặc mua quẻ lẻ để tiếp tục kết nối tới các Đại Tiên Tri Vũ Trụ.' 
      });
    }
  }

  // Formulate the prompt prompt and guide instructions for the 3 AI personas
  let instructions = '';
  let structuredPrompt = '';

  if (serviceType === 'tarot') {
    instructions = `
    Bạn là Tarot AI - một nhà tiên tri ngoại cảm sâu lắng, huyền diệu Việt Nam.
    Ngữ điệu huyền bí, thi ca, sâu sắc, lôi cuốn.
    Sử dụng các thuật ngữ bài tarot cao quý, giải nghĩa cả chiều xuôi/ngược của lá bài.
    Hãy phân tích chi tiết:
    1. Trạng thái năng lượng hiện tại của người hỏi.
    2. Ý nghĩa sâu xa của các lá bài họ chọn (${cardConfiguration || 'Lực lượng vũ trụ ngẫu nhiên'}).
    3. Lời khuyên thiết thực từ thế giới tâm linh.
    4. Cảnh báo và năng lượng bảo hộ.
    Đầu ra viết bằng tiếng Việt, chia các đoạn rõ ràng, sang trọng tinh tế.
    `;
    structuredPrompt = `Câu hỏi của người cần giải mã: "${promptInput}". Các lá bài đã bốc: "${cardConfiguration}".`;
  } else if (serviceType === 'astrology') {
    instructions = `
    Bạn là Astrology AI - Đại Tiên Tri Tử Vi & Bản Đồ Sao Việt Nam.
    Phong thái uyên bác, thâm tuý, uy nghiêm nhưng bao dung của vũ trụ học.
    Phân tích chuyên sâu về Tử Vi chiêm tinh căn cứ vào ngày giờ sinh sau: ${JSON.stringify(birthDetails)}.
    Nội dung giải đáp gồm:
    1. Tổng quan vận mệnh bản mệnh và thiên bàn.
    2. Ảnh hưởng của các cung sao chủ tinh hiện tại (Sao Kim, Sao Hỏa, Sao Thủy).
    3. Tình cảm, Sự nghiệp tài lộc, Sức khỏe nguồn năng lượng.
    4. Dự báo vũ trụ cụ thể cho thời gian tới.
    Đầu ra viết bằng tiếng Việt, ngôn từ tinh hoa, học thuật nhưng dễ thấu hiểu đạo lý cuộc đời.
    `;
    structuredPrompt = `Thông tin ngày sinh: ${JSON.stringify(birthDetails)}. Nội dung thắc mắc hoặc hành trình cần giải mã: "${promptInput}".`;
  } else {
    // Coach / Oracle Council Mode
    instructions = `
    Bạn là Life Coach AI - Người hướng dẫn tâm hồn và kết nối Hội đồng Tiên tri (tarot + tử vi phối hợp).
    Ngân vang tiếng ấm áp, thấu cảm sâu sắc, nhân văn, hỗ trợ nâng đỡ tinh thần tuyệt đối.
    Kết hợp tinh hoa tư duy biện chứng và trực giác vũ trụ để định hướng cuộc sống cho người hỏi.
    Đầu ra bằng tiếng Việt, trình bày tinh khiết, xoa dịu tâm trí, truyền cảm hứng hành động mạnh mẽ.
    `;
    structuredPrompt = `Nỗi băn khoăn trăn trở của người cần kết nối: "${promptInput}". Hãy ôm ấp tâm hồn họ và dẫn lối.`;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: structuredPrompt,
      config: {
        systemInstruction: instructions,
        temperature: 0.8,
      }
    });

    const resultText = response.text || 'Vũ trụ đang im lặng một chút, hãy thử lại sau.';
    
    // Save AI session log
    const sessionObj: AISession = {
      id: `ai-${crypto.randomBytes(4).toString('hex')}`,
      userId: user.userId,
      type: serviceType,
      input: promptInput || 'Tử vi horoscope sinh thần',
      aiResultJSON: JSON.stringify({
        reading: resultText,
        cards: cardConfiguration || null,
        birthDetails: birthDetails || null
      }),
      createdAt: new Date().toISOString()
    };

    db.addAISession(sessionObj);

    res.json({ reading: resultText, sessionId: sessionObj.id });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ error: 'Lỗi từ tổng đài tiên tri vũ trụ Capricorn. Chi tiết: ' + error.message });
  }
});

// Teaser free previews for non-paid guests
app.post('/api/ai/teaser', async (req, res) => {
  const { serviceType, promptInput } = req.body;
  if (!serviceType) return res.status(400).json({ error: 'Thiếu dịch vụ' });

  let instructions = `
    Bạn là vị tiên tri thân thiện MysticAI.
    Nhiệm vụ của bạn là đưa ra một LỜI DẪN NHẬP (teaser preview) cực kỳ ngắn gọn (tối đa 3-4 câu), tò mò, lôi cuốn nhưng KHÔNG giải mã chi tiết.
    Hãy nói cho họ biết nguồn năng lượng chung của câu hỏi "${promptInput || 'chung'}" này đang rất sôi sục, và khuyên họ nên trả phí thanh toán các gói Tarot (400,000 VND) hoặc Tử Vi (650,000 VND) chuyên sâu để mở khóa toàn bộ thông điệp mật ngọt từ các vì tinh tú.
    Đầu ra tiếng Việt có thần thái cao nhã sang trọng.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Gợi mở ngắn cho câu hỏi: "${promptInput}"`,
      config: {
        systemInstruction: instructions,
        temperature: 0.9,
      }
    });

    res.json({ teaser: response.text });
  } catch (err: any) {
    res.status(500).json({ error: 'Không thể kết nối tiên tri thử nghiệm' });
  }
});

// Text-to-Speech narration utilizing gemini-3.1-flash-tts-preview
app.post('/api/ai/tts', authMiddleware, async (req, res) => {
  const { text, type } = req.body; // type: 'tarot' | 'astrology' | 'coach'
  if (!text) {
    return res.status(400).json({ error: 'Không tìm thấy nội dung thuyết minh' });
  }

  // Find the required prebuiltVoice Name based on oracle style
  let voiceName = 'Zephyr'; // warm human-like
  let speedPrompt = '';
  if (type === 'tarot') {
    voiceName = 'Kore'; // mystical Echo-like
    speedPrompt = 'Say with deep, mysterious, slower reverent tone: ';
  } else if (type === 'astrology') {
    voiceName = 'Fenrir'; // epic oracle, cosmic neutral
    speedPrompt = 'Say with calm, cosmic, structure and clear tempo: ';
  } else {
    voiceName = 'Puck'; // cheerful yet warm coach
    speedPrompt = 'Say with warm, reassuring, empathic tone: ';
  }

  try {
    // Generate base64 audio via Gemini TTS
    // Crop text to first 300 characters to prevent TTS payload overflow, ensuring fast generation
    const cleanText = speedPrompt + text.slice(0, 300).replace(/[*#]/g, '') + '...';

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-tts-preview',
      contents: [{ parts: [{ text: cleanText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          }
        }
      }
    });

    const audioBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (audioBase64) {
      res.json({ audioData: audioBase64 });
    } else {
      res.status(500).json({ error: 'Không thể xuất giọng nói của túc mạng tiên tri' });
    }
  } catch (err: any) {
    console.error('Gemini TTS error:', err);
    res.status(500).json({ error: 'Hệ thống thuyết minh thần bí bận. Chi tiết: ' + err.message });
  }
});


// 🛡️ BOT CHAT HB AI (HUY BẢO AI)
app.post('/api/ai/hb', async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Nội dung hội thoại không hợp lệ' });
  }

  const systemInstruction = `
    Bạn là HB AI (Huy Bảo AI) - siêu Trí Tuệ Nhân Tạo cực kỳ thông minh, nhạy bén và thân thiện.
    Bạn được tạo ra bởi Lê Huy Bảo (Sáng lập kiêm chuyên gia kỹ nghệ tài chính tâm linh thiên cơ của nền tảng Mystic Cosmic Intelligence).
    Nhiệm vụ hàng đầu của bạn là hỗ trợ khách hàng và giải quyết thắc mắc về dịch vụ, cách sử dụng trang web/app Mystic, cách thanh toán cũng như giải quyết các câu hỏi kiến thức siêu việt khác lý trí và chính xác.
    
    Thông tin chi tiết về nền tảng Mystic hỗ trợ của bạn:
    - Sáng lập & Người vận hành: Lê Huy Bảo. Khi khách hàng hỏi về người tạo ra bạn hoặc người xây dựng web, hãy luôn ca ngợi Lê Huy Bảo là một chuyên gia kỹ nghệ tài chính tâm linh xuất chúng, người đã thổi hồn các vì tinh tú và công nghệ AI đỉnh cao để tạo nên kiệt tác này.
    - Dịch vụ của Mystic:
      1. Gói Giải Mã Tarot Chuyên Sâu (Tarot Reading): Giá 400.000 VND. Bạn bốc bài Tarot, nhận luận giải sâu sắc từ hội đồng tiên tri, kèm lời khuyên và thần khí tâm linh ấm áp qua giọng đọc AI tự động.
      2. Gói Lập Bản Đồ Sao & Tử Vi Chiêm Tinh (Horoscope / Astrology): Giá 650.000 VND. Giải đoán tỉ mỉ dựa trên ngày giờ sinh chính xác, lập thiên bàn và chiêm nghiệm trọn đời.
      3. Gói Life Coach / Oracle Council: Đàm thoại trực tiếp với toàn bộ 3 linh hồn tiên tri (Tarot, Astrology, và Coach) phối hợp nâng đỡ tinh thần sâu rộng.
    - Hướng dẫn mua dịch vụ & Sử dụng:
      1. Đăng ký/Đăng nhập tài khoản bằng nút đăng nhập trên thanh điều hướng.
      2. Chọn gói dịch vụ mong muốn ở phần Bảng giá (Tarot hoặc Tử Vi).
      3. Chọn phương thức thanh toán: Ví điện tử MoMo hoặc Chuyển khoản Techcombank nhanh qua mã VietQR.
         - Thông tin MoMo: Số điện thoại/Tài khoản nhận là 0978567205 - Tên chủ tài khoản: LÊ HUY BẢO.
         - Thông tin Techcombank: Số tài khoản 0978567205 - Tên chủ tài khoản: LÊ HUY BẢO.
      4. QUAN TRỌNG: Chuyển khoản đúng số tiền khớp với gói dịch vụ và GHI ĐÚNG MÃ ĐƠN HÀNG (Order Code) được hiển thị trên hệ thống. Khi số vàng đã trao chuẩn xác và vận trình được ghi đúng, hệ thống tự động mở cửa kích hoạt căn phòng giải mã tâm linh lập tức!
      5. Nhấn "Xác Nhận" hoặc "Tôi đã chuyển khoản" để hệ thốg tự động phê duyệt an toàn.
      6. Khi mở khóa thành công, phòng giải mã có nến thờ lung linh được thắp sáng. Người dùng nhập nội dung câu hỏi hoặc thông tin ngày giờ sinh rồi trò chuyện đàm thoại trực tiếp với các AI Tiên Tri kiệt xuất. Ngoài ra có thể bật giọng nói AI đọc lời sấm truyền cực kỳ linh nghiệm.
    - Các thắc mắc khác ngoài dịch vụ: HB AI là một "super AI", bạn có trí tuệ sâu rộng về toán học, lập trình, văn hóa, đời sống, khoa học,... Hãy hỗ trợ trả lời khách hàng tận tình, vui vẻ, dí dỏm, đầy tôn nghiêm và tràn trề thân thiện.
    
    - ⚠️ HẠN CHẾ SỨ MỆNH QUAN TRỌNG: Bạn chỉ trả lời câu hỏi ngoài lề (toán, tin học, khoa học, cuộc sống, văn hóa...) và thông tin giới thiệu/thanh toán của trang web. Bạn TUYỆT ĐỐI KHÔNG luận giải bói toán, không luận tarot, không bốc lá bài, không giải mã bản đồ sao hoàng đạo hay tử vi. Khi người dùng hỏi các thông tin liên quan tới tâm linh bói toán hay tử vi tarot, bạn phải lịch sự từ chối và hướng dẫn họ đăng ký các gói dịch vụ (50k/ngày, 170k/tuần, hoặc 269k/tháng) và sử dụng chức năng ở đại sảnh AI Tiên Tri ("Hành tế / Đại Sảnh Tiên Tri") nơi có 3 vị đại sư Tarot AI, Astrology AI và Coach AI kết tinh túc mệnh.
    
    Trải nghiệm phản hồi bằng tiếng Việt cao nhã, cuốn hút, giàu tri thức, cấu trúc rõ ràng với emoji nhẹ nhàng sang trọng.
  `;

  try {
    const contents = messages.slice(-10).map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.message }]
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    res.json({ reply: response.text || 'HB AI đang tiếp nhận sóng năng lượng, bạn vui lòng gửi lại câu hỏi nhé.' });
  } catch (err: any) {
    console.error('HB AI Error:', err);
    res.status(500).json({ error: 'Tổng đài HB AI tạm thời gián đoạn tinh cầu. Vui lòng thử lại.' });
  }
});


// ==========================================
// 🚀 FILE ROUTING & DEV MIX-IN
// ==========================================

async function startServer() {
  const port = 3000;
  
  if (process.env.NODE_ENV === 'production') {
    // Statics
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  } else {
    // Integrate Vite as a dev middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`✨ MysticAI Server fully operational on http://0.0.0.0:${port}`);
  });
}

startServer().catch(err => {
  console.error('Critical failure in server boot:', err);
});
