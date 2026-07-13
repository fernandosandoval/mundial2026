import { describeMatchWinner } from './apiClient';
import {
  computeNotificationTimes,
  emailSubjects,
  formatMatchSummary,
  isFutureDate,
} from './utils/time';
import type {
  EmailService,
  FootballDataApi,
  MatchInfo,
  ScheduleJob,
  SchedulerAdapter,
} from './types';

export interface MatchSchedulerOptions {
  apiClient: FootballDataApi;
  emailService: EmailService;
  scheduler: SchedulerAdapter;
  matchDurationMinutes?: number;
  oneHourBeforeMinutes?: number;
  now?: () => Date;
}

export class MatchScheduler {
  private readonly apiClient: FootballDataApi;
  private readonly emailService: EmailService;
  private readonly scheduler: SchedulerAdapter;
  private readonly matchDurationMinutes: number;
  private readonly oneHourBeforeMinutes: number;
  private readonly now: () => Date;
  private activeJobs: ScheduleJob[] = [];
  private scheduledMatchIds: number[] = [];

  constructor(options: MatchSchedulerOptions) {
    this.apiClient = options.apiClient;
    this.emailService = options.emailService;
    this.scheduler = options.scheduler;
    this.matchDurationMinutes = options.matchDurationMinutes ?? 115;
    this.oneHourBeforeMinutes = options.oneHourBeforeMinutes ?? 60;
    this.now = options.now ?? (() => new Date());
  }

  async initialize(): Promise<MatchInfo[]> {
    const matches = await this.apiClient.getUpcomingMatches();
    if (matches.length === 0) {
      console.log('[scheduler] No hay próximos partidos programados en el Mundial.');
      return [];
    }

    console.log(`[scheduler] Programando notificaciones para ${matches.length} partido(s).`);
    this.scheduleAllMatches(matches);
    return matches;
  }

  scheduleAllMatches(matches: MatchInfo[]): void {
    this.clearScheduledJobs();
    this.scheduledMatchIds = matches.map((match) => match.id);

    for (const match of matches) {
      this.scheduleNotificationsForMatch(match);
    }
  }

  scheduleNotificationsForMatch(match: MatchInfo): void {
    const now = this.now();
    const times = computeNotificationTimes(
      match.startTime,
      this.matchDurationMinutes,
      this.oneHourBeforeMinutes,
    );
    const subjects = emailSubjects(match);

    console.log(`[scheduler] Partido: ${formatMatchSummary(match)}`);

    if (isFutureDate(times.oneHourBefore, now)) {
      this.activeJobs.push(
        this.scheduler.scheduleAt(
          times.oneHourBefore,
          `one-hour-before-${match.id}`,
          async () => {
            await this.sendOneHourBeforeEmail(match, subjects.oneHourBefore);
          },
        ),
      );
    } else {
      console.log(`[scheduler] Match ${match.id}: notificación de 1 hora omitida (ya pasó).`);
    }

    if (isFutureDate(times.kickoff, now)) {
      this.activeJobs.push(
        this.scheduler.scheduleAt(times.kickoff, `kickoff-${match.id}`, async () => {
          await this.sendKickoffEmail(match, subjects.kickoff);
        }),
      );
    } else {
      console.log(`[scheduler] Match ${match.id}: kickoff omitido (ya pasó).`);
    }

    if (isFutureDate(times.estimatedEnd, now)) {
      this.activeJobs.push(
        this.scheduler.scheduleAt(
          times.estimatedEnd,
          `match-end-check-${match.id}`,
          async () => {
            await this.checkMatchResultAndNotify(match);
          },
        ),
      );
    } else {
      console.log(`[scheduler] Match ${match.id}: fin estimado ya pasó; se verifica de inmediato.`);
      void this.checkMatchResultAndNotify(match);
    }
  }

  /** @deprecated Preferí scheduleNotificationsForMatch; se mantiene por compatibilidad en tests. */
  scheduleNotifications(match: MatchInfo): void {
    this.clearScheduledJobs();
    this.scheduledMatchIds = [match.id];
    this.scheduleNotificationsForMatch(match);
  }

  async sendOneHourBeforeEmail(match: MatchInfo, subject?: string): Promise<void> {
    const emailSubject = subject ?? emailSubjects(match).oneHourBefore;
    const body = `Falta 1 hora para el partido entre ${match.homeTeamName} y ${match.awayTeamName}.`;
    await this.emailService.send(emailSubject, body);
    console.log(`[scheduler] Email enviado (1h): ${emailSubject}`);
  }

  async sendKickoffEmail(match: MatchInfo, subject?: string): Promise<void> {
    const emailSubject = subject ?? emailSubjects(match).kickoff;
    const body = `Comenzó el partido entre ${match.homeTeamName} y ${match.awayTeamName}.`;
    await this.emailService.send(emailSubject, body);
    console.log(`[scheduler] Email enviado (inicio): ${emailSubject}`);
  }

  async checkMatchResultAndNotify(matchInfo: MatchInfo | number): Promise<void> {
    const matchId = typeof matchInfo === 'number' ? matchInfo : matchInfo.id;
    const fallbackNames =
      typeof matchInfo === 'number'
        ? null
        : { home: matchInfo.homeTeamName, away: matchInfo.awayTeamName };

    const match = await this.apiClient.getMatchById(matchId);

    if (match.status !== 'FINISHED') {
      console.log(
        `[scheduler] El partido ${matchId} aún no finalizó (estado: ${match.status}). No se envía email de resultado.`,
      );
      return;
    }

    const homeName = getTeamNameFromFinished(match.homeTeam.name, fallbackNames?.home);
    const awayName = getTeamNameFromFinished(match.awayTeam.name, fallbackNames?.away);
    const subject = `Terminó el partido: ${homeName} vs ${awayName}`;
    const body = describeMatchWinner(match);

    await this.emailService.send(subject, body);
    console.log(`[scheduler] Email enviado (fin): ${subject}`);
  }

  clearScheduledJobs(): void {
    for (const job of this.activeJobs) {
      job.cancel();
    }
    this.activeJobs = [];
    this.scheduledMatchIds = [];
  }

  getScheduledMatchIds(): number[] {
    return [...this.scheduledMatchIds];
  }
}

function getTeamNameFromFinished(
  apiName: string | null | undefined,
  fallback?: string,
): string {
  if (typeof apiName === 'string' && apiName.length > 0) {
    return apiName;
  }
  return fallback ?? 'Por definir';
}
