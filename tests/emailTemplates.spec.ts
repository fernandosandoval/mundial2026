import { test, expect } from '@playwright/test';
import { 
  escapeHtml, 
  oneHourBeforeHtml, 
  kickoffHtml, 
  halftimeHtml, 
  matchResultHtml,
  goalNotificationHtml,
  redCardNotificationHtml,
  formatGoalsList,
  formatBookingsList,
  formatSubstitutionsList,
} from '../src/utils/emailTemplates';
import { createSampleMatchInfo, createFinishedMatch } from './helpers/mocks';
import type { GoalEvent, BookingEvent, SubstitutionEvent } from '../src/types';

test.describe('escapeHtml', () => {
  test('escapes special characters', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    );
  });

  test('escapes ampersand', () => {
    expect(escapeHtml('A & B')).toBe('A &amp; B');
  });

  test('escapes quotes', () => {
    expect(escapeHtml('"test"')).toBe('&quot;test&quot;');
  });

  test('escapes single quotes', () => {
    expect(escapeHtml("'test'")).toBe('&#39;test&#39;');
  });
});

test.describe('oneHourBeforeHtml', () => {
  test('generates valid HTML with match info', () => {
    const match = createSampleMatchInfo();
    const html = oneHourBeforeHtml(match);
    
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('¡Falta 1 hora!');
    expect(html).toContain('Argentina');
    expect(html).toContain('Francia');
  });
});

test.describe('kickoffHtml', () => {
  test('generates valid HTML with match info', () => {
    const match = createSampleMatchInfo();
    const html = kickoffHtml(match);
    
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('¡Comenzó el partido!');
  });
});

test.describe('halftimeHtml', () => {
  test('generates valid HTML with halftime score', () => {
    const match = createSampleMatchInfo({
      halfTimeHome: 1,
      halfTimeAway: 0,
    });
    const html = halftimeHtml(match);
    
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Descanso');
    expect(html).toContain('1');
    expect(html).toContain('0');
  });
});

test.describe('matchResultHtml', () => {
  test('generates valid HTML with result', () => {
    const match = createSampleMatchInfo();
    const html = matchResultHtml(match, 'Resultado: Argentina 2 - 1 Francia. Ganó Argentina.');
    
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Resultado final');
    expect(html).toContain('2');
    expect(html).toContain('1');
  });

  test('shows duration tag for extra time', () => {
    const match = createSampleMatchInfo({
      duration: 'EXTRA_TIME',
    });
    const html = matchResultHtml(match, 'Resultado final');
    
    expect(html).toContain('Tiempo extra');
  });

  test('shows duration tag for penalty shootout', () => {
    const match = createSampleMatchInfo({
      duration: 'PENALTY_SHOOTOUT',
    });
    const html = matchResultHtml(match, 'Resultado final');
    
    expect(html).toContain('Penales');
  });
});

test.describe('goalNotificationHtml', () => {
  test('generates valid HTML with goal info', () => {
    const match = createSampleMatchInfo();
    const goal: GoalEvent = {
      minute: 23,
      team: { id: 7627, name: 'Argentina' },
      scorer: { id: 1, name: 'Lionel Messi' },
      type: 'NORMAL',
      score: { home: 1, away: 0 },
    };
    const html = goalNotificationHtml(match, goal);
    
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('¡Gol!');
    expect(html).toContain('Lionel Messi');
    expect(html).toContain('23');
  });

  test('shows penalty tag', () => {
    const match = createSampleMatchInfo();
    const goal: GoalEvent = {
      minute: 45,
      team: { id: 7627, name: 'Argentina' },
      scorer: { id: 1, name: 'Lionel Messi' },
      type: 'PENALTY',
      score: { home: 1, away: 0 },
    };
    const html = goalNotificationHtml(match, goal);
    
    expect(html).toContain('penalti');
  });
});

test.describe('redCardNotificationHtml', () => {
  test('generates valid HTML with red card info', () => {
    const match = createSampleMatchInfo();
    const booking: BookingEvent = {
      minute: 67,
      team: { id: 758, name: 'France' },
      player: { id: 2, name: 'Kylian Mbappé' },
      card: 'RED',
    };
    const html = redCardNotificationHtml(match, booking);
    
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Tarjeta roja');
    expect(html).toContain('Kylian Mbappé');
    expect(html).toContain('67');
  });
});

test.describe('formatGoalsList', () => {
  test('returns empty string for no goals', () => {
    expect(formatGoalsList([])).toBe('');
  });

  test('formats single goal', () => {
    const goals: GoalEvent[] = [{
      minute: 23,
      team: { id: 7627, name: 'Argentina' },
      scorer: { id: 1, name: 'Lionel Messi' },
      type: 'NORMAL',
      score: { home: 1, away: 0 },
    }];
    const html = formatGoalsList(goals);
    
    expect(html).toContain('⚽');
    expect(html).toContain('23');
    expect(html).toContain('Lionel Messi');
  });

  test('formats multiple goals', () => {
    const goals: GoalEvent[] = [
      {
        minute: 23,
        team: { id: 7627, name: 'Argentina' },
        scorer: { id: 1, name: 'Lionel Messi' },
        type: 'NORMAL',
        score: { home: 1, away: 0 },
      },
      {
        minute: 67,
        team: { id: 7627, name: 'Argentina' },
        scorer: { id: 2, name: 'Julián Álvarez' },
        type: 'NORMAL',
        score: { home: 2, away: 0 },
      },
    ];
    const html = formatGoalsList(goals);
    
    expect(html).toContain('Lionel Messi');
    expect(html).toContain('Julián Álvarez');
  });
});

test.describe('formatBookingsList', () => {
  test('returns empty string for no bookings', () => {
    expect(formatBookingsList([])).toBe('');
  });

  test('formats yellow card', () => {
    const bookings: BookingEvent[] = [{
      minute: 45,
      team: { id: 758, name: 'France' },
      player: { id: 2, name: 'Kylian Mbappé' },
      card: 'YELLOW',
    }];
    const html = formatBookingsList(bookings);
    
    expect(html).toContain('🟨');
    expect(html).toContain('Kylian Mbappé');
  });

  test('formats red card', () => {
    const bookings: BookingEvent[] = [{
      minute: 67,
      team: { id: 758, name: 'France' },
      player: { id: 2, name: 'Kylian Mbappé' },
      card: 'RED',
    }];
    const html = formatBookingsList(bookings);
    
    expect(html).toContain('🟥');
  });
});

test.describe('formatSubstitutionsList', () => {
  test('returns empty string for no substitutions', () => {
    expect(formatSubstitutionsList([])).toBe('');
  });

  test('formats substitution', () => {
    const subs: SubstitutionEvent[] = [{
      minute: 60,
      team: { id: 7627, name: 'Argentina' },
      playerOut: { id: 1, name: 'Lionel Messi' },
      playerIn: { id: 3, name: 'Paulo Dybala' },
    }];
    const html = formatSubstitutionsList(subs);
    
    expect(html).toContain('🔄');
    expect(html).toContain('60');
    expect(html).toContain('Lionel Messi');
    expect(html).toContain('Paulo Dybala');
  });
});
