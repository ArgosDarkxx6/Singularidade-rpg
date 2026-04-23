import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MesaLayout } from './mesa-layout';

const signOutMock = vi.fn();
const switchTableMock = vi.fn();
const connectToInviteMock = vi.fn();
const leaveCurrentTableMock = vi.fn();
const previewInviteMock = vi.fn();
const setActiveCharacterMock = vi.fn();
const addCharacterMock = vi.fn();
const removeCharacterMock = vi.fn();

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

const workspaceState = {
  isReady: true,
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
          role: 'gm' as 'gm' | 'player' | 'viewer',
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
        role: 'gm' as 'gm' | 'player' | 'viewer',
        characterId: '',
        characterName: '',
        isOwner: true
      }
    ],
    error: ''
  },
  state: {
    characters: [makeCharacter('char-1', 'Mysto'), makeCharacter('char-2', 'Kaori')]
  },
  activeCharacter: makeCharacter('char-1', 'Mysto'),
  tables: [
    {
      id: 'table-1',
      slug: 'mesa-alpha',
      name: 'Mesa Alpha',
      systemKey: 'singularidade',
      role: 'gm' as 'gm' | 'player' | 'viewer',
      status: 'Em sessão'
    },
    {
      id: 'table-2',
      slug: 'mesa-beta',
      name: 'Mesa Beta',
      systemKey: 'singularidade',
      role: 'player' as 'gm' | 'player' | 'viewer',
      status: 'Planejamento'
    }
  ],
  switchTable: switchTableMock,
  connectToInvite: connectToInviteMock,
  leaveCurrentTable: leaveCurrentTableMock,
  previewInvite: previewInviteMock,
  setActiveCharacter: setActiveCharacterMock,
  addCharacter: addCharacterMock,
  removeCharacter: removeCharacterMock
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

function renderMesaLayout(initialEntry = '/mesa/mesa-alpha') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
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
}

describe('MesaLayout', () => {
  beforeEach(() => {
    signOutMock.mockReset();
    switchTableMock.mockReset();
    connectToInviteMock.mockReset();
    leaveCurrentTableMock.mockReset();
    previewInviteMock.mockReset();
    setActiveCharacterMock.mockReset();
    addCharacterMock.mockReset();
    removeCharacterMock.mockReset();

    workspaceState.online.session = {
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
    workspaceState.tables[0] = {
      id: 'table-1',
      slug: 'mesa-alpha',
      name: 'Mesa Alpha',
      systemKey: 'singularidade',
      role: 'gm',
      status: 'Em sessão'
    };
    workspaceState.online.members = [
      {
        id: 'member-1',
        userId: 'user-1',
        nickname: 'Tester',
        role: 'gm',
        characterId: '',
        characterName: '',
        isOwner: true
      }
    ];
  });

  it('renders the mesa shell with persistent module navigation and layered shell containers', () => {
    renderMesaLayout();

    expect(screen.getByRole('heading', { name: 'Geral' })).toBeVisible();
    expect(screen.getByText('Overview content')).toBeInTheDocument();
    expect(screen.getAllByText('Mesa Alpha')[0]).toBeVisible();
    expect(screen.getAllByRole('link', { name: /Fichas/i }).length).toBeGreaterThan(0);
    expect(screen.queryByRole('link', { name: /Sessão/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Membros/i })).not.toBeInTheDocument();
    expect(document.querySelector('[data-shell-layer="rail"]')).toBeTruthy();
    expect(document.querySelector('[data-shell-layer="header"]')).toBeTruthy();
    expect(document.querySelector('[data-shell-layer="content"]')).toBeTruthy();
  });

  it('renders the GM roster in the mesa sidebar instead of the page body', async () => {
    const user = userEvent.setup();

    renderMesaLayout('/mesa/mesa-alpha/fichas');

    expect(screen.getByText('Elenco da mesa')).toBeVisible();
    expect(screen.queryByText(/Ficha em foco/i)).not.toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: 'Abrir' })[0]);
    expect(setActiveCharacterMock).toHaveBeenCalledWith('char-1');
  });

  it('hides the sheets module from viewer navigation and mobile tabs', () => {
    workspaceState.online.session = {
      ...workspaceState.online.session,
      role: 'viewer'
    };
    workspaceState.tables[0] = {
      ...workspaceState.tables[0],
      role: 'viewer'
    };
    workspaceState.online.members = [
      {
        id: 'member-1',
        userId: 'user-1',
        nickname: 'Tester',
        role: 'viewer',
        characterId: '',
        characterName: '',
        isOwner: false
      }
    ];

    renderMesaLayout();

    expect(screen.queryByRole('link', { name: /Fichas/i })).not.toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Geral' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: 'Rolagens' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: 'Ordem' }).length).toBeGreaterThan(0);
  });
});
