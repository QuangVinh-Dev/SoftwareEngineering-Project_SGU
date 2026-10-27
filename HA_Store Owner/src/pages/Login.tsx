import { useRef, useState } from 'react';
import {
  Eye, EyeOff, User, Lock, Mail, Phone, Store, Building2,
  CreditCard, ImagePlus, ArrowRight, ChevronLeft, CheckCircle2,
  Clock, ShieldCheck, Headphones,
} from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import { login, registerMerchant } from '@/services/authApi';

// Nếu không dùng ảnh banner thì có thể xóa import này
import bannerImg from '@/img/banner.png';

type Mode = 'login' | 'register';

/* ============================================================
   Input style — VUÔNG
   ============================================================ */
const inputSquare =
  'w-full rounded-md border border-[#E5E7EB] bg-white pl-11 pr-4 py-3 text-[14px] text-[#1F2937] ' +
  'outline-none placeholder:text-[#9CA3AF] transition-all ' +
  'focus:border-[#7C3AED] focus:ring-4 focus:ring-[#7C3AED]/10';

/* ============================================================
   Decorative SVG pattern
   ============================================================ */
function BannerPattern() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full opacity-40"
      viewBox="0 0 500 600"
      fill="none"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <g stroke="white" strokeWidth="0.7" opacity="0.55">
        <path d="M-40 40 C 30 70, 90 40, 120 -20" />
        <path d="M-40 60 C 40 100, 120 60, 160 -30" />
        <path d="M-40 85 C 50 130, 150 80, 200 -40" />
        <path d="M-40 110 C 60 160, 180 100, 240 -50" />
      </g>
      <g stroke="white" strokeWidth="0.7" opacity="0.5">
        <path d="M 300 620 C 320 560, 380 540, 420 580 S 480 640, 520 600" />
        <path d="M 320 640 C 340 580, 400 560, 440 600 S 500 660, 540 620" />
        <path d="M 340 660 C 360 600, 420 580, 460 620 S 520 680, 560 640" />
      </g>
      <g fill="white" opacity="0.75">
        {Array.from({ length: 6 }).map((_, r) =>
          Array.from({ length: 4 }).map((_, c) => (
            <circle key={`${r}-${c}`} cx={380 + c * 10} cy={70 + r * 10} r="1.4" />
          ))
        )}
      </g>
      <g stroke="white" strokeWidth="1" opacity="0.7">
        <path d="M 120 140 l 4 8 l 8 4 l -8 4 l -4 8 l -4 -8 l -8 -4 l 8 -4 z" />
        <path d="M 340 460 l 3 6 l 6 3 l -6 3 l -3 6 l -3 -6 l -6 -3 l 6 -3 z" />
      </g>
      <circle cx="180" cy="380" r="26" stroke="white" strokeWidth="0.8" opacity="0.5" fill="none" />
      <circle cx="420" cy="260" r="10" stroke="white" strokeWidth="0.8" opacity="0.6" fill="none" />
    </svg>
  );
}

/* ============================================================
   Purple Banner
   ============================================================ */
function PurpleBanner({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="relative hidden overflow-hidden bg-[#7C3AED] lg:block">
      <div className="absolute inset-0 bg-gradient-to-br from-[#6D28D9] via-[#7C3AED] to-[#8B5CF6]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.18),transparent_45%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(76,29,149,0.55),transparent_50%)]" />
      <BannerPattern />

      <img
        src={bannerImg}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-20 mix-blend-luminosity"
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
      />

      <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-14">
        <div className="flex items-center gap-2 text-white/90">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white/15 backdrop-blur">
            <Store className="h-4 w-4" />
          </span>
          <span className="text-[13px] font-semibold tracking-wide">Hội An Audio Guide</span>
        </div>

        <div>
          <h2 className="text-[36px] font-bold leading-[1.1] tracking-tight text-white xl:text-[44px]">
            {title}
          </h2>
          <p className="mt-3 max-w-sm text-[14px] leading-relaxed text-white/85">
            {subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-white/70">
          <Headphones className="h-3.5 w-3.5" />
          Nền tảng thuyết minh du lịch Hội An
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Reusable bits
   ============================================================ */
function FieldIcon({ icon: Icon }: { icon: typeof User }) {
  return (
    <Icon className="pointer-events-none absolute left-4 top-1/2 h-[16px] w-[16px] -translate-y-1/2 text-[#9CA3AF]" />
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="mb-1.5 block text-[12.5px] font-medium text-[#374151]">
      {children} {required && <span className="text-[#7C3AED]">*</span>}
    </label>
  );
}

function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
    <div role="alert" className="flex items-start gap-2.5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-[13px] leading-relaxed text-red-700">
      <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-sm bg-red-500 text-[10px] font-bold text-white">!</span>
      <span>{children}</span>
    </div>
  );
}

function SectionGroup({ title, icon: Icon, children }: { title: string; icon: typeof User; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-[#9CA3AF]" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">{title}</span>
      </div>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-sm bg-[#EDE9FE] text-[10px] font-bold text-[#7C3AED]">{n}</span>
      <span>{children}</span>
    </li>
  );
}

/* ============================================================
   Main Component
   ============================================================ */
export default function Login() {
  const { signIn } = useApp();
  const [mode, setMode] = useState<Mode>('login');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPass, setShowPass] = useState(false);

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [account, setAccount] = useState({
    fullName: '', email: '', phoneNumber: '', password: '', confirmPassword: '',
  });
  const [merchantName, setMerchantName] = useState('');
  const [cccd, setCccd] = useState({ number: '', front: '', back: '' });
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);

  const cccdFrontRef = useRef<HTMLInputElement>(null);
  const cccdBackRef = useRef<HTMLInputElement>(null);

  const pickCccd = (side: 'front' | 'back', file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Ảnh CCCD phải là file ảnh.'); return; }
    if (file.size > 5 * 1024 * 1024) { setError(`"${file.name}" vượt quá 5MB.`); return; }
    setError('');
    const reader = new FileReader();
    reader.onload = () => setCccd(c => ({ ...c, [side]: reader.result as string }));
    reader.readAsDataURL(file);
  };

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

  const validateRegister = (): boolean => {
    setError('');
    if (!account.fullName.trim()) { setError('Vui lòng nhập họ và tên.'); return false; }
    if (!account.email.trim() || !/^\S+@\S+\.\S+$/.test(account.email)) { setError('Email không hợp lệ.'); return false; }
    if (!account.password || account.password.length < 8) { setError('Mật khẩu phải có ít nhất 8 ký tự.'); return false; }
    if (!/[A-Za-z]/.test(account.password) || !/\d/.test(account.password)) { setError('Mật khẩu phải có cả chữ và số.'); return false; }
    if (account.phoneNumber.trim() && !/^[0-9+()\-\s]{8,20}$/.test(account.phoneNumber.trim())) { setError('Số điện thoại không hợp lệ.'); return false; }
    if (account.password !== account.confirmPassword) { setError('Mật khẩu xác nhận không khớp.'); return false; }
    if (!merchantName.trim()) { setError('Vui lòng nhập tên gian hàng.'); return false; }
    if (!/^(\d{9}|\d{12})$/.test(cccd.number.trim())) { setError('Số CCCD phải gồm 9 hoặc 12 chữ số.'); return false; }
    if (!cccd.front) { setError('Vui lòng tải ảnh mặt trước CCCD.'); return false; }
    if (!cccd.back) { setError('Vui lòng tải ảnh mặt sau CCCD.'); return false; }
    if (!agreeTerms) { setError('Vui lòng đồng ý với Điều khoản sử dụng.'); return false; }
    return true;
  };

  const handleSubmitRegister = async () => {
    if (!validateRegister()) return;
    setIsSubmitting(true);
    try {
      const email = account.email.trim().toLowerCase();
      await registerMerchant({
        username: email,
        password: account.password,
        fullName: account.fullName.trim(),
        email,
        phoneNumber: account.phoneNumber.trim() || undefined,
        merchantName: merchantName.trim(),
        cccdNumber: cccd.number.trim(),
        cccdFrontImage: cccd.front,
        cccdBackImage: cccd.back,
      });
      setRegSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng ký thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLogin = mode === 'login';
  const backToLogin = () => { setMode('login'); setError(''); setRegSuccess(false); };

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    // Trang độc lập, tràn màn hình, căn giữa form
    <div className="flex min-h-screen items-center justify-center bg-[#EEF0FB] p-4 sm:p-8">
      {/* Khung ngoài cùng: HÌNH VUÔNG (không bo góc) */}
      <div
        className={`grid w-full overflow-hidden bg-white shadow-[0_20px_60px_-15px_rgba(76,29,149,0.3)] ${
          isLogin ? 'max-w-[1100px] lg:grid-cols-2' : 'max-w-[560px] grid-cols-1'
        }`}
      >
        {/* ===== Banner (login only) ===== */}
        {isLogin && (
          <PurpleBanner
            title="Welcome back!"
            subtitle="Bạn có thể đăng nhập để truy cập vào tài khoản chủ gian hàng của mình."
          />
        )}

        {/* ===== Form panel ===== */}
        <div className={`flex flex-col justify-center bg-white px-7 py-10 sm:px-12 sm:py-14 ${isLogin ? 'lg:px-14 xl:px-16' : ''}`}>
          <div className={`mx-auto w-full ${isLogin ? 'max-w-[400px]' : 'max-w-[480px]'}`}>
            
            {/* Mobile logo (login only) */}
            {isLogin && (
              <div className="mb-7 flex items-center gap-2 lg:hidden">
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#7C3AED] text-white">
                  <Store className="h-4 w-4" />
                </span>
                <span className="text-[14px] font-semibold text-[#1F2937]">Hội An Audio Guide</span>
              </div>
            )}

            {/* ===== LOGIN ===== */}
            {isLogin && (
              <>
                <h1 className="text-[28px] font-bold tracking-tight text-[#1F2937]">Sign In</h1>
                <p className="mt-1 text-[13px] text-[#6B7280]">
                  Đăng nhập để tiếp tục vào bảng điều khiển.
                </p>

                <form onSubmit={handleLogin} className="mt-7 space-y-4" noValidate>
                  <div className="relative">
                    <FieldIcon icon={User} />
                    <input
                      type="text"
                      autoComplete="username"
                      value={username}
                      required
                      onChange={e => { setUsername(e.target.value); setError(''); }}
                      placeholder="Tên đăng nhập hoặc email"
                      className={inputSquare}
                    />
                  </div>

                  <div className="relative">
                    <FieldIcon icon={Lock} />
                    <input
                      type={showPass ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      required
                      onChange={e => { setPassword(e.target.value); setError(''); }}
                      placeholder="Mật khẩu"
                      className={`${inputSquare} pr-11`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      aria-label="Ẩn/hiện mật khẩu"
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm p-1.5 text-[#9CA3AF] transition-colors hover:bg-[#F3F4F6] hover:text-[#4B5563]"
                    >
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex cursor-pointer items-center gap-2 text-[12.5px] text-[#4B5563]">
                      <input
                        type="checkbox"
                        checked={remember}
                        onChange={e => setRemember(e.target.checked)}
                        className="h-3.5 w-3.5 rounded-sm border-[#D1D5DB] text-[#7C3AED] focus:ring-[#7C3AED]"
                      />
                      Ghi nhớ đăng nhập
                    </label>
                    <button
                      type="button"
                      onClick={() => setError('Vui lòng liên hệ quản trị viên để đặt lại mật khẩu.')}
                      className="text-[12.5px] font-medium text-[#7C3AED] hover:underline"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>

                  {error && <ErrorBox>{error}</ErrorBox>}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-md bg-[#7C3AED] py-3 text-[14px] font-semibold text-white shadow-[0_8px_20px_-6px_rgba(124,58,237,0.55)] transition-all hover:bg-[#6D28D9] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        Đang đăng nhập…
                      </>
                    ) : 'Sign In'}
                  </button>
                </form>

                <p className="mt-7 text-center text-[12.5px] text-[#6B7280]">
                  Bạn mới đến?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('register'); setError(''); }}
                    className="font-semibold text-[#7C3AED] hover:underline"
                  >
                    Tạo tài khoản
                  </button>
                </p>
              </>
            )}

            {/* ===== REGISTER ===== */}
            {!isLogin && !regSuccess && (
              <>
                <button
                  type="button"
                  onClick={backToLogin}
                  className="mb-5 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[#6B7280] transition-colors hover:text-[#7C3AED]"
                >
                  <ChevronLeft className="h-4 w-4" /> Quay lại đăng nhập
                </button>

                <h1 className="text-[26px] font-bold tracking-tight text-[#1F2937]">Tạo tài khoản chủ gian hàng</h1>
                <p className="mt-1.5 text-[13px] leading-relaxed text-[#6B7280]">
                  Quản trị viên sẽ xác minh hồ sơ. Sau khi được duyệt, bạn có thể đăng nhập và tạo điểm tham quan.
                </p>

                <div className="mt-6 space-y-4">
                  <SectionGroup title="Thông tin tài khoản" icon={User}>
                    <div className="relative">
                      <FieldIcon icon={User} />
                      <input value={account.fullName} onChange={e => setAccount({ ...account, fullName: e.target.value })} className={inputSquare} placeholder="Họ và tên" maxLength={100} />
                    </div>
                    <div className="relative">
                      <FieldIcon icon={Mail} />
                      <input type="email" value={account.email} onChange={e => setAccount({ ...account, email: e.target.value })} className={inputSquare} placeholder="Email" maxLength={150} />
                    </div>
                    <div className="relative">
                      <FieldIcon icon={Phone} />
                      <input type="tel" value={account.phoneNumber} onChange={e => setAccount({ ...account, phoneNumber: e.target.value })} className={inputSquare} placeholder="Số điện thoại" maxLength={20} />
                    </div>
                  </SectionGroup>

                  <SectionGroup title="Thông tin gian hàng" icon={Building2}>
                    <div className="relative">
                      <FieldIcon icon={Store} />
                      <input value={merchantName} onChange={e => setMerchantName(e.target.value)} className={inputSquare} placeholder="Tên gian hàng" maxLength={150} />
                    </div>
                  </SectionGroup>

                  <SectionGroup title="Xác minh danh tính" icon={ShieldCheck}>
                    <div className="relative">
                      <FieldIcon icon={CreditCard} />
                      <input
                        inputMode="numeric"
                        value={cccd.number}
                        onChange={e => setCccd({ ...cccd, number: e.target.value.replace(/\D/g, '').slice(0, 12) })}
                        className={inputSquare}
                        placeholder="Số CCCD (9 hoặc 12 chữ số)"
                        maxLength={12}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {([
                        ['front', 'Mặt trước CCCD', cccdFrontRef],
                        ['back', 'Mặt sau CCCD', cccdBackRef],
                      ] as const).map(([side, label, ref]) => (
                        <div key={side}>
                          <FieldLabel required>{label}</FieldLabel>
                          <button
                            type="button"
                            onClick={() => ref.current?.click()}
                            className={`group flex h-24 w-full items-center justify-center overflow-hidden rounded-md border-2 border-dashed transition-all ${
                              cccd[side]
                                ? 'border-[#E5E7EB] bg-[#F9FAFB]'
                                : 'border-[#E5E7EB] bg-[#F9FAFB] hover:border-[#7C3AED] hover:bg-[#F5F3FF]'
                            }`}
                          >
                            {cccd[side] ? (
                              <img src={cccd[side]} alt={label} className="h-full w-full object-cover" />
                            ) : (
                              <span className="flex flex-col items-center gap-1 text-[#9CA3AF] transition-colors group-hover:text-[#7C3AED]">
                                <ImagePlus className="h-5 w-5" />
                                <span className="text-[11px] font-medium">Chọn ảnh</span>
                              </span>
                            )}
                          </button>
                          <input
                            ref={ref}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={e => { pickCccd(side, e.target.files?.[0]); e.target.value = ''; }}
                          />
                        </div>
                      ))}
                    </div>
                  </SectionGroup>

                  <SectionGroup title="Bảo mật" icon={Lock}>
                    <div className="relative">
                      <FieldIcon icon={Lock} />
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={account.password}
                        onChange={e => setAccount({ ...account, password: e.target.value })}
                        className={`${inputSquare} pr-11`}
                        placeholder="Mật khẩu (tối thiểu 8 ký tự)"
                        maxLength={72}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        aria-label="Ẩn/hiện mật khẩu"
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm p-1.5 text-[#9CA3AF] transition-colors hover:bg-[#F3F4F6] hover:text-[#4B5563]"
                      >
                        {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <div className="relative">
                      <FieldIcon icon={Lock} />
                      <input
                        type="password"
                        value={account.confirmPassword}
                        onChange={e => setAccount({ ...account, confirmPassword: e.target.value })}
                        className={inputSquare}
                        placeholder="Xác nhận mật khẩu"
                        maxLength={72}
                      />
                    </div>
                  </SectionGroup>

                  {error && <ErrorBox>{error}</ErrorBox>}

                  <label className="flex cursor-pointer items-start gap-2.5 rounded-md bg-[#F9FAFB] p-3.5 text-[12.5px] leading-relaxed text-[#4B5563] transition-colors hover:bg-[#F3F4F6]">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={e => { setAgreeTerms(e.target.checked); setError(''); }}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded-sm border-[#D1D5DB] text-[#7C3AED] focus:ring-[#7C3AED]"
                    />
                    <span>
                      Tôi đồng ý với{' '}
                      <button type="button" className="font-semibold text-[#7C3AED] hover:underline">Điều khoản sử dụng</button>{' '}
                      và{' '}
                      <button type="button" className="font-semibold text-[#7C3AED] hover:underline">Chính sách bảo mật</button>{' '}
                      của Hội An Audio Guide.
                    </span>
                  </label>
                </div>

                <div className="mt-6 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={backToLogin}
                    className="rounded-md px-4 py-2.5 text-[13px] font-medium text-[#6B7280] transition-colors hover:bg-[#F3F4F6]"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitRegister}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 rounded-md bg-[#7C3AED] px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_8px_20px_-6px_rgba(124,58,237,0.55)] transition-all hover:bg-[#6D28D9] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        Đang xử lý…
                      </>
                    ) : (
                      <>Gửi đăng ký <ArrowRight className="h-4 w-4" /></>
                    )}
                  </button>
                </div>
              </>
            )}

            {/* ===== SUCCESS ===== */}
            {!isLogin && regSuccess && (
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-5">
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-md bg-gradient-to-br from-[#EDE9FE] to-[#DDD6FE]">
                    <Clock className="h-9 w-9 text-[#7C3AED]" strokeWidth={2} />
                  </div>
                </div>
                <h2 className="text-[22px] font-bold text-[#1F2937]">Đăng ký thành công!</h2>
                <p className="mt-2 max-w-sm text-[13.5px] leading-relaxed text-[#6B7280]">
                  Hồ sơ đang chờ quản trị viên xét duyệt. Chúng tôi sẽ xác minh trong vòng 24–48 giờ.
                </p>

                <div className="mt-6 w-full rounded-md border border-[#E5E7EB] bg-[#F9FAFB] p-5 text-left">
                  <p className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-[#1F2937]">
                    <CheckCircle2 className="h-4 w-4 text-[#7C3AED]" />
                    Bước tiếp theo
                  </p>
                  <ul className="space-y-2 text-[12.5px] text-[#4B5563]">
                    <Step n={1}>Admin xác minh hồ sơ và CCCD</Step>
                    <Step n={2}>Bạn đăng nhập bằng email <span className="font-medium text-[#1F2937]">{account.email}</span></Step>
                    <Step n={3}>Tạo điểm tham quan (POI) cho gian hàng</Step>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={backToLogin}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-md border border-[#E5E7EB] bg-white py-3 text-[13.5px] font-semibold text-[#374151] transition-colors hover:bg-[#F9FAFB]"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Về trang đăng nhập
                </button>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
}