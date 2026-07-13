import { test, expect } from '@playwright/test';
import { didArgentinaWin } from '../src/apiClient';
import { MockEmailService } from '../src/emailService';
import { EMAIL_SUBJECTS, MatchScheduler } from '../src/scheduler';
import { InMemorySchedulerAdapter } from '../src/schedulerAdapter';
import {
  ARGENTINA_TEAM_ID,
  createFinishedMatch,
  createSampleMatchInfo,
  MockFootballDataApi,
} from './helpers/mocks';

test.describe('Email final según resultado del partido', () => {
  test('envía email de victoria cuando Argentina gana como local', async () => {
    const match = createSampleMatchInfo();
    const finishedMatch = createFinishedMatch('HOME_TEAM', { argentinaHome: true, homeGoals: 2, awayGoals: 1 });
    const apiClient = new MockFootballDataApi(match, new Map([[match.id, finishedMatch]]));
    const emailService = new MockEmailService();

    const scheduler = new MatchScheduler({
      apiClient,
      emailService,
      scheduler: new InMemorySchedulerAdapter(),
      argentinaTeamId: ARGENTINA_TEAM_ID,
    });

    await scheduler.checkMatchResultAndNotify(match.id);

    expect(emailService.sentEmails).toHaveLength(1);
    expect(emailService.sentEmails[0].subject).toBe(EMAIL_SUBJECTS.victory);
    expect(didArgentinaWin(finishedMatch, ARGENTINA_TEAM_ID)).toBe(true);
  });

  test('envía email de victoria cuando Argentina gana como visitante', async () => {
    const match = createSampleMatchInfo({ isArgentinaHome: false, rivalName: 'Brasil' });
    const finishedMatch = createFinishedMatch('AWAY_TEAM', {
      argentinaHome: false,
      homeGoals: 0,
      awayGoals: 3,
    });
    const apiClient = new MockFootballDataApi(match, new Map([[match.id, finishedMatch]]));
    const emailService = new MockEmailService();

    const scheduler = new MatchScheduler({
      apiClient,
      emailService,
      scheduler: new InMemorySchedulerAdapter(),
      argentinaTeamId: ARGENTINA_TEAM_ID,
    });

    await scheduler.checkMatchResultAndNotify(match.id);

    expect(emailService.sentEmails).toHaveLength(1);
    expect(emailService.sentEmails[0].subject).toBe(EMAIL_SUBJECTS.victory);
  });

  test('no envía email cuando Argentina empata', async () => {
    const match = createSampleMatchInfo();
    const finishedMatch = createFinishedMatch('DRAW', { argentinaHome: true, homeGoals: 1, awayGoals: 1 });
    const apiClient = new MockFootballDataApi(match, new Map([[match.id, finishedMatch]]));
    const emailService = new MockEmailService();

    const scheduler = new MatchScheduler({
      apiClient,
      emailService,
      scheduler: new InMemorySchedulerAdapter(),
      argentinaTeamId: ARGENTINA_TEAM_ID,
    });

    await scheduler.checkMatchResultAndNotify(match.id);

    expect(emailService.sentEmails).toHaveLength(0);
    expect(didArgentinaWin(finishedMatch, ARGENTINA_TEAM_ID)).toBe(false);
  });

  test('no envía email cuando Argentina pierde', async () => {
    const match = createSampleMatchInfo();
    const finishedMatch = createFinishedMatch('AWAY_TEAM', {
      argentinaHome: true,
      homeGoals: 0,
      awayGoals: 2,
    });
    const apiClient = new MockFootballDataApi(match, new Map([[match.id, finishedMatch]]));
    const emailService = new MockEmailService();

    const scheduler = new MatchScheduler({
      apiClient,
      emailService,
      scheduler: new InMemorySchedulerAdapter(),
      argentinaTeamId: ARGENTINA_TEAM_ID,
    });

    await scheduler.checkMatchResultAndNotify(match.id);

    expect(emailService.sentEmails).toHaveLength(0);
    expect(didArgentinaWin(finishedMatch, ARGENTINA_TEAM_ID)).toBe(false);
  });

  test('no envía email si el partido aún no está FINISHED', async () => {
    const match = createSampleMatchInfo();
    const liveMatch = createFinishedMatch('HOME_TEAM', {
      argentinaHome: true,
      status: 'IN_PLAY',
    });
    const apiClient = new MockFootballDataApi(match, new Map([[match.id, liveMatch]]));
    const emailService = new MockEmailService();

    const scheduler = new MatchScheduler({
      apiClient,
      emailService,
      scheduler: new InMemorySchedulerAdapter(),
      argentinaTeamId: ARGENTINA_TEAM_ID,
    });

    await scheduler.checkMatchResultAndNotify(match.id);

    expect(emailService.sentEmails).toHaveLength(0);
  });
});
