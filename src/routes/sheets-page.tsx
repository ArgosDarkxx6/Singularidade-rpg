import { PageIntro } from '@components/shared/page-intro';
import { Button } from '@components/ui/button';
import { RosterSidebar } from '@features/sheets/components/roster-sidebar';
import { CharacterProfileEditor } from '@features/sheets/components/profile-editor';
import { ConditionsEditor } from '@features/sheets/components/conditions-editor';
import { CollectionsPanel } from '@features/sheets/components/collections-panel';
import { useWorkspace } from '@features/workspace/use-workspace';
import { useSyncView } from '@hooks/use-sync-view';
import { Download, FileJson, FileText } from 'lucide-react';

export function SheetsPage() {
  useSyncView('sheet');

  const { activeCharacter, state, copyActiveCharacterText, downloadActiveCharacterText, exportState } = useWorkspace();

  return (
    <div className="page-grid">
      <PageIntro
        eyebrow="Roster e ficha ativa"
        title={`${activeCharacter.name}, ${activeCharacter.clan || 'Sem cla'}.`}
        description="Gerencie identidade, recursos, atributos, condições, arsenal, técnicas, votos e inventário em uma ficha única, tipada e pronta para sincronizar."
        chips={[`${state.characters.length} personagens`, `${activeCharacter.weapons.length} armas`, `${activeCharacter.techniques.length} tecnicas`, `${activeCharacter.inventory.items.length} itens`]}
        actions={
          <>
            <Button variant="secondary" onClick={() => void copyActiveCharacterText()}>
              <FileText className="size-4" />
              Copiar ficha
            </Button>
            <Button variant="secondary" onClick={downloadActiveCharacterText}>
              <Download className="size-4" />
              Baixar TXT
            </Button>
            <Button variant="ghost" onClick={exportState}>
              <FileJson className="size-4" />
              Exportar JSON
            </Button>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[330px_minmax(0,1fr)]">
        <RosterSidebar />
        <div className="grid gap-6">
          <CharacterProfileEditor />
          <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
            <ConditionsEditor />
            <CollectionsPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
