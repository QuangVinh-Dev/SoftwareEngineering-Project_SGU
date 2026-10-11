import { useState } from 'react';
import { ArrowRight, Eye, EyeOff, Lock, Store, User, Volume2 } from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import { login, registerMerchant } from '@/services/authApi';

type Mode = 'login' | 'register';

const inputClass = 'w-full px-3 py-2.5 rounded-lg border border-brown-200 text-sm text-brown-800 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all';

export default function Login() {
  const { signIn } = useApp();
  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationMessage, setRegistrationMessage] = useState('');
  const [registration, setRegistration] = useState({
    username: '',
    password: '',
    fullName: '',
    email: '',
    merchantName: '',
    phoneNumber: '',
    address: '',
  });

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
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

  const handleRegistration = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setRegistrationMessage('');
    setIsSubmitting(true);
    try {
      const response = await registerMerchant(registration);
      setRegistrationMessage(response.message);
      setUsername(registration.username);
      setPassword('');
      setMode('login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng ký thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateRegistration = (field: keyof typeof registration, value: string) => {
    setRegistration(current => ({ ...current, [field]: value }));
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-400/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mb-4">
              <Volume2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-xl font-bold text-brown-900">Hệ thống thuyết minh tự động</h1>
            <p className="text-sm text-brown-400 mt-1">Phố cổ Hội An</p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 border border-primary-200">
              <Store className="w-3.5 h-3.5 text-primary-600" />
              <span className="text-xs font-medium text-primary-700">Cổng Chủ gian hàng</span>
            </div>
          </div>

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-brown-700 mb-1.5">Tên đăng nhập</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brown-400" />
                  <input
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={event => { setUsername(event.target.value); setError(''); }}
                    className={`${inputClass} pl-10`}
                    placeholder="ten.dang.nhap"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-brown-700 mb-1.5">Mật khẩu</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brown-400" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={event => { setPassword(event.target.value); setError(''); }}
                    className={`${inputClass} pl-10 pr-10`}
                    placeholder="Mật khẩu"
                    required
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-brown-400 hover:text-brown-600">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {registrationMessage && (
                <div role="status" className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  {registrationMessage}
                </div>
              )}

              {error && (
                <div role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-brown-600">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={event => setRemember(event.target.checked)}
                    className="rounded border-brown-300 text-primary-600 focus:ring-primary-400"
                  />
                  Ghi nhớ đăng nhập
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition-colors"
              >
                {isSubmitting ? 'Đang đăng nhập…' : 'Đăng nhập'} <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-center text-sm text-brown-500">
                Chưa có tài khoản?{' '}
                <button type="button" onClick={() => { setMode('register'); setError(''); setRegistrationMessage(''); }} className="font-semibold text-primary-600 hover:text-primary-700">
                  Đăng ký chủ gian hàng
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegistration} className="space-y-3">
              <h2 className="text-lg font-semibold text-brown-900">Đăng ký chủ gian hàng</h2>
              <p className="text-sm text-brown-500">Tài khoản chỉ đăng nhập được sau khi quản trị viên duyệt gian hàng.</p>

              <label className="block text-sm font-medium text-brown-700">
                Tên đăng nhập
                <input
                  value={registration.username}
                  onChange={event => updateRegistration('username', event.target.value)}
                  className={`${inputClass} mt-1`}
                  minLength={3}
                  maxLength={50}
                  autoComplete="username"
                  required
                />
              </label>

              <label className="block text-sm font-medium text-brown-700">
                Mật khẩu
                <input
                  type="password"
                  value={registration.password}
                  onChange={event => updateRegistration('password', event.target.value)}
                  className={`${inputClass} mt-1`}
                  minLength={8}
                  maxLength={72}
                  autoComplete="new-password"
                  required
                />
              </label>

              <label className="block text-sm font-medium text-brown-700">
                Họ và tên
                <input
                  value={registration.fullName}
                  onChange={event => updateRegistration('fullName', event.target.value)}
                  className={`${inputClass} mt-1`}
                  maxLength={100}
                  autoComplete="name"
                  required
                />
              </label>

              <label className="block text-sm font-medium text-brown-700">
                Email
                <input
                  type="email"
                  value={registration.email}
                  onChange={event => updateRegistration('email', event.target.value)}
                  className={`${inputClass} mt-1`}
                  maxLength={150}
                  autoComplete="email"
                  required
                />
              </label>

              <label className="block text-sm font-medium text-brown-700">
                Tên gian hàng
                <input
                  value={registration.merchantName}
                  onChange={event => updateRegistration('merchantName', event.target.value)}
                  className={`${inputClass} mt-1`}
                  maxLength={150}
                  required
                />
              </label>

              <label className="block text-sm font-medium text-brown-700">
                Số điện thoại (không bắt buộc)
                <input
                  type="tel"
                  value={registration.phoneNumber}
                  onChange={event => updateRegistration('phoneNumber', event.target.value)}
                  className={`${inputClass} mt-1`}
                  maxLength={20}
                  pattern="[0-9+()\\s-]{8,20}"
                  title="Nhập số điện thoại gồm 8-20 chữ số hoặc ký tự +()-"
                  autoComplete="tel"
                />
              </label>

              <label className="block text-sm font-medium text-brown-700">
                Địa chỉ (không bắt buộc)
                <input
                  value={registration.address}
                  onChange={event => updateRegistration('address', event.target.value)}
                  className={`${inputClass} mt-1`}
                  maxLength={255}
                  autoComplete="street-address"
                />
              </label>

              {error && (
                <div role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition-colors"
              >
                {isSubmitting ? 'Đang gửi đăng ký…' : 'Gửi đăng ký'} <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-center text-sm text-brown-500">
                Đã có tài khoản?{' '}
                <button type="button" onClick={() => { setMode('login'); setError(''); }} className="font-semibold text-primary-600 hover:text-primary-700">
                  Đăng nhập
                </button>
              </p>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-brown-300 mt-6">
          © 2026 Hệ thống thuyết minh tự động đa ngôn ngữ — Phố cổ Hội An
        </p>
      </div>
    </div>
  );
}
