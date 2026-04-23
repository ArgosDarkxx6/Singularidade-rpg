import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@components/ui/dialog';
import { EmptyState } from '@components/ui/empty-state';
import { Field, Input, Select } from '@components/ui/field';
import { Panel, UtilityPanel } from '@components/ui/panel';
import { GRADE_OPTIONS } from '@lib/domain/constants';
import { cn } from '@lib/utils';
import { characterCreateSchema } from '@schemas/sheets';
import { useWorkspace } from '@features/workspace/use-workspace';

type CharacterCreateValues = import('zod').infer<typeof characterCreateSchema>;

function RosterCard({
  name,
  meta,
  active,
  compact = false,
  onSelect,
  onRemove
}: {
  name: string;
  meta: string;
  active: boolean;
  compact?: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      className={cn(
        'rounded-lg border px-3 py-3 transition',
        active ? 'border-sky-300/28 bg-sky-500/10' : 'border-white/10 bg-white/[0.03] hover:border-white/16'
      )}
    >
      <button type="button" onClick={onSelect} className="w-full text-left">
        <p className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">{meta}</p>
        <h3 className={cn('mt-1.5 font-semibold leading-tight text-white', compact ? 'text-base' : 'text-lg')}>{name}</h3>
      </button>
      <div className="mt-3 flex gap-2">
        <Button size="sm" variant="secondary" onClick={onSelect}>
          Abrir
        </Button>
        <Button size="sm" variant="danger" onClick={onRemove}>
          Remover
        </Button>
      </div>
    </div>
  );
}

export function CharacterRosterPanel({
  variant = 'rail',
  onNavigate
}: {
  variant?: 'rail' | 'panel';
  onNavigate?: () => void;
}) {
  const { state, activeCharacter, setActiveCharacter, addCharacter, removeCharacter } = useWorkspace();
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const compact = variant === 'rail';
  const filteredCharacters = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return state.characters;
    return state.characters.filter((character) =>
      [character.name, character.clan, character.grade]
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [search, state.characters]);

  const createForm = useForm<CharacterCreateValues>({
    resolver: zodResolver(characterCreateSchema) as never,
    mode: 'onBlur',
    defaultValues: {
      name: '',
      clan: '',
      grade: GRADE_OPTIONS[0],
      age: 18
    }
  });

  const handleCreateCharacter = createForm.handleSubmit((values) => {
    addCharacter(values);
    createForm.reset({
      name: '',
      clan: '',
      grade: GRADE_OPTIONS[0],
      age: 18
    });
    setCreateOpen(false);
    toast.success('Novo personagem criado.');
  });

  return (
    <Panel className={cn(compact ? 'rounded-lg p-4' : 'rounded-lg p-5')}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">Roster do GM</p>
          <h2 className={cn('mt-1.5 font-semibold leading-tight text-white', compact ? 'text-lg' : 'text-2xl')}>Elenco da mesa</h2>
          <p className="mt-2 text-sm leading-6 text-soft">
            Selecione a ficha ativa, filtre o elenco e adicione novos personagens sem ocupar o corpo principal da ficha.
          </p>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="size-4" />
              Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[min(94vw,560px)] p-5 sm:p-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">Nova ficha</p>
            <DialogTitle className="mt-2 text-2xl font-semibold leading-tight text-white">Adicionar personagem</DialogTitle>
            <DialogDescription className="mt-2 text-sm leading-6 text-soft">
              Crie uma ficha base para o roster e refine o restante no workspace principal.
            </DialogDescription>

            <form className="mt-5 grid gap-4" onSubmit={handleCreateCharacter}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nome">
                  <Input autoComplete="off" {...createForm.register('name')} />
                </Field>
                <Field label="Clã">
                  <Input autoComplete="off" {...createForm.register('clan')} />
                </Field>
                <Field label="Grau">
                  <Select {...createForm.register('grade')}>
                    {GRADE_OPTIONS.map((grade) => (
                      <option key={grade} value={grade}>
                        {grade}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Idade">
                  <Input type="number" {...createForm.register('age')} />
                </Field>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={createForm.formState.isSubmitting}>
                  Criar ficha
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    createForm.reset();
                    setCreateOpen(false);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-4">
        <Field label="Buscar no roster">
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nome, clã ou grau..." autoComplete="off" />
        </Field>
      </div>

      <div className="mt-4 grid gap-3">
        {filteredCharacters.length ? (
          filteredCharacters.map((character) => (
            <RosterCard
              key={character.id}
              name={character.name}
              meta={`${character.clan || 'Sem clã'} · ${character.grade || 'Sem grau'}`}
              active={character.id === activeCharacter.id}
              compact={compact}
              onSelect={() => {
                setActiveCharacter(character.id);
                onNavigate?.();
              }}
              onRemove={() => {
                if (state.characters.length <= 1) {
                  toast.error('A ficha ativa não pode ser a única do roster.');
                  return;
                }

                removeCharacter(character.id);
              }}
            />
          ))
        ) : search.trim() ? (
          <EmptyState title="Nenhum personagem encontrado." body="Ajuste a busca para voltar ao roster completo." />
        ) : (
          <UtilityPanel className="rounded-lg p-4">
            <p className="text-sm leading-6 text-soft">Nenhum personagem foi criado para esta mesa ainda.</p>
          </UtilityPanel>
        )}
      </div>
    </Panel>
  );
}
