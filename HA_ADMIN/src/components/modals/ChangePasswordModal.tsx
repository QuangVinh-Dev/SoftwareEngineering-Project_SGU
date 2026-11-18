import { useState } from 'react';
import { Lock, Eye, EyeOff, Check } from 'lucide-react';
import Modal from '@/components/modals/Modal';
import { Button } from '@/components/ui';
import { useToast } from '@/components/toast/ToastProvider';

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ open, onClose }: ChangePasswordModalProps) {
  const { showToast } = useToast();
  const [current, setCurrent] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<{ current?: string; newPass?: string; confirm?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!current.trim()) e.current = 'Current password is required.';
    if (newPass.length < 6) e.newPass = 'New password must be at least 6 characters.';
    if (confirm !== newPass) e.confirm = 'Passwords do not match.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    showToast('success', 'Password changed successfully.');
    setCurrent(''); setNewPass(''); setConfirm('');
    setErrors({});
    onClose();
  };

  const handleClose = () => {
    setCurrent(''); setNewPass(''); setConfirm('');
    setErrors({});
    onClose();
  };

  const passFields = [
    { label: 'Current Password', value: current, onChange: setCurrent, show: showCurrent, toggle: setShowCurrent, error: errors.current, placeholder: 'Enter current password' },
    { label: 'New Password', value: newPass, onChange: setNewPass, show: showNew, toggle: setShowNew, error: errors.newPass, placeholder: 'Enter new password' },
    { label: 'Confirm New Password', value: confirm, onChange: setConfirm, show: showConfirm, toggle: setShowConfirm, error: errors.confirm, placeholder: 'Re-enter new password' },
  ];

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Đổi mật khẩu"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Change Password</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 bg-brown-50 rounded-lg">
          <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
            <Lock className="w-5 h-5 text-primary-600" />
          </div>
          <p className="text-xs text-brown-500">Enter your current password and a new password to update your credentials.</p>
        </div>

        {passFields.map((f, i) => (
          <div key={i}>
            <label className="block text-sm font-medium text-brown-700 mb-1">{f.label}</label>
            <div className="relative">
              <input
                type={f.show ? 'text' : 'password'}
                value={f.value}
                onChange={e => { f.onChange(e.target.value); setErrors({ ...errors, [i === 0 ? 'current' : i === 1 ? 'newPass' : 'confirm']: undefined }); }}
                placeholder={f.placeholder}
                className={`w-full px-3 py-2 pr-10 rounded-lg border text-sm outline-none focus:ring-2 transition-all ${
                  f.error ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-brown-200 focus:border-primary-400 focus:ring-primary-100'
                }`}
              />
              <button
                type="button"
                onClick={() => f.toggle(!f.show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brown-400 hover:text-brown-600"
              >
                {f.show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {f.error && <p className="text-xs text-red-500 mt-1">{f.error}</p>}
          </div>
        ))}

        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
          <Check className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-600">New password must be at least 6 characters long.</p>
        </div>
      </div>
    </Modal>
  );
}
