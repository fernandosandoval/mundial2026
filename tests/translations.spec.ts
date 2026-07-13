import { test, expect } from '@playwright/test';
import { getTeamDisplayName } from '../src/apiClient';
import { translateTeamName } from '../src/utils/translations';
import { formatCuantoFalta, formatStartupEmailBody, emailSubjects } from '../src/utils/time';

test.describe('Traducción de nombres de equipos', () => {
  test('traduce los nombres solicitados al español', () => {
    expect(translateTeamName('France')).toBe('Francia');
    expect(translateTeamName('Spain')).toBe('España');
    expect(translateTeamName('England')).toBe('Inglaterra');
    expect(translateTeamName('Switzerland')).toBe('Suiza');
    expect(translateTeamName('Germany')).toBe('Alemania');
    expect(translateTeamName('Netherlands')).toBe('Países Bajos');
    expect(translateTeamName('Brazil')).toBe('Brasil');
    expect(translateTeamName('Portugal')).toBe('Portugal');
    expect(translateTeamName('Italy')).toBe('Italia');
    expect(translateTeamName('Belgium')).toBe('Bélgica');
    expect(translateTeamName('Croatia')).toBe('Croacia');
    expect(translateTeamName('Uruguay')).toBe('Uruguay');
    expect(translateTeamName('Colombia')).toBe('Colombia');
    expect(translateTeamName('Morocco')).toBe('Marruecos');
  });

  test('devuelve el nombre original si no está en el diccionario', () => {
    expect(translateTeamName('Atlantis FC')).toBe('Atlantis FC');
  });

  test('getTeamDisplayName traduce el nombre de la API', () => {
    expect(getTeamDisplayName({ id: 1, name: 'France' })).toBe('Francia');
    expect(getTeamDisplayName({ id: 2, name: 'Spain' })).toBe('España');
  });

  test('CLI y email de arranque muestran nombres en español', () => {
    const matchStart = new Date('2026-06-15T18:00:00.000Z');
    const now = new Date('2026-06-15T14:30:00.000Z');

    expect(formatCuantoFalta('France', 'Spain', matchStart, now)).toBe(
      'Faltan 3 horas y 30 minutos para que comience el partido entre Francia y España',
    );

    expect(formatStartupEmailBody('France', 'Spain', matchStart, now)).toBe(
      'El monitor está activo. El próximo partido es Francia vs España y comienza en 3 horas y 30 minutos.',
    );
  });

  test('asuntos de email usan nombres en español', () => {
    const subjects = emailSubjects({
      id: 1,
      startTime: new Date('2026-06-15T18:00:00.000Z'),
      homeTeamName: 'France',
      awayTeamName: 'Spain',
      homeTeamId: 1,
      awayTeamId: 2,
      status: 'SCHEDULED',
      stage: 'Final',
      venue: 'Estadio por confirmar',
      refereeName: 'Por confirmar',
      homeCrest: null,
      awayCrest: null,
    });

    expect(subjects.oneHourBefore).toBe('Falta 1 hora para: Francia vs España');
    expect(subjects.kickoff).toBe('Comenzó el partido: Francia vs España');
    expect(subjects.matchEnded).toBe('Terminó el partido: Francia vs España');
  });
});
