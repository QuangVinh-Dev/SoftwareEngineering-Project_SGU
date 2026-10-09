import { useState } from 'react';
import { User, Mail, Phone, Store, MapPin, Calendar, Edit2, Save, X, Shield } from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui';
import { useToast } from '@/components/toast/ToastProvider';
import { stallOwnerProfile as initialProfile, activityLogs } from '@/data/mockData';

const activityIconMap: Record<string, string> = {
  edit: 'Cập nhật',
  plus: 'Thêm mới',
  check: 'Duyệt',
  login: 'Đăng nhập',
  pause: 'Tạm dừng',
  x: 'Từ chối',
  download: 'Xuất',
  shield: 'Bảo mật',
};

export default function Account() {
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState(initialProfile);

  const handleSave = () => {
    if (!profile.name.trim() || !profile.email.trim() || !profile.stallName.trim()) {
      showToast('error', 'Vui lòng điền đầy đủ họ tên, email và tên gian hàng.');
      return;
    }
    setEditing(false);
    showToast('success', 'Cập nhật thông tin tài khoản thành công.');
  };

  const set = (k: string, v: string) => setProfile({ ...profile, [k]: v });
  const initials = profile.name.split(' ').slice(-1)[0]?.charAt(0).toUpperCase() || 'CG';
  const inputCls = 'w-full px-3 py-2 rounded-lg border border-brown-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brown-900">Tài khoản của tôi</h1>
        <p className="text-sm text-brown-400 mt-1">Quản lý thông tin tài khoản chủ gian hàng.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-2xl font-bold mb-4">
              {initials}
            </div>
            <p className="text-lg font-bold text-brown-900">{profile.name}</p>
            <p className="text-sm text-brown-400">{profile.stallName}</p>
            <div className="mt-2">
              <Badge variant={profile.accountStatus === 'approved' ? 'approved' : 'pending'}>
                {profile.accountStatus === 'approved' ? 'Đã duyệt' : 'Chờ duyệt'}
              </Badge>
            </div>
            <div className="w-full mt-6 pt-4 border-t border-brown-100 space-y-2">
              <div className="flex items-center gap-2 text-sm text-brown-500">
                <Mail className="w-4 h-4 text-brown-400" />
                <span className="truncate">{profile.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-brown-500">
                <Phone className="w-4 h-4 text-brown-400" />
                <span>{profile.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-brown-500">
                <Calendar className="w-4 h-4 text-brown-400" />
                <span>Tham gia: {profile.createdAt}</span>
              </div>
            </div>
          </div>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-brown-900">Thông tin tài khoản</h3>
              {editing ? (
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => { setEditing(false); setProfile(initialProfile); }} icon={<X className="w-3.5 h-3.5" />}>Hủy</Button>
                  <Button size="sm" onClick={handleSave} icon={<Save className="w-3.5 h-3.5" />}>Lưu thay đổi</Button>
                </div>
              ) : (
                <Button variant="secondary" size="sm" onClick={() => setEditing(true)} icon={<Edit2 className="w-3.5 h-3.5" />}>Chỉnh sửa</Button>
              )}
            </div>

            {editing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-brown-700 mb-1">Họ và tên <span className="text-red-500">*</span></label>
                    <input type="text" value={profile.name} onChange={e => set('name', e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brown-700 mb-1">Email <span className="text-red-500">*</span></label>
                    <input type="email" value={profile.email} onChange={e => set('email', e.target.value)} className={inputCls} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-brown-700 mb-1">Số điện thoại</label>
                    <input type="text" value={profile.phone} onChange={e => set('phone', e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brown-700 mb-1">Tên gian hàng <span className="text-red-500">*</span></label>
                    <input type="text" value={profile.stallName} onChange={e => set('stallName', e.target.value)} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-brown-700 mb-1">Địa chỉ gian hàng</label>
                  <input type="text" value={profile.address} onChange={e => set('address', e.target.value)} className={inputCls} />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-brown-50 rounded-lg">
                  <User className="w-5 h-5 text-brown-400 flex-shrink-0" />
                  <div className="flex-1"><p className="text-xs text-brown-400">Họ và tên</p><p className="text-sm font-medium text-brown-800">{profile.name}</p></div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-brown-50 rounded-lg">
                  <Mail className="w-5 h-5 text-brown-400 flex-shrink-0" />
                  <div className="flex-1"><p className="text-xs text-brown-400">Email</p><p className="text-sm font-medium text-brown-800">{profile.email}</p></div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-brown-50 rounded-lg">
                  <Phone className="w-5 h-5 text-brown-400 flex-shrink-0" />
                  <div className="flex-1"><p className="text-xs text-brown-400">Số điện thoại</p><p className="text-sm font-medium text-brown-800">{profile.phone}</p></div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-brown-50 rounded-lg">
                  <Store className="w-5 h-5 text-brown-400 flex-shrink-0" />
                  <div className="flex-1"><p className="text-xs text-brown-400">Tên gian hàng</p><p className="text-sm font-medium text-brown-800">{profile.stallName}</p></div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-brown-50 rounded-lg">
                  <MapPin className="w-5 h-5 text-brown-400 flex-shrink-0" />
                  <div className="flex-1"><p className="text-xs text-brown-400">Địa chỉ gian hàng</p><p className="text-sm font-medium text-brown-800">{profile.address}</p></div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-brown-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-brown-400 flex-shrink-0" />
                  <div className="flex-1"><p className="text-xs text-brown-400">Ngày tạo tài khoản</p><p className="text-sm font-medium text-brown-800">{profile.createdAt}</p></div>
                </div>
              </div>
            )}
          </Card>

          <Card>
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5 text-primary-600" />
              <h3 className="text-base font-semibold text-brown-900">Bảo mật tài khoản</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-brown-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-brown-800">Mật khẩu</p>
                  <p className="text-xs text-brown-400">Đổi mật khẩu định kỳ để bảo mật tài khoản</p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => showToast('info', 'Chức năng đổi mật khẩu sẽ được mở soon.')}>Đổi mật khẩu</Button>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-base font-semibold text-brown-900 mb-4">Hoạt động gần đây</h3>
            <div className="space-y-3">
              {activityLogs.map(log => (
                <div key={log.id} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-brown-50 flex items-center justify-center">
                    <span className="text-xs font-medium text-brown-500">{activityIconMap[log.icon]?.charAt(0) || '•'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-brown-800 truncate">{log.action}</p>
                    <p className="text-xs text-brown-400 mt-0.5">{log.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
