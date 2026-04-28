import { zodResolver } from '@hookform/resolvers/zod';
import { DoorOpen, KeyRound, Link2, RadioTower } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@components/ui/button';
import { EmptyState } from '@components/ui/empty-state';
import { Field, Input } from '@components/ui/field';
import { NexusPageHeader, NexusPanel, NexusSectionHeader } from '@components/ui/nexus';
import { UtilityPanel } from '@components/ui/panel';
import { useAuth } from '@features/auth/hooks/use-auth';
import { usePlatformInvites } from '@features/workspace/hooks/use-workspace-segments';
import { joinCodeSchema, joinInviteSchema } from '@schemas/mesa';
import type { InvitePreview } from '@/types/domain';

type JoinCodeValues = import('zod').infer<typeof joinCodeSchema>;
type JoinInviteValues = import('zod').infer<typeof joinInviteSchema>;

function extractInviteToken(value: string) {
  const normalized = String(value || '').trim();
  if (!normalized) return '';

  try {
    const parsed = new URL(normalized);
    return parsed.searchParams.get('token') || '';
  } catch {
    return '';
  }
}

function formatRoleLabel(role: 'gm' | 'player' | 'viewer') {
  if (role === 'gm') return 'GM';
  if (role === 'player') return 'Jogador';
  return 'Visitante';
}

export function InvitesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { online, previewInvite, connectToInvite, connectToJoinCode } = usePlatformInvites();
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [joinBusy, setJoinBusy] = useState<'invite' | 'code' | null>(null);

  const defaultNickname = user?.displayName || user?.username || 'Jogador';

  const inviteForm = useForm<JoinInviteValues>({
    resolver: zodResolver(joinInviteSchema) as never,
    mode: 'onBlur',
    defaultValues: {
      inviteUrl: '',
      nickname: defaultNickname
    }
  });

  const codeForm = useForm<JoinCodeValues>({
    resolver: zodResolver(joinCodeSchema) as never,
    mode: 'onBlur',
    defaultValues: {
      code: '',
      nickname: defaultNickname
    }
  });

  const handlePreviewInvite = inviteForm.handleSubmit(async (values) => {
    const token = extractInviteToken(values.inviteUrl);
    if (!token) {
      setPreview(null);
      toast.error('O link não contém um token de convite válido.');
      return;
    }

    setPreviewBusy(true);
    try {
      const nextPreview = await previewInvite(token);
      if (!nextPreview) {
        setPreview(null);
        toast.error('Convite inválido ou expirado.');
        return;
      }

      setPreview(nextPreview);
    } catch (error) {
      setPreview(null);
      toast.error(error instanceof Error ? error.message : 'Não foi possível carregar o convite.');
    } finally {
      setPreviewBusy(false);
    }
  });

  const handleJoinInvite = inviteForm.handleSubmit(async (values) => {
    setJoinBusy('invite');
    try {
      const session = await connectToInvite(values.inviteUrl, values.nickname);
      if (!session) return;

      toast.success('Convite aceito.');
      navigate(`/mesa/${session.tableSlug}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível aceitar este convite.');
    } finally {
      setJoinBusy(null);
    }
  });

  const handleJoinCode = codeForm.handleSubmit(async (values) => {
    setJoinBusy('code');
    try {
      const result = await connectToJoinCode(values.code, values.nickname);
      if (!result.connected || !result.session) return;

      toast.success('Entrada na mesa concluída.');
      navigate(`/mesa/${result.session.tableSlug}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível entrar com este código.');
    } finally {
      setJoinBusy(null);
    }
  });

  return (
    <div className="grid items-start gap-3 pb-8 xl:grid-cols-[minmax(0,1.45fr)_304px]">
      <div className="grid gap-3">
        <NexusPageHeader kicker="Convites" title="Entrar em uma mesa" />

        <div className="grid gap-3 lg:grid-cols-2">
          <NexusPanel>
            <NexusSectionHeader kicker="Link" title="Prévia" actions={<Link2 className="size-4 text-accent" />} />

            <form className="mt-4 grid gap-3" onSubmit={handleJoinInvite}>
              <Field label="URL do convite" error={inviteForm.formState.errors.inviteUrl?.message}>
                <Input placeholder="https://..." autoComplete="off" {...inviteForm.register('inviteUrl')} />
              </Field>
              <Field label="Apelido da sessão" error={inviteForm.formState.errors.nickname?.message}>
                <Input autoComplete="nickname" {...inviteForm.register('nickname')} />
              </Field>

              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" disabled={previewBusy} onClick={() => void handlePreviewInvite()}>
                  <RadioTower className="size-4" />
                  {previewBusy ? 'Carregando...' : 'Ver prévia'}
                </Button>
                <Button type="submit" disabled={joinBusy === 'invite'}>
                  <DoorOpen className="size-4" />
                  {joinBusy === 'invite' ? 'Entrando...' : 'Aceitar convite'}
                </Button>
              </div>
            </form>

            <div className="mt-4">
              {preview ? (
                <UtilityPanel className="rounded-[9px] px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">{formatRoleLabel(preview.role)}</p>
                  <p className="mt-2 text-lg font-semibold text-white">{preview.tableName}</p>
                  <p className="mt-2 text-sm leading-6 text-soft">{preview.tableDescription || 'Mesa sem descrição pública.'}</p>
                </UtilityPanel>
              ) : (
                <EmptyState title="Sem prévia." body="Cole um link de convite." />
              )}
            </div>
          </NexusPanel>

          <NexusPanel>
            <NexusSectionHeader kicker="Código" title="Entrada manual" actions={<KeyRound className="size-4 text-accent" />} />

            <form className="mt-4 grid gap-3" onSubmit={handleJoinCode}>
              <Field label="Código" error={codeForm.formState.errors.code?.message}>
                <Input autoComplete="one-time-code" placeholder="ABCD1234" {...codeForm.register('code')} />
              </Field>
              <Field label="Apelido da sessão" error={codeForm.formState.errors.nickname?.message}>
                <Input autoComplete="nickname" {...codeForm.register('nickname')} />
              </Field>

              <Button type="submit" disabled={joinBusy === 'code'}>
                <DoorOpen className="size-4" />
                {joinBusy === 'code' ? 'Entrando...' : 'Usar código'}
              </Button>
            </form>
          </NexusPanel>
        </div>
      </div>

      <div className="page-right-rail xl:grid-cols-1">
        <NexusPanel>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">Sessão atual</p>
          <div className="mt-4 grid gap-2">
            <UtilityPanel className="rounded-[9px] px-3 py-2.5">
              <p className="text-sm font-semibold text-white">{online.session?.tableName || 'Nenhuma mesa aberta'}</p>
            </UtilityPanel>
            <Button variant="secondary" onClick={() => navigate('/mesas')}>
              Voltar para mesas
            </Button>
          </div>
        </NexusPanel>
      </div>
    </div>
  );
}
