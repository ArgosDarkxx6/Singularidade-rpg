import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MyCharactersPage } from './my-characters-page';

const listCharacterCoresMock = vi.fn();
const createCharacterCoreMock = vi.fn();
const importCharacterCoreFromJsonMock = vi.fn();
const transferCharacterCoreOwnershipMock = vi.fn();

const workspaceMock = {
  listCharacterCores: listCharacterCoresMock,
  createCharacterCore: createCharacterCoreMock,
  importCharacterCoreFromJson: importCharacterCoreFromJsonMock,
  transferCharacterCoreOwnership: transferCharacterCoreOwnershipMock
};

vi.mock('@features/workspace/use-workspace', () => ({
  useWorkspace: () => workspaceMock
}));

const baseCore = {
  id: 'core-1',
  ownerId: 'user-1',
  name: 'Mysto',
  clan: 'Kashimo',
  grade: 'Grau 3',
  lore: 'Protege o grupo mesmo quando o caos cresce.',
  avatarUrl: '',
  gallery: [],
  updatedAt: '2026-04-23T00:00:00.000Z',
  createdAt: '2026-04-22T00:00:00.000Z'
};

const characterJson = {
  id: 'char-1',
  name: 'Mysto',
  age: 18,
  appearance: 'Casaco escuro e olhar eletrico.',
  lore: 'Protege o grupo mesmo quando o caos cresce.',
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

describe('MyCharactersPage', () => {
  beforeEach(() => {
    listCharacterCoresMock.mockReset();
    createCharacterCoreMock.mockReset();
    importCharacterCoreFromJsonMock.mockReset();
    transferCharacterCoreOwnershipMock.mockReset();

    listCharacterCoresMock.mockResolvedValue([baseCore]);
    createCharacterCoreMock.mockResolvedValue(baseCore);
    importCharacterCoreFromJsonMock.mockResolvedValue(baseCore);
    transferCharacterCoreOwnershipMock.mockResolvedValue(undefined);
  });

  it('keeps primary actions visible without relying on a side rail', async () => {
    render(<MyCharactersPage />);

    expect(screen.getByRole('button', { name: 'Criar nucleo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Importar JSON' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Atualizar' })).toBeInTheDocument();
    expect(await screen.findByText('Seus personagens')).toBeVisible();
  });

  it('creates a character core through the compact dialog flow', async () => {
    const user = userEvent.setup();

    render(<MyCharactersPage />);

    await user.click(screen.getByRole('button', { name: 'Criar nucleo' }));
    await user.type(screen.getByLabelText('Nome'), 'Kaori');
    await user.type(screen.getByLabelText('Idade'), '22');
    await user.type(screen.getByLabelText('Cla'), 'Gojo');
    await user.type(screen.getByLabelText('Grau'), 'Especial');
    await user.type(screen.getByLabelText('Aparencia'), 'Uniforme azul.');
    await user.type(screen.getByLabelText('Lore'), 'Nova nucleo criada fora da mesa.');
    const createButtons = screen.getAllByRole('button', { name: 'Criar nucleo' });
    await user.click(createButtons[createButtons.length - 1]);

    await waitFor(() => {
      expect(createCharacterCoreMock).toHaveBeenCalledWith({
        name: 'Kaori',
        age: 22,
        clan: 'Gojo',
        grade: 'Especial',
        appearance: 'Uniforme azul.',
        lore: 'Nova nucleo criada fora da mesa.'
      });
    });
  });

  it('imports JSON and exposes transfer ownership in the same compact surface', async () => {
    const user = userEvent.setup();

    render(<MyCharactersPage />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeTruthy();

    const importFile = {
      text: vi.fn().mockResolvedValue(JSON.stringify(characterJson))
    } as unknown as File;

    fireEvent.change(input, {
      target: {
        files: [importFile]
      }
    });

    await waitFor(() => {
      expect(importCharacterCoreFromJsonMock).toHaveBeenCalled();
    });

    await screen.findByText('Mysto');
    await user.click(await screen.findByRole('button', { name: 'Transferir posse' }));
    await user.type(screen.getByLabelText('Transferir para username'), 'destino');
    await user.type(screen.getByLabelText('Confirmar senha atual'), 'senha123');
    await user.click(screen.getByRole('button', { name: 'Confirmar transferencia' }));

    await waitFor(() => {
      expect(transferCharacterCoreOwnershipMock).toHaveBeenCalledWith({
        coreId: 'core-1',
        targetUsername: 'destino',
        currentPassword: 'senha123'
      });
    });
  });
});
