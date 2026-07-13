import { FootballDataClient } from './apiClient';
import { loadConfigForCli } from './config';
import { formatCuantoFalta } from './utils/time';

async function main(): Promise<void> {
  const cliConfig = loadConfigForCli();

  const apiClient = new FootballDataClient({
    apiKey: cliConfig.footballDataApiKey,
    worldCupCompetitionCode: cliConfig.worldCupCompetitionCode,
  });

  const nextMatch = await apiClient.getNextMatch();

  if (!nextMatch) {
    console.log('No hay próximos partidos programados en el Mundial.');
    process.exit(0);
  }

  console.log(
    formatCuantoFalta(nextMatch.homeTeamName, nextMatch.awayTeamName, nextMatch.startTime),
  );
}

main().catch((error) => {
  console.error('Error al consultar el próximo partido:', error);
  process.exit(1);
});
