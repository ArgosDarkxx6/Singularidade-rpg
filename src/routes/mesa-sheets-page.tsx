import { Download, FileJson, FileText, PencilLine, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Avatar } from '@components/ui/avatar';
import { Button } from '@components/ui/button';
import { EmptyState } from '@components/ui/empty-state';
import { Panel, UtilityPanel } from '@components/ui/panel';
import { MesaDataRow, MesaHero, MesaMetricTile, MesaRailCard } from '@features/mesa/components/mesa-section-primitives';
import { useWorkspace } from '@features/workspace/use-workspace';
import { CollectionsPanel } from '@features/sheets/components/collections-panel';
import { ConditionsEditor } from '@features/sheets/components/conditions-editor';
import { CharacterProfileEditor } from '@features/sheets/components/profile-editor';
import { RosterSidebar } from '@features/sheets/components/roster-sidebar';
import type { Character } from '@/types/domain';

function formatRoleLabel(role: 'gm' | 'player' | 'viewer') {
  if (role === 'gm') return 'GM';
  if (role === 'player') return 'Player';
  return 'Viewer';
}

function ReadonlyRosterPanel({
  characters,
  activeCharacterId,
  onSelect
}: {
  characters: Character[];
  activeCharacterId: string;
  onSelect: (characterId: string) => void;
}) {
  return (
    <Panel className="rounded-3xl p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Roster da mesa</p>
      <h2 className="mt-2 font-display text-4xl leading-none text-white">Personagens</h2>
      <div className="mt-5 grid gap-3">
        {characters.map((character) => (
          <button
            key={character.id}
            type="button"
            onClick={() => onSelect(character.id)}
            className={`rounded-2xl border px-4 py-4 text-left transition ${
              activeCharacterId === character.id ? 'border-sky-300/24 bg-sky-500/10' : 'border-white/10 bg-white/[0.03] hover:border-white/16'
            }`}
          >
            <div className="flex items-start gap-3">
              <Avatar src={character.avatar || undefined} name={character.name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold text-white">{character.name}</p>
                <p className="mt-1 text-sm text-soft">
                  {character.clan || 'Sem clã'} · {character.grade || 'Sem grau'}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </Panel>
  );
}

function ReadonlyCharacterSummary({
  character,
  onEnterEdit
}: {
  character: Character;
  onEnterEdit?: () => void;
}) {
  return (
    <Panel className="rounded-3xl p-6 sm:p-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <Avatar src={character.avatar || undefined} name={character.name} size="lg" className="size-24 rounded-2xl" />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Leitura da ficha</p>
            <h2 className="mt-2 text-balance font-display text-5xl leading-none text-white">{character.name}</h2>
            <p className="mt-3 text-sm leading-6 text-soft">
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

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <UtilityPanel className="rounded-2xl p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Aparência</p>
          <p className="mt-2 text-sm leading-6 text-soft">{character.appearance || 'Sem descrição visual cadastrada.'}</p>
        </UtilityPanel>
        <UtilityPanel className="rounded-2xl p-4 xl:col-span-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Lore</p>
          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-soft">{character.lore || 'Sem lore registrada ainda para este personagem.'}</p>
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
    copyActiveCharacterText,
    downloadActiveCharacterText,
    exportState
  } = useWorkspace();
  const session = online.session;
  const [editMode, setEditMode] = useState(false);
  const canManageRoster = !session || session.role === 'gm';
  const canEditActiveCharacter = !session || session.role === 'gm' || (session.role === 'player' && session.characterId === activeCharacter.id);
  const effectiveEditable = canEditActiveCharacter && editMode;
  const isReadonlyViewer = Boolean(session && !canEditActiveCharacter);

  const visibleCharacters = useMemo(
    () =>
      session?.role === 'player' && session.characterId
        ? state.characters.filter((character) => character.id === session.characterId)
        : state.characters,
    [session?.characterId, session?.role, state.characters]
  );

  useEffect(() => {
    setEditMode(false);
  }, [activeCharacter.id, session?.characterId, session?.role]);

  if (!state.characters.length) {
    return <EmptyState title="Nenhuma ficha carregada." body="Crie personagens para começar a mesa." />;
  }

  return (
    <div className="page-shell pb-8">
      <MesaHero
        eyebrow="Fichas da mesa"
        title="Workspace de personagens"
        description="A ficha agora funciona como módulo central da plataforma: roster claro, leitura nobre, edição contida e galeria visual integrada."
        actions={
          <>
            {canEditActiveCharacter ? (
              <Button variant={editMode ? 'primary' : 'secondary'} onClick={() => setEditMode((value) => !value)}>
                <PencilLine className="size-4" />
                {editMode ? 'Concluir edição' : 'Editar ficha'}
              </Button>
            ) : null}
            <Button variant="secondary" onClick={() => void copyActiveCharacterText()}>
              <FileText className="size-4" />
              Copiar TXT
            </Button>
            <Button variant="secondary" onClick={downloadActiveCharacterText}>
              <Download className="size-4" />
              Baixar TXT
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MesaMetricTile label="Personagens" value={state.characters.length} hint="Roster atualmente carregado na mesa." />
        <MesaMetricTile label="Lore" value={activeCharacter.lore ? 'Registrada' : 'Pendente'} hint="História e contexto narrativo da ficha em foco." />
        <MesaMetricTile label="Galeria" value={`${activeCharacter.gallery.length}`} hint="Imagens extras vinculadas ao personagem ativo." />
        <MesaMetricTile label="Permissão" value={session ? formatRoleLabel(session.role) : 'GM local'} hint="Escopo atual de leitura e edição nesta mesa." />
      </div>

      <section className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <div className="grid gap-6">
          <MesaRailCard
            eyebrow="Ficha em foco"
            title={activeCharacter.name}
            description={`${activeCharacter.clan || 'Sem clã'} · ${activeCharacter.grade || 'Sem grau'} · ${activeCharacter.age} anos`}
          >
            <div className="rounded-lg border border-white/8 bg-white/[0.025] p-4">
              <div className="flex items-start gap-4">
                <Avatar src={activeCharacter.avatar || undefined} name={activeCharacter.name} size="lg" className="size-20 rounded-2xl" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Leitura rápida</p>
                  <p className="mt-2 text-sm leading-6 text-soft">{activeCharacter.appearance || 'Sem descrição visual cadastrada.'}</p>
                </div>
              </div>
            </div>
            <MesaDataRow label="Lore" value={activeCharacter.lore ? 'Registrada' : 'Pendente'} tone={activeCharacter.lore ? 'accent' : 'default'} />
            <MesaDataRow label="Galeria" value={`${activeCharacter.gallery.length} imagem(ns)`} />
            <MesaDataRow label="Armas" value={activeCharacter.weapons.length} />
            <MesaDataRow label="Técnicas" value={activeCharacter.techniques.length} />
            <MesaDataRow label="Condições" value={activeCharacter.conditions.length} />
          </MesaRailCard>

          {canManageRoster ? (
            <RosterSidebar />
          ) : (
            <ReadonlyRosterPanel characters={visibleCharacters} activeCharacterId={activeCharacter.id} onSelect={setActiveCharacter} />
          )}
        </div>

        <div className="grid gap-6">
          {canEditActiveCharacter ? (
            <CharacterProfileEditor editable={effectiveEditable} />
          ) : (
            <ReadonlyCharacterSummary
              character={activeCharacter}
              onEnterEdit={session?.role === 'player' && session.characterId === activeCharacter.id ? () => setEditMode(true) : undefined}
            />
          )}
          <CollectionsPanel section="all" editable={effectiveEditable} />
          <ConditionsEditor editable={effectiveEditable} />
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-3">
        <MesaMetricTile label="Armas" value={activeCharacter.weapons.length} hint="Coleção ofensiva disponível para a ficha ativa." />
        <MesaMetricTile label="Técnicas" value={activeCharacter.techniques.length} hint="Recursos especiais atualmente vinculados ao personagem." />
        <MesaMetricTile label="Condições" value={activeCharacter.conditions.length} hint="Estado tático e narrativo em aberto na ficha ativa." />
      </div>

      {isReadonlyViewer ? (
        <MesaRailCard
          eyebrow="Modo visualização"
          title="Leitura protegida"
          description="Esta ficha está em leitura porque não pertence ao seu papel atual na mesa."
        >
          <div className="flex items-start gap-3 rounded-lg border border-sky-300/18 bg-sky-500/10 px-4 py-4">
            <Sparkles className="mt-0.5 size-5 shrink-0 text-sky-200" />
            <p className="text-sm leading-6 text-soft">Você continua com acesso à leitura da ficha, roster e coleções, mas sem editar a ficha em foco.</p>
          </div>
        </MesaRailCard>
      ) : null}
    </div>
  );
}
