import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@lib/utils';

export function Field({
  label,
  hint,
  error,
  children,
  className = ''
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn('grid min-w-0 gap-2 text-sm text-soft', className)}>
      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">{label}</span>
      {children}
      {error ? <span className="text-xs leading-5 text-rose-200">{error}</span> : hint ? <span className="text-xs leading-5 text-muted">{hint}</span> : null}
    </label>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'min-h-12 w-full min-w-0 rounded-[18px] border border-white/10 bg-slate-950/55 px-4 text-sm text-white outline-none transition placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60 focus:border-sky-300/35 focus:bg-slate-950/75 focus:ring-2 focus:ring-sky-300/10',
        className
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'min-h-28 w-full min-w-0 resize-y rounded-[18px] border border-white/10 bg-slate-950/55 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60 focus:border-sky-300/35 focus:bg-slate-950/75 focus:ring-2 focus:ring-sky-300/10',
        className
      )}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'min-h-12 w-full min-w-0 rounded-[18px] border border-white/10 bg-slate-950/55 px-4 text-sm text-white outline-none transition disabled:cursor-not-allowed disabled:opacity-60 focus:border-sky-300/35 focus:bg-slate-950/75 focus:ring-2 focus:ring-sky-300/10',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
