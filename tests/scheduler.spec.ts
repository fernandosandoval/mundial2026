import { test, expect } from '@playwright/test';
import { MockEmailService } from '../src/emailService';
import { EMAIL_SUBJECTS, MatchScheduler } from '../src/scheduler';
import { InMemorySchedulerAdapter } from '../src/schedulerAdapter';
import {
  ARGENTINA_TEAM_ID,
  createFinishedMatch,
  createSampleMatchInfo,
  MockFootballDataApi,
} from './helpers/mocks';

test.describe('Eventos de email programados', () => {
  test('programa y ejecuta las 3 notificaciones de email', async () => {
    const match = createSampleMatchInfo({
      startTime: new Date('2026-06-15T18:00:00.000Z'),
    });

    const finishedMatch = createFinishedMatch('HOME_TEAM', { argentinaHome: true });
    const apiClient = new MockFootballDataApi(match, new Map([[match.id, finishedMatch]]));
    const emailService = new MockEmailService();
    const schedulerAdapter = new InMemorySchedulerAdapter();

    const matchScheduler = new MatchScheduler({
      apiClient,
      emailService,
      scheduler: schedulerAdapter,
      argentinaTeamId: ARGENTINA_TEAM_ID,
      now: () => new Date('2026-06-15T12:00:00.000Z'),
    });

    await matchScheduler.initialize();

    expect(schedulerAdapter.scheduledTasks).toHaveLength(3);
    expect(schedulerAdapter.scheduledTasks.map((task) => task.taskName)).toEqual([
      'one-hour-before',
      'kickoff',
      'match-end-check',
    ]);

    await schedulerAdapter.runTask('one-hour-before');
    await schedulerAdapter.runTask('kickoff');
    await schedulerAdapter.runTask('match-end-check');

    expect(emailService.sentEmails).toHaveLength(3);
    expect(emailService.sentEmails[0].subject).toBe(EMAIL_SUBJECTS.oneHourBefore);
    expect(emailService.sentEmails[1].subject).toBe(EMAIL_SUBJECTS.kickoff);
    expect(emailService.sentEmails[2].subject).toBe(EMAIL_SUBJECTS.victory);
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
      argentinaTeamId: ARGENTINA_TEAM_ID,
      now: () => new Date('2026-06-15T17:30:00.000Z'),
    });

    matchScheduler.scheduleNotifications(match);

    expect(schedulerAdapter.scheduledTasks).toHaveLength(2);
    expect(schedulerAdapter.scheduledTasks.map((task) => task.taskName)).toEqual([
      'kickoff',
      'match-end-check',
    ]);
  });
});
