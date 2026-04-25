import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MesaRollsPage } from './mesa-rolls-page';

const workspaceMock = {
  state: {
    activeCharacterId: 'char-1',
    characters: [
      {
        id: 'char-1',
        name: 'Mysto',
        attributes: {
          strength: { value: 3, rank: 'A' },
          resistance: { value: 3, rank: 'A' },
          dexterity: { value: 2, rank: 'B' },
          speed: { value: 4, rank: 'S' },
          fight: { value: 2, rank: 'B' },
          precision: { value: 3, rank: 'A' },
          intelligence: { value: 2, rank: 'B' },
          charisma: { value: 1, rank: 'C' }
        }
      }
    ],
    log: [
      {
        id: 'log-1',
        timestamp: '2026-04-17T12:00:00.000Z',
        category: 'Rolagem',
        title: 'Força - Mysto',
        text: 'd20 12 +3 = 15',
        meta: 'Sucesso'
      }
    ]
  },
  lastRoll: {
    label: 'Força - Mysto',
    rolls: [12],
    total: 15,
    tn: 13,
    margin: 2,
    outcomeLabel: 'Sucesso',
    context: 'standard'
  },
  executeAttributeRoll: vi.fn(),
  executeCustomRoll: vi.fn(),
  clearLog: vi.fn(),
  online: {
    session: {
      role: 'gm'
    }
  }
};

vi.mock('@features/workspace/use-workspace', () => ({
  useWorkspace: () => workspaceMock
}));

describe('MesaRollsPage', () => {
  beforeEach(() => {
    workspaceMock.executeAttributeRoll.mockReset();
    workspaceMock.executeCustomRoll.mockReset();
    workspaceMock.clearLog.mockReset();
  });

  it('renders the rolls console with controls and ledger', () => {
    render(<MesaRollsPage />);

    expect(screen.getByRole('heading', { name: 'Rolagens' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Atributo' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Histórico' })).toBeInTheDocument();
    expect(screen.getAllByText('Força - Mysto').length).toBeGreaterThan(1);
  });

  it('submits a guided roll', async () => {
    const user = userEvent.setup();

    render(<MesaRollsPage />);

    await user.click(screen.getByRole('button', { name: 'Rolar atributo' }));

    expect(workspaceMock.executeAttributeRoll).toHaveBeenCalledWith({
      characterId: 'char-1',
      attributeKey: 'strength',
      context: 'standard',
      extraBonus: 0,
      tn: null
    });
  });
});
