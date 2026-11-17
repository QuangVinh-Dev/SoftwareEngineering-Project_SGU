import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
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
  const confirmColor =
    variant === 'danger'
      ? 'bg-red-600 hover:bg-red-700 shadow-sm shadow-red-600/30'
      : variant === 'warning'
      ? 'bg-amber-600 hover:bg-amber-700 shadow-sm shadow-amber-600/30'
      : 'bg-[#7c3aed] hover:bg-[#6d28d9] shadow-sm shadow-purple-900/30';

  const iconBg =
    variant === 'danger'
      ? 'bg-red-50 text-red-600 border border-red-200'
      : variant === 'warning'
      ? 'bg-amber-50 text-amber-600 border border-amber-200'
      : 'bg-purple-50 text-[#7c3aed] border border-purple-200';

  const Icon = variant === 'danger' ? AlertTriangle : variant === 'warning' ? AlertCircle : Info;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors border border-slate-200"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-all ${confirmColor}`}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex gap-4 items-start py-1">
        <div className={`flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center ${iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
        <p className="text-xs text-slate-600 leading-relaxed pt-1.5">{message}</p>
      </div>
    </Modal>
  );
}
