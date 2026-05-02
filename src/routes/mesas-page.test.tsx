import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MesasPage } from './mesas-page';

const createTableSessionMock = vi.fn();
const connectToInviteMock = vi.fn();
const connectToJoinCodeMock = vi.fn();
const switchTableMock = vi.fn();

vi.mock('@features/auth/hooks/use-auth', () => ({
  useAuth: () => ({
    user: {
      id: 'user-1',
      username: 'tester',
      displayName: 'Tester',
      avatarUrl: ''
    }
  })
}));

vi.mock('@features/workspace/hooks/use-workspace-segments', () => ({
  usePlatformTables: () => ({
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
    online: {
      session: {
        tableSlug: 'mesa-alpha'
      }
    },
    createTableSession: createTableSessionMock,
    connectToInvite: connectToInviteMock,
    connectToJoinCode: connectToJoinCodeMock,
    switchTable: switchTableMock
  })
}));

describe('MesasPage V2', () => {
  beforeEach(() => {
    createTableSessionMock.mockReset();
    connectToInviteMock.mockReset();
    connectToJoinCodeMock.mockReset();
    switchTableMock.mockReset();
    switchTableMock.mockResolvedValue({ tableSlug: 'mesa-alpha' });
  });

  it('renders active campaigns and entry actions without legacy page contracts', () => {
    render(
      <MemoryRouter>
        <MesasPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Mesas', level: 1 })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Nova mesa' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeVisible();
    expect(screen.getAllByText('Mesa Alpha').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Código ou convite').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Abrir entrada' })).toBeVisible();

    expect(document.querySelector('.page-right-rail')).toBeNull();
    expect(document.querySelector('.nexus-row')).toBeNull();
  });

  it('opens create and join flows from the V2 command area', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <MesasPage />
      </MemoryRouter>
    );

    await user.click(screen.getByRole('button', { name: 'Nova mesa' }));
    expect(screen.getByRole('heading', { name: 'Criar mesa' })).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Fechar' }));
    await user.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(screen.getByRole('heading', { name: 'Entrar em uma mesa' })).toBeVisible();
    expect(screen.getByLabelText('Código da mesa')).toBeVisible();
    await user.click(screen.getByRole('tab', { name: 'Convite' }));
    expect(screen.getByLabelText('URL de convite')).toBeVisible();
  });
});
