import { zodResolver } from '@hookform/resolvers/zod';
import { Swords, TimerReset, UserPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { PageIntro } from '@components/shared/page-intro';
import { SectionTitle } from '@components/shared/section-title';
import { Button } from '@components/ui/button';
import { Card } from '@components/ui/card';
import { EmptyState } from '@components/ui/empty-state';
import { Field, Input, Select, Textarea } from '@components/ui/field';
import { useSyncView } from '@hooks/use-sync-view';
import { combatantSchema } from '@schemas/order';
import { useWorkspace } from '@features/workspace/use-workspace';

type CombatantValues = import('zod').infer<typeof combatantSchema>;

export function OrderPage() {
  useSyncView('order');

  const { state, addCombatant, removeCombatant, updateOrderNotes, rollOrderInitiative, manualSortOrder, goToNextTurn, resetOrder } = useWorkspace();

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
  const activeEntry = state.order.entries[state.order.turn];

  return (
    <div className="page-grid">
      <PageIntro
        eyebrow="Conflito ativo"
        title="Ordem de combate e iniciativa."
        description="Monte a fila de combate, role iniciativa, avance turnos e mantenha notas taticas por combatente."
        chips={[`Round ${state.order.round}`, `${state.order.entries.length} combatentes`, activeEntry ? `Ativo: ${activeEntry.name}` : 'Sem turno em andamento']}
        actions={
          <>
            <Button variant="secondary" onClick={rollOrderInitiative}>
              <Swords className="size-4" />
              Rolar iniciativa
            </Button>
            <Button variant="ghost" onClick={() => goToNextTurn(1)}>
              Proximo turno
            </Button>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="p-6">
          <SectionTitle eyebrow="Entrada" title="Novo combatente" description="Use personagens existentes para PCs ou cadastre NPCs com modificador manual." />

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
            <Field label="Tipo">
              <Select {...combatantForm.register('type')}>
                <option value="pc">Personagem do roster</option>
                <option value="npc">NPC / inimigo</option>
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
                <Input placeholder="Maldicao de grau 2" {...combatantForm.register('name')} />
              </Field>
            )}

            <Field label="Modificador manual">
              <Input type="number" {...combatantForm.register('modifier')} />
            </Field>

            <Field label="Notas">
              <Textarea placeholder="Comportamento, gatilho ou observacao tática." {...combatantForm.register('notes')} />
            </Field>

            <Button type="submit" disabled={!combatantForm.formState.isValid || combatantForm.formState.isSubmitting}>
              <UserPlus className="size-4" />
              Adicionar a ordem
            </Button>
          </form>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Button variant="secondary" onClick={manualSortOrder}>
              Ordenar lista
            </Button>
            <Button variant="secondary" onClick={() => goToNextTurn(-1)}>
              Turno anterior
            </Button>
            <Button variant="ghost" onClick={resetOrder}>
              <TimerReset className="size-4" />
              Resetar
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <SectionTitle
            eyebrow="Sequencia tática"
            title="Fila atual"
            description="A linha ativa recebe destaque. Edite notas por entrada e remova o que sair de cena."
          />

          <div className="mt-5 grid gap-3">
            {state.order.entries.length ? (
              state.order.entries.map((entry, index) => {
                const isActive = index === state.order.turn;
                return (
                  <div
                    key={entry.id}
                    className={`rounded-[24px] border px-4 py-4 transition ${isActive ? 'border-sky-300/26 bg-sky-500/10' : 'border-white/10 bg-white/4'}`}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                          {isActive ? 'Turno ativo' : `Posicao ${index + 1}`} · {entry.type === 'pc' ? 'PC' : 'NPC'}
                        </p>
                        <h3 className="mt-2 font-display text-3xl text-white">{entry.name}</h3>
                        <p className="mt-2 text-sm text-soft">Iniciativa: {entry.init ?? 'Nao rolada'} · Modificador: {entry.modifier >= 0 ? '+' : ''}{entry.modifier}</p>
                      </div>
                      <Button variant="danger" size="sm" onClick={() => removeCombatant(entry.id)}>
                        Remover
                      </Button>
                    </div>

                    <div className="mt-4">
                      <Field label="Notas de combate">
                        <Textarea value={entry.notes} onChange={(event) => updateOrderNotes(entry.id, event.target.value)} />
                      </Field>
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyState title="Nenhum combatente cadastrado." body="Adicione PCs ou NPCs ao lado e depois role iniciativa para abrir a sequência de turno." />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
