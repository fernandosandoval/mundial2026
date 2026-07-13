import { filterMatchesForToday } from '../../src/dailyCron';
import type { FootballDataApi, FootballMatch, MatchInfo } from '../../src/types';

export const ARGENTINA_TEAM_ID = 7627;
export const FRANCE_TEAM_ID = 758;
export const BRAZIL_TEAM_ID = 764;

export function createSampleMatchInfo(overrides: Partial<MatchInfo> = {}): MatchInfo {
  return {
    id: 1001,
    startTime: new Date('2026-06-15T18:00:00.000Z'),
    homeTeamName: 'Argentina',
    awayTeamName: 'Francia',
    homeTeamId: ARGENTINA_TEAM_ID,
    awayTeamId: FRANCE_TEAM_ID,
    status: 'SCHEDULED',
    stage: 'Semifinal',
    venue: 'Estadio por confirmar',
    refereeName: 'Por confirmar',
    homeCrest: null,
    awayCrest: null,
    ...overrides,
  };
}

export function createFinishedMatch(
  winner: 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW',
  options: {
    homeTeamName?: string;
    awayTeamName?: string;
    homeTeamId?: number;
    awayTeamId?: number;
    homeGoals?: number;
    awayGoals?: number;
    status?: FootballMatch['status'];
    matchId?: number;
  } = {},
): FootballMatch {
  const homeGoals = options.homeGoals ?? (winner === 'HOME_TEAM' ? 2 : winner === 'AWAY_TEAM' ? 0 : 1);
  const awayGoals = options.awayGoals ?? (winner === 'AWAY_TEAM' ? 2 : winner === 'HOME_TEAM' ? 0 : 1);

  return {
    id: options.matchId ?? 1001,
    utcDate: '2026-06-15T18:00:00.000Z',
    status: options.status ?? 'FINISHED',
    homeTeam: {
      id: options.homeTeamId ?? ARGENTINA_TEAM_ID,
      name: options.homeTeamName ?? 'Argentina',
    },
    awayTeam: {
      id: options.awayTeamId ?? FRANCE_TEAM_ID,
      name: options.awayTeamName ?? 'Francia',
    },
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
  upcomingMatches: MatchInfo[];
  matchesById: Map<number, FootballMatch>;

  constructor(
    upcomingMatches: MatchInfo[] | MatchInfo | null,
    matchesById: Map<number, FootballMatch> = new Map(),
  ) {
    if (upcomingMatches === null) {
      this.upcomingMatches = [];
    } else if (Array.isArray(upcomingMatches)) {
      this.upcomingMatches = upcomingMatches;
    } else {
      this.upcomingMatches = [upcomingMatches];
    }
    this.matchesById = matchesById;
  }

  async getUpcomingMatches(): Promise<MatchInfo[]> {
    return this.upcomingMatches;
  }

  async getTodaysMatches(now: Date = new Date()): Promise<MatchInfo[]> {
    return filterMatchesForToday(this.upcomingMatches, now);
  }

  async getNextMatch(): Promise<MatchInfo | null> {
    return this.upcomingMatches[0] ?? null;
  }

  async getMatchById(matchId: number): Promise<FootballMatch> {
    const match = this.matchesById.get(matchId);
    if (!match) {
      throw new Error(`Partido mock no encontrado: ${matchId}`);
    }
    return match;
  }
}
