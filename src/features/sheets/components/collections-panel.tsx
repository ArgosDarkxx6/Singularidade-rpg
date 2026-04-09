import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { SectionTitle } from '@components/shared/section-title';
import { Button } from '@components/ui/button';
import { Card } from '@components/ui/card';
import { EmptyState } from '@components/ui/empty-state';
import { Field, Input, Select, Textarea } from '@components/ui/field';
import { TECHNIQUE_TYPES } from '@lib/domain/constants';
import { formatMoney, parseTags } from '@lib/domain/utils';
import {
  inventoryItemFormSchema,
  passiveFormSchema,
  techniqueFormSchema,
  vowFormSchema,
  weaponFormSchema
} from '@schemas/sheets';
import { searchCanonPresets } from '@features/compendium/data';
import { useWorkspace } from '@features/workspace/use-workspace';
import type { InventoryItem, Passive, Technique, Vow, Weapon } from '@/types/domain';

type WeaponValues = import('zod').infer<typeof weaponFormSchema>;
type TechniqueValues = import('zod').infer<typeof techniqueFormSchema>;
type PassiveValues = import('zod').infer<typeof passiveFormSchema>;
type VowValues = import('zod').infer<typeof vowFormSchema>;
type InventoryValues = import('zod').infer<typeof inventoryItemFormSchema>;

function splitTagText(value: string) {
  return parseTags(value.split(',').map((item) => item.trim()));
}

function ItemCard({
  title,
  subtitle,
  body,
  onEdit,
  onRemove
}: {
  title: string;
  subtitle?: string;
  body: string;
  onEdit: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/4 px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">{title}</p>
          {subtitle ? <p className="mt-1 text-xs uppercase tracking-[0.18em] text-soft">{subtitle}</p> : null}
          <p className="mt-2 text-sm text-soft">{body}</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={onEdit}>
            Editar
          </Button>
          <Button size="sm" variant="danger" onClick={onRemove}>
            Remover
          </Button>
        </div>
      </div>
    </div>
  );
}

export function CollectionsPanel() {
  const { activeCharacter, saveCollectionItem, removeCollectionItem, setInventoryMoney } = useWorkspace();
  const [weaponEditId, setWeaponEditId] = useState<string | null>(null);
  const [techniqueEditId, setTechniqueEditId] = useState<string | null>(null);
  const [passiveEditId, setPassiveEditId] = useState<string | null>(null);
  const [vowEditId, setVowEditId] = useState<string | null>(null);
  const [inventoryEditId, setInventoryEditId] = useState<string | null>(null);
  const [weaponPresetQuery, setWeaponPresetQuery] = useState('');
  const [techniquePresetQuery, setTechniquePresetQuery] = useState('');
  const [passivePresetQuery, setPassivePresetQuery] = useState('');
  const [inventoryPresetQuery, setInventoryPresetQuery] = useState('');

  const weaponForm = useForm<WeaponValues>({
    resolver: zodResolver(weaponFormSchema) as never,
    mode: 'onChange',
    defaultValues: { name: '', grade: 'Grau 4', damage: '', tags: '', description: '' }
  });
  const techniqueForm = useForm<TechniqueValues>({
    resolver: zodResolver(techniqueFormSchema) as never,
    mode: 'onChange',
    defaultValues: { name: '', cost: 0, damage: '', type: 'Ofensiva', tags: '', description: '' }
  });
  const passiveForm = useForm<PassiveValues>({
    resolver: zodResolver(passiveFormSchema) as never,
    mode: 'onChange',
    defaultValues: { name: '', tags: '', description: '' }
  });
  const vowForm = useForm<VowValues>({
    resolver: zodResolver(vowFormSchema) as never,
    mode: 'onChange',
    defaultValues: { name: '', benefit: '', restriction: '', penalty: '' }
  });
  const inventoryForm = useForm<InventoryValues>({
    resolver: zodResolver(inventoryItemFormSchema) as never,
    mode: 'onChange',
    defaultValues: { name: '', quantity: 1, effect: '' }
  });

  const weaponPresets = searchCanonPresets('weapons', weaponPresetQuery).slice(0, 4);
  const techniquePresets = searchCanonPresets('techniques', techniquePresetQuery).slice(0, 4);
  const passivePresets = searchCanonPresets('passives', passivePresetQuery).slice(0, 4);
  const inventoryPresets = searchCanonPresets('inventory', inventoryPresetQuery).slice(0, 4);

  const weaponEditingItem = weaponEditId ? activeCharacter.weapons.find((item) => item.id === weaponEditId) : null;
  const techniqueEditingItem = techniqueEditId ? activeCharacter.techniques.find((item) => item.id === techniqueEditId) : null;
  const passiveEditingItem = passiveEditId ? activeCharacter.passives.find((item) => item.id === passiveEditId) : null;
  const vowEditingItem = vowEditId ? activeCharacter.vows.find((item) => item.id === vowEditId) : null;
  const inventoryEditingItem = inventoryEditId ? activeCharacter.inventory.items.find((item) => item.id === inventoryEditId) : null;

  return (
    <div className="grid gap-6">
      <Card className="p-6">
        <SectionTitle eyebrow="Inventario" title="Dinheiro e itens" description={`Saldo atual ${formatMoney(activeCharacter.inventory.money)}.`} />
        <div className="mt-5 grid gap-4">
          <Field label="Dinheiro">
            <Input type="number" value={activeCharacter.inventory.money} onChange={(event) => setInventoryMoney(activeCharacter.id, Number(event.target.value || 0))} />
          </Field>
          <form
            className="grid gap-4"
            onSubmit={inventoryForm.handleSubmit((values) => {
              saveCollectionItem('inventory', {
                id: inventoryEditingItem?.id || '',
                name: values.name,
                quantity: values.quantity,
                effect: values.effect
              } as InventoryItem);
              inventoryForm.reset({ name: '', quantity: 1, effect: '' });
              setInventoryEditId(null);
              toast.success('Item de inventario salvo.');
            })}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Item">
                <Input {...inventoryForm.register('name')} />
              </Field>
              <Field label="Quantidade">
                <Input type="number" {...inventoryForm.register('quantity')} />
              </Field>
            </div>
            <Field label="Efeito">
              <Textarea {...inventoryForm.register('effect')} />
            </Field>
            <Button type="submit" disabled={!inventoryForm.formState.isValid}>
              {inventoryEditingItem ? 'Atualizar item' : 'Salvar item'}
            </Button>
          </form>
          <Field label="Preset rapido">
            <Input value={inventoryPresetQuery} onChange={(event) => setInventoryPresetQuery(event.target.value)} placeholder="energetico, kit, talisma..." />
          </Field>
          <div className="flex flex-wrap gap-2">
            {inventoryPresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  saveCollectionItem('inventory', { id: '', name: preset.name, quantity: preset.quantity, effect: preset.effect } as InventoryItem);
                  toast.success(`Preset ${preset.name} adicionado.`);
                }}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-soft"
              >
                + {preset.name}
              </button>
            ))}
          </div>
          <div className="grid gap-3">
            {activeCharacter.inventory.items.length ? (
              activeCharacter.inventory.items.map((item) => (
                <ItemCard
                  key={item.id}
                  title={`${item.quantity}x ${item.name}`}
                  body={item.effect}
                  onEdit={() => {
                    setInventoryEditId(item.id);
                    inventoryForm.reset({ name: item.name, quantity: item.quantity, effect: item.effect });
                  }}
                  onRemove={() => removeCollectionItem('inventory', item.id)}
                />
              ))
            ) : (
              <EmptyState title="Inventario vazio." body="Adicione itens utilitarios ou use os presets canônicos." />
            )}
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-6">
          <SectionTitle eyebrow="Arsenal" title="Armas" description="Dano, grau, tags e descrição operacional em um fluxo único." />
          <form
            className="mt-5 grid gap-4"
            onSubmit={weaponForm.handleSubmit((values) => {
              saveCollectionItem('weapons', {
                id: weaponEditingItem?.id || '',
                name: values.name,
                grade: values.grade,
                damage: values.damage,
                tags: splitTagText(values.tags),
                description: values.description
              } as Weapon);
              weaponForm.reset({ name: '', grade: 'Grau 4', damage: '', tags: '', description: '' });
              setWeaponEditId(null);
              toast.success('Arma salva.');
            })}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nome">
                <Input {...weaponForm.register('name')} />
              </Field>
              <Field label="Grau">
                <Input {...weaponForm.register('grade')} />
              </Field>
              <Field label="Dano">
                <Input {...weaponForm.register('damage')} />
              </Field>
              <Field label="Tags">
                <Input placeholder="corte, corpo a corpo" {...weaponForm.register('tags')} />
              </Field>
            </div>
            <Field label="Descricao">
              <Textarea {...weaponForm.register('description')} />
            </Field>
            <Button type="submit" disabled={!weaponForm.formState.isValid}>
              {weaponEditingItem ? 'Atualizar arma' : 'Salvar arma'}
            </Button>
          </form>
          <Field label="Preset rapido" className="mt-5">
            <Input value={weaponPresetQuery} onChange={(event) => setWeaponPresetQuery(event.target.value)} placeholder="katana, corrente..." />
          </Field>
          <div className="mt-3 flex flex-wrap gap-2">
            {weaponPresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  saveCollectionItem('weapons', {
                    id: '',
                    name: preset.name,
                    grade: preset.grade,
                    damage: preset.damage,
                    tags: [...preset.tags],
                    description: preset.description
                  } as Weapon);
                  toast.success(`Preset ${preset.name} adicionado.`);
                }}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-soft"
              >
                + {preset.name}
              </button>
            ))}
          </div>
          <div className="mt-5 grid gap-3">
            {activeCharacter.weapons.length ? (
              activeCharacter.weapons.map((item) => (
                <ItemCard
                  key={item.id}
                  title={item.name}
                  subtitle={`${item.grade} · ${item.damage}`}
                  body={item.description}
                  onEdit={() => {
                    setWeaponEditId(item.id);
                    weaponForm.reset({ name: item.name, grade: item.grade, damage: item.damage, tags: item.tags.join(', '), description: item.description });
                  }}
                  onRemove={() => removeCollectionItem('weapons', item.id)}
                />
              ))
            ) : (
              <EmptyState title="Nenhuma arma cadastrada." body="Use o formulário acima para estruturar o arsenal da ficha." />
            )}
          </div>
        </Card>

        <Card className="p-6">
          <SectionTitle eyebrow="Tecnicas" title="Tecnicas amaldiçoadas" description="Custo, dano, tipo, tags e descrição com presets rápidos da obra." />
          <form
            className="mt-5 grid gap-4"
            onSubmit={techniqueForm.handleSubmit((values) => {
              saveCollectionItem('techniques', {
                id: techniqueEditingItem?.id || '',
                name: values.name,
                cost: values.cost,
                damage: values.damage,
                type: values.type,
                tags: splitTagText(values.tags),
                description: values.description
              } as Technique);
              techniqueForm.reset({ name: '', cost: 0, damage: '', type: 'Ofensiva', tags: '', description: '' });
              setTechniqueEditId(null);
              toast.success('Tecnica salva.');
            })}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nome">
                <Input {...techniqueForm.register('name')} />
              </Field>
              <Field label="Custo">
                <Input type="number" {...techniqueForm.register('cost')} />
              </Field>
              <Field label="Dano">
                <Input {...techniqueForm.register('damage')} />
              </Field>
              <Field label="Tipo">
                <Select {...techniqueForm.register('type')}>
                  {TECHNIQUE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Tags">
              <Input {...techniqueForm.register('tags')} />
            </Field>
            <Field label="Descricao">
              <Textarea {...techniqueForm.register('description')} />
            </Field>
            <Button type="submit" disabled={!techniqueForm.formState.isValid}>
              {techniqueEditingItem ? 'Atualizar tecnica' : 'Salvar tecnica'}
            </Button>
          </form>
          <Field label="Preset rapido" className="mt-5">
            <Input value={techniquePresetQuery} onChange={(event) => setTechniquePresetQuery(event.target.value)} placeholder="revertimento, troca..." />
          </Field>
          <div className="mt-3 flex flex-wrap gap-2">
            {techniquePresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  saveCollectionItem('techniques', {
                    id: '',
                    name: preset.name,
                    cost: preset.cost,
                    damage: preset.damage,
                    type: preset.type as Technique['type'],
                    tags: [...preset.tags],
                    description: preset.description
                  } as Technique);
                  toast.success(`Preset ${preset.name} adicionado.`);
                }}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-soft"
              >
                + {preset.name}
              </button>
            ))}
          </div>
          <div className="mt-5 grid gap-3">
            {activeCharacter.techniques.length ? (
              activeCharacter.techniques.map((item) => (
                <ItemCard
                  key={item.id}
                  title={item.name}
                  subtitle={`${item.type} · Custo ${item.cost} · ${item.damage || 'Sem dano'}`}
                  body={item.description}
                  onEdit={() => {
                    setTechniqueEditId(item.id);
                    techniqueForm.reset({
                      name: item.name,
                      cost: item.cost,
                      damage: item.damage,
                      type: item.type,
                      tags: item.tags.join(', '),
                      description: item.description
                    });
                  }}
                  onRemove={() => removeCollectionItem('techniques', item.id)}
                />
              ))
            ) : (
              <EmptyState title="Nenhuma tecnica cadastrada." body="Cadastre o repertorio amaldiçoado ou use presets rápidos da obra." />
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-6">
          <SectionTitle eyebrow="Passivas" title="Traços constantes" description="Passivas com tags e descrição operacional para leitura rápida de mesa." />
          <form
            className="mt-5 grid gap-4"
            onSubmit={passiveForm.handleSubmit((values) => {
              saveCollectionItem('passives', {
                id: passiveEditingItem?.id || '',
                name: values.name,
                tags: splitTagText(values.tags),
                description: values.description
              } as Passive);
              passiveForm.reset({ name: '', tags: '', description: '' });
              setPassiveEditId(null);
              toast.success('Passiva salva.');
            })}
          >
            <Field label="Nome">
              <Input {...passiveForm.register('name')} />
            </Field>
            <Field label="Tags">
              <Input {...passiveForm.register('tags')} />
            </Field>
            <Field label="Descricao">
              <Textarea {...passiveForm.register('description')} />
            </Field>
            <Button type="submit" disabled={!passiveForm.formState.isValid}>
              {passiveEditingItem ? 'Atualizar passiva' : 'Salvar passiva'}
            </Button>
          </form>
          <Field label="Preset rapido" className="mt-5">
            <Input value={passivePresetQuery} onChange={(event) => setPassivePresetQuery(event.target.value)} placeholder="sensor, energia..." />
          </Field>
          <div className="mt-3 flex flex-wrap gap-2">
            {passivePresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  saveCollectionItem('passives', {
                    id: '',
                    name: preset.name,
                    tags: [...preset.tags],
                    description: preset.description
                  } as Passive);
                  toast.success(`Preset ${preset.name} adicionado.`);
                }}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-soft"
              >
                + {preset.name}
              </button>
            ))}
          </div>
          <div className="mt-5 grid gap-3">
            {activeCharacter.passives.length ? (
              activeCharacter.passives.map((item) => (
                <ItemCard
                  key={item.id}
                  title={item.name}
                  subtitle={item.tags.join(', ')}
                  body={item.description}
                  onEdit={() => {
                    setPassiveEditId(item.id);
                    passiveForm.reset({ name: item.name, tags: item.tags.join(', '), description: item.description });
                  }}
                  onRemove={() => removeCollectionItem('passives', item.id)}
                />
              ))
            ) : (
              <EmptyState title="Sem passivas registradas." body="Cadastre traços permanentes ou puxe presets canônicos." />
            )}
          </div>
        </Card>

        <Card className="p-6">
          <SectionTitle eyebrow="Votos" title="Votos vinculativos" description="Benefício, restrição e penalidade ficam documentados em leitura rápida." />
          <form
            className="mt-5 grid gap-4"
            onSubmit={vowForm.handleSubmit((values) => {
              saveCollectionItem('vows', {
                id: vowEditingItem?.id || '',
                name: values.name,
                benefit: values.benefit,
                restriction: values.restriction,
                penalty: values.penalty
              } as Vow);
              vowForm.reset({ name: '', benefit: '', restriction: '', penalty: '' });
              setVowEditId(null);
              toast.success('Voto salvo.');
            })}
          >
            <Field label="Nome">
              <Input {...vowForm.register('name')} />
            </Field>
            <Field label="Beneficio">
              <Textarea {...vowForm.register('benefit')} />
            </Field>
            <Field label="Restricao">
              <Textarea {...vowForm.register('restriction')} />
            </Field>
            <Field label="Penalidade">
              <Textarea {...vowForm.register('penalty')} />
            </Field>
            <Button type="submit" disabled={!vowForm.formState.isValid}>
              {vowEditingItem ? 'Atualizar voto' : 'Salvar voto'}
            </Button>
          </form>
          <div className="mt-5 grid gap-3">
            {activeCharacter.vows.length ? (
              activeCharacter.vows.map((item) => (
                <ItemCard
                  key={item.id}
                  title={item.name}
                  body={`Beneficio: ${item.benefit} | Restricao: ${item.restriction} | Penalidade: ${item.penalty}`}
                  onEdit={() => {
                    setVowEditId(item.id);
                    vowForm.reset({ name: item.name, benefit: item.benefit, restriction: item.restriction, penalty: item.penalty });
                  }}
                  onRemove={() => removeCollectionItem('vows', item.id)}
                />
              ))
            ) : (
              <EmptyState title="Nenhum voto registrado." body="Cadastre pactos, restrições e ganhos dramáticos desta ficha." />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

