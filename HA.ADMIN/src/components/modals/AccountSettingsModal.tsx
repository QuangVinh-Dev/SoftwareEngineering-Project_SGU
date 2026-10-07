import { useState } from 'react';
import { Sun, Moon, Monitor, Bell, Mail, Volume2, Save } from 'lucide-react';
import Modal from '@/components/modals/Modal';
import { Button, Toggle } from '@/components/ui';
import { useToast } from '@/components/toast/ToastProvider';
import { useApp } from '@/hooks/useApp';
import { classNames } from '@/utils/helpers';

interface AccountSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AccountSettingsModal({ open, onClose }: AccountSettingsModalProps) {
  const { showToast } = useToast();
  const { theme, setTheme, language, setLanguage } = useApp();
  const [enableNotif, setEnableNotif] = useState(true);
  const [emailNotif, setEmailNotif] = useState(true);
  const [soundNotif, setSoundNotif] = useState(false);

  const handleSave = () => {
    showToast('success', 'Account settings saved successfully.');
    onClose();
  };

  const appearanceOptions = [
    { value: 'light' as const, label: 'Light', icon: Sun },
    { value: 'dark' as const, label: 'Dark', icon: Moon },
    { value: 'system' as const, label: 'System', icon: Monitor },
  ];

  const langOptions = [
    { value: 'vi' as const, label: 'Vietnamese' },
    { value: 'en' as const, label: 'English' },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Cài đặt tài khoản"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} icon={<Save className="w-4 h-4" />}>Save Changes</Button>
        </>
      }
    >
      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-semibold text-brown-800 mb-3">Appearance</h4>
          <div className="grid grid-cols-3 gap-3">
            {appearanceOptions.map(opt => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  onClick={() => setTheme(opt.value)}
                  className={classNames(
                    'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
                    theme === opt.value
                      ? 'border-primary-400 bg-primary-50 text-primary-700'
                      : 'border-brown-100 text-brown-500 hover:border-brown-200'
                  )}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-xs font-medium">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-brown-100 pt-5">
          <h4 className="text-sm font-semibold text-brown-800 mb-3">Language</h4>
          <div className="grid grid-cols-2 gap-3">
            {langOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setLanguage(opt.value)}
                className={classNames(
                  'flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all text-sm font-medium',
                  language === opt.value
                    ? 'border-primary-400 bg-primary-50 text-primary-700'
                    : 'border-brown-100 text-brown-500 hover:border-brown-200'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-brown-100 pt-5">
          <h4 className="text-sm font-semibold text-brown-800 mb-3">Notifications</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-brown-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-brown-400" />
                <div>
                  <p className="text-sm font-medium text-brown-800">Enable notifications</p>
                  <p className="text-xs text-brown-400">Receive in-app notifications</p>
                </div>
              </div>
              <Toggle checked={enableNotif} onChange={setEnableNotif} />
            </div>
            <div className="flex items-center justify-between p-3 bg-brown-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-brown-400" />
                <div>
                  <p className="text-sm font-medium text-brown-800">Email notifications</p>
                  <p className="text-xs text-brown-400">Get notified via email</p>
                </div>
              </div>
              <Toggle checked={emailNotif} onChange={setEmailNotif} />
            </div>
            <div className="flex items-center justify-between p-3 bg-brown-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Volume2 className="w-4 h-4 text-brown-400" />
                <div>
                  <p className="text-sm font-medium text-brown-800">Notification sound</p>
                  <p className="text-xs text-brown-400">Play sound on new notification</p>
                </div>
              </div>
              <Toggle checked={soundNotif} onChange={setSoundNotif} />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
