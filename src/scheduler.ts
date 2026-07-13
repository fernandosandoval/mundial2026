import { didArgentinaWin } from './apiClient';
import { computeNotificationTimes, formatMatchSummary, isFutureDate } from './utils/time';
import type {
  EmailService,
  FootballDataApi,
  MatchInfo,
  ScheduleJob,
  SchedulerAdapter,
} from './types';

export const EMAIL_SUBJECTS = {
  oneHourBefore: 'Falta 1 hora para el partido de Argentina',
  kickoff: 'Comenzó el partido de Argentina',
  victory: 'Ganó Argentina',
} as const;

export interface MatchSchedulerOptions {
  apiClient: FootballDataApi;
  emailService: EmailService;
  scheduler: SchedulerAdapter;
  argentinaTeamId: number;
  matchDurationMinutes?: number;
  oneHourBeforeMinutes?: number;
  now?: () => Date;
}

export class MatchScheduler {
  private readonly apiClient: FootballDataApi;
  private readonly emailService: EmailService;
  private readonly scheduler: SchedulerAdapter;
  private readonly argentinaTeamId: number;
  private readonly matchDurationMinutes: number;
  private readonly oneHourBeforeMinutes: number;
  private readonly now: () => Date;
  private activeJobs: ScheduleJob[] = [];
  private currentMatchId: number | null = null;

  constructor(options: MatchSchedulerOptions) {
    this.apiClient = options.apiClient;
    this.emailService = options.emailService;
    this.scheduler = options.scheduler;
    this.argentinaTeamId = options.argentinaTeamId;
    this.matchDurationMinutes = options.matchDurationMinutes ?? 115;
    this.oneHourBeforeMinutes = options.oneHourBeforeMinutes ?? 60;
    this.now = options.now ?? (() => new Date());
  }

  async initialize(): Promise<MatchInfo | null> {
    const match = await this.apiClient.getNextArgentinaMatch();
    if (!match) {
      console.log('[scheduler] No hay próximos partidos de Argentina en el Mundial.');
      return null;
    }

    console.log(`[scheduler] Próximo partido: ${formatMatchSummary(match)}`);
    this.scheduleNotifications(match);
    return match;
  }

  scheduleNotifications(match: MatchInfo): void {
    this.clearScheduledJobs();

    const now = this.now();
    const times = computeNotificationTimes(
      match.startTime,
      this.matchDurationMinutes,
      this.oneHourBeforeMinutes,
    );

    this.currentMatchId = match.id;

    if (isFutureDate(times.oneHourBefore, now)) {
      this.activeJobs.push(
        this.scheduler.scheduleAt(times.oneHourBefore, 'one-hour-before', async () => {
          await this.sendOneHourBeforeEmail(match);
        }),
      );
    } else {
      console.log('[scheduler] La notificación de 1 hora ya pasó; se omite.');
    }

    if (isFutureDate(times.kickoff, now)) {
      this.activeJobs.push(
        this.scheduler.scheduleAt(times.kickoff, 'kickoff', async () => {
          await this.sendKickoffEmail(match);
        }),
      );
    } else {
      console.log('[scheduler] El inicio del partido ya pasó; se omite notificación de kickoff.');
    }

    if (isFutureDate(times.estimatedEnd, now)) {
      this.activeJobs.push(
        this.scheduler.scheduleAt(times.estimatedEnd, 'match-end-check', async () => {
          await this.checkMatchResultAndNotify(match.id);
        }),
      );
    } else {
      console.log('[scheduler] La hora estimada de finalización ya pasó; se verifica de inmediato.');
      void this.checkMatchResultAndNotify(match.id);
    }
  }

  async sendOneHourBeforeEmail(match: MatchInfo): Promise<void> {
    const body = `Falta 1 hora para el partido entre Argentina y ${match.rivalName}.`;
    await this.emailService.send(EMAIL_SUBJECTS.oneHourBefore, body);
    console.log('[scheduler] Email enviado: 1 hora antes del partido.');
  }

  async sendKickoffEmail(match: MatchInfo): Promise<void> {
    const body = `Comenzó el partido entre Argentina y ${match.rivalName}. ¡Vamos Argentina!`;
    await this.emailService.send(EMAIL_SUBJECTS.kickoff, body);
    console.log('[scheduler] Email enviado: inicio del partido.');
  }

  async checkMatchResultAndNotify(matchId: number): Promise<void> {
    const match = await this.apiClient.getMatchById(matchId);

    if (match.status !== 'FINISHED') {
      console.log(
        `[scheduler] El partido ${matchId} aún no finalizó (estado: ${match.status}). No se envía email de victoria.`,
      );
      return;
    }

    if (didArgentinaWin(match, this.argentinaTeamId)) {
      const rivalName =
        match.homeTeam.id === this.argentinaTeamId ? match.awayTeam.name : match.homeTeam.name;
      const score = match.score?.fullTime;
      const body = score
        ? `Argentina venció a ${rivalName} por ${score.homeTeam}-${score.awayTeam}.`
        : `Argentina venció a ${rivalName}.`;

      await this.emailService.send(EMAIL_SUBJECTS.victory, body);
      console.log('[scheduler] Email enviado: Argentina ganó el partido.');
      return;
    }

    console.log('[scheduler] Argentina no ganó el partido. No se envía email de victoria.');
  }

  clearScheduledJobs(): void {
    for (const job of this.activeJobs) {
      job.cancel();
    }
    this.activeJobs = [];
  }

  getCurrentMatchId(): number | null {
    return this.currentMatchId;
  }
}
