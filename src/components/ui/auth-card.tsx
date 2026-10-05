import type { ReactNode } from 'react';
import { Logo } from '../Logo';

type AuthCardProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthCard({ eyebrow, title, description, children, footer }: AuthCardProps) {
  return (
    <div className="mx-auto w-full max-w-lg rounded-[24px] border-2 border-[#CFEFE6] bg-white p-6 shadow-[0_18px_50px_rgba(11,59,60,0.08)] sm:p-8">
      <div className="mb-4 flex justify-center">
        <Logo variant="mark" size={48} />
      </div>
      <p className="text-center text-xs font-bold uppercase tracking-[0.22em] text-[#0B3B3C]/60">{eyebrow}</p>
      <h1 className="mt-2 text-center font-display text-[28px] font-extrabold tracking-tight text-[#0B3B3C]" style={{ fontFamily: '"Baloo 2", cursive' }}>
        {title}
      </h1>
      <p className="mt-2 text-center text-sm leading-6 text-[#0B3B3C]/70" style={{ fontFamily: 'Figtree, sans-serif' }}>
        {description}
      </p>
      <div className="mt-6">{children}</div>
      {footer ? <div className="mt-6 border-t-2 border-[#CFEFE6] pt-5">{footer}</div> : null}
    </div>
  );
}
