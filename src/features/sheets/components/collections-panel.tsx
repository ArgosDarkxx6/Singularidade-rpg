import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { SectionTitle } from '@components/shared/section-title';
import { Button } from '@components/ui/button';
import { Card } from '@components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@components/ui/dialog';
import { EmptyState } from '@components/ui/empty-state';
import { Field, Input, Select, Textarea } from '@components/ui/field';
import { UtilityPanel } from '@components/ui/panel';
import { TECHNIQUE_TYPES } from '@lib/domain/constants';
import { formatMoney, parseTags } from '@lib/domain/utils';
import { inventoryItemFormSchema, passiveFormSchema, techniqueFormSchema, vowFormSchema, weaponFormSchema } from '@schemas/sheets';
import { useWorkspace } from '@features/workspace/use-workspace';
import type { InventoryItem, Passive, Technique, Vow, Weapon } from '@/types/domain';

type CollectionsSection = 'all' | 'arsenal' | 'tecnicas' | 'inventario';
type WeaponValues = import('zod').infer<typeof weaponFormSchema>;
type TechniqueValues = import('zod').infer<typeof techniqueFormSchema>;
type PassiveValues = import('zod').infer<typeof passiveFormSchema>;
type VowValues = import('zod').infer<typeof vowFormSchema>;
type InventoryValues = import('zod').infer<typeof inventoryItemFormSchema>;

function splitTagText(value: string) {
  return parseTags(value.split(',').map((item) => item.trim()));
}

function DialogHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <>
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">{eyebrow}</p>
      <DialogTitle className="mt-2 font-display text-2xl font-semibold leading-tight text-white">{title}</DialogTitle>
      <DialogDescription className="mt-3 text-sm leading-6 text-soft">{description}</DialogDescription>
    </>
  );
}

function ItemCard({
  title,
  subtitle,
  body,
  editable,
  onEdit,
  onRemove
}: {
  title: string;
  subtitle?: string;
  body: string;
  editable: boolean;
  onEdit: () => void;
  onRemove: () => void;
}) {
  return (
    <UtilityPanel className="rounded-lg p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-lg font-semibold text-white">{title}</p>
          {subtitle ? <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">{subtitle}</p> : null}
          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-soft">{body}</p>
        </div>
        {editable ? (
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={onEdit}>
              Editar
            </Button>
            <Button size="sm" variant="danger" onClick={onRemove}>
              Remover
            </Button>
          </div>
        ) : null}
      </div>
    </UtilityPanel>
  );
}

export function CollectionsPanel({ section = 'all', editable = true }: { section?: CollectionsSection; editable?: boolean }) {
  const { activeCharacter, saveCollectionItem, removeCollectionItem, setInventoryMoney, flushPersistence } = useWorkspace();
  const [dialog, setDialog] = useState<null | 'weapon' | 'technique' | 'passive' | 'vow' | 'inventory'>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const showInventory = section === 'all' || section === 'inventario';
  const showArsenal = section === 'all' || section === 'arsenal';
  const showTechniques = section === 'all' || section === 'tecnicas';
  const showSupport = section === 'all' || section === 'arsenal';

  const weaponItem = editId ? activeCharacter.weapons.find((item) => item.id === editId) : null;
  const techniqueItem = editId ? activeCharacter.techniques.find((item) => item.id === editId) : null;
  const passiveItem = editId ? activeCharacter.passives.find((item) => item.id === editId) : null;
  const vowItem = editId ? activeCharacter.vows.find((item) => item.id === editId) : null;
  const inventoryItem = editId ? activeCharacter.inventory.items.find((item) => item.id === editId) : null;

  const weaponForm = useForm<WeaponValues>({ resolver: zodResolver(weaponFormSchema) as never, mode: 'onBlur', defaultValues: { id: '', name: '', grade: 'Grau 4', damage: '', tags: '', description: '' } });
  const techniqueForm = useForm<TechniqueValues>({ resolver: zodResolver(techniqueFormSchema) as never, mode: 'onBlur', defaultValues: { id: '', name: '', cost: 0, damage: '', type: 'Ofensiva', tags: '', description: '' } });
  const passiveForm = useForm<PassiveValues>({ resolver: zodResolver(passiveFormSchema) as never, mode: 'onBlur', defaultValues: { id: '', name: '', tags: '', description: '' } });
  const vowForm = useForm<VowValues>({ resolver: zodResolver(vowFormSchema) as never, mode: 'onBlur', defaultValues: { id: '', name: '', benefit: '', restriction: '', penalty: '' } });
  const inventoryForm = useForm<InventoryValues>({ resolver: zodResolver(inventoryItemFormSchema) as never, mode: 'onBlur', defaultValues: { id: '', name: '', quantity: 1, effect: '' } });

  const openDialog = (kind: NonNullable<typeof dialog>, item?: Weapon | Technique | Passive | Vow | InventoryItem) => {
    setEditId(item?.id || null);

    switch (kind) {
      case 'weapon': {
        const nextItem = item as Weapon | undefined;
        weaponForm.reset({
          id: nextItem?.id || '',
          name: nextItem?.name || '',
          grade: nextItem?.grade || 'Grau 4',
          damage: nextItem?.damage || '',
          tags: nextItem?.tags.join(', ') || '',
          description: nextItem?.description || ''
        });
        break;
      }
      case 'technique': {
        const nextItem = item as Technique | undefined;
        techniqueForm.reset({
          id: nextItem?.id || '',
          name: nextItem?.name || '',
          cost: nextItem?.cost || 0,
          damage: nextItem?.damage || '',
          type: nextItem?.type || 'Ofensiva',
          tags: nextItem?.tags.join(', ') || '',
          description: nextItem?.description || ''
        });
        break;
      }
      case 'passive': {
        const nextItem = item as Passive | undefined;
        passiveForm.reset({
          id: nextItem?.id || '',
          name: nextItem?.name || '',
          tags: nextItem?.tags.join(', ') || '',
          description: nextItem?.description || ''
        });
        break;
      }
      case 'vow': {
        const nextItem = item as Vow | undefined;
        vowForm.reset({
          id: nextItem?.id || '',
          name: nextItem?.name || '',
          benefit: nextItem?.benefit || '',
          restriction: nextItem?.restriction || '',
          penalty: nextItem?.penalty || ''
        });
        break;
      }
      case 'inventory': {
        const nextItem = item as InventoryItem | undefined;
        inventoryForm.reset({
          id: nextItem?.id || '',
          name: nextItem?.name || '',
          quantity: nextItem?.quantity || 1,
          effect: nextItem?.effect || ''
        });
        break;
      }
      default:
        break;
    }

    setDialog(kind);
  };

  return (
    <div className="grid gap-4">
      {showInventory ? (
        <Card className="p-4">
          <SectionTitle eyebrow="Itens e recursos" title="Inventário" actions={editable ? <Button variant="secondary" onClick={() => openDialog('inventory')}><Plus className="size-4" />Adicionar item</Button> : undefined} />
          <div className="mt-4 grid gap-3">
            <UtilityPanel className="rounded-lg p-3.5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Dinheiro disponível</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{formatMoney(activeCharacter.inventory.money)}</p>
                </div>
                {editable ? <div className="w-full max-w-[220px]"><Input type="number" defaultValue={activeCharacter.inventory.money} onBlur={async (event) => { setInventoryMoney(activeCharacter.id, Number(event.target.value || 0)); await flushPersistence(); toast.success('Recursos da ficha atualizados.'); }} /></div> : null}
              </div>
            </UtilityPanel>
            {activeCharacter.inventory.items.length ? activeCharacter.inventory.items.map((item) => <ItemCard key={item.id} title={`${item.quantity}× ${item.name}`} body={item.effect} editable={editable} onEdit={() => openDialog('inventory', item)} onRemove={() => removeCollectionItem('inventory', item.id)} />) : <EmptyState title="Inventário vazio." body="Adicione itens utilitários, consumíveis ou objetos importantes da campanha." />}
          </div>
        </Card>
      ) : null}

      {showArsenal || showTechniques ? <div className="grid gap-4 xl:grid-cols-2">
        {showArsenal ? <Card className="p-4"><SectionTitle eyebrow="Armas" title="Arsenal" actions={editable ? <Button variant="secondary" onClick={() => openDialog('weapon')}><Plus className="size-4" />Adicionar arma</Button> : undefined} /><div className="mt-4 grid gap-3">{activeCharacter.weapons.length ? activeCharacter.weapons.map((item) => <ItemCard key={item.id} title={item.name} subtitle={`${item.grade} · ${item.damage}`} body={item.description} editable={editable} onEdit={() => openDialog('weapon', item)} onRemove={() => removeCollectionItem('weapons', item.id)} />) : <EmptyState title="Nenhuma arma cadastrada." body="Cadastre a primeira arma do personagem." />}</div></Card> : null}
        {showTechniques ? <Card className="p-4"><SectionTitle eyebrow="Técnica amaldiçoada" title="Técnicas" actions={editable ? <Button variant="secondary" onClick={() => openDialog('technique')}><Plus className="size-4" />Adicionar técnica</Button> : undefined} /><div className="mt-4 grid gap-3">{activeCharacter.techniques.length ? activeCharacter.techniques.map((item) => <ItemCard key={item.id} title={item.name} subtitle={`${item.type} · custo ${item.cost}${item.damage ? ` · ${item.damage}` : ''}`} body={item.description} editable={editable} onEdit={() => openDialog('technique', item)} onRemove={() => removeCollectionItem('techniques', item.id)} />) : <EmptyState title="Nenhuma técnica cadastrada." body="Cadastre a primeira técnica da ficha." />}</div></Card> : null}
      </div> : null}

      {showSupport ? <div className="grid gap-4 xl:grid-cols-2">
        <Card className="p-4"><SectionTitle eyebrow="Passivas" title="Traços constantes" actions={editable ? <Button variant="secondary" onClick={() => openDialog('passive')}><Plus className="size-4" />Adicionar passiva</Button> : undefined} /><div className="mt-4 grid gap-3">{activeCharacter.passives.length ? activeCharacter.passives.map((item) => <ItemCard key={item.id} title={item.name} body={item.description} editable={editable} onEdit={() => openDialog('passive', item)} onRemove={() => removeCollectionItem('passives', item.id)} />) : <EmptyState title="Sem passivas registradas." body="Adicione talentos e efeitos permanentes da ficha." />}</div></Card>
        <Card className="p-4"><SectionTitle eyebrow="Votos vinculativos" title="Votos" actions={editable ? <Button variant="secondary" onClick={() => openDialog('vow')}><Plus className="size-4" />Adicionar voto</Button> : undefined} /><div className="mt-4 grid gap-3">{activeCharacter.vows.length ? activeCharacter.vows.map((item) => <ItemCard key={item.id} title={item.name} subtitle={`Restrição: ${item.restriction || 'Sem restrição'}`} body={`Benefício: ${item.benefit}\nPenalidade: ${item.penalty || 'Sem penalidade'}`} editable={editable} onEdit={() => openDialog('vow', item)} onRemove={() => removeCollectionItem('vows', item.id)} />) : <EmptyState title="Nenhum voto registrado." body="Adicione um voto quando houver pacto ou condição ativa." />}</div></Card>
      </div> : null}

      <Dialog open={dialog === 'weapon'} onOpenChange={(open) => setDialog(open ? 'weapon' : null)}><DialogContent><DialogHeader eyebrow="Arsenal" title={weaponItem ? 'Editar arma' : 'Adicionar arma'} description="Cadastre nome, grau, dano e descrição." /><form className="mt-6 grid gap-4" onSubmit={weaponForm.handleSubmit(async (values) => { saveCollectionItem('weapons', { id: values.id || weaponItem?.id || '', name: values.name, grade: values.grade, damage: values.damage, tags: splitTagText(values.tags), description: values.description } as Weapon); await flushPersistence(); setDialog(null); toast.success('Arma salva.'); })}><div className="grid gap-4 md:grid-cols-2"><Field label="Nome" error={weaponForm.formState.errors.name?.message}><Input autoComplete="off" {...weaponForm.register('name')} /></Field><Field label="Grau" error={weaponForm.formState.errors.grade?.message}><Input autoComplete="off" {...weaponForm.register('grade')} /></Field><Field label="Dano" error={weaponForm.formState.errors.damage?.message}><Input autoComplete="off" {...weaponForm.register('damage')} /></Field><Field label="Tags"><Input autoComplete="off" placeholder="Corte, corrente, corpo a corpo…" {...weaponForm.register('tags')} /></Field></div><Field label="Descrição" error={weaponForm.formState.errors.description?.message}><Textarea {...weaponForm.register('description')} /></Field><div className="flex flex-wrap gap-2"><Button type="submit" disabled={weaponForm.formState.isSubmitting}>Salvar arma</Button><Button type="button" variant="secondary" onClick={() => setDialog(null)}>Cancelar</Button></div></form></DialogContent></Dialog>

      <Dialog open={dialog === 'technique'} onOpenChange={(open) => setDialog(open ? 'technique' : null)}><DialogContent><DialogHeader eyebrow="Técnica amaldiçoada" title={techniqueItem ? 'Editar técnica' : 'Adicionar técnica'} description="Cadastre custo, tipo, dano e descrição." /><form className="mt-6 grid gap-4" onSubmit={techniqueForm.handleSubmit(async (values) => { saveCollectionItem('techniques', { id: values.id || techniqueItem?.id || '', name: values.name, cost: values.cost, damage: values.damage, type: values.type, tags: splitTagText(values.tags), description: values.description } as Technique); await flushPersistence(); setDialog(null); toast.success('Técnica salva.'); })}><div className="grid gap-4 md:grid-cols-2"><Field label="Nome" error={techniqueForm.formState.errors.name?.message}><Input autoComplete="off" {...techniqueForm.register('name')} /></Field><Field label="Custo"><Input type="number" {...techniqueForm.register('cost')} /></Field><Field label="Dano"><Input autoComplete="off" {...techniqueForm.register('damage')} /></Field><Field label="Tipo"><Select {...techniqueForm.register('type')}>{TECHNIQUE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}</Select></Field></div><Field label="Tags"><Input autoComplete="off" placeholder="Suporte, troca, explosão…" {...techniqueForm.register('tags')} /></Field><Field label="Descrição" error={techniqueForm.formState.errors.description?.message}><Textarea {...techniqueForm.register('description')} /></Field><div className="flex flex-wrap gap-2"><Button type="submit" disabled={techniqueForm.formState.isSubmitting}>Salvar técnica</Button><Button type="button" variant="secondary" onClick={() => setDialog(null)}>Cancelar</Button></div></form></DialogContent></Dialog>

      <Dialog open={dialog === 'passive'} onOpenChange={(open) => setDialog(open ? 'passive' : null)}><DialogContent><DialogHeader eyebrow="Passiva" title={passiveItem ? 'Editar passiva' : 'Adicionar passiva'} description="Cadastre nome, tags e descrição." /><form className="mt-6 grid gap-4" onSubmit={passiveForm.handleSubmit(async (values) => { saveCollectionItem('passives', { id: values.id || passiveItem?.id || '', name: values.name, tags: splitTagText(values.tags), description: values.description } as Passive); await flushPersistence(); setDialog(null); toast.success('Passiva salva.'); })}><Field label="Nome" error={passiveForm.formState.errors.name?.message}><Input autoComplete="off" {...passiveForm.register('name')} /></Field><Field label="Tags"><Input autoComplete="off" {...passiveForm.register('tags')} /></Field><Field label="Descrição" error={passiveForm.formState.errors.description?.message}><Textarea {...passiveForm.register('description')} /></Field><div className="flex flex-wrap gap-2"><Button type="submit" disabled={passiveForm.formState.isSubmitting}>Salvar passiva</Button><Button type="button" variant="secondary" onClick={() => setDialog(null)}>Cancelar</Button></div></form></DialogContent></Dialog>

      <Dialog open={dialog === 'vow'} onOpenChange={(open) => setDialog(open ? 'vow' : null)}><DialogContent><DialogHeader eyebrow="Voto vinculativo" title={vowItem ? 'Editar voto' : 'Adicionar voto'} description="Cadastre benefício, restrição e penalidade." /><form className="mt-6 grid gap-4" onSubmit={vowForm.handleSubmit(async (values) => { saveCollectionItem('vows', { id: values.id || vowItem?.id || '', name: values.name, benefit: values.benefit, restriction: values.restriction, penalty: values.penalty } as Vow); await flushPersistence(); setDialog(null); toast.success('Voto salvo.'); })}><Field label="Nome" error={vowForm.formState.errors.name?.message}><Input autoComplete="off" {...vowForm.register('name')} /></Field><Field label="Benefício" error={vowForm.formState.errors.benefit?.message}><Textarea {...vowForm.register('benefit')} /></Field><Field label="Restrição" error={vowForm.formState.errors.restriction?.message}><Textarea {...vowForm.register('restriction')} /></Field><Field label="Penalidade" error={vowForm.formState.errors.penalty?.message}><Textarea {...vowForm.register('penalty')} /></Field><div className="flex flex-wrap gap-2"><Button type="submit" disabled={vowForm.formState.isSubmitting}>Salvar voto</Button><Button type="button" variant="secondary" onClick={() => setDialog(null)}>Cancelar</Button></div></form></DialogContent></Dialog>

      <Dialog open={dialog === 'inventory'} onOpenChange={(open) => setDialog(open ? 'inventory' : null)}><DialogContent><DialogHeader eyebrow="Inventário" title={inventoryItem ? 'Editar item' : 'Adicionar item'} description="Cadastre nome, quantidade e efeito." /><form className="mt-6 grid gap-4" onSubmit={inventoryForm.handleSubmit(async (values) => { saveCollectionItem('inventory', { id: values.id || inventoryItem?.id || '', name: values.name, quantity: values.quantity, effect: values.effect } as InventoryItem); await flushPersistence(); setDialog(null); toast.success('Item salvo.'); })}><div className="grid gap-4 md:grid-cols-2"><Field label="Nome" error={inventoryForm.formState.errors.name?.message}><Input autoComplete="off" {...inventoryForm.register('name')} /></Field><Field label="Quantidade" error={inventoryForm.formState.errors.quantity?.message}><Input type="number" {...inventoryForm.register('quantity')} /></Field></div><Field label="Efeito" error={inventoryForm.formState.errors.effect?.message}><Textarea {...inventoryForm.register('effect')} /></Field><div className="flex flex-wrap gap-2"><Button type="submit" disabled={inventoryForm.formState.isSubmitting}>Salvar item</Button><Button type="button" variant="secondary" onClick={() => setDialog(null)}>Cancelar</Button></div></form></DialogContent></Dialog>
    </div>
  );
}
