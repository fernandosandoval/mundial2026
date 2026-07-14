/**
 * Traducciones de selecciones (API en inglés → español).
 * Si falta algún país, translateTeamName devuelve el nombre original.
 */
export const TEAM_NAME_TRANSLATIONS: Record<string, string> = {
  Argentina: 'Argentina',
  France: 'Francia',
  Spain: 'España',
  England: 'Inglaterra',
  Switzerland: 'Suiza',
  Germany: 'Alemania',
  Netherlands: 'Países Bajos',
  Brazil: 'Brasil',
  Portugal: 'Portugal',
  Italy: 'Italia',
  Belgium: 'Bélgica',
  Croatia: 'Croacia',
  Uruguay: 'Uruguay',
  Colombia: 'Colombia',
  Morocco: 'Marruecos',
  Mexico: 'México',
  'United States': 'Estados Unidos',
  USA: 'Estados Unidos',
  Canada: 'Canadá',
  Japan: 'Japón',
  'South Korea': 'Corea del Sur',
  Korea: 'Corea del Sur',
  'Saudi Arabia': 'Arabia Saudita',
  Australia: 'Australia',
  Senegal: 'Senegal',
  Tunisia: 'Túnez',
  Ecuador: 'Ecuador',
  Poland: 'Polonia',
  Denmark: 'Dinamarca',
  'Wales': 'Gales',
  Scotland: 'Escocia',
  Serbia: 'Serbia',
  Ghana: 'Ghana',
  Cameroon: 'Camerún',
  Iran: 'Irán',
  'Costa Rica': 'Costa Rica',
  Chile: 'Chile',
  Peru: 'Perú',
  Paraguay: 'Paraguay',
  Venezuela: 'Venezuela',
  Bolivia: 'Bolivia',
  Austria: 'Austria',
  Hungary: 'Hungría',
  'Czech Republic': 'República Checa',
  'Czechia': 'República Checa',
  Romania: 'Rumania',
  Turkey: 'Turquía',
  Türkiye: 'Turquía',
  Norway: 'Noruega',
  Sweden: 'Suecia',
  Egypt: 'Egipto',
  Nigeria: 'Nigeria',
  Algeria: 'Argelia',
  'Ivory Coast': "Costa de Marfil",
  "Côte d'Ivoire": 'Costa de Marfil',
  Qatar: 'Catar',
  'New Zealand': 'Nueva Zelanda',
};

export function translateTeamName(englishName: string): string {
  const normalized = englishName.trim();
  if (!normalized) {
    return englishName;
  }

  return TEAM_NAME_TRANSLATIONS[normalized] ?? englishName;
}

export const STAGE_TRANSLATIONS: Record<string, string> = {
  FINAL: 'Final',
  SEMI_FINALS: 'Semifinal',
  THIRD_PLACE: 'Tercer Puesto',
  QUARTER_FINALS: 'Cuartos de final',
  LAST_16: 'Octavos de final',
  ROUND_OF_16: 'Octavos de final',
  GROUP_STAGE: 'Fase de grupos',
  REGULAR_SEASON: 'Fase regular',
  PLAYOFF_ROUND: 'Playoff',
  PRELIMINARY_ROUND: 'Ronda preliminar',
};

export const GROUP_TRANSLATIONS: Record<string, string> = {
  GROUP_A: 'Grupo A',
  GROUP_B: 'Grupo B',
  GROUP_C: 'Grupo C',
  GROUP_D: 'Grupo D',
  GROUP_E: 'Grupo E',
  GROUP_F: 'Grupo F',
  GROUP_G: 'Grupo G',
  GROUP_H: 'Grupo H',
};

export function translateGroup(group: string | null | undefined): string {
  if (!group) {
    return '';
  }
  const normalized = group.trim().toUpperCase();
  return GROUP_TRANSLATIONS[normalized] ?? group;
}

export function translateStage(stage: string | null | undefined): string {
  if (!stage) {
    return 'Por confirmar';
  }

  const normalized = stage.trim().toUpperCase();
  return STAGE_TRANSLATIONS[normalized] ?? stage;
}
