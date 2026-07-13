import { test, expect } from '@playwright/test';
import { getTeamDisplayName, isArgentinaTeam, matchInvolvesArgentina } from '../src/apiClient';
import type { FootballMatch } from '../src/types';

const ARGENTINA_TEAM_ID = 7627;

test.describe('Filtrado de partidos de Argentina', () => {
  test('detecta Argentina por ID aunque el nombre sea null', () => {
    const team = { id: ARGENTINA_TEAM_ID, name: null };

    expect(isArgentinaTeam(team, ARGENTINA_TEAM_ID)).toBe(true);
  });

  test('detecta Argentina por nombre sin fallar con equipos sin nombre', () => {
    const argentina = { id: 1, name: 'Argentina' };
    const unknown = { id: 2, name: null };

    expect(isArgentinaTeam(argentina, ARGENTINA_TEAM_ID)).toBe(true);
    expect(isArgentinaTeam(unknown, ARGENTINA_TEAM_ID)).toBe(false);
  });

  test('filtra partidos del Mundial que involucran a Argentina', () => {
    const matches: FootballMatch[] = [
      {
        id: 1,
        utcDate: '2026-06-20T18:00:00.000Z',
        status: 'SCHEDULED',
        homeTeam: { id: ARGENTINA_TEAM_ID, name: 'Argentina' },
        awayTeam: { id: 99, name: null },
      },
      {
        id: 2,
        utcDate: '2026-06-21T18:00:00.000Z',
        status: 'SCHEDULED',
        homeTeam: { id: 10, name: 'Brasil' },
        awayTeam: { id: 11, name: 'Francia' },
      },
    ];

    const argentinaMatches = matches.filter((match) =>
      matchInvolvesArgentina(match, ARGENTINA_TEAM_ID),
    );

    expect(argentinaMatches).toHaveLength(1);
    expect(argentinaMatches[0].id).toBe(1);
  });

  test('usa un nombre alternativo cuando el rival no tiene name', () => {
    const rival = { id: 99, name: null, shortName: 'TBD' };

    expect(getTeamDisplayName(rival)).toBe('TBD');
  });
});
