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

export type MatchDuration = 'REGULAR' | 'EXTRA_TIME' | 'PENALTY_SHOOTOUT';

export type CardType = 'YELLOW' | 'YELLOW_RED' | 'RED';

export type GoalType = 'PENALTY' | 'OWN_GOAL' | 'NORMAL';

export interface Team {
  id: number;
  name: string | null;
  shortName?: string | null;
  tla?: string | null;
  crest?: string | null;
}

export interface Referee {
  id?: number;
  name: string | null;
  type?: string | null;
  nationality?: string | null;
}

export interface MatchScore {
  winner: MatchWinner;
  duration?: MatchDuration;
  fullTime: {
    homeTeam: number | null;
    awayTeam: number | null;
  };
  halfTime?: {
    homeTeam: number | null;
    awayTeam: number | null;
  };
}

export interface Competition {
  id: number;
  name: string;
  code: string;
}

export interface GoalEvent {
  minute: number;
  injuryTime?: number;
  team: { id: number; name: string };
  scorer: { id: number; name: string };
  assist?: { id: number; name: string } | null;
  type: GoalType;
  score: { home: number; away: number };
}

export interface BookingEvent {
  minute: number;
  team: { id: number; name: string };
  player: { id: number; name: string };
  card: CardType;
}

export interface SubstitutionEvent {
  minute: number;
  team: { id: number; name: string };
  playerOut: { id: number; name: string };
  playerIn: { id: number; name: string };
}

export interface FootballMatch {
  id: number;
  utcDate: string;
  status: MatchStatus;
  stage?: string | null;
  venue?: string | null;
  matchday?: number | null;
  group?: string | null;
  minute?: number | null;
  injuryTime?: { total: number | null } | null;
  attendance?: number | null;
  lastUpdated?: string;
  referees?: Referee[];
  homeTeam: Team;
  awayTeam: Team;
  competition?: Competition;
  score?: MatchScore;
  goals?: GoalEvent[];
  bookings?: BookingEvent[];
  substitutions?: SubstitutionEvent[];
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
  stage: string;
  venue: string;
  refereeName: string;
  homeCrest: string | null;
  awayCrest: string | null;
  matchday: number | null;
  group: string | null;
  halfTimeHome: number | null;
  halfTimeAway: number | null;
  duration: MatchDuration;
  goals: GoalEvent[];
  bookings: BookingEvent[];
  substitutions: SubstitutionEvent[];
  minute: number | null;
  attendance: number | null;
  fullTimeHome: number | null;
  fullTimeAway: number | null;
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

export interface SendEmailOptions {
  html?: string;
}

export interface EmailService {
  send(subject: string, body: string, options?: SendEmailOptions): Promise<void>;
}

export interface FootballDataApi {
  getUpcomingMatches(): Promise<MatchInfo[]>;
  getTodaysMatches(now?: Date): Promise<MatchInfo[]>;
  getNextMatch(): Promise<MatchInfo | null>;
  getMatchById(matchId: number): Promise<FootballMatch>;
  toMatchInfo(match: FootballMatch): MatchInfo;
}

export interface ScheduleJob {
  cancel(): void;
}

export interface SchedulerAdapter {
  scheduleAt(date: Date, taskName: string, handler: () => Promise<void>): ScheduleJob;
}
