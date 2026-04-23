import { FileJson, LoaderCircle, PencilLine, Upload } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Avatar } from '@components/ui/avatar';
import { Button } from '@components/ui/button';
import { EmptyState } from '@components/ui/empty-state';
import { Panel, UtilityPanel } from '@components/ui/panel';
import { MesaHero, MesaMetricTile } from '@features/mesa/components/mesa-section-primitives';
import { useWorkspace } from '@features/workspace/use-workspace';
import { CollectionsPanel } from '@features/sheets/components/collections-panel';
import { ConditionsEditor } from '@features/sheets/components/conditions-editor';
import { CharacterProfileEditor } from '@features/sheets/components/profile-editor';
import { characterSchema } from '@schemas/domain';
import type { Character } from '@/types/domain';

function formatRoleLabel(role: 'gm' | 'player' | 'viewer') {
  if (role === 'gm') return 'GM';
  if (role === 'player') return 'Player';
  return 'Viewer';
}

function ReadonlyCharacterSummary({
  character,
  onEnterEdit
}: {
  character: Character;
  onEnterEdit?: () => void;
}) {
  return (
    <Panel className="rounded-lg p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <Avatar src={character.avatar || undefined} name={character.name} size="lg" className="size-20 rounded-lg" />
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">Leitura da ficha</p>
            <h2 className="mt-1.5 text-balance text-2xl font-semibold leading-tight text-white sm:text-3xl">{character.name}</h2>
            <p className="mt-2 text-sm leading-5 text-soft">
              {character.clan || 'Sem clã'} · {character.grade || 'Sem grau'} · {character.age} anos
            </p>
          </div>
        </div>
        {onEnterEdit ? (
          <Button variant="secondary" onClick={onEnterEdit}>
            <PencilLine className="size-4" />
            Editar ficha vinculada
          </Button>
        ) : null}
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <UtilityPanel className="rounded-lg p-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Aparência</p>
          <p className="mt-2 text-sm leading-5 text-soft">{character.appearance || 'Sem descrição visual cadastrada.'}</p>
        </UtilityPanel>
        <UtilityPanel className="rounded-lg p-3.5 xl:col-span-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Lore</p>
          <p className="mt-2 whitespace-pre-line text-sm leading-5 text-soft">{character.lore || 'Sem lore registrada ainda para este personagem.'}</p>
        </UtilityPanel>
      </div>
    </Panel>
  );
}

export function MesaSheetsPage() {
  const {
    state,
    activeCharacter,
    online,
    setActiveCharacter,
    exportState,
    exportActiveCharacterJson,
    listCharacterCores,
    createCharacterCore,
    importCharacterCoreFromJson,
    hasBoundSheet,
    canAccessSheetsModule,
    canManageRoster,
    hasPendingBoundSheet,
    boundSheetCharacterId,
    createTableCharacterFromCore
  } = useWorkspace();
  const session = online.session;
  const [editMode, setEditMode] = useState(false);
  const [coreOptions, setCoreOptions] = useState<Array<{ id: string; name: string; clan: string; grade: string }>>([]);
  const [coreLoading, setCoreLoading] = useState(false);
  const [coreBusy, setCoreBusy] = useState(false);
  const boundCharacter = useMemo(
    () => (boundSheetCharacterId ? state.characters.find((character) => character.id === boundSheetCharacterId) || null : null),
    [boundSheetCharacterId, state.characters]
  );
  const sheetCharacter = session?.role === 'player' ? boundCharacter : activeCharacter;
  const canEditActiveCharacter = Boolean(
    sheetCharacter &&
      (!session || session.role === 'gm' || (session.role === 'player' && boundSheetCharacterId === sheetCharacter.id))
  );
  const effectiveEditable = canEditActiveCharacter && editMode;

  const handleCreateAndBind = async () => {
    if (!session) return;
    setCoreBusy(true);
    try {
      const core = await createCharacterCore({
        name: `Personagem de ${session.nickname}`,
        age: 0,
        appearance: '',
        lore: '',
        clan: '',
        grade: ''
      });
      if (!core) return;
      await createTableCharacterFromCore(core.id);
      toast.success('Ficha criada e vinculada a esta mesa.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nao foi possivel criar sua ficha nesta mesa.');
    } finally {
      setCoreBusy(false);
    }
  };

  const handleImportAndBind = async () => {
    const picker = document.createElement('input');
    picker.type = 'file';
    picker.accept = '.json,application/json';
    picker.onchange = async () => {
      const file = picker.files?.[0];
      if (!file) return;

      setCoreBusy(true);
      try {
        const parsed = characterSchema.safeParse(JSON.parse(await file.text()));
        if (!parsed.success) {
          throw new Error('JSON invalido para personagem.');
        }

        const core = await importCharacterCoreFromJson(parsed.data);
        if (!core) return;
        await createTableCharacterFromCore(core.id);
        toast.success('JSON importado e vinculado a esta mesa.');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Nao foi possivel importar este personagem.');
      } finally {
        setCoreBusy(false);
      }
    };
    picker.click();
  };

  useEffect(() => {
    let disposed = false;
    if (!session || session.role !== 'player' || hasBoundSheet) {
      setCoreOptions([]);
      setCoreLoading(false);
      return;
    }

    setCoreLoading(true);
    void listCharacterCores()
      .then((cores) => {
        if (disposed) return;
        setCoreOptions(
          cores.map((core) => ({
            id: core.id,
            name: core.name,
            clan: core.clan,
            grade: core.grade
          }))
        );
      })
      .catch((error) => {
        if (!disposed) {
          toast.error(error instanceof Error ? error.message : 'Nao foi possivel carregar seus personagens.');
        }
      })
      .finally(() => {
        if (!disposed) {
          setCoreLoading(false);
        }
      });

    return () => {
      disposed = true;
    };
  }, [hasBoundSheet, listCharacterCores, session]);

  useEffect(() => {
    if (session?.role === 'player' && boundCharacter && activeCharacter.id !== boundCharacter.id) {
      setActiveCharacter(boundCharacter.id);
    }
  }, [activeCharacter.id, boundCharacter, session?.role, setActiveCharacter]);

  useEffect(() => {
    setEditMode(false);
  }, [session?.role, boundSheetCharacterId, sheetCharacter?.id]);

  if (!canAccessSheetsModule) {
    return (
      <div className="page-shell pb-8">
        <EmptyState
          title="Fichas indisponíveis para este papel."
          body="O módulo de fichas fica restrito ao GM e a players com personagem vinculado na mesa."
        />
      </div>
    );
  }

  if (session?.role === 'player' && !hasBoundSheet) {
    return (
      <div className="page-shell pb-8">
        <Panel className="rounded-lg p-5 sm:p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">Fichas da mesa</p>
          <h2 className="mt-2 text-balance text-2xl font-semibold leading-tight text-white sm:text-3xl">Voce ainda nao tem ficha nesta mesa</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-soft">
            Crie uma ficha nova aqui dentro da mesa ou reutilize um personagem da sua conta para vincular rapidamente.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button disabled={coreBusy} onClick={() => void handleCreateAndBind()}>
              Criar personagem na mesa
            </Button>
            <Button variant="secondary" disabled={coreBusy} onClick={() => void handleImportAndBind()}>
              <Upload className="size-4" />
              Importar .json
            </Button>
          </div>

          <div className="mt-5 grid gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Usar personagem de Meus personagens</p>
            {coreLoading ? (
              <UtilityPanel className="rounded-lg p-4">
                <p className="text-sm text-soft">Carregando seus personagens...</p>
              </UtilityPanel>
            ) : coreOptions.length ? (
              coreOptions.map((core) => (
                <button
                  key={core.id}
                  type="button"
                  disabled={coreBusy}
                  onClick={async () => {
                    setCoreBusy(true);
                    try {
                      await createTableCharacterFromCore(core.id);
                      toast.success('Personagem vinculado a mesa.');
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : 'Nao foi possivel usar este personagem.');
                    } finally {
                      setCoreBusy(false);
                    }
                  }}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-left transition hover:border-sky-300/24 hover:bg-white/[0.05]"
                >
                  <p className="text-base font-semibold text-white">{core.name}</p>
                  <p className="mt-1 text-sm text-soft">
                    {core.clan || 'Sem cla'} · {core.grade || 'Sem grau'}
                  </p>
                </button>
              ))
            ) : (
              <EmptyState title="Nenhum personagem salvo na conta." body="Crie um novo núcleo em Meus personagens ou importe um JSON para vincular aqui." />
            )}
          </div>
        </Panel>
      </div>
    );
  }

  if (hasPendingBoundSheet) {
    return (
      <div className="page-shell pb-8">
        <Panel className="rounded-lg p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <LoaderCircle className="mt-0.5 size-5 animate-spin text-sky-200" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">Sincronizando ficha</p>
              <h2 className="mt-1.5 text-xl font-semibold text-white">Carregando sua ficha vinculada</h2>
              <p className="mt-2 text-sm leading-6 text-soft">
                Sua membership já possui uma ficha definida. Estamos aguardando o estado da mesa refletir esse vínculo.
              </p>
            </div>
          </div>
        </Panel>
      </div>
    );
  }

  if (!state.characters.length || !sheetCharacter) {
    return <EmptyState title="Nenhuma ficha carregada." body="Crie personagens para começar a mesa." />;
  }

  return (
    <div className="page-shell pb-8">
      <MesaHero
        eyebrow="Fichas da mesa"
        title="Workspace de personagens"
        description="A ficha agora ocupa o centro do módulo: leitura rápida, edição contida e coleções operacionais sem redundância visual."
        actions={
          <>
            {canEditActiveCharacter ? (
              <Button variant={editMode ? 'primary' : 'secondary'} onClick={() => setEditMode((value) => !value)}>
                <PencilLine className="size-4" />
                {editMode ? 'Concluir edição' : 'Editar ficha'}
              </Button>
            ) : null}
            <Button variant="secondary" onClick={exportActiveCharacterJson}>
              <FileJson className="size-4" />
              Exportar personagem JSON
            </Button>
            {canManageRoster ? (
              <Button variant="ghost" onClick={exportState}>
                <FileJson className="size-4" />
                Exportar JSON
              </Button>
            ) : null}
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MesaMetricTile label="Personagens" value={state.characters.length} hint="Roster atualmente carregado na mesa." />
        <MesaMetricTile label="Lore" value={sheetCharacter.lore ? 'Registrada' : 'Pendente'} hint="História e contexto narrativo desta ficha." />
        <MesaMetricTile label="Galeria" value={`${sheetCharacter.gallery.length}`} hint="Imagens extras vinculadas ao personagem atual." />
        <MesaMetricTile label="Permissão" value={session ? formatRoleLabel(session.role) : 'GM local'} hint="Escopo atual de leitura e edição nesta mesa." />
      </div>

      <section className="grid gap-4">
        {canEditActiveCharacter ? (
          <CharacterProfileEditor editable={effectiveEditable} canOperateResources={canEditActiveCharacter} />
        ) : (
          <ReadonlyCharacterSummary
            character={sheetCharacter}
            onEnterEdit={session?.role === 'player' && boundSheetCharacterId === sheetCharacter.id ? () => setEditMode(true) : undefined}
          />
        )}
        <CollectionsPanel section="all" editable={effectiveEditable} />
        <ConditionsEditor editable={effectiveEditable} />
      </section>
    </div>
  );
}
