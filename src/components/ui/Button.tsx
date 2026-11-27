import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'rose'
  | 'teal'
  | 'outline'
  | 'ghost'
  | 'destructive';

export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-[#795D96] text-white hover:bg-[#6A4F87] dark:bg-[#B18ACD] dark:text-[#17131F] dark:hover:bg-[#C3A1DC] shadow-sm',
  secondary:
    'bg-[#304A70] text-white hover:bg-[#273E5F] dark:bg-[#78A6E7] dark:text-[#152031] dark:hover:bg-[#91B8EE] shadow-sm',
  rose:
    'bg-[#9E6686] text-white hover:bg-[#8A5674] dark:bg-[#D99EBB] dark:text-[#23151D] dark:hover:bg-[#E4B3CB] shadow-sm',
  teal:
    'bg-[#3D7D70] text-white hover:bg-[#336A5F] dark:bg-[#76BBAA] dark:text-[#132421] dark:hover:bg-[#8EC9BA] shadow-sm',
  outline:
    'bg-transparent border border-[var(--border-medium)] text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]',
  ghost:
    'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]',
  destructive:
    'bg-[#B94A48] text-white hover:bg-[#A33E3C] dark:bg-[#DF6A68] dark:text-[#1F0E0E] dark:hover:bg-[#E88280] shadow-sm',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'min-h-[40px] px-3.5 py-2 text-xs font-medium rounded-[12px] gap-1.5',
  md: 'min-h-[44px] px-5 py-2.5 text-sm font-medium rounded-[14px] gap-2',
  lg: 'min-h-[48px] px-6 py-3 text-sm font-semibold rounded-[16px] gap-2.5',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  leftIcon,
  rightIcon,
  children,
  className = '',
  type = 'button',
  ...rest
}) => {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center whitespace-nowrap shrink-0 transition-all duration-150 ease-out active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B18ACD] disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...rest}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : leftIcon}
      <span>{children}</span>
      {!loading && rightIcon}
    </button>
  );
};

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: 'ghost' | 'surface' | 'lavender' | 'blue';
  size?: 'sm' | 'md';
}

const ICON_VARIANT_CLASSES: Record<NonNullable<IconButtonProps['variant']>, string> = {
  ghost:
    'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]',
  surface:
    'bg-[var(--surface-main)] text-[var(--text-primary)] border border-[var(--border-subtle)] hover:bg-[var(--surface-secondary)]',
  lavender:
    'bg-[var(--surface-lavender)] text-[var(--lavender-strong)] hover:opacity-90',
  blue:
    'bg-[var(--surface-blue)] text-[var(--blue-strong)] hover:opacity-90',
};

export const IconButton: React.FC<IconButtonProps> = ({
  label,
  variant = 'ghost',
  size = 'md',
  children,
  className = '',
  type = 'button',
  ...rest
}) => {
  const sizeClass = size === 'sm' ? 'min-h-[40px] min-w-[40px] rounded-[12px]' : 'min-h-[44px] min-w-[44px] rounded-[14px]';
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center shrink-0 transition-all duration-150 active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B18ACD] disabled:opacity-40 cursor-pointer ${sizeClass} ${ICON_VARIANT_CLASSES[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
};
