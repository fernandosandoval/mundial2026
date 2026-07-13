import { test, expect } from '@playwright/test';
import {
  calculateTimeRemaining,
  computeNotificationTimes,
  formatCuantoFalta,
  formatStartupEmailBody,
} from '../src/utils/time';

test.describe('Cálculo de tiempos y formato CLI', () => {
  test('calcula correctamente horas y minutos restantes', () => {
    const matchStart = new Date('2026-06-15T18:00:00.000Z');
    const now = new Date('2026-06-15T14:30:00.000Z');

    const remaining = calculateTimeRemaining(matchStart, now);

    expect(remaining.hours).toBe(3);
    expect(remaining.minutes).toBe(30);
    expect(remaining.totalMilliseconds).toBe(3 * 60 * 60 * 1000 + 30 * 60 * 1000);
  });

  test('no devuelve valores negativos cuando el partido ya comenzó', () => {
    const matchStart = new Date('2026-06-15T18:00:00.000Z');
    const now = new Date('2026-06-15T20:00:00.000Z');

    const remaining = calculateTimeRemaining(matchStart, now);

    expect(remaining.hours).toBe(0);
    expect(remaining.minutes).toBe(0);
    expect(remaining.totalMilliseconds).toBe(0);
  });

  test('formatea el mensaje del CLI con el formato exacto requerido', () => {
    const matchStart = new Date('2026-06-15T18:00:00.000Z');
    const now = new Date('2026-06-15T14:30:00.000Z');

    const message = formatCuantoFalta('Brasil', 'Francia', matchStart, now);

    expect(message).toBe(
      'Faltan 3 horas y 30 minutos para que comience el partido entre Brasil y Francia',
    );
  });

  test('formatea el cuerpo del email de arranque', () => {
    const matchStart = new Date('2026-06-15T18:00:00.000Z');
    const now = new Date('2026-06-15T14:30:00.000Z');

    const message = formatStartupEmailBody('Brasil', 'Francia', matchStart, now);

    expect(message).toBe(
      'El monitor está activo. El próximo partido es Brasil vs Francia y comienza en 3 horas y 30 minutos.',
    );
  });

  test('calcula los tres horarios de notificación', () => {
    const matchStart = new Date('2026-06-15T18:00:00.000Z');
    const times = computeNotificationTimes(matchStart);

    expect(times.oneHourBefore.toISOString()).toBe('2026-06-15T17:00:00.000Z');
    expect(times.kickoff.toISOString()).toBe('2026-06-15T18:00:00.000Z');
    expect(times.estimatedEnd.toISOString()).toBe('2026-06-15T19:55:00.000Z');
  });
});
