import { useState } from 'react';
import { Volume2, Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import { apiMessage, login } from '@/services/authApi';

export default function Login() {
  const { signIn } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const response = await login(username, password);
      if (response.user.accountType !== 'ADMIN' || response.user.role !== 'ADMIN') {
        throw new Error('Tài khoản này không có quyền truy cập cổng quản trị.');
      }
      signIn(response.accessToken, response.user);
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f0f3f6] relative overflow-hidden">
      {/* Background Decorative Gradient Orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#183a54]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#286b7b]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden">
          {/* Header Banner */}
          <div className="bg-[#183a54] p-8 text-center relative">
            <div className="inline-flex w-14 h-14 rounded-2xl bg-[#286b7b] items-center justify-center mb-3 shadow-md border border-white/10">
              <Volume2 className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">HỘI AN HERITAGE</h1>
            <p className="text-xs text-[#a4db77] font-bold uppercase tracking-wider mt-1">Cổng Quản Trị Hệ Thống</p>
          </div>

          {/* Form Section */}
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Tài khoản Quản trị
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={e => { setUsername(e.target.value); setError(''); }}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:border-[#286b7b] focus:ring-4 focus:ring-[#286b7b]/10 transition-all bg-slate-50/50"
                    placeholder="admin"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); }}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:border-[#286b7b] focus:ring-4 focus:ring-[#286b7b]/10 transition-all bg-slate-50/50"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5 leading-relaxed font-medium">
                  {error}
                </div>
              )}

              <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-[#286b7b]" />
                <span>Phiên làm việc được bảo mật và mã hóa JWT</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 flex items-center justify-center gap-2 bg-[#286b7b] hover:bg-[#205764] text-white font-bold py-3 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-60"
              >
                {isSubmitting ? 'Đang xác thực…' : 'Đăng nhập Quản trị viên'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
