# Arquitectura

## Capas

```
src/data/   Datos estáticos y consultas sobre ellos. No conoce el estado de la partida.
src/game/   Reglas del juego. Funciones puras sobre GameState. Sin React, sin DOM (salvo core/store.ts).
src/ui/     Componentes React. Leen GameState y disparan acciones con act().
scripts/    Utilidades de desarrollo (regenerar pokemon.json, iconos PWA). No se empaquetan.
```

Regla de dependencias: `ui → game → data`. Nunca al revés. `data` no importa de `game`; `game` no importa de `ui`.

## Estructura

```
src/
  main.tsx            Arranque: estilos base, service worker y <App> dentro del ErrorBoundary
  App.tsx             Bucle de tiempo, menú inferior y pantalla de cada pestaña
  index.css           Entrada de los estilos base (src/styles/: variables, estructura y piezas comunes)
  assets/             Imágenes propias (fondo del rancho)
  data/               species, types, moves, maps + pokemon.json
  game/
    core/             state (GameState, SAVE_VERSION), store (useGame, act, guardado), random, tick, test-utils
    battle/           battle (simulación por turnos), rewards (₽, tickets y piezas por victoria)
    run/              run (salida, avance por tiempo, toques), runBattle (combates de la ruta y premio final)
    team/             mons (alta), stats, ranch, expedition, upgrades, tutorial
    collection/       dex (vistos, capturados, favoritos), pieces, gacha, shredder
  ui/
    shared/           Sprite y piezas comunes, pantallas superpuestas (premios, aparición, confirmación),
                      barra superior, bocadillos del tutorial, ErrorBoundary
    starter/          Elección del inicial (primer paso del tutorial)
    ranch/            Rancho y ficha del Pokémon
    settings/         Menú ⚙️ y notificaciones
    route/            Pestaña Ruta: mapa, planificador, ruta en curso, combate, escena (scenery/ por bioma)
    expeditions/      Enviar, seguir y recoger expediciones
    gacha/            Tiradas, apertura de la Pokéball, trituradora y tienda de MissingNo
    dex/              Pokédex y combinación de piezas
    shop/             Mejoras
```

Cada pantalla tiene su CSS en su carpeta y lo importa su componente (`RanchScreen.tsx` → `ranch.css`). Los
estilos base se cargan antes (`main.tsx`), así los de cada pantalla pueden pisarlos.

| Módulo | Responsabilidad |
|---|---|
| `data/species.ts` | Especies (desde `pokemon.json`, reducidas a 4 stats), rarezas, sprites, iniciales |
| `data/types.ts` | Tipos y tabla de eficacias |
| `data/moves.ts` | Un movimiento de daño por tipo y rareza; `signatureMove` da el de cada especie |
| `data/maps.ts` | Mapas, rutas, nodos, encuentros y consultas de caminos (`pathFrom`, `isValidPath`) |
| `game/core/state.ts` | Tipos de `GameState`, estado inicial, `SAVE_VERSION`, `restoreState` y dónde está cada Pokémon (`monPlace`) |
| `game/core/store.ts` | Estado global, guardado en `localStorage` y hook `useGame()` |
| `game/core/random.ts` | Tipo `Rng` y utilidades de azar |
| `game/core/tick.ts` | `tick`: avance del tiempo (ruta, expediciones y descanso) |
| `game/battle/battle.ts` | Simulación de combate automático |
| `game/battle/rewards.ts` | Dinero, tickets y piezas por victoria |
| `game/run/run.ts` | Ruta del Pokémon activo: salida, avance por tiempo, pasos y toques |
| `game/run/runBattle.ts` | Combates de la ruta: se resuelven al llegar y se aplican al acabar su tiempo; premio final |
| `game/team/mons.ts` | Alta de un Pokémon (`createMon`) |
| `game/team/stats.ts` | Fórmulas de stats, EXP y velocidad de paso |
| `game/team/ranch.ts` | Acciones del rancho y descanso |
| `game/team/expedition.ts` | Expediciones por tiempo |
| `game/team/upgrades.ts` | Mejoras de la pestaña Tienda (precios por nivel y compra) |
| `game/team/tutorial.ts` | Elección del inicial (da sus piezas) y pasos del tutorial; `combine` y `startRun` lo avanzan |
| `game/collection/dex.ts` | Vistos, capturados y favoritos |
| `game/collection/pieces.ts` | Piezas por especie y combinación (desbloqueo, ★ o ₽) |
| `game/collection/gacha.ts` | Tiradas (piezas) y compra de tickets |
| `game/collection/shredder.ts` | Trituradora (piezas → trozos de MissingNo) y compra de piezas con trozos |

## Store y acciones

- `core/store.ts` guarda un único `GameState`. `useGame()` lo expone a React con `useSyncExternalStore`.
- Toda modificación pasa por `act((draft) => ...)`. `act` clona el estado, aplica la receta, notifica a la
  UI y programa un guardado (con debounce y también en `pagehide`/`visibilitychange`).
- Las funciones de `game/` **mutan el borrador que reciben** (`s: GameState`) y nunca importan el store.
  Así se pueden testear sin navegador:

```ts
const s = initialState()
chooseStarter(s, 1) // atajo de core/test-utils.ts: da el inicial y salta el tutorial
startRun(s, 'pueblo-paleta')
```

## Aleatoriedad

Toda función con azar acepta `rng: Rng = Math.random` como último parámetro (`Rng` está en `game/core/random.ts`).
En los tests se pasa un rng determinista. Una función nueva con azar **debe** seguir este patrón.

## Guardado y versiones

- `SAVE_VERSION` (en `core/state.ts`) se compara al cargar; si no coincide, se empieza partida nueva.
- Si coincide, `restoreState` rellena con su valor inicial los campos que falten en la partida guardada.
- Cualquier cambio en la forma de `GameState`, `OwnedMon`, `Run` o `Expedition` obliga a subir la versión.
- Si en el futuro se quiere conservar partidas, añade una función `migrate(old)` en `core/state.ts` en lugar de
  descartarlas.

## Bucle de tiempo

`App.tsx` llama a `tick(s, Date.now())` (`core/tick.ts`) cada 250 ms. `tick` calcula el tiempo transcurrido (máx. 12 h para el
progreso offline), lo multiplica por `timeScale` (x1 en producción; el botón ⏱ para cambiarlo solo existe en `npm run dev`) y:

1. avanza la run en curso (`advanceRun`) con el tiempo real: si hay combate lo gasta en él y si no lo convierte
   en pasos (con `timeScale`). Puede cruzar varias paradas y combates de una vez;
2. avanza las expediciones (`advanceExpeditions`);
3. regenera PS de los Pokémon que están en el rancho (`restInRanch`).

## Ciclo de una run

```
RoutePlanner elige el camino → startRun(routeId, path) → 'walking'
  → (pasos) → llegada a parada → startWildBattle: combate simulado → lastBattle, battleMsLeft
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
premio. Un Pokémon en ruta o de expedición no se puede gestionar en el rancho (`monPlace`).

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
