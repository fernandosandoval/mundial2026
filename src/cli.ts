import { FootballDataClient } from './apiClient';
import { loadConfigForCli } from './config';
import { formatCuantoFalta } from './utils/time';

async function main(): Promise<void> {
  const cliConfig = loadConfigForCli();

  const apiClient = new FootballDataClient({
    apiKey: cliConfig.footballDataApiKey,
    argentinaTeamId: cliConfig.argentinaTeamId,
    worldCupCompetitionCode: cliConfig.worldCupCompetitionCode,
  });

  const nextMatch = await apiClient.getNextArgentinaMatch();

  if (!nextMatch) {
    console.log('No hay próximos partidos de Argentina programados en el Mundial.');
    process.exit(0);
  }

  console.log(formatCuantoFalta(nextMatch.rivalName, nextMatch.startTime));
}

main().catch((error) => {
  console.error('Error al consultar el próximo partido:', error);
  process.exit(1);
});
