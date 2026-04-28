import { zodResolver } from '@hookform/resolvers/zod';
import { Dices, Target, Trash2 } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@components/ui/button';
import { EmptyState } from '@components/ui/empty-state';
import { Field, Input, Select } from '@components/ui/field';
import { UtilityPanel } from '@components/ui/panel';
import { MesaActionCard, MesaKeyValueRow, MesaLeadMeta, MesaPageLead, MesaSectionPanel } from '@features/mesa/components/mesa-page-primitives';
import { useMesaRolls } from '@features/workspace/hooks/use-workspace-segments';
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
  const { state, lastRoll, executeAttributeRoll, executeCustomRoll, clearLog, online } = useMesaRolls();
  const session = online.session;
  const canClearLog = session?.role === 'gm';
  const availableCharacters =
    session?.role === 'player' && session.characterId
      ? state.characters.filter((character) => character.id === session.characterId)
      : state.characters;
  const canRoll = session?.role === 'gm' || availableCharacters.length > 0;

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
      <MesaPageLead
        eyebrow="Rolagens"
        title="Rolagens"
        meta={
          <>
            <MesaLeadMeta label="Entradas" value={state.log.length} accent />
            <MesaLeadMeta label="Fichas" value={availableCharacters.length} />
            <MesaLeadMeta label="Último total" value={lastRoll?.total ?? '--'} />
          </>
        }
        actions={
          canClearLog ? (
            <Button variant="ghost" onClick={() => void clearLog()}>
              <Trash2 className="size-4" />
              Limpar histórico
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_360px]">
        <div className="grid gap-4">
          <MesaSectionPanel eyebrow="Teste" title="Atributo">
            {availableCharacters.length ? (
              <>
                <form
                  className="grid gap-4"
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
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    {ATTRIBUTE_CONFIG.map((attribute) => (
                      <MesaKeyValueRow
                        key={attribute.key}
                        label={attribute.label}
                        value={attributeRankLabel(selectedCharacter, attribute.key)}
                      />
                    ))}
                  </div>
                ) : null}
              </>
            ) : (
              <EmptyState
                title="Nenhuma ficha disponível para rolagem."
                body="Vincule uma ficha para rolar atributos."
              />
            )}
          </MesaSectionPanel>

          <MesaSectionPanel eyebrow="Teste" title="Livre">
            <form
              className="grid gap-4"
              onSubmit={customForm.handleSubmit((values) => {
                if (!canRoll) return;
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
              <Button type="submit" disabled={!canRoll || !customForm.formState.isValid || customForm.formState.isSubmitting}>
                <Dices className="size-4" />
                Rolar dados
              </Button>
            </form>
          </MesaSectionPanel>
        </div>

        <div className="grid gap-4">
          <MesaSectionPanel eyebrow="Último resultado" title={lastRoll ? lastRoll.label : 'Aguardando rolagem'}>
            {lastRoll ? (
              <>
                <MesaActionCard
                  title={`Total ${lastRoll.total}`}
                  description={
                    lastRoll.margin === null
                      ? lastRoll.outcomeLabel
                      : `${lastRoll.outcomeLabel} · margem ${lastRoll.margin >= 0 ? '+' : ''}${lastRoll.margin}`
                  }
                  icon={<Dices className="size-4" />}
                />
                <div className="grid gap-3">
                  <MesaKeyValueRow label="Rolagens" value={lastRoll.rolls.join(', ')} />
                  <MesaKeyValueRow label="TN" value={lastRoll.tn ?? 'Sem TN'} helper={lastRoll.custom ? 'Rolagem customizada' : contextLabel(lastRoll.context || 'standard')} />
                </div>
              </>
            ) : (
              <EmptyState title="Nenhuma rolagem ainda." body="Role os dados para começar." />
            )}
          </MesaSectionPanel>

          <MesaSectionPanel eyebrow="Log" title="Histórico">
            {state.log.length ? (
              state.log.slice(0, 12).map((entry) => (
                <UtilityPanel key={entry.id} className="rounded-[9px] px-3.5 py-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">{entry.category}</p>
                      <p className="mt-1.5 text-sm font-semibold text-white">{entry.title}</p>
                    </div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-muted">
                      {new Date(entry.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-soft">{entry.text}</p>
                  {entry.meta ? <p className="mt-2 text-xs uppercase tracking-[0.18em] text-sky-200">{entry.meta}</p> : null}
                </UtilityPanel>
              ))
            ) : (
              <EmptyState title="Sem entradas no histórico." body="As rolagens da mesa aparecem aqui." />
            )}
          </MesaSectionPanel>
        </div>
      </div>
    </div>
  );
}
