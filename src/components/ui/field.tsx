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
    <label className={cn('grid min-w-0 gap-1.5 text-sm text-soft', className)}>
      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">{label}</span>
      {children}
      {error ? <span className="text-xs text-rose-200">{error}</span> : hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'min-h-9 w-full min-w-0 rounded-[9px] border border-white/12 bg-slate-950/58 px-3 text-sm text-white outline-none transition placeholder:text-slate-400 focus:border-sky-300/35 focus:bg-slate-950/78',
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
        'min-h-24 w-full min-w-0 rounded-[9px] border border-white/12 bg-slate-950/58 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-400 focus:border-sky-300/35 focus:bg-slate-950/78',
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
        'min-h-9 w-full min-w-0 rounded-[9px] border border-white/12 bg-slate-950/58 px-3 text-sm text-white outline-none transition focus:border-sky-300/35 focus:bg-slate-950/78',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
