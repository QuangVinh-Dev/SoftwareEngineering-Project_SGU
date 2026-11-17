import { useState } from 'react';
import {
  User, Mail, Store, MapPin, Calendar, Edit2, Save, X,
  Shield, LogOut, CheckCircle2, Phone, AlertCircle
} from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui';
import { useToast } from '@/components/toast/ToastProvider';
import { useApp } from '@/hooks/useApp';

export default function Account() {
  const { showToast } = useToast();
  const { authUser, signOut } = useApp();
  const [editing, setEditing] = useState(false);

  // Editable fields
  const [profile, setProfile] = useState({
    name: authUser?.fullName || 'Chủ gian hàng Hội An',
    email: authUser?.email || 'merchant@hoianheritage.vn',
    stallName: authUser?.stallName || 'Gian hàng Phố Cổ',
    phone: '0905 123 456',
    address: 'Trần Phú, Phường Minh An, TP. Hội An',
  });

  const handleSave = () => {
    if (!profile.name.trim() || !profile.email.trim() || !profile.stallName.trim()) {
      showToast('error', 'Vui lòng điền đầy đủ họ tên, email và tên gian hàng.');
      return;
    }
    setEditing(false);
    showToast('success', 'Đã lưu thay đổi thông tin gian hàng!');
  };

  const initials = profile.name
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map(w => w[0]?.toUpperCase())
    .join('') || 'GH';

  const inputCls =
    'w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#7c3aed] focus:bg-white focus:ring-4 focus:ring-purple-100 transition-all';

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Hồ sơ gian hàng</h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý thông tin tài khoản chủ gian hàng và thiết lập bảo mật.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={signOut}
          icon={<LogOut className="w-4 h-4 text-red-500" />}
        >
          Đăng xuất
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Card: Profile Overview */}
        <Card>
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#7c3aed] to-[#9333ea] flex items-center justify-center text-white text-2xl font-extrabold shadow-lg shadow-purple-900/20 mb-4 border-2 border-purple-300/40">
              {initials}
            </div>
            <p className="text-lg font-bold text-slate-900">{profile.name}</p>
            <p className="text-xs font-semibold text-[#7c3aed] mt-0.5">{profile.stallName}</p>
            <div className="mt-3">
              <Badge variant="active">Chủ gian hàng chính thức</Badge>
            </div>

            <div className="w-full mt-6 pt-5 border-t border-slate-100 space-y-3 text-left">
              <div className="flex items-center gap-3 text-xs text-slate-600">
                <Mail className="w-4 h-4 text-[#7c3aed] flex-shrink-0" />
                <span className="truncate">{profile.email}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-600">
                <Phone className="w-4 h-4 text-[#7c3aed] flex-shrink-0" />
                <span>{profile.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-600">
                <MapPin className="w-4 h-4 text-[#7c3aed] flex-shrink-0" />
                <span className="truncate">{profile.address}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-600">
                <Calendar className="w-4 h-4 text-[#7c3aed] flex-shrink-0" />
                <span>Vai trò: MERCHANT (Hội An Heritage)</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Right Area: Detailed Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Thông tin chi tiết</h3>
                <p className="text-xs text-slate-400 mt-0.5">Dữ liệu hồ sơ đăng ký kinh doanh</p>
              </div>
              {editing ? (
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setEditing(false)}
                    icon={<X className="w-3.5 h-3.5" />}
                  >
                    Hủy
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    icon={<Save className="w-3.5 h-3.5" />}
                  >
                    Lưu thay đổi
                  </Button>
                </div>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditing(true)}
                  icon={<Edit2 className="w-3.5 h-3.5 text-[#7c3aed]" />}
                >
                  Chỉnh sửa
                </Button>
              )}
            </div>

            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Họ và tên người đại diện <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    disabled={!editing}
                    value={profile.name}
                    onChange={e => setProfile({ ...profile, name: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Địa chỉ Email liên hệ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    disabled={!editing}
                    value={profile.email}
                    onChange={e => setProfile({ ...profile, email: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Tên gian hàng / Doanh nghiệp <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    disabled={!editing}
                    value={profile.stallName}
                    onChange={e => setProfile({ ...profile, stallName: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Số điện thoại liên hệ
                  </label>
                  <input
                    type="text"
                    disabled={!editing}
                    value={profile.phone}
                    onChange={e => setProfile({ ...profile, phone: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Địa chỉ gian hàng tại Phố Cổ Hội An
                </label>
                <input
                  type="text"
                  disabled={!editing}
                  value={profile.address}
                  onChange={e => setProfile({ ...profile, address: e.target.value })}
                  className={inputCls}
                />
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-600" />
                Tài khoản đã được bảo mật 2 lớp
              </span>
              <span>Phiên bản v2.0 - Hội An Heritage</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
