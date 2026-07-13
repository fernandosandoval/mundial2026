import dotenv from 'dotenv';

dotenv.config();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variable de entorno requerida no definida: ${name}`);
  }
  return value;
}

function optionalEnv(name: string, defaultValue: string): string {
  return process.env[name] ?? defaultValue;
}

export const config = {
  footballDataApiKey: requireEnv('FOOTBALL_DATA_API_KEY'),
  argentinaTeamId: Number(optionalEnv('ARGENTINA_TEAM_ID', '7627')),
  worldCupCompetitionCode: optionalEnv('WORLD_CUP_COMPETITION_CODE', 'WC'),
  resendApiKey: requireEnv('RESEND_API_KEY'),
  resendFromEmail: requireEnv('RESEND_FROM_EMAIL'),
  notificationEmail: requireEnv('NOTIFICATION_EMAIL'),
  port: Number(optionalEnv('PORT', '3000')),
  matchDurationMinutes: 115,
  oneHourBeforeMinutes: 60,
};

export function loadConfigForCli(): Pick<
  typeof config,
  'footballDataApiKey' | 'argentinaTeamId' | 'worldCupCompetitionCode'
> {
  return {
    footballDataApiKey: requireEnv('FOOTBALL_DATA_API_KEY'),
    argentinaTeamId: Number(optionalEnv('ARGENTINA_TEAM_ID', '7627')),
    worldCupCompetitionCode: optionalEnv('WORLD_CUP_COMPETITION_CODE', 'WC'),
  };
}
