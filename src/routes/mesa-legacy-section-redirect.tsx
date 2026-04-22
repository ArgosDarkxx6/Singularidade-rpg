import { Navigate, useLocation, useParams } from 'react-router-dom';

export function MesaLegacySectionRedirect({ focus }: { focus: 'sessao' | 'membros' }) {
  const { slug = '' } = useParams();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  params.set('focus', focus);
  const query = params.toString();

  return <Navigate to={`/mesa/${slug}${query ? `?${query}` : ''}`} replace />;
}

export function MesaLegacySessionRedirect() {
  return <MesaLegacySectionRedirect focus="sessao" />;
}

export function MesaLegacyMembersRedirect() {
  return <MesaLegacySectionRedirect focus="membros" />;
}
