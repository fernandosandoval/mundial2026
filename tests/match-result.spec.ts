import { test, expect } from '@playwright/test';
import { describeMatchWinner } from '../src/apiClient';
import { MockEmailService } from '../src/emailService';
import { MatchScheduler } from '../src/scheduler';
import { InMemorySchedulerAdapter } from '../src/schedulerAdapter';
import {
  createFinishedMatch,
  createSampleMatchInfo,
  MockFootballDataApi,
} from './helpers/mocks';

test.describe('Email final según resultado del partido', () => {
  test('envía email con resultado cuando gana el local', async () => {
    const match = createSampleMatchInfo();
    const finishedMatch = createFinishedMatch('HOME_TEAM', { homeGoals: 2, awayGoals: 1 });
    const apiClient = new MockFootballDataApi(match, new Map([[match.id, finishedMatch]]));
    const emailService = new MockEmailService();

    const scheduler = new MatchScheduler({
      apiClient,
      emailService,
      scheduler: new InMemorySchedulerAdapter(),
    });

    await scheduler.checkMatchResultAndNotify(match);

    expect(emailService.sentEmails).toHaveLength(1);
    expect(emailService.sentEmails[0].subject).toBe('Terminó el partido: Argentina vs Francia');
    expect(emailService.sentEmails[0].body).toContain('Argentina 2 - 1 Francia');
    expect(emailService.sentEmails[0].body).toContain('Ganó Argentina');
    expect(describeMatchWinner(finishedMatch)).toContain('Ganó Argentina');
  });

  test('envía email con resultado cuando gana el visitante', async () => {
    const match = createSampleMatchInfo({
      homeTeamName: 'Brasil',
      awayTeamName: 'Argentina',
    });
    const finishedMatch = createFinishedMatch('AWAY_TEAM', {
      homeTeamName: 'Brasil',
      awayTeamName: 'Argentina',
      homeGoals: 0,
      awayGoals: 3,
    });
    const apiClient = new MockFootballDataApi(match, new Map([[match.id, finishedMatch]]));
    const emailService = new MockEmailService();

    const scheduler = new MatchScheduler({
      apiClient,
      emailService,
      scheduler: new InMemorySchedulerAdapter(),
    });

    await scheduler.checkMatchResultAndNotify(match);

    expect(emailService.sentEmails).toHaveLength(1);
    expect(emailService.sentEmails[0].subject).toBe('Terminó el partido: Brasil vs Argentina');
    expect(emailService.sentEmails[0].body).toContain('Ganó Argentina');
  });

  test('envía email con empate cuando el partido termina igualado', async () => {
    const match = createSampleMatchInfo();
    const finishedMatch = createFinishedMatch('DRAW', { homeGoals: 1, awayGoals: 1 });
    const apiClient = new MockFootballDataApi(match, new Map([[match.id, finishedMatch]]));
    const emailService = new MockEmailService();

    const scheduler = new MatchScheduler({
      apiClient,
      emailService,
      scheduler: new InMemorySchedulerAdapter(),
    });

    await scheduler.checkMatchResultAndNotify(match);

    expect(emailService.sentEmails).toHaveLength(1);
    expect(emailService.sentEmails[0].body).toContain('Empate');
  });

  test('no envía email si el partido aún no está FINISHED', async () => {
    const match = createSampleMatchInfo();
    const liveMatch = createFinishedMatch('HOME_TEAM', {
      status: 'IN_PLAY',
    });
    const apiClient = new MockFootballDataApi(match, new Map([[match.id, liveMatch]]));
    const emailService = new MockEmailService();

    const scheduler = new MatchScheduler({
      apiClient,
      emailService,
      scheduler: new InMemorySchedulerAdapter(),
    });

    await scheduler.checkMatchResultAndNotify(match);

    expect(emailService.sentEmails).toHaveLength(0);
  });
});
