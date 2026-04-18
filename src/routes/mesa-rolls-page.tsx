import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Dices, Target, Trash2 } from 'lucide-react';
import { useEffect } from 'react';
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
  const session = online.session;
  const canClearLog = session?.role === 'gm';
  const availableCharacters =
    session?.role === 'player' && session.characterId
      ? state.characters.filter((character) => character.id === session.characterId)
      : state.characters;

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

  const selectedCharacter =
    availableCharacters.find((character) => character.id === guidedForm.watch('characterId')) || availableCharacters[0] || null;

  useEffect(() => {
    const selectedId = guidedForm.getValues('characterId');
    if (!availableCharacters.some((character) => character.id === selectedId) && availableCharacters[0]) {
      guidedForm.setValue('characterId', availableCharacters[0].id, { shouldValidate: true });
    }
  }, [availableCharacters, guidedForm]);

  return (
    <div className="page-shell pb-8">
      <MesaHero
        eyebrow="Rolagens da mesa"
        title="Console de resolução"
        description="A área de rolagens agora funciona como um módulo operacional: composer forte, feedback rápido e histórico limpo para uso recorrente."
        actions={
          canClearLog ? (
            <Button variant="ghost" onClick={() => void clearLog()}>
              <Trash2 className="size-4" />
              Limpar histórico
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MesaMetricTile label="Entradas" value={state.log.length} hint="Registros recentes no ledger compartilhado da mesa." />
        <MesaMetricTile label="Fichas prontas" value={state.characters.length} hint="Personagens disponíveis para testes guiados." />
        <MesaMetricTile label="Último total" value={lastRoll?.total ?? '--'} hint="Resultado mais recente executado neste console." />
        <MesaMetricTile label="TN presets" value={ROLL_TN_PRESETS.length} hint="Referências rápidas para dificuldades frequentes." />
      </div>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.12fr)_360px]">
        <div className="grid gap-6">
          <Panel className="rounded-3xl p-6 sm:p-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Composer guiado</p>
                <h2 className="mt-2 font-display text-4xl leading-none text-white">Teste de atributo</h2>
              </div>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-soft">
                Composer guiado
              </span>
            </div>

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
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <Field label="Personagem">
                  <Select {...guidedForm.register('characterId')}>
                    {availableCharacters.map((character) => (
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
                <Field label="Bônus extra">
                  <Input type="number" {...guidedForm.register('extraBonus')} />
                </Field>
                <Field label="TN">
                  <Select {...guidedForm.register('tn')}>
                    <option value="">Sem TN</option>
                    {ROLL_TN_PRESETS.map((tn) => (
                      <option key={tn} value={tn}>
                        {tn}
                      </option>
                    ))}
                  </Select>
                </Field>
                <div className="flex items-end">
                  <Button type="submit" disabled={!guidedForm.formState.isValid || guidedForm.formState.isSubmitting} className="w-full">
                    <Target className="size-4" />
                    Rolar atributo
                  </Button>
                </div>
              </div>
            </form>

            {selectedCharacter ? (
              <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {ATTRIBUTE_CONFIG.map((attribute) => (
                  <UtilityPanel key={attribute.key} className="rounded-2xl p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">{attribute.label}</p>
                    <p className="mt-2 text-sm font-semibold text-white">{attributeRankLabel(selectedCharacter, attribute.key)}</p>
                  </UtilityPanel>
                ))}
              </div>
            ) : null}
          </Panel>

          <Panel className="rounded-3xl p-6 sm:p-7">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Composer livre</p>
              <h2 className="mt-2 font-display text-4xl leading-none text-white">Rolagem customizada</h2>
            </div>

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
              <Field label="Rótulo">
                <Input {...customForm.register('label')} />
              </Field>
              <Field label="Expressão">
                <Input {...customForm.register('expression')} />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Bônus">
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

        <div className="grid gap-6">
          <MesaRailCard
            eyebrow="Saída em foco"
            title={lastRoll ? lastRoll.label : 'Aguardando rolagem'}
            description={
              lastRoll
                ? lastRoll.custom
                  ? 'Resultado da rolagem customizada mais recente.'
                  : contextLabel(lastRoll.context || 'standard')
                : 'Faça o primeiro teste para abrir a leitura tática do resultado.'
            }
          >
            {lastRoll ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid gap-3">
                <UtilityPanel className="rounded-2xl p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Total</p>
                  <p className="mt-4 text-6xl font-semibold leading-none text-white">{lastRoll.total}</p>
                </UtilityPanel>
                <div className="grid gap-3 sm:grid-cols-2">
                  <UtilityPanel className="rounded-2xl p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Rolagens</p>
                    <p className="mt-2 text-sm font-semibold text-white">{lastRoll.rolls.join(', ')}</p>
                  </UtilityPanel>
                  <UtilityPanel className="rounded-2xl p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Resultado</p>
                    <p className="mt-2 text-sm font-semibold text-white">{lastRoll.outcomeLabel}</p>
                    <p className="mt-2 text-sm text-soft">
                      {lastRoll.margin === null ? 'Sem TN' : `Margem ${lastRoll.margin >= 0 ? '+' : ''}${lastRoll.margin}`}
                    </p>
                  </UtilityPanel>
                </div>
              </motion.div>
            ) : (
              <EmptyState title="Nenhuma rolagem ainda." body="Faça o primeiro teste para iniciar o console da mesa." />
            )}
          </MesaRailCard>

          <MesaRailCard
            eyebrow="Ledger da mesa"
            title="Histórico recente"
            description="Leitura contínua do que acabou de ser resolvido no fluxo compartilhado da mesa."
          >
            {state.log.length ? (
              state.log.slice(0, 12).map((entry) => (
                <UtilityPanel key={entry.id} className="rounded-2xl p-4">
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
              <EmptyState title="Sem entradas no histórico." body="Assim que as rolagens começarem, o ledger da mesa aparece aqui." />
            )}
          </MesaRailCard>
        </div>
      </section>
    </div>
  );
}
