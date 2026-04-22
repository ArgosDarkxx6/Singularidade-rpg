import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MesaLayout } from './mesa-layout';

const signOutMock = vi.fn();
const switchTableMock = vi.fn();
const connectToInviteMock = vi.fn();
const leaveCurrentTableMock = vi.fn();

const authState = {
  user: {
    id: 'user-1',
    email: 'tester@example.com',
    username: 'tester',
    displayName: 'Tester',
    avatarUrl: '',
    avatarPath: ''
  },
  signOut: signOutMock
};

const workspaceState = {
  isReady: true,
  online: {
    session: {
      tableId: 'table-1',
      membershipId: 'member-1',
      tableSlug: 'mesa-alpha',
      tableName: 'Mesa Alpha',
      systemKey: 'singularidade',
      role: 'gm' as const,
      nickname: 'Tester',
      characterId: '',
      lastJoinedAt: ''
    },
    table: {
      id: 'table-1',
      slug: 'mesa-alpha',
      name: 'Mesa Alpha',
      systemKey: 'singularidade' as const,
      ownerId: 'user-1',
      updatedAt: '2026-04-17T10:00:00.000Z',
      meta: {
        tableName: 'Mesa Alpha',
        description: 'Mesa principal',
        slotCount: 4,
        seriesName: 'Saga Alpha',
        campaignName: 'Arco Um'
      },
      currentSession: {
        id: 'session-1',
        tableId: 'table-1',
        episodeNumber: '01',
        episodeTitle: 'Primeiro arco',
        status: 'Em sessão',
        sessionDate: '',
        location: 'Distrito Central',
        objective: 'Sobreviver',
        recap: 'A sessão já começou.',
        notes: '',
        isActive: true,
        createdBy: 'Tester',
        createdAt: '',
        updatedAt: ''
      },
      memberships: [
        {
          id: 'member-1',
          userId: 'user-1',
          nickname: 'Tester',
          role: 'gm' as const,
          characterId: '',
          characterName: '',
          isOwner: true
        }
      ],
      snapshots: [],
      joinCodes: [],
      sessionAttendances: [],
      sessionHistoryPreview: [],
      state: {} as never
    },
    members: [
      {
        id: 'member-1',
        userId: 'user-1',
        nickname: 'Tester',
        role: 'gm' as const,
        characterId: '',
        characterName: '',
        isOwner: true
      }
    ],
    error: ''
  },
  tables: [
    {
      id: 'table-1',
      slug: 'mesa-alpha',
      name: 'Mesa Alpha',
      systemKey: 'singularidade',
      role: 'gm' as const,
      status: 'Em sessão'
    },
    {
      id: 'table-2',
      slug: 'mesa-beta',
      name: 'Mesa Beta',
      systemKey: 'singularidade',
      role: 'player' as const,
      status: 'Planejamento'
    }
  ],
  switchTable: switchTableMock,
  connectToInvite: connectToInviteMock,
  leaveCurrentTable: leaveCurrentTableMock
};

vi.mock('@features/auth/hooks/use-auth', () => ({
  useAuth: () => authState
}));

vi.mock('@features/workspace/use-workspace', () => ({
  useWorkspace: () => workspaceState
}));

vi.mock('@components/shared/logo-lockup', () => ({
  LogoLockup: () => <div>System Logo</div>
}));

describe('MesaLayout', () => {
  beforeEach(() => {
    signOutMock.mockReset();
    switchTableMock.mockReset();
    connectToInviteMock.mockReset();
    leaveCurrentTableMock.mockReset();
  });

  it('renders the mesa shell with persistent module navigation', () => {
    render(
      <MemoryRouter initialEntries={['/mesa/mesa-alpha']}>
        <Routes>
          <Route path="/mesa/:slug" element={<MesaLayout />}>
            <Route index element={<div>Overview content</div>} />
            <Route path="fichas" element={<div>Fichas content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Geral' })).toBeVisible();
    expect(screen.getByText('Overview content')).toBeInTheDocument();
    expect(screen.getAllByText('Mesa Alpha')[0]).toBeVisible();
    expect(screen.getAllByRole('link', { name: /Fichas/i }).length).toBeGreaterThan(0);
    expect(screen.queryByRole('link', { name: /Sessão/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Membros/i })).not.toBeInTheDocument();
  });

  it('switches module routes inside the mesa shell', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/mesa/mesa-alpha']}>
        <Routes>
          <Route path="/mesa/:slug" element={<MesaLayout />}>
            <Route index element={<div>Overview content</div>} />
            <Route path="fichas" element={<div>Fichas content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    await user.click(screen.getAllByRole('link', { name: /Fichas/i })[0]);

    expect(screen.getByText('Fichas content')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Fichas' })).toBeVisible();
  });

  it('renders the mobile bottom navigation with four primary mesa tabs', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/mesa/mesa-alpha']}>
        <Routes>
          <Route path="/mesa/:slug" element={<MesaLayout />}>
            <Route index element={<div>Overview content</div>} />
            <Route path="fichas" element={<div>Fichas content</div>} />
            <Route path="rolagens" element={<div>Rolagens content</div>} />
            <Route path="ordem" element={<div>Ordem content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    const geralLinks = screen.getAllByRole('link', { name: 'Geral' });
    const fichasLinks = screen.getAllByRole('link', { name: 'Fichas' });
    const rolagensLinks = screen.getAllByRole('link', { name: 'Rolagens' });
    const ordemLinks = screen.getAllByRole('link', { name: 'Ordem' });

    expect(geralLinks.length).toBeGreaterThan(0);
    expect(fichasLinks.length).toBeGreaterThan(0);
    expect(rolagensLinks.length).toBeGreaterThan(0);
    expect(ordemLinks.length).toBeGreaterThan(0);
    expect(geralLinks.some((link) => link.getAttribute('aria-current') === 'page')).toBe(true);

    await user.click(fichasLinks[0]);
    expect(screen.getByText('Fichas content')).toBeVisible();
  });
});
