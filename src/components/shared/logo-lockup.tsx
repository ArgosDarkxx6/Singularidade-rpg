import { motion } from 'framer-motion';
import { cn } from '@lib/utils';

export function LogoLockup({ compact = false, className = '' }: { compact?: boolean; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex items-center gap-3', className)}
    >
      <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-sky-300/20 bg-sky-400/8 shadow-[0_12px_30px_rgba(87,187,255,0.18)]">
        <img src="/assets/icon.png" alt="Singularidade" className="size-9 object-contain" />
      </div>
      <div className={compact ? 'hidden sm:block' : ''}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-accent">Singularidade</p>
        <h1 className="font-display text-2xl leading-none text-white">RPG Tatico</h1>
      </div>
    </motion.div>
  );
}
