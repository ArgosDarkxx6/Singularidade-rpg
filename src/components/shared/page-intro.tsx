import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { Badge } from '@components/ui/badge';

export function PageIntro({
  eyebrow,
  title,
  description,
  chips = [],
  actions
}: {
  eyebrow: string;
  title: string;
  description: string;
  chips?: string[];
  actions?: ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="surface-panel-strong ritual-outline rounded-[32px] px-6 py-7"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">{eyebrow}</p>
          <h1 className="mt-3 max-w-3xl font-display text-5xl leading-none sm:text-6xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-soft sm:text-base">{description}</p>
        </div>
        <div className="flex flex-col items-start gap-3 lg:items-end">
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
          <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <Badge key={chip}>{chip}</Badge>
          ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}
