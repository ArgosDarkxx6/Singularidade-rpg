import { zodResolver } from '@hookform/resolvers/zod';
import { Dices, ImagePlus, Upload } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { SectionTitle } from '@components/shared/section-title';
import { Avatar } from '@components/ui/avatar';
import { Button } from '@components/ui/button';
import { Card } from '@components/ui/card';
import { Field, Input, Select, Textarea } from '@components/ui/field';
import { UtilityPanel } from '@components/ui/panel';
import { ATTRIBUTE_CONFIG, GRADE_OPTIONS, RANKS, RESOURCE_LABELS } from '@lib/domain/constants';
import { avatarUrlSchema, characterProfileSchema } from '@schemas/sheets';
import { useWorkspace } from '@features/workspace/use-workspace';
import type { AttributeKey, Character, ResourceKey } from '@/types/domain';

type CharacterProfileValues = import('zod').infer<typeof characterProfileSchema>;
type AvatarUrlValues = import('zod').infer<typeof avatarUrlSchema>;

function profileDefaults(character: Character): CharacterProfileValues {
  return {
    name: character.name,
    age: character.age,
    clan: character.clan,
    grade: character.grade || GRADE_OPTIONS[0],
    appearance: character.appearance,
    scar: character.identity.scar,
    anchor: character.identity.anchor,
    trigger: character.identity.trigger,
    hpCurrent: character.resources.hp.current,
    hpMax: character.resources.hp.max,
    energyCurrent: character.resources.energy.current,
    energyMax: character.resources.energy.max,
    sanityCurrent: character.resources.sanity.current,
    sanityMax: character.resources.sanity.max,
    strength: character.attributes.strength.value,
    resistance: character.attributes.resistance.value,
    dexterity: character.attributes.dexterity.value,
    speed: character.attributes.speed.value,
    fight: character.attributes.fight.value,
    precision: character.attributes.precision.value,
    intelligence: character.attributes.intelligence.value,
    charisma: character.attributes.charisma.value,
    strengthRank: character.attributes.strength.rank,
    resistanceRank: character.attributes.resistance.rank,
    dexterityRank: character.attributes.dexterity.rank,
    speedRank: character.attributes.speed.rank,
    fightRank: character.attributes.fight.rank,
    precisionRank: character.attributes.precision.rank,
    intelligenceRank: character.attributes.intelligence.rank,
    charismaRank: character.attributes.charisma.rank
  };
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <UtilityPanel className="rounded-[18px] px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className="mt-2 text-base font-semibold text-white">{value}</p>
    </UtilityPanel>
  );
}

const resourceToneClass: Record<ResourceKey, string> = {
  hp: 'from-rose-400 via-red-400 to-rose-500',
  energy: 'from-sky-300 via-blue-400 to-cyan-300',
  sanity: 'from-violet-300 via-indigo-400 to-sky-300'
};

function getResourcePercent(resource: Character['resources'][ResourceKey]) {
  if (resource.max <= 0) return 0;
  return Math.min(100, Math.max(0, (resource.current / resource.max) * 100));
}

function ResourceBar({
  resourceKey,
  resource,
  editable,
  onAdjust
}: {
  resourceKey: ResourceKey;
  resource: Character['resources'][ResourceKey];
  editable: boolean;
  onAdjust: (delta: number) => void;
}) {
  const percent = getResourcePercent(resource);

  return (
    <UtilityPanel className="rounded-[20px] p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">{RESOURCE_LABELS[resourceKey]}</p>
            <p className="text-sm font-semibold text-white">
              {resource.current}/{resource.max}
            </p>
          </div>
          <div
            className="mt-3 h-3 overflow-hidden rounded-full border border-white/10 bg-slate-950/70"
            role="progressbar"
            aria-label={`${RESOURCE_LABELS[resourceKey]} ${resource.current} de ${resource.max}`}
            aria-valuemin={0}
            aria-valuemax={Math.max(resource.max, 0)}
            aria-valuenow={Math.max(0, Math.min(resource.current, resource.max))}
          >
            <div className={`h-full rounded-full bg-gradient-to-r ${resourceToneClass[resourceKey]}`} style={{ width: `${percent}%` }} />
          </div>
        </div>
        {editable ? (
          <div className="flex shrink-0 gap-2">
            <Button type="button" size="sm" variant="secondary" onClick={() => onAdjust(-1)}>
              -1
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => onAdjust(1)}>
              +1
            </Button>
          </div>
        ) : null}
      </div>
    </UtilityPanel>
  );
}

function AttributeRollButton({ label, onRoll }: { label: string; onRoll: () => void }) {
  return (
    <Button type="button" size="sm" variant="secondary" className="size-9 rounded-full px-0" onClick={onRoll} aria-label={`Rolar ${label}`}>
      <Dices className="size-4" />
    </Button>
  );
}

export function CharacterProfileEditor({ editable = true }: { editable?: boolean }) {
  const {
    activeCharacter,
    adjustResource,
    updateCharacterField,
    setResourceCurrent,
    setResourceMax,
    setAttributeValue,
    setAttributeRank,
    setCharacterAvatar,
    uploadCharacterAvatar,
    clearCharacterAvatar,
    executeAttributeRoll,
    flushPersistence
  } = useWorkspace();

  const rollAttribute = (attributeKey: AttributeKey) => {
    const result = executeAttributeRoll({
      characterId: activeCharacter.id,
      attributeKey,
      context: 'standard',
      extraBonus: 0,
      tn: null
    });

    if (result) {
      toast.success(`${result.attributeLabel}: ${result.total}`);
    }
  };

  const profileForm = useForm<CharacterProfileValues>({
    resolver: zodResolver(characterProfileSchema) as never,
    mode: 'onBlur',
    defaultValues: profileDefaults(activeCharacter)
  });

  const avatarForm = useForm<AvatarUrlValues>({
    resolver: zodResolver(avatarUrlSchema) as never,
    mode: 'onBlur',
    defaultValues: {
      avatarUrl: activeCharacter.avatarMode === 'url' ? activeCharacter.avatar : ''
    }
  });

  useEffect(() => {
    profileForm.reset(profileDefaults(activeCharacter));
    avatarForm.reset({
      avatarUrl: activeCharacter.avatarMode === 'url' ? activeCharacter.avatar : ''
    });
  }, [activeCharacter, avatarForm, profileForm]);

  return (
    <Card className="p-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(260px,0.42fr)_minmax(0,1fr)]">
        <div className="grid gap-4">
          <UtilityPanel className="rounded-[26px] p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">Avatar & recursos</p>
            <div className="mt-4 flex items-start gap-4">
              <Avatar src={activeCharacter.avatar || undefined} name={activeCharacter.name} size="lg" className="size-24 rounded-[24px]" />
              <div className="min-w-0">
                <p className="text-2xl font-semibold text-white">{activeCharacter.name}</p>
                <p className="mt-1 text-sm text-soft">
                  {activeCharacter.clan || 'Sem clã'} · {activeCharacter.grade || 'Sem grau'}
                </p>
              </div>
            </div>

            {editable ? (
              <form
                className="mt-5 grid gap-3"
                onSubmit={avatarForm.handleSubmit(async (values) => {
                  setCharacterAvatar(activeCharacter.id, values.avatarUrl, 'url');
                  await flushPersistence();
                  toast.success('Avatar por URL atualizado.');
                })}
              >
                <Field label="Avatar por URL" error={avatarForm.formState.errors.avatarUrl?.message}>
                  <Input autoComplete="off" placeholder="https://…" {...avatarForm.register('avatarUrl')} />
                </Field>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button type="submit" variant="secondary" disabled={avatarForm.formState.isSubmitting}>
                    <ImagePlus className="size-4" />
                    Aplicar URL
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={async () => {
                      const picker = document.createElement('input');
                      picker.type = 'file';
                      picker.accept = 'image/*';
                      picker.onchange = async () => {
                        const file = picker.files?.[0];
                        if (!file) return;
                        await uploadCharacterAvatar(activeCharacter.id, file);
                        await flushPersistence();
                        toast.success('Avatar local aplicado.');
                      };
                      picker.click();
                    }}
                  >
                    <Upload className="size-4" />
                    Upload
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={async () => {
                    clearCharacterAvatar(activeCharacter.id);
                    await flushPersistence();
                  }}
                >
                  Remover avatar
                </Button>
              </form>
            ) : null}
          </UtilityPanel>

          {(['hp', 'energy', 'sanity'] as const).map((resourceKey) => (
            <ResourceBar
              key={resourceKey}
              resourceKey={resourceKey}
              resource={activeCharacter.resources[resourceKey]}
              editable={editable}
              onAdjust={(delta) => adjustResource(activeCharacter.id, resourceKey, delta)}
            />
          ))}
        </div>

        <div className="grid gap-6">
          <SectionTitle
            eyebrow="Sobre o personagem"
            title="Identidade, recursos & atributos"
            description="A ficha principal concentra leitura natural de personagem, recursos centrais e os atributos em uma sequência contínua."
            actions={
              editable ? (
                <Button onClick={profileForm.handleSubmit(async (values) => {
                  updateCharacterField(activeCharacter.id, 'name', values.name);
                  updateCharacterField(activeCharacter.id, 'age', values.age);
                  updateCharacterField(activeCharacter.id, 'clan', values.clan);
                  updateCharacterField(activeCharacter.id, 'grade', values.grade);
                  updateCharacterField(activeCharacter.id, 'appearance', values.appearance);
                  updateCharacterField(activeCharacter.id, 'identity.scar', values.scar);
                  updateCharacterField(activeCharacter.id, 'identity.anchor', values.anchor);
                  updateCharacterField(activeCharacter.id, 'identity.trigger', values.trigger);

                  setResourceCurrent(activeCharacter.id, 'hp', values.hpCurrent);
                  setResourceMax(activeCharacter.id, 'hp', values.hpMax);
                  setResourceCurrent(activeCharacter.id, 'energy', values.energyCurrent);
                  setResourceMax(activeCharacter.id, 'energy', values.energyMax);
                  setResourceCurrent(activeCharacter.id, 'sanity', values.sanityCurrent);
                  setResourceMax(activeCharacter.id, 'sanity', values.sanityMax);

                  const attributes = {
                    strength: [values.strength, values.strengthRank],
                    resistance: [values.resistance, values.resistanceRank],
                    dexterity: [values.dexterity, values.dexterityRank],
                    speed: [values.speed, values.speedRank],
                    fight: [values.fight, values.fightRank],
                    precision: [values.precision, values.precisionRank],
                    intelligence: [values.intelligence, values.intelligenceRank],
                    charisma: [values.charisma, values.charismaRank]
                  } as const;

                  (
                    Object.entries(attributes) as Array<
                      [
                        keyof typeof attributes,
                        readonly [number, Character['attributes'][keyof Character['attributes']]['rank']]
                      ]
                    >
                  ).forEach(([attributeKey, [attributeValue, attributeRank]]) => {
                    setAttributeValue(activeCharacter.id, attributeKey, attributeValue);
                    setAttributeRank(activeCharacter.id, attributeKey, attributeRank);
                  });

                  await flushPersistence();
                  toast.success('Ficha principal atualizada.');
                })} disabled={profileForm.formState.isSubmitting}>
                  Salvar ficha principal
                </Button>
              ) : undefined
            }
          />

          {editable ? (
            <form
              className="grid gap-6"
              onSubmit={profileForm.handleSubmit(async (values) => {
                updateCharacterField(activeCharacter.id, 'name', values.name);
                updateCharacterField(activeCharacter.id, 'age', values.age);
                updateCharacterField(activeCharacter.id, 'clan', values.clan);
                updateCharacterField(activeCharacter.id, 'grade', values.grade);
                updateCharacterField(activeCharacter.id, 'appearance', values.appearance);
                updateCharacterField(activeCharacter.id, 'identity.scar', values.scar);
                updateCharacterField(activeCharacter.id, 'identity.anchor', values.anchor);
                updateCharacterField(activeCharacter.id, 'identity.trigger', values.trigger);

                setResourceCurrent(activeCharacter.id, 'hp', values.hpCurrent);
                setResourceMax(activeCharacter.id, 'hp', values.hpMax);
                setResourceCurrent(activeCharacter.id, 'energy', values.energyCurrent);
                setResourceMax(activeCharacter.id, 'energy', values.energyMax);
                setResourceCurrent(activeCharacter.id, 'sanity', values.sanityCurrent);
                setResourceMax(activeCharacter.id, 'sanity', values.sanityMax);

                const attributes = {
                  strength: [values.strength, values.strengthRank],
                  resistance: [values.resistance, values.resistanceRank],
                  dexterity: [values.dexterity, values.dexterityRank],
                  speed: [values.speed, values.speedRank],
                  fight: [values.fight, values.fightRank],
                  precision: [values.precision, values.precisionRank],
                  intelligence: [values.intelligence, values.intelligenceRank],
                  charisma: [values.charisma, values.charismaRank]
                } as const;

                (
                  Object.entries(attributes) as Array<
                    [
                      keyof typeof attributes,
                      readonly [number, Character['attributes'][keyof Character['attributes']]['rank']]
                    ]
                  >
                ).forEach(([attributeKey, [attributeValue, attributeRank]]) => {
                  setAttributeValue(activeCharacter.id, attributeKey, attributeValue);
                  setAttributeRank(activeCharacter.id, attributeKey, attributeRank);
                });

                await flushPersistence();
                toast.success('Ficha principal atualizada.');
              })}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Nome" error={profileForm.formState.errors.name?.message}>
                  <Input autoComplete="off" {...profileForm.register('name')} />
                </Field>
                <Field label="Idade" error={profileForm.formState.errors.age?.message}>
                  <Input type="number" {...profileForm.register('age')} />
                </Field>
                <Field label="Clã" error={profileForm.formState.errors.clan?.message}>
                  <Input autoComplete="off" {...profileForm.register('clan')} />
                </Field>
                <Field label="Grau" error={profileForm.formState.errors.grade?.message}>
                  <Select {...profileForm.register('grade')}>
                    {GRADE_OPTIONS.map((grade) => (
                      <option key={grade} value={grade}>
                        {grade}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              <Field label="Aparência" error={profileForm.formState.errors.appearance?.message}>
                <Textarea {...profileForm.register('appearance')} placeholder="Traços físicos, marcas e impressão geral em cena…" />
              </Field>

              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Cicatriz" error={profileForm.formState.errors.scar?.message}>
                  <Textarea {...profileForm.register('scar')} placeholder="Marca, ferida ou memória visível…" />
                </Field>
                <Field label="Âncora" error={profileForm.formState.errors.anchor?.message}>
                  <Textarea {...profileForm.register('anchor')} placeholder="Ponto emocional, crença ou vínculo…" />
                </Field>
                <Field label="Gatilho" error={profileForm.formState.errors.trigger?.message}>
                  <Textarea {...profileForm.register('trigger')} placeholder="O que puxa esse personagem além do normal…" />
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Field label="PV atual">
                  <Input type="number" {...profileForm.register('hpCurrent')} />
                </Field>
                <Field label="PV máximo">
                  <Input type="number" {...profileForm.register('hpMax')} />
                </Field>
                <Field label="EA atual">
                  <Input type="number" {...profileForm.register('energyCurrent')} />
                </Field>
                <Field label="EA máximo">
                  <Input type="number" {...profileForm.register('energyMax')} />
                </Field>
                <Field label="SAN atual">
                  <Input type="number" {...profileForm.register('sanityCurrent')} />
                </Field>
                <Field label="SAN máximo">
                  <Input type="number" {...profileForm.register('sanityMax')} />
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {ATTRIBUTE_CONFIG.map((attribute) => (
                  <UtilityPanel key={attribute.key} className="rounded-[22px] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">{attribute.label}</p>
                      <AttributeRollButton label={attribute.label} onRoll={() => rollAttribute(attribute.key)} />
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_110px]">
                      <Input type="number" {...profileForm.register(attribute.key)} />
                      <Select {...profileForm.register(`${attribute.key}Rank`)}>
                        {RANKS.map((rank) => (
                          <option key={rank} value={rank}>
                            {rank}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </UtilityPanel>
                ))}
              </div>
            </form>
          ) : (
            <div className="grid gap-6">
              <UtilityPanel className="rounded-[22px] p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Descrição</p>
                <p className="mt-3 text-sm leading-7 text-soft">{activeCharacter.appearance || 'Sem descrição visual cadastrada.'}</p>
              </UtilityPanel>

              <div className="grid gap-4 md:grid-cols-3">
                <SummaryMetric label="Clã" value={activeCharacter.clan || 'Sem clã'} />
                <SummaryMetric label="Grau" value={activeCharacter.grade || 'Sem grau'} />
                <SummaryMetric label="Idade" value={`${activeCharacter.age} anos`} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <SummaryMetric label="Cicatriz" value={activeCharacter.identity.scar || 'Sem registro'} />
                <SummaryMetric label="Âncora" value={activeCharacter.identity.anchor || 'Sem registro'} />
                <SummaryMetric label="Gatilho" value={activeCharacter.identity.trigger || 'Sem registro'} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {ATTRIBUTE_CONFIG.map((attribute) => (
                  <UtilityPanel key={attribute.key} className="rounded-[22px] px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">{attribute.label}</p>
                        <p className="mt-1 text-sm font-semibold text-white">
                          {activeCharacter.attributes[attribute.key].value} · {activeCharacter.attributes[attribute.key].rank}
                        </p>
                      </div>
                      <AttributeRollButton label={attribute.label} onRoll={() => rollAttribute(attribute.key)} />
                    </div>
                  </UtilityPanel>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
