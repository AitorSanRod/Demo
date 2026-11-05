# Arquitectura

## Capas

```
src/data/   Datos estáticos y consultas sobre ellos. No conoce el estado de la partida.
src/game/   Reglas del juego. Funciones puras sobre GameState. Sin React, sin DOM (salvo core/store.ts).
src/net/    Conexión con el servidor: salas compartidas, cuenta opcional y partida en la nube.
src/ui/     Componentes React. Leen GameState y disparan acciones con act().
worker/     Servidor: Worker de Cloudflare con base de datos D1 (API /api/*). La lógica del juego es la de src/game.
migrations/ Esquema de la base de datos D1, un fichero por cambio.
scripts/    Utilidades de desarrollo (regenerar pokemon.json, iconos PWA, capturas de los tutoriales). No se empaquetan.
```

Regla de dependencias: `ui → net → game → data` y `worker → game → data`. Nunca al revés. `data` no importa de
`game`; `game` no importa de `net` ni de `ui`. `src/game` y `src/data` se ejecutan también en el servidor: nada de
DOM ni de `import` de imágenes en ellos (las imágenes de los mapas van con `asset(new URL(…, import.meta.url))`).

## Estructura

```
src/
  main.tsx            Arranque: estilos base, service worker (net/appUpdate.ts) y <App> dentro del ErrorBoundary
  App.tsx             Bucle de tiempo, menú inferior y pantalla de cada pestaña
  index.css           Entrada de los estilos base (src/styles/: variables, estructura y piezas comunes)
  assets/             Imágenes propias (fondo del rancho)
  data/               species, pokemon (ids por nombre), pokedexes (regionales y Nacional), types, moves,
                      evolutions, stones + pokemon.json
    maps/             kantoMaps (una por región), mapCommon, index (regiones y route)
  game/
    core/             state (GameState, SAVE_VERSION), store (useGame, act, guardado), saveMigration, teamBackup, random, tick,
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
                      raidCycle + tabRooms (el jefe de la pestaña Raids por ciclos), skipAhead (resumir salas
                      viejas), requests (validar lo que le llega)
  net/                identity (id de jugador y apodo), raidApi (fetch a /api/raid), raidSync (bucle de consultas),
                      raidFeed (la pestaña Raids según el servidor),
                      account (cuenta: /api/auth), cloudSync (partida en la nube), dailyGift (obsequio diario),
                      push (notificaciones)
  ui/
    shared/           Sprite, ItemIcon e icons (iconos con objetos de PokeAPI) y piezas comunes, pantallas superpuestas (premios, aparición, confirmación),
                      barra superior, bocadillos del tutorial, ErrorBoundary
      sheet/          Ficha del Pokémon (PokemonSheet): un solo componente que abren rancho y Pokédex, con sus
                      secciones (MonOverview = Datos, CareSection, TicketsSection, EvolvePanel, MovePanel)
                      y la animación de aparición/evolución
    starter/          Elección del inicial (primer paso del tutorial)
    account/          Cuenta: entrar, crearla, recuperar la contraseña (AccountDialog), elegir partida y avisos (AccountHost)
    gift/             Obsequio diario (DailyGiftSheet), que se abre desde el menú del rancho (ranch/RanchMenu)
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
  raid.ts             POST /api/raid: salas de ruta y ponerse al día (lee de D1, llama a game/raid/online y guarda)
  raidTab.ts          La pestaña Raids: su ciclo (tabla raid_cycle), entrar y la acción feed
  save.ts             GET / POST /api/save: la partida de la cuenta con sesión
  gift.ts             GET / POST /api/gift: el obsequio diario de la cuenta con sesión
  push/               Notificaciones: routes (/api/push/*), webPush (VAPID y cifrado), store (D1), notify, send
  scheduled.ts        Tarea programada de cada minuto: raids sin nadie mirando y avisos que tocan
  auth/               Cuentas: routes (rutas), credentials (crear y entrar), links (correos: confirmar y recuperar),
                      session (cookie), crypto (PBKDF2 y tokens)
  db/                 Consultas a D1: rooms, cycle, saves, gifts, users (cuentas, sesiones y enlaces)
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
| `game/core/saveMigration.ts` | Migrar una partida de otra versión sin perder nada: pasos de `SAVE_MIGRATIONS` y rescate campo a campo |
| `game/core/teamBackup.ts` | Copia del equipo (y de sus expediciones en curso): red de seguridad si la partida guardada no se puede leer |
| `game/core/random.ts` | Tipo `Rng` y utilidades de azar (`seededRng`: secuencia fija a partir de una semilla) |
| `game/core/tick.ts` | `tick`: avance del tiempo (ruta, expediciones y descanso) |
| `game/battle/battle.ts` | Simulación de combate automático |
| `game/battle/rewards.ts` | Dinero, tickets y piezas por victoria |
| `game/run/run.ts` | Ruta del Pokémon activo: salida, avance por tiempo, pasos y toques |
| `game/run/runBattle.ts` | Combates de la ruta: se resuelven al llegar y se aplican al acabar su tiempo; premio final |
| `game/run/runHeal.ts` | Paradas de curación: al llegar se usa la poción y el Pokémon se para `HEAL_STOP_MS` |
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
| `game/raid/routeRaidStreak.ts` | Racha de victorias seguidas contra el jefe de cada parada: rebaja su dinero y se olvida a los 5 min |
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
| `game/raid/online/raidCycle.ts` | El jefe de la pestaña Raids por ciclos: cuándo se cierra, cuándo pasa al siguiente (con tope), qué sala va al frontal |
| `game/raid/online/tabRooms.ts` | Las salas de la pestaña Raids en el servidor: ponerlas al día con su ciclo, sala principal, entrar y la respuesta `feed` |
| `net/raidFeed.ts` | La pestaña Raids según el servidor: jefe, frontal, lista de salas y hora del servidor |
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

- `SAVE_VERSION` (en `core/state.ts`) se compara al cargar (`cloudSave.ts › stateFromSaved`, también para la
  partida de la nube). Si coincide, `restoreState` rellena con su valor inicial los campos que falten.
- **Si no coincide, la partida se migra y no se pierde nada** (`core/saveMigration.ts › migrateSave`): primero los
  pasos de `SAVE_MIGRATIONS` (de cada versión a la siguiente, solo para campos que cambian de nombre o de
  significado) y después un rescate campo a campo: dinero, tickets, trozos, Pokédex (vistos, capturados, favoritos),
  piezas, compras (mejoras, tipos de rancho, piedras), rutas desbloqueadas y completadas, equipo, expediciones,
  premios pendientes, rachas… Cada campo con regla propia (`RULES`) se valida a fondo (una especie, ruta o piedra que
  ya no existe se descarta); los demás se conservan si tienen la misma forma que el inicial, y los nuevos toman su
  valor inicial. Al final se arreglan las relaciones (`linkUp`: Pokémon sin repetir, activo y expediciones de
  Pokémon que existen, capturados como vistos, rutas completadas como desbloqueadas, ranchos comprados). Solo se
  descarta lo que está a medias (`IN_PROGRESS`: la ruta y la sala de raid en curso; el Pokémon vuelve al rancho).
- En las dos cargas se abren las rutas que desbloquean las ya completadas (`run/routeUnlocks.ts ›
  unlockReachedRoutes`): una ruta añadida al final del mapa aparece abierta para quien ya completó la anterior.
- Cualquier cambio en la forma de `GameState`, `OwnedMon`, `Run` o `Expedition` obliga a subir la versión. Si un
  campo cambia de nombre o de significado, se añade su paso en `SAVE_MIGRATIONS` con su test.
- **Red de seguridad**: cada guardado escribe también `pokerancho-team` (`teamBackup.ts`: los Pokémon, el activo,
  sus expediciones y la hora). Solo se usa si la partida guardada no se puede leer o se ha quedado sin Pokémon.
  Reiniciar desde ⚙️ guarda la copia vacía y se empieza de verdad desde el tutorial. Lo que se le añada a
  `TeamBackup` va opcional para que las copias ya guardadas sigan valiendo.

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
  → (pasos) → llegada a parada de curación → drinkStopPotion: cura → Run.heal (se para heal.msLeft; si es la última, completeRoute)
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
- **Pestaña Raids por ciclos** (`raidCycle.ts`, `tabRooms.ts`, `worker/raidTab.ts`, tabla `raid_cycle`): el jefe lo
  decide el servidor, igual para todos; los móviles no simulan nada de la pestaña (`GameState.raidServer`) salvo su
  propia sala. En cada ciclo hay un jefe (`raidBossAt(número)`), una sala principal (con bots, aunque no juegue nadie)
  y las que se abran al llenarse. Cuando cae en la primera sala, el ciclo se cierra: empieza la espera
  (`CYCLE_COOLDOWN_MS`), ya no se abren salas (solo se puede entrar en las que aún pelean con jugadores) y el frontal
  pasa a ellas. El siguiente aparece cuando ha pasado la espera y no queda ninguna sala con jugadores en pie, o al
  llegar al tope (`CYCLE_MAX_EXTRA_MS`): entonces el jefe se escapa de las que quedaban (`closed`, sin premio). Cada
  petición pone al día como mucho `ROOMS_PER_REQUEST` salas (las pedidas y la pendiente más vieja).
- **Frontal y lista** (acción `feed`, `net/raidFeed.ts`): el servidor devuelve el jefe del ciclo, la sala del frontal
  (la que el jugador eligió mirar; si no, la de más jugadores; si no, la principal), las salas del jefe y las de las
  paradas de ruta con jugadores (columnas `players` y `summary` de `rooms`), y su hora, con la que se cuentan las
  esperas. La UI enseña la sala propia si la hay (`GameState.raid`) y, si no, la del frontal; entrar desde ahí
  (`joinServerRaid`) pide esa sala (`targetRoomId`). Al caer el jefe, el siguiente no se crea en el móvil.
- **Entrar en una parada** (`joinStopRoom`): la sala de ese jefe en la que ya estuvo el jugador; si no, la que tenga
  más jugadores; si está llena, sale un bot para hacerle sitio. Las salas solo de bots, caídas, llenas de jugadores o
  con el jefe por debajo de `ROUTE_RAID_JOIN_MIN_HP` no se ofrecen. Si no vale ninguna, sala nueva (en marcha con la
  vida que pide el cliente, `bossHp`).
- **En la partida** (`online/linkedRoom.ts`): `joinRaid` y `enterRouteRaid` dejan la sala esperando sitio
  (`Raid.remote.roomId` null, `isSearching`): la de la pestaña se sigue jugando en local; la de una parada se queda
  quieta, sin bots, y la ruta muestra «Buscando entrenadores…» (`RaidSearching`) hasta que el servidor contesta, para
  entrar antes en una sala con jugadores que en una de bots. Esa espera solo vale con la app delante: si un avance
  salta más de `ROUTE_RAID_SEARCH_MS` (la app estaba cerrada u oculta y nadie pidió sitio), la sala se juega en local
  y, al caer el jefe, el tiempo que sobra sigue la ruta (`advanceRun` lleva también la pelea de la parada).
  `net/raidSync.ts` pide entrar (también con la app oculta; las demás consultas, solo delante); con la respuesta la sala
  local pasa a ser el reflejo de la del servidor (`applyView`) y `tick` ya no la juega (solo corre su reloj para la
  animación). Cada consulta manda el Pokémon que el jugador quiere dentro (o ninguno, para retirarse) y su nivel; la
  respuesta trae la sala y las rondas de EXP contadas, y lo que pase se resuelve con las mismas funciones que en
  local (`fallTabRaid`, `finishRouteRaid`, `startOver`). Retirarse de una parada deja el id en
  `GameState.roomsToLeave` hasta que el servidor lo sabe.
- **Sin servidor** (`npm run dev`, sin red): si la petición de entrar falla, la sala sigue en local
  como antes, con bots locales. Si una sala enlazada deja de responder se reintenta; si el servidor ya no la tiene,
  sigue en local.
- **Limpieza de las paradas**: al consultar una sala de parada terminada (jefe caído o escapado), el jugador ve cómo
  acabó y sale (`syncRoom`); cuando ya no queda nadie dentro (`isSettled`), la sala se borra en vez de guardarse. La
  tarea programada borra además las salas de parada sin jugadores que nadie ha tocado en `ROOM_MAX_CATCHUP_MS`
  (`deleteIdleStopRooms`). Así la lista «Salas › Ruta» solo enseña peleas en curso con jugadores.
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
- **Obsequio diario** (`game/collection/dailyGift.ts`, `worker/gift.ts`, tabla `daily_gifts`): por cuenta, en el
  servidor, para que no se recoja dos veces desde dos móviles. Se guarda cuántos lleva y cuándo fue el último; recoger
  es una sola consulta (`INSERT … ON CONFLICT DO UPDATE … WHERE last_claim_at <= ahora − 24 h RETURNING`). El cliente
  (`net/dailyGift.ts`) suma el obsequio a la partida (`applyGift`) y la sube enseguida a la nube.
- **Raids**: con sesión, el id de jugador es el de la cuenta (`setAccountId`), así los asientos son los mismos en
  cualquier dispositivo; al cambiar de id, `raidSync` saca de las salas los asientos del anterior. El apodo se guarda
  también en la cuenta.

## Notificaciones

Push estándar (Web Push) desde el Worker: llegan aunque la app esté cerrada. Cada aviso es de un tema
(`PushTopic`: expedición, ruta, obsequio, raids) que el jugador activa por separado en Ajustes › Notificaciones
(`ui/settings/NotificationsDialog.tsx`), con un botón para todos.

- **Suscripción** (`net/push.ts`): con permiso, el navegador se suscribe con la clave pública VAPID del servidor
  (`GET /api/push/key`) y la suscripción se guarda en D1 (`push_subscriptions`) con sus temas, el id de jugador de las
  raids y la cuenta si la hay. Va por dispositivo; la preferencia, en `localStorage` (`pokerancho-push`).
- **Avisos que programa el móvil** (`game/core/pushPlan.ts`): la vuelta de cada expedición (hora exacta) y el fin de
  la ruta (`predictRunEnd`: simula la partida hacia delante sobre una copia con `tick`; es una estimación). Se mandan
  al servidor al pasar la app a segundo plano (`POST /api/push/jobs`) y se vacían al volver.
- **Avisos que decide el servidor**: el obsequio (al recogerlo se programa el siguiente, `push/notify.ts`) y las
  raids (`game/raid/online/raidPushes.ts`: cae un jefe con el jugador dentro, se escapa, aparece el siguiente), al
  ver lo que pasa en las salas (`updateCycle` devuelve `pushes`). Al jugador de la petición no se le avisa.
- **Envío** (`worker/push/`): la tarea programada (`worker/scheduled.ts`, cron cada minuto) pone al día las raids sin
  nadie mirando y manda como mucho `SENDS_PER_RUN` avisos que ya tocan (`push_jobs`), firmados con VAPID y
  cifrados para cada navegador (`webPush.ts`, RFC 8292 y 8291, con la Web Crypto del Worker). Si el servicio de push
  responde 404/410, la suscripción se borra.
- **Versiones nuevas** (`net/appUpdate.ts`): el service worker va con `registerType: 'prompt'`. La versión nueva se
  descarga y espera; `UpdatePrompt` avisa para recargar («Más tarde» lo vuelve a enseñar al volver a la app). Con la
  app abierta se mira si hay versión nueva cada `UPDATE_CHECK_MS` y al volver a ella.
- `public/sw-notifications.js` se importa en el service worker de Workbox: enseña el aviso y, al tocarlo, abre o trae
  al frente la app. Requisitos: HTTPS (o `localhost`) y, en iOS, la app instalada en la pantalla de inicio (16.4+).

