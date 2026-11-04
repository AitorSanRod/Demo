# Arquitectura

## Capas

```
src/data/   Datos estáticos y consultas sobre ellos. No conoce el estado de la partida.
src/game/   Reglas del juego. Funciones puras sobre GameState. Sin React, sin DOM (salvo core/store.ts).
src/net/    Conexión con el servidor: salas compartidas, cuenta opcional y partida en la nube.
src/ui/     Componentes React. Leen GameState y disparan acciones con act().
worker/     Servidor: Worker de Cloudflare con base de datos D1 (API /api/*). La lógica del juego es la de src/game.
migrations/ Esquema de la base de datos D1, un fichero por cambio.
scripts/    Utilidades de desarrollo (regenerar pokemon.json, iconos PWA). No se empaquetan.
```

Regla de dependencias: `ui → net → game → data` y `worker → game → data`. Nunca al revés. `data` no importa de
`game`; `game` no importa de `net` ni de `ui`. `src/game` y `src/data` se ejecutan también en el servidor: nada de
DOM ni de `import` de imágenes en ellos (las imágenes de los mapas van con `asset(new URL(…, import.meta.url))`).

## Estructura

```
src/
  main.tsx            Arranque: estilos base, service worker y <App> dentro del ErrorBoundary
  App.tsx             Bucle de tiempo, menú inferior y pantalla de cada pestaña
  index.css           Entrada de los estilos base (src/styles/: variables, estructura y piezas comunes)
  assets/             Imágenes propias (fondo del rancho)
  data/               species, pokemon (ids por nombre), pokedexes (regionales y Nacional), types, moves,
                      evolutions, stones + pokemon.json
    maps/             kantoMaps (una por región), mapCommon, index (regiones y route)
  game/
    core/             state (GameState, SAVE_VERSION), store (useGame, act, guardado), teamBackup, random, tick,
                      test-utils, test-map
    battle/           battle (simulación por turnos), attack (un turno de ataque), status (estados alterados),
                      combatBonus (pasivas sumadas), rewards (₽, tickets, EXP y piezas por victoria)
    run/              run (salida, avance por tiempo, toques), runBattle (combates de la ruta y premio final)
    team/             mons (alta), stats, ranch, ranches (espacios, Caja, traslados), ranchPassives (pasivas del rancho),
                      ranchTypes (tipos de rancho), evolution, stones, expedition, upgrades,
                      tutorial
    collection/       dex (vistos, capturados, favoritos), pieces, gacha, shredder
    raid/             raidEngine (lo común a toda sala: crear, entrar, salir, avanzar, reparto), raid (jefe de la
                      pestaña Raids), routeRaid (jefes de las paradas de ruta), raidRoom (tipos y sala), raidCombat
                      (rondas), raidBots (bots de la sala), raidPrizes (reparto y recogida), raidEstimate (tiempo que
                      falta), stopRoom (salas de parada sin la partida)
      online/         Salas compartidas: protocol (lo que se dicen juego y servidor), linkedRoom (la sala de la
                      partida enlazada a la del servidor), sharedRoom + roomServer (lo que hace el servidor),
                      requests (validar lo que le llega)
  net/                identity (id de jugador y apodo), raidApi (fetch a /api/raid), raidSync (bucle de consultas),
                      account (cuenta: /api/auth), cloudSync (partida en la nube)
  ui/
    shared/           Sprite, ItemIcon e icons (iconos con objetos de PokeAPI) y piezas comunes, pantallas superpuestas (premios, aparición, confirmación),
                      barra superior, bocadillos del tutorial, ErrorBoundary
      sheet/          Ficha del Pokémon (PokemonSheet): un solo componente que abren rancho y Pokédex, con sus
                      secciones (MonOverview = Datos, CareSection, TicketsSection, EvolvePanel, MovePanel)
                      y la animación de aparición/evolución
    starter/          Elección del inicial (primer paso del tutorial)
    account/          Cuenta: entrar, crearla, recuperar la contraseña (AccountDialog), elegir partida y avisos (AccountHost)
    ranch/            Rancho (varios ranchos, arrastre, Caja); al tocar un Pokémon abre PokemonSheet
    settings/         Menú ⚙️ y notificaciones
    route/            Pestaña Ruta: lista de rutas y diálogo de comenzar, ruta en curso, combate, escena por bioma
                      (pixelScene/: pixel art generado y animado en canvas, ver fondos.md; scenery/: SVG de
                      los biomas restantes)
    expeditions/      Enviar, seguir y recoger expediciones
    raid/             Pestaña Ruta › Raids y la pelea contra un jefe comunitario (RaidBattleScene: la escena de ruta con
                      el grupo en filas desordenadas, partySpot; roundReplay reparte los golpes en el tiempo), lista de
                      la sala, enviar o retirar a tu Pokémon, apodo (NicknameDialog) y aviso de conexión (RaidLinkNote)
    gacha/            Tiradas, apertura de la Pokéball, trituradora y tienda de MissingNo
    dex/              Pokédex; al tocar una casilla abre PokemonSheet, la misma ficha que el rancho
    shop/             Mejoras
worker/
  index.ts            Entrada: /api/raid, /api/save y /api/auth/* (la web la sirve Cloudflare sin pasar por aquí)
  raid.ts             POST /api/raid: lee las salas de D1, llama a game/raid/online/roomServer y las guarda
  save.ts             GET / POST /api/save: la partida de la cuenta con sesión
  auth/               Cuentas: routes (rutas), credentials (crear y entrar), links (correos: confirmar y recuperar),
                      session (cookie), crypto (PBKDF2 y tokens)
  db/                 Consultas a D1: rooms, saves, users (cuentas, sesiones y enlaces)
  mail.ts             Correos con Brevo
  test/               D1 de pruebas sobre node:sqlite y un Worker de pruebas con cookie
```

Cada pantalla tiene su CSS en su carpeta y lo importa su componente (`RanchScreen.tsx` → `ranch.css`). Los
estilos base se cargan antes (`main.tsx`), así los de cada pantalla pueden pisarlos.

| Módulo | Responsabilidad |
|---|---|
| `data/species.ts` | Especies (desde `pokemon.json`, reducidas a 4 stats), rarezas, sprites, iniciales |
| `data/pokemon.ts` | `POKEMON`: número de cada especie por su nombre (`POKEMON.Pidgey`), para no escribir ids sueltos |
| `data/types.ts` | Tipos y tabla de eficacias |
| `data/moves.ts` | Un movimiento de daño por tipo y rareza; `signatureMove` da el de cada especie |
| `data/maps/kantoMaps.ts` | Rutas de Kanto; solo datos. Cada región tendrá su `xxxMaps.ts` |
| `data/maps/mapCommon.ts` | Tipos y diccionarios de los mapas, atajos para escribirlos (`enc`, `boss`, `chain`) y consultas de caminos (`pathFrom`, `isValidPath`) |
| `data/maps/index.ts` | Entrada de la carpeta (se importa como `data/maps`): lista de regiones y `route(id)` |
| `data/evolutions.ts` | Evoluciones de la 1ª gen., cada una por nivel o por piedra (`evolutionsOf`, `evolutionTo`) |
| `data/stones.ts` | Piedras evolutivas (`Stone`, `STONES`) |
| `game/core/state.ts` | Tipos de `GameState`, estado inicial, `SAVE_VERSION`, `restoreState` y dónde está cada Pokémon (`monPlace`) |
| `game/core/store.ts` | Estado global, guardado en `localStorage` y hook `useGame()` |
| `game/core/teamBackup.ts` | Copia del equipo que sobrevive a los cambios de `SAVE_VERSION` (provisional, hasta tener servidor) |
| `game/core/random.ts` | Tipo `Rng` y utilidades de azar (`seededRng`: secuencia fija a partir de una semilla) |
| `game/core/tick.ts` | `tick`: avance del tiempo (ruta, expediciones y descanso) |
| `game/battle/battle.ts` | Simulación de combate automático |
| `game/battle/rewards.ts` | Dinero, tickets y piezas por victoria |
| `game/run/run.ts` | Ruta del Pokémon activo: salida, avance por tiempo, pasos y toques |
| `game/run/runBattle.ts` | Combates de la ruta: se resuelven al llegar y se aplican al acabar su tiempo; premio final |
| `game/team/mons.ts` | Alta de un Pokémon (`createMon`) |
| `game/team/stats.ts` | Fórmulas de stats, EXP y velocidad de paso |
| `game/team/ranch.ts` | Acciones del rancho y descanso |
| `game/team/ranches.ts` | Espacios de cada rancho, la Caja, traslados entre ellos y sitio arrastrado (`moveMon`, `placeMon`) |
| `game/team/evolution.ts` | Evolucionar por nivel o piedra (`evolve`, `evolveBlocker`, `evolveDestination`, `evolvePrice`) |
| `game/team/stones.ts` | Comprar y gastar piedras evolutivas (`buyStone`, `spendStone`) |
| `game/team/expedition.ts` | Expediciones por tiempo |
| `game/team/upgrades.ts` | Mejoras de la pestaña Tienda (precios por nivel y compra) |
| `game/team/tutorial.ts` | Elección del inicial (da sus piezas) y pasos del tutorial; `combine` y `startRun` lo avanzan |
| `game/collection/dex.ts` | Vistos, capturados y favoritos |
| `game/collection/pieces.ts` | Piezas por especie y combinación (desbloqueo, ★ o ₽) |
| `game/collection/gacha.ts` | Tiradas (piezas) y compra de tickets |
| `game/collection/shredder.ts` | Trituradora (piezas → trozos de MissingNo) y compra de piezas con trozos |
| `game/raid/raidEngine.ts` | Lo común a toda sala: vida del jefe, crear sala, entrar y salir, EXP, avanzar rondas (`advanceRoom`) y reparto al caer |
| `game/raid/raid.ts` | Jefe de la pestaña Raids: aparición, enviar y retirar, y el siguiente al caer |
| `game/raid/routeRaid.ts` | Jefes de las paradas de ruta: al llegar, entrar en una sala de la parada o abrir otra; retirarse (derrota); al caer, la ruta sigue |
| `game/raid/raidRoom.ts` | Tipos de la sala (`Raid`, `RaidMember`, `RaidPrize`) y quién está dentro |
| `game/raid/raidCombat.ts` | Una ronda: todos pegan al jefe con la fórmula de siempre y el jefe pega a uno; revivir |
| `game/raid/raidBots.ts` | Bots que entran y salen de la sala (en local y en el servidor) |
| `game/raid/raidEstimate.ts` | Tiempo que tardará en caer el jefe: simula rondas sobre una copia de la sala con un azar de semilla fija |
| `game/raid/raidPrizes.ts` | Quién cobra (presencia mínima o seguir dentro), tirada de la tabla y recogida |
| `game/raid/stopRoom.ts` | Salas de parada sin la partida: abrir una nueva o en marcha (`stopRoom`) y avanzarla (`advanceStopRoom`) |
| `game/raid/online/protocol.ts` | Peticiones y respuestas entre el juego y el servidor de salas |
| `game/raid/online/linkedRoom.ts` | La sala de la partida enlazada a la del servidor: qué pedir (`roomRequest`) y aplicar la respuesta (`applyView`) |
| `game/raid/online/sharedRoom.ts` | La sala del servidor: asientos de jugadores, echar a un bot, ponerse al día (`catchUp`) y la vista de cada jugador |
| `game/raid/online/roomServer.ts` | Las acciones del servidor: elegir sala (`pickRoom`), entrar y ponerse al día; caducidad |
| `game/raid/online/requests.ts` | Validación de lo que llega al servidor y limpieza del apodo |
| `net/raidSync.ts` | Bucle que entra, consulta y avisa de las salas dejadas; cada cuánto se consulta |
| `game/raid/online/skipAhead.ts` | Resumir de golpe lo que una sala lleva sin consultar (el Worker tiene poca CPU por petición) |
| `game/core/accountRules.ts` | Lo que comparten web y servidor de cuentas: email, contraseña, códigos de error |
| `game/core/cloudSave.ts` | Partida en la nube: qué hacer al conectar (`cloudAction`), recuperar una copia (`stateFromSaved`), resumen y validar la subida |
| `net/account.ts` | Cuenta opcional: sesión, enlaces de los correos, entrar, crearla, recuperar la contraseña (`/api/auth`) |
| `net/cloudSync.ts` | Subir y bajar la partida de la cuenta; conflictos entre dispositivos |

## Store y acciones

- `core/store.ts` guarda un único `GameState`. `useGame()` lo expone a React con `useSyncExternalStore`.
- Toda modificación pasa por `act((draft) => ...)`. `act` clona el estado, aplica la receta, notifica a la
  UI y programa un guardado (con debounce y también en `pagehide`/`visibilitychange`).
- Las funciones de `game/` **mutan el borrador que reciben** (`s: GameState`) y nunca importan el store.
  Así se pueden testear sin navegador:

```ts
const s = initialState()
chooseStarter(s, POKEMON.Bulbasaur) // atajo de core/test-utils.ts: da el inicial y salta el tutorial
startRun(s, RouteId.PuebloPaleta)
```

## Aleatoriedad

Toda función con azar acepta `rng: Rng = Math.random` como último parámetro (`Rng` está en `game/core/random.ts`).
En los tests se pasa un rng determinista. Una función nueva con azar **debe** seguir este patrón.

## Guardado y versiones

- `SAVE_VERSION` (en `core/state.ts`) se compara al cargar; si no coincide, se empieza partida nueva.
- Si coincide, `restoreState` rellena con su valor inicial los campos que falten en la partida guardada.
- Cualquier cambio en la forma de `GameState`, `OwnedMon`, `Run` o `Expedition` obliga a subir la versión.
- **El equipo se conserva entre versiones** (provisional, mientras la partida viva en el navegador). Cada guardado
  escribe también `pokerancho-team`: especie, nivel, EXP, estrellas y rancho (o Caja) de cada Pokémon y cuál es el activo, con un
  formato propio (`TEAM_BACKUP_FORMAT`) que no depende de `SAVE_VERSION`. Si la partida es de otra versión, se
  empieza una nueva y `restoreTeam` rehace el equipo (PS al máximo, capturados y sin tutorial); dinero, piezas,
  rutas y lo demás empiezan de cero. Reiniciar desde ⚙️ guarda la copia vacía y se empieza de verdad desde el
  tutorial.
- Si cambia la forma de `TeamBackup`, sube `TEAM_BACKUP_FORMAT` y haz que `parseTeamBackup` siga leyendo el
  formato anterior: es lo único que debe sobrevivir a cualquier actualización. Excepción: el formato 1 (sin
  ranchos ni Caja) se descartó a propósito con `SAVE_VERSION` 16, y esas partidas empiezan de cero.
- Con servidor y base de datos, la copia del equipo desaparece: la partida completa vivirá allí.

## Bucle de tiempo

`App.tsx` llama a `tick(s, Date.now())` (`core/tick.ts`) cada 250 ms. `tick` calcula el tiempo transcurrido (máx. 12 h para el
progreso offline), lo multiplica por `timeScale` (x1 en producción; el botón ⏱ para cambiarlo solo existe en `npm run dev`) y:

1. avanza la run en curso (`advanceRun`) con el tiempo real: si hay combate lo gasta en él y si no lo convierte
   en pasos (con `timeScale`). Puede cruzar varias paradas y combates de una vez;
2. avanza las expediciones (`advanceExpeditions`);
3. regenera PS de los Pokémon que están en el rancho (`restInRanch`).

## Ciclo de una run

```
RouteStartDialog (camino principal, pathFrom) → startRun(routeId, path) → 'walking'
  → (pasos) → llegada a parada → startStopBattle: combate simulado → lastBattle, battleMsLeft
      → (pasa battleMsLeft; no hay pasos) → settleBattle aplica PS y premio
          → derrota: 'fainted'
          → última parada: completeRoute → 'complete'
          → si no: sigue 'walking'
  → endRun (al volver al rancho o abandonando)
```

El motor **nunca espera a la UI**: el combate se resuelve entero al llegar (`simulateBattle` devuelve la lista
de eventos) y dura un tiempo fijo (`battleDuration`: `BATTLE_EVENT_MS` por evento + `BATTLE_END_MS`). Mientras
`run.battleMsLeft > 0` no se dan pasos; al llegar a 0 se aplica el resultado, así el estado no se adelanta a lo
que se ve. Tocar la escena (`tapRun`) adelanta el combate un evento. `RunView` solo calcula qué evento toca
mostrar a partir de `battleMsLeft` (`ui/route/battleFrame.ts`) y `RouteBattle` lo pinta sobre la escena. Con la app
cerrada el tiempo de los combates se consume igual y no se reproducen.

## Expediciones

`sendExpedition` guarda `{ uid, routeId, durationMin, elapsedMin }`. El tiempo avanza en `tick` y, al terminar,
`collectExpedition` simula los combates de forma resumida (probabilidad de victoria, sin turnos) y entrega el
premio. Un Pokémon en ruta, de expedición o en la Caja no se puede gestionar en el rancho (`monPlace`); los dos
primeros siguen ocupando su hueco en su rancho (`OwnedMon.ranch`).

## Jefes comunitarios

Hay dos clases de sala (`Raid`), con la misma mecánica (`raidEngine.ts`): `advanceRoom` consume el tiempo de juego
en rondas fijas (`RAID_ROUND_MS`): pasa el tiempo (presencia y revivir), entran y salen bots según su `BotPolicy`, el
Pokémon del jugador gana su EXP y se juega la ronda (`playRound`). `lastRound` guarda los golpes de la última ronda
para que la UI los pinte: `ui/raid/roundReplay.ts` los reparte en orden a lo largo de la ronda siguiente (con
`roundMsLeft`), así la pelea se ve por turnos aunque el motor la juegue de golpe. Al caer el jefe, `settleFall` tira el premio de cada Pokémon del jugador que cobra, los saca
de la sala y devuelve los premios: cada clase de sala decide qué hace con ellos.

- **Pestaña Raids** (`GameState.raid`, `place: null`): aparece al acabar el tutorial (`ensureRaid`) y siempre hay
  uno. Se manda a un Pokémon del rancho; al caer, el premio queda pendiente en `GameState.raidPrizes` (se recoge en
  la pestaña) y sale el siguiente de `RAID_BOSSES` con los bots que siguen dentro.
- **Paradas de ruta** (`NodeKind.Raid`, `Run.raid`, `place` = ruta y parada): al llegar el Pokémon de la ruta
  (`arrive` → `enterRouteRaid`), entra en una sala; mientras no haya servidor, a veces se simula que ya había una en
  marcha (con el jefe por encima de `ROUTE_RAID_JOIN_MIN_HP`). La ruta pasa a la fase `raid` y no avanza hasta que
  cae el jefe o se retira (`retreatRouteRaid`, derrota sin su premio). Al caer, su premio se suma a lo ganado en la
  ruta (`Run.earned`, con el jefe en `raidBosses` para el resumen) y la ruta sigue o se completa. Nunca pasa por
  `raidPrizes`: son cosas separadas. En pantalla no se cambia de vista: `RunView` pinta `RaidBattle` dentro de su
  `WalkScene` (sin el Pokémon que camina, que va en el grupo) y su marcador añade `RouteRaidHud`.

Los participantes son `RaidMember` con `kind: 'player' | 'guest' | 'bot'`: `player` son los del jugador de este
dispositivo, `guest` los de otros jugadores (solo en salas compartidas). Los que se van se quedan en la lista con
`left: true` hasta que cae el jefe, para el reparto.

### Salas compartidas (servidor)

Paso a paso del despliegue y del consumo del plan gratuito: [servidor.md](servidor.md).

- **El servidor manda.** `worker/raid.ts` (`POST /api/raid`) guarda cada sala en D1 (`SharedRoom`: la `Raid` de
  siempre más los asientos de cada jugador) y, en cada petición, la juega hasta la hora real con el mismo motor
  (`catchUp` → `advanceRoom` / `advanceStopRoom`), con bots de servidor. Nadie la juega entre peticiones: con todos
  los jugadores con la app cerrada, se pone al día (hasta 12 h) en la siguiente consulta. Como el Worker gratuito
  tiene 10 ms de CPU por petición, solo se juegan de verdad las últimas `ROOM_PLAYED_ROUNDS` rondas; lo anterior se
  resume con el ritmo de la sala (`skipAhead`, con `roomPace` de `raidEstimate.ts`).
- **Sin cuentas.** Cada dispositivo tiene un id anónimo y un apodo (`net/identity.ts`, en `localStorage` aparte de
  la partida). Cada uno ve la sala con sus Pokémon por su uid y los demás como `guest` (`viewFor`).
- **Entrar** (`joinRoom`): la sala de ese jefe en la que ya estuvo el jugador; si no, la que tenga más jugadores;
  si está llena, sale un bot para hacerle sitio. Las salas solo de bots, caídas, llenas de jugadores o (en parada)
  con el jefe por debajo de `ROUTE_RAID_JOIN_MIN_HP` no se ofrecen. Si no vale ninguna, sala nueva (en parada, en
  marcha con la vida que pide el cliente, `bossHp`).
- **En la partida** (`online/linkedRoom.ts`): `joinRaid` y `enterRouteRaid` dejan la sala esperando sitio
  (`Raid.remote.roomId` null) y se sigue jugando en local. `net/raidSync.ts` pide entrar; con la respuesta la sala
  local pasa a ser el reflejo de la del servidor (`applyView`) y `tick` ya no la juega (solo corre su reloj para la
  animación). Cada consulta manda el Pokémon que el jugador quiere dentro (o ninguno, para retirarse) y su nivel; la
  respuesta trae la sala y las rondas de EXP contadas, y lo que pase se resuelve con las mismas funciones que en
  local (`fallTabRaid`, `finishRouteRaid`, `startOver`). Retirarse de una parada deja el id en
  `GameState.roomsToLeave` hasta que el servidor lo sabe.
- **Sin servidor** (`npm run dev`, sin red): si la petición de entrar falla, la sala sigue en local
  como antes, con bots locales. Si una sala enlazada deja de responder se reintenta; si el servidor ya no la tiene,
  sigue en local.
- **Concurrencia**: cada sala lleva una versión; la escritura es `UPDATE … WHERE version = <la leída>` y, si otro
  jugador escribió antes, no cambia nada y se repite la petición entera (hasta 5 veces).

## Cuentas y partida en la nube

Opcionales, con email y contraseña, en el propio Worker (`worker/auth/`, tablas `users`, `sessions` y
`auth_tokens`). Paso a paso de Brevo y del despliegue: [servidor.md](servidor.md).

- **Contraseñas** con PBKDF2-SHA256 (`worker/auth/crypto.ts`); cada hash guarda sus iteraciones. Tras 10 fallos
  seguidos la cuenta se bloquea 15 min.
- **Sesión** en una cookie `HttpOnly` (`pkr_session`, solo para `/api`) con un token al azar; en la base de datos
  solo está su hash. Todas las peticiones que cambian algo comprueban que vienen de la propia web (`sameOrigin`).
- **Correos** con Brevo (`worker/mail.ts`): confirmar la cuenta (48 h) y recuperar la contraseña (1 h). El enlace
  lleva a la web con el token tras el `#` (`#confirm=…`, `#reset=…`); `net/account.ts` lo manda a la API al abrir
  la app y lo quita de la dirección. Sin confirmar no se puede entrar. Como mucho un correo por minuto y cuenta.
- **Una partida por cuenta** (tabla `saves`): `CloudSave` = la partida, la copia del equipo (por si es de otra
  `SAVE_VERSION`) y una revisión. Se sube encima de la revisión que el dispositivo vio por última vez (`CloudLink`, en
  `localStorage` aparte de la partida) con `UPDATE … WHERE revision = <base>`; si en la nube hay otra más nueva, el
  servidor responde 409 con ella y el dispositivo la carga (`replaceState`): gana la última subida.
- **Al conectar** (`cloudAction`): sin copia, se sube; si la de aquí ya es de la cuenta, se baja si hay revisión nueva
  y si no se sube; si no, se pregunta cuál conservar (salvo que la de aquí esté sin empezar).
- **Raids**: con sesión, el id de jugador es el de la cuenta (`setAccountId`), así los asientos son los mismos en
  cualquier dispositivo; al cambiar de id, `raidSync` saca de las salas los asientos del anterior. El apodo se guarda
  también en la cuenta.

## Notificaciones

`ui/settings/notifications.ts` avisa con una notificación del sistema cuando termina una expedición, **solo si la app está
en segundo plano** (`document.hidden`); con la app delante basta el aviso de la pestaña Ruta. No hay servidor: con
la app cerrada del todo no se ejecuta nada y no llega el aviso.

- Se activa en el menú ⚙️ del rancho, que pide permiso al navegador. La preferencia se guarda en `localStorage`
  aparte de la partida (`pokerancho-notify`), porque el permiso es del dispositivo.
- Se muestran con `registration.showNotification` (obligatorio en Android); sin service worker, como en
  `npm run dev`, se usa `new Notification`.
- `public/sw-notifications.js` se importa en el service worker de Workbox y abre o trae al frente la app al tocar
  la notificación.
- Requisitos del navegador: contexto seguro (HTTPS o `localhost`; no funciona por `http://192.168.x.x`) y, en iOS,
  la PWA instalada en la pantalla de inicio (iOS 16.4+).
