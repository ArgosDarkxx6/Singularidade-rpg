import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MesaSheetsPage } from './mesa-sheets-page';

const setActiveCharacterMock = vi.fn();
const listCharacterCoresMock = vi.fn();
const createCharacterCoreMock = vi.fn();
const importCharacterCoreFromJsonMock = vi.fn();
const createTableCharacterFromCoreMock = vi.fn();
const exportStateMock = vi.fn();
const exportActiveCharacterJsonMock = vi.fn();

function makeCharacter(id: string, name: string) {
  return {
    id,
    name,
    age: 18,
    appearance: 'Visual operativo.',
    lore: `${name} segue em patrulha.`,
    clan: 'Kashimo',
    grade: 'Grau 3',
    avatarMode: 'none' as const,
    avatar: '',
    avatarPath: '',
    gallery: [],
    identity: {
      scar: '',
      anchor: '',
      trigger: ''
    },
    resources: {
      hp: { current: 20, max: 20 },
      energy: { current: 10, max: 10 },
      sanity: { current: 50, max: 50 }
    },
    attributes: {
      strength: { value: 3, rank: 'A' as const },
      resistance: { value: 3, rank: 'A' as const },
      dexterity: { value: 2, rank: 'B' as const },
      speed: { value: 4, rank: 'S' as const },
      fight: { value: 2, rank: 'B' as const },
      precision: { value: 3, rank: 'A' as const },
      intelligence: { value: 2, rank: 'B' as const },
      charisma: { value: 1, rank: 'C' as const }
    },
    weapons: [],
    techniques: [],
    passives: [],
    vows: [],
    inventory: {
      money: 100,
      items: []
    },
    conditions: []
  };
}

const workspaceMock = {
  state: {
    characters: [makeCharacter('char-1', 'Mysto'), makeCharacter('char-2', 'Kaori')]
  },
  activeCharacter: makeCharacter('char-2', 'Kaori'),
  online: {
    session: {
      tableId: 'table-1',
      membershipId: 'member-1',
      tableSlug: 'mesa-alpha',
      tableName: 'Mesa Alpha',
      systemKey: 'singularidade',
      role: 'gm' as 'gm' | 'player' | 'viewer',
      nickname: 'Tester',
      characterId: '',
      lastJoinedAt: ''
    }
  },
  setActiveCharacter: setActiveCharacterMock,
  exportState: exportStateMock,
  exportActiveCharacterJson: exportActiveCharacterJsonMock,
  listCharacterCores: listCharacterCoresMock,
  createCharacterCore: createCharacterCoreMock,
  importCharacterCoreFromJson: importCharacterCoreFromJsonMock,
  createTableCharacterFromCore: createTableCharacterFromCoreMock,
  hasBoundSheet: true,
  canAccessSheetsModule: true,
  canManageRoster: true,
  hasPendingBoundSheet: false,
  boundSheetCharacterId: ''
};

vi.mock('@features/workspace/use-workspace', () => ({
  useWorkspace: () => workspaceMock
}));

vi.mock('@features/sheets/components/profile-editor', () => ({
  CharacterProfileEditor: ({ editable, canOperateResources }: { editable?: boolean; canOperateResources?: boolean }) => (
    <div>
      Profile editor {editable ? 'editing' : 'reading'} {canOperateResources ? 'operational' : 'locked'}
    </div>
  )
}));

vi.mock('@features/sheets/components/collections-panel', () => ({
  CollectionsPanel: () => <div>Collections panel</div>
}));

vi.mock('@features/sheets/components/conditions-editor', () => ({
  ConditionsEditor: () => <div>Conditions panel</div>
}));

describe('MesaSheetsPage', () => {
  beforeEach(() => {
    setActiveCharacterMock.mockReset();
    listCharacterCoresMock.mockReset();
    createCharacterCoreMock.mockReset();
    importCharacterCoreFromJsonMock.mockReset();
    createTableCharacterFromCoreMock.mockReset();
    exportStateMock.mockReset();
    exportActiveCharacterJsonMock.mockReset();

    workspaceMock.activeCharacter = makeCharacter('char-2', 'Kaori');
    workspaceMock.online.session = {
      tableId: 'table-1',
      membershipId: 'member-1',
      tableSlug: 'mesa-alpha',
      tableName: 'Mesa Alpha',
      systemKey: 'singularidade',
      role: 'gm',
      nickname: 'Tester',
      characterId: '',
      lastJoinedAt: ''
    };
    workspaceMock.hasBoundSheet = true;
    workspaceMock.canAccessSheetsModule = true;
    workspaceMock.canManageRoster = true;
    workspaceMock.hasPendingBoundSheet = false;
    workspaceMock.boundSheetCharacterId = '';
    listCharacterCoresMock.mockResolvedValue([
      {
        id: 'core-1',
        ownerId: 'user-1',
        name: 'Veterano',
        clan: 'Kashimo',
        grade: 'Grau 2',
        lore: '',
        avatarUrl: '',
        gallery: [],
        updatedAt: '',
        createdAt: ''
      }
    ]);
  });

  it('blocks viewers from the sheets module', () => {
    workspaceMock.online.session = {
      ...workspaceMock.online.session,
      role: 'viewer'
    };
    workspaceMock.canAccessSheetsModule = false;
    workspaceMock.canManageRoster = false;

    render(<MesaSheetsPage />);

    expect(screen.getByText('Fichas indisponíveis para este papel.')).toBeInTheDocument();
    expect(screen.queryByText('Elenco da mesa')).not.toBeInTheDocument();
  });

  it('shows only the player empty state when there is no bound sheet', async () => {
    workspaceMock.online.session = {
      ...workspaceMock.online.session,
      role: 'player',
      nickname: 'Kaori',
      characterId: ''
    };
    workspaceMock.hasBoundSheet = false;
    workspaceMock.canManageRoster = false;

    render(<MesaSheetsPage />);

    expect(screen.getByText('Você ainda não tem ficha nesta mesa')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Criar personagem na mesa' })).toBeVisible();
    expect(screen.getByRole('button', { name: /Importar JSON/i })).toBeVisible();
    expect(screen.getByText('Usar personagem de Meus personagens')).toBeVisible();
    expect(screen.queryByText('Mysto')).not.toBeInTheDocument();
    expect(await screen.findByText('Veterano')).toBeInTheDocument();
  });

  it('keeps a bound player locked to the linked sheet and removes body redundancy', async () => {
    workspaceMock.online.session = {
      ...workspaceMock.online.session,
      role: 'player',
      characterId: 'char-1'
    };
    workspaceMock.hasBoundSheet = true;
    workspaceMock.canManageRoster = false;
    workspaceMock.boundSheetCharacterId = 'char-1';

    render(<MesaSheetsPage />);

    await waitFor(() => {
      expect(setActiveCharacterMock).toHaveBeenCalledWith('char-1');
    });

    expect(screen.getByRole('heading', { name: 'Mysto' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Editar identidade' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Exportar personagem JSON' })).toBeInTheDocument();
    expect(screen.getByText('Collections panel')).toBeVisible();
    expect(screen.getByText('Conditions panel')).toBeVisible();
    expect(screen.queryByText(/Ficha em foco/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Elenco da mesa')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Exportar mesa JSON' })).not.toBeInTheDocument();
    expect(screen.getByText('O que pertence à conta e o que pertence à mesa')).toBeVisible();
  });

  it('keeps GM away from core editing while preserving operational access', () => {
    render(<MesaSheetsPage />);

    expect(screen.getByRole('heading', { name: 'Kaori' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Editar identidade' })).not.toBeInTheDocument();
    expect(screen.getByText(/GM opera recursos e mecânicas/i)).toBeVisible();
    expect(screen.getByText('Profile editor reading operational')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Exportar mesa JSON' })).toBeInTheDocument();
  });

  it('lets a player bind an existing core from the empty state', async () => {
    const user = userEvent.setup();

    workspaceMock.online.session = {
      ...workspaceMock.online.session,
      role: 'player',
      characterId: ''
    };
    workspaceMock.hasBoundSheet = false;
    workspaceMock.canManageRoster = false;

    render(<MesaSheetsPage />);

    const coreCardTitle = await screen.findByText('Veterano');
    await user.click(coreCardTitle.closest('button')!);

    expect(createTableCharacterFromCoreMock).toHaveBeenCalledWith('core-1');
  });
});
