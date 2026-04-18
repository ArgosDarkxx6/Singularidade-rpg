import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CharacterProfileEditor } from './profile-editor';

const workspaceMock = {
  activeCharacter: {
    id: 'char-1',
    name: 'Mysto',
    age: 18,
    appearance: 'Casaco escuro e olhar elétrico.',
    lore: 'Cresceu cercado por caos, mas ainda tenta proteger quem escolheu ficar ao lado dele.',
    clan: 'Kashimo',
    grade: 'Grau 3',
    avatarMode: 'url' as const,
    avatar: 'https://example.com/avatar.png',
    avatarPath: '',
    gallery: [
      {
        id: 'img-1',
        url: 'https://example.com/gallery-1.png',
        path: 'gallery/path-1.png',
        caption: 'Uniforme principal',
        sortOrder: 0
      }
    ],
    identity: {
      scar: 'Sempre volta para a mesma cicatriz.',
      anchor: 'Proteção do grupo.',
      trigger: 'Raiva fria.'
    },
    resources: {
      hp: { current: 20, max: 20 },
      energy: { current: 10, max: 10 },
      sanity: { current: 50, max: 50 }
    },
    attributes: {
      strength: { value: 3, rank: 'A' },
      resistance: { value: 3, rank: 'A' },
      dexterity: { value: 2, rank: 'B' },
      speed: { value: 4, rank: 'S' },
      fight: { value: 2, rank: 'B' },
      precision: { value: 3, rank: 'A' },
      intelligence: { value: 2, rank: 'B' },
      charisma: { value: 1, rank: 'C' }
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
  },
  adjustResource: vi.fn(),
  updateCharacterField: vi.fn(),
  updateCharacterLore: vi.fn(),
  setResourceCurrent: vi.fn(),
  setResourceMax: vi.fn(),
  setAttributeValue: vi.fn(),
  setAttributeRank: vi.fn(),
  setCharacterAvatar: vi.fn(),
  uploadCharacterAvatar: vi.fn(),
  clearCharacterAvatar: vi.fn(),
  executeAttributeRoll: vi.fn().mockReturnValue({ attributeLabel: 'Força', total: 14 }),
  flushPersistence: vi.fn().mockResolvedValue(undefined),
  uploadCharacterGalleryImage: vi.fn().mockResolvedValue(undefined),
  updateCharacterGalleryImage: vi.fn(),
  removeCharacterGalleryImage: vi.fn(),
  reorderCharacterGallery: vi.fn()
};

vi.mock('@features/workspace/use-workspace', () => ({
  useWorkspace: () => workspaceMock
}));

describe('CharacterProfileEditor', () => {
  beforeEach(() => {
    Object.values(workspaceMock).forEach((value) => {
      if (typeof value === 'function' && 'mockReset' in value) {
        value.mockReset();
      }
    });
    workspaceMock.executeAttributeRoll.mockReturnValue({ attributeLabel: 'Força', total: 14 });
    workspaceMock.flushPersistence.mockResolvedValue(undefined);
    workspaceMock.uploadCharacterGalleryImage.mockResolvedValue(undefined);
  });

  it('renders lore in readonly mode', () => {
    render(<CharacterProfileEditor editable={false} />);

    expect(screen.getAllByText('Lore').length).toBeGreaterThan(1);
    expect(screen.getByText(/Cresceu cercado por caos/)).toBeVisible();
    expect(screen.getByText('Imagens extras')).toBeVisible();
    expect(screen.getByText('Uniforme principal')).toBeVisible();
  });

  it('saves lore changes in edit mode', async () => {
    const user = userEvent.setup();

    render(<CharacterProfileEditor editable />);

    const loreField = screen.getByLabelText('Lore');
    await user.clear(loreField);
    await user.type(loreField, 'Novo trecho de lore para a ficha.');
    await user.click(screen.getByRole('button', { name: 'Salvar ficha principal' }));

    await waitFor(() => {
      expect(workspaceMock.updateCharacterLore).toHaveBeenCalledWith('char-1', 'Novo trecho de lore para a ficha.');
      expect(workspaceMock.flushPersistence).toHaveBeenCalled();
    });
  });
});
