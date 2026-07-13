import type { FootballDataApi, FootballMatch, MatchInfo } from '../src/types';

export const ARGENTINA_TEAM_ID = 7627;
export const FRANCE_TEAM_ID = 758;

export function createSampleMatchInfo(overrides: Partial<MatchInfo> = {}): MatchInfo {
  return {
    id: 1001,
    startTime: new Date('2026-06-15T18:00:00.000Z'),
    rivalName: 'Francia',
    rivalId: FRANCE_TEAM_ID,
    isArgentinaHome: true,
    status: 'SCHEDULED',
    ...overrides,
  };
}

export function createFinishedMatch(
  winner: 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW',
  options: {
    argentinaHome?: boolean;
    homeGoals?: number;
    awayGoals?: number;
    status?: FootballMatch['status'];
    matchId?: number;
  } = {},
): FootballMatch {
  const argentinaHome = options.argentinaHome ?? true;
  const homeGoals = options.homeGoals ?? (winner === 'HOME_TEAM' ? 2 : winner === 'AWAY_TEAM' ? 0 : 1);
  const awayGoals = options.awayGoals ?? (winner === 'AWAY_TEAM' ? 2 : winner === 'HOME_TEAM' ? 0 : 1);

  return {
    id: options.matchId ?? 1001,
    utcDate: '2026-06-15T18:00:00.000Z',
    status: options.status ?? 'FINISHED',
    homeTeam: argentinaHome
      ? { id: ARGENTINA_TEAM_ID, name: 'Argentina' }
      : { id: FRANCE_TEAM_ID, name: 'Francia' },
    awayTeam: argentinaHome
      ? { id: FRANCE_TEAM_ID, name: 'Francia' }
      : { id: ARGENTINA_TEAM_ID, name: 'Argentina' },
    score: {
      winner,
      fullTime: {
        homeTeam: homeGoals,
        awayTeam: awayGoals,
      },
    },
  };
}

export class MockFootballDataApi implements FootballDataApi {
  nextMatch: MatchInfo | null;
  matchesById: Map<number, FootballMatch>;

  constructor(nextMatch: MatchInfo | null, matchesById: Map<number, FootballMatch> = new Map()) {
    this.nextMatch = nextMatch;
    this.matchesById = matchesById;
  }

  async getNextArgentinaMatch(): Promise<MatchInfo | null> {
    return this.nextMatch;
  }

  async getMatchById(matchId: number): Promise<FootballMatch> {
    const match = this.matchesById.get(matchId);
    if (!match) {
      throw new Error(`Partido mock no encontrado: ${matchId}`);
    }
    return match;
  }
}
