import type { MatchInfo } from '../types';

const MS_PER_MINUTE = 60_000;
const MS_PER_HOUR = 3_600_000;

export interface TimeRemaining {
  hours: number;
  minutes: number;
  totalMilliseconds: number;
}

export function calculateTimeRemaining(
  matchStart: Date,
  now: Date = new Date(),
): TimeRemaining {
  const totalMilliseconds = Math.max(0, matchStart.getTime() - now.getTime());
  const totalMinutes = Math.floor(totalMilliseconds / MS_PER_MINUTE);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return { hours, minutes, totalMilliseconds };
}

export function formatCuantoFalta(rivalName: string, matchStart: Date, now: Date = new Date()): string {
  const { hours, minutes } = calculateTimeRemaining(matchStart, now);
  return `Faltan ${hours} horas y ${minutes} minutos para que comience el partido entre Argentina y ${rivalName}`;
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * MS_PER_MINUTE);
}

export function subtractMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() - minutes * MS_PER_MINUTE);
}

export function computeNotificationTimes(
  matchStart: Date,
  matchDurationMinutes = 115,
  oneHourBeforeMinutes = 60,
): {
  oneHourBefore: Date;
  kickoff: Date;
  estimatedEnd: Date;
} {
  return {
    oneHourBefore: subtractMinutes(matchStart, oneHourBeforeMinutes),
    kickoff: new Date(matchStart),
    estimatedEnd: addMinutes(matchStart, matchDurationMinutes),
  };
}

export function isFutureDate(date: Date, now: Date = new Date()): boolean {
  return date.getTime() > now.getTime();
}

export function formatMatchSummary(match: MatchInfo): string {
  const venue = match.isArgentinaHome ? 'Local' : 'Visitante';
  return `Argentina vs ${match.rivalName} (${venue}) - ${match.startTime.toISOString()}`;
}
