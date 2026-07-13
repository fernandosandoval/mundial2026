import { createServer } from 'http';
import { FootballDataClient } from './apiClient';
import { config } from './config';
import { ResendEmailService } from './emailService';
import { MatchScheduler } from './scheduler';
import { NodeScheduleAdapter } from './schedulerAdapter';

async function startHealthServer(port: number): Promise<void> {
  const server = createServer((_req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'mundial2026-argentina-monitor' }));
  });

  await new Promise<void>((resolve) => {
    server.listen(port, () => {
      console.log(`[server] Health check disponible en http://localhost:${port}`);
      resolve();
    });
  });
}

async function main(): Promise<void> {
  console.log('[monitor] Iniciando monitor de partidos de Argentina - Mundial 2026');

  const apiClient = new FootballDataClient({
    apiKey: config.footballDataApiKey,
    argentinaTeamId: config.argentinaTeamId,
    worldCupCompetitionCode: config.worldCupCompetitionCode,
  });

  const emailService = new ResendEmailService({
    apiKey: config.resendApiKey,
    fromEmail: config.resendFromEmail,
    toEmail: config.notificationEmail,
  });

  const monitor = new MatchScheduler({
    apiClient,
    emailService,
    scheduler: new NodeScheduleAdapter(),
    argentinaTeamId: config.argentinaTeamId,
    matchDurationMinutes: config.matchDurationMinutes,
    oneHourBeforeMinutes: config.oneHourBeforeMinutes,
  });

  await startHealthServer(config.port);
  await monitor.initialize();

  console.log('[monitor] Proceso en ejecución. Las notificaciones están programadas.');
}

main().catch((error) => {
  console.error('[monitor] Error fatal:', error);
  process.exit(1);
});
