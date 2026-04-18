import { Navigate } from 'react-router-dom';
import type { MesaSection } from '@/types/domain';
import { useAuth } from '@features/auth/hooks/use-auth';
import { buildMesaSectionPath } from '@features/mesa/lib/mesa-routing';
import { useWorkspace } from '@features/workspace/use-workspace';
import { ONLINE_SESSION_STORAGE_KEY } from '@lib/domain/constants';

function readStoredTableSlug(userId?: string | null) {
  if (!userId || typeof window === 'undefined') return '';

  try {
    const raw = localStorage.getItem(`${ONLINE_SESSION_STORAGE_KEY}:${userId}`);
    if (!raw) return '';
    const parsed = JSON.parse(raw) as { tableSlug?: unknown };
    return typeof parsed.tableSlug === 'string' ? parsed.tableSlug : '';
  } catch {
    return '';
  }
}

export function LegacyRouteRedirect({ section }: { section?: MesaSection }) {
  const { user } = useAuth();
  const { tables, online } = useWorkspace();
  const storedTableSlug = readStoredTableSlug(user?.id);
  const storedTableIsKnown = tables.some((table) => table.slug === storedTableSlug);
  const slug =
    online.session?.tableSlug ||
    online.table?.slug ||
    (storedTableIsKnown ? storedTableSlug : '') ||
    tables[0]?.slug ||
    storedTableSlug;

  if (!slug) {
    return <Navigate to="/mesas" replace />;
  }

  if (!section || section === 'overview') {
    return <Navigate to={`/mesa/${slug}`} replace />;
  }

  return <Navigate to={buildMesaSectionPath(slug, section)} replace />;
}
