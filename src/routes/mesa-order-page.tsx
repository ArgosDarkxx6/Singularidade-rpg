import { zodResolver } from '@hookform/resolvers/zod';
import { Swords, TimerReset, UserPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Button } from '@components/ui/button';
import { EmptyState } from '@components/ui/empty-state';
import { Field, Input, Select, Textarea } from '@components/ui/field';
import { Panel, UtilityPanel } from '@components/ui/panel';
import { MesaHero, MesaMetricTile, MesaRailCard } from '@features/mesa/components/mesa-section-primitives';
import { combatantSchema } from '@schemas/order';
import { useWorkspace } from '@features/workspace/use-workspace';

type CombatantValues = import('zod').infer<typeof combatantSchema>;

export function MesaOrderPage() {
  const { state, online, addCombatant, removeCombatant, updateOrderNotes, rollOrderInitiative, manualSortOrder, goToNextTurn, resetOrder } = useWorkspace();
  const session = online.session;
  const canManage = !session || session.role === 'gm';
  const activeEntry = state.order.entries[state.order.turn];

  const combatantForm = useForm<CombatantValues>({
    resolver: zodResolver(combatantSchema) as never,
    mode: 'onChange',
    defaultValues: {
      type: 'pc',
      characterId: state.characters[0]?.id,
      name: '',
      modifier: 0,
      notes: ''
    }
  });

  const type = combatantForm.watch('type');

  return (
    <div className="page-shell pb-8">
      <MesaHero
        eyebrow="Ordem da mesa"
        title="Painel tático de combate"
        description="A fila de iniciativa agora tem leitura clara de round, turno e combatentes, com foco operacional forte no confronto em andamento."
        actions={
          canManage ? (
            <>
              <Button variant="secondary" onClick={rollOrderInitiative}>
                <Swords className="size-4" />
                Rolar iniciativa
              </Button>
              <Button variant="ghost" onClick={() => goToNextTurn(1)}>
                Proximo turno
              </Button>
            </>
          ) : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MesaMetricTile label="Round" value={state.order.round} hint="Contador do confronto atual." />
        <MesaMetricTile label="Combatentes" value={state.order.entries.length} hint="PCs e NPCs presentes na fila." />
        <MesaMetricTile label="Turno ativo" value={activeEntry?.name || '--'} hint="Entrada destacada no board." />
        <MesaMetricTile label="Gestao" value={canManage ? 'GM' : 'Leitura'} hint="Controle da ordem vinculado ao papel na mesa." />
      </div>

      <div className="grid gap-6">
        <div className="grid gap-6">
          {canManage ? (
            <Panel className="rounded-3xl p-6 sm:p-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Entrada de combate</p>
              <h2 className="mt-2 font-display text-4xl leading-none text-white">Adicionar combatente</h2>
              <p className="mt-3 text-sm leading-6 text-soft">Use personagens da mesa para PCs ou cadastre NPCs e inimigos com modificador manual.</p>

              <form
                className="mt-6 grid gap-4"
                onSubmit={combatantForm.handleSubmit((values) => {
                  addCombatant({
                    type: values.type,
                    characterId: values.type === 'pc' ? values.characterId : undefined,
                    name: values.type === 'npc' ? values.name : undefined,
                    modifier: Number(values.modifier || 0),
                    notes: values.notes
                  });
                  combatantForm.reset({
                    ...values,
                    name: '',
                    modifier: 0,
                    notes: ''
                  });
                })}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Tipo">
                    <Select {...combatantForm.register('type')}>
                      <option value="pc">Personagem da mesa</option>
                      <option value="npc">NPC ou inimigo</option>
                    </Select>
                  </Field>
                  {type === 'pc' ? (
                    <Field label="Personagem">
                      <Select {...combatantForm.register('characterId')}>
                        {state.characters.map((character) => (
                          <option key={character.id} value={character.id}>
                            {character.name}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  ) : (
                    <Field label="Nome do NPC">
                      <Input {...combatantForm.register('name')} />
                    </Field>
                  )}
                  <Field label="Modificador manual">
                    <Input type="number" {...combatantForm.register('modifier')} />
                  </Field>
                  <Field label="Notas" className="md:col-span-2">
                    <Textarea {...combatantForm.register('notes')} />
                  </Field>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button type="submit" disabled={!combatantForm.formState.isValid || combatantForm.formState.isSubmitting}>
                    <UserPlus className="size-4" />
                    Adicionar a ordem
                  </Button>
                  <Button type="button" variant="secondary" onClick={manualSortOrder}>
                    Ordenar lista
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => goToNextTurn(-1)}>
                    Turno anterior
                  </Button>
                  <Button type="button" variant="ghost" onClick={resetOrder}>
                    <TimerReset className="size-4" />
                    Resetar
                  </Button>
                </div>
              </form>
            </Panel>
          ) : null}

          <Panel className="rounded-3xl p-6 sm:p-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Sequencia tatica</p>
            <h2 className="mt-2 font-display text-4xl leading-none text-white">Fila atual de combate</h2>

            <div className="mt-6 grid gap-3">
              {state.order.entries.length ? (
                state.order.entries.map((entry, index) => {
                  const isActive = index === state.order.turn;
                  return (
                    <div
                      key={entry.id}
                      className={`rounded-2xl border px-4 py-4 transition ${
                        isActive ? 'border-sky-300/24 bg-sky-500/10 shadow-[0_18px_40px_rgba(78,140,255,0.12)]' : 'border-white/10 bg-white/[0.03]'
                      }`}
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                            {isActive ? 'Turno ativo' : `Posicao ${index + 1}`} · {entry.type === 'pc' ? 'PC' : 'NPC'}
                          </p>
                          <h3 className="mt-2 font-display text-3xl leading-none text-white">{entry.name}</h3>
                          <p className="mt-3 text-sm text-soft">
                            Iniciativa {entry.init ?? 'nao rolada'} · modificador {entry.modifier >= 0 ? '+' : ''}
                            {entry.modifier}
                          </p>
                        </div>

                        {canManage ? (
                          <Button size="sm" variant="danger" onClick={() => removeCombatant(entry.id)}>
                            Remover
                          </Button>
                        ) : null}
                      </div>

                      {canManage ? (
                        <div className="mt-4">
                          <Field label="Notas de combate">
                            <Textarea value={entry.notes} onChange={(event) => updateOrderNotes(entry.id, event.target.value)} />
                          </Field>
                        </div>
                      ) : entry.notes ? (
                        <UtilityPanel className="mt-4 rounded-lg p-4">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Notas</p>
                          <p className="mt-2 text-sm text-soft">{entry.notes}</p>
                        </UtilityPanel>
                      ) : null}
                    </div>
                  );
                })
              ) : (
                <EmptyState title="Nenhum combatente cadastrado." body="Abra a ordem de combate como GM para preencher a primeira fila de iniciativa." />
              )}
            </div>
          </Panel>
        </div>

        <div className="page-right-rail">
          <MesaRailCard
            eyebrow="Turno ativo"
            title={activeEntry?.name || 'Sem confronto aberto'}
            description={activeEntry ? `Modificador ${activeEntry.modifier >= 0 ? '+' : ''}${activeEntry.modifier}.` : 'A fila ainda nao foi iniciada.'}
          >
            {activeEntry ? (
              <UtilityPanel className="rounded-lg p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Notas</p>
                <p className="mt-2 text-sm text-soft">{activeEntry.notes || 'Sem notas para este turno.'}</p>
              </UtilityPanel>
            ) : (
              <EmptyState title="Sem turno ativo." body="Adicione combatentes e role iniciativa para abrir o ciclo tatico." />
            )}
          </MesaRailCard>
        </div>
      </div>
    </div>
  );
}
