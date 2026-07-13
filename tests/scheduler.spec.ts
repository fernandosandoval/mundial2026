import { test, expect } from '@playwright/test';
import { MockEmailService } from '../src/emailService';
import { MatchScheduler } from '../src/scheduler';
import { InMemorySchedulerAdapter } from '../src/schedulerAdapter';
import { emailSubjects } from '../src/utils/time';
import {
  createFinishedMatch,
  createSampleMatchInfo,
  MockFootballDataApi,
} from './helpers/mocks';

test.describe('Eventos de email programados', () => {
  test('programa y ejecuta las 3 notificaciones de email para un partido', async () => {
    const match = createSampleMatchInfo({
      startTime: new Date('2026-06-15T18:00:00.000Z'),
    });

    const finishedMatch = createFinishedMatch('HOME_TEAM', { homeGoals: 2, awayGoals: 1 });
    const apiClient = new MockFootballDataApi(match, new Map([[match.id, finishedMatch]]));
    const emailService = new MockEmailService();
    const schedulerAdapter = new InMemorySchedulerAdapter();
    const subjects = emailSubjects(match);

    const matchScheduler = new MatchScheduler({
      apiClient,
      emailService,
      scheduler: schedulerAdapter,
      now: () => new Date('2026-06-15T12:00:00.000Z'),
    });

    await matchScheduler.initialize();

    expect(schedulerAdapter.scheduledTasks).toHaveLength(3);
    expect(schedulerAdapter.scheduledTasks.map((task) => task.taskName)).toEqual([
      `one-hour-before-${match.id}`,
      `kickoff-${match.id}`,
      `match-end-check-${match.id}`,
    ]);

    await schedulerAdapter.runTask(`one-hour-before-${match.id}`);
    await schedulerAdapter.runTask(`kickoff-${match.id}`);
    await schedulerAdapter.runTask(`match-end-check-${match.id}`);

    expect(emailService.sentEmails).toHaveLength(3);
    expect(emailService.sentEmails[0].subject).toBe(subjects.oneHourBefore);
    expect(emailService.sentEmails[1].subject).toBe(subjects.kickoff);
    expect(emailService.sentEmails[2].subject).toBe(subjects.matchEnded);
  });

  test('programa notificaciones para todos los partidos pendientes', async () => {
    const matchA = createSampleMatchInfo({
      id: 1001,
      startTime: new Date('2026-06-15T18:00:00.000Z'),
      homeTeamName: 'Argentina',
      awayTeamName: 'México',
    });
    const matchB = createSampleMatchInfo({
      id: 1002,
      startTime: new Date('2026-06-16T18:00:00.000Z'),
      homeTeamName: 'Brasil',
      awayTeamName: 'Francia',
    });

    const apiClient = new MockFootballDataApi([matchA, matchB]);
    const emailService = new MockEmailService();
    const schedulerAdapter = new InMemorySchedulerAdapter();

    const matchScheduler = new MatchScheduler({
      apiClient,
      emailService,
      scheduler: schedulerAdapter,
      now: () => new Date('2026-06-15T12:00:00.000Z'),
    });

    await matchScheduler.initialize();

    expect(schedulerAdapter.scheduledTasks).toHaveLength(6);
    expect(matchScheduler.getScheduledMatchIds()).toEqual([1001, 1002]);
  });

  test('omite la notificación de 1 hora si ya pasó ese momento', async () => {
    const match = createSampleMatchInfo({
      startTime: new Date('2026-06-15T18:00:00.000Z'),
    });

    const apiClient = new MockFootballDataApi(match);
    const emailService = new MockEmailService();
    const schedulerAdapter = new InMemorySchedulerAdapter();

    const matchScheduler = new MatchScheduler({
      apiClient,
      emailService,
      scheduler: schedulerAdapter,
      now: () => new Date('2026-06-15T17:30:00.000Z'),
    });

    matchScheduler.scheduleNotifications(match);

    expect(schedulerAdapter.scheduledTasks).toHaveLength(2);
    expect(schedulerAdapter.scheduledTasks.map((task) => task.taskName)).toEqual([
      `kickoff-${match.id}`,
      `match-end-check-${match.id}`,
    ]);
  });
});
