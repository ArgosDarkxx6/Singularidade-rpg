import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Dices, Target } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Button } from '@components/ui/button';
import { EmptyState } from '@components/ui/empty-state';
import { Field, Input, Select } from '@components/ui/field';
import { Panel, UtilityPanel } from '@components/ui/panel';
import { MesaHero, MesaMetricTile, MesaRailCard } from '@features/mesa/components/mesa-section-primitives';
import { useWorkspace } from '@features/workspace/use-workspace';
import { ATTRIBUTE_CONFIG, ROLL_CONTEXTS, ROLL_TN_PRESETS } from '@lib/domain/constants';
import { contextLabel } from '@lib/domain/rules';
import { customRollSchema, guidedRollSchema } from '@schemas/rolls';
import type { Character } from '@/types/domain';

type GuidedValues = import('zod').infer<typeof guidedRollSchema>;
type CustomValues = import('zod').infer<typeof customRollSchema>;

function getTnValue(value: number | '' | null | undefined) {
  return value === '' ? null : Number(value);
}

function attributeRankLabel(character: Character, attributeKey: keyof Character['attributes']) {
  const attribute = character.attributes[attributeKey];
  return `${attribute.value >= 0 ? '+' : ''}${attribute.value} / ${attribute.rank}`;
}

export function MesaRollsPage() {
  const { state, lastRoll, executeAttributeRoll, executeCustomRoll, clearLog, online } = useWorkspace();
  const canClearLog = online.session?.role === 'gm';

  const guidedForm = useForm<GuidedValues>({
    resolver: zodResolver(guidedRollSchema) as never,
    mode: 'onChange',
    defaultValues: {
      characterId: state.activeCharacterId,
      attributeKey: 'strength',
      context: 'standard',
      extraBonus: 0,
      tn: ''
    }
  });

  const customForm = useForm<CustomValues>({
    resolver: zodResolver(customRollSchema) as never,
    mode: 'onChange',
    defaultValues: {
      expression: '2d6',
      bonus: 0,
      label: 'Rolagem customizada',
      tn: ''
    }
  });

  const selectedCharacter = state.characters.find((character) => character.id === guidedForm.watch('characterId')) || state.characters[0];

  return (
    <div className="page-shell pb-8">
      <MesaHero
        eyebrow="Rolagens dentro da mesa"
        title="Composer central e feed tatico"
        description="Os testes agora ficam alinhados ao contexto da mesa atual. O composer guia a rolagem e o feed lateral concentra o historico mais recente."
        actions={
          canClearLog ? (
            <Button variant="ghost" onClick={() => void clearLog()}>
              Limpar log
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MesaMetricTile label="Entradas no log" value={state.log.length} hint="Historico compartilhado desta mesa." />
        <MesaMetricTile label="Personagens prontos" value={state.characters.length} hint="Qualquer ficha da mesa pode rolar daqui." />
        <MesaMetricTile label="Ultimo total" value={lastRoll?.total ?? '--'} hint="Resumo da ultima acao executada." />
        <MesaMetricTile label="TN presets" value={ROLL_TN_PRESETS.length} hint="Atalhos rapidos para dificuldades padrao." />
      </div>

      <div className="grid gap-6">
        <div className="grid gap-6">
          <div className="grid gap-6 xl:grid-cols-2">
            <Panel className="rounded-lg p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Fluxo guiado</p>
              <h2 className="mt-2 font-display text-4xl leading-none text-white">Teste de atributo</h2>
              <p className="mt-3 text-sm leading-6 text-soft">Escolha personagem, atributo, contexto e TN. O resumo entra no log da mesa.</p>

              <form
                className="mt-6 grid gap-4"
                onSubmit={guidedForm.handleSubmit((values) => {
                  executeAttributeRoll({
                    characterId: values.characterId,
                    attributeKey: values.attributeKey,
                    context: values.context,
                    extraBonus: Number(values.extraBonus || 0),
                    tn: getTnValue(values.tn)
                  });
                })}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Personagem">
                    <Select {...guidedForm.register('characterId')}>
                      {state.characters.map((character) => (
                        <option key={character.id} value={character.id}>
                          {character.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Atributo">
                    <Select {...guidedForm.register('attributeKey')}>
                      {ATTRIBUTE_CONFIG.map((attribute) => (
                        <option key={attribute.key} value={attribute.key}>
                          {attribute.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Contexto">
                    <Select {...guidedForm.register('context')}>
                      {ROLL_CONTEXTS.map((context) => (
                        <option key={context.value} value={context.value}>
                          {context.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Bonus extra">
                    <Input type="number" {...guidedForm.register('extraBonus')} />
                  </Field>
                  <Field label="TN" className="md:col-span-2">
                    <Select {...guidedForm.register('tn')}>
                      <option value="">Sem TN</option>
                      {ROLL_TN_PRESETS.map((tn) => (
                        <option key={tn} value={tn}>
                          {tn}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
                <Button type="submit" disabled={!guidedForm.formState.isValid || guidedForm.formState.isSubmitting}>
                  <Target className="size-4" />
                  Rolar atributo
                </Button>
              </form>

              {selectedCharacter ? (
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {ATTRIBUTE_CONFIG.map((attribute) => (
                    <UtilityPanel key={attribute.key} className="rounded-lg px-4 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">{attribute.label}</p>
                      <p className="mt-2 text-sm font-semibold text-white">{attributeRankLabel(selectedCharacter, attribute.key)}</p>
                    </UtilityPanel>
                  ))}
                </div>
              ) : null}
            </Panel>

            <Panel className="rounded-lg p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Fluxo livre</p>
              <h2 className="mt-2 font-display text-4xl leading-none text-white">Rolagem customizada</h2>
              <p className="mt-3 text-sm leading-6 text-soft">Use para dano, cura, efeitos especiais ou qualquer expressao fora do d20 base.</p>

              <form
                className="mt-6 grid gap-4"
                onSubmit={customForm.handleSubmit((values) => {
                  executeCustomRoll({
                    expression: values.expression,
                    bonus: Number(values.bonus || 0),
                    label: values.label,
                    tn: getTnValue(values.tn)
                  });
                })}
              >
                <Field label="Rotulo">
                  <Input {...customForm.register('label')} />
                </Field>
                <Field label="Expressao">
                  <Input {...customForm.register('expression')} />
                </Field>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Bonus">
                    <Input type="number" {...customForm.register('bonus')} />
                  </Field>
                  <Field label="TN">
                    <Input type="number" placeholder="Opcional" {...customForm.register('tn')} />
                  </Field>
                </div>
                <Button type="submit" disabled={!customForm.formState.isValid || customForm.formState.isSubmitting}>
                  <Dices className="size-4" />
                  Executar rolagem
                </Button>
              </form>
            </Panel>
          </div>

          <Panel className="rounded-lg p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Historico operacional</p>
            <h2 className="mt-2 font-display text-4xl leading-none text-white">Ultimas entradas do log</h2>
            <div className="mt-6 grid gap-3">
              {state.log.length ? (
                state.log.slice(0, 12).map((entry) => (
                  <UtilityPanel key={entry.id} className="rounded-lg p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">{entry.category}</p>
                        <p className="mt-2 text-sm font-semibold text-white">{entry.title}</p>
                      </div>
                      <p className="text-[10px] uppercase tracking-[0.18em] text-muted">
                        {new Date(entry.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <p className="mt-3 text-sm text-soft">{entry.text}</p>
                    {entry.meta ? <p className="mt-2 text-xs uppercase tracking-[0.18em] text-sky-200">{entry.meta}</p> : null}
                  </UtilityPanel>
                ))
              ) : (
                <EmptyState title="Sem entradas no log." body="Assim que voce comecar a rolar, o feed da mesa sera preenchido aqui." />
              )}
            </div>
          </Panel>
        </div>

        <div className="page-right-rail">
          <MesaRailCard
            eyebrow="Ultima resolucao"
            title="Resumo imediato"
            description="Feedback rapido para voce nao perder total, margem e marcadores especiais."
          >
            {lastRoll ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid gap-3">
                <UtilityPanel className="rounded-lg p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                    {lastRoll.custom ? 'Rolagem customizada' : contextLabel(lastRoll.context || 'standard')}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">{lastRoll.label}</p>
                  <p className="mt-3 text-sm text-soft">Total {lastRoll.total}</p>
                </UtilityPanel>
                <UtilityPanel className="rounded-lg p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Rolagens</p>
                  <p className="mt-2 text-sm font-semibold text-white">{lastRoll.rolls.join(', ')}</p>
                </UtilityPanel>
                <UtilityPanel className="rounded-lg p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Resultado</p>
                  <p className="mt-2 text-sm font-semibold text-white">{lastRoll.outcomeLabel}</p>
                  <p className="mt-2 text-sm text-soft">
                    {lastRoll.margin === null ? 'Sem TN' : `Margem ${lastRoll.margin >= 0 ? '+' : ''}${lastRoll.margin}`}
                  </p>
                </UtilityPanel>
              </motion.div>
            ) : (
              <EmptyState title="Nenhuma rolagem ainda." body="Use um dos composers ao lado para abrir o primeiro resumo desta mesa." />
            )}
          </MesaRailCard>
        </div>
      </div>
    </div>
  );
}
