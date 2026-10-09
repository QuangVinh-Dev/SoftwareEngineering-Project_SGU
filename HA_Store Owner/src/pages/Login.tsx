import { useState } from 'react';
import { Volume2, Mail, Lock, Eye, EyeOff, ArrowRight, Store } from 'lucide-react';
import { useApp } from '@/hooks/useApp';

export default function Login() {
  const { setIsLoggedIn } = useApp();
  const [email, setEmail] = useState('an@hoianaudioguide.vn');
  const [password, setPassword] = useState('an123');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'an@hoianaudioguide.vn' && password === 'an123') {
      setIsLoggedIn(true);
    } else {
      setError('Thông tin đăng nhập không đúng. Vui lòng dùng an@hoianaudioguide.vn / an123');
    }
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-brown-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brown-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-brown-200 text-sm text-brown-800 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                  placeholder="email@example.com"
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
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-brown-200 text-sm text-brown-800 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                  placeholder="••••••••"
                  required
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-brown-400 hover:text-brown-600">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-brown-600">
                <input type="checkbox" defaultChecked className="rounded border-brown-300 text-primary-600 focus:ring-primary-400" />
                Ghi nhớ đăng nhập
              </label>
              <button type="button" className="text-primary-600 hover:text-primary-700 font-medium">Quên mật khẩu?</button>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 rounded-lg transition-colors"
            >
              Đăng nhập <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-brown-400">
            <p>Tài khoản demo đã được điền sẵn. Nhấn "Đăng nhập" để tiếp tục.</p>
          </div>
        </div>

        <p className="text-center text-xs text-brown-300 mt-6">
          © 2026 Hệ thống thuyết minh tự động đa ngôn ngữ — Phố cổ Hội An
        </p>
      </div>
    </div>
  );
}
