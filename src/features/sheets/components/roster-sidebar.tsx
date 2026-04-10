import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { SectionTitle } from '@components/shared/section-title';
import { Button } from '@components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@components/ui/dialog';
import { EmptyState } from '@components/ui/empty-state';
import { Field, Input, Select } from '@components/ui/field';
import { Card } from '@components/ui/card';
import { GRADE_OPTIONS } from '@lib/domain/constants';
import { characterCreateSchema } from '@schemas/sheets';
import { useWorkspace } from '@features/workspace/use-workspace';

type CharacterCreateValues = import('zod').infer<typeof characterCreateSchema>;

function RosterCard({
  name,
  meta,
  active,
  onSelect,
  onRemove
}: {
  name: string;
  meta: string;
  active: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      className={`rounded-[22px] border px-4 py-4 transition ${
        active ? 'border-sky-300/28 bg-sky-500/10' : 'border-white/10 bg-white/[0.03] hover:border-white/16'
      }`}
    >
      <button type="button" onClick={onSelect} className="w-full text-left">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">{meta}</p>
        <h3 className="mt-2 font-display text-3xl leading-none text-white">{name}</h3>
      </button>
      <div className="mt-4 flex gap-2">
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

export function RosterSidebar() {
  const { state, activeCharacter, setActiveCharacter, addCharacter, removeCharacter } = useWorkspace();
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
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

  return (
    <Card className="p-5">
      <SectionTitle
        eyebrow="Roster"
        title="Personagens"
        description="Visível apenas para o GM. Selecione a ficha ativa, filtre o elenco e crie novos personagens quando a mesa exigir."
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="size-4" />
                Adicionar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">Nova ficha</p>
              <DialogTitle className="mt-2 font-display text-4xl leading-none text-white">Adicionar personagem</DialogTitle>
              <DialogDescription className="mt-3 text-sm leading-6 text-soft">
                Crie uma ficha base para o roster. Depois refine os detalhes no corpo principal da ficha.
              </DialogDescription>

              <form
                className="mt-6 grid gap-4"
                onSubmit={createForm.handleSubmit((values) => {
                  addCharacter(values);
                  createForm.reset({
                    name: '',
                    clan: '',
                    grade: GRADE_OPTIONS[0],
                    age: 18
                  });
                  setCreateOpen(false);
                  toast.success('Novo personagem criado.');
                })}
              >
                <div className="grid gap-4 md:grid-cols-2">
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
        }
      />

      <div className="mt-5">
        <Field label="Buscar no roster">
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nome, clã ou grau…" autoComplete="off" />
        </Field>
      </div>

      <div className="mt-5 grid gap-3">
        {filteredCharacters.length ? (
          filteredCharacters.map((character) => (
            <RosterCard
              key={character.id}
              name={character.name}
              meta={`${character.clan || 'Sem clã'} · ${character.grade || 'Sem grau'}`}
              active={character.id === activeCharacter.id}
              onSelect={() => setActiveCharacter(character.id)}
              onRemove={() => {
                if (state.characters.length <= 1) {
                  toast.error('A ficha ativa não pode ser a única do roster.');
                  return;
                }

                removeCharacter(character.id);
              }}
            />
          ))
        ) : (
          <EmptyState title="Nenhum personagem encontrado." body="Ajuste a busca para voltar ao roster completo." />
        )}
      </div>
    </Card>
  );
}
