import { FileJson, LoaderCircle, PencilLine, Upload } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@components/ui/button';
import { EmptyState } from '@components/ui/empty-state';
import { UtilityPanel } from '@components/ui/panel';
import {
  MesaKeyValueRow,
  MesaLeadMeta,
  MesaPageLead,
  MesaSectionPanel
} from '@features/mesa/components/mesa-page-primitives';
import { useMesaCharacters } from '@features/workspace/hooks/use-workspace-segments';
import { CollectionsPanel } from '@features/sheets/components/collections-panel';
import { ConditionsEditor } from '@features/sheets/components/conditions-editor';
import { CharacterProfileEditor } from '@features/sheets/components/profile-editor';
import { characterSchema } from '@schemas/domain';

function formatRoleLabel(role: 'gm' | 'player' | 'viewer') {
  if (role === 'gm') return 'GM';
  if (role === 'player') return 'Player';
  return 'Viewer';
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
  }, [boundSheetCharacterId, session?.role, sheetCharacter?.id]);

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
        <MesaPageLead
          eyebrow="Fichas da mesa"
          title="Você ainda não tem ficha nesta mesa"
          description="Você não vê fichas alheias, não vê roster e não recebe dados de outros personagens. Escolha como quer entrar no módulo."
          meta={
            <>
              <MesaLeadMeta label="Papel" value="Player" accent />
              <MesaLeadMeta label="Visibilidade" value="Somente a sua ficha" />
            </>
          }
          actions={
            <>
              <Button disabled={coreBusy} onClick={() => void handleCreateAndBind()}>
                Criar personagem na mesa
              </Button>
              <Button variant="secondary" disabled={coreBusy} onClick={() => void handleImportAndBind()}>
                <Upload className="size-4" />
                Importar JSON
              </Button>
            </>
          }
        />

        <MesaSectionPanel
          eyebrow="Biblioteca pessoal"
          title="Usar personagem de Meus personagens"
          description="Se você já tem um núcleo salvo na conta, basta vincular aqui e a ficha aparece imediatamente."
        >
          {coreLoading ? (
            <UtilityPanel className="rounded-lg px-4 py-4">
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
                    toast.success('Personagem vinculado à mesa.');
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : 'Nao foi possivel usar este personagem.');
                  } finally {
                    setCoreBusy(false);
                  }
                }}
                className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-4 text-left transition hover:border-sky-300/24 hover:bg-white/[0.05]"
              >
                <p className="text-sm font-semibold text-white">{core.name}</p>
                <p className="mt-1 text-sm text-soft">
                  {core.clan || 'Sem clã'} · {core.grade || 'Sem grau'}
                </p>
              </button>
            ))
          ) : (
            <EmptyState
              title="Nenhum personagem salvo na conta."
              body="Crie um núcleo em Meus personagens ou importe um JSON para vincular aqui."
            />
          )}
        </MesaSectionPanel>
      </div>
    );
  }

  if (hasPendingBoundSheet) {
    return (
      <div className="page-shell pb-8">
        <MesaSectionPanel
          eyebrow="Sincronizando"
          title="Carregando sua ficha vinculada"
          description="A membership já está ligada a um personagem. Estamos aguardando o estado da mesa refletir esse vínculo."
        >
          <UtilityPanel className="flex items-start gap-3 rounded-lg px-4 py-4">
            <LoaderCircle className="mt-0.5 size-5 animate-spin text-sky-200" />
            <p className="text-sm leading-6 text-soft">Assim que a mesa responder, o módulo troca automaticamente para a sua ficha.</p>
          </UtilityPanel>
        </MesaSectionPanel>
      </div>
    );
  }

  if (!state.characters.length || !sheetCharacter) {
    return <EmptyState title="Nenhuma ficha carregada." body="Crie personagens para começar a mesa." />;
  }

  return (
    <div className="page-shell pb-8">
      <MesaPageLead
        eyebrow="Fichas da mesa"
        title={sheetCharacter.name}
        description={
          session?.role === 'gm'
            ? 'O roster do GM fica só na lateral. Aqui no corpo central você opera a ficha aberta sem duplicar contexto.'
            : 'Sua ficha vinculada ocupa o centro do módulo. O que é da conta continua seu; o que é mecânica de mesa fica operacional aqui.'
        }
        meta={
          <>
            <MesaLeadMeta label="Papel" value={session ? formatRoleLabel(session.role) : 'GM'} accent />
            <MesaLeadMeta label="Galeria" value={sheetCharacter.gallery.length} />
            <MesaLeadMeta label="Coleções" value={sheetCharacter.weapons.length + sheetCharacter.techniques.length + sheetCharacter.passives.length + sheetCharacter.vows.length} />
            {canManageRoster ? <MesaLeadMeta label="Roster" value="Lateral do GM" /> : null}
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
              Exportar personagem JSON
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

      {session?.role === 'gm' ? (
        <UtilityPanel className="rounded-lg px-4 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">Permissões</p>
          <p className="mt-2 text-sm leading-6 text-soft">
            O GM opera recursos e mecânicas da ficha aberta, mas o core narrativo do personagem continua protegido ao dono.
          </p>
        </UtilityPanel>
      ) : null}

      <div className="grid gap-4">
        <CharacterProfileEditor
          editable={canEditCharacterCore && editMode}
          canOperateResources={canOperateSheetMechanics}
        />
        <CollectionsPanel editable={canOperateSheetMechanics} section="all" />
        <ConditionsEditor editable={canOperateSheetMechanics} />
      </div>

      <MesaSectionPanel
        eyebrow="Fronteira de domínio"
        title="O que pertence à conta e o que pertence à mesa"
        description="A nova ficha deixa explícita a separação entre identidade do personagem e instância mecânica da campanha."
      >
        <div className="grid gap-3 md:grid-cols-2">
          <MesaKeyValueRow
            label="Core do personagem"
            value="Nome, aparência, lore, galeria e identidade"
            helper="Pertence ao usuário dono da ficha."
            accent
          />
          <MesaKeyValueRow
            label="Instância da mesa"
            value="Atributos, recursos, inventário, técnicas e condições"
            helper="Pode ser operada na campanha conforme seu papel."
          />
        </div>
      </MesaSectionPanel>
    </div>
  );
}
