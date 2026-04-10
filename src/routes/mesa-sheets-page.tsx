import { Download, FileJson, FileText } from 'lucide-react';
import { Avatar } from '@components/ui/avatar';
import { Button } from '@components/ui/button';
import { EmptyState } from '@components/ui/empty-state';
import { Panel, UtilityPanel } from '@components/ui/panel';
import { MesaHero, MesaMetricTile, MesaRailCard } from '@features/mesa/components/mesa-section-primitives';
import { CollectionsPanel } from '@features/sheets/components/collections-panel';
import { ConditionsEditor } from '@features/sheets/components/conditions-editor';
import { CharacterProfileEditor } from '@features/sheets/components/profile-editor';
import { RosterSidebar } from '@features/sheets/components/roster-sidebar';
import { useWorkspace } from '@features/workspace/use-workspace';
import { ATTRIBUTE_CONFIG, RESOURCE_LABELS } from '@lib/domain/constants';
import type { Character } from '@/types/domain';

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
    <Panel className="rounded-[28px] p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Roster da mesa</p>
      <h2 className="mt-2 font-display text-4xl leading-none text-white">Personagens registrados</h2>
      <div className="mt-5 grid gap-3">
        {characters.map((character) => (
          <button
            key={character.id}
            type="button"
            onClick={() => onSelect(character.id)}
            className={`rounded-[22px] border px-4 py-4 text-left transition ${
              activeCharacterId === character.id ? 'border-sky-300/24 bg-sky-500/10' : 'border-white/10 bg-white/[0.03] hover:border-white/16'
            }`}
          >
            <p className="text-base font-semibold text-white">{character.name}</p>
            <p className="mt-1 text-sm text-soft">
              {character.clan || 'Sem clã'} · {character.grade || 'Sem grau'}
            </p>
          </button>
        ))}
      </div>
    </Panel>
  );
}

function ReadonlyCharacterSummary({ character }: { character: Character }) {
  return (
    <Panel className="rounded-[28px] p-6">
      <div className="flex flex-col gap-5 lg:flex-row">
        <Avatar src={character.avatar || undefined} name={character.name} size="lg" />
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Leitura da ficha</p>
          <h2 className="mt-2 font-display text-5xl leading-none text-white">{character.name}</h2>
          <p className="mt-3 text-sm leading-6 text-soft">
            {character.clan || 'Sem clã'} · {character.grade || 'Sem grau'} · {character.age} anos
          </p>
          <p className="mt-4 text-sm leading-6 text-soft">{character.appearance || 'Sem descrição visual cadastrada.'}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {(['hp', 'energy', 'sanity'] as const).map((resourceKey) => (
          <UtilityPanel key={resourceKey} className="rounded-[20px] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">{RESOURCE_LABELS[resourceKey]}</p>
            <p className="mt-2 text-lg font-semibold text-white">
              {character.resources[resourceKey].current}/{character.resources[resourceKey].max}
            </p>
          </UtilityPanel>
        ))}
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {ATTRIBUTE_CONFIG.map((attribute) => (
          <UtilityPanel key={attribute.key} className="rounded-[20px] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">{attribute.label}</p>
            <p className="mt-2 text-sm font-semibold text-white">
              {character.attributes[attribute.key].value >= 0 ? '+' : ''}
              {character.attributes[attribute.key].value} / {character.attributes[attribute.key].rank}
            </p>
          </UtilityPanel>
        ))}
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
  const canManageRoster = !session || session.role === 'gm';
  const canEditActiveCharacter =
    !session || session.role === 'gm' || (session.role === 'player' && session.characterId === activeCharacter.id);
  const isReadonlyViewer = Boolean(session && !canEditActiveCharacter);
  const visibleCharacters =
    session?.role === 'player' && session.characterId
      ? state.characters.filter((character) => character.id === session.characterId)
      : state.characters;

  if (!state.characters.length) {
    return <EmptyState title="Nenhuma ficha carregada." body="Crie uma mesa com personagens ou importe um estado para usar o workspace de fichas." />;
  }

  return (
    <div className="page-shell pb-8">
      <MesaHero
        eyebrow="Fichas da mesa"
        title={`${activeCharacter.name} em foco`}
        description="A ficha agora corre em um fluxo contínuo: identidade, recursos, atributos, arsenal, técnicas, passivas, votos, inventário e condições sem guias internas quebradas."
        actions={
          <>
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

      <div className="grid gap-4 md:grid-cols-4">
        <MesaMetricTile label="Personagens" value={state.characters.length} hint="Todos vinculados à mesa atual." />
        <MesaMetricTile label="Armas" value={activeCharacter.weapons.length} hint="Arsenal da ficha em foco." />
        <MesaMetricTile label="Técnicas" value={activeCharacter.techniques.length} hint="Repertório ativo da ficha atual." />
        <MesaMetricTile label="Itens" value={activeCharacter.inventory.items.length} hint="Inventário e dinheiro do personagem." />
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)_360px]">
        <div className="grid gap-6">
          {canManageRoster ? (
            <RosterSidebar />
          ) : (
            <ReadonlyRosterPanel characters={visibleCharacters} activeCharacterId={activeCharacter.id} onSelect={setActiveCharacter} />
          )}
        </div>

        <div className="grid gap-6">
          {canEditActiveCharacter ? <CharacterProfileEditor /> : <ReadonlyCharacterSummary character={activeCharacter} />}
          <CollectionsPanel section="all" editable={canEditActiveCharacter} />
          <ConditionsEditor editable={canEditActiveCharacter} />
        </div>

        <div className="page-right-rail">
          <MesaRailCard
            eyebrow="Permissão atual"
            title={session?.role === 'gm' ? 'Controle total' : session?.role === 'player' ? 'Edição vinculada' : 'Leitura'}
            description={
              session?.role === 'gm'
                ? 'Você administra todo o roster da mesa.'
                : session?.role === 'player'
                  ? session.characterId === activeCharacter.id
                    ? 'Esta ficha está vinculada à sua membership. Edição liberada.'
                    : 'Você pode visualizar outras fichas, mas edita apenas a ficha vinculada ao seu acesso.'
                  : 'Viewers acompanham a ficha em leitura.'
            }
          >
            <UtilityPanel className="rounded-[20px] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Ficha vinculada</p>
              <p className="mt-2 text-sm font-semibold text-white">
                {state.characters.find((character) => character.id === session?.characterId)?.name || 'Sem vínculo'}
              </p>
            </UtilityPanel>
          </MesaRailCard>

          <MesaRailCard
            eyebrow="Leitura rápida"
            title="Resumo da ficha"
            description="A rail lateral fica só com contexto operacional; a edição completa acontece no miolo contínuo da ficha."
          >
            <UtilityPanel className="rounded-[20px] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Condições ativas</p>
              <p className="mt-2 text-sm font-semibold text-white">{activeCharacter.conditions.length}</p>
            </UtilityPanel>
            <UtilityPanel className="rounded-[20px] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Dinheiro</p>
              <p className="mt-2 text-sm font-semibold text-white">{activeCharacter.inventory.money}</p>
            </UtilityPanel>
            <UtilityPanel className="rounded-[20px] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Passivas</p>
              <p className="mt-2 text-sm font-semibold text-white">{activeCharacter.passives.length}</p>
            </UtilityPanel>
          </MesaRailCard>

          {isReadonlyViewer ? (
            <MesaRailCard eyebrow="Leitura" title="Modo visualização" description="A edição foi bloqueada porque esta ficha não pertence ao seu papel na mesa." />
          ) : null}
        </div>
      </div>
    </div>
  );
}
