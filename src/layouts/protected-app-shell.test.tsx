import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProtectedAppShell } from './protected-app-shell';

const signOutMock = vi.fn();

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
    }
  },
  tables: [
    {
      id: 'table-1',
      slug: 'mesa-alpha',
      name: 'Mesa Alpha',
      systemKey: 'singularidade',
      role: 'gm' as const,
      status: 'Em sessão',
      isOwner: true,
      seriesName: 'Saga Alpha',
      campaignName: 'Arco Um',
      updatedAt: '2026-04-17T10:00:00.000Z'
    },
    {
      id: 'table-2',
      slug: 'mesa-beta',
      name: 'Mesa Beta',
      systemKey: 'singularidade',
      role: 'player' as const,
      status: 'Planejamento',
      isOwner: false,
      seriesName: 'Saga Beta',
      campaignName: 'Arco Dois',
      updatedAt: '2026-04-17T11:00:00.000Z'
    }
  ]
};

vi.mock('@features/auth/hooks/use-auth', () => ({
  useAuth: () => authState
}));

vi.mock('@features/workspace/use-workspace', () => ({
  useWorkspace: () => workspaceState
}));

vi.mock('@components/shared/logo-lockup', () => ({
  LogoLockup: () => <div>Project Nexus</div>
}));

describe('ProtectedAppShell', () => {
  beforeEach(() => {
    signOutMock.mockReset();
  });

  it('renders the platform shell around the portal and exposes active mesa context', () => {
    render(
      <MemoryRouter initialEntries={['/mesas']}>
        <Routes>
          <Route element={<ProtectedAppShell />}>
            <Route path="/mesas" element={<div>Portal content</div>} />
            <Route path="/conta" element={<div>Profile content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getAllByText('Mesas')[0]).toBeVisible();
    expect(screen.getByText('Portal content')).toBeVisible();
    expect(screen.getAllByText('Mesa Alpha')[0]).toBeVisible();
    expect(screen.getAllByRole('link', { name: /Hub/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /Conta/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Abrir mesa ativa/i })).toBeVisible();
    expect(document.querySelector('[data-shell-layer="rail"]')).toBeTruthy();
    expect(document.querySelector('[data-shell-layer="header"]')).toBeTruthy();
    expect(document.querySelector('[data-shell-layer="content"]')).toBeTruthy();
  });

  it('navigates between platform routes through the persistent shell', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/mesas']}>
        <Routes>
          <Route element={<ProtectedAppShell />}>
            <Route path="/mesas" element={<div>Portal content</div>} />
            <Route path="/conta" element={<div>Profile content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    await user.click(screen.getAllByRole('link', { name: /Conta/i })[0]);

    expect(screen.getByText('Profile content')).toBeVisible();
    expect(screen.getAllByText('Conta')[0]).toBeVisible();
  });
});
