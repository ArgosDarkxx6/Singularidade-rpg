import { zodResolver } from '@hookform/resolvers/zod';
import { Swords, TimerReset, UserPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Button } from '@components/ui/button';
import { EmptyState } from '@components/ui/empty-state';
import { Field, Input, Select, Textarea } from '@components/ui/field';
import { UtilityPanel } from '@components/ui/panel';
import {
  MesaActionCard,
  MesaKeyValueRow,
  MesaLeadMeta,
  MesaPageLead,
  MesaSectionPanel
} from '@features/mesa/components/mesa-page-primitives';
import { useMesaOrder } from '@features/workspace/hooks/use-workspace-segments';
import { combatantSchema } from '@schemas/order';

type CombatantValues = import('zod').infer<typeof combatantSchema>;

export function MesaOrderPage() {
  const { state, online, addCombatant, removeCombatant, updateOrderNotes, rollOrderInitiative, manualSortOrder, goToNextTurn, resetOrder } =
    useMesaOrder();
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
      <MesaPageLead
        eyebrow="Ordem da mesa"
        title="Combate e iniciativa"
        description="Round, turno e fila tática em uma leitura compacta, boa para sessão longa e boa também no mobile."
        meta={
          <>
            <MesaLeadMeta label="Round" value={state.order.round} accent />
            <MesaLeadMeta label="Combatentes" value={state.order.entries.length} />
            <MesaLeadMeta label="Turno" value={activeEntry?.name || '--'} />
          </>
        }
        actions={
          canManage ? (
            <>
              <Button variant="secondary" onClick={rollOrderInitiative}>
                <Swords className="size-4" />
                Rolar iniciativa
              </Button>
              <Button onClick={() => goToNextTurn(1)}>Próximo turno</Button>
            </>
          ) : undefined
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_360px]">
        <div className="grid gap-4">
          {canManage ? (
            <MesaSectionPanel
              eyebrow="Adicionar entrada"
              title="Novo combatente"
              description="Use personagens da mesa para PCs ou registre NPCs com modificador manual."
              actions={
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" type="button" onClick={manualSortOrder}>
                    Ordenar lista
                  </Button>
                  <Button variant="secondary" type="button" onClick={() => goToNextTurn(-1)}>
                    Turno anterior
                  </Button>
                  <Button variant="ghost" type="button" onClick={resetOrder}>
                    <TimerReset className="size-4" />
                    Resetar
                  </Button>
                </div>
              }
            >
              <form
                className="grid gap-4"
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
                  <Field label="Modificador">
                    <Input type="number" {...combatantForm.register('modifier')} />
                  </Field>
                  <Field label="Notas" className="md:col-span-2">
                    <Textarea {...combatantForm.register('notes')} />
                  </Field>
                </div>

                <Button type="submit" disabled={!combatantForm.formState.isValid || combatantForm.formState.isSubmitting}>
                  <UserPlus className="size-4" />
                  Adicionar à ordem
                </Button>
              </form>
            </MesaSectionPanel>
          ) : null}

          <MesaSectionPanel
            eyebrow="Fila atual"
            title="Sequência tática"
            description="A ordem fica limpa: quem age agora, quem vem depois e quais notas importam no turno."
          >
            {state.order.entries.length ? (
              state.order.entries.map((entry, index) => {
                const isActive = index === state.order.turn;
                return (
                  <UtilityPanel
                    key={entry.id}
                    className={`rounded-lg px-4 py-4 ${isActive ? 'border-sky-300/20 bg-sky-500/10' : ''}`}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                          {isActive ? 'Turno ativo' : `Posição ${index + 1}`} · {entry.type === 'pc' ? 'PC' : 'NPC'}
                        </p>
                        <h3 className="mt-1.5 text-lg font-semibold text-white">{entry.name}</h3>
                        <p className="mt-2 text-sm text-soft">
                          Iniciativa {entry.init ?? 'não rolada'} · modificador {entry.modifier >= 0 ? '+' : ''}
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
                        <Field label="Notas do turno">
                          <Textarea value={entry.notes} onChange={(event) => updateOrderNotes(entry.id, event.target.value)} />
                        </Field>
                      </div>
                    ) : entry.notes ? (
                      <p className="mt-4 text-sm leading-6 text-soft">{entry.notes}</p>
                    ) : null}
                  </UtilityPanel>
                );
              })
            ) : (
              <EmptyState title="Nenhum combatente cadastrado." body="Abra a ordem como GM para preencher a primeira fila de iniciativa." />
            )}
          </MesaSectionPanel>
        </div>

        <div className="grid gap-4">
          <MesaSectionPanel
            eyebrow="Turno em foco"
            title={activeEntry?.name || 'Sem confronto aberto'}
            description={activeEntry ? 'Leitura resumida do combatente que está no topo da fila.' : 'A ordem ainda não foi iniciada.'}
          >
            {activeEntry ? (
              <>
                <MesaActionCard
                  title={activeEntry.type === 'pc' ? 'Personagem da mesa' : 'NPC ou inimigo'}
                  description={
                    activeEntry.notes || 'Sem notas adicionais neste turno. Use este espaço para efeitos, gatilhos ou marcações rápidas.'
                  }
                  icon={<Swords className="size-4" />}
                />
                <div className="grid gap-3">
                  <MesaKeyValueRow
                    label="Iniciativa"
                    value={activeEntry.init ?? 'Não rolada'}
                    helper={`Modificador ${activeEntry.modifier >= 0 ? '+' : ''}${activeEntry.modifier}.`}
                  />
                  <MesaKeyValueRow
                    label="Posição"
                    value={state.order.turn + 1}
                    helper={`Round ${state.order.round}.`}
                  />
                </div>
              </>
            ) : (
              <EmptyState title="Sem turno ativo." body="Adicione combatentes e role iniciativa para abrir o ciclo tático." />
            )}
          </MesaSectionPanel>
        </div>
      </div>
    </div>
  );
}
