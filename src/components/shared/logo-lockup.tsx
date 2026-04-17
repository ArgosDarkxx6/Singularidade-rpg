import { motion } from 'framer-motion';
import { getGameSystem } from '@features/systems/registry';
import { cn } from '@lib/utils';
import type { GameSystemKey } from '@/types/domain';

export function LogoLockup({
  compact = false,
  className = '',
  variant = 'platform',
  systemKey = 'singularidade'
}: {
  compact?: boolean;
  className?: string;
  variant?: 'platform' | 'system';
  systemKey?: GameSystemKey;
}) {
  const system = getGameSystem(systemKey);
  const isSystem = variant === 'system';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex items-center gap-3', className)}
    >
      <div
        className={cn(
          'relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border shadow-[0_12px_30px_rgba(0,0,0,0.24)]',
          isSystem ? 'border-sky-300/25 bg-sky-400/10' : 'border-blue-300/22 bg-blue-500/10'
        )}
      >
        {isSystem ? (
          <img src={system.assets.icon} alt={system.name} className="size-9 object-contain" />
        ) : (
          <span className="font-display text-xl font-bold leading-none text-white">PN</span>
        )}
      </div>
      <div className={compact ? 'hidden sm:block' : ''}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-accent">
          {isSystem ? 'Sistema ativo' : 'Project Nexus'}
        </p>
        <h1 className="font-display text-2xl leading-none text-white">{isSystem ? system.name : 'Unindo universos'}</h1>
      </div>
    </motion.div>
  );
}
