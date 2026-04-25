import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/60 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'border-blue-300/28 bg-linear-to-b from-[#2f6dff] to-[#2358da] text-white shadow-[0_10px_24px_rgba(47,109,255,0.28)] hover:brightness-105',
        secondary:
          'border-white/10 bg-white/[0.035] text-white hover:border-white/18 hover:bg-white/[0.07]',
        ghost:
          'border-transparent bg-transparent text-[var(--text-soft)] hover:border-white/8 hover:bg-white/[0.05] hover:text-white',
        danger:
          'border-rose-300/18 bg-rose-500/12 text-rose-100 hover:border-rose-300/38 hover:bg-rose-500/18'
      },
      size: {
        sm: 'min-h-8 px-2.5 py-1.5 text-xs',
        md: 'min-h-9 px-3 py-2 text-sm',
        lg: 'min-h-10 px-3.5 py-2.5 text-sm'
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
