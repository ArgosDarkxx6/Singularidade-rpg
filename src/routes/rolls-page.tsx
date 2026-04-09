import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Dices, Target } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { PageIntro } from '@components/shared/page-intro';
import { SectionTitle } from '@components/shared/section-title';
import { Button } from '@components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@components/ui/card';
import { EmptyState } from '@components/ui/empty-state';
import { Field, Input, Select } from '@components/ui/field';
import { ATTRIBUTE_CONFIG, ROLL_CONTEXTS, ROLL_TN_PRESETS } from '@lib/domain/constants';
import { contextLabel } from '@lib/domain/rules';
import { useSyncView } from '@hooks/use-sync-view';
import { customRollSchema, guidedRollSchema } from '@schemas/rolls';
import { useWorkspace } from '@features/workspace/use-workspace';
import type { AttributeKey, Character } from '@/types/domain';

type GuidedValues = import('zod').infer<typeof guidedRollSchema>;
type CustomValues = import('zod').infer<typeof customRollSchema>;

function getTnValue(value: number | '' | null | undefined) {
  return value === '' ? null : Number(value);
}

function attributeRankLabel(character: Character, attributeKey: AttributeKey) {
  const attribute = character.attributes[attributeKey];
  return `${attribute.value >= 0 ? '+' : ''}${attribute.value} / ${attribute.rank}`;
}

export function RollsPage() {
  useSyncView('rolls');

  const navigate = useNavigate();
  const { state, lastRoll, executeAttributeRoll, executeCustomRoll, clearLog } = useWorkspace();

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
    <div className="page-grid">
      <PageIntro
        eyebrow="Resolucoes e testes"
        title="Rolagens, TN e registro tatico."
        description="Execute testes guiados, rolagens customizadas e acompanhe o historico da sessao em um unico fluxo."
        chips={['d20', 'TN', 'Black Flash', `${state.log.length} entradas de log`]}
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate('/livro?q=Black Flash')}>
              Abrir regra de Black Flash
            </Button>
            <Button variant="ghost" onClick={clearLog}>
              Limpar log
            </Button>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-6">
          <Card className="p-6">
            <SectionTitle
              eyebrow="Fluxo guiado"
              title="Rolagem de atributo"
              description="Escolha o personagem, o atributo, o contexto e a TN. O resumo vai para o log central."
            />

            <form
              className="mt-6 grid gap-4 md:grid-cols-2"
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
              <Field label="Personagem">
                <Select {...guidedForm.register('characterId')}>
                  {state.characters.map((character) => (
                    <option key={character.id} value={character.id}>
                      {character.name}
                    </option>
                  ))}
                </Select>
                {guidedForm.formState.errors.characterId ? <span className="text-xs text-rose-200">{guidedForm.formState.errors.characterId.message}</span> : null}
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
                <Button type="submit" className="w-full" disabled={!guidedForm.formState.isValid || guidedForm.formState.isSubmitting}>
                  <Target className="size-4" />
                  Rolar atributo
                </Button>
              </div>
            </form>

            {selectedCharacter ? (
              <div className="mt-6 grid gap-3 sm:grid-cols-4">
                {ATTRIBUTE_CONFIG.map((attribute) => (
                  <div key={attribute.key} className="rounded-2xl border border-white/10 bg-white/4 px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">{attribute.label}</p>
                    <p className="mt-2 text-sm text-white">{attributeRankLabel(selectedCharacter, attribute.key)}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </Card>

          <Card className="p-6">
            <SectionTitle
              eyebrow="Fluxo livre"
              title="Rolagem customizada"
              description="Para dano, cura, efeito de tecnica e qualquer procedimento fora do d20 base."
            />

            <form
              className="mt-6 grid gap-4 md:grid-cols-2"
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
                {customForm.formState.errors.label ? <span className="text-xs text-rose-200">{customForm.formState.errors.label.message}</span> : null}
              </Field>
              <Field label="Expressao">
                <Input {...customForm.register('expression')} />
                {customForm.formState.errors.expression ? <span className="text-xs text-rose-200">{customForm.formState.errors.expression.message}</span> : null}
              </Field>
              <Field label="Bonus">
                <Input type="number" {...customForm.register('bonus')} />
              </Field>
              <Field label="TN">
                <Input type="number" placeholder="Opcional" {...customForm.register('tn')} />
              </Field>

              <div className="md:col-span-2">
                <Button type="submit" className="w-full" disabled={!customForm.formState.isValid || customForm.formState.isSubmitting}>
                  <Dices className="size-4" />
                  Executar rolagem customizada
                </Button>
              </div>
            </form>
          </Card>
        </div>

        <div className="grid gap-6">
          <Card className="p-6">
            <CardHeader className="mb-0">
              <div>
                <CardTitle>Resumo da ultima rolagem</CardTitle>
                <CardDescription>Feedback rapido com total, margem e marcadores criticos.</CardDescription>
              </div>
            </CardHeader>

            {lastRoll ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-5 rounded-[28px] border border-sky-300/18 bg-sky-500/8 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">{lastRoll.custom ? 'Rolagem customizada' : contextLabel(lastRoll.context || 'standard')}</p>
                    <h3 className="mt-2 font-display text-4xl">{lastRoll.label}</h3>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/6 px-4 py-3 text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Total</p>
                    <p className="mt-2 text-4xl font-semibold">{lastRoll.total}</p>
                  </div>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/4 px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Rolagens</p>
                    <p className="mt-2 text-sm text-soft">{lastRoll.rolls.join(', ')}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/4 px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Resultado</p>
                    <p className="mt-2 text-sm text-soft">{lastRoll.outcomeLabel}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/4 px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Margem</p>
                    <p className="mt-2 text-sm text-soft">{lastRoll.margin === null ? 'Sem TN' : `${lastRoll.margin >= 0 ? '+' : ''}${lastRoll.margin}`}</p>
                  </div>
                </div>

                {lastRoll.notes.length ? (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {lastRoll.notes.map((note) => (
                      <span key={note} className="rounded-full border border-sky-300/20 bg-white/6 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-soft">
                        {note}
                      </span>
                    ))}
                  </div>
                ) : null}
              </motion.div>
            ) : (
              <div className="mt-5">
                <EmptyState title="Nenhuma rolagem registrada." body="Use um dos formulários ao lado para gerar o primeiro resumo desta sessão." />
              </div>
            )}
          </Card>

          <Card className="p-6">
            <SectionTitle
              eyebrow="Historico"
              title="Log operacional"
              description="As ultimas entradas aparecem aqui para facilitar checagem de mesa, confronto e custo."
            />

            <div className="mt-5 grid gap-3">
              {state.log.length ? (
                state.log.slice(0, 10).map((entry) => (
                  <div key={entry.id} className="rounded-2xl border border-white/10 bg-white/4 px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">{entry.category}</p>
                        <h3 className="mt-1 text-sm font-semibold text-white">{entry.title}</h3>
                      </div>
                      <span className="text-[10px] uppercase tracking-[0.18em] text-muted">{new Date(entry.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="mt-3 text-sm text-soft">{entry.text}</p>
                    {entry.meta ? <p className="mt-2 text-xs uppercase tracking-[0.18em] text-sky-200">{entry.meta}</p> : null}
                  </div>
                ))
              ) : (
                <EmptyState title="Sem entradas no log." body="As ações de rolagem e sessão passam a ser registradas assim que você começar a operar a mesa." />
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

