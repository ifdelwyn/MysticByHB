import React, { useState, useEffect, useRef } from 'react';
import { 
  Compass, 
  Sparkles, 
  Moon, 
  Sun, 
  CreditCard, 
  History, 
  ShieldAlert, 
  User as UserIcon, 
  LogOut, 
  Play, 
  Pause, 
  Mic, 
  Send, 
  CheckCircle, 
  Cpu, 
  Copy, 
  ArrowRight, 
  Clock, 
  ShieldCheck, 
  BarChart2, 
  Users, 
  Check, 
  X, 
  TrendingUp, 
  Globe, 
  Image as ImageIcon,
  Volume2,
  Lock,
  RefreshCw
} from 'lucide-react';

// ==========================================
// STATIC CONSTANTS & TAROT CARDS
// ==========================================

const TAROT_DECK = [
  { name: 'The Magician (Nhà Ảo Thuật)', upright: 'Khởi đầu mới, ý chí tự chủ, sáng tạo tinh thần.', reversed: 'Sức mạnh thao túng, tài năng lãng phí, mưu đồ.', img: '🧙‍♂️' },
  { name: 'The High Priestess (Nữ Linh Mục)', upright: 'Trực giác nhạy bén, thế giới tiềm thức thần bí.', reversed: 'Bí mật bị tiết lộ, định kiến nông nổi, hời hợt.', img: '🌙' },
  { name: 'The Empress (Nữ Hoàng)', upright: 'Sự sinh sôi nảy nở, sung túc dồi dào, mẫu tính.', reversed: 'Sự áp đặt, thiếu sáng tạo, hao tổn tiền tài.', img: '👑' },
  { name: 'The Emperor (Hoàng Đế)', upright: 'Kỷ luật thép, quyền lực tối cao, tính hệ thống.', reversed: 'Độc đoán bảo thủ, yếu thế, mất kiểm soát.', img: '🏰' },
  { name: 'The Hierophant (Thầy Tư Tế)', upright: 'Đức tin truyền thống, giáo dục trí tuệ, sự hòa hợp.', reversed: 'Phá vỡ quy tắc, giáo điều phi lý, nổi loạn.', img: '⛪' },
  { name: 'The Lovers (Tình Nhân)', upright: 'Sự dung hòa tình cảm, lựa chọn định mệnh, hòa hợp.', reversed: 'Mất cân bằng, mâu thuẫn nội tâm, chia rẽ lứa đôi.', img: '💖' },
  { name: 'The Chariot (Chiến Xa)', upright: 'Nghị lực vươn lên, kiểm soát bản thân, thắng lợi.', reversed: 'Thiếu định hướng, mất đà, thất bại tạm thời.', img: '🛡️' },
  { name: 'Justice (Công Lý)', upright: 'Sự công bằng khách quan, nhân quả phân minh, chân lý.', reversed: 'Thiếu công bằng, thành kiến, sai lệch phán xét.', img: '⚖️' },
  { name: 'The Hermit (Ẩn Sĩ)', upright: 'Sự chiêm nghiệm nội tâm, tìm kiếm chân lý, đơn độc.', reversed: 'Sự cô lập tiêu cực, nghi ngại, bướng bỉnh.', img: '🏔️' },
  { name: 'Wheel of Fortune (Bánh Xe Số Phận)', upright: 'Vận may gõ cửa, chu kỳ thịnh suy, bước ngoặt.', reversed: 'Rủi ro khách quan, kháng cự số phận, xui xẻo.', img: '🎡' },
];

export default function App() {
  // Authentication & Session state
  const [token, setToken] = useState<string | null>(localStorage.getItem('mystic_token'));
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; role: string } | null>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authError, setAuthError] = useState('');

  // Captcha Minigame state
  const [captchaValue, setCaptchaValue] = useState(0);
  const [targetCaptchaValue, setTargetCaptchaValue] = useState(75);
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);

  // Main navigation view: 'landing' | 'checkout' | 'ritual' | 'oracles' | 'history' | 'admin'
  const [currentView, setCurrentView] = useState<'landing' | 'checkout' | 'ritual' | 'oracles' | 'history' | 'admin'>('landing');

  // Checkout and Pricing selected services
  const [selectedService, setSelectedService] = useState<'tarot' | 'horoscope' | 'ai_daily' | 'ai_weekly' | 'ai_monthly' | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'usdt' | 'bank'>('usdt');
  const [activePayment, setActivePayment] = useState<any>(null);
  const [bankTransfers, setBankTransfers] = useState<any[]>([]);

  // Interaction logs / UI message arrays
  const [aiPersonaTab, setAiPersonaTab] = useState<'tarot' | 'astrology' | 'coach'>('tarot');
  const [teaserInput, setTeaserInput] = useState('');
  const [teaserOutput, setTeaserOutput] = useState('');
  const [teaserLoading, setTeaserLoading] = useState(false);

  // Active Reading Inputs
  const [tarotSelectedCards, setTarotSelectedCards] = useState<number[]>([]);
  const [tarotFlipped, setTarotFlipped] = useState<boolean[]>([]);
  const [birthDetails, setBirthDetails] = useState({
    date: '1995-10-24',
    time: '21:15',
    location: 'Hà Nội'
  });
  const [oracleQuery, setOracleQuery] = useState('');
  const [readingOutput, setReadingOutput] = useState('');
  const [readingLoading, setReadingLoading] = useState(false);
  const [unlockedTarot, setUnlockedTarot] = useState(false);
  const [unlockedAstro, setUnlockedAstro] = useState(false);

  // Subscription Details & Countdown tick states
  const [isRenewalCheckout, setIsRenewalCheckout] = useState(false);
  const [tarotSubStatus, setTarotSubStatus] = useState<{
    unlocked: boolean;
    expired: boolean;
    canRenew: boolean;
    timeLeftMs: number;
    renewTimeLeftMs: number;
    payment: any;
  } | null>(null);

  const [astroSubStatus, setAstroSubStatus] = useState<{
    unlocked: boolean;
    expired: boolean;
    canRenew: boolean;
    timeLeftMs: number;
    renewTimeLeftMs: number;
    payment: any;
  } | null>(null);

  const [freeTurnsLeft, setFreeTurnsLeft] = useState<number>(3);
  const [aiSubStatus, setAiSubStatus] = useState<{
    unlocked: boolean;
    hasActiveSub: boolean;
    timeLeftMs: number;
    payment: any;
    freeTurnsLeft: number;
    totalUsed: number;
  } | null>(null);

  // Interval hook to tick down remaining time values
  useEffect(() => {
    const timer = setInterval(() => {
      setTarotSubStatus(prev => {
        if (!prev) return null;
        const nextTimeLeft = Math.max(0, prev.timeLeftMs - 1000);
        const nextRenewTimeLeft = Math.max(0, prev.renewTimeLeftMs - 1000);
        return {
          ...prev,
          timeLeftMs: nextTimeLeft,
          renewTimeLeftMs: nextRenewTimeLeft,
          unlocked: nextTimeLeft > 0,
          expired: nextTimeLeft <= 0,
          canRenew: nextTimeLeft <= 0 && nextRenewTimeLeft > 0
        };
      });
      setAstroSubStatus(prev => {
        if (!prev) return null;
        const nextTimeLeft = Math.max(0, prev.timeLeftMs - 1000);
        const nextRenewTimeLeft = Math.max(0, prev.renewTimeLeftMs - 1000);
        return {
          ...prev,
          timeLeftMs: nextTimeLeft,
          renewTimeLeftMs: nextRenewTimeLeft,
          unlocked: nextTimeLeft > 0,
          expired: nextTimeLeft <= 0,
          canRenew: nextTimeLeft <= 0 && nextRenewTimeLeft > 0
        };
      });
      setAiSubStatus(prev => {
        if (!prev) return null;
        const nextTimeLeft = Math.max(0, prev.timeLeftMs - 1000);
        return {
          ...prev,
          timeLeftMs: nextTimeLeft,
          unlocked: nextTimeLeft > 0
        };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (ms: number) => {
    if (ms <= 0) return "00:00:00";
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')} giờ : ${minutes.toString().padStart(2, '0')} phút : ${seconds.toString().padStart(2, '0')} giây`;
  };

  // Voice Speech & TTS Playback audio
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Notification popup toasts
  const [toast, setToast] = useState<{ text: string; mode: 'success' | 'info' | 'error' } | null>(null);

  // 🛡️ HB AI CHAT WIDGET STATES AND HANDLER
  const [isHbChatOpen, setIsHbChatOpen] = useState(false);
  const [hbMessages, setHbMessages] = useState<Array<{ role: 'user' | 'model'; message: string }>>([
    { role: 'model', message: 'Xin chào! Tôi là HB AI - Tổng đài Trí Tuệ Nhân Tạo Cao Cấp siêu thông minh của Mystic. Tôi ở đây để hỗ trợ bạn tất cả câu hỏi về các gói giải quẻ Tarot, Tử Vi, cách thanh toán kích hoạt, cũng như bất kỳ thắc mắc tri thức nào khác trên đời! Bạn muốn khám phá điều gì hôm nay?' }
  ]);
  const [hbInput, setHbInput] = useState('');
  const [hbLoading, setHbLoading] = useState(false);

  // Admin section details
  const [adminStats, setAdminStats] = useState<any>({ totalRevenue: 0, usersCount: 0, salesCount: 0, tarotSales: 0, horoscopeSales: 0, logs: [] });
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminTransfers, setAdminTransfers] = useState<any[]>([]);
  const [momoSimulateLoading, setMomoSimulateLoading] = useState(false);

  // Parallax stars
  const starsArray = useRef(Array.from({ length: 45 }).map(() => ({
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 5}s`,
    size: Math.random() > 0.6 ? 'w-1.5 h-1.5' : 'w-0.5 h-0.5'
  })));

  // Location restriction simulation values
  const [userLocation, setUserLocation] = useState({ city: 'Hồ Chí Minh', ip: '113.161.44.205', inVN: true });

  // Load User Data and states on Mount
  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    }
  }, [token]);

  // Handle toast timers
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Check locks when currentUser or view shifts
  useEffect(() => {
    if (currentUser) {
      checkServiceUnlocks();
    }
  }, [currentUser, currentView]);

  // Reset Captcha on Auth Mode change
  useEffect(() => {
    setCaptchaValue(0);
    setIsCaptchaVerified(false);
    // Generate a random target position between 55 and 85
    setTargetCaptchaValue(Math.floor(Math.random() * 30) + 55);
  }, [authMode]);

  const showToast = (text: string, mode: 'success' | 'info' | 'error' = 'info') => {
    setToast({ text, mode });
  };

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
      } else {
        handleLogout();
      }
    } catch {
      handleLogout();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('mystic_token');
    setToken(null);
    setCurrentUser(null);
    setCurrentView('landing');
    setUnlockedTarot(false);
    setUnlockedAstro(false);
    showToast('Đã đăng xuất tài khoản', 'info');
  };

  const checkServiceUnlocks = async () => {
    if (!token) return;
    try {
      const resTarot = await fetch('/api/payments/verify/tarot', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataTarot = await resTarot.json();
      setTarotSubStatus(dataTarot);
      setUnlockedTarot(dataTarot.unlocked);

      const resAstro = await fetch('/api/payments/verify/horoscope', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataAstro = await resAstro.json();
      setAstroSubStatus(dataAstro);
      setUnlockedAstro(dataAstro.unlocked);

      const resAiSub = await fetch('/api/payments/verify/ai_sub', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataAiSub = await resAiSub.json();
      setAiSubStatus(dataAiSub);
      setFreeTurnsLeft(dataAiSub.freeTurnsLeft);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!authEmail || !authPassword) {
      setAuthError('Vui lòng điền đầy đủ tài khoản & mật khẩu');
      return;
    }
    if (!isCaptchaVerified) {
      setAuthError('Vui lòng hoàn thành minigame trượt hình để xác minh!');
      return;
    }
    const path = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
    try {
      const res = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || 'Xảy ra lỗi xác thực');
        return;
      }
      localStorage.setItem('mystic_token', data.token);
      setToken(data.token);
      setCurrentUser(data.user);
      setAuthEmail('');
      setAuthPassword('');
      showToast(authMode === 'login' ? 'Đăng nhập thành công' : 'Đăng ký tài khoản thành công', 'success');
      
      // If we had a selected service, proceed to checkout
      if (selectedService) {
        setCurrentView('checkout');
      }
    } catch (err) {
      setAuthError('Không thể kết nối đến máy chủ');
    }
  };

  // Teaser Free preview for anonymous guests
  const handleTeaserPreview = async () => {
    if (!teaserInput.trim()) {
      showToast('Hãy nhập câu hỏi thắc mắc của bạn', 'error');
      return;
    }
    setTeaserLoading(true);
    setTeaserOutput('');
    try {
      const res = await fetch('/api/ai/teaser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceType: 'tarot', promptInput: teaserInput }),
      });
      const data = await res.json();
      if (res.ok) {
        setTeaserOutput(data.teaser);
      } else {
        showToast(data.error || 'Lỗi bốc quẻ thử nghiệm', 'error');
      }
    } catch (err) {
      showToast('Lỗi đường mòn kết nối chiêm tinh', 'error');
    } finally {
      setTeaserLoading(false);
    }
  };

  // Handler for HB AI Super Assistant
  const handleSendHbMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!hbInput.trim() || hbLoading) return;

    const userMsg = hbInput.trim();
    setHbInput('');
    
    const updatedMessages = [...hbMessages, { role: 'user' as const, message: userMsg }];
    setHbMessages(updatedMessages);
    setHbLoading(true);

    try {
      const res = await fetch('/api/ai/hb', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ messages: updatedMessages })
      });

      const data = await res.json();
      if (res.ok) {
        setHbMessages(prev => [...prev, { role: 'model', message: data.reply }]);
      } else {
        setHbMessages(prev => [...prev, { role: 'model', message: `⚠️ Có lỗi: ${data.error || 'HB AI đang thiền định'}` }]);
      }
    } catch (err) {
      console.error(err);
      setHbMessages(prev => [...prev, { role: 'model', message: '⚠️ Sóng kết nối vũ trụ bị gián đoạn. Vui lòng kiểm tra kết nối mạng và thử lại.' }]);
    } finally {
      setHbLoading(false);
    }
  };

  // Launch service checkout
  const triggerServicePurchase = (type: 'tarot' | 'horoscope' | 'ai_daily' | 'ai_weekly' | 'ai_monthly') => {
    setSelectedService(type);
    setIsRenewalCheckout(false);
    if (!token) {
      showToast('Vui lòng đăng nhập hoặc tạo tài khoản để thực hiện thanh toán', 'info');
      // Scroll to login box
      document.getElementById('auth-box')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      createPayment(type, false);
    }
  };

  const triggerServiceRenewal = (type: 'tarot' | 'horoscope') => {
    setSelectedService(type);
    setIsRenewalCheckout(true);
    if (!token) {
      showToast('Vui lòng đăng nhập hoặc tạo tài khoản để thực hiện thanh toán', 'info');
      document.getElementById('auth-box')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      createPayment(type, true);
    }
  };

  const createPayment = async (type: 'tarot' | 'horoscope' | 'ai_daily' | 'ai_weekly' | 'ai_monthly', isRenewal: boolean) => {
    try {
      const res = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ method: selectedPaymentMethod, serviceType: type, isRenewal }),
      });
      const data = await res.json();
      if (res.ok) {
        setActivePayment(data.payment);
        setCurrentView('checkout');
        if (isRenewal) {
          showToast('Khởi tạo hóa đơn GIA HẠN thành công (Đã giảm 150K!)', 'success');
        } else {
          showToast('Khởi tạo hóa đơn chiêm tinh thành công', 'success');
        }
      } else {
        showToast(data.error || 'Không thể tạo đơn hàng', 'error');
      }
    } catch {
      showToast('Lỗi mạng thanh toán', 'error');
    }
  };

  // Switch payment system methods dynamically
  const switchPaymentMethod = async (method: 'usdt' | 'bank') => {
    setSelectedPaymentMethod(method);
    if (selectedService && token) {
      try {
        const res = await fetch('/api/payments/create', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ method, serviceType: selectedService, isRenewal: isRenewalCheckout }),
        });
        const data = await res.json();
        if (res.ok) {
          setActivePayment(data.payment);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Copy bank transfer info helper
  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`Đã sao chép ${label}`, 'success');
  };

  // Webhook sandbox sim for immediate unlock
  const handleSimulatePaymentSuccess = async () => {
    if (!activePayment) return;
    setMomoSimulateLoading(true);
    try {
      const res = await fetch('/api/payments/momo-ipn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          orderCode: activePayment.orderCode, 
          status: 'success',
          transitionId: 'SIM-' + Math.random().toString(36).substr(2, 9).toUpperCase()
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('MoMo xác minh thành công! Giao dịch hợp lệ.', 'success');
        // Let's go to the sacred cosmic unlock ritual
        setTimeout(() => {
          setMomoSimulateLoading(false);
          setCurrentView('ritual');
        }, 1500);
      } else {
        showToast(data.error || 'Simulate MoMo failed', 'error');
        setMomoSimulateLoading(false);
      }
    } catch {
      showToast('Lỗi giả lập', 'error');
      setMomoSimulateLoading(false);
    }
  };

  // Mock Submit Bank Receipt (it registers as pending transfer)
  const handleSubmitBankTransferReceipt = () => {
    showToast('Hệ thống đã ghi nhận yêu cầu chuyển khoản. Đang chờ quản trị viên xác minh tài khoản.', 'success');
    setCurrentView('landing');
  };

  // Execute payment status check manually
  const checkPaymentStatus = async () => {
    if (!activePayment) return;
    try {
      const res = await fetch(`/api/payments/status/${activePayment.orderCode}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        if (data.status === 'success') {
          showToast('Cổng thanh toán xác nhận thành công!', 'success');
          setCurrentView('ritual');
        } else {
          showToast('Hóa đơn chưa được thanh toán thành công. Vui lòng kiểm tra lại.', 'info');
        }
      }
    } catch {
      showToast('Không kiểm tra được trạng thái hóa đơn', 'error');
    }
  };

  // Unlock Ritual Screen Timeout triggers Oracle Dashboard
  const completeRitualToOracles = () => {
    checkServiceUnlocks();
    if (selectedService === 'tarot') {
      setAiPersonaTab('tarot');
    } else if (selectedService === 'horoscope') {
      setAiPersonaTab('astrology');
    }
    setCurrentView('oracles');
    setReadingOutput('');
  };

  // AI Tarot Interactivity
  const selectTarotCard = (index: number) => {
    if (tarotSelectedCards.length >= 3) {
      showToast('Bạn đã bốc đủ 3 lá bài phân tích', 'info');
      return;
    }
    if (tarotSelectedCards.includes(index)) return;
    
    const nextArr = [...tarotSelectedCards, index];
    setTarotSelectedCards(nextArr);
    
    // Simulate interactive flip
    const flippArr = [...tarotFlipped];
    flippArr[index] = true;
    setTarotFlipped(flippArr);

    showToast(`Đã bốc lá thứ ${nextArr.length}: ${TAROT_DECK[index].name}`, 'success');
  };

  const resetTarotSelection = () => {
    setTarotSelectedCards([]);
    setTarotFlipped(Array(10).fill(false));
  };

  // Premium AI Reading Handler (Vetted via lock checking)
  const handleGenerateAIReading = async () => {
    let cardString = '';
    
    if (aiPersonaTab === 'tarot') {
      if (tarotSelectedCards.length < 3) {
        showToast('Bạn phải bốc đủ 3 lá bài để bắt đầu giải mật', 'error');
        return;
      }
      cardString = tarotSelectedCards.map(i => TAROT_DECK[i].name).join(', ');
    }

    setReadingLoading(true);
    setReadingOutput('');
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    }
    setAudioUrl(null);

    // Validate if the service is unlocked
    let isServiceUnlocked = false;
    const isBypass = currentUser?.role === 'admin';

    if (aiPersonaTab === 'tarot') {
      isServiceUnlocked = unlockedTarot;
    } else if (aiPersonaTab === 'astrology') {
      isServiceUnlocked = unlockedAstro;
    } else if (aiPersonaTab === 'coach') {
      isServiceUnlocked = !!aiSubStatus?.unlocked || freeTurnsLeft > 0;
    }

    if (!isServiceUnlocked && !isBypass) {
      if (aiPersonaTab === 'coach') {
        showToast('Thí chủ đã sử dụng hết 3 lượt đàm thoại miễn phí của trợ lý tịnh thất. Vui lòng đăng ký gói Siêu AI Vô Hạn (Nhật Linh/Thất Tinh/Nguyệt Tướng) để kết nối.', 'error');
      } else {
        showToast('Dịch vụ này bị khóa. Vui lòng thanh toán dâng lễ để kích hoạt.', 'error');
      }
      setReadingLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/ai/read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          serviceType: aiPersonaTab,
          promptInput: aiPersonaTab === 'coach' ? (oracleQuery || 'Hãy cho tôi một câu sấm truyền từ tinh đẩu') : `Giải mật quẻ quỷ chi tiết cho tôi`,
          birthDetails: aiPersonaTab === 'astrology' ? birthDetails : null,
          cardConfiguration: aiPersonaTab === 'tarot' ? cardString : null
        })
      });
      const data = await res.json();
      if (res.ok) {
        setReadingOutput(data.reading);
        showToast('Hội đồng tiên tri đã tìm ra thông điệp cho bạn!', 'success');
        // Instantly refresh remaining free turns on successful read
        checkServiceUnlocks();
      } else {
        showToast(data.error || 'Trục trặc đường mòn chiêm tinh', 'error');
      }
    } catch {
      showToast('Không thể kết nối đến tiên tri tối cao', 'error');
    } finally {
      setReadingLoading(false);
    }
  };

  // True Server-Side Gemini TTS narration conversion
  const handleGenerateTTSAudio = async () => {
    if (!readingOutput) return;
    setTtsLoading(true);
    try {
      const res = await fetch('/api/ai/tts', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: readingOutput, type: aiPersonaTab }),
      });
      const data = await res.json();
      if (res.ok && data.audioData) {
        // Decode base64 bytes dynamically into a playable sound element
        const pcmData = data.audioData;
        const sndUrl = `data:audio/wav;base64,${pcmData}`;
        setAudioUrl(sndUrl);
        setIsPlayingAudio(true);
        showToast('Tiên tri bắt đầu thuyết minh bài báo oai hùng...', 'success');
      } else {
        showToast(data.error || 'Lỗi khởi dựng giọng nói tiên tri', 'error');
      }
    } catch (err) {
      showToast('Hệ thống giọng nói Capicorn đang bận', 'error');
    } finally {
      setTtsLoading(false);
    }
  };

  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.load();
      audioRef.current.play().then(() => {
        setIsPlayingAudio(true);
      }).catch(() => {
        setIsPlayingAudio(false);
      });
    }
  }, [audioUrl]);

  const toggleAudioPlayback = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  // Speech input implementation (Vietnam & English languages)
  const triggerVoiceSpeechInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast('Trình duyệt của bạn không hỗ trợ công cụ nhận diện giọng nói Web Speech', 'error');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsRecording(true);
    showToast('Đang thu âm thầm tế lễ... Vui lòng nói vào micro bằng tiếng Việt.', 'info');

    recognition.start();

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setOracleQuery(text);
      if (currentView === 'landing') {
        setTeaserInput(text);
      }
      showToast('Đã ghi nhận lời thờ kính của bạn!', 'success');
      setIsRecording(false);
    };

    recognition.onerror = () => {
      showToast('Không nghe rõ lời hành khất. Vui lòng nói lại rõ hơn.', 'error');
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };
  };

  // Load Admin statistical layouts
  const loadAdminDatabase = async () => {
    try {
      const resStats = await fetch('/api/admin/analytics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataStats = await resStats.json();
      setAdminStats(dataStats);

      const resUsers = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataUsers = await resUsers.json();
      setAdminUsers(dataUsers.users);

      const resTransfers = await fetch('/api/admin/bank-transfers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataTransfer = await resTransfers.json();
      setAdminTransfers(dataTransfer.transfers);
    } catch {
      showToast('Lỗi tải cơ sở dữ liệu quản trị', 'error');
    }
  };

  // Admin approves manual transfers trigger
  const handleApproveBankTransfer = async (orderCode: string, action: 'success' | 'failed') => {
    try {
      const res = await fetch(`/api/admin/bank-transfers/${orderCode}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        showToast(action === 'success' ? 'Đã phê chuẩn chuyển khoản thành công!' : 'Đã từ chối chuyển khoản này!', 'success');
        loadAdminDatabase();
        checkServiceUnlocks();
      } else {
        showToast('Lỗi phê chuẩn hóa đơn', 'error');
      }
    } catch {
      showToast('Không kết nối được dịch vụ phê chuẩn', 'error');
    }
  };

  // Admin change role
  const handleChangeUserRole = async (userId: string, currentRole: string) => {
    try {
      const nextRole = currentRole === 'admin' ? 'user' : 'admin';
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: nextRole })
      });
      if (res.ok) {
        showToast('Cập nhật quyền hạn thành công', 'success');
        loadAdminDatabase();
      }
    } catch {
      showToast('Lỗi phân quyền', 'error');
    }
  };

  return (
    <div id="mystic-saas-root" className="min-h-screen relative overflow-hidden bg-[#050507] text-[#e0e0e0] font-sans flex flex-col selection:bg-[#C8A24A]/30">
      
      {/* BACKGROUND PARTICLE STARLIGHT & AMBIENT GLOW SHAPES */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-200px] left-[-100px] w-[600px] h-[600px] bg-[#C8A24A] opacity-5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] bg-[#4a1a6b] opacity-10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute inset-0 opacity-45 bg-[radial-gradient(circle_at_50%_40%,#1e1435_0%,transparent_70%)] animate-pulse duration-[8000ms]"></div>
        {starsArray.current.map((star, i) => (
          <div 
            key={i} 
            className={`absolute rounded-full bg-yellow-200/90 ${star.size}`}
            style={{
              top: star.top,
              left: star.left,
              animation: `pulse 3s infinite ease-in-out`,
              animationDelay: star.delay
            }}
          />
        ))}
      </div>

      {/* AUDIO NATIVE CONTROLLER */}
      {audioUrl && (
        <audio 
          ref={audioRef} 
          src={audioUrl} 
          onEnded={() => setIsPlayingAudio(false)} 
          className="hidden"
        />
      )}

      {/* TOAST SYSTEM POPUP */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl border border-yellow-500/20 bg-[#0c101b]/95 shadow-2xl backdrop-blur-md animate-bounce">
          <div className={`w-3 h-3 rounded-full ${toast.mode === 'success' ? 'bg-green-500' : toast.mode === 'error' ? 'bg-red-500' : 'bg-yellow-500 animate-ping'}`} />
          <span className="text-sm font-medium text-slate-200">{toast.text}</span>
        </div>
      )}

      {/* HEADER BAR */}
      <header className="sticky top-0 z-40 bg-[#050507]/90 backdrop-blur-xl border-b border-white/10 px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView('landing')}>
          <div className="flex flex-col">
            <span className="text-[#C8A24A] text-[10px] font-semibold tracking-[0.3em] uppercase mb-1 leading-none">Cosmic Intelligence</span>
            <h1 className="text-3xl font-serif text-white tracking-tight italic leading-tight">Mystic</h1>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col text-right">
            <div className="text-[9px] uppercase tracking-widest text-white/40 mb-1 leading-none">Location Detection</div>
            <div className="flex items-center gap-1.5 font-mono text-xs text-[#e0e0e0]">
              <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]"></div>
              <span>HANOI, VIETNAM (VND)</span>
            </div>
          </div>
          
          <nav className="flex items-center gap-6">
          <button 
            onClick={() => setCurrentView('landing')} 
            className={`text-sm hover:text-amber-300 transition-colors ${currentView === 'landing' ? 'text-[#C8A24A] font-medium' : 'text-slate-400'}`}
          >
            Trang Chủ
          </button>
          
          {token && (
            <button 
              onClick={() => {
                checkServiceUnlocks();
                setCurrentView('oracles');
              }} 
              className={`text-sm hover:text-amber-300 transition-colors ${currentView === 'oracles' ? 'text-[#C8A24A] font-medium' : 'text-slate-400'}`}
            >
              Hành Tế Chiêm Tinh
            </button>
          )}

          {token && (
            <button 
              onClick={() => {
                checkServiceUnlocks();
                setCurrentView('subscriptions');
              }} 
              className={`text-sm hover:text-amber-300 transition-colors ${currentView === 'subscriptions' ? 'text-[#C8A24A] font-medium' : 'text-slate-400'}`}
            >
              Quản lý Gói Dịch Vụ
            </button>
          )}

          {currentUser?.role === 'admin' && (
            <button 
              onClick={() => {
                loadAdminDatabase();
                setCurrentView('admin');
              }}
              className="px-3.5 py-1.5 rounded-lg border border-red-500/30 bg-red-950/20 text-red-300 text-xs font-semibold hover:bg-red-950/40 transition-all flex items-center gap-1"
            >
              <Cpu className="w-3.5 h-3.5" />
              Bàn Quản Trị
            </button>
          )}

          {currentUser ? (
            <div className="flex items-center gap-3 border-l border-slate-800 pl-6">
              <div className="flex flex-col text-right">
                <span className="text-xs text-slate-400 font-mono">Tài khoản</span>
                <span className="text-xs font-medium text-[#C8A24A] max-w-[130px] truncate">{currentUser.email}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 rounded-lg bg-slate-900/50 border border-slate-800 hover:text-red-400 transition-all cursor-pointer"
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <a 
              href="#auth-box" 
              className="px-4 py-2 text-xs rounded-lg font-medium text-slate-900 bg-amber-400 hover:bg-[#C8A24A] transition-all font-serif"
            >
              Kết Nối Thiên Cơ
            </a>
          )}
        </nav>
      </div>
    </header>

      {/* CONTAINER CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 z-10 flex flex-col justify-center">

        {/* 1. LANDING OFFICE VIEWS */}
        {currentView === 'landing' && (
          <div className="space-y-16 py-8">
            {/* LUXURY COSMIC HERO */}
            <div className="text-center max-w-3xl mx-auto space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#C8A24A]/20 bg-[#C8A24A]/5 text-[#C8A24A] text-xs font-semibold font-mono uppercase tracking-widest leading-none">
                <Sparkles className="w-3.5 h-3.5" /> Nền Tảng Tiên Tri Kỹ Nghệ Tài Chính Tâm Linh Đẳng Cấp
              </div>
              <h2 className="text-4xl sm:text-6xl font-extrabold font-serif tracking-tight leading-none leading-tight">
                Khai Mở <span className="text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-yellow-600">Vận Mệnh</span> <br />Bằng Niềm Tin Vũ Trụ
              </h2>
              <p className="text-base text-slate-400 max-w-xl mx-auto font-sans leading-relaxed">
                Được vận hành bởi Trí Tuệ Nhân Tạo Cao Cấp bậc nhất kết hợp với các môn chiêm tinh cổ xưa bậc nhất Việt Nam. Bảo đảm độ chuẩn xác, thấu hiểu tột độ tâm hồn bạn.
              </p>
              
              <div className="flex items-center justify-center gap-4 pt-4">
                <a 
                  href="#pricing-section" 
                  className="px-7 py-3.5 font-serif rounded-xl text-sm font-semibold bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 shadow-2xl transition-all hover:scale-105 active:scale-95 duration-200 flex items-center gap-2"
                >
                  Bắt Đầu Giải Mã <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* TEASER FREE PREVIEW TRIAL */}
            <div className="max-w-2xl mx-auto rounded-2xl border border-slate-800/80 bg-[#090d16]/70 p-6 backdrop-blur-xl shadow-2xl relative">
              <div className="absolute -top-3.5 left-6 px-3 py-1 bg-indigo-950/80 border border-indigo-700/30 rounded-md text-[10px] font-bold text-indigo-300 uppercase tracking-widest font-mono">
                🔮 Quẻ Thử Nghiệm Gợi Mở (Guest Preview)
              </div>
              <h3 className="text-base font-serif font-bold text-amber-200 mt-2 mb-1.5">Tham Khảo Vận Năng Ngay Bây Giờ</h3>
              <p className="text-xs text-slate-400 mb-4">Gõ câu hỏi thắc mắc trong lòng hoặc chọn bốc ngẫu nhiên để nhà tiên tri gợi ý con đường sáng của các chòm sao.</p>
              
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <input 
                    type="text" 
                    value={teaserInput}
                    onChange={(e) => setTeaserInput(e.target.value)}
                    placeholder="Hôm nay tình cảm của tôi sẽ chuyển biến thế nào?..." 
                    className="w-full bg-[#03060a] border border-slate-800 focus:border-yellow-500/60 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-yellow-500/20"
                  />
                  <button 
                    onClick={triggerVoiceSpeechInput}
                    className={`absolute right-3.5 top-2.5 p-1.5 rounded-lg transition-colors cursor-pointer ${isRecording ? 'text-red-400 animate-ping' : 'text-slate-400 hover:text-[#C8A24A]'}`}
                    title="Nói giọng nói tiếng Việt"
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                </div>
                <button 
                  onClick={handleTeaserPreview}
                  disabled={teaserLoading}
                  className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-slate-100 font-medium text-sm transition-colors cursor-pointer flex items-center gap-2"
                >
                  {teaserLoading ? 'Đang giải mã...' : 'Khởi Quẻ'} 
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                </button>
              </div>

              {teaserOutput && (
                <div className="mt-5 p-4 rounded-xl border border-yellow-500/10 bg-yellow-500/5 text-sm text-yellow-100 animate-fadeIn font-serif leading-relaxed">
                  <p className="font-bold text-xs text-[#C8A24A] uppercase tracking-wider mb-1">Mật ngữ từ tinh hà:</p>
                  "{teaserOutput}"
                  <div className="mt-3.5 pt-2 border-t border-yellow-500/10 text-right">
                    <a href="#pricing-section" className="text-xs font-semibold text-amber-400 underline hover:text-amber-300">Trả phí để đọc bản giải quẻ chi tiết trọn bộ & nghe thuyết minh giọng nói 🎙️</a>
                  </div>
                </div>
              )}
            </div>

            {/* LOCKED PRICING CARDS SECTION */}
            <div id="pricing-section" className="space-y-8 scroll-mt-20">
              <div className="text-center space-y-2">
                <h3 className="text-3xl font-serif font-bold text-slate-100">Bản Giá Hành Tế Thiên Thần</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">Cam kết bảo mật giao dịch ngân hàng tuyệt đối cấp Fintech - Mở khoá phiên giải quẻ sâu trọn vẹn.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {/* CARD 1: TAROT */}
                <div className="group bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col justify-between transition-all hover:bg-white/10 hover:border-[#C8A24A]/50 relative">
                  <div>
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6">
                      <span className="text-2xl text-[#C8A24A]">🔮</span>
                    </div>
                    <h2 className="text-3xl font-serif italic text-white mb-2">Tarot Reading</h2>
                    <p className="text-sm text-white/50 leading-relaxed mb-6">Explore the unseen threads of fate through our AI-guided major arcana session with voice narration.</p>
                    <ul className="mt-6 space-y-3.5 text-xs text-white/40 font-sans">
                      <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-amber-500/70 flex-shrink-0" /> Tùy biến bốc 3 lá bài theo cấu hình ý nguyện</li>
                      <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-amber-500/70 flex-shrink-0" /> Phân tích tương quan Chiều xuôi & ngược của Tarot</li>
                      <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-amber-500/70 flex-shrink-0" /> Độc quyền TTS Thuyết minh Giọng nói Huyền Ẩn</li>
                      <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-amber-500/70 flex-shrink-0" /> Khóa vĩnh viễn, lưu quẻ chép tạng vĩnh hằng</li>
                    </ul>
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-white/10">
                    <div className="text-2xl font-mono text-[#C8A24A] mb-4">400,000 <span className="text-xs text-white/40">VND</span></div>
                    <button 
                      onClick={() => triggerServicePurchase('tarot')}
                      className="w-full bg-white/5 border border-white/20 py-4 rounded-xl text-xs uppercase tracking-widest font-bold text-white transition-all hover:bg-white hover:text-black hover:border-transparent cursor-pointer"
                    >
                      Select Service
                    </button>
                  </div>
                </div>

                {/* CARD 2: ASTROLOGY */}
                <div className="bg-white/5 border border-[#C8A24A]/50 rounded-3xl p-8 flex flex-col justify-between relative shadow-[0_0_40px_rgba(200,162,74,0.1)]">
                  <div className="absolute top-4 right-4 bg-[#C8A24A] text-black text-[9px] px-2 py-1 font-bold rounded uppercase tracking-tighter">Most Requested</div>
                  <div>
                    <div className="w-12 h-12 bg-[#C8A24A]/20 rounded-2xl flex items-center justify-center mb-6">
                      <span className="text-2xl text-[#C8A24A]">🌌</span>
                    </div>
                    <h2 className="text-3xl font-serif italic text-white mb-2">Tử vi / Horoscope</h2>
                    <p className="text-sm text-white/50 leading-relaxed mb-6">A precision-calculated cosmic map of your destiny. Ancient Vietnamese wisdom powered by neural architecture.</p>
                    <ul className="mt-6 space-y-3.5 text-xs text-white/40 font-sans">
                      <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[#C8A24A]/70 flex-shrink-0" /> Thiết lập chiêm tinh bản đồ hoàng đạo giờ sinh</li>
                      <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[#C8A24A]/70 flex-shrink-0" /> Phân tích chuyển dịch chu kỳ các hành tinh chu hoàn</li>
                      <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[#C8A24A]/70 flex-shrink-0" /> Giọng nói oai nghiêm Fenrir độc quyền TTS</li>
                      <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[#C8A24A]/70 flex-shrink-0" /> Xuất tập tin lưu ký số mệnh để chiêm bái vĩnh viễn</li>
                    </ul>
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-white/10">
                    <div className="text-2xl font-mono text-[#C8A24A] mb-4">650,000 <span className="text-xs text-white/40">VND</span></div>
                    <button 
                      onClick={() => triggerServicePurchase('horoscope')}
                      className="w-full bg-[#C8A24A] py-4 rounded-xl text-xs uppercase tracking-widest font-bold text-black hover:bg-white hover:text-black transition-all cursor-pointer"
                    >
                      Active Selection
                    </button>
                  </div>
                </div>
              </div>

              <div className="text-center space-y-2 pt-10">
                <h3 className="text-2xl font-serif font-bold text-slate-100 flex items-center justify-center gap-2">
                  <span>✨</span> Gói Đăng Ký Siêu AI Chiêm Tinh Vô Hạn <span>✨</span>
                </h3>
                <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
                  Đăng ký nhận lực lượng linh cốt để mở khóa đàm thoại VÔ HẠN LƯỢT với toàn bộ 3 Đại sư tại Hành Tế Chiêm Tinh (Tarot AI, Astrology AI, Coach AI) không lo giới hạn lượt quẻ.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {/* Gói Ngày */}
                <div className="bg-[#090d16]/80 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between hover:border-amber-500/30 hover:scale-[1.01] transition-all relative">
                  <div>
                    <div className="absolute top-4 right-4 bg-orange-950/40 border border-orange-500/20 text-orange-400 text-[8px] font-mono tracking-widest px-2 py-0.5 rounded uppercase font-bold">Daily</div>
                    <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center mb-4">
                      <span className="text-xl text-[#C8A24A]">✨</span>
                    </div>
                    <h3 className="text-base font-serif font-bold text-slate-200">Chiêm Tinh Nhật Linh</h3>
                    <p className="text-xs text-slate-400 mt-2 mb-4 leading-relaxed">Mở cửa tịnh thất sấm truyền vô hại. Tự do lục xem túc mệnh suốt 24 giờ liên tục.</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-850">
                    <div className="text-lg font-mono text-[#C8A24A] mb-3 font-bold">50,000 <span className="text-xs text-white/40">VND</span></div>
                    <button 
                      onClick={() => triggerServicePurchase('ai_daily')}
                      className="w-full bg-slate-900 border border-slate-700 py-3 rounded-xl text-xs uppercase tracking-widest font-bold text-white hover:bg-white hover:text-black hover:border-transparent transition-all cursor-pointer"
                    >
                      Kết Nối Thần Lực
                    </button>
                  </div>
                </div>

                {/* Gói Tuần */}
                <div className="bg-[#090d16]/80 border border-amber-500/25 rounded-3xl p-6 flex flex-col justify-between hover:border-amber-500/50 hover:scale-[1.01] transition-all relative shadow-[0_0_30px_rgba(200,162,74,0.02)]">
                  <div>
                    <div className="absolute top-4 right-4 bg-[#C8A24A] text-black text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-wider">Linh Phù Hot</div>
                    <div className="w-10 h-10 bg-[#C8A24A]/25 rounded-xl flex items-center justify-center mb-4">
                      <span className="text-xl text-[#C8A24A]">💫</span>
                    </div>
                    <h3 className="text-base font-serif font-bold text-amber-200">Chiêm Tinh Thất Tinh</h3>
                    <p className="text-xs text-slate-400 mt-2 mb-4 leading-relaxed">Kết nối thần khí tâm linh siêu việt suốt 7 ngày đêm. Trọn niềm cát tài hỷ lạc.</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-850">
                    <div className="text-lg font-mono text-amber-300 mb-3 font-bold">170,000 <span className="text-xs text-white/40">VND</span></div>
                    <button 
                      onClick={() => triggerServicePurchase('ai_weekly')}
                      className="w-full bg-[#C8A24A] py-3 rounded-xl text-xs uppercase tracking-widest font-bold text-black hover:bg-white hover:text-black hover:border-transparent transition-all cursor-pointer"
                    >
                      Khởi Hoạt Pháp Quyền
                    </button>
                  </div>
                </div>

                {/* Gói Tháng */}
                <div className="bg-[#090d16]/80 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between hover:border-amber-500/30 hover:scale-[1.01] transition-all relative">
                  <div>
                    <div className="absolute top-4 right-4 bg-purple-950/40 border border-purple-500/20 text-purple-400 text-[8px] font-mono tracking-widest px-2 py-0.5 rounded uppercase font-bold">Monthly</div>
                    <div className="w-10 h-10 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center mb-4">
                      <span className="text-xl text-[#C8A24A]">🔮</span>
                    </div>
                    <h3 className="text-base font-serif font-bold text-slate-200">Chiêm Tinh Nguyệt Tướng</h3>
                    <p className="text-xs text-slate-400 mt-2 mb-4 leading-relaxed">Cam kết mở rộng kết giới thần linh bền vững 30 ngày. Thông suốt vận đạo càn khôn.</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-850">
                    <div className="text-lg font-mono text-[#C8A24A] mb-3 font-bold">269,000 <span className="text-xs text-white/40">VND</span></div>
                    <button 
                      onClick={() => triggerServicePurchase('ai_monthly')}
                      className="w-full bg-slate-900 border border-slate-700 py-3 rounded-xl text-xs uppercase tracking-widest font-bold text-white hover:bg-white hover:text-black hover:border-transparent transition-all cursor-pointer"
                    >
                      Đắc Đạo Thiên Không Phù
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* REGISTER PORTAL FOR CLIENTS */}
            {!currentUser && (
              <div id="auth-box" className="max-w-md mx-auto rounded-3xl border border-white/10 bg-[#0c0d16]/95 backdrop-blur-md p-8 shadow-3xl text-center relative scroll-mt-20 my-10">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full border border-yellow-500/25 bg-slate-950 text-xs font-bold text-[#C8A24A] uppercase tracking-widest shadow-xl">
                  ✨ Xác Thực Thành Viên
                </div>
                
                <h3 className="text-xl font-bold text-white mt-4 mb-2">
                  {authMode === 'login' ? 'Đăng Nhập Tài Khoản' : 'Đăng Ký Tài Khoản'}
                </h3>
                <p className="text-xs text-white/60 mb-6 font-sans">
                  {authMode === 'login' 
                    ? 'Đăng nhập để xem lịch sử giải quẻ và quản lý tài khoản.' 
                    : 'Tạo tài khoản mới để lưu giữ trọn vẹn lịch sử tư vấn tâm linh.'}
                </p>

                {authError && (
                  <div className="bg-red-950/20 border border-red-500/30 text-red-200 text-xs rounded-xl py-2.5 px-3 mb-4 leading-relaxed font-sans text-left animate-pulse">
                    {authError}
                  </div>
                )}

                <form onSubmit={handleAuthSubmit} className="space-y-4 text-left font-sans">
                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-widest text-[#e0e0e0]/70 mb-1.5">Địa chỉ Email</label>
                    <input 
                      type="email" 
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="ten_cua_ban@domain.com"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#C8A24A]/60 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-widest text-[#e0e0e0]/70 mb-1.5">Mật khẩu</label>
                    <input 
                      type="password" 
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#C8A24A]/60 transition-all"
                    />
                  </div>

                  {/* CAPTCHA MINIGAME */}
                  <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/10 text-center select-none shadow-inner">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">Xác thực bằng Minigame</span>
                      <button 
                        type="button"
                        onClick={() => {
                          setCaptchaValue(0);
                          setIsCaptchaVerified(false);
                          setTargetCaptchaValue(Math.floor(Math.random() * 30) + 55);
                        }}
                        className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                        title="Tải lại captcha"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    
                    <p className="text-[11px] text-slate-400 mb-3 text-left">
                      Trượt thanh để đưa hành tinh <span className="text-[#C8A24A] font-bold">✨</span> vào tâm quỹ đạo <span className="text-red-400 font-bold">🪐</span>
                    </p>

                    {/* CAPTCHA TRACK FRAME */}
                    <div className="relative h-12 w-full bg-slate-950 rounded-xl overflow-hidden border border-white/5 flex items-center shadow-black shadow-md">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,#1e1b4b_0%,transparent_80%)]"></div>
                      
                      {/* Grid Lines */}
                      <div className="absolute inset-y-0 left-1/4 border-l border-white/5 border-dashed"></div>
                      <div className="absolute inset-y-0 left-2/4 border-l border-white/5 border-dashed"></div>
                      <div className="absolute inset-y-0 left-3/4 border-l border-white/5 border-dashed"></div>

                      {/* TARGET ZONE (Orbit) */}
                      <div 
                        className="absolute w-8 h-8 rounded-full border-2 border-dashed border-red-500/50 flex items-center justify-center text-xs animate-pulse bg-red-950/20"
                        style={{ left: `calc(${targetCaptchaValue}% - 16px)` }}
                      >
                        🪐
                      </div>

                      {/* DRAGGABLE PIECE */}
                      <div 
                        className="absolute w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-400 border border-yellow-200 flex items-center justify-center text-sm shadow-[0_0_12px_rgba(250,204,21,0.5)] transition-all duration-75"
                        style={{ left: `calc(${captchaValue}% - 16px)` }}
                      >
                        ✨
                      </div>
                    </div>

                    {/* INPUT SLIDER */}
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={captchaValue}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setCaptchaValue(val);
                        if (Math.abs(val - targetCaptchaValue) <= 4) {
                          setIsCaptchaVerified(true);
                        } else {
                          setIsCaptchaVerified(false);
                        }
                      }}
                      className="w-full h-1 mt-4 rounded-lg appearance-none cursor-pointer accent-[#C8A24A] bg-white/10"
                    />

                    {/* STATUS MESSAGE */}
                    <div className="mt-2 text-[11px] font-medium min-h-[16px]">
                      {isCaptchaVerified ? (
                        <span className="text-green-400 flex items-center justify-center gap-1 animate-pulse">
                          ✓ Xác thực thành công! Hệ thống đã mở khóa.
                        </span>
                      ) : (
                        <span className="text-slate-400">
                          Độ lệch mảnh ghép: {Math.abs(captchaValue - targetCaptchaValue)}%
                        </span>
                      )}
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="w-full py-3.5 rounded-xl font-semibold text-slate-950 bg-amber-400 hover:bg-[#C8A24A] transition-all cursor-pointer shadow-xl mt-4 text-xs uppercase tracking-widest"
                  >
                    {authMode === 'login' ? 'Đăng Nhập Ngay' : 'Đăng Ký Tài Khoản'}
                  </button>
                </form>

                <div className="mt-5 pt-4 border-t border-white/5 text-xs text-slate-400">
                  {authMode === 'login' ? (
                    <span>Chưa có tài khoản? <button onClick={() => setAuthMode('register')} className="text-amber-400 hover:underline cursor-pointer">Đăng ký thành viên mới</button></span>
                  ) : (
                    <span>Đã có tài khoản thành viên? <button onClick={() => setAuthMode('login')} className="text-amber-400 hover:underline cursor-pointer">Đăng nhập tại đây</button></span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. CHALICE GATEWAY CHECKOUT SCREEN */}
        {currentView === 'checkout' && activePayment && (
          <div className="max-w-4xl mx-auto py-8 space-y-8 animate-fadeIn">
            {/* SPIRITUAL GILDED HEADER */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#C8A24A]/30 bg-amber-950/20 text-[#C8A24A] text-xs font-mono font-bold uppercase tracking-wider">
                <span>✦</span> Đàn Tràng Kích Hoạt Pháp Bảo <span>✦</span>
              </div>
              <h2 className="text-3xl font-serif font-extrabold text-[#e0e0e0] tracking-tight">
                Cung Nghinh Quyên Góp Lễ Vật
              </h2>
              <p className="text-sm text-slate-400 max-w-xl mx-auto">
                Mã vận số duy nhất: <span className="font-mono text-amber-400 font-bold">{activePayment.orderCode}</span>. Thời gian kết nối thần khí còn lại: <span className="text-red-400 font-mono font-bold">15:00 phút</span>.
              </p>
            </div>

            <div className="grid md:grid-cols-12 gap-8 items-start">
              {/* BILL PAYMENT METHODS (LEFT - Column 5) */}
              <div className="md:col-span-5 space-y-4">
                <div className="rounded-2xl border border-slate-800/80 bg-[#090d16] p-5 space-y-4 shadow-[0_0_50px_rgba(200,162,74,0.01)]">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-[#C8A24A]">Chọn Kênh Dâng Lễ</h4>
                  
                  {/* USDT CRYPTO CARD CHOOSE */}
                  <div 
                    onClick={() => switchPaymentMethod('usdt')}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${selectedPaymentMethod === 'usdt' ? 'border-[#C8A24A] bg-amber-950/10' : 'border-slate-800 hover:border-slate-700 bg-[#03060a]'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center justify-center font-bold text-emerald-400 select-none shrink-0">
                        <span className="text-lg">₮</span>
                        <span className="text-[8px] font-black tracking-tighter uppercase -mt-1 text-emerald-300">USDT</span>
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-slate-200">USDT (Mạng TRC20)</h5>
                        <p className="text-[10px] text-slate-400">Tối ưu hóa phí ga, duyệt tức thì</p>
                      </div>
                    </div>
                    <div className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center ${selectedPaymentMethod === 'usdt' ? 'border-[#C8A24A]' : 'border-slate-700'}`}>
                      {selectedPaymentMethod === 'usdt' && <div className="w-2 h-2 rounded-full bg-[#C8A24A]" />}
                    </div>
                  </div>

                  {/* TECHCOMBANK CARD CHOOSE */}
                  <div 
                    onClick={() => switchPaymentMethod('bank')}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${selectedPaymentMethod === 'bank' ? 'border-[#C8A24A] bg-amber-950/10' : 'border-slate-800 hover:border-slate-700 bg-[#03060a]'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm select-none shrink-0 p-1">
                        <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M15 50 L50 15 L50 37.5 L27.5 50 L50 62.5 L50 85 Z" fill="#D71920" />
                          <path d="M85 50 L50 15 L50 37.5 L72.5 50 L50 62.5 L50 85 Z" fill="#D71920" />
                        </svg>
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-slate-200">Ngân hàng Techcombank</h5>
                        <p className="text-[10px] text-slate-400">Chuyển nhanh VietQR 24/7</p>
                      </div>
                    </div>
                    <div className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center ${selectedPaymentMethod === 'bank' ? 'border-[#C8A24A]' : 'border-slate-700'}`}>
                      {selectedPaymentMethod === 'bank' && <div className="w-2 h-2 rounded-full bg-[#C8A24A]" />}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#C8A24A]/10 bg-gradient-to-b from-[#C8A24A]/5 to-transparent p-4 text-center">
                  <p className="text-[11px] text-[#C8A24A] leading-relaxed italic">
                    👁️ “Duyên khởi từ tâm, số mệnh vận hành tương thích. Khi lễ phẩm cúng dường được hoàn thành chuẩn xác, linh lực vạn cổ tự động khai mở sấm truyền.”
                  </p>
                </div>
              </div>

              {/* DYNAMIC QR CODE DISPLAY PANEL (RIGHT - Column 7) */}
              <div className="md:col-span-7">
                {selectedPaymentMethod === 'usdt' ? (
                  /* USDT CELESTIAL CRYPTO PANEL */
                  <div className="bg-[#090d16]/90 border border-[#C8A24A]/25 rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-[0_0_50px_rgba(200,162,74,0.03)] space-y-6 animate-fadeIn">
                    <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#C8A24A]">Cổng Nạp USDT Tâm Linh Thần Tốc</h4>
                    
                    <div className="bg-white p-4 rounded-3xl shadow-[0_0_50px_rgba(255,255,255,0.05)] inline-block relative border-2 border-[#C8A24A]/50">
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-emerald-600 font-mono tracking-widest leading-none mb-3">TETHER USDT (TRC20)</span>
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=059669&data=TYDx9Lp1hB54CksyK8gTr6E1HjVv7G23xP`}
                          alt="USDT TRC20 Spiritual Address" 
                          className="w-40 h-40 rounded-lg object-contain"
                        />
                      </div>
                      <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-[#C8A24A] text-slate-950 text-[9px] font-mono font-extrabold px-3 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap">
                        Mạng TRON (TRC-20)
                      </div>
                    </div>

                    <div className="text-center space-y-2 mt-2">
                      <div className="text-emerald-400 font-serif font-bold text-lg">Hộ Vệ USDT Tối Thượng</div>
                      <p className="text-[10.5px] text-slate-400 max-w-sm leading-relaxed">
                        Hãy gửi linh lực đúng số lượng <span className="text-yellow-400 font-mono font-bold font-serif">{(activePayment.amount / 25000).toFixed(1)} USDT</span> vào địa chỉ bảo mật bên dưới.
                      </p>
                    </div>

                    <div className="space-y-3.5 w-full text-left py-2 font-sans text-xs border-t border-white/5">
                      <div className="flex justify-between items-center pb-2 border-b border-white/5">
                        <span className="text-slate-400 text-[11px] uppercase tracking-wider">Địa Chỉ Ví (TRC20):</span>
                        <div className="flex items-center gap-1.5 bg-[#03060a]/90 px-3 py-1.5 rounded-lg border border-slate-800">
                          <span className="font-mono text-[11px] text-[#C8A24A] font-medium">TYDx9Lp1hB54...7G23xP</span>
                          <button 
                            onClick={() => handleCopyText('TYDx9Lp1hB54CksyK8gTr6E1HjVv7G23xP', 'Địa chỉ ví USDT')} 
                            className="p-1 rounded hover:bg-white/10"
                            title="Sao chép địa chỉ ví"
                          >
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pb-2 border-b border-white/5">
                        <span className="text-slate-400 text-[11px] uppercase tracking-wider">Số Lượng Lễ Vật:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-extrabold text-[#e0e0e0] text-sm">{(activePayment.amount / 25000).toFixed(1)} USDT</span>
                          <span className="text-[10px] text-slate-500 font-mono italic">(~ {activePayment.amount.toLocaleString('vi-VN')} VND)</span>
                          <button 
                            onClick={() => handleCopyText(String((activePayment.amount / 25000).toFixed(1)), 'Số lượng USDT')} 
                            className="p-1 rounded hover:bg-white/10"
                          >
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pb-2 border-b border-white/5">
                        <span className="text-slate-400 text-[11px] uppercase tracking-wider">Ký Tự Kích Vận (Memo/Ghi chú):</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-red-400 bg-red-950/20 px-2.5 py-1 rounded border border-red-500/20">{activePayment.orderCode}</span>
                          <button 
                            onClick={() => handleCopyText(activePayment.orderCode, 'Nội dung Memo')} 
                            className="p-1 rounded hover:bg-white/10"
                          >
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <p className="text-[10px] text-yellow-500 max-w-sm leading-normal font-sans tracking-wide">
                      ⚠️ Kiểm tra kỹ định dạng mạng lưới TRC20 và số lượng để hệ thống kích hoạt tự động tức thì.
                    </p>

                    <div className="flex items-center gap-3 w-full pt-2">
                      <button 
                        onClick={checkPaymentStatus}
                        className="flex-1 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 rounded-xl text-xs uppercase tracking-widest font-bold font-mono hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                      >
                        Tôi Đã Chuyển USDT ✦ Xác Minh Pháp Bảo
                      </button>
                    </div>
                  </div>
                ) : (
                  /* TECHCOMBANK PAY GRAPH */
                  <div className="bg-[#090d16]/90 border border-[#C8A24A]/25 rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-[0_0_50px_rgba(200,162,74,0.03)] space-y-6 animate-fadeIn">
                    <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#C8A24A]">Cổng VietQR Ngân Hàng Kích Hoạt Tự Động</h4>

                    <div className="bg-white p-4 rounded-3xl shadow-[0_0_50px_rgba(255,255,255,0.05)] inline-block border-2 border-[#C8A24A]/50">
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-red-600 font-mono tracking-widest leading-none mb-3">TECHCOMBANK VIETQR</span>
                        <img 
                          src={`https://img.vietqr.io/image/970407-0978567205-compact2.png?amount=${activePayment.amount}&addInfo=${activePayment.orderCode}&accountName=LE%20HUY%20BAO`}
                          alt="Techcombank VietQR Lê Huy Bảo" 
                          className="w-40 h-40 rounded-lg object-contain"
                        />
                      </div>
                    </div>

                    <div className="text-center space-y-2 mt-2">
                      <div className="text-[#C8A24A] font-bold text-lg font-serif">Chuyển Khoản Đắc Lộc</div>
                      <p className="text-[10.5px] text-slate-400 max-w-sm leading-relaxed">
                        Chụp hoặc quét mã QR bằng ứng dụng ngân hàng thương mại để dâng lễ vật <span className="text-yellow-400 font-bold font-mono">{(activePayment.amount).toLocaleString('vi-VN')} VND</span> chuẩn xác.
                      </p>
                    </div>

                    <div className="space-y-3.5 w-full text-left py-2 font-sans text-xs border-t border-white/5">
                      <div className="flex justify-between items-center pb-2 border-b border-white/5">
                        <span className="text-slate-400 text-[11px] uppercase tracking-wider">Ngân hàng thụ nhận:</span>
                        <span className="font-bold text-slate-200">Techcombank</span>
                      </div>
                      
                      <div className="flex justify-between items-center pb-2 border-b border-white/5">
                        <span className="text-slate-400 text-[11px] uppercase tracking-wider">Số tài khoản linh căn:</span>
                        <div className="flex items-center gap-1.5 bg-[#03060a]/90 px-3 py-1.2 rounded-lg border border-slate-800">
                          <span className="font-mono font-bold text-[#C8A24A]">0978567205</span>
                          <button onClick={() => handleCopyText('0978567205', 'Số tài khoản')} className="p-1 rounded hover:bg-white/10" title="Sao chép số tài khoản"><Copy className="w-3.5 h-3.5 text-slate-400" /></button>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pb-2 border-b border-white/5">
                        <span className="text-slate-400 text-[11px] uppercase tracking-wider">Danh tính đệ tử thụ giáo:</span>
                        <span className="font-bold text-slate-200">LÊ HUY BẢO</span>
                      </div>

                      <div className="flex justify-between items-center pb-2 border-b border-white/5">
                        <span className="text-slate-400 text-[11px] uppercase tracking-wider">Lượng số vàng dâng hiến:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-extrabold text-slate-200">{(activePayment.amount).toLocaleString('vi-VN')} VND</span>
                          <button onClick={() => handleCopyText(String(activePayment.amount), 'Số tiền')} className="p-1 rounded hover:bg-white/10" title="Sao chép số tiền"><Copy className="w-3.5 h-3.5 text-slate-400" /></button>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pb-2 border-b border-white/5">
                        <span className="text-slate-400 text-[11px] uppercase tracking-wider">Nội dung sấm truyền:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-extrabold text-red-400 bg-red-950/20 px-2.5 py-1 rounded border border-red-500/20">{activePayment.orderCode}</span>
                          <button onClick={() => handleCopyText(activePayment.orderCode, 'Nội dung chuyển khoản')} className="p-1 rounded hover:bg-white/10" title="Sao chép nội dung sấm truyền"><Copy className="w-3.5 h-3.5 text-slate-400" /></button>
                        </div>
                      </div>
                    </div>

                    <p className="text-[10px] text-yellow-500 max-w-sm leading-normal font-sans tracking-wide">
                      ⚠️ Phải ghi chính xác 100% Nội dung sấm truyền bên trên để hệ thống tự động tháo giải quẻ cho hữu duyên đệ tử.
                    </p>

                    <div className="flex items-center gap-3 w-full pt-2">
                      <button 
                        onClick={checkPaymentStatus}
                        className="flex-1 py-4 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 rounded-xl text-xs uppercase tracking-widest font-bold font-mono hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
                      >
                        Tôi Đã Chuyển Khoản VietQR ✦ Xác Minh Pháp Bảo
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}


        {/* 2.5 SPIRITUAL SUBSCRIPTIONS MANAGEMENT VIEW */}
        {currentView === 'subscriptions' && (
          <div className="max-w-4xl mx-auto py-8 space-y-10 animate-fadeIn">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-950/20 text-[#C8A24A] text-xs font-mono font-bold uppercase tracking-wider">
                <span>🪐</span> Tinh Bàn Linh Cát - Khai Nguyên Mệnh Số
              </div>
              <h2 className="text-3xl font-serif font-extrabold text-[#e0e0e0] tracking-tight">
                Quản Lý Gói Dịch Vụ Tâm Linh
              </h2>
              <p className="text-sm text-slate-400 max-w-lg mx-auto">
                Thời vận tuần hoàn theo quỹ đạo. Đây là mật thất giám hộ, hiển thị đèn nến, thời hạn hộ vệ sinh thông suốt của thí chủ qua các phiên sấm truyền đắc lộc.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* TARGET 1: TAROT SUBSCRIBES */}
              <div className="rounded-2xl border border-slate-800/80 bg-[#090d16]/80 p-6 relative flex flex-col justify-between overflow-hidden shadow-[0_0_50px_rgba(200,162,74,0.02)] border-[#C8A24A]/20">
                {/* Spiritual aesthetic background seal */}
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full border-4 border-dashed border-[#C8A24A]/5 flex items-center justify-center animate-spin pointer-events-none" style={{ animationDuration: '30s' }}>
                  <div className="w-24 h-24 rounded-full border-2 border-dotted border-[#C8A24A]/5" />
                </div>

                <div className="z-10 space-y-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono tracking-widest text-[#C8A24A] uppercase font-bold">GÓI CHIÊU AN HƯỚNG DẪN</span>
                      <h3 className="text-xl font-serif font-black flex items-center gap-1.5">
                        🔮 Tarot AI Oracle
                      </h3>
                    </div>
                    <span className="text-xs bg-[#C8A24A]/10 text-[#C8A24A] border border-[#C8A24A]/30 font-bold px-2 py-0.5 rounded-lg">
                      6 Tiếng
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    Khai mở sấm truyền 78 lá cổ, bốc bài luận giải cát hung niên vận, kết nối trường năng lượng của 3 tiên tri túc mệnh tối cao.
                  </p>

                  <div className="py-4 border-y border-white/5 space-y-4">
                    {/* CASE 1: ACTIVE */}
                    {tarotSubStatus?.unlocked && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-1.5 text-xs text-green-400 font-bold">
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          <span>MẬT THẤT ĐANG MỞ (ĐANG HOẠT ĐỘNG)</span>
                        </div>
                        
                        <div className="bg-[#03060a]/90 border border-green-500/20 rounded-xl p-4 text-center space-y-1">
                          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono block">Thần Khí Sấm Truyền Còn Lại</span>
                          <span className="text-lg font-mono font-bold text-green-400">{formatCountdown(tarotSubStatus.timeLeftMs)}</span>
                        </div>
                        
                        <div className="text-[11px] text-slate-400 flex justify-between font-mono">
                          <span>Mã vận mệnh:</span>
                          <span className="text-amber-400">{tarotSubStatus.payment?.orderCode}</span>
                        </div>
                      </div>
                    )}

                    {/* CASE 2: CAN RENEW (GLOWS POETICALLY) */}
                    {tarotSubStatus?.canRenew && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-1.5 text-xs text-yellow-500 font-bold">
                          <span className="w-2 h-2 rounded-full bg-yellow-500 animate-ping" />
                          <span>LỆNH GIA HẠN ĐẶC CÁCH ĐANG MỞ</span>
                        </div>

                        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 text-center space-y-1">
                          <span className="text-[10px] text-amber-500 uppercase tracking-widest font-mono block">Thời gian gia hạn giảm giá còn lại</span>
                          <span className="text-lg font-mono font-bold text-yellow-500">{formatCountdown(tarotSubStatus.renewTimeLeftMs)}</span>
                        </div>

                        <div className="text-xs text-slate-300 font-sans leading-relaxed bg-yellow-950/10 p-3 rounded-lg border border-yellow-700/20 text-center">
                          🔮 Sấm truyền Tarot vừa mãn hạn. Đặc xá giảm giá <span className="text-amber-400 font-bold">150.000đ</span> khi gia hạn khẩn trương trong thời gian vàng!
                          <div className="text-[11px] text-slate-400 mt-1">
                            Giá gốc: <del className="text-slate-500">400.000đ</del> → <span className="font-bold text-green-400 text-sm">250.000đ</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* CASE 3: EXPIRED OR NOT BOUGHT */}
                    {(!tarotSubStatus || (!tarotSubStatus.unlocked && !tarotSubStatus.canRenew)) && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                          <span className="w-2 h-2 rounded-full bg-slate-600" />
                          <span>CHƯA KÍCH HOẠT / ĐÃ TÀN NẾN</span>
                        </div>

                        <div className="bg-slate-950 p-4 rounded-xl text-center text-xs text-slate-500">
                          🪐 Định tinh Tarot cung mệnh đang chờ dâng hương khai sắc.
                        </div>

                        <div className="text-right text-xs">
                          Phí khai đàn: <span className="font-mono text-amber-400 font-bold text-sm">400.000đ</span> / 6 tiếng
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 z-10 w-full mt-auto">
                  {tarotSubStatus?.unlocked ? (
                    <button 
                      onClick={() => {
                        setAiPersonaTab('tarot');
                        setReadingOutput('');
                        setCurrentView('oracles');
                      }}
                      className="w-full py-3.5 rounded-xl bg-green-950/30 border border-green-500/40 hover:bg-green-500 hover:text-[#03060a] transition-all font-serif text-xs font-bold uppercase tracking-wider text-green-400 cursor-pointer"
                    >
                      Tiến Vào Phiên Tarot 🕯️
                    </button>
                  ) : tarotSubStatus?.canRenew ? (
                    <button 
                      onClick={() => triggerServiceRenewal('tarot')}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:scale-[1.02] text-slate-950 transition-all font-serif text-xs font-bold uppercase tracking-wider cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                    >
                      Gia Hạn Đặc Cách - Nhận Ưu Đãi Giảm 150K ⚜️
                    </button>
                  ) : (
                    <button 
                      onClick={() => triggerServicePurchase('tarot')}
                      className="w-full py-3.5 rounded-xl bg-[#C8A24A]/20 hover:bg-[#C8A24A]/30 border border-[#C8A24A]/40 text-[#C8A24A] hover:text-white transition-all font-serif text-xs font-bold uppercase tracking-wider cursor-pointer"
                    >
                      Dâng Hương Kích Hoạt 🔮
                    </button>
                  )}
                </div>
              </div>


              {/* TARGET 2: HOROSCOPE SUBSCRIBES */}
              <div className="rounded-2xl border border-slate-800/80 bg-[#090d16]/80 p-6 relative flex flex-col justify-between overflow-hidden shadow-[0_0_50px_rgba(139,92,246,0.02)] border-violet-500/20">
                {/* Spiritual aesthetic background seal */}
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full border-4 border-dashed border-violet-500/5 flex items-center justify-center animate-spin pointer-events-none" style={{ animationDuration: '40s' }}>
                  <div className="w-24 h-24 rounded-full border-2 border-dotted border-violet-500/5" />
                </div>

                <div className="z-10 space-y-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono tracking-widest text-violet-400 uppercase font-bold">GÓI CHIÊM TINH HỘ MỆNH</span>
                      <h3 className="text-xl font-serif font-black flex items-center gap-1.5">
                        🌌 Tử Vi Chiêm Tinh Matrix
                      </h3>
                    </div>
                    <span className="text-xs bg-violet-500/10 text-violet-300 border border-violet-500/30 font-bold px-2 py-0.5 rounded-lg">
                      12 Tiếng
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    Lập thiên bàn Tử Vi trọn đời, an sao nhập hạn luận ngũ hành bát tự chính tông, dự đoán thăng trầm của các tinh cầu bản mệnh tinh vi.
                  </p>

                  <div className="py-4 border-y border-white/5 space-y-4">
                    {/* CASE 1: ACTIVE */}
                    {astroSubStatus?.unlocked && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-1.5 text-xs text-green-400 font-bold">
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          <span>MẬT THẤT ĐANG MỞ (ĐANG HOẠT ĐỘNG)</span>
                        </div>
                        
                        <div className="bg-[#03060a]/90 border border-green-500/20 rounded-xl p-4 text-center space-y-1">
                          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono block">Thần Khí Sấm Truyền Còn Lại</span>
                          <span className="text-lg font-mono font-bold text-green-400">{formatCountdown(astroSubStatus.timeLeftMs)}</span>
                        </div>
                        
                        <div className="text-[11px] text-slate-400 flex justify-between font-mono">
                          <span>Mã vận mệnh:</span>
                          <span className="text-violet-400">{astroSubStatus.payment?.orderCode}</span>
                        </div>
                      </div>
                    )}

                    {/* CASE 2: CAN RENEW (GLOWS POETICALLY) */}
                    {astroSubStatus?.canRenew && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-1.5 text-xs text-yellow-500 font-bold">
                          <span className="w-2 h-2 rounded-full bg-yellow-500 animate-ping" />
                          <span>LỆNH GIA HẠN ĐẶC CÁCH ĐANG MỞ</span>
                        </div>

                        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 text-center space-y-1">
                          <span className="text-[10px] text-amber-500 uppercase tracking-widest font-mono block">Thời gian gia hạn giảm giá còn lại</span>
                          <span className="text-lg font-mono font-bold text-yellow-500">{formatCountdown(astroSubStatus.renewTimeLeftMs)}</span>
                        </div>

                        <div className="text-xs text-slate-300 font-sans leading-relaxed bg-yellow-950/10 p-3 rounded-lg border border-yellow-700/20 text-center">
                          🌌 Bản đồ sao Horoscope vừa mãn tuần hoàn. Đặc xá giảm giá <span className="text-amber-400 font-bold">150.000đ</span> khi gia hạn khẩn trương trong thời gian vàng!
                          <div className="text-[11px] text-slate-400 mt-1">
                            Giá gốc: <del className="text-slate-500">650.000đ</del> → <span className="font-bold text-green-400 text-sm">500.000đ</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* CASE 3: EXPIRED OR NOT BOUGHT */}
                    {(!astroSubStatus || (!astroSubStatus.unlocked && !astroSubStatus.canRenew)) && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                          <span className="w-2 h-2 rounded-full bg-slate-600" />
                          <span>CHƯA KÍCH HOẠT / ĐÃ TÀN NẾN</span>
                        </div>

                        <div className="bg-slate-950 p-4 rounded-xl text-center text-xs text-slate-500">
                          🪐 Định tinh Tử Vi dải ngân hà đang chờ làm lễ an sao ban lộc.
                        </div>

                        <div className="text-right text-xs">
                          Phí làm lễ: <span className="font-mono text-violet-400 font-bold text-sm">650.000đ</span> / 12 tiếng
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 z-10 w-full mt-auto">
                  {astroSubStatus?.unlocked ? (
                    <button 
                      onClick={() => {
                        setAiPersonaTab('astrology');
                        setReadingOutput('');
                        setCurrentView('oracles');
                      }}
                      className="w-full py-3.5 rounded-xl bg-violet-950/30 border border-violet-500/40 hover:bg-violet-500 hover:text-[#03060a] transition-all font-serif text-xs font-bold uppercase tracking-wider text-violet-300 cursor-pointer"
                    >
                      Tiến Vào Phiên Tử Vi 🕯️
                    </button>
                  ) : astroSubStatus?.canRenew ? (
                    <button 
                      onClick={() => triggerServiceRenewal('horoscope')}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:scale-[1.02] text-slate-950 transition-all font-serif text-xs font-bold uppercase tracking-wider cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                    >
                      Gia Hạn Đặc Cách - Nhận Ưu Đãi Giảm 150K ⚜️
                    </button>
                  ) : (
                    <button 
                      onClick={() => triggerServicePurchase('horoscope')}
                      className="w-full py-3.5 rounded-xl bg-violet-950/20 hover:bg-violet-950/30 border border-violet-500/40 text-violet-300 hover:text-white transition-all font-serif text-xs font-bold uppercase tracking-wider cursor-pointer"
                    >
                      Dâng Hương Kích Hoạt 🌌
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* TARGET 3: SUPER AI GENERAL PACKS STATS */}
            <div className="rounded-2xl border border-slate-800/80 bg-[#090d16]/80 p-6 relative overflow-hidden shadow-[0_0_50px_rgba(200,162,74,0.02)] border-amber-500/20">
              <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold uppercase tracking-wider font-mono">
                    <span>✨</span> TÌNH TRẠNG KẾT NỐI SIÊU AI (HB AI & TIÊN TRI ĐẠI SẢNH)
                  </div>
                  <h3 className="text-xl font-serif font-bold text-slate-100 flex items-center gap-1.5">
                    💫 Quyền Năng Sấm Truyền Vô Hạn
                  </h3>
                  <p className="text-xs text-slate-400 max-w-xl">
                    Sở hữu một trong các gói Chiêm Tinh Nhật Linh/Thất Tinh/Nguyệt Tướng để đàm thoại không giới hạn số lượt với toàn bộ 3 Đại Tiên Tri trong đại sảnh.
                  </p>
                </div>

                <div className="flex flex-wrap gap-4 items-center bg-[#03060a] border border-slate-800 p-4 rounded-xl shrink-0 w-full md:w-auto">
                  {/* Trial slot display */}
                  <div className="text-center px-4 border-r border-slate-800">
                    <span className="block text-[10px] text-slate-500 uppercase tracking-widest font-mono">Quỹ dùng thử free</span>
                    <span className="text-base font-bold text-slate-200 mt-1 block">
                      {freeTurnsLeft > 0 ? `Còn ${freeTurnsLeft}/3 lượt` : 'Đã hết lượt miễn phí'}
                    </span>
                  </div>

                  {/* Sub pack status display */}
                  <div className="text-center px-4">
                    <span className="block text-[10px] text-slate-500 uppercase tracking-widest font-mono">Thời gian gói vô hạn</span>
                    {aiSubStatus?.unlocked ? (
                      <span className="text-base font-mono font-bold text-[#C8A24A] animate-pulse block mt-1">
                        Active: {formatCountdown(aiSubStatus.timeLeftMs)}
                      </span>
                    ) : (
                      <span className="text-sm font-semibold text-slate-500 mt-1 block font-sans">
                        Chưa đăng ký gói vô hạn
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Mini packages purchase links for high accessibility */}
              {!aiSubStatus?.unlocked && (
                <div className="mt-6 pt-6 border-t border-slate-800/80">
                  <span className="text-[10px] text-[#C8A24A] uppercase font-mono tracking-widest font-bold block mb-4 text-center">ĐĂNG KÝ GÓI ĐỂ MỞ KHÓA TRUY CẬP VÔ HẠN</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <button 
                      onClick={() => triggerServicePurchase('ai_daily')}
                      className="px-4 py-3 rounded-xl border border-slate-700 bg-slate-900/50 hover:bg-[#C8A24A] hover:text-black transition-all cursor-pointer text-xs font-bold text-center uppercase tracking-wider text-slate-250"
                    >
                      Nhật Linh (1 Ngày) - 50k
                    </button>
                    <button 
                      onClick={() => triggerServicePurchase('ai_weekly')}
                      className="px-4 py-3 rounded-xl border border-amber-500/20 bg-amber-500/5 hover:bg-[#C8A24A] hover:text-black transition-all cursor-pointer text-xs font-bold text-center uppercase tracking-wider text-amber-200"
                    >
                      Thất Tinh (7 Ngày) - 170k 🔥
                    </button>
                    <button 
                      onClick={() => triggerServicePurchase('ai_monthly')}
                      className="px-4 py-3 rounded-xl border border-slate-700 bg-slate-900/50 hover:bg-[#C8A24A] hover:text-black transition-all cursor-pointer text-xs font-bold text-center uppercase tracking-wider text-slate-250"
                    >
                      Nguyệt Tướng (30 Ngày) - 269k
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Spiritual advisory block */}
            <p className="text-center text-[11px] text-slate-500 italic max-w-xl mx-auto leading-normal">
              🌙 “Càn khôn xoay chuyển, túc mạng tuần hoàn. Khi dâng đúng lễ và đi theo hướng cát của các tinh đẩu, cánh cửa tịnh thất tâm linh tự khắc trường tồn hộ trì thí chủ đắc may tránh họa.”
            </p>
          </div>
        )}

        {/* 3. UNLOCK RITUAL TRANSITION SCREEN */}
        {currentView === 'ritual' && (
          <div className="max-w-2xl mx-auto py-16 text-center space-y-12 animate-fadeIn">
            <div className="relative w-40 h-40 mx-auto">
              {/* Spinning cosmic celestial frame with pulse glows */}
              <div className="absolute inset-0 rounded-full border border-[#C8A24A]/30 animate-spin" style={{ animationDuration: '10s' }} />
              <div className="absolute inset-2 rounded-full border border-violet-500/30 animate-spin" style={{ animationDuration: '6s', animationDirection: 'reverse' }} />
              <div className="absolute inset-4 rounded-full border-2 border-dashed border-[#C8A24A]/25 animate-spin" style={{ animationDuration: '15s' }} />
              <div className="absolute inset-8 rounded-full bg-gradient-to-tr from-amber-600/10 via-slate-950 to-indigo-900/10 flex items-center justify-center filter blur-xs" />
              
              {/* Spiritual Candle glow centered */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-10 rounded-full bg-orange-500 blur-md animate-pulse" />
                <div className="absolute w-2 h-6 rounded-full bg-yellow-300 blur-xs animate-ping" />
              </div>
            </div>

            <div className="space-y-4">
              <span className="text-xs font-mono tracking-widest text-[#C8A24A] uppercase block">Connecting to cosmic intelligence...</span>
              <h2 className="text-3xl font-serif font-extrabold tracking-tight">Kính Lễ Hội Đồng Tiên Tri</h2>
              <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                Đèn nến dâng đầy, ngọn lửa tịnh hóa đã thắp sáng. Hệ thống đang đồng bộ hóa đường tinh tú, bầy quẻ Tarot bản mệnh và chu vận bản đồ sao Capicorn...
              </p>
            </div>

            <div className="max-w-xs mx-auto">
              <button 
                onClick={completeRitualToOracles}
                className="w-full py-4 rounded-2xl bg-amber-400 hover:bg-[#C8A24A] text-slate-950 font-serif font-bold text-sm transition-all shadow-3xl hover:scale-105"
              >
                Tiến Bước Vào Phiên Giải Quẻ 🕯️
              </button>
            </div>
          </div>
        )}

        {/* 4. MULTI-AI READING INTERFACE */}
        {currentView === 'oracles' && (
          <div className="grid lg:grid-cols-12 gap-8 items-start py-4">
            
            {/* SIDEBAR ORACLE COPTICS (Column 3) */}
            <div className="lg:col-span-3 space-y-4">
              <div className="rounded-2xl border border-slate-900 bg-[#060911]/90 p-4 space-y-5">
                <div className="p-2 border-b border-slate-900 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[#C8A24A]" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">Đại Điện Tiên Tri</span>
                </div>

                <div className="space-y-2 font-sans text-xs">
                  {/* TAB 1: TAROT */}
                  <button 
                    onClick={() => {
                      setAiPersonaTab('tarot');
                      setReadingOutput('');
                    }}
                    className={`w-full p-3.5 rounded-xl font-medium border text-left flex items-center justify-between transition-colors ${aiPersonaTab === 'tarot' ? 'border-[#C8A24A]/40 bg-[#C8A24A]/5 text-[#C8A24A]' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span>🔮</span>
                      <div>
                        <h6>Tarot AI Oracle</h6>
                        <p className="text-[9px] text-slate-500">Mô hình giải quẻ sâu</p>
                      </div>
                    </div>
                    {unlockedTarot || currentUser?.role === 'admin' ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-950/40 text-green-400">UNVALUED</span>
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-slate-600" />
                    )}
                  </button>

                  {/* TAB 2: ASTROLOGY */}
                  <button 
                    onClick={() => {
                      setAiPersonaTab('astrology');
                      setReadingOutput('');
                    }}
                    className={`w-full p-3.5 rounded-xl font-medium border text-left flex items-center justify-between transition-colors ${aiPersonaTab === 'astrology' ? 'border-violet-500/40 bg-violet-950/10 text-violet-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span>🌌</span>
                      <div>
                        <h6>Astrology & Tử Vi</h6>
                        <p className="text-[9px] text-slate-500">Toàn vẹn bản đồ sao</p>
                      </div>
                    </div>
                    {unlockedAstro || currentUser?.role === 'admin' ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-950/40 text-green-400">UNVALUED</span>
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-slate-600" />
                    )}
                  </button>

                  {/* TAB 3: COACH COUNCIL */}
                  <button 
                    onClick={() => {
                      setAiPersonaTab('coach');
                      setReadingOutput('');
                    }}
                    className={`w-full p-3.5 rounded-xl font-medium border text-left flex items-center justify-between transition-colors ${aiPersonaTab === 'coach' ? 'border-indigo-500/40 bg-indigo-950/10 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span>🧿</span>
                      <div>
                        <h6>Oracle Council AI</h6>
                        <p className="text-[9px] text-slate-500">Hội đồng tiên tri dẫn lối</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-950/40 text-blue-400">FREE DIRECT</span>
                  </button>
                </div>
              </div>

              {/* SAVED PORTALS */}
              <button 
                onClick={() => setCurrentView('landing')} 
                className="w-full py-3.5 rounded-xl border border-slate-900 bg-slate-950/40 hover:bg-slate-950 text-xs font-semibold hover:text-[#C8A24A] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-slate-400" /> Khởi Tạo Lại Câu Hỏi
              </button>
            </div>

            {/* CENTRAL WORKSPACE CONSOLE (Column 9) */}
            <div className="lg:col-span-9 space-y-6">
              
              {/* ORACLE CHAT CARD INPUT */}
              <div className="rounded-2xl border border-slate-800 bg-[#090d16]/90 p-6 shadow-3xl space-y-6">
                
                {/* DYNAMIC INPUT VIEW BASED ON ACTIVE TAB */}
                {aiPersonaTab === 'tarot' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-serif font-bold text-amber-200">Trải Nghiệm Bốc Bài Thác Chiêm</h3>
                        <p className="text-xs text-slate-400">Vui lòng rũ bỏ muộn phiền, tập trung tâm thức vào quẻ cần hỏi và bốc ngẫu nhiên 3 lá bài bên dưới:</p>
                      </div>
                      <button 
                        onClick={resetTarotSelection}
                        className="text-xs font-semibold text-amber-400 hover:underline cursor-pointer"
                      >
                        Làm Mới Trận Pháp 🛡️
                      </button>
                    </div>

                    {/* TAROT INTERACTIVE PILES DISPLAY */}
                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-2.5 pt-2">
                      {TAROT_DECK.map((card, i) => {
                        const isSelected = tarotSelectedCards.includes(i);
                        return (
                          <div 
                            key={i}
                            onClick={() => selectTarotCard(i)}
                            className={`aspect-[3/4.8] rounded-lg border-2 flex flex-col items-center justify-center transition-all cursor-pointer select-none leading-none text-center ${isSelected ? 'border-[#C8A24A] shadow-[0_0_12px_rgba(200,162,74,0.4)] scale-98 bg-[#C8A24A]/10' : 'border-slate-800 bg-[#03060a] hover:border-[#C8A24A]/40'}`}
                          >
                            {isSelected ? (
                              <div className="flex flex-col items-center gap-1.5 animate-fadeIn">
                                <span className="text-xl">{card.img}</span>
                                <span className="text-[7px] font-bold text-amber-400 text-center uppercase tracking-tight font-serif truncate max-w-full px-1">{card.name.split(' ')[0]}</span>
                              </div>
                            ) : (
                              <span className="text-lg text-[#C8A24A]/60 font-serif">✨</span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="text-xs text-slate-400 font-mono flex gap-1 items-center bg-slate-950 p-3 rounded-lg border border-slate-900">
                      <span>Lá bài đã bốc ({tarotSelectedCards.length}/3):</span>
                      <span className="font-bold text-[#C8A24A]">
                        {tarotSelectedCards.length > 0 
                          ? tarotSelectedCards.map(idx => TAROT_DECK[idx].name).join(' ➔ ') 
                          : 'Chưa bốc bài... Hãy gõ quẻ bốc bất kỳ.'}
                      </span>
                    </div>
                  </div>
                )}

                {aiPersonaTab === 'astrology' && (
                  <div className="space-y-4 animate-fadeIn">
                    <h3 className="text-lg font-serif font-bold text-violet-400">Khởi Lập Hệ Sao Hoàng Đạo</h3>
                    <p className="text-xs text-slate-400">Nhập chính xác ngày giờ sinh của bản thân để hệ thống liên văn phòng tinh chỉnh thông số Tử Vi:</p>

                    <form className="grid sm:grid-cols-3 gap-4 font-sans text-xs">
                      <div>
                        <label className="block text-[11px] text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Ngày sinh của bản chủ</label>
                        <input 
                          type="date"
                          value={birthDetails.date}
                          onChange={(e) => setBirthDetails({ ...birthDetails, date: e.target.value })}
                          className="w-full bg-[#03060a] border border-slate-800 rounded-xl px-4 py-3 text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Giờ sinh chi hằng</label>
                        <input 
                          type="time"
                          value={birthDetails.time}
                          onChange={(e) => setBirthDetails({ ...birthDetails, time: e.target.value })}
                          className="w-full bg-[#03060a] border border-slate-800 rounded-xl px-4 py-3 text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Nơi sinh (Tỉnh/Thành)</label>
                        <input 
                          type="text"
                          value={birthDetails.location}
                          onChange={(e) => setBirthDetails({ ...birthDetails, location: e.target.value })}
                          placeholder="Hồ Chí Minh"
                          className="w-full bg-[#03060a] border border-slate-800 rounded-xl px-4 py-3 text-slate-200"
                        />
                      </div>
                    </form>
                  </div>
                )}

                {aiPersonaTab === 'coach' && (
                  <div className="space-y-2 animate-fadeIn">
                    <h3 className="text-lg font-serif font-bold text-indigo-400">Trợ Lý Điều Phối Tâm Hồn</h3>
                    <p className="text-xs text-slate-400">Bạn đang băn khoăn về vấn đề gì trong công việc, tình duyên, hay định hướng bản thân? Life Coach AI sẽ đồng hành giải bày thấu thi gan guột.</p>
                  </div>
                )}

                {/* PROMPT ACTION TEXT CONSOLE */}
                <div className="space-y-3 font-sans">
                  <label className="block text-[11px] text-slate-400 uppercase tracking-wider font-mono">Câu hỏi tịnh hóa hoặc Trải lòng</label>
                  <div className="relative">
                    <textarea 
                      rows={3}
                      value={oracleQuery}
                      onChange={(e) => setOracleQuery(e.target.value)}
                      placeholder="Hãy viết ra nỗi lòng để kết nối sâu sắc hơn với vũ trụ huyền diệu... (Ví dụ: Dự báo công danh thời gian tới thế nào?)"
                      className="w-full bg-[#03060a] border border-slate-800 focus:border-[#C8A24A]/60 rounded-xl p-4 text-xs text-slate-200 focus:outline-none placeholder:text-slate-600 leading-relaxed"
                    />
                    <button 
                      onClick={triggerVoiceSpeechInput}
                      className={`absolute right-3.5 bottom-3.5 p-2 rounded-xl border border-slate-900 transition-colors bg-[#03060a] cursor-pointer ${isRecording ? 'text-red-400 bg-red-950/20' : 'text-slate-400 hover:text-[#C8A24A]'}`}
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button 
                      onClick={handleGenerateAIReading}
                      disabled={readingLoading}
                      className="px-7 py-3.5 font-serif rounded-xl text-xs font-bold uppercase tracking-wider text-slate-950 bg-amber-400 hover:bg-[#C8A24A] disabled:opacity-40 transition-all flex items-center gap-2 cursor-pointer shadow-xl"
                    >
                      {readingLoading ? 'Đang Giải Ngữ Chòm Sao...' : 'Mở Quẻ Toàn Diện'}
                      <Sparkles className="w-4 h-4 text-slate-950" />
                    </button>
                  </div>
                </div>

              </div>

              {/* MULTI_AI ANSWER DISPLAY AND VOICEOVER NARRATION */}
              {readingOutput && (
                <div className="rounded-2xl border border-[#C8A24A]/20 bg-[#090d16] p-6 shadow-3xl space-y-6 animate-fadeIn">
                  
                  {/* ORACLE HEADER DETAILS */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-5">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">🔮</span>
                      <div>
                        <h4 className="font-serif font-bold text-amber-200">Bản Linh Thác Ký Độc Bản</h4>
                        <p className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">Thành công từ mô hình chiêm tinh Google Gemini 3.5</p>
                      </div>
                    </div>

                    {/* DYNAMIC TTS CONVERT WITH SPECTROGRAMS */}
                    <div className="flex items-center gap-2">
                      {audioUrl ? (
                        <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-900">
                          <button 
                            onClick={toggleAudioPlayback}
                            className="p-1.5 rounded-lg bg-yellow-500/10 text-[#C8A24A] hover:bg-yellow-500/20 transition-all cursor-pointer"
                          >
                            {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </button>
                          
                          {/* Simulated haptic audio visualizer spectrum block */}
                          <div className="flex items-center gap-0.5 h-4.5 w-16 px-1">
                            {Array.from({ length: 9 }).map((_, idx) => (
                              <div 
                                key={idx} 
                                className="w-1 bg-[#C8A24A] rounded-t-xs"
                                style={{
                                  height: isPlayingAudio ? `${20 + Math.random() * 80}%` : '15%',
                                  transition: 'height 0.15s ease-in-out'
                                }}
                              />
                            ))}
                          </div>
                          
                          <span className="text-[10px] font-mono tracking-widest text-[#C8A24A]">VOICE PLAYBACK</span>
                        </div>
                      ) : (
                        <button 
                          onClick={handleGenerateTTSAudio}
                          disabled={ttsLoading}
                          className="px-4 py-2.5 rounded-xl border border-[#C8A24A]/40 text-[#C8A24A] bg-[#C8A24A]/5 hover:bg-[#C8A24A]/10 disabled:opacity-40 text-xs font-semibold tracking-wide flex items-center gap-2 transition-all cursor-pointer shadow-md"
                        >
                          <Volume2 className="w-4 h-4 animate-bounce" /> 
                          {ttsLoading ? 'Đang khởi dựng giọng nói...' : 'Nghe Thuyết Minh Giọng Tiên Tri 🎙️'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* SUBSTANTIAL PORTRAIT TEXT OUTPUT */}
                  <div className="prose prose-invert prose-yellow text-slate-200 font-serif text-sm leading-relaxed max-w-none space-y-4">
                    {readingOutput.split('\n\n').map((para, idx) => {
                      if (!para.trim()) return null;
                      return (
                        <p key={idx} className="indent-4 text-justify font-serif">
                          {para.replace(/[*#]/g, '')}
                        </p>
                      );
                    })}
                  </div>

                  {/* ACTIONS TO CLEAR OR DOWNLOAD */}
                  <div className="flex justify-end gap-3 border-t border-slate-900 pt-5">
                    <button 
                      onClick={() => handleCopyText(readingOutput, 'Toàn bộ nội dung lá số')}
                      className="px-4 py-2.5 rounded-xl border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-300 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Copy className="w-4 h-4" /> Sao Chép Bản Số
                    </button>
                    <button 
                      onClick={() => {
                        showToast('Mở trình PDF tải quẻ bản mệnh... Thảo mật thành công!', 'success');
                      }}
                      className="px-4 py-2.5 rounded-xl bg-[#C8A24A] text-slate-950 font-semibold hover:bg-yellow-400 text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-lg"
                    >
                      Tải Tài Bản Ký PDF 📜
                    </button>
                  </div>

                </div>
              )}

            </div>

          </div>
        )}

        {/* 5. ADMIN CONSOLE CONTROL CENTER */}
        {currentView === 'admin' && (
          <div className="space-y-8 py-4 animate-fadeIn font-sans">
            <h1 className="text-3xl font-serif font-bold text-red-400 flex items-center gap-2">
              <Cpu className="w-8 h-8 text-red-500 animate-spin" /> Bàn Quản Trị Hệ Thống Thu Phí SaaS (Trực tiếp)
            </h1>

            {/* DASHBOARD CHARTS/ANALYTICS COUNTER SLABS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="p-5 rounded-2xl border border-slate-800 bg-[#090d16] flex items-center gap-4">
                <div className="p-3 rounded-xl bg-green-500/10 text-green-400">
                  <TrendingUp className="w-5.5 h-5.5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-mono block uppercase">Tổng doanh thu thực</span>
                  <span className="text-lg font-bold font-mono text-green-400">{(adminStats.totalRevenue || 0).toLocaleString('vi-VN')} VND</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-slate-800 bg-[#090d16] flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
                  <Users className="w-5.5 h-5.5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-mono block uppercase">Người dùng đăng ký</span>
                  <span className="text-lg font-bold font-mono text-blue-400">{adminStats.usersCount || 0} thành phần</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-slate-800 bg-[#090d16] flex items-center gap-4">
                <div className="p-3 rounded-xl bg-[#C8A24A]/10 text-[#C8A24A]">
                  <Compass className="w-5.5 h-5.5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-mono block uppercase">Quẻ bốc Tarot thành công</span>
                  <span className="text-lg font-bold font-mono text-[#C8A24A]">{adminStats.tarotSales || 0} lượt</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-slate-800 bg-[#090d16] flex items-center gap-4">
                <div className="p-3 rounded-xl bg-violet-500/10 text-violet-400">
                  <Moon className="w-5.5 h-5.5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-mono block uppercase">Hóa đơn Tử Vi đã mua</span>
                  <span className="text-lg font-bold font-mono text-violet-400">{adminStats.horoscopeSales || 0} lượt</span>
                </div>
              </div>

            </div>

            {/* MAIN PORTAL ROW: BANK APPROVAL BOARD */}
            <div className="grid lg:grid-cols-12 gap-8">
              
              {/* TRANSFERS BOARD LIST (Column 7) */}
              <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-[#090d16] p-6 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider border-b border-slate-900 pb-3 flex items-center gap-1.5 text-[#C8A24A]">
                  🏦 Danh Sách Giao Dịch Chuyển Khoản Ngân Hàng TCB Chờ Phê Chuẩn
                </h3>
                
                {adminTransfers.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">Không có yêu cầu chuyển khoản ngân hàng chờ duyệt.</p>
                ) : (
                  <div className="divide-y divide-slate-900 text-xs">
                    {adminTransfers.map((t, idx) => (
                      <div key={idx} className="py-4 flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-200">{t.orderCode}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded ${t.status === 'success' ? 'bg-green-950/40 text-green-400' : 'bg-yellow-950/40 text-yellow-500'}`}>{t.status.toUpperCase()}</span>
                          </div>
                          <p className="text-[10px] text-slate-400">UserId: <span className="font-mono">{t.userId}</span></p>
                          <p className="text-[10px] text-slate-400">Khởi tạo: {new Date(t.createdAt).toLocaleTimeString()} - {new Date(t.createdAt).toLocaleDateString()}</p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-[#C8A24A] text-sm">{(t.amount).toLocaleString('vi-VN')} VND</span>
                          {t.status === 'pending' && (
                            <div className="flex items-center gap-1.5">
                              <button 
                                onClick={() => handleApproveBankTransfer(t.orderCode, 'success')}
                                className="p-1 px-2 text-xs rounded bg-green-600 hover:bg-green-500 text-slate-950 font-bold transition-all cursor-pointer"
                                title="Đồng ý giải ngân khóa"
                              >
                                ✔
                              </button>
                              <button 
                                onClick={() => handleApproveBankTransfer(t.orderCode, 'failed')}
                                className="p-1 px-2 text-xs rounded bg-red-600 hover:bg-[#C8A24A] text-slate-100 font-bold transition-all cursor-pointer"
                                title="Từ chối hóa đơn sai lệch"
                              >
                                ✘
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* USER MANAGER BOARD (Column 5) */}
              <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-[#090d16] p-6 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider border-b border-slate-900 pb-3 text-red-400">
                  👤 Quản Lý Quyền Hạn Danh Sách Tài Khoản
                </h3>

                <div className="divide-y divide-slate-900 text-xs text-slate-300">
                  {adminUsers.map((u, i) => (
                    <div key={i} className="py-3 flex items-center justify-between">
                      <div className="space-y-0.5 max-w-[170px] truncate">
                        <p className="font-bold font-sans text-slate-200 truncate">{u.email}</p>
                        <p className="text-[9px] text-[#C8A24A] uppercase tracking-wider font-mono">Quyền: {u.role}</p>
                      </div>
                      <button 
                        onClick={() => handleChangeUserRole(u.id, u.role)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${u.role === 'admin' ? 'bg-red-950/30 border border-red-500/30 text-red-300' : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'}`}
                      >
                        {u.role === 'admin' ? 'Hạ Quyền User' : 'Nâng Thượng Admin ✨'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* REAL_TIME SYSTEM TELEMETRYS/AI SESSION LOGS */}
            <div className="rounded-2xl border border-slate-800 bg-[#090d16] p-6 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider border-b border-slate-900 pb-3 text-slate-300 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-indigo-400" /> Bản ghi Lịch sử Vấn đạo AI Thuyết Thác (Capicorn Audit Logs)
              </h3>
              
              {adminStats.logs?.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">Chưa ghi nhận hoạt động túc mạng tiên tri.</p>
              ) : (
                <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 divide-y divide-slate-900 text-[11px] font-mono leading-relaxed">
                  {adminStats.logs?.map((l: any, i: number) => (
                    <div key={i} className="pt-2 text-slate-400">
                      <span className="text-[#C8A24A]">[{new Date(l.createdAt).toLocaleTimeString()}]</span> User: <span className="text-blue-400">{l.userId}</span> | Loại: <span className="text-indigo-400 font-bold uppercase">{l.type}</span> | Thắc mắc: <span className="text-slate-300">"{l.input}"</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </main>

      {/* LUXE COSMIC SAAS FOOTER */}
      <footer className="bg-[#030509]/90 border-t border-slate-900 py-10 px-6 mt-16 font-sans text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-slate-500">
          <div className="space-y-2">
            <h4 className="font-serif font-bold text-slate-400 text-sm">🌙 Mystic © 2026</h4>
            <p className="max-w-xs text-[11px] leading-relaxed">Bộ công cụ tâm linh tối ưu - Kén chọn giải quẻ Tarot và chuyển quỷ Tử Vi oai hùng của Đại tiên tri tối cao HB.</p>
          </div>
          
          <div className="flex gap-8 text-slate-400">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-[#C8A24A] font-mono tracking-widest uppercase">Trung tâm hỗ trợ</span>
              <a href="#" className="hover:text-slate-200">Điều khoản sử dụng</a>
              <a href="#" className="hover:text-slate-200">Chính sách giao nhận</a>
              <a href="#" className="hover:text-slate-200">Phản hoàn tiền quẻ</a>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-[#C8A24A] font-mono tracking-widest uppercase">Cổng thanh toán</span>
              <span className="text-[10px] text-slate-500">Mã hóa MoMo Direct IPN</span>
              <span className="text-[10px] text-slate-500">VietQR Napas 24/7 Autopay</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ========================================================= */}
      {/* 🔮 SUPER GENERAL HB AI FLOATING CHAT WIDGET */}
      {/* ========================================================= */}
      <div id="hb-floating-ai-widget" className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {/* Toggleable Chat Tray Box */}
        {isHbChatOpen && (
          <div className="w-[360px] max-w-[calc(100vw-32px)] h-[500px] rounded-3xl border border-[#C8A24A]/30 bg-[#090d16]/95 backdrop-blur-2xl shadow-[0_10px_50px_rgba(200,162,74,0.1)] flex flex-col overflow-hidden mb-4 animate-fadeIn">
            {/* Header section with brand and creators */}
            <div className="bg-[#03060a]/90 px-5 py-4 border-b border-white/10 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-[1px] flex items-center justify-center shadow-lg relative shrink-0">
                  <div className="w-full h-full bg-[#050912] rounded-[11px] flex items-center justify-center font-bold text-yellow-400 text-sm">
                    HB
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#050912]"></div>
                </div>
                <div className="text-left">
                  <h4 className="text-xs font-serif font-extrabold text-[#e0e0e0] flex items-center gap-1">
                    HB AI Superbot <span className="text-[9px] font-sans font-normal text-amber-400 px-1 py-0.2 rounded border border-amber-500/20 bg-amber-500/5">Admin-IQ</span>
                  </h4>
                  <p className="text-[10px] text-slate-400">Huấn luyện bởi Lê Huy Bảo</p>
                </div>
              </div>
              <button 
                onClick={() => setIsHbChatOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Warning banner about no spiritual calculations */}
            <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-[10.5px] text-amber-300 leading-normal font-sans text-center shrink-0">
              ⚠️ Chỉ giải đáp dịch vụ & thông tin khoa học. KHÔNG bói toán/tarot tại đây.
            </div>

            {/* Chat Messages Log Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-white/5 pr-2">
              {hbMessages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                >
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed font-sans ${msg.role === 'user' ? 'bg-[#C8A24A] text-slate-950 font-medium rounded-tr-none' : 'bg-[#03060a] border border-slate-800 text-slate-200 rounded-tl-none text-left'}`}>
                    {msg.message}
                  </div>
                </div>
              ))}
              {hbLoading && (
                <div className="flex justify-start">
                  <div className="bg-[#03060a] border border-slate-800 rounded-2xl p-3 flex items-center gap-1 text-slate-400 text-xs rounded-tl-none font-sans">
                    <span className="w-1.5 h-1.5 bg-[#C8A24A] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-[#C8A24A] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-[#C8A24A] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    <span className="ml-1 text-[10px]">HB AI đang truyền tin...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input Field container */}
            <form onSubmit={handleSendHbMessage} className="p-3 border-t border-white/10 bg-[#03060a]/90 flex gap-2 shrink-0">
              <input 
                type="text"
                value={hbInput}
                onChange={(e) => setHbInput(e.target.value)}
                placeholder="HB AI ơi, trang web nạp lễ bốc quẻ thế nào?..."
                className="flex-1 bg-slate-950 border border-slate-800 focus:border-yellow-500/50 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-yellow-500/20 font-sans shadow-inner"
              />
              <button 
                type="submit"
                disabled={!hbInput.trim() || hbLoading}
                className="w-9 h-9 rounded-xl bg-[#C8A24A] hover:bg-white text-slate-950 hover:text-slate-950 transition-colors cursor-pointer flex items-center justify-center shrink-0 disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* Floating Bubble Button Launcher */}
        <button 
          onClick={() => setIsHbChatOpen(!isHbChatOpen)}
          className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:scale-105 transition-all flex items-center justify-center cursor-pointer relative group"
          title="HB AI Hỗ Trợ Tổng Thể"
        >
          {isHbChatOpen ? (
            <X className="w-6 h-6 text-slate-950" />
          ) : (
            <Cpu className="w-6 h-6 text-slate-950 group-hover:rotate-12 transition-transform" />
          )}
          {/* Active online state indicator */}
          <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-[#050507] rounded-full animate-pulse"></span>
        </button>
      </div>

    </div>
  );
}
