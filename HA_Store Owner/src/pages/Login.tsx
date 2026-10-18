import { useState, useRef, useCallback } from 'react';
import {
  Eye, EyeOff, Store, Headphones, ArrowRight, ArrowLeft, Clock,
  Check, CreditCard, Building2, Wallet, Sparkles, X, ImagePlus,
  ShieldCheck, Mic, Languages, Star,
} from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import { login, registerMerchant } from '@/services/authApi';

import bannerImg from '@/img/baner.png';

type Mode = 'login' | 'register';

const MERCHANT_IMAGE_SLOTS = 5;

const inputCls =
  'w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-[14px] text-neutral-900 outline-none placeholder:text-neutral-400 transition-colors focus:border-neutral-900 focus:ring-0';

const MERCHANT_CATEGORIES = [
  'Văn hoá & Di sản', 'Ẩm thực & Đồ uống', 'Thủ công mỹ nghệ',
  'Lưu niệm', 'Thời trang & May mặc', 'Cà phê & Trà', 'Khác',
];

const STEPS = [
  { label: 'Tài khoản', heading: 'Tạo tài khoản', sub: 'Bắt đầu với thông tin đăng nhập.' },
  { label: 'Gian hàng', heading: 'Thông tin gian hàng', sub: 'Cho du khách biết về bạn.' },
  { label: 'Gói dịch vụ', heading: 'Chọn gói dịch vụ', sub: 'Bắt đầu miễn phí, nâng cấp khi cần.' },
  { label: 'Thanh toán', heading: 'Thanh toán', sub: 'Hoàn tất đăng ký để chờ duyệt.' },
] as const;

type Plan = {
  id: 'free' | 'standard' | 'premium';
  name: string;
  monthly: number;
  features: string[];
  popular?: boolean;
};

const PLANS: Plan[] = [
  { id: 'free', name: 'Cơ bản', monthly: 0,
    features: ['1 điểm tham quan', '1 ngôn ngữ', 'Thống kê cơ bản'] },
  { id: 'standard', name: 'Tiêu chuẩn', monthly: 299000, popular: true,
    features: ['5 điểm tham quan', '3 ngôn ngữ', 'Thống kê chi tiết', 'Audio TTS'] },
  { id: 'premium', name: 'Cao cấp', monthly: 799000,
    features: ['Không giới hạn POI', '6 ngôn ngữ', 'Phân tích nâng cao', 'Ưu tiên hiển thị'] },
];

const formatVND = (n: number) => n.toLocaleString('vi-VN') + 'đ';

export default function Login() {
  const { signIn } = useApp();
  const [mode, setMode] = useState<Mode>('login');
  const [step, setStep] = useState(0);

  // Login
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPass, setShowPass] = useState(false);

  // Common
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Wizard forms
  const [account, setAccount] = useState({
    fullName: '', email: '', phoneNumber: '', password: '', confirmPassword: '',
  });
  const [merchant, setMerchant] = useState({
    merchantName: '', category: '', address: '', description: '', images: [] as string[],
  });
  const [planId, setPlanId] = useState<Plan['id']>('standard');
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');

  // Payment — FE only (chưa nối API)
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'transfer' | 'wallet'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);

  const merchantFileRef = useRef<HTMLInputElement>(null);

  // ==== Login ====
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const response = await login(username, password);
      if (response.user.accountType !== 'MERCHANT' || response.user.role !== 'MERCHANT') {
        throw new Error('Vui lòng sử dụng tài khoản chủ gian hàng.');
      }
      signIn(response.accessToken, response.user, remember);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==== Image helpers (đúng 5 slot) ====
  const readImages = useCallback((files: FileList) => {
    const current = merchant.images.length;
    const max = MERCHANT_IMAGE_SLOTS;

    if (current >= max) {
      setError(`Chỉ được tải lên tối đa ${max} ảnh.`);
      return;
    }

    const remaining = max - current;
    const list = Array.from(files).slice(0, remaining);

    if (files.length > remaining) {
      setError(`Chỉ nhận thêm ${remaining} ảnh (tối đa ${max}). Các ảnh thừa đã bị bỏ qua.`);
    } else {
      setError('');
    }

    for (const f of list) {
      if (f.size > 5 * 1024 * 1024) {
        setError(`"${f.name}" vượt quá 5MB.`);
        return;
      }
    }

    let loaded = 0;
    const results: string[] = [];
    list.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        results.push(reader.result as string);
        loaded++;
        if (loaded === list.length) {
          setMerchant(m => ({
            ...m,
            images: [...m.images, ...results].slice(0, MERCHANT_IMAGE_SLOTS),
          }));
        }
      };
      reader.readAsDataURL(file);
    });
  }, [merchant.images.length]);

  const removeImage = (idx: number) => {
    setMerchant(m => ({ ...m, images: m.images.filter((_, i) => i !== idx) }));
    setError('');
  };

  // ==== Step validation ====
  const validateStep = (s: number): boolean => {
    setError('');
    if (s === 0) {
      if (!account.fullName.trim()) { setError('Vui lòng nhập họ và tên.'); return false; }
      if (!account.email.trim() || !/^\S+@\S+\.\S+$/.test(account.email)) { setError('Email không hợp lệ.'); return false; }
      if (!account.password || account.password.length < 8) { setError('Mật khẩu phải có ít nhất 8 ký tự.'); return false; }
      if (!/[A-Za-z]/.test(account.password) || !/\d/.test(account.password)) { setError('Mật khẩu phải có cả chữ và số.'); return false; }
      if (account.phoneNumber.trim() && !/^[0-9+()\-\s]{8,20}$/.test(account.phoneNumber.trim())) { setError('Số điện thoại không hợp lệ.'); return false; }
      if (account.password !== account.confirmPassword) { setError('Mật khẩu xác nhận không khớp.'); return false; }
      return true;
    }
    if (s === 1) {
      if (!merchant.merchantName.trim()) { setError('Vui lòng nhập tên gian hàng.'); return false; }
      if (!merchant.category) { setError('Vui lòng chọn loại hình.'); return false; }
      if (!merchant.address.trim()) { setError('Vui lòng nhập địa chỉ.'); return false; }
      if (merchant.images.length < MERCHANT_IMAGE_SLOTS) {
        setError(`Vui lòng tải lên đủ ${MERCHANT_IMAGE_SLOTS} hình ảnh gian hàng (hiện có ${merchant.images.length}).`);
        return false;
      }
      return true;
    }
    return true;
  };

  const nextStep = () => {
    if (!validateStep(step)) return;
    setError('');
    setStep(s => Math.min(STEPS.length - 1, s + 1));
  };
  const prevStep = () => { setError(''); setStep(s => Math.max(0, s - 1)); };

  // ==== Submit ====
  const handleSubmitRegister = async () => {
    setError('');
    if (!agreeTerms) { setError('Vui lòng đồng ý với Điều khoản sử dụng.'); return; }

    const selectedPlan = PLANS.find(p => p.id === planId)!;
    const totalPrice = billing === 'yearly'
      ? Math.round(selectedPlan.monthly * 12 * 0.8)
      : selectedPlan.monthly;

    // Nếu có phí → validate nhanh form thẻ (chỉ FE, chưa gọi API thanh toán)
    if (totalPrice > 0 && paymentMethod === 'card') {
      if (!cardNumber.trim() || cardNumber.replace(/\s/g, '').length < 12) {
        setError('Vui lòng nhập số thẻ hợp lệ.');
        return;
      }
      if (!cardExpiry.trim()) { setError('Vui lòng nhập ngày hết hạn.'); return; }
      if (!cardCvv.trim()) { setError('Vui lòng nhập CVV.'); return; }
    }

    setIsSubmitting(true);
    try {
      // TODO: Tích hợp API thanh toán sau (Momo/VNPay/Stripe…).
      // KHÔNG gửi thông tin thẻ / paymentMethod lên backend.
      const email = account.email.trim().toLowerCase();

      await registerMerchant({
        // Account — đăng nhập bằng email nên username = email (BE cũng tự dùng email nếu bỏ trống)
        username: email,
        password: account.password,
        fullName: account.fullName.trim(),
        email,
        phoneNumber: account.phoneNumber.trim() || undefined, // BE không nhận chuỗi rỗng
        // Merchant
        merchantName: merchant.merchantName.trim(),
        address: merchant.address.trim(),
        category: merchant.category,
        description: merchant.description.trim() || undefined,
        merchantImages: merchant.images, // đúng 5 ảnh, data URI base64
        // Gói dịch vụ (BE lưu plan_id + billing_cycle, bỏ qua totalPrice)
        plan: { id: planId, billing, totalPrice },
      });
      setRegSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng ký thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = (next: Mode) => {
    setMode(next); setError('');
    if (next === 'register') { setStep(0); setRegSuccess(false); }
  };
  const backToLogin = () => {
    setMode('login'); setStep(0); setRegSuccess(false); setError('');
  };

  const isLogin = mode === 'login';
  const showWizard = mode === 'register' && !regSuccess;
  const progressPct = ((step + 1) / STEPS.length) * 100;
  const selectedPlan = PLANS.find(p => p.id === planId)!;
  const totalPrice = billing === 'yearly'
    ? Math.round(selectedPlan.monthly * 12 * 0.8)
    : selectedPlan.monthly;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-100 via-neutral-50 to-red-50/40 px-4 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <div
        className={`grid w-full overflow-hidden rounded-3xl bg-white shadow-[0_32px_100px_-24px_rgba(0,0,0,0.22)] ${
          isLogin ? 'max-w-[1320px] lg:grid-cols-2' : 'max-w-[720px]'
        }`}
      >
        {/* ===== FORM PANEL ===== */}
        <div className={`flex flex-col justify-center ${isLogin ? 'px-6 py-10 sm:px-12 sm:py-14 lg:px-14 xl:px-16' : 'px-6 py-10 sm:px-10 sm:py-12'}`}>
          <div className={`mx-auto w-full ${isLogin ? 'max-w-[460px]' : 'max-w-[560px]'}`}>
            {/* Logo */}
            <div className="mb-6 flex items-center gap-2.5">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-900 text-white">
                <Store className="h-[18px] w-[18px]" strokeWidth={2} />
              </span>
              <span className="text-lg font-semibold tracking-tight text-neutral-900">
                Hội An<span className="text-neutral-400">.</span>
              </span>
            </div>

            {/* LOGIN HEADER */}
            {isLogin && (
              <>
                <h1 className="text-[30px] font-bold leading-tight tracking-tight text-neutral-900 sm:text-[36px]">
                  Chào mừng trở lại 👋
                </h1>
                <p className="mt-2 text-[14px] text-neutral-500">
                  Chưa có tài khoản?{' '}
                  <button type="button" onClick={() => switchMode('register')} className="font-semibold text-[#EF4444] hover:underline">
                    Đăng ký ngay
                  </button>
                </p>
              </>
            )}

            {/* WIZARD HEADER */}
            {showWizard && (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[12px] font-semibold uppercase tracking-wider text-[#EF4444]">
                    Bước {step + 1}/{STEPS.length} · {STEPS[step].label}
                  </p>
                  <button type="button" onClick={backToLogin} className="text-[12px] font-medium text-neutral-500 hover:text-neutral-900">
                    Huỷ
                  </button>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-neutral-200">
                  <div className="h-full rounded-full bg-[#EF4444] transition-all duration-500 ease-out" style={{ width: `${progressPct}%` }} />
                </div>
                <h1 className="mt-6 text-[26px] font-bold leading-tight tracking-tight text-neutral-900 sm:text-[30px]">
                  {STEPS[step].heading}
                </h1>
                <p className="mt-1.5 text-[14px] text-neutral-500">{STEPS[step].sub}</p>
              </>
            )}

            {/* LOGIN FORM */}
            {isLogin && (
              <form onSubmit={handleLogin} className="mt-8 space-y-5" noValidate>
                <Field label="Email hoặc tên đăng nhập">
                  <input
                    type="text" autoComplete="username" value={username} required
                    onChange={e => { setUsername(e.target.value); setError(''); }}
                    placeholder="you@example.com" className={inputCls}
                  />
                </Field>

                <Field label="Mật khẩu">
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'} autoComplete="current-password" value={password} required
                      onChange={e => { setPassword(e.target.value); setError(''); }}
                      placeholder="••••••••" className={`${inputCls} pr-10`}
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} aria-label="Ẩn/hiện mật khẩu"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-neutral-400 hover:text-neutral-700">
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </Field>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex cursor-pointer items-center gap-2 text-[14px] text-neutral-600">
                    <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}
                      className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900" />
                    Ghi nhớ đăng nhập
                  </label>
                  <button type="button" onClick={() => setError('Vui lòng liên hệ quản trị viên để đặt lại mật khẩu.')}
                    className="text-[14px] font-medium text-neutral-700 hover:text-neutral-900 hover:underline">
                    Quên mật khẩu?
                  </button>
                </div>

                {error && <ErrorBox>{error}</ErrorBox>}

                <button type="submit" disabled={isSubmitting}
                  className="w-full rounded-lg bg-[#EF4444] py-3 text-[15px] font-semibold text-white shadow-lg shadow-red-500/20 transition-all hover:bg-[#DC2626] hover:shadow-red-500/30 disabled:opacity-60">
                  {isSubmitting ? 'Đang đăng nhập…' : 'Đăng nhập'}
                </button>

                <div className="relative py-2 text-center">
                  <span className="absolute inset-x-0 top-1/2 h-px bg-neutral-200" />
                  <span className="relative bg-white px-3 text-[11px] uppercase tracking-wider text-neutral-400">hoặc</span>
                </div>

                <div className="space-y-3">
                  <button type="button" onClick={() => setError('Đăng nhập bằng Google chưa khả dụng.')}
                    className="flex w-full items-center justify-center gap-3 rounded-lg border border-neutral-200 bg-white py-3 text-[14px] font-medium text-neutral-800 transition-colors hover:bg-neutral-50">
                    <GoogleIcon /> Tiếp tục với Google
                  </button>
                  <button type="button" onClick={() => setError('Đăng nhập bằng Facebook chưa khả dụng.')}
                    className="flex w-full items-center justify-center gap-3 rounded-lg border border-neutral-200 bg-white py-3 text-[14px] font-medium text-neutral-800 transition-colors hover:bg-neutral-50">
                    <FacebookIcon /> Tiếp tục với Facebook
                  </button>
                </div>
              </form>
            )}

            {/* WIZARD */}
            {showWizard && (
              <div className="mt-7">
                {/* STEP 1 — Account */}
                {step === 0 && (
                  <div className="space-y-4">
                    <Field label="Họ và tên" required>
                      <input value={account.fullName} onChange={e => setAccount({ ...account, fullName: e.target.value })}
                        className={inputCls} placeholder="Nguyễn Văn A" maxLength={100} />
                    </Field>
                    <Field label="Email" required>
                      <input type="email" value={account.email} onChange={e => setAccount({ ...account, email: e.target.value })}
                        className={inputCls} placeholder="you@example.com" maxLength={150} />
                    </Field>
                    <Field label="Số điện thoại">
                      <input type="tel" value={account.phoneNumber} onChange={e => setAccount({ ...account, phoneNumber: e.target.value })}
                        className={inputCls} placeholder="0905 123 456" maxLength={20} />
                    </Field>
                    <Field label="Mật khẩu" required>
                      <div className="relative">
                        <input type={showPass ? 'text' : 'password'} value={account.password}
                          onChange={e => setAccount({ ...account, password: e.target.value })}
                          className={`${inputCls} pr-10`} placeholder="Tối thiểu 8 ký tự" minLength={8} maxLength={72} />
                        <button type="button" onClick={() => setShowPass(!showPass)} aria-label="Ẩn/hiện mật khẩu"
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-neutral-400 hover:text-neutral-700">
                          {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </Field>
                    <Field label="Xác nhận mật khẩu" required>
                      <input type="password" value={account.confirmPassword}
                        onChange={e => setAccount({ ...account, confirmPassword: e.target.value })}
                        className={inputCls} placeholder="Nhập lại mật khẩu" maxLength={72} />
                    </Field>
                  </div>
                )}

                {/* STEP 2 — Merchant */}
                {step === 1 && (
                  <div className="space-y-4">
                    <Field label="Tên gian hàng" required>
                      <input value={merchant.merchantName} onChange={e => setMerchant({ ...merchant, merchantName: e.target.value })}
                        className={inputCls} placeholder="VD: Gian hàng Chùa Cầu" maxLength={150} />
                    </Field>
                    <Field label="Loại hình" required>
                      <select value={merchant.category} onChange={e => setMerchant({ ...merchant, category: e.target.value })}
                        className={`${inputCls} bg-white`}>
                        <option value="">Chọn loại hình</option>
                        {MERCHANT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </Field>
                    <Field label="Địa chỉ gian hàng" required>
                      <input value={merchant.address} onChange={e => setMerchant({ ...merchant, address: e.target.value })}
                        className={inputCls} placeholder="Số nhà, đường, phường..." maxLength={255} />
                    </Field>
                    <Field label="Mô tả gian hàng">
                      <textarea value={merchant.description} onChange={e => setMerchant({ ...merchant, description: e.target.value })}
                        rows={3} className={`${inputCls} resize-none`}
                        placeholder="Giới thiệu ngắn gọn về gian hàng..." maxLength={500} />
                    </Field>

                    {/* === 5 ảnh gian hàng cố định === */}
                    <Field
                      label="Hình ảnh gian hàng"
                      required
                      hint={`${merchant.images.length}/${MERCHANT_IMAGE_SLOTS} ảnh · cần đủ ${MERCHANT_IMAGE_SLOTS}`}
                    >
                      <ImageGrid
                        images={merchant.images}
                        max={MERCHANT_IMAGE_SLOTS}
                        min={MERCHANT_IMAGE_SLOTS}
                        onPick={() => merchantFileRef.current?.click()}
                        onRemove={removeImage}
                      />
                      <input
                        ref={merchantFileRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={e => {
                          if (e.target.files?.length) readImages(e.target.files);
                          e.target.value = '';
                        }}
                      />
                    </Field>
                  </div>
                )}

                {/* STEP 3 — Plans */}
                {step === 2 && (
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <div className="inline-flex rounded-lg bg-neutral-100 p-1">
                        <button type="button" onClick={() => setBilling('monthly')}
                          className={`rounded-md px-4 py-1.5 text-[13px] font-medium transition-colors ${
                            billing === 'monthly' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500'
                          }`}>
                          Hàng tháng
                        </button>
                        <button type="button" onClick={() => setBilling('yearly')}
                          className={`flex items-center gap-1.5 rounded-md px-4 py-1.5 text-[13px] font-medium transition-colors ${
                            billing === 'yearly' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500'
                          }`}>
                          Hàng năm
                          <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                            -20%
                          </span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {PLANS.map(p => {
                        const price = billing === 'yearly' ? Math.round(p.monthly * 12 * 0.8) : p.monthly;
                        const isSelected = planId === p.id;
                        return (
                          <button key={p.id} type="button" onClick={() => setPlanId(p.id)}
                            className={`relative w-full rounded-xl border-2 p-4 text-left transition-all ${
                              isSelected ? 'border-[#EF4444] bg-red-50/30 shadow-md shadow-red-500/10' : 'border-neutral-200 bg-white hover:border-neutral-400'
                            }`}>
                            {p.popular && (
                              <span className="absolute -top-2.5 left-4 rounded-full bg-[#EF4444] px-2 py-0.5 text-[10px] font-semibold text-white">
                                Phổ biến
                              </span>
                            )}
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="text-[15px] font-semibold text-neutral-900">{p.name}</p>
                                  {isSelected && <Check className="h-4 w-4 text-[#EF4444]" />}
                                </div>
                                <ul className="mt-2 space-y-1">
                                  {p.features.map(f => (
                                    <li key={f} className="flex items-start gap-1.5 text-[12px] text-neutral-600">
                                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-neutral-400" />
                                      {f}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div className="text-right">
                                <p className="text-[18px] font-bold text-neutral-900">
                                  {price === 0 ? 'Miễn phí' : formatVND(price)}
                                </p>
                                {price > 0 && (
                                  <p className="text-[11px] text-neutral-500">
                                    /{billing === 'yearly' ? 'năm' : 'tháng'}
                                  </p>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* STEP 4 — Payment (UI only, chưa gọi API thanh toán) */}
                {step === 3 && (
                  <div className="space-y-5">
                    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Tóm tắt đơn hàng</p>
                      <div className="space-y-2 text-[13px]">
                        <div className="flex justify-between">
                          <span className="text-neutral-600">Gói dịch vụ</span>
                          <span className="font-medium text-neutral-900">
                            {selectedPlan.name} ({billing === 'yearly' ? 'Hàng năm' : 'Hàng tháng'})
                          </span>
                        </div>
                        {selectedPlan.monthly > 0 && billing === 'yearly' && (
                          <div className="flex justify-between text-emerald-600">
                            <span>Giảm giá 20%</span>
                            <span className="font-medium">−{formatVND(Math.round(selectedPlan.monthly * 12 * 0.2))}</span>
                          </div>
                        )}
                        <div className="flex justify-between border-t border-neutral-200 pt-2 text-[15px] font-bold">
                          <span className="text-neutral-900">Tổng cộng</span>
                          <span className="text-neutral-900">
                            {totalPrice === 0 ? 'Miễn phí' : formatVND(totalPrice)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {totalPrice > 0 ? (
                      <>
                        <div>
                          <p className="mb-2 text-[13px] font-medium text-neutral-800">Phương thức thanh toán</p>
                          <div className="grid grid-cols-3 gap-2">
                            <PayBtn icon={CreditCard} label="Thẻ" active={paymentMethod === 'card'} onClick={() => setPaymentMethod('card')} />
                            <PayBtn icon={Building2} label="Chuyển khoản" active={paymentMethod === 'transfer'} onClick={() => setPaymentMethod('transfer')} />
                            <PayBtn icon={Wallet} label="Ví điện tử" active={paymentMethod === 'wallet'} onClick={() => setPaymentMethod('wallet')} />
                          </div>
                        </div>

                        {paymentMethod === 'card' && (
                          <div className="space-y-3 rounded-lg border border-neutral-200 p-4">
                            <Field label="Số thẻ">
                              <input
                                value={cardNumber}
                                onChange={e => { setCardNumber(e.target.value); setError(''); }}
                                className={inputCls}
                                placeholder="1234 5678 9012 3456"
                                maxLength={19}
                                inputMode="numeric"
                              />
                            </Field>
                            <div className="grid grid-cols-2 gap-3">
                              <Field label="Hết hạn">
                                <input
                                  value={cardExpiry}
                                  onChange={e => { setCardExpiry(e.target.value); setError(''); }}
                                  className={inputCls}
                                  placeholder="MM/YY"
                                  maxLength={5}
                                />
                              </Field>
                              <Field label="CVV">
                                <input
                                  value={cardCvv}
                                  onChange={e => { setCardCvv(e.target.value); setError(''); }}
                                  className={inputCls}
                                  placeholder="123"
                                  maxLength={3}
                                  inputMode="numeric"
                                />
                              </Field>
                            </div>
                            <p className="text-[11px] leading-relaxed text-neutral-400">
                              * Thông tin thẻ chỉ dùng cho giao diện, chưa được gửi lên hệ thống thanh toán.
                            </p>
                          </div>
                        )}
                        {paymentMethod === 'transfer' && (
                          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-[13px]">
                            <p className="mb-2 font-medium text-neutral-900">Thông tin chuyển khoản:</p>
                            <div className="space-y-1 text-neutral-600">
                              <p>Ngân hàng: <strong className="text-neutral-900">Vietcombank</strong></p>
                              <p>Số TK: <strong className="text-neutral-900">0123 4567 8901</strong></p>
                              <p>Chủ TK: <strong className="text-neutral-900">HỘI AN AUDIO GUIDE</strong></p>
                              <p>Nội dung: <strong className="text-neutral-900">[email] — {selectedPlan.name}</strong></p>
                            </div>
                          </div>
                        )}
                        {paymentMethod === 'wallet' && (
                          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-center">
                            <Sparkles className="mx-auto h-6 w-6 text-[#EF4444]" />
                            <p className="mt-2 text-[13px] font-medium text-neutral-900">Quét QR để thanh toán</p>
                            <p className="mt-1 text-[12px] text-neutral-500">Hỗ trợ Momo, ZaloPay, VNPay</p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-700">
                        ✓ Gói Cơ bản miễn phí — không cần thanh toán.
                      </div>
                    )}

                    <label className="flex cursor-pointer items-start gap-2.5 text-[13px] leading-relaxed text-neutral-600">
                      <input type="checkbox" checked={agreeTerms} onChange={e => { setAgreeTerms(e.target.checked); setError(''); }}
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900" />
                      <span>
                        Tôi đồng ý với{' '}
                        <button type="button" className="font-semibold text-[#EF4444] hover:underline">Điều khoản sử dụng</button>{' '}
                        và{' '}
                        <button type="button" className="font-semibold text-[#EF4444] hover:underline">Chính sách bảo mật</button>{' '}
                        của Hội An Audio Guide.
                      </span>
                    </label>
                  </div>
                )}

                {error && <ErrorBox className="mt-4">{error}</ErrorBox>}

                <div className="mt-6 flex items-center justify-between gap-3 border-t border-neutral-100 pt-5">
                  {step > 0 ? (
                    <button type="button" onClick={prevStep}
                      className="flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-[14px] font-medium text-neutral-700 transition-colors hover:bg-neutral-100">
                      <ArrowLeft className="h-4 w-4" />
                      Quay lại
                    </button>
                  ) : <div />}

                  <div className="flex items-center gap-2">
                    {step < STEPS.length - 1 ? (
                      <button type="button" onClick={nextStep}
                        className="flex items-center gap-1.5 rounded-lg bg-[#EF4444] px-6 py-2.5 text-[14px] font-semibold text-white shadow-lg shadow-red-500/20 transition-all hover:bg-[#DC2626] hover:shadow-red-500/30">
                        Tiếp tục
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    ) : (
                      <button type="button" onClick={handleSubmitRegister} disabled={isSubmitting}
                        className="flex items-center gap-1.5 rounded-lg bg-[#EF4444] px-6 py-2.5 text-[14px] font-semibold text-white shadow-lg shadow-red-500/20 transition-all hover:bg-[#DC2626] hover:shadow-red-500/30 disabled:opacity-60">
                        {isSubmitting ? 'Đang xử lý…' : totalPrice > 0 ? `Hoàn tất & Thanh toán ${formatVND(totalPrice)}` : 'Hoàn tất đăng ký'}
                        {!isSubmitting && <ArrowRight className="h-4 w-4" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SUCCESS */}
            {mode === 'register' && regSuccess && (
              <div className="mt-10 flex flex-col items-center text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                  <Clock className="h-8 w-8 text-amber-600" strokeWidth={2} />
                </div>
                <p className="max-w-md text-[15px] font-medium leading-relaxed text-neutral-900">
                  Đăng ký thành công! Hồ sơ đang chờ duyệt.
                </p>
                <p className="mt-2 max-w-md text-[14px] leading-relaxed text-neutral-500">
                  Quản trị viên sẽ xem xét hồ sơ gian hàng của bạn trong{' '}
                  <strong className="text-neutral-900">1–3 ngày làm việc</strong>. Chúng tôi sẽ thông báo qua email{' '}
                  <span className="font-medium text-neutral-700">{account.email}</span>{' '}
                  khi mọi thứ sẵn sàng.
                </p>
                <div className="mt-5 w-full max-w-md rounded-lg bg-neutral-50 px-4 py-3 text-left text-[12px] leading-relaxed text-neutral-600">
                  <p className="mb-1 font-semibold text-neutral-900">Bước tiếp theo:</p>
                  <ul className="space-y-0.5">
                    <li>• Admin duyệt hồ sơ gian hàng</li>
                    <li>• Bạn nhận email xác nhận và có thể đăng nhập</li>
                  </ul>
                </div>
                <button type="button" onClick={backToLogin}
                  className="mt-6 flex w-full max-w-sm items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-white py-3 text-[14px] font-semibold text-neutral-800 transition-colors hover:bg-neutral-50">
                  Về trang đăng nhập
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ===== BANNER (login only) ===== */}
        {isLogin && (
          <div className="relative hidden overflow-hidden lg:block">
            <img src={bannerImg} alt="Hội An" className="absolute inset-0 h-full w-full object-cover" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-red-900/20 via-transparent to-black/40" />

            <button type="button"
              className="absolute right-8 top-8 z-10 flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2.5 text-[13px] font-medium text-white backdrop-blur-md transition-colors hover:bg-white/25">
              <Headphones className="h-4 w-4" strokeWidth={1.75} />
              Hỗ trợ
            </button>

            <div className="absolute inset-x-0 bottom-0 z-10 p-10 xl:p-14">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white backdrop-blur-md">
                <Star className="h-3 w-3 fill-white" />
                Nền tảng thuyết minh du lịch
              </span>

              <h2 className="mt-5 max-w-md text-[34px] font-bold leading-[1.15] tracking-tight text-white xl:text-[40px]">
                Kể câu chuyện Hội An
                <span className="block text-white/80">bằng chính giọng nói của bạn.</span>
              </h2>

              <p className="mt-4 max-w-md text-[14px] leading-relaxed text-white/80">
                Tạo tour thuyết minh đa ngôn ngữ, quản lý gian hàng và điểm tham quan — tất cả trong một nền tảng duy nhất.
              </p>

              <div className="mt-7 grid max-w-md grid-cols-3 gap-3">
                <FeatureBadge icon={Mic} label="Audio TTS" />
                <FeatureBadge icon={Languages} label="6 ngôn ngữ" />
                <FeatureBadge icon={ShieldCheck} label="Bảo mật" />
              </div>

              <div className="mt-8 flex items-center gap-3 border-t border-white/15 pt-6">
                <div className="flex -space-x-2">
                  {['A', 'B', 'C', 'D'].map((c, i) => (
                    <span key={i}
                      className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-black/40 bg-gradient-to-br from-red-400 to-amber-400 text-[11px] font-bold text-white">
                      {c}
                    </span>
                  ))}
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-white">500+ chủ gian hàng</p>
                  <p className="text-[11px] text-white/70">đã tin tưởng sử dụng</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ===== Small reusable UI ===== */
function Field({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <label className="text-[13px] font-medium text-neutral-800">
          {label} {required && <span className="text-[#EF4444]">*</span>}
        </label>
        {hint && <span className="shrink-0 text-[11px] text-neutral-400">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function ErrorBox({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div role="alert" className={`rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-600 ${className}`}>
      {children}
    </div>
  );
}

function FeatureBadge({ icon: Icon, label }: { icon: typeof Mic; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-2 py-3 text-center backdrop-blur-md">
      <Icon className="h-4 w-4 text-white" strokeWidth={1.75} />
      <span className="text-[11px] font-medium text-white/90">{label}</span>
    </div>
  );
}

/* ==== 5-slot fixed image grid ==== */
function ImageGrid({
  images, max, min, onPick, onRemove,
}: {
  images: string[]; max: number; min: number;
  onPick: () => void; onRemove: (idx: number) => void;
}) {
  return (
    <div>
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: max }).map((_, i) => {
          const src = images[i];

          if (src) {
            return (
              <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50">
                <img src={src} alt={`Ảnh ${i + 1}`} className="h-full w-full object-cover" />
                {i === 0 && (
                  <span className="absolute left-1 top-1 rounded bg-black/60 px-1 py-0.5 text-[8px] font-semibold uppercase text-white">
                    Bìa
                  </span>
                )}
                <button type="button" onClick={() => onRemove(i)} aria-label={`Xoá ảnh ${i + 1}`}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100">
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          }

          return (
            <button key={i} type="button" onClick={onPick}
              className="flex aspect-square flex-col items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-neutral-50/50 text-neutral-400 transition-colors hover:border-[#EF4444] hover:bg-red-50/40 hover:text-[#EF4444]">
              <ImagePlus className="h-4 w-4" strokeWidth={1.75} />
            </button>
          );
        })}
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px]">
        <span className={images.length >= min ? 'text-emerald-600' : 'text-amber-600'}>
          {images.length >= min
            ? `✓ Đã đủ ${images.length}/${max} ảnh`
            : `Còn thiếu ${min - images.length} ảnh (${images.length}/${max})`}
        </span>
        <span className="text-neutral-400">PNG, JPG · ≤ 5MB/ảnh</span>
      </div>
    </div>
  );
}

function PayBtn({ icon: Icon, label, active, onClick }: {
  icon: typeof CreditCard; label: string; active: boolean; onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick}
      className={`flex flex-col items-center gap-1.5 rounded-lg border-2 px-2 py-3 text-[12px] font-medium transition-all ${
        active ? 'border-[#EF4444] bg-red-50/30 text-neutral-900' : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400'
      }`}>
      <Icon className={`h-4 w-4 ${active ? 'text-[#EF4444]' : 'text-neutral-500'}`} strokeWidth={1.75} />
      {label}
    </button>
  );
}

/* ===== Icons ===== */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.9 6.4 29.2 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5c10.7 0 19.5-8.7 19.5-19.5 0-1.2-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.9 6.4 29.2 4.5 24 4.5c-7.7 0-14.3 4.4-17.7 10.2z" />
      <path fill="#4CAF50" d="M24 43.5c5.1 0 9.8-1.9 13.3-5.1l-6.2-5.2c-2 1.4-4.5 2.3-7.1 2.3-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.5 39 16.2 43.5 24 43.5z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.7l6.2 5.2c-.4.4 6.7-4.9 6.7-14.9 0-1.2-.1-2.4-.4-3.5z" />
    </svg>
  );
}
function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#1877F2" d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 6.024 4.388 11.02 10.125 11.927v-8.437H7.078v-3.49h3.047V9.412c0-3.017 1.792-4.687 4.533-4.687 1.312 0 2.686.235 2.686.235v2.955h-1.514c-1.49 0-1.955.93-1.955 1.884v2.274h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.097 24 12.073z" />
    </svg>
  );
}