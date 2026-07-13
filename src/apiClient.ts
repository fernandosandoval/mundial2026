import type {
  FootballDataApi,
  FootballMatch,
  MatchInfo,
  Team,
  TeamMatchesResponse,
} from './types';

const FOOTBALL_DATA_BASE_URL = 'https://api.football-data.org/v4';

const UPCOMING_STATUSES = new Set(['SCHEDULED', 'TIMED']);

export interface FootballDataClientOptions {
  apiKey: string;
  argentinaTeamId: number;
  worldCupCompetitionCode: string;
  fetchFn?: typeof fetch;
}

export function getTeamDisplayName(team: Team): string {
  return team.name ?? team.shortName ?? team.tla ?? 'Por definir';
}

export function isArgentinaTeam(team: Team | null | undefined, argentinaTeamId: number): boolean {
  if (!team) {
    return false;
  }

  if (team.id === argentinaTeamId) {
    return true;
  }

  const teamLabels = [team.name, team.shortName, team.tla].filter(
    (label): label is string => typeof label === 'string' && label.length > 0,
  );

  return teamLabels.some((label) => label.includes('Argentina'));
}

export function matchInvolvesArgentina(
  match: FootballMatch,
  argentinaTeamId: number,
): boolean {
  return (
    isArgentinaTeam(match.homeTeam, argentinaTeamId) ||
    isArgentinaTeam(match.awayTeam, argentinaTeamId)
  );
}

export class FootballDataClient implements FootballDataApi {
  private readonly apiKey: string;
  private readonly argentinaTeamId: number;
  private readonly worldCupCompetitionCode: string;
  private readonly fetchFn: typeof fetch;

  constructor(options: FootballDataClientOptions) {
    this.apiKey = options.apiKey;
    this.argentinaTeamId = options.argentinaTeamId;
    this.worldCupCompetitionCode = options.worldCupCompetitionCode;
    this.fetchFn = options.fetchFn ?? fetch;
  }

  async getNextArgentinaMatch(): Promise<MatchInfo | null> {
    const url = `${FOOTBALL_DATA_BASE_URL}/competitions/${this.worldCupCompetitionCode}/matches`;

    const response = await this.fetchFn(url, {
      headers: {
        'X-Auth-Token': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Error al consultar Football-Data.org (${response.status}): ${await response.text()}`,
      );
    }

    const data = (await response.json()) as TeamMatchesResponse;
    const now = Date.now();
    const matches = data.matches ?? [];

    const upcomingMatches = matches
      .filter((match) => matchInvolvesArgentina(match, this.argentinaTeamId))
      .filter((match) => UPCOMING_STATUSES.has(match.status))
      .filter((match) => new Date(match.utcDate).getTime() > now)
      .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime());

    const nextMatch = upcomingMatches[0];
    if (!nextMatch) {
      return null;
    }

    return this.toMatchInfo(nextMatch);
  }

  async getMatchById(matchId: number): Promise<FootballMatch> {
    const url = `${FOOTBALL_DATA_BASE_URL}/matches/${matchId}`;
    const response = await this.fetchFn(url, {
      headers: {
        'X-Auth-Token': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Error al consultar partido ${matchId} (${response.status}): ${await response.text()}`,
      );
    }

    return (await response.json()) as FootballMatch;
  }

  toMatchInfo(match: FootballMatch): MatchInfo {
    const isArgentinaHome = isArgentinaTeam(match.homeTeam, this.argentinaTeamId);
    const rival = isArgentinaHome ? match.awayTeam : match.homeTeam;

    return {
      id: match.id,
      startTime: new Date(match.utcDate),
      rivalName: getTeamDisplayName(rival),
      rivalId: rival.id,
      isArgentinaHome,
      status: match.status,
    };
  }
}

export function didArgentinaWin(match: FootballMatch, argentinaTeamId: number): boolean {
  if (match.status !== 'FINISHED') {
    return false;
  }

  const winner = match.score?.winner;
  if (!winner || winner === 'DRAW') {
    return false;
  }

  if (winner === 'HOME_TEAM') {
    return isArgentinaTeam(match.homeTeam, argentinaTeamId);
  }

  return isArgentinaTeam(match.awayTeam, argentinaTeamId);
}
