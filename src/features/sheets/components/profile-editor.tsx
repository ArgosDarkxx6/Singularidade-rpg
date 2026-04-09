import { zodResolver } from '@hookform/resolvers/zod';
import { ImagePlus, Upload } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { SectionTitle } from '@components/shared/section-title';
import { Button } from '@components/ui/button';
import { Card } from '@components/ui/card';
import { Field, Input, Select, Textarea } from '@components/ui/field';
import { ATTRIBUTE_CONFIG, GRADE_OPTIONS, RANKS, RESOURCE_LABELS } from '@lib/domain/constants';
import { avatarUrlSchema, characterProfileSchema } from '@schemas/sheets';
import { useWorkspace } from '@features/workspace/use-workspace';
import type { Character } from '@/types/domain';

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

export function CharacterProfileEditor() {
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
    flushPersistence
  } = useWorkspace();

  const profileForm = useForm<CharacterProfileValues>({
    resolver: zodResolver(characterProfileSchema) as never,
    mode: 'onChange',
    defaultValues: profileDefaults(activeCharacter)
  });

  const avatarForm = useForm<AvatarUrlValues>({
    resolver: zodResolver(avatarUrlSchema) as never,
    mode: 'onChange',
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
      <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        <div className="rounded-[28px] border border-white/10 bg-white/4 p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">Avatar e recursos</p>
          <div className="mt-4 overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/40">
            {activeCharacter.avatar ? (
              <img src={activeCharacter.avatar} alt={activeCharacter.name} className="h-72 w-full object-cover" />
            ) : (
              <div className="grid h-72 place-items-center bg-[radial-gradient(circle_at_top,rgba(87,187,255,0.2),transparent_34%),linear-gradient(180deg,rgba(8,17,28,0.95),rgba(5,13,21,1))]">
                <span className="font-display text-5xl text-white/70">{activeCharacter.name.slice(0, 1)}</span>
              </div>
            )}
          </div>

          <form
            className="mt-4 grid gap-3"
            onSubmit={avatarForm.handleSubmit(async (values) => {
              setCharacterAvatar(activeCharacter.id, values.avatarUrl, 'url');
              await flushPersistence();
              toast.success('Avatar por URL atualizado.');
            })}
          >
            <Field label="Avatar por URL">
              <Input placeholder="https://..." {...avatarForm.register('avatarUrl')} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button type="submit" variant="secondary" disabled={!avatarForm.formState.isValid}>
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

          <div className="mt-5 grid gap-3">
            {(['hp', 'energy', 'sanity'] as const).map((resourceKey) => (
              <div key={resourceKey} className="rounded-2xl border border-white/10 bg-slate-950/35 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">{RESOURCE_LABELS[resourceKey]}</p>
                    <p className="mt-1 text-lg font-semibold">
                      {activeCharacter.resources[resourceKey].current}/{activeCharacter.resources[resourceKey].max}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => adjustResource(activeCharacter.id, resourceKey, -1)}>
                      -1
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => adjustResource(activeCharacter.id, resourceKey, 1)}>
                      +1
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <SectionTitle eyebrow="Editor tipado" title="Identidade, recursos e atributos" description="Todos os campos principais da ficha foram concentrados em um único formulário validado." />

          <form
            className="mt-5 grid gap-4"
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

              (Object.entries(attributes) as Array<
                [
                  keyof typeof attributes,
                  readonly [number, Character['attributes'][keyof Character['attributes']]['rank']]
                ]
              >).forEach(([attributeKey, [attributeValue, attributeRank]]) => {
                setAttributeValue(activeCharacter.id, attributeKey, attributeValue);
                setAttributeRank(activeCharacter.id, attributeKey, attributeRank);
              });

              await flushPersistence();
              toast.success('Ficha principal atualizada.');
            })}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nome">
                <Input {...profileForm.register('name')} />
              </Field>
              <Field label="Idade">
                <Input type="number" {...profileForm.register('age')} />
              </Field>
              <Field label="Cla">
                <Input {...profileForm.register('clan')} />
              </Field>
              <Field label="Grau">
                <Select {...profileForm.register('grade')}>
                  {GRADE_OPTIONS.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <Field label="Aparencia">
              <Textarea {...profileForm.register('appearance')} />
            </Field>

            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Cicatriz">
                <Textarea {...profileForm.register('scar')} />
              </Field>
              <Field label="Ancora">
                <Textarea {...profileForm.register('anchor')} />
              </Field>
              <Field label="Gatilho">
                <Textarea {...profileForm.register('trigger')} />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Field label="PV atual">
                <Input type="number" {...profileForm.register('hpCurrent')} />
              </Field>
              <Field label="PV max">
                <Input type="number" {...profileForm.register('hpMax')} />
              </Field>
              <Field label="EA atual">
                <Input type="number" {...profileForm.register('energyCurrent')} />
              </Field>
              <Field label="EA max">
                <Input type="number" {...profileForm.register('energyMax')} />
              </Field>
              <Field label="SAN atual">
                <Input type="number" {...profileForm.register('sanityCurrent')} />
              </Field>
              <Field label="SAN max">
                <Input type="number" {...profileForm.register('sanityMax')} />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {ATTRIBUTE_CONFIG.map((attribute) => (
                <div key={attribute.key} className="rounded-[24px] border border-white/10 bg-white/4 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">{attribute.label}</p>
                  <div className="mt-3 grid grid-cols-[1fr_120px] gap-3">
                    <Input type="number" {...profileForm.register(attribute.key)} />
                    <Select {...profileForm.register(`${attribute.key}Rank`)}>
                      {RANKS.map((rank) => (
                        <option key={rank} value={rank}>
                          {rank}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
              ))}
            </div>

            <Button type="submit" disabled={!profileForm.formState.isValid}>
              Salvar ficha principal
            </Button>
          </form>
        </div>
      </div>
    </Card>
  );
}

