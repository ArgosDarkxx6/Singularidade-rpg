import { zodResolver } from '@hookform/resolvers/zod';
import { DoorOpen, KeyRound, Link2, RadioTower } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@components/ui/button';
import { EmptyState } from '@components/ui/empty-state';
import { Field, Input } from '@components/ui/field';
import { Panel, UtilityPanel } from '@components/ui/panel';
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
  if (role === 'player') return 'Player';
  return 'Viewer';
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
    <div className="grid items-start gap-4 pb-8 xl:grid-cols-[minmax(0,1.45fr)_320px]">
      <div className="grid gap-4">
        <Panel className="p-3.5 sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">Convites</p>
              <h1 className="mt-1 font-display text-xl font-semibold leading-tight text-white sm:text-2xl">Entrar em uma mesa</h1>
            </div>
          </div>
        </Panel>

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel className="p-3.5 sm:p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">Link</p>
                <h2 className="mt-1 text-lg font-semibold text-white">Prévia</h2>
              </div>
              <Link2 className="size-4 text-accent" />
            </div>

            <form className="mt-4 grid gap-4" onSubmit={handleJoinInvite}>
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
                <UtilityPanel className="rounded-lg px-3.5 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">{formatRoleLabel(preview.role)}</p>
                  <p className="mt-2 text-lg font-semibold text-white">{preview.tableName}</p>
                  <p className="mt-2 text-sm leading-6 text-soft">{preview.tableDescription || 'Mesa sem descrição pública.'}</p>
                </UtilityPanel>
              ) : (
                <EmptyState title="Sem prévia." body="Cole um link de convite." />
              )}
            </div>
          </Panel>

          <Panel className="p-3.5 sm:p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">Código</p>
                <h2 className="mt-1 text-lg font-semibold text-white">Entrada manual</h2>
              </div>
              <KeyRound className="size-4 text-accent" />
            </div>

            <form className="mt-4 grid gap-4" onSubmit={handleJoinCode}>
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
          </Panel>
        </div>
      </div>

      <div className="page-right-rail xl:grid-cols-1">
        <Panel className="p-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">Sessão atual</p>
          <div className="mt-4 grid gap-2">
            <UtilityPanel className="rounded-lg px-3.5 py-3">
              <p className="text-sm font-semibold text-white">{online.session?.tableName || 'Nenhuma mesa aberta'}</p>
            </UtilityPanel>
            <Button variant="secondary" onClick={() => navigate('/mesas')}>
              Voltar para mesas
            </Button>
          </div>
        </Panel>
      </div>
    </div>
  );
}
