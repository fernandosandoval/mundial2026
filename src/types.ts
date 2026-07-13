export type MatchStatus =
  | 'SCHEDULED'
  | 'TIMED'
  | 'IN_PLAY'
  | 'PAUSED'
  | 'FINISHED'
  | 'POSTPONED'
  | 'SUSPENDED'
  | 'CANCELLED'
  | 'AWARDED'
  | 'LIVE';

export type MatchWinner = 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' | null;

export interface Team {
  id: number;
  name: string | null;
  shortName?: string | null;
  tla?: string | null;
}

export interface MatchScore {
  winner: MatchWinner;
  fullTime: {
    homeTeam: number | null;
    awayTeam: number | null;
  };
}

export interface Competition {
  id: number;
  name: string;
  code: string;
}

export interface FootballMatch {
  id: number;
  utcDate: string;
  status: MatchStatus;
  homeTeam: Team;
  awayTeam: Team;
  competition?: Competition;
  score?: MatchScore;
}

export interface TeamMatchesResponse {
  matches: FootballMatch[];
}

export interface MatchInfo {
  id: number;
  startTime: Date;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamId: number;
  awayTeamId: number;
  status: MatchStatus;
}

export interface NotificationTimes {
  oneHourBefore: Date;
  kickoff: Date;
  estimatedEnd: Date;
}

export interface SentEmail {
  subject: string;
  body: string;
  to: string;
}

export interface EmailService {
  send(subject: string, body: string): Promise<void>;
}

export interface FootballDataApi {
  getUpcomingMatches(): Promise<MatchInfo[]>;
  getNextMatch(): Promise<MatchInfo | null>;
  getMatchById(matchId: number): Promise<FootballMatch>;
}

export interface ScheduleJob {
  cancel(): void;
}

export interface SchedulerAdapter {
  scheduleAt(date: Date, taskName: string, handler: () => Promise<void>): ScheduleJob;
}
