import { test, expect } from '@playwright/test';
import { filterUpcomingMatches, getTeamDisplayName } from '../src/apiClient';
import type { FootballMatch } from '../src/types';

test.describe('Selección de partidos del Mundial', () => {
  test('devuelve todos los partidos SCHEDULED/TIMED ordenados por fecha', () => {
    const now = new Date('2026-06-10T12:00:00.000Z');
    const matches: FootballMatch[] = [
      {
        id: 2,
        utcDate: '2026-06-16T18:00:00.000Z',
        status: 'SCHEDULED',
        homeTeam: { id: 10, name: 'Brasil' },
        awayTeam: { id: 11, name: 'Francia' },
      },
      {
        id: 1,
        utcDate: '2026-06-15T18:00:00.000Z',
        status: 'TIMED',
        homeTeam: { id: 1, name: 'Argentina' },
        awayTeam: { id: 2, name: 'México' },
      },
      {
        id: 3,
        utcDate: '2026-06-09T18:00:00.000Z',
        status: 'SCHEDULED',
        homeTeam: { id: 3, name: 'España' },
        awayTeam: { id: 4, name: 'Alemania' },
      },
      {
        id: 4,
        utcDate: '2026-06-17T18:00:00.000Z',
        status: 'FINISHED',
        homeTeam: { id: 5, name: 'Italia' },
        awayTeam: { id: 6, name: 'Uruguay' },
      },
    ];

    const upcoming = filterUpcomingMatches(matches, now);

    expect(upcoming.map((match) => match.id)).toEqual([1, 2]);
  });

  test('usa un nombre alternativo cuando el equipo no tiene name', () => {
    const rival = { id: 99, name: null, shortName: 'TBD' };

    expect(getTeamDisplayName(rival)).toBe('TBD');
  });
});
