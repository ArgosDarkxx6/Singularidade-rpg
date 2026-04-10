import { Navigate } from 'react-router-dom';
import type { MesaSection } from '@/types/domain';
import { buildMesaSectionPath } from '@features/mesa/lib/mesa-routing';
import { useWorkspace } from '@features/workspace/use-workspace';

export function LegacyRouteRedirect({ section }: { section?: MesaSection }) {
  const { tables, online } = useWorkspace();
  const slug = online.session?.tableSlug || tables[0]?.slug;

  if (!slug) {
    return <Navigate to="/mesas" replace />;
  }

  if (!section || section === 'overview') {
    return <Navigate to={`/mesa/${slug}`} replace />;
  }

  return <Navigate to={buildMesaSectionPath(slug, section)} replace />;
}
