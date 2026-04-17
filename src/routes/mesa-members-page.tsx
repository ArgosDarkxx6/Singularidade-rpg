import { zodResolver } from '@hookform/resolvers/zod';
import { Copy, Link2, Plus, ShieldCheck, Users } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@components/ui/button';
import { EmptyState } from '@components/ui/empty-state';
import { Field, Input, Select } from '@components/ui/field';
import { Panel, UtilityPanel } from '@components/ui/panel';
import { MesaHero, MesaRailCard } from '@features/mesa/components/mesa-section-primitives';
import { useWorkspace } from '@features/workspace/use-workspace';
import { copyText, formatJoinCodeDisplay } from '@lib/domain/utils';
import { inviteLinkSchema, joinCodeCreateSchema } from '@schemas/mesa';

type InviteValues = import('zod').infer<typeof inviteLinkSchema>;
type JoinCodeValues = import('zod').infer<typeof joinCodeCreateSchema>;

function formatRoleLabel(role: 'gm' | 'player' | 'viewer') {
  if (role === 'gm') return 'GM';
  if (role === 'player') return 'Player';
  return 'Viewer';
}

export function MesaMembersPage() {
  const { state, online, createInviteLink, createJoinCode, revokeJoinCode } = useWorkspace();
  const table = online.table;
  const session = online.session;
  const members = online.members.length ? online.members : table?.memberships || [];
  const canManage = session?.role === 'gm';

  const inviteForm = useForm<InviteValues>({
    resolver: zodResolver(inviteLinkSchema) as never,
    mode: 'onBlur',
    defaultValues: {
      role: 'player',
      characterId: '',
      label: 'Convite de mesa'
    }
  });

  const codeForm = useForm<JoinCodeValues>({
    resolver: zodResolver(joinCodeCreateSchema) as never,
    mode: 'onBlur',
    defaultValues: {
      role: 'viewer',
      characterId: '',
      label: 'Código rápido'
    }
  });

  if (!table || !session) {
    return <EmptyState title="Mesa offline." body="Abra uma mesa válida para acessar membros, convites e códigos." />;
  }

  return (
    <div className="page-shell pb-8">
      <MesaHero
        eyebrow="Membros e acesso"
        title="Convites da mesa"
        description="Gere links, crie codigos e acompanhe quem entrou."
        actions={
          canManage ? (
            <a
              href="#codigos-ativos"
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white transition hover:border-white/18 hover:bg-white/[0.08]"
            >
              Ver códigos ativos
            </a>
          ) : undefined
        }
      />

      <div className="grid gap-6">
        <div className="grid gap-6">
          <Panel className="rounded-lg p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Presença visível</p>
                <h2 className="mt-2 font-display text-4xl leading-none text-white">Membros dentro da mesa</h2>
              </div>
              <span className="rounded-full border border-sky-300/18 bg-sky-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-100">
                {members.length} online
              </span>
            </div>

            <div className="mt-6 grid gap-3">
              {members.length ? (
                members.map((member) => (
                  <UtilityPanel key={member.id} className="rounded-lg p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-white">{member.nickname}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">
                          {formatRoleLabel(member.role)}
                          {member.characterName ? ` · ${member.characterName}` : ''}
                        </p>
                      </div>
                      {member.role === 'gm' ? <ShieldCheck className="size-4 text-sky-200" /> : <Users className="size-4 text-soft" />}
                    </div>
                  </UtilityPanel>
                ))
              ) : (
                <EmptyState title="Ninguem mais entrou nesta mesa." body="Novos membros aparecem aqui." />
              )}
            </div>
          </Panel>

          <div className="grid gap-6 xl:grid-cols-2">
            <Panel className="rounded-lg p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Convites por link</p>
              <h2 className="mt-2 font-display text-4xl leading-none text-white">Link de acesso</h2>

              {canManage ? (
                <form
                  className="mt-6 grid gap-4"
                  onSubmit={inviteForm.handleSubmit(async (values) => {
                    try {
                      const invite = await createInviteLink(values);
                      if (!invite) return;
                      await copyText(invite);
                      toast.success('Convite criado e copiado.');
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : 'Nao foi possivel criar este convite.');
                    }
                  })}
                >
                  <Field label="Papel concedido">
                    <Select {...inviteForm.register('role')}>
                      <option value="player">Player</option>
                      <option value="viewer">Viewer</option>
                      <option value="gm">GM</option>
                    </Select>
                  </Field>
                  <Field label="Personagem vinculado">
                    <Select {...inviteForm.register('characterId')}>
                      <option value="">Sem vínculo</option>
                      {state.characters.map((character) => (
                        <option key={character.id} value={character.id}>
                          {character.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Rótulo do convite">
                    <Input {...inviteForm.register('label')} />
                  </Field>
                  <Button type="submit" disabled={inviteForm.formState.isSubmitting}>
                    <Link2 className="size-4" />
                    Gerar convite
                  </Button>
                </form>
              ) : (
                <EmptyState title="Apenas GMs geram convites." body="Peca um link ou codigo ao GM." />
              )}
            </Panel>

            <Panel className="rounded-lg p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Codigos</p>
              <h2 className="mt-2 font-display text-4xl leading-none text-white">Codigo de entrada</h2>

              {canManage ? (
                <form
                  className="mt-6 grid gap-4"
                  onSubmit={codeForm.handleSubmit(async (values) => {
                    try {
                      const joinCode = await createJoinCode(values);
                      if (!joinCode) return;
                      toast.success(`Codigo ${formatJoinCodeDisplay(joinCode.code)} criado.`);
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : 'Nao foi possivel criar este codigo.');
                    }
                  })}
                >
                  <Field label="Papel concedido">
                    <Select {...codeForm.register('role')}>
                      <option value="viewer">Viewer</option>
                      <option value="player">Player</option>
                      <option value="gm">GM</option>
                    </Select>
                  </Field>
                  <Field label="Personagem vinculado">
                    <Select {...codeForm.register('characterId')}>
                      <option value="">Escolher depois</option>
                      {state.characters.map((character) => (
                        <option key={character.id} value={character.id}>
                          {character.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Rótulo do código">
                    <Input {...codeForm.register('label')} />
                  </Field>
                  <Button type="submit" disabled={codeForm.formState.isSubmitting}>
                    <Plus className="size-4" />
                    Gerar código
                  </Button>
                </form>
              ) : null}
            </Panel>
          </div>

          <Panel className="rounded-lg p-6" id="codigos-ativos">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Códigos ativos</p>
                <h2 className="mt-2 font-display text-4xl leading-none text-white">Acessos revogáveis</h2>
              </div>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-soft">
                {table.joinCodes.length} ativos
              </span>
            </div>

            <div className="mt-6 grid gap-3">
              {table.joinCodes.length ? (
                table.joinCodes.map((joinCode) => (
                  <UtilityPanel key={joinCode.id} className="rounded-lg p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">{joinCode.label}</p>
                        <p className="mt-2 text-3xl font-semibold text-white">{formatJoinCodeDisplay(joinCode.code)}</p>
                        <p className="mt-2 text-xs uppercase tracking-[0.18em] text-soft">{formatRoleLabel(joinCode.role)}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={async () => {
                            await copyText(joinCode.code);
                            toast.success('Código copiado.');
                          }}
                        >
                          <Copy className="size-4" />
                          Copiar
                        </Button>
                        {canManage ? (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={async () => {
                              try {
                                await revokeJoinCode(joinCode.id);
                                toast.success('Codigo revogado.');
                              } catch (error) {
                                toast.error(error instanceof Error ? error.message : 'Nao foi possivel revogar este codigo.');
                              }
                            }}
                          >
                            Revogar
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </UtilityPanel>
                ))
              ) : (
                <EmptyState title="Nenhum codigo ativo." body="Gere um codigo para convidar alguem." />
              )}
            </div>
          </Panel>
        </div>

        <div className="page-right-rail">
          <MesaRailCard
            eyebrow="Seu papel"
            title={formatRoleLabel(session.role)}
            description={canManage ? 'Voce administra convites e codigos.' : 'Peca novos acessos ao GM.'}
          >
            <UtilityPanel className="rounded-lg p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Último convite gerado</p>
              <p className="mt-2 break-all text-sm font-semibold text-white">{online.lastInvite || 'Nenhum convite criado nesta sessão.'}</p>
            </UtilityPanel>
            <UtilityPanel className="rounded-lg p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Personagens disponíveis</p>
              <p className="mt-2 text-sm font-semibold text-white">{state.characters.length}</p>
            </UtilityPanel>
          </MesaRailCard>
        </div>
      </div>
    </div>
  );
}
