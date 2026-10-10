import { useState } from 'react';
import { User, Mail, Phone, Shield, Calendar, Edit2, Save, X } from 'lucide-react';
import Modal from '@/components/modals/Modal';
import { Button } from '@/components/ui';
import { useToast } from '@/components/toast/ToastProvider';
import { adminProfile } from '@/data/mockData';

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ProfileModal({ open, onClose }: ProfileModalProps) {
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState(adminProfile);

  const handleSave = () => {
    setEditing(false);
    showToast('success', 'Profile updated successfully.');
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Hồ sơ cá nhân"
      size="md"
      footer={
        editing ? (
          <>
            <Button variant="secondary" onClick={() => { setEditing(false); setProfile(adminProfile); }} icon={<X className="w-4 h-4" />}>Cancel</Button>
            <Button onClick={handleSave} icon={<Save className="w-4 h-4" />}>Save</Button>
          </>
        ) : (
          <Button onClick={() => setEditing(true)} icon={<Edit2 className="w-4 h-4" />}>Edit Profile</Button>
        )
      }
    >
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            AD
          </div>
          <div>
            <p className="text-lg font-bold text-brown-900">{profile.name}</p>
            <p className="text-sm text-brown-400">{profile.role}</p>
          </div>
        </div>

        <div className="space-y-3">
          {editing ? (
            <>
              <div>
                <label className="block text-sm font-medium text-brown-700 mb-1">Full Name</label>
                <input type="text" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-brown-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-brown-700 mb-1">Email</label>
                <input type="email" value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-brown-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-brown-700 mb-1">Phone</label>
                <input type="text" value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-brown-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100" />
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 p-3 bg-brown-50 rounded-lg">
                <User className="w-5 h-5 text-brown-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-brown-400">Họ tên</p>
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
                <Shield className="w-5 h-5 text-brown-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-brown-400">Vai trò</p>
                  <p className="text-sm font-medium text-brown-800">{profile.role}</p>
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
