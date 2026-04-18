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
      <div className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/14 bg-[#081325] shadow-[0_14px_34px_rgba(4,10,22,0.4)]">
        {isSystem ? <img src={system.assets.icon} alt={system.name} className="size-8 object-contain" /> : <img src="/assets/nexus-mark.svg" alt="Project Nexus" className="size-9 object-contain" />}
      </div>
      <div className={compact ? 'hidden sm:block' : ''}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#92dbff]">{isSystem ? 'Sistema ativo' : 'Project Nexus'}</p>
        <div className="mt-1.5">
          {isSystem ? (
            <h1 className="text-xl font-semibold leading-none text-white">{system.name}</h1>
          ) : (
            <img src="/assets/nexus-wordmark.svg" alt="Project Nexus" className="h-7 w-auto max-w-[220px] object-contain" />
          )}
        </div>
      </div>
    </motion.div>
  );
}
