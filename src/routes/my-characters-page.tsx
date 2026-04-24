import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRightLeft, FileJson, Plus, RefreshCw, Upload } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Avatar } from '@components/ui/avatar';
import { Button } from '@components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@components/ui/dialog';
import { EmptyState } from '@components/ui/empty-state';
import { Field, Input, Textarea } from '@components/ui/field';
import { Panel, UtilityPanel } from '@components/ui/panel';
import { MesaHero, MesaMetricTile } from '@features/mesa/components/mesa-section-primitives';
import { useAccountCharacters } from '@features/workspace/hooks/use-workspace-segments';
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

      <DialogContent className="w-[min(94vw,560px)] p-5 sm:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">Operacao sensivel</p>
        <DialogTitle className="mt-2 text-2xl font-semibold leading-tight text-white">Transferir {core.name}</DialogTitle>
        <DialogDescription className="mt-2 text-sm leading-6 text-soft">
          Confirme o username de destino e a sua senha atual para mover a posse deste nucleo.
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

          <UtilityPanel className="rounded-lg p-3.5">
            <p className="text-xs leading-5 text-soft">
              A transferencia move a posse do nucleo para outro usuario e remove seu vinculo de propriedade daqui em diante.
            </p>
          </UtilityPanel>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={busy || transferForm.formState.isSubmitting}>
              <ArrowRightLeft className="size-4" />
              Confirmar transferencia
            </Button>
            <Button
              type="button"
              variant="secondary"
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
  const { listCharacterCores, createCharacterCore, importCharacterCoreFromJson, transferCharacterCoreOwnership } = useAccountCharacters();
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
      toast.error(error instanceof Error ? error.message : 'Nao foi possivel carregar seus personagens.');
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
        throw new Error('JSON invalido para personagem.');
      }

      await importCharacterCoreFromJson(parsed.data);
      toast.success('JSON importado.');
      await loadCores();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nao foi possivel importar este arquivo.');
    } finally {
      setImporting(false);
      if (importInputRef.current) {
        importInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="page-shell pb-8">
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

      <MesaHero
        eyebrow="Conta"
        title="Meus personagens"
        description="Nucleos autorais da sua conta com acoes rapidas: criar fora da mesa, importar JSON e transferir posse sem depender de colunas longas."
        actions={
          <>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="size-4" />
                  Criar nucleo
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[min(94vw,680px)] p-5 sm:p-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">Criar fora da mesa</p>
                <DialogTitle className="mt-2 text-2xl font-semibold leading-tight text-white">Novo nucleo</DialogTitle>
                <DialogDescription className="mt-2 text-sm leading-6 text-soft">
                  Crie o personagem autoral na sua conta e complete o restante quando quiser vincula-lo a uma mesa.
                </DialogDescription>

                <form
                  className="mt-5 grid gap-4"
                  onSubmit={createForm.handleSubmit(async (values) => {
                    setCreating(true);
                    try {
                      await createCharacterCore(values);
                      createForm.reset(DEFAULT_CREATE_VALUES);
                      setCreateOpen(false);
                      toast.success('Nucleo criado.');
                      await loadCores();
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : 'Nao foi possivel criar este personagem.');
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
                    <Field label="Cla">
                      <Input autoComplete="off" {...createForm.register('clan')} />
                    </Field>
                    <Field label="Grau">
                      <Input autoComplete="off" {...createForm.register('grade')} />
                    </Field>
                  </div>
                  <Field label="Aparencia">
                    <Textarea {...createForm.register('appearance')} />
                  </Field>
                  <Field label="Lore">
                    <Textarea {...createForm.register('lore')} className="min-h-32" />
                  </Field>

                  <div className="flex flex-wrap gap-2">
                    <Button type="submit" disabled={creating}>
                      <Plus className="size-4" />
                      Criar nucleo
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
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
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MesaMetricTile label="Nucleos" value={cores.length} hint="Personagens sob sua posse direta." />
        <MesaMetricTile label="Formato" value="JSON" hint="Importacao e exportacao em schema versionado." />
        <MesaMetricTile label="Seguranca" value="Senha obrigatoria" hint="Transferencia de posse validada no backend." />
        <MesaMetricTile label="Acesso" value="Conta" hint="Esses dados ficam preservados mesmo fora de uma mesa." />
      </div>

      <Panel className="rounded-lg p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">Acervo</p>
            <h2 className="mt-1.5 text-2xl font-semibold leading-tight text-white sm:text-3xl">Seus personagens</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-soft">
              Tudo fica disponivel em qualquer viewport: criar, importar e transferir sem esconder acoes criticas na lateral.
            </p>
          </div>
          <UtilityPanel className="rounded-lg px-3 py-2.5">
            <div className="flex items-start gap-2">
              <FileJson className="mt-0.5 size-4 text-sky-200" />
              <p className="text-xs leading-5 text-soft">TXT removido. O fluxo oficial agora e somente JSON.</p>
            </div>
          </UtilityPanel>
        </div>

        <div className="mt-5 grid gap-3">
          {loading ? (
            <UtilityPanel className="rounded-lg p-4">
              <p className="text-sm text-soft">Carregando personagens...</p>
            </UtilityPanel>
          ) : cores.length ? (
            cores.map((core) => (
              <UtilityPanel key={core.id} className="rounded-lg p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <Avatar src={core.avatarUrl || undefined} name={core.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-base font-semibold text-white">{core.name}</p>
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                          Nucleo
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs uppercase tracking-[0.16em] text-muted">
                        {core.clan || 'Sem cla'} - {core.grade || 'Sem grau'}
                      </p>
                      <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm leading-6 text-soft">
                        {core.lore || 'Sem lore definida.'}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
                        <span>Atualizado em {formatDate(core.updatedAt)}</span>
                        <span>{core.gallery.length} imagem(ns) extra(s)</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 lg:justify-end">
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
                          toast.error(error instanceof Error ? error.message : 'Nao foi possivel transferir este personagem.');
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
            <Panel className="rounded-lg p-5 sm:p-6">
              <EmptyState
                title="Nenhum personagem ainda."
                body="Crie seu primeiro nucleo ou importe um JSON usando as acoes do topo para comecar a montar seu acervo."
              />
            </Panel>
          )}
        </div>
      </Panel>
    </div>
  );
}
