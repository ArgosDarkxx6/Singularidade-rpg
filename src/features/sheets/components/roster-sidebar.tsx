import { zodResolver } from '@hookform/resolvers/zod';
import { FileJson, FileText, Plus, RefreshCcw, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { SectionTitle } from '@components/shared/section-title';
import { Button } from '@components/ui/button';
import { Card } from '@components/ui/card';
import { EmptyState } from '@components/ui/empty-state';
import { Field, Input, Select, Textarea } from '@components/ui/field';
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
    <div className={`rounded-[24px] border px-4 py-4 transition ${active ? 'border-sky-300/24 bg-sky-500/10' : 'border-white/10 bg-white/4'}`}>
      <button type="button" onClick={onSelect} className="w-full text-left">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">{meta}</p>
        <h3 className="mt-2 font-display text-3xl text-white">{name}</h3>
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
  const { state, activeCharacter, setActiveCharacter, addCharacter, removeCharacter, importCharactersFromText, importStateFromFile, resetState } = useWorkspace();
  const [textImportValue, setTextImportValue] = useState('');
  const textFileRef = useRef<HTMLInputElement | null>(null);
  const jsonFileRef = useRef<HTMLInputElement | null>(null);

  const createForm = useForm<CharacterCreateValues>({
    resolver: zodResolver(characterCreateSchema) as never,
    mode: 'onChange',
    defaultValues: {
      name: '',
      clan: '',
      grade: GRADE_OPTIONS[0],
      age: 18
    }
  });

  return (
    <div className="grid gap-6">
      <Card className="p-5">
        <SectionTitle eyebrow="Roster" title="Personagens" description="Selecione a ficha ativa, crie novas entradas ou remova duplicatas do workspace." />
        <div className="mt-5 grid gap-3">
          {state.characters.map((character) => (
            <RosterCard
              key={character.id}
              name={character.name}
              meta={`${character.clan || 'Sem cla'} · ${character.grade || 'Sem grau'}`}
              active={character.id === activeCharacter.id}
              onSelect={() => setActiveCharacter(character.id)}
              onRemove={() => {
                if (state.characters.length <= 1) {
                  toast.error('A ficha ativa nao pode ser a unica do roster.');
                  return;
                }
                removeCharacter(character.id);
              }}
            />
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <SectionTitle eyebrow="Nova ficha" title="Adicionar personagem" description="Crie um ponto de partida e depois refine no editor principal." />
        <form
          className="mt-5 grid gap-4"
          onSubmit={createForm.handleSubmit((values) => {
            addCharacter(values);
            createForm.reset({
              name: '',
              clan: '',
              grade: GRADE_OPTIONS[0],
              age: 18
            });
            toast.success('Novo personagem criado.');
          })}
        >
          <Field label="Nome">
            <Input {...createForm.register('name')} />
          </Field>
          <Field label="Cla">
            <Input {...createForm.register('clan')} />
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
          <Button type="submit" disabled={!createForm.formState.isValid}>
            <Plus className="size-4" />
            Criar ficha
          </Button>
        </form>
      </Card>

      <Card className="p-5">
        <SectionTitle eyebrow="Compatibilidade" title="Importacao e reset" description="Aplique texto legado, JSON do remake ou reinicie o workspace local." />
        <div className="mt-5 grid gap-4">
          <Field label="Colar ficha(s) em texto">
            <Textarea value={textImportValue} onChange={(event) => setTextImportValue(event.target.value)} placeholder="Cole uma ou mais fichas em texto aqui..." />
          </Field>
          <div className="grid gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                if (!textImportValue.trim()) return;
                importCharactersFromText(textImportValue);
                setTextImportValue('');
                toast.success('Texto legado importado.');
              }}
            >
              <Upload className="size-4" />
              Importar texto colado
            </Button>
            <Button variant="secondary" onClick={() => textFileRef.current?.click()}>
              <FileText className="size-4" />
              Abrir TXT
            </Button>
            <Button variant="secondary" onClick={() => jsonFileRef.current?.click()}>
              <FileJson className="size-4" />
              Importar JSON
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                resetState();
                toast.success('Workspace resetado para o estado base.');
              }}
            >
              <RefreshCcw className="size-4" />
              Resetar workspace
            </Button>
          </div>
          <input
            ref={textFileRef}
            type="file"
            accept=".txt"
            className="hidden"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              importCharactersFromText(await file.text());
              toast.success('Arquivo TXT importado.');
              event.target.value = '';
            }}
          />
          <input
            ref={jsonFileRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              try {
                await importStateFromFile(file);
                toast.success('Estado JSON aplicado.');
              } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Falha ao importar JSON.');
              } finally {
                event.target.value = '';
              }
            }}
          />
        </div>
      </Card>

      {!state.characters.length ? <EmptyState title="Roster vazio." body="Crie um personagem ou importe uma ficha para iniciar." /> : null}
    </div>
  );
}
