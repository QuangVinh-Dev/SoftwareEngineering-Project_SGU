import { TrendingUp, TrendingDown, type LucideIcon } from 'lucide-react';
import { classNames } from '@/utils/helpers';

interface KPICardProps {
  label: string;
  value: string;
  trend: string;
  trendUp: boolean;
  sublabel: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
}

export default function KPICard({ label, value, trend, trendUp, sublabel, icon: Icon, iconBg, iconColor }: KPICardProps) {
  return (
    <div className="bg-white rounded-xl border border-brown-100 shadow-card hover:shadow-card-hover transition-all p-5 group">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-brown-400 font-medium">{label}</p>
          <p className="text-3xl font-bold text-brown-900 mt-1">{value}</p>
        </div>
        <div className={classNames('w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110', iconBg)}>
          <Icon className={classNames('w-6 h-6', iconColor)} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={classNames(
          'inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full',
          trendUp ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
        )}>
          {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {trend}
        </span>
        <span className="text-xs text-brown-400">{sublabel}</span>
      </div>
    </div>
  );
}
