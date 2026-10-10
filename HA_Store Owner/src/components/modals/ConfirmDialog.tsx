import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  variant = 'danger',
}: ConfirmDialogProps) {
  const confirmColor = variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : variant === 'warning' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-primary-600 hover:bg-primary-700';
  const iconColor = variant === 'danger' ? 'text-red-500' : variant === 'warning' ? 'text-orange-500' : 'text-blue-500';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-brown-600 hover:bg-brown-50 transition-colors border border-brown-200">
            {cancelLabel}
          </button>
          <button onClick={() => { onConfirm(); onClose(); }} className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors ${confirmColor}`}>
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex gap-4">
        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${variant === 'danger' ? 'bg-red-50' : variant === 'warning' ? 'bg-orange-50' : 'bg-blue-50'}`}>
          <AlertTriangle className={`w-6 h-6 ${iconColor}`} />
        </div>
        <p className="text-sm text-brown-700 pt-3">{message}</p>
      </div>
    </Modal>
  );
}
