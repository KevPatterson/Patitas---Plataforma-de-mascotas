import type { TextareaHTMLAttributes } from 'react';

type TextareaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: string;
  error?: string;
};

export function TextareaField({ label, hint, error, id, className = '', ...props }: TextareaFieldProps) {
  const fieldId = id ?? props.name;

  return (
    <label className="block space-y-2 text-sm font-semibold text-[#0B3B3C] dark:text-[#F5FBF9]" htmlFor={fieldId}>
      <span className="flex items-center justify-between gap-4">
        <span style={{ fontFamily: 'Figtree, sans-serif' }}>{label}</span>
        {hint ? <span className="text-xs font-medium text-[#0B3B3C]/60 dark:text-[#F5FBF9]/60">{hint}</span> : null}
      </span>
      <textarea
        id={fieldId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        className={`min-h-32 w-full rounded-[16px] border-2 border-[#CFEFE6] bg-white px-4 py-3 text-base text-[#0B3B3C] shadow-sm outline-none transition placeholder:text-[#0B3B3C]/50 focus:border-[#FF6B35] focus:ring-4 focus:ring-[#FF6B35]/20 dark:border-white/15 dark:bg-white/95 ${className}`}
        style={{ fontFamily: 'Figtree, sans-serif' }}
        {...props}
      />
      {hint && !error ? (
        <span id={`${fieldId}-hint`} className="block text-xs font-medium text-[#0B3B3C]/60 dark:text-[#F5FBF9]/60">
          {hint}
        </span>
      ) : null}
      {error ? (
        <span id={`${fieldId}-error`} className="block text-sm font-medium text-[#C2332C]">
          {error}
        </span>
      ) : null}
    </label>
  );
}
