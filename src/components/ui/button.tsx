import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type CommonProps = {
  variant?: ButtonVariant;
  children: ReactNode;
};

type ButtonProps = CommonProps & ButtonHTMLAttributes<HTMLButtonElement>;
type LinkButtonProps = CommonProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

const baseClasses =
  'inline-flex items-center justify-center gap-2 rounded-[20px] px-6 text-sm font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'min-h-[44px] bg-[#FF6B35] text-[#0B3B3C] shadow-sm hover:brightness-95 active:brightness-90',
  secondary: 'min-h-[44px] bg-[#CFEFE6] text-[#0B3B3C] border-2 border-[#CFEFE6] hover:bg-[#bfe9dd]',
  ghost: 'min-h-[44px] bg-transparent text-[#0B3B3C] hover:bg-[#0B3B3C]/5 dark:text-[#F5FBF9] dark:hover:bg-white/10',
};

export function Button({ variant = 'primary', children, className = '', style, ...props }: ButtonProps) {
  return (
    <button
      className={[baseClasses, variantClasses[variant], className].join(' ')}
      style={{ fontFamily: '"Baloo 2", cursive', ...style }}
      {...props}
    >
      {children}
    </button>
  );
}

export function LinkButton({ variant = 'primary', children, className = '', style, ...props }: LinkButtonProps) {
  return (
    <a
      className={[baseClasses, variantClasses[variant], className].join(' ')}
      style={{ fontFamily: '"Baloo 2", cursive', ...style }}
      {...props}
    >
      {children}
    </a>
  );
}
