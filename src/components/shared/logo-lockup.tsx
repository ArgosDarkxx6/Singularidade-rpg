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
          'relative flex shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-white/14 bg-[#061020] shadow-[0_12px_30px_rgba(4,10,22,0.38)]',
          compact ? 'size-8' : 'size-11'
        )}
      >
        {isSystem ? (
          <img src={system.assets.icon} alt={system.name} className={cn('object-contain', compact ? 'size-6' : 'size-8')} />
        ) : (
          <img src="/assets/nexus-mark.svg" alt="Project Nexus" className={cn('object-contain', compact ? 'size-6' : 'size-9')} />
        )}
      </div>
      <div className={compact ? 'hidden' : ''}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#92dbff]">{isSystem ? 'Sistema' : 'Project Nexus'}</p>
        <div className="mt-1">
          {isSystem ? (
            <h1 className="text-xl font-semibold leading-none text-white">{system.name}</h1>
          ) : (
            <img src="/assets/nexus-wordmark.svg" alt="Project Nexus" className="h-6 w-auto max-w-[210px] object-contain" />
          )}
        </div>
      </div>
    </motion.div>
  );
}
