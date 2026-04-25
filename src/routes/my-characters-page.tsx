import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRightLeft, Download, Plus, RefreshCw, Upload } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Avatar } from '@components/ui/avatar';
import { Button } from '@components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@components/ui/dialog';
import { EmptyState } from '@components/ui/empty-state';
import { Field, Input, Textarea } from '@components/ui/field';
import { Panel, UtilityPanel } from '@components/ui/panel';
import { useAccountCharacters } from '@features/workspace/hooks/use-workspace-segments';
import { makeCharacter } from '@lib/domain/state';
import { characterSchema } from '@schemas/domain';
import { ownershipTransferSchema } from '@schemas/mesa';
import type { CharacterCoreSummary } from '@/types/domain';

type CreateCoreValues = {
  name: string;
  age: number;
  clan: string;
  grade: string;
  appearance: string;
  lore: string;
};

type TransferValues = import('zod').infer<typeof ownershipTransferSchema>;

const DEFAULT_CREATE_VALUES: CreateCoreValues = {
  name: '',
  age: 0,
  clan: '',
  grade: '',
  appearance: '',
  lore: ''
};

function formatDate(value: string) {
  if (!value) return 'Sem data';
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function downloadCharacterJson(core: CharacterCoreSummary) {
  const payload = characterSchema.parse(
    makeCharacter({
      name: core.name,
      age: core.age || 0,
      appearance: core.appearance || '',
      lore: core.lore,
      clan: core.clan,
      grade: core.grade,
      avatarMode: core.avatarUrl ? 'url' : 'none',
      avatar: core.avatarUrl || '',
      avatarPath: core.avatarPath || '',
      gallery: core.gallery || []
    })
  );

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${core.name || 'personagem'}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function CharacterTransferDialog({
  core,
  busy,
  onTransfer
}: {
  core: CharacterCoreSummary;
  busy: boolean;
  onTransfer: (payload: TransferValues) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const transferForm = useForm<TransferValues>({
    resolver: zodResolver(ownershipTransferSchema) as never,
    mode: 'onBlur',
    defaultValues: {
      targetUsername: '',
      currentPassword: ''
    }
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          transferForm.reset();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary">
          <ArrowRightLeft className="size-4" />
          Transferir posse
        </Button>
      </DialogTrigger>

      <DialogContent className="w-[min(94vw,560px)] rounded-xl p-5">
        <DialogTitle className="font-display text-2xl text-white">Transferir {core.name}</DialogTitle>
        <DialogDescription className="mt-2 text-sm leading-6 text-soft">
          Confirme o username de destino e sua senha atual.
        </DialogDescription>

        <form
          className="mt-5 grid gap-4"
          onSubmit={transferForm.handleSubmit(async (values) => {
            await onTransfer(values);
            transferForm.reset();
            setOpen(false);
          })}
        >
          <Field label="Transferir para username" error={transferForm.formState.errors.targetUsername?.message}>
            <Input autoComplete="off" placeholder="@destino" {...transferForm.register('targetUsername')} />
          </Field>
          <Field label="Confirmar senha atual" error={transferForm.formState.errors.currentPassword?.message}>
            <Input type="password" autoComplete="current-password" {...transferForm.register('currentPassword')} />
          </Field>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={busy || transferForm.formState.isSubmitting}>
              <ArrowRightLeft className="size-4" />
              Confirmar transferência
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                transferForm.reset();
                setOpen(false);
              }}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function MyCharactersPage() {
  const {
    online,
    listCharacterCores,
    createCharacterCore,
    importCharacterCoreFromJson,
    createTableCharacterFromCore,
    transferCharacterCoreOwnership
  } = useAccountCharacters();
  const [cores, setCores] = useState<CharacterCoreSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyCoreId, setBusyCoreId] = useState('');
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const createForm = useForm<CreateCoreValues>({
    mode: 'onBlur',
    defaultValues: DEFAULT_CREATE_VALUES
  });

  const loadCores = useCallback(async () => {
    setLoading(true);
    try {
      const next = await listCharacterCores();
      setCores(next);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível carregar seus personagens.');
    } finally {
      setLoading(false);
    }
  }, [listCharacterCores]);

  useEffect(() => {
    void loadCores();
  }, [loadCores]);

  const handleImport = async (file: File) => {
    setImporting(true);
    try {
      const text = await file.text();
      const parsed = characterSchema.safeParse(JSON.parse(text));
      if (!parsed.success) {
        throw new Error('JSON inválido para personagem.');
      }

      await importCharacterCoreFromJson(parsed.data);
      toast.success('JSON importado.');
      await loadCores();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível importar este arquivo.');
    } finally {
      setImporting(false);
      if (importInputRef.current) {
        importInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="grid gap-4 pb-8">
      <input
        ref={importInputRef}
        type="file"
        accept=".json,application/json"
        className="sr-only"
        disabled={importing}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          void handleImport(file);
        }}
      />

      <Panel className="p-3.5 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">Personagens</p>
            <h1 className="mt-1 font-display text-xl font-semibold leading-tight text-white sm:text-2xl">Biblioteca pessoal</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="size-4" />
                  Criar personagem
                </Button>
              </DialogTrigger>
      <DialogContent className="w-[min(94vw,680px)] rounded-xl p-5">
                <DialogTitle className="font-display text-2xl text-white">Novo personagem</DialogTitle>
                <DialogDescription className="mt-2 text-sm leading-6 text-soft">
                  Salve um personagem na sua biblioteca.
                </DialogDescription>

                <form
                  className="mt-5 grid gap-4"
                  onSubmit={createForm.handleSubmit(async (values) => {
                    setCreating(true);
                    try {
                      await createCharacterCore(values);
                      createForm.reset(DEFAULT_CREATE_VALUES);
                      setCreateOpen(false);
                      toast.success('Núcleo criado.');
                      await loadCores();
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : 'Não foi possível criar este personagem.');
                    } finally {
                      setCreating(false);
                    }
                  })}
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Nome">
                      <Input autoComplete="off" {...createForm.register('name')} />
                    </Field>
                    <Field label="Idade">
                      <Input type="number" {...createForm.register('age', { valueAsNumber: true })} />
                    </Field>
                    <Field label="Clã">
                      <Input autoComplete="off" {...createForm.register('clan')} />
                    </Field>
                    <Field label="Grau">
                      <Input autoComplete="off" {...createForm.register('grade')} />
                    </Field>
                  </div>
                  <Field label="Aparência">
                    <Textarea {...createForm.register('appearance')} />
                  </Field>
                  <Field label="Lore">
                    <Textarea {...createForm.register('lore')} className="min-h-32" />
                  </Field>

                  <div className="flex flex-wrap gap-2">
                    <Button type="submit" disabled={creating}>
                      <Plus className="size-4" />
                      Criar personagem
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        createForm.reset(DEFAULT_CREATE_VALUES);
                        setCreateOpen(false);
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <Button variant="secondary" disabled={importing} onClick={() => importInputRef.current?.click()}>
              <Upload className="size-4" />
              {importing ? 'Importando...' : 'Importar JSON'}
            </Button>
            <Button variant="ghost" disabled={loading} onClick={() => void loadCores()}>
              <RefreshCw className="size-4" />
              Atualizar
            </Button>
          </div>
        </div>
      </Panel>

      <Panel className="p-3.5 sm:p-4">
        <div className="grid gap-3">
          {loading ? (
            <UtilityPanel className="rounded-lg px-3.5 py-3">
              <p className="text-sm text-soft">Carregando personagens...</p>
            </UtilityPanel>
          ) : cores.length ? (
            cores.map((core) => (
              <UtilityPanel key={core.id} className="rounded-lg px-3.5 py-3">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <Avatar src={core.avatarUrl || undefined} name={core.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-base font-semibold text-white">{core.name}</p>
                        <span className="chip-muted inline-flex rounded-lg px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]">
                          Biblioteca
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs uppercase tracking-[0.16em] text-muted">
                        {core.clan || 'Sem clã'} · {core.grade || 'Sem grau'}
                      </p>
                      <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm leading-6 text-soft">
                        {core.lore || 'Sem lore definida.'}
                      </p>
                      <p className="mt-2 text-xs text-muted">Atualizado em {formatDate(core.updatedAt)}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    {online.session ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={busyCoreId === core.id}
                        onClick={async () => {
                          setBusyCoreId(core.id);
                          try {
                            await createTableCharacterFromCore(core.id);
                            toast.success('Personagem enviado para a mesa ativa.');
                          } catch (error) {
                            toast.error(error instanceof Error ? error.message : 'Não foi possível usar este personagem na mesa.');
                          } finally {
                            setBusyCoreId('');
                          }
                        }}
                      >
                        Usar na mesa ativa
                      </Button>
                    ) : null}
                    <Button size="sm" variant="secondary" onClick={() => downloadCharacterJson(core)}>
                      <Download className="size-4" />
                      Exportar JSON
                    </Button>
                    <CharacterTransferDialog
                      core={core}
                      busy={busyCoreId === core.id}
                      onTransfer={async ({ targetUsername, currentPassword }) => {
                        setBusyCoreId(core.id);
                        try {
                          await transferCharacterCoreOwnership({
                            coreId: core.id,
                            targetUsername,
                            currentPassword
                          });
                          toast.success('Posse transferida.');
                          await loadCores();
                        } catch (error) {
                          toast.error(error instanceof Error ? error.message : 'Não foi possível transferir este personagem.');
                        } finally {
                          setBusyCoreId('');
                        }
                      }}
                    />
                  </div>
                </div>
              </UtilityPanel>
            ))
          ) : (
            <EmptyState title="Nenhum personagem ainda." body="Crie um personagem ou importe um JSON." />
          )}
        </div>
      </Panel>
    </div>
  );
}
