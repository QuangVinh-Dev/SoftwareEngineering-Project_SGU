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
      'bg-white rounded-xl border border-brown-100 shadow-card hover:shadow-card-hover transition-shadow',
      !noPadding && 'p-5',
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
        <h3 className="text-base font-semibold text-brown-900">{title}</h3>
        {subtitle && <p className="text-xs text-brown-400 mt-0.5">{subtitle}</p>}
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
  active: 'bg-green-50 text-green-700 border-green-200',
  enabled: 'bg-green-50 text-green-700 border-green-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  approved: 'bg-green-50 text-green-700 border-green-200',
  inactive: 'bg-brown-100 text-brown-500 border-brown-200',
  disabled: 'bg-brown-100 text-brown-500 border-brown-200',
  pending: 'bg-orange-50 text-orange-700 border-orange-200',
  partial: 'bg-orange-50 text-orange-700 border-orange-200',
  skipped: 'bg-red-50 text-red-600 border-red-200',
  rejected: 'bg-red-50 text-red-600 border-red-200',
  default: 'bg-brown-100 text-brown-600 border-brown-200',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={classNames(
      'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border',
      badgeVariants[variant],
      className
    )}>
      {children}
    </span>
  );
}

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  size?: 'sm' | 'md';
}

export function Toggle({ checked, onChange, size = 'md' }: ToggleProps) {
  const dims = size === 'sm' ? { w: 'w-9', h: 'h-5', k: 'w-4 h-4', t: 'translate-x-4' } : { w: 'w-11', h: 'h-6', k: 'w-5 h-5', t: 'translate-x-5' };
  return (
    <button
      onClick={() => onChange(!checked)}
      className={classNames(
        'relative inline-flex items-center rounded-full transition-colors flex-shrink-0',
        dims.w, dims.h,
        checked ? 'bg-primary-600' : 'bg-brown-200'
      )}
    >
      <span className={classNames(
        'inline-block bg-white rounded-full shadow transition-transform',
        dims.k,
        checked ? `${dims.t}` : 'translate-x-0.5'
      )} />
    </button>
  );
}

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit';
  icon?: ReactNode;
}

export function Button({ children, onClick, variant = 'primary', size = 'md', disabled, className, type = 'button', icon }: ButtonProps) {
  const variants = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white border-transparent',
    secondary: 'bg-white hover:bg-brown-50 text-primary-700 border-brown-200',
    danger: 'bg-red-600 hover:bg-red-700 text-white border-transparent',
    ghost: 'bg-transparent hover:bg-brown-50 text-brown-600 border-transparent',
    success: 'bg-green-600 hover:bg-green-700 text-white border-transparent',
  };
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-5 py-2.5 text-sm' };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classNames(
        'inline-flex items-center gap-2 rounded-lg font-medium border transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant], sizes[size], className
      )}
    >
      {icon}
      {children}
    </button>
  );
}
