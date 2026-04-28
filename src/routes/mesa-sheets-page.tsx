import { FileJson, LoaderCircle, PencilLine, Upload } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@components/ui/button';
import { EmptyState } from '@components/ui/empty-state';
import { UtilityPanel } from '@components/ui/panel';
import { MesaLeadMeta, MesaPageLead, MesaSectionPanel } from '@features/mesa/components/mesa-page-primitives';
import { CollectionsPanel } from '@features/sheets/components/collections-panel';
import { CharacterRosterPanel } from '@features/sheets/components/character-roster-panel';
import { ConditionsEditor } from '@features/sheets/components/conditions-editor';
import { CharacterProfileEditor } from '@features/sheets/components/profile-editor';
import { useMesaCharacters } from '@features/workspace/hooks/use-workspace-segments';
import { characterSchema } from '@schemas/domain';

function formatRoleLabel(role: 'gm' | 'player' | 'viewer') {
  if (role === 'gm') return 'GM';
  if (role === 'player') return 'Jogador';
  return 'Visitante';
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
  } = useMesaCharacters();
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
  const canOperateSheetMechanics = Boolean(
    sheetCharacter &&
      (!session || session.role === 'gm' || (session.role === 'player' && boundSheetCharacterId === sheetCharacter.id))
  );
  const canEditCharacterCore = Boolean(
    sheetCharacter && session?.role === 'player' && boundSheetCharacterId === sheetCharacter.id
  );

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
      toast.success('Ficha criada e vinculada.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível criar sua ficha nesta mesa.');
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
          throw new Error('JSON inválido para personagem.');
        }

        const core = await importCharacterCoreFromJson(parsed.data);
        if (!core) return;
        await createTableCharacterFromCore(core.id);
        toast.success('JSON importado e vinculado.');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Não foi possível importar este personagem.');
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
          toast.error(error instanceof Error ? error.message : 'Não foi possível carregar seus personagens.');
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
  }, [boundSheetCharacterId, session?.role, sheetCharacter?.id]);

  if (!canAccessSheetsModule) {
    return (
      <div className="page-shell pb-8">
        <EmptyState
          title="Fichas indisponíveis para este papel."
          body="Seu acesso nesta mesa é somente leitura."
        />
      </div>
    );
  }

  if (session?.role === 'player' && !hasBoundSheet) {
    return (
      <div className="page-shell pb-8">
        <MesaPageLead
          eyebrow="Fichas"
          title="Você ainda não tem ficha nesta mesa."
          actions={
            <>
              <Button disabled={coreBusy} onClick={() => void handleCreateAndBind()}>
                Criar ficha
              </Button>
              <Button variant="secondary" disabled={coreBusy} onClick={() => void handleImportAndBind()}>
                <Upload className="size-4" />
                Importar JSON
              </Button>
            </>
          }
        />

        <MesaSectionPanel eyebrow="Biblioteca" title="Usar personagem">
          {coreLoading ? (
            <UtilityPanel className="rounded-[10px] px-4 py-4">
              <p className="text-sm text-soft">Carregando personagens.</p>
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
                    toast.success('Personagem vinculado.');
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : 'Não foi possível usar este personagem.');
                  } finally {
                    setCoreBusy(false);
                  }
                }}
                className="rounded-[10px] border border-white/10 bg-white/[0.03] px-4 py-4 text-left transition hover:border-sky-300/24 hover:bg-white/[0.05]"
              >
                <p className="text-sm font-semibold text-white">{core.name}</p>
                <p className="mt-1 text-sm text-soft">
                  {core.clan || 'Sem clã'} · {core.grade || 'Sem grau'}
                </p>
              </button>
            ))
          ) : (
            <EmptyState
              title="Nenhum personagem salvo."
              body="Crie um personagem ou importe um JSON."
            />
          )}
        </MesaSectionPanel>
      </div>
    );
  }

  if (hasPendingBoundSheet) {
    return (
      <div className="page-shell pb-8">
        <MesaSectionPanel eyebrow="Fichas" title="Carregando ficha">
          <UtilityPanel className="flex items-start gap-3 rounded-[10px] px-4 py-4">
            <LoaderCircle className="mt-0.5 size-5 animate-spin text-sky-200" />
            <p className="text-sm leading-6 text-soft">Sincronizando personagem.</p>
          </UtilityPanel>
        </MesaSectionPanel>
      </div>
    );
  }

  if (session?.role === 'player' && sheetCharacter && activeCharacter.id !== sheetCharacter.id) {
    return (
      <div className="page-shell pb-8" data-contract="player-bound-sheet-sync">
        <MesaSectionPanel eyebrow="Fichas" title="Carregando ficha">
          <UtilityPanel className="flex items-start gap-3 rounded-[10px] px-4 py-4">
            <LoaderCircle className="mt-0.5 size-5 animate-spin text-sky-200" />
            <p className="text-sm leading-6 text-soft">Carregando sua ficha.</p>
          </UtilityPanel>
        </MesaSectionPanel>
      </div>
    );
  }

  if (!state.characters.length || !sheetCharacter) {
    return <EmptyState title="Nenhuma ficha carregada." body="Crie personagens para começar a mesa." />;
  }

  return (
    <div className="page-shell pb-8" data-contract={session?.role === 'player' ? 'player-bound-sheet' : canManageRoster ? 'gm-sheet-with-rail' : 'sheet'}>
      <MesaPageLead
        eyebrow="Fichas"
        title={sheetCharacter.name}
        meta={
          <>
            <MesaLeadMeta label="Papel" value={session ? formatRoleLabel(session.role) : 'GM'} accent />
            <MesaLeadMeta label="Clã" value={sheetCharacter.clan || 'Sem clã'} />
            <MesaLeadMeta label="Grau" value={sheetCharacter.grade || 'Sem grau'} />
            {canManageRoster ? <MesaLeadMeta label="Elenco" value={state.characters.length} /> : null}
          </>
        }
        actions={
          <>
            {canEditCharacterCore ? (
              <Button variant={editMode ? 'primary' : 'secondary'} onClick={() => setEditMode((value) => !value)}>
                <PencilLine className="size-4" />
                {editMode ? 'Fechar edição' : 'Editar identidade'}
              </Button>
            ) : null}
            <Button variant="secondary" onClick={exportActiveCharacterJson}>
              <FileJson className="size-4" />
              Exportar JSON
            </Button>
            {canManageRoster ? (
              <Button variant="ghost" onClick={exportState}>
                <FileJson className="size-4" />
                Exportar mesa JSON
              </Button>
            ) : null}
          </>
        }
      />

      <div className={canManageRoster ? 'grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]' : 'grid gap-4'}>
        <div className="grid gap-4">
          <CharacterProfileEditor editable={canEditCharacterCore && editMode} canOperateResources={canOperateSheetMechanics} />
          <CollectionsPanel editable={canOperateSheetMechanics} section="all" />
          <ConditionsEditor editable={canOperateSheetMechanics} />
        </div>

        {canManageRoster ? (
          <aside className="grid gap-4 xl:sticky xl:top-3 xl:self-start">
            <CharacterRosterPanel variant="rail" />
          </aside>
        ) : null}
      </div>
    </div>
  );
}
