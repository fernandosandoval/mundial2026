import { translateStage, translateTeamName } from './utils/translations';
import { ARGENTINA_TIMEZONE, isSameCalendarDay } from './utils/timezone';
import type {
  FootballDataApi,
  FootballMatch,
  MatchInfo,
  Referee,
  Team,
  TeamMatchesResponse,
} from './types';

const FOOTBALL_DATA_BASE_URL = 'https://api.football-data.org/v4';

const UPCOMING_STATUSES = new Set(['SCHEDULED', 'TIMED']);

export interface FootballDataClientOptions {
  apiKey: string;
  worldCupCompetitionCode: string;
  fetchFn?: typeof fetch;
}

export function getTeamDisplayName(team: Team): string {
  const rawName = team.name ?? team.shortName ?? team.tla ?? 'Por definir';
  return translateTeamName(rawName);
}

export function extractRefereeName(referees: Referee[] | undefined): string {
  if (!referees || referees.length === 0) {
    return 'Por confirmar';
  }

  const mainReferee =
    referees.find((referee) => referee.type?.toUpperCase() === 'REFEREE') ?? referees[0];

  const name = mainReferee.name?.trim();
  return name && name.length > 0 ? name : 'Por confirmar';
}

export function extractVenue(venue: string | null | undefined): string {
  const trimmed = venue?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : 'Estadio por confirmar';
}

export function filterUpcomingMatches(
  matches: FootballMatch[],
  now: Date = new Date(),
): FootballMatch[] {
  const nowMs = now.getTime();

  return matches
    .filter((match) => UPCOMING_STATUSES.has(match.status))
    .filter((match) => new Date(match.utcDate).getTime() > nowMs)
    .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime());
}

export function filterMatchesByCalendarDay(
  matches: FootballMatch[],
  day: Date,
  timeZone: string = ARGENTINA_TIMEZONE,
): FootballMatch[] {
  return matches
    .filter((match) => UPCOMING_STATUSES.has(match.status))
    .filter((match) => isSameCalendarDay(new Date(match.utcDate), day, timeZone))
    .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime());
}

export function describeMatchWinner(match: FootballMatch): string {
  const homeName = getTeamDisplayName(match.homeTeam);
  const awayName = getTeamDisplayName(match.awayTeam);
  const score = match.score?.fullTime;
  const homeGoals = score?.homeTeam ?? 0;
  const awayGoals = score?.awayTeam ?? 0;
  const scoreLine = `${homeName} ${homeGoals} - ${awayGoals} ${awayName}`;

  const winner = match.score?.winner;
  if (winner === 'HOME_TEAM') {
    return `Resultado: ${scoreLine}. Ganó ${homeName}.`;
  }
  if (winner === 'AWAY_TEAM') {
    return `Resultado: ${scoreLine}. Ganó ${awayName}.`;
  }
  if (winner === 'DRAW') {
    return `Resultado: ${scoreLine}. Empate.`;
  }

  return `Resultado: ${scoreLine}.`;
}

export class FootballDataClient implements FootballDataApi {
  private readonly apiKey: string;
  private readonly worldCupCompetitionCode: string;
  private readonly fetchFn: typeof fetch;

  constructor(options: FootballDataClientOptions) {
    this.apiKey = options.apiKey;
    this.worldCupCompetitionCode = options.worldCupCompetitionCode;
    this.fetchFn = options.fetchFn ?? fetch;
  }

  async getUpcomingMatches(): Promise<MatchInfo[]> {
    const matches = await this.fetchCompetitionMatches();
    return filterUpcomingMatches(matches).map((match) => this.toMatchInfo(match));
  }

  async getTodaysMatches(now: Date = new Date()): Promise<MatchInfo[]> {
    const matches = await this.fetchCompetitionMatches();
    return filterMatchesByCalendarDay(matches, now).map((match) => this.toMatchInfo(match));
  }

  async getNextMatch(): Promise<MatchInfo | null> {
    const upcoming = await this.getUpcomingMatches();
    return upcoming[0] ?? null;
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
    return {
      id: match.id,
      startTime: new Date(match.utcDate),
      homeTeamName: getTeamDisplayName(match.homeTeam),
      awayTeamName: getTeamDisplayName(match.awayTeam),
      homeTeamId: match.homeTeam.id,
      awayTeamId: match.awayTeam.id,
      status: match.status,
      stage: translateStage(match.stage),
      venue: extractVenue(match.venue),
      refereeName: extractRefereeName(match.referees),
      homeCrest: match.homeTeam.crest ?? null,
      awayCrest: match.awayTeam.crest ?? null,
    };
  }

  private async fetchCompetitionMatches(): Promise<FootballMatch[]> {
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
    return data.matches ?? [];
  }
}
