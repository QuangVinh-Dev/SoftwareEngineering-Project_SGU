import { useState } from 'react';
import { User, Mail, Phone, Store, MapPin, Calendar, Edit2, Save, X } from 'lucide-react';
import Modal from '@/components/modals/Modal';
import { Button, Badge } from '@/components/ui';
import { useToast } from '@/components/toast/ToastProvider';
import { stallOwnerProfile as initialProfile } from '@/data/mockData';

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ProfileModal({ open, onClose }: ProfileModalProps) {
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState(initialProfile);

  const handleSave = () => {
    setEditing(false);
    showToast('success', 'Cập nhật thông tin tài khoản thành công.');
  };

  const initials = profile.name.split(' ').slice(-1)[0]?.charAt(0).toUpperCase() || 'CG';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tài khoản của tôi"
      size="md"
      footer={
        editing ? (
          <>
            <Button variant="secondary" onClick={() => { setEditing(false); setProfile(initialProfile); }} icon={<X className="w-4 h-4" />}>Hủy</Button>
            <Button onClick={handleSave} icon={<Save className="w-4 h-4" />}>Lưu thay đổi</Button>
          </>
        ) : (
          <Button onClick={() => setEditing(true)} icon={<Edit2 className="w-4 h-4" />}>Chỉnh sửa thông tin</Button>
        )
      }
    >
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {initials}
          </div>
          <div>
            <p className="text-lg font-bold text-brown-900">{profile.name}</p>
            <p className="text-sm text-brown-400">Chủ gian hàng</p>
            <div className="mt-1">
              <Badge variant={profile.accountStatus === 'approved' ? 'approved' : 'pending'}>
                {profile.accountStatus === 'approved' ? 'Đã duyệt' : 'Chờ duyệt'}
              </Badge>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {editing ? (
            <>
              <div>
                <label className="block text-sm font-medium text-brown-700 mb-1">Họ và tên</label>
                <input type="text" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-brown-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-brown-700 mb-1">Email</label>
                <input type="email" value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-brown-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-brown-700 mb-1">Số điện thoại</label>
                <input type="text" value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-brown-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-brown-700 mb-1">Tên gian hàng</label>
                <input type="text" value={profile.stallName} onChange={e => setProfile({ ...profile, stallName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-brown-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-brown-700 mb-1">Địa chỉ</label>
                <input type="text" value={profile.address} onChange={e => setProfile({ ...profile, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-brown-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100" />
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 p-3 bg-brown-50 rounded-lg">
                <User className="w-5 h-5 text-brown-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-brown-400">Họ và tên</p>
                  <p className="text-sm font-medium text-brown-800">{profile.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-brown-50 rounded-lg">
                <Mail className="w-5 h-5 text-brown-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-brown-400">Email</p>
                  <p className="text-sm font-medium text-brown-800">{profile.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-brown-50 rounded-lg">
                <Phone className="w-5 h-5 text-brown-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-brown-400">Số điện thoại</p>
                  <p className="text-sm font-medium text-brown-800">{profile.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-brown-50 rounded-lg">
                <Store className="w-5 h-5 text-brown-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-brown-400">Tên gian hàng</p>
                  <p className="text-sm font-medium text-brown-800">{profile.stallName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-brown-50 rounded-lg">
                <MapPin className="w-5 h-5 text-brown-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-brown-400">Địa chỉ</p>
                  <p className="text-sm font-medium text-brown-800">{profile.address}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-brown-50 rounded-lg">
                <Calendar className="w-5 h-5 text-brown-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-brown-400">Ngày tạo tài khoản</p>
                  <p className="text-sm font-medium text-brown-800">{profile.createdAt}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
