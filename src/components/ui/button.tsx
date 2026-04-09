import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/60 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'border-sky-300/30 bg-linear-to-b from-sky-400/28 to-sky-500/14 text-white shadow-[0_10px_30px_rgba(87,187,255,0.18)] hover:border-sky-300/50 hover:from-sky-400/34 hover:to-sky-500/20',
        secondary:
          'border-white/10 bg-white/3 text-white hover:border-white/20 hover:bg-white/5',
        ghost:
          'border-transparent bg-transparent text-[var(--text-soft)] hover:border-white/10 hover:bg-white/5 hover:text-white',
        danger:
          'border-rose-300/20 bg-rose-500/10 text-rose-100 hover:border-rose-300/40 hover:bg-rose-500/16'
      },
      size: {
        sm: 'px-3 py-2 text-xs',
        md: 'px-4 py-2.5 text-sm',
        lg: 'px-5 py-3 text-sm'
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md'
    }
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, ...props },
  ref
) {
  return <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
});
