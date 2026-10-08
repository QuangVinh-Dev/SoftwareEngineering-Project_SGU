import { Edit, Plus, Download, Shield, Pause, LogIn, Languages, ArrowRight } from 'lucide-react';
import Modal from '@/components/modals/Modal';
import { Button } from '@/components/ui';
import { activityLogs } from '@/data/mockData';

interface RecentActivityModalProps {
  open: boolean;
  onClose: () => void;
}

const iconMap: Record<string, typeof Edit> = {
  edit: Edit, plus: Plus, download: Download, shield: Shield, pause: Pause, login: LogIn, languages: Languages,
};

const iconColors: Record<string, string> = {
  edit: 'bg-primary-100 text-primary-600',
  plus: 'bg-green-100 text-green-600',
  download: 'bg-blue-100 text-blue-600',
  shield: 'bg-brown-200 text-brown-600',
  pause: 'bg-orange-100 text-orange-600',
  login: 'bg-blue-100 text-blue-600',
  languages: 'bg-gold-100 text-gold-600',
};

export default function RecentActivityModal({ open, onClose }: RecentActivityModalProps) {
  const allActivities = [
    ...activityLogs,
    { id: 8, time: 'Yesterday', action: 'Created audio content: Chùa Cầu — Korean', icon: 'plus' },
    { id: 9, time: 'Yesterday', action: 'Updated TTS voice: en-US-AriaNeural', icon: 'edit' },
    { id: 10, time: '2 days ago', action: 'Deleted audio: French — Chùa Cầu', icon: 'pause' },
    { id: 11, time: '2 days ago', action: 'Added POI: Chùa Pháp Bảo', icon: 'plus' },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Hoạt động gần đây"
      size="md"
      footer={<Button variant="secondary" onClick={onClose}>Close</Button>}
    >
      <div className="space-y-1">
        {allActivities.map(log => {
          const Icon = iconMap[log.icon] || Edit;
          return (
            <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-brown-50 transition-colors">
              <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${iconColors[log.icon] || 'bg-brown-100 text-brown-500'}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-brown-800">{log.action}</p>
                <p className="text-xs text-brown-400 mt-0.5">{log.time}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 pt-4 border-t border-brown-100 text-center">
        <Button variant="ghost" size="sm" icon={<ArrowRight className="w-3.5 h-3.5" />}>View All Activity</Button>
      </div>
    </Modal>
  );
}
