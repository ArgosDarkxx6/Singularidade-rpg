import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CharacterGalleryPanel } from './character-gallery-panel';

const workspaceMock = {
  activeCharacter: {
    id: 'char-1',
    name: 'Mysto',
    gallery: [
      {
        id: 'img-1',
        url: 'https://example.com/gallery-1.png',
        path: 'gallery/path-1.png',
        caption: 'Uniforme principal',
        sortOrder: 0
      },
      {
        id: 'img-2',
        url: 'https://example.com/gallery-2.png',
        path: 'gallery/path-2.png',
        caption: 'Cena de confronto',
        sortOrder: 1
      }
    ]
  },
  uploadCharacterGalleryImage: vi.fn().mockResolvedValue(undefined),
  updateCharacterGalleryImage: vi.fn(),
  removeCharacterGalleryImage: vi.fn(),
  reorderCharacterGallery: vi.fn(),
  flushPersistence: vi.fn().mockResolvedValue(undefined)
};

vi.mock('@features/workspace/use-workspace', () => ({
  useWorkspace: () => workspaceMock
}));

describe('CharacterGalleryPanel', () => {
  beforeEach(() => {
    workspaceMock.uploadCharacterGalleryImage.mockReset();
    workspaceMock.updateCharacterGalleryImage.mockReset();
    workspaceMock.removeCharacterGalleryImage.mockReset();
    workspaceMock.reorderCharacterGallery.mockReset();
    workspaceMock.flushPersistence.mockReset();
    workspaceMock.flushPersistence.mockResolvedValue(undefined);
  });

  it('opens the viewer for gallery images', async () => {
    const user = userEvent.setup();

    render(<CharacterGalleryPanel editable={false} />);

    await user.click(screen.getByAltText('Uniforme principal'));

    expect(screen.getByRole('heading', { name: 'Mysto' })).toBeVisible();
    expect(screen.getAllByText('Uniforme principal').length).toBeGreaterThan(1);
    expect(screen.getByRole('button', { name: 'Próxima' })).toBeVisible();
  });

  it('reorders and removes images in edit mode', async () => {
    const user = userEvent.setup();

    render(<CharacterGalleryPanel editable />);

    await user.click(screen.getAllByRole('button', { name: 'Descer' })[0]);

    await waitFor(() => {
      expect(workspaceMock.reorderCharacterGallery).toHaveBeenCalledWith('char-1', ['img-2', 'img-1']);
      expect(workspaceMock.flushPersistence).toHaveBeenCalled();
    });

    await user.click(screen.getAllByRole('button', { name: 'Remover' })[0]);

    await waitFor(() => {
      expect(workspaceMock.removeCharacterGalleryImage).toHaveBeenCalledWith('char-1', 'img-1');
    });
  });
});
