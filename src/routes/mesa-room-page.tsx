import { useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { PageIntro } from '@components/shared/page-intro';
import { Button } from '@components/ui/button';
import { EmptyState } from '@components/ui/empty-state';
import { TableDashboard } from '@features/mesa/components/table-dashboard';
import { useAuth } from '@features/auth/hooks/use-auth';
import { useWorkspace } from '@features/workspace/use-workspace';
import { useSyncView } from '@hooks/use-sync-view';

export function MesaRoomPage() {
  useSyncView('mesa');

  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { online, connectToInvite } = useWorkspace();
  const attemptedRef = useRef(false);
  const inviteToken = searchParams.get('token');

  useEffect(() => {
    if (!slug || !inviteToken || attemptedRef.current) return;
    if (online.session?.tableSlug === slug) return;

    attemptedRef.current = true;

    void (async () => {
      try {
        const session = await connectToInvite(window.location.href, user?.displayName || user?.username || 'Feiticeiro');
        if (session) toast.success('Convite aplicado nesta rota.');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Nao foi possivel abrir a mesa por esta URL.');
      }
    })();
  }, [connectToInvite, inviteToken, online.session?.tableSlug, slug, user?.displayName, user?.username]);

  if (!slug) {
    return <EmptyState title="Slug ausente." body="A rota da mesa precisa de um identificador valido." />;
  }

  if (online.session?.tableSlug !== slug) {
    return (
      <div className="page-grid">
        <PageIntro
          eyebrow="Mesa especifica"
          title={`Rota /mesa/${slug}`}
          description="Esta rota precisa de uma sessao conectada ou de um convite valido com token."
          chips={[inviteToken ? 'Token detectado' : 'Sem token', user?.username || 'sem usuario']}
          actions={<Button variant="secondary" onClick={() => navigate('/mesa')}>Voltar ao hub da mesa</Button>}
        />
        <EmptyState
          title="Acesso ainda nao estabelecido."
          body={inviteToken ? 'A tentativa automatica de entrada foi executada. Se a sessao nao abriu, valide o convite ou tente novamente pelo hub.' : 'Abra esta mesa a partir do hub principal ou use uma URL de convite completa com token.'}
        />
      </div>
    );
  }

  return (
    <div className="page-grid">
      <PageIntro
        eyebrow="Sala conectada"
        title={online.table?.name || slug}
        description={`Voce esta conectado como ${online.session.role} nesta rota canonica de mesa.`}
        chips={[slug, `${online.members.length} presencas`, online.session.nickname]}
        actions={<Button variant="secondary" onClick={() => navigate('/mesa')}>Voltar ao hub</Button>}
      />
      <TableDashboard />
    </div>
  );
}
