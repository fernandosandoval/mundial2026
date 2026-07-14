# Monitor de Partidos de Argentina - Mundial 2026

Sistema automatizado en Node.js + TypeScript para monitorear los partidos de Argentina en el Mundial 2026. Consulta la API de [Football-Data.org](https://www.football-data.org/), programa notificaciones por email con [Resend](https://resend.com/) y expone un comando CLI para consultar cuánto falta para el próximo partido.

## Características

- Consulta el próximo partido de Argentina en la competencia del Mundial (`WC`).
- Programa notificaciones por email con el SDK oficial de Resend (`resend`):
  1. **1 hora antes** del inicio → asunto: `Falta 1 hora para el partido de Argentina`
  2. **Al inicio** del partido → asunto: `Comenzó el partido de Argentina`
  3. **~115 minutos después** del inicio → verifica si el partido finalizó y envía resultado
- **Live tracking** durante partidos en vivo:
  - Notificación de **descanso** con resultado del primer tiempo
  - Notificaciones de **goles** en tiempo real
  - Notificación de **tarjetas rojas**
  - Email de **resultado final** con goles, tarjetas y sustituciones
- **Persistencia de jobs**: los notificaciones sobreviven reinicios del proceso (almacenados en JSON)
- **Caché + Rate Limiter**: protege contra el límite de 10 req/min de la API
- **Retry con backoff exponencial**: recuperación automática de errores de red
- **Emails HTML enriquecidos**: todos los emails incluyen HTML con escudos de equipos, colores e información detallada
- CLI con `npm run cuantoFalta` para ver el tiempo restante en consola.
- Diseñado para desplegarse en [Render](https://render.com/) como servicio web de larga duración.

## Estructura del proyecto

```
mundial2026/
├── src/
│   ├── index.ts              # Proceso principal (servidor + scheduler)
│   ├── cli.ts                # Comando npm run cuantoFalta
│   ├── config.ts             # Variables de entorno
│   ├── types.ts              # Tipos compartidos
│   ├── apiClient.ts          # Cliente Football-Data.org (con caché + retry)
│   ├── apiCache.ts           # Caché genérico con TTL
│   ├── retry.ts              # Retry con exponential backoff
│   ├── jobStore.ts           # Persistencia de jobs en JSON
│   ├── liveTracker.ts        # Live tracking durante partidos en vivo
│   ├── emailService.ts       # Envío de emails con Resend
│   ├── scheduler.ts          # Lógica de programación de notificaciones
│   ├── schedulerAdapter.ts   # Adaptador node-schedule (testeable)
│   ├── dailyCron.ts          # Resumen matutino diario
│   └── utils/
│       ├── time.ts           # Cálculos y formateo de tiempo
│       ├── timezone.ts       # Manejo de zona horaria Argentina
│       ├── translations.ts   # Traducciones de equipos y etapas
│       └── emailTemplates.ts # Plantillas HTML para emails
├── tests/
│   ├── time.spec.ts          # Pruebas de cálculo y formato CLI
│   ├── scheduler.spec.ts     # Pruebas de programación de emails
│   ├── match-result.spec.ts  # Pruebas de victoria/empate/derrota
│   ├── dailyCron.spec.ts     # Pruebas del resumen matutino
│   ├── apiClient.spec.ts     # Pruebas del cliente API
│   ├── apiCache.spec.ts      # Pruebas del caché
│   ├── retry.spec.ts         # Pruebas de retry
│   ├── jobStore.spec.ts      # Pruebas de persistencia
│   ├── emailTemplates.spec.ts # Pruebas de plantillas HTML
│   ├── translations.spec.ts  # Pruebas de traducciones
│   └── helpers/
│       └── mocks.ts          # Mocks reutilizables
├── data/                     # Jobs persistidos (gitignore)
├── .env.example
├── package.json
├── tsconfig.json
└── playwright.config.ts
```

## Requisitos

- Node.js >= 20
- Cuenta en [Football-Data.org](https://www.football-data.org/client/register) (API Key gratuita)
- Cuenta en [Resend](https://resend.com/) con dominio verificado para enviar emails

## Variables de entorno

Copiá `.env.example` a `.env` y completá los valores:

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `FOOTBALL_DATA_API_KEY` | Sí | Token de autenticación de Football-Data.org |
| `RESEND_API_KEY` | Sí | API Key de Resend |
| `RESEND_FROM_EMAIL` | Sí | Remitente verificado en Resend (ej: `Argentina Mundial <notif@tudominio.com>`) |
| `NOTIFICATION_EMAIL` | Sí | Email destino de las notificaciones |
| `ARGENTINA_TEAM_ID` | No | ID del equipo Argentina en Football-Data.org (default: `7627`) |
| `WORLD_CUP_COMPETITION_CODE` | No | Código de competencia del Mundial (default: `WC`) |
| `PORT` | No | Puerto del health check HTTP (default: `3000`) |
| `LIVE_POLL_INTERVAL_MS` | No | Intervalo de polling para live tracking en ms (default: `60000`) |
| `JOB_STORE_PATH` | No | Ruta del archivo de persistencia de jobs (default: `data/jobs.json`) |

```bash
cp .env.example .env
```

## Instalación

```bash
npm install
```

## Uso

### Servidor principal (monitor + notificaciones)

Desarrollo:

```bash
npm run dev
```

Producción:

```bash
npm run build
npm start
```

El proceso:
1. Levanta un endpoint de health check en `GET /` (útil para Render).
2. Consulta el próximo partido de Argentina en el Mundial.
3. Programa las 3 tareas de notificación con `node-schedule`.

### CLI: ¿Cuánto falta?

```bash
npm run cuantoFalta
```

Salida esperada:

```
Faltan 3 horas y 30 minutos para que comience el partido entre Argentina y Francia
```

## Despliegue en Render

1. Creá un nuevo **Web Service** en Render conectado a este repositorio.
2. Configurá:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
3. Agregá las variables de entorno en el panel de Render (las mismas del `.env`).
4. Render asignará automáticamente la variable `PORT`.

> **Nota:** Este servicio debe permanecer en ejecución continua para que `node-schedule` dispare las notificaciones en el momento exacto. Un plan gratuito puede entrar en sleep; para notificaciones puntuales se recomienda un plan que no suspenda el proceso.

## Tests

Las pruebas usan [Playwright Test](https://playwright.dev/docs/test-intro) orientado a lógica de API (sin navegador):

```bash
npm test
```

Cobertura de pruebas (68 tests):
- Cálculo de tiempo restante y formato exacto del CLI.
- Programación y ejecución de notificaciones (con API mockeada).
- Envío condicional del email de resultado (gana / empata / pierde / partido no finalizado).
- Caché con TTL y expiración.
- Retry con backoff exponencial.
- Persistencia de jobs en JSON.
- Plantillas HTML para todos los tipos de email.
- Traducciones de equipos y etapas.

## Flujo de notificaciones

```mermaid
sequenceDiagram
    participant App as Monitor
    participant API as Football-Data.org
    participant Sched as node-schedule
    participant Live as LiveTracker
    participant Email as Resend

    App->>API: GET próximo partido Argentina (WC)
    API-->>App: fecha, rival, id
    App->>Sched: Programar T-1h, T+0, T+115min
    App->>App: Persistir jobs en JSON

    Sched->>Email: T-1h: "Falta 1 hora..." (HTML)
    Sched->>Email: T+0: "Comenzó el partido..." (HTML)
    Sched->>Live: Iniciar live tracking (polling cada 60s)

    loop Cada 60 segundos
        Live->>API: GET estado del partido
        API-->>Live: status, goals, bookings
        alt Status cambió a PAUSED
            Live->>Email: "Descanso: 1-0" (HTML)
        end
        alt Nuevo gol detectado
            Live->>Email: "¡Gol! Messi 23'" (HTML)
        end
        alt Tarjeta roja detectada
            Live->>Email: "🟥 Roja: Mbappé" (HTML)
        end
        alt Status cambió a FINISHED
            Live->>Email: "Resultado final: 2-1" (HTML con stats)
            Live->>Live: Detener polling
        end
    end

    Sched->>App: T+115min: verificar resultado (backup)
    App->>API: GET partido por ID
    API-->>App: status + score
    alt Partido finalizado
        App->>Email: "Terminó: Argentina 2 - 1 Francia" (HTML)
    end
```

## Licencia

MIT
