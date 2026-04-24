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

  const defaultNickname = user?.displayName || user?.username || 'Feiticeiro';

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
    <div className="grid gap-4 pb-8 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.95fr)]">
      <div className="grid gap-4">
        <Panel className="rounded-[28px] p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">Convites e acesso</p>
              <h2 className="mt-2 text-2xl font-semibold leading-tight text-white sm:text-3xl">Entre em uma mesa sem depender da página errada.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-soft">
                Código manual, link com prévia e entrada direta em qualquer viewport. O convite não precisa carregar personagem, só o papel certo.
              </p>
            </div>

            <UtilityPanel className="rounded-2xl px-4 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Sessão atual</p>
              <p className="mt-2 text-sm font-semibold text-white">{online.session?.tableName || 'Nenhuma mesa aberta'}</p>
            </UtilityPanel>
          </div>
        </Panel>

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel className="rounded-[28px] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">Link de convite</p>
                <h3 className="mt-1.5 text-xl font-semibold text-white">Prévia antes de aceitar</h3>
              </div>
              <Link2 className="size-4 text-sky-200" />
            </div>

            <form className="mt-5 grid gap-4" onSubmit={handleJoinInvite}>
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

            <div className="mt-5">
              {preview ? (
                <UtilityPanel className="rounded-2xl p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Prévia</p>
                  <p className="mt-2 text-lg font-semibold text-white">{preview.tableName}</p>
                  <p className="mt-2 text-sm leading-6 text-soft">{preview.tableDescription || 'Mesa sem descrição pública.'}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.16em] text-muted">
                    <span>{formatRoleLabel(preview.role)}</span>
                    <span>Link</span>
                  </div>
                </UtilityPanel>
              ) : (
                <EmptyState title="Sem prévia carregada." body="Cole um link de convite e use a prévia para conferir a mesa antes de aceitar." />
              )}
            </div>
          </Panel>

          <Panel className="rounded-[28px] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">Código manual</p>
                <h3 className="mt-1.5 text-xl font-semibold text-white">Entrar com código</h3>
              </div>
              <KeyRound className="size-4 text-sky-200" />
            </div>

            <form className="mt-5 grid gap-4" onSubmit={handleJoinCode}>
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

      <div className="grid gap-4">
        <Panel className="rounded-[28px] p-5 sm:p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">Regras do fluxo</p>
          <h3 className="mt-1.5 text-xl font-semibold text-white">O convite só decide acesso.</h3>
          <div className="mt-5 grid gap-3">
            <UtilityPanel className="rounded-2xl p-4">
              <p className="text-sm leading-6 text-soft">Convite não escolhe ficha nem prende personagem. O vínculo correto acontece depois, dentro da mesa.</p>
            </UtilityPanel>
            <UtilityPanel className="rounded-2xl p-4">
              <p className="text-sm leading-6 text-soft">Links abrem prévia da mesa. Códigos servem para entrada manual rápida em desktop e mobile.</p>
            </UtilityPanel>
            <UtilityPanel className="rounded-2xl p-4">
              <p className="text-sm leading-6 text-soft">Se você entrar como player sem ficha vinculada, a página de Fichas passa para o estado vazio correto.</p>
            </UtilityPanel>
          </div>
        </Panel>
      </div>
    </div>
  );
}
