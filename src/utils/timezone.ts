export const ARGENTINA_TIMEZONE = 'America/Argentina/Buenos_Aires';

/** Devuelve la fecha calendario YYYY-MM-DD en la zona horaria dada. */
export function formatCalendarDate(date: Date, timeZone: string = ARGENTINA_TIMEZONE): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function isSameCalendarDay(
  dateA: Date,
  dateB: Date,
  timeZone: string = ARGENTINA_TIMEZONE,
): boolean {
  return formatCalendarDate(dateA, timeZone) === formatCalendarDate(dateB, timeZone);
}

/** Hora de inicio en Argentina (0–23), formato 24h. */
export function getKickoffHourInArgentina(date: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: ARGENTINA_TIMEZONE,
    hour: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(date);

  const hourPart = parts.find((part) => part.type === 'hour');
  return Number(hourPart?.value ?? '0');
}

/** Horario HH:MM en zona Argentina (24h). */
export function getKickoffTimeInArgentina(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: ARGENTINA_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  const hour = parts.find((part) => part.type === 'hour')?.value ?? '00';
  const minute = parts.find((part) => part.type === 'minute')?.value ?? '00';
  return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
}
