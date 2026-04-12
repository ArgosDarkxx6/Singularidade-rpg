import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '@lib/utils';

const toneStyles = {
  default: 'border-white/15 bg-white/[0.03]',
  info: 'border-sky-300/18 bg-sky-500/10',
  danger: 'border-rose-300/18 bg-rose-500/10'
} as const;

export function EmptyState({
  title,
  body,
  actions,
  tone = 'default',
  className = ''
}: {
  title: string;
  body: string;
  actions?: ReactNode;
  tone?: keyof typeof toneStyles;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('min-w-0 rounded-[24px] border border-dashed px-5 py-6', toneStyles[tone], className)}
      role={tone === 'danger' ? 'alert' : 'status'}
    >
      <h3 className="font-display text-2xl leading-none text-white">{title}</h3>
      <p className="mt-3 max-w-xl text-sm leading-6 text-soft">{body}</p>
      {actions ? <div className="mt-5 flex flex-wrap gap-2">{actions}</div> : null}
    </motion.div>
  );
}
