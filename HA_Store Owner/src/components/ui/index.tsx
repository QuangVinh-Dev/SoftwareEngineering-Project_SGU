import { type ReactNode } from 'react';
import { classNames } from '@/utils/helpers';

interface CardProps {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function Card({ children, className, noPadding }: CardProps) {
  return (
    <div className={classNames(
      'bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow',
      !noPadding && 'p-6',
      className
    )}>
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function CardHeader({ title, subtitle, action }: CardHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="text-base font-bold text-slate-800">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

interface BadgeProps {
  children: ReactNode;
  variant?: 'active' | 'inactive' | 'enabled' | 'disabled' | 'completed' | 'partial' | 'skipped' | 'approved' | 'pending' | 'rejected' | 'default';
  className?: string;
}

const badgeVariants = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  enabled: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  partial: 'bg-amber-50 text-amber-700 border-amber-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  skipped: 'bg-rose-50 text-rose-700 border-rose-200',
  inactive: 'bg-slate-100 text-slate-600 border-slate-200',
  disabled: 'bg-slate-100 text-slate-600 border-slate-200',
  default: 'bg-[#f0f8f9] text-[#286b7b] border-[#286b7b]/20',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={classNames(
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border',
      badgeVariants[variant],
      className
    )}>
      {children}
    </span>
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  icon,
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-[#286b7b] text-white hover:bg-[#205764] focus:ring-[#286b7b]/30 shadow-sm active:bg-[#1a4752]',
    secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 focus:ring-slate-200 shadow-sm active:bg-slate-100',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500 shadow-sm active:bg-rose-800',
    ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-200',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2.5',
  };

  return (
    <button
      className={classNames(base, variants[variant], sizes[size], className)}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
