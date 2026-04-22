import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRightLeft, FileJson, Plus, Upload } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Avatar } from '@components/ui/avatar';
import { Button } from '@components/ui/button';
import { EmptyState } from '@components/ui/empty-state';
import { Field, Input, Textarea } from '@components/ui/field';
import { Panel, UtilityPanel } from '@components/ui/panel';
import { MesaHero, MesaMetricTile } from '@features/mesa/components/mesa-section-primitives';
import { useWorkspace } from '@features/workspace/use-workspace';
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

function CharacterTransferForm({
  onTransfer,
  busy
}: {
  onTransfer: (payload: TransferValues) => Promise<void>;
  busy: boolean;
}) {
  const transferForm = useForm<TransferValues>({
    resolver: zodResolver(ownershipTransferSchema) as never,
    mode: 'onBlur',
    defaultValues: {
      targetUsername: '',
      currentPassword: ''
    }
  });

  return (
    <form
      className="mt-4 grid gap-3"
      onSubmit={transferForm.handleSubmit(async (values) => {
        await onTransfer(values);
        transferForm.reset();
      })}
    >
      <Field label="Transferir para username" error={transferForm.formState.errors.targetUsername?.message}>
        <Input autoComplete="off" placeholder="@destino" {...transferForm.register('targetUsername')} />
      </Field>
      <Field label="Confirmar senha atual" error={transferForm.formState.errors.currentPassword?.message}>
        <Input type="password" autoComplete="current-password" {...transferForm.register('currentPassword')} />
      </Field>
      <Button type="submit" variant="secondary" disabled={busy || transferForm.formState.isSubmitting}>
        <ArrowRightLeft className="size-4" />
        Transferir posse
      </Button>
      <p className="text-xs text-muted">
        A transferencia move a posse do nucleo para outro usuario e remove seu vinculo de propriedade.
      </p>
    </form>
  );
}

export function MyCharactersPage() {
  const { listCharacterCores, createCharacterCore, importCharacterCoreFromJson, transferCharacterCoreOwnership } = useWorkspace();
  const [cores, setCores] = useState<CharacterCoreSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyCoreId, setBusyCoreId] = useState('');
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);

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

  return (
    <div className="page-shell pb-8">
      <MesaHero
        eyebrow="Conta"
        title="Meus personagens"
        description="Nucleos autorais da sua conta. Crie fora de mesa, importe JSON e transfira posse com confirmacao de senha."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MesaMetricTile label="Nucleos" value={cores.length} hint="Personagens sob sua posse direta." />
        <MesaMetricTile label="Formato" value="JSON" hint="Importacao e exportacao em schema versionado." />
        <MesaMetricTile label="Seguranca" value="Senha obrigatoria" hint="Transferencia de posse validada no backend." />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_420px]">
        <Panel className="rounded-lg p-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Acervo</p>
              <h2 className="mt-2 font-display text-4xl leading-none text-white">Seus personagens</h2>
            </div>
            <Button variant="secondary" onClick={() => void loadCores()} disabled={loading}>
              Atualizar
            </Button>
          </div>

          <div className="mt-6 grid gap-3">
            {loading ? (
              <UtilityPanel className="rounded-lg p-4">
                <p className="text-sm text-soft">Carregando personagens...</p>
              </UtilityPanel>
            ) : cores.length ? (
              cores.map((core) => (
                <UtilityPanel key={core.id} className="rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Avatar src={core.avatarUrl || undefined} name={core.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-semibold text-white">{core.name}</p>
                      <p className="mt-1 truncate text-xs uppercase tracking-[0.16em] text-muted">
                        {core.clan || 'Sem cla'} · {core.grade || 'Sem grau'}
                      </p>
                      <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm leading-6 text-soft">
                        {core.lore || 'Sem lore definida.'}
                      </p>
                      <p className="mt-2 text-xs text-muted">Atualizado em {formatDate(core.updatedAt)}</p>
                    </div>
                  </div>
                  <CharacterTransferForm
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
                </UtilityPanel>
              ))
            ) : (
              <EmptyState title="Nenhum personagem ainda." body="Crie seu primeiro nucleo para usar em qualquer mesa." />
            )}
          </div>
        </Panel>

        <div className="grid gap-6">
          <Panel className="rounded-lg p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Criar fora da mesa</p>
            <h2 className="mt-2 font-display text-4xl leading-none text-white">Novo nucleo</h2>
            <form
              className="mt-6 grid gap-4"
              onSubmit={createForm.handleSubmit(async (values) => {
                setCreating(true);
                try {
                  await createCharacterCore(values);
                  createForm.reset(DEFAULT_CREATE_VALUES);
                  toast.success('Nucleo criado.');
                  await loadCores();
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : 'Nao foi possivel criar este personagem.');
                } finally {
                  setCreating(false);
                }
              })}
            >
              <Field label="Nome">
                <Input {...createForm.register('name')} />
              </Field>
              <Field label="Idade">
                <Input type="number" {...createForm.register('age', { valueAsNumber: true })} />
              </Field>
              <Field label="Cla">
                <Input {...createForm.register('clan')} />
              </Field>
              <Field label="Grau">
                <Input {...createForm.register('grade')} />
              </Field>
              <Field label="Aparencia">
                <Textarea {...createForm.register('appearance')} />
              </Field>
              <Field label="Lore">
                <Textarea {...createForm.register('lore')} className="min-h-32" />
              </Field>
              <Button type="submit" disabled={creating}>
                <Plus className="size-4" />
                Criar nucleo
              </Button>
            </form>
          </Panel>

          <Panel className="rounded-lg p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Importar JSON</p>
            <h2 className="mt-2 font-display text-4xl leading-none text-white">Trazer personagem</h2>
            <p className="mt-4 text-sm leading-6 text-soft">
              Use exportacoes em JSON do Project Nexus para criar um novo nucleo.
            </p>
            <Button
              className="mt-5"
              variant="secondary"
              disabled={importing}
              onClick={() => {
                const picker = document.createElement('input');
                picker.type = 'file';
                picker.accept = '.json,application/json';
                picker.onchange = async () => {
                  const file = picker.files?.[0];
                  if (!file) return;

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
                  }
                };
                picker.click();
              }}
            >
              <Upload className="size-4" />
              Importar arquivo
            </Button>
            <UtilityPanel className="mt-4 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <FileJson className="mt-0.5 size-4 text-sky-200" />
                <p className="text-sm leading-6 text-soft">TXT removido. O fluxo oficial agora e somente JSON.</p>
              </div>
            </UtilityPanel>
          </Panel>
        </div>
      </div>
    </div>
  );
}
