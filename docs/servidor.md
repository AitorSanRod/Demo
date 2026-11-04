# Servidor de salas compartidas (Netlify, plan gratuito)

Las salas de los jefes comunitarios (pestaña Raids y paradas de ruta) se comparten entre jugadores a través de una
función de Netlify que guarda las salas en Netlify Blobs. No hay cuentas: cada dispositivo tiene un id anónimo y un
apodo. Todo lo demás de la partida sigue en el navegador.

Cómo funciona por dentro: [arquitectura.md › Salas compartidas](arquitectura.md#salas-compartidas-servidor).

## Qué hay montado

| Pieza | Dónde |
|---|---|
| Configuración del despliegue (build, carpeta publicada, funciones, Node 22) | `netlify.toml` |
| La función: `POST /api/raid` | `netlify/functions/raid.mts` |
| Las salas en Netlify Blobs (almacén `raid-rooms`, se crea solo) | `netlify/lib/roomStore.ts` |
| Lógica del servidor (la misma del juego, con tests) | `src/game/raid/online/` |
| Cliente: id anónimo y apodo, llamadas y cada cuánto consulta | `src/net/` |

No hace falta configurar ninguna variable de entorno, clave ni base de datos: Netlify Blobs viene incluido en el
plan gratuito y la función lo encuentra sola.

## Paso a paso: publicar

1. **Sube el código a GitHub.** Haz commit de todo (incluidos `netlify.toml` y la carpeta `netlify/`) y súbelo
   a tu repositorio.
2. **Crea la cuenta** en [netlify.com](https://www.netlify.com/) con el plan gratuito (*Free*). Lo más cómodo es
   entrar con tu cuenta de GitHub.
3. **Importa el proyecto.** En el panel: *Add new project* → *Import an existing project* → *GitHub* → autoriza y
   elige el repositorio.
4. **Revisa la configuración.** Netlify lee `netlify.toml`, así que los campos ya vienen rellenos:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`

   No cambies nada y pulsa *Deploy*.
5. **Espera al primer despliegue** (unos 1–2 minutos). Cuando ponga *Published*, abre la URL que te da
   (`https://<nombre>.netlify.app`). Puedes cambiar el nombre en *Project configuration → Change project name*.
6. **Comprueba que la función está viva.** En el panel: *Logs → Functions* debe aparecer `raid`. Si abres
   `https://<nombre>.netlify.app/api/raid` en el navegador verás `{"error":"Solo POST"}`: es lo esperado (la app
   le habla con POST).
7. **Prueba con dos jugadores.** Abre la web en el móvil y en el ordenador (o en una ventana de incógnito: cuenta
   como otro jugador). En los dos: termina el tutorial, ve a *Ruta › Raids* y manda un Pokémon. La primera vez se
   pide el apodo. Verás «Buscando sala con otros jugadores…» un instante y luego los dos en la misma sala: el tuyo
   marcado como «Tú» y el del otro con su apodo.
8. **Instálala como app** desde el móvil («Añadir a pantalla de inicio»): ya está en HTTPS.

Desde entonces, cada `git push` a `main` vuelve a desplegar solo.

### GitHub Pages

El workflow de GitHub Pages (`.github/workflows/deploy.yml`) sigue funcionando, pero allí no hay servidor: las raids
se juegan en local, con bots. Si te quedas con Netlify, puedes desactivarlo en GitHub (*Settings → Pages* y, en
*Actions*, deshabilitar el workflow) para no gastar minutos de más.

## Probar en local

- `npm run dev`: solo la app. No hay servidor, así que las raids se juegan en local con bots (como antes).
- `npx netlify dev`: la app y la función juntas en <http://localhost:8888>, con un Netlify Blobs local de pruebas.
  La primera vez descarga la CLI de Netlify. No hace falta iniciar sesión para probar.

## Lo que gasta del plan gratuito

Netlify tiene dos esquemas de plan gratuito, según cuándo creaste la cuenta. Mira cuál es el tuyo en
*Team settings → Billing* y el consumo en *Usage*:

- **Cuentas antiguas**: límites por separado (del orden de 125 000 llamadas a funciones al mes y 100 GB de ancho de
  banda).
- **Cuentas nuevas (por créditos)**: 300 créditos al mes que se reparten entre despliegues, ancho de banda y
  funciones. Al agotarlos, la web se pausa hasta el mes siguiente: **no se cobra nada**.

Cada consulta a una sala es una llamada a la función. El cliente solo consulta si el jugador tiene un Pokémon en una
sala compartida y la app está abierta y delante:

| Situación | Consultas | Por hora |
|---|---|---|
| Mirando la pelea (pestaña Raids o parada de ruta en pantalla) | cada 5 s | ≈ 720 |
| App abierta en otra pestaña | cada 60 s | ≈ 60 |
| App cerrada o en segundo plano | ninguna (el servidor sigue la pelea y se pone al día al volver) | 0 |
| Sin Pokémon en ninguna sala | ninguna | 0 |

Como referencia, con un límite de 125 000 llamadas al mes caben ≈ 170 horas de alguien mirando la pelea, o ≈ 2 000
horas con la app abierta en otra pestaña. Si se queda corto, sube `WATCH_SYNC_MS` y `BACKGROUND_SYNC_MS` en
`src/net/raidSync.ts` (con más tiempo entre consultas, la pelea se ve a saltos: se ve la última ronda de cada
consulta). Cada despliegue también gasta: si vas justo, no hagas push por cada cambio pequeño.

Blobs: cada sala ocupa unos pocos KB y se borra sola tras 24 h sin consultas (`ROOM_TTL_MS`).

## Mantenimiento

- **Ver las salas guardadas**: en el panel, *Blobs* → almacén `raid-rooms`. Puedes borrar salas a mano; los
  jugadores que estuvieran en ellas siguen la pelea en local.
- **Errores de la función**: *Logs → Functions → raid*.
- **Cambias el juego (jefes, reglas, `RAID_ROOM_SIZE`…)**: el servidor usa el mismo código de `src/game` y `src/data`,
  así que se actualiza con cada despliegue. Las salas ya guardadas siguen con su jefe hasta que caen o caducan.
- **Cambias `SAVE_VERSION`**: no afecta al servidor. El id anónimo y el apodo se guardan aparte de la partida y se
  conservan.

## Límites que conviene saber

- **Sin cuentas no hay protección contra trampas**: quien sepa mandar peticiones a mano puede inventarse el nivel
  de su Pokémon. El servidor valida que los datos tengan sentido (especie existente, nivel 1–100, apodo limpio), pero
  no puede comprobar la partida, que solo está en el navegador.
- **El id está en el navegador**: si se borran los datos del sitio, el dispositivo es un jugador nuevo para el
  servidor (pierde las salas en las que estaba, no la partida).
- **No es tiempo real al milisegundo**: el servidor juega la sala cuando alguien consulta y cada cliente pregunta
  cada pocos segundos. Para un juego idle basta; para algo más rápido harían falta WebSockets, que el plan
  gratuito de Netlify no tiene.
