import type { ReactNode } from 'react';
import { NexusPanel, NexusSectionHeader } from '@components/ui/nexus';
import { cn } from '@lib/utils';

export function MesaRailCard({
  eyebrow,
  title,
  description,
  children,
  className = ''
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <NexusPanel className={cn('grid gap-2.5', className)}>
      <NexusSectionHeader kicker={eyebrow} title={title} />
      {description ? <p className="text-sm leading-6 text-soft">{description}</p> : null}
      {children ? <div className="grid gap-2.5">{children}</div> : null}
    </NexusPanel>
  );
}
