import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'adoption' | 'danger';

type CommonProps = {
  variant?: ButtonVariant;
  children: ReactNode;
  loading?: boolean;
};

type ButtonProps = CommonProps & ButtonHTMLAttributes<HTMLButtonElement>;
type LinkButtonProps = CommonProps & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'loading'> & { href: string };

const baseClasses =
  'inline-flex items-center justify-center gap-2 rounded-xl px-6 text-sm font-extrabold transition-all duration-base ease-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden';

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'min-h-11 bg-orange text-white shadow-md hover:shadow-lg hover:scale-[1.02] hover:bg-orange-dark active:scale-[0.98]',
  secondary: 'min-h-11 bg-turquoise text-white shadow-md hover:shadow-lg hover:scale-[1.02] hover:bg-turquoise-dark active:scale-[0.98]',
  adoption: 'min-h-11 bg-purple text-white shadow-md hover:shadow-lg hover:scale-[1.02] hover:bg-purple-dark active:scale-[0.98]',
  ghost: 'min-h-11 bg-navy/5 text-navy border-2 border-navy/10 hover:bg-navy/10 hover:border-navy/20 active:scale-[0.98]',
  danger: 'min-h-11 bg-lost text-white shadow-md hover:shadow-lg hover:scale-[1.02] hover:bg-lost-dark active:scale-[0.98]',
};

function LoadingDots() {
  return (
    <span className="flex gap-1">
      <span className="size-1.5 bg-current rounded-full animate-paw-pulse" style={{ animationDelay: '0ms' }} />
      <span className="size-1.5 bg-current rounded-full animate-paw-pulse" style={{ animationDelay: '150ms' }} />
      <span className="size-1.5 bg-current rounded-full animate-paw-pulse" style={{ animationDelay: '300ms' }} />
    </span>
  );
}

export function Button({ variant = 'primary', children, className = '', style, loading = false, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={[baseClasses, variantClasses[variant], className].join(' ')}
      style={{ fontFamily: '"Baloo 2", cursive', ...style }}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <LoadingDots />
          <span className="opacity-70">Cargando</span>
        </>
      ) : (
        children
      )}
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
