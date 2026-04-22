import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { MesaOverviewPage } from './mesa-overview-page';

const workspaceMock = {
  state: {
    characters: [
      {
        id: 'char-1',
        name: 'Mysto',
        age: 18,
        appearance: 'Casaco escuro e olhar elétrico.',
        lore: 'Protege o grupo mesmo quando o caos cresce.',
        clan: 'Kashimo',
        grade: 'Grau 3',
        avatarMode: 'none' as const,
        avatar: '',
        avatarPath: '',
        gallery: [],
        identity: { scar: '', anchor: '', trigger: '' },
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
        inventory: { money: 100, items: [] },
        conditions: []
      }
    ]
  },
  activeCharacter: {
    id: 'char-1',
    name: 'Mysto',
    age: 18,
    appearance: 'Casaco escuro e olhar elétrico.',
    lore: 'Protege o grupo mesmo quando o caos cresce.',
    clan: 'Kashimo',
    grade: 'Grau 3',
    avatarMode: 'none' as const,
    avatar: '',
    avatarPath: '',
    gallery: [],
    identity: { scar: '', anchor: '', trigger: '' },
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
    inventory: { money: 100, items: [] },
    conditions: []
  },
  online: {
    table: {
      id: 'table-1',
      slug: 'mesa-alpha',
      name: 'Mesa Alpha',
      systemKey: 'singularidade' as const,
      ownerId: 'user-1',
      updatedAt: '2026-04-18T00:00:00.000Z',
      createdAt: '2026-04-01T00:00:00.000Z',
      lastEditor: 'Tester',
      meta: {
        tableName: 'Mesa Alpha',
        description: 'Campanha urbana com foco em tensão política.',
        slotCount: 4,
        seriesName: 'Saga Alpha',
        campaignName: 'Arco Um'
      },
      state: {} as never,
      currentSession: {
        id: 'session-1',
        tableId: 'table-1',
        episodeNumber: '01',
        episodeTitle: 'Primeiro arco',
        status: 'Em sessão',
        sessionDate: '',
        location: 'Distrito Central',
        objective: 'Sobreviver ao turno da noite.',
        recap: 'A campanha entrou numa fase crítica.',
        notes: '',
        isActive: true,
        createdBy: 'Tester',
        createdAt: '',
        updatedAt: ''
      },
      sessionAttendances: [],
      sessionHistoryPreview: [],
      memberships: [
        {
          id: 'member-1',
          userId: 'user-1',
          nickname: 'Tester',
          role: 'gm' as const,
          characterId: '',
          characterName: '',
          isOwner: true
        },
        {
          id: 'member-2',
          userId: 'user-2',
          nickname: 'Kaori',
          role: 'player' as const,
          characterId: 'char-1',
          characterName: 'Mysto',
          isOwner: false
        }
      ],
      invites: [],
      joinCodes: [],
      snapshots: [
        {
          id: 'snap-1',
          label: 'Pré-combate',
          actorName: 'Tester',
          createdAt: '2026-04-18T00:00:00.000Z',
          state: {} as never
        }
      ]
    },
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
    members: [
      {
        id: 'member-1',
        userId: 'user-1',
        nickname: 'Tester',
        role: 'gm' as const,
        characterId: '',
        characterName: '',
        isOwner: true
      },
      {
        id: 'member-2',
        userId: 'user-2',
        nickname: 'Kaori',
        role: 'player' as const,
        characterId: 'char-1',
        characterName: 'Mysto',
        isOwner: false
      }
    ]
  }
};

vi.mock('@features/workspace/use-workspace', () => ({
  useWorkspace: () => workspaceMock
}));

describe('MesaOverviewPage', () => {
  it('renders the new Geral view with campaign-first hierarchy', () => {
    render(
      <MemoryRouter initialEntries={['/mesa/mesa-alpha']}>
        <Routes>
          <Route path="/mesa/:slug" element={<MesaOverviewPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Mesa Alpha' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Leitura central da operação' })).toBeInTheDocument();
    expect(screen.getAllByText('Campanha urbana com foco em tensão política.').length).toBeGreaterThan(1);
    expect(screen.getAllByText('Saga Alpha').length).toBeGreaterThan(1);
    expect(screen.getAllByText('Arco Um').length).toBeGreaterThan(1);
    expect(screen.getByRole('button', { name: /Criar sessao/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Convidar membro/i })).toBeInTheDocument();
    expect(screen.getByText('Governança rápida')).toBeVisible();
    expect(screen.getByText('Snapshots recentes')).toBeVisible();
  });
});
