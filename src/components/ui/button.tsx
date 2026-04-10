import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-[18px] border px-4 py-2.5 text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/60 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'border-sky-300/24 bg-linear-to-b from-blue-500 to-sky-500 text-white shadow-[0_18px_40px_rgba(78,140,255,0.28)] hover:border-sky-200/50 hover:brightness-105',
        secondary:
          'border-white/10 bg-white/[0.04] text-white hover:border-white/18 hover:bg-white/[0.08]',
        ghost:
          'border-transparent bg-transparent text-[var(--text-soft)] hover:border-white/10 hover:bg-white/[0.05] hover:text-white',
        danger:
          'border-rose-300/18 bg-rose-500/12 text-rose-100 hover:border-rose-300/38 hover:bg-rose-500/18'
      },
      size: {
        sm: 'min-h-9 px-3 py-2 text-xs',
        md: 'min-h-11 px-4 py-2.5 text-sm',
        lg: 'min-h-12 px-5 py-3 text-sm'
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
