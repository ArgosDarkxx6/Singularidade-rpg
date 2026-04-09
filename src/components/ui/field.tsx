import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@lib/utils';

export function Field({ label, hint, children, className = '' }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn('grid gap-2 text-sm text-soft', className)}>
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{label}</span>
      {children}
      {hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'min-h-11 rounded-2xl border border-white/10 bg-slate-950/45 px-4 text-sm text-white outline-none transition placeholder:text-slate-400 focus:border-sky-300/40 focus:bg-slate-950/65',
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
        'min-h-28 rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-400 focus:border-sky-300/40 focus:bg-slate-950/65',
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
        'min-h-11 rounded-2xl border border-white/10 bg-slate-950/45 px-4 text-sm text-white outline-none transition focus:border-sky-300/40 focus:bg-slate-950/65',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
