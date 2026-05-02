import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HubPage } from './hub-page';

const listUserCharactersMock = vi.fn();

vi.mock('@features/workspace/hooks/use-workspace-segments', () => ({
  usePlatformHub: () => ({
    user: {
      id: 'user-1',
      username: 'tester',
      displayName: 'Tester',
      avatarUrl: ''
    },
    profile: {
      username: 'tester',
      displayName: 'Tester',
      avatarUrl: ''
    },
    tables: [
      {
        id: 'table-1',
        slug: 'mesa-alpha',
        name: 'Mesa Alpha',
        systemKey: 'singularidade',
        role: 'gm',
        status: 'Planejamento',
        isOwner: true,
        seriesName: 'Saga Alpha',
        campaignName: 'Arco Um',
        updatedAt: '2026-04-17T10:00:00.000Z'
      }
    ],
    listUserCharacters: listUserCharactersMock
  })
}));

describe('HubPage V2', () => {
  beforeEach(() => {
    listUserCharactersMock.mockReset();
    listUserCharactersMock.mockResolvedValue([
      {
        id: 'char-1',
        name: 'Elara Nyx',
        clan: 'Guardião',
        grade: 'Nível 7',
        avatarUrl: '',
        tableId: 'table-1',
        tableName: 'Mesa Alpha',
        updatedAt: '2026-04-17T12:00:00.000Z'
      }
    ]);
  });

  it('renders a compact feed without legacy page contracts', async () => {
    render(
      <MemoryRouter>
        <HubPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Atividade recente' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Mesas' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Personagens' })).toBeVisible();
    expect(screen.getByText('Continuidade')).toBeVisible();
    await waitFor(() => {
      expect(listUserCharactersMock).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.getAllByText('Elara Nyx').length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText('Mesa Alpha').length).toBeGreaterThan(0);

    expect(document.querySelector('.page-right-rail')).toBeNull();
    expect(document.querySelector('.nexus-row')).toBeNull();
  });
});
