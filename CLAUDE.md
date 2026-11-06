# Pokérancho

Juego idle tipo digivice: el jugador elige el camino antes de salir y su Pokémon recorre la ruta y combate solo.
En el rancho ve a todo su equipo, cura, entrena y elige compañero; manda al resto de expedición y consigue
Pokémon nuevos juntando piezas del gacha. PWA para móvil en vertical.

Stack: Vite 8 + React 19 + TypeScript 7 + Vitest. La partida se guarda en `localStorage`; por servidor (un Worker de
Cloudflare con D1, `worker/`) van las salas de los jefes comunitarios y, con cuenta opcional (email y contraseña,
correos con Brevo), la partida en la nube. Sin servidor se juega todo en local.

## Comandos

```bash
npm run dev        # servidor de desarrollo
npm run check      # typecheck + lint + tests (lo que debe pasar antes de dar algo por terminado)
npm test           # solo tests (vitest run)
npm run build      # build de producción
npm run preview    # build + Worker de Cloudflare en local (http://localhost:8787; antes: npm run db:migrate:local)
npm run deploy     # publicar a mano (normalmente despliega Cloudflare solo con cada push)
```

Requiere Node `>=22.13` (ver `.nvmrc`): los tests del Worker usan `node:sqlite`, y con versiones anteriores npm
tampoco instala los binarios nativos de Vite/oxlint.

## Arquitectura en una línea

`src/data` (datos estáticos) → `src/game` (lógica pura, sin React ni DOM) → `src/net` (conexión con el servidor) →
`src/ui` (pantallas React); `worker/` (servidor) usa `src/game` y `src/data`. Las dependencias solo van en ese
sentido. `src/game` y `src/data` corren también en el servidor: nada de DOM ni de `import` de imágenes. `src/game` se agrupa por dominio (`core`, `battle`, `run`, `team`,
`collection`) y `src/ui` por pantalla, cada una con su CSS. Detalle en [docs/arquitectura.md](docs/arquitectura.md).

## Cómo orientarse sin leer todo el programa

Este mapa basta para empezar: **no explores el proyecto entero**. Abre solo los ficheros de la fila que toque y
localiza lo demás con `Grep` por el nombre del símbolo. `docs/` se consulta cuando hace falta, no por sistema.
Cada `.ts` de `src/game` tiene su `.test.ts` al lado; las pantallas, su CSS en la misma carpeta.

| Quiero cambiar… | Dónde (`src/`) |
|---|---|
| Rutas, paradas, encuentros, jefes, premio de ruta, imagen de la lista (`backdrop`, con `asset(new URL(…))`) | `data/maps/kantoMaps.ts` (un fichero por región) |
| Tipos de parada y biomas, ids de ruta, atajos y consultas de caminos | `data/maps/mapCommon.ts` |
| Lista de regiones y `route(id)` | `data/maps/index.ts` |
| Especies, rarezas, iniciales, evoluciones | `data/species.ts`, `data/evolutions.ts` |
| Ataques, tipos y eficacias | `data/moves.ts`, `data/types.ts` |
| Forma de la partida, estado inicial, `SAVE_VERSION` | `game/core/state.ts` |
| Guardado, migrar partidas de otra versión y copia del equipo | `game/core/store.ts`, `game/core/saveMigration.ts`, `game/core/teamBackup.ts` |
| Paso del tiempo | `game/core/tick.ts`, `App.tsx` |
| Combate (turnos, daño) y sus premios | `game/battle/battle.ts`, `attack.ts`, `status.ts`, `rewards.ts` |
| Pasivas de rancho y estados alterados (números a mano) | `data/passives.ts` + `game/team/ranchPassives.ts`, `game/battle/combatBonus.ts` + `ui/ranch/PassiveList.tsx` |
| Tipos de rancho (lista a mano) | `data/ranchTypes.ts` + `game/team/ranchTypes.ts` + `ui/shop/RanchTypeShop.tsx`, `ui/ranch/RanchTypeSection.tsx` |
| Rutas que abre lo ya completado, al cargar la partida (rutas añadidas después) | `game/run/routeUnlocks.ts` |
| Avance por la ruta / combates dentro de la ruta / paradas de curación (pociones) / elemento de la parada en la escena (`landmark` del nodo) | `game/run/run.ts` / `game/run/runBattle.ts` / `game/run/runHeal.ts` + `data/potions.ts` + `ui/route/HealStop.tsx` / `game/run/runLandmark.ts` + `landmarks` de `ui/route/pixelScene/scenes/<bioma>/index.ts` |
| Stats, EXP, niveles, ★, pasos | `game/team/stats.ts` |
| Curar, entrenar, elegir activo, descanso | `game/team/ranch.ts` + `ui/shared/sheet/HealButton.tsx`, `CompanionButton.tsx`, `CareSection.tsx`, `TrainControl.tsx` |
| Ficha del Pokémon, un solo componente para rancho y Pokédex: paisaje por tipo, arco de EXP, PS, secciones | `ui/shared/sheet/` (`PokemonSheet` (la ficha), `MonSheet` + `MonSection`, `SpeciesHero`, `CareSection`, `MovePanel`, `MonOverview` (Datos), `TicketsSection`, `FavoriteButton` (corazón de la cabecera), `CompanionButton` (Poké Ball de compañero, esquina izquierda), `HealButton` (poción de curar, abajo a la izquierda), `RanchSlotsBadge` (espacios que ocupa en el rancho, abajo a la derecha), `CombineResultAnimation`, `HeroLayout`, `MonHero`, `LevelUpBurst`, `StepperAction` (− / + de entrenar y crear tickets), `scenery.ts`) |
| Animación de crear y evolucionar | `ui/shared/sheet/EvolutionAnimation.tsx` |
| Espacios, varios ranchos, Caja, arrastrar | `game/team/ranches.ts` + `ui/ranch/RanchMon`, `RanchSlots`, `BoxSheet`, `ranchLooks.ts` + `ui/shared/sheet/MovePanel` |
| Evolución (por nivel o piedra) / piedras de la tienda | `data/evolutions.ts`, `game/team/evolution.ts` + `ui/shared/sheet/EvolvePanel.tsx` / `data/stones.ts`, `game/team/stones.ts` + `ui/shop/StoneShop.tsx` |
| Expediciones | `game/team/expedition.ts` + `ui/expeditions/` (`ExpeditionScreen` lista de rutas, `ExpeditionList` las que están en curso, `ExpeditionStartDialog` elegir Pokémon y duración; el selector es `ui/shared/MonPicker.tsx`) |
| Jefes comunitarios: jefes y premios / rondas, bots, reparto / pantalla | `data/raidBosses.ts` / `game/raid/` (`raidEngine` común, `raid` pestaña Raids, `routeRaid` paradas de ruta, `routeRaidStreak` menos dinero al repetirlas seguidas, `stopRoom` salas de parada sin la partida, `raidCombat`, `raidBots`, `raidPrizes`, `raidEstimate`, `raidRoom`); el jefe de una ruta es una parada `NodeKind.Raid` en `kantoMaps.ts` / `ui/raid/` (`RaidScreen`, `RaidScene`, `RaidWaiting` (espera entre jefes), `raidBiome`, `RaidBattleScene` (la pelea como un combate de ruta) + `partySpot` (filas desordenadas del grupo) + `roundReplay` (los golpes, uno tras otro), `RaidRoster` (lista de la sala: jugador, jugadores y bots, en líneas como las de ruta), `RaidJoin` (tu Pokémon en la sala o elegir entre los que pueden ir), `RaidPrizes` aviso de premios por recoger + `useRaidPrizeCollect` recogerlos; también, uno a uno, en Notificaciones: `ui/inbox/`) y, en la ruta, la misma `RunView` con `RaidBattle` dentro de su escena y `ui/route/RouteRaidHud.tsx` (línea del jefe, que abre la lista de la sala, «Retirarse» y la espera mientras se busca sala) |
| Salas compartidas con otros jugadores: protocolo / lo que hace el servidor / la sala de la partida enlazada / conexión, apodo y cada cuánto se consulta / función y almacén | `game/raid/online/` (`protocol`, `sharedRoom` + `roomServer` + `requests`, `linkedRoom`, `skipAhead` resumir salas viejas, `raidCycle` + `tabRooms` los jefes de la pestaña Raids: dos rotaciones, en orden y al azar, por ciclos) / `net/` (`raidSync`, `raidFeed` la pestaña Raids del servidor, `identity`, `raidApi`) + `ui/raid/` (`RaidScreen` una pestaña por rotación y Salas, `RaidFront` frontal de una rotación con servidor, `rotations` nombre de cada rotación, `RaidRooms` pestaña Salas, `RaidLocal` sin servidor, `NicknameDialog`, `RaidLinkNote`) / `../worker/raid.ts`, `../worker/raidTab.ts`, `../worker/db/rooms.ts`, `../worker/db/cycle.ts`, `../wrangler.jsonc` (despliegue: `docs/servidor.md`) |
| Cuenta opcional y partida en la nube: reglas compartidas y subir o bajar / sesión y correos / subir y bajar / pantallas / servidor | `game/core/accountRules.ts`, `cloudSave.ts` / `net/account.ts` / `net/cloudSync.ts` / `ui/account/` (`AccountDialog`, `AccountHost`, `CloudChoiceDialog`, `AccountModal`) / `../worker/auth/`, `../worker/save.ts`, `../worker/db/`, `../worker/mail.ts` (texto de los correos) |
| Obsequio diario: lista de días (a mano) / reglas / servidor / cliente / pantalla y menú del rancho | `data/dailyGifts.ts` / `game/collection/dailyGift.ts` / `../worker/gift.ts`, `../worker/db/gifts.ts` / `net/dailyGift.ts` / `ui/gift/DailyGiftSheet.tsx`, `GiftPrompt.tsx`, `giftText.ts` (aviso al entrar, desde `ui/account/AccountHost`), `ui/ranch/RanchMenu.tsx` (botón Menú, abajo a la derecha, con obsequio, Mochila y Tutoriales; la cabecera de sus paneles, `MenuSheetHeader`; la Caja, abajo a la izquierda) |
| Intercambios entre jugadores: reglas y límites / lo que sale y entra (repetidos) / operaciones que aplican servidor y móvil / tablón y peticiones / textos / cliente / pantallas / servidor | `game/trade/tradeGoods.ts` / `tradeGive.ts`, `tradeReceive.ts` / `tradeOps.ts` / `tradeProtocol.ts` / `goodText.ts` / `net/tradeApi.ts`, `net/tradeBoard.ts` (cada minuto; contador de Notificaciones), `net/cloudSync.ts › withCloudInSync` / `ui/shop/ShopScreen.tsx` (pestañas Tienda, Intercambios, Venta) + `ui/trade/` (`TradeScreen`, `TradeBoardView` tablón con buscador, `MyListings`, `NewListingDialog` + `OfferPicker` + `AskPicker`, `AcceptDialog`, `ListingCard`, `GoodBadge`, `CountInput`, `SpeciesSearch` + `speciesMatch`) / `../worker/trade.ts`, `../worker/tradeActions.ts`, `../worker/db/trades.ts`, `../worker/db/tradeWrites.ts`, `saves.ts` (sello de intercambios) |
| Venta al servidor (precios por rareza) | `game/trade/serverSale.ts` + `ui/sell/` (`SellScreen`, `SellCountDialog`) |
| Notificaciones del menú (obsequio listo, cada premio de raid y lo de los intercambios; «Recoger todo») | `ui/inbox/` (`InboxSheet`, `InboxRow` una fila, `useInboxCollect` recoger, `useInboxCount` contador del Menú), desde `ui/ranch/RanchMenu.tsx`; un premio suelto: `game/raid/raidPrizes.ts › collectRaidPrize` |
| Mochila (lo comprado y sin usar) | `game/team/bag.ts` + `ui/bag/BagSheet.tsx` |
| Tutoriales del menú: guías paso a paso / capturas | `ui/tutorials/` (`TutorialsSheet` lista, `GuideView` pasos, `guides/` un fichero por guía) / `assets/tutorials/*.webp`, generadas con `npm run shots` (con `npm run dev` abierto; `../scripts/tutorial-shots/`: `demoSave` partida de muestra, `shots` lista de capturas) |
| Avisos (punto rojo o contador) que se apagan al entrar y vuelven si hay algo nuevo | `ui/shared/useUnseen.ts` |
| Desplegable con cabecera grande (Pokédex, Tienda, Gacha) | `ui/shared/Foldout.tsx` |
| Base de datos (tablas) | `../migrations/` (un fichero nuevo por cambio) |
| Mejoras de la tienda / secciones desplegables y casillas de la cuadrícula | `game/team/upgrades.ts` + `ui/shop/UpgradeShop.tsx` / `ui/shop/ShopTile.tsx` |
| Tutorial e inicial | `game/team/tutorial.ts` + `ui/starter/`, `ui/shared/TutorialHint.tsx` |
| Piezas, crear Pokémon y Pokédex | `game/collection/pieces.ts`, `dex.ts` + `ui/dex/` (`DexScreen`, `DexSection` el desplegable de cada Pokédex, `DexCell`; la ficha es `PokemonSheet`, la misma que el rancho) |
| Pokédex regionales y Nacional (rangos y mapa de cada región) | `data/pokedexes.ts`; las especies nuevas, en `NATIONAL_IDS` de `scripts/fetch-pokemon.mjs` + `data/pokemon.ts` |
| Gacha, trituradora, MissingNo | `game/collection/gacha.ts`, `shredder.ts` + `ui/gacha/` (`GachaScreen` pestañas, `GachaMachine` + `GachaRates` tirar, `Shredder` + `ShredCell` trituradora, `MissingnoShop` casillas de la Pokédex que abren `PokemonSheet`, `RarityFoldout` + `rarityTitles` desplegable por rareza) |
| Rancho (pasar de rancho como fotos de una galería, siguiendo al dedo: `ui/ranch/useRanchCarousel.ts` + `ui/shared/useSwipe.ts`) | `ui/ranch/RanchScreen.tsx`, `RanchPage.tsx` (un rancho: fondo y Pokémon) |
| Pestañas de arriba de Ruta y Gacha (solo icono; la activa con su nombre) | `ui/shared/IconTabs.tsx` + `icon-tabs.css`; las de Ruta, en `ui/route/RouteScreen.tsx` |
| Pantalla de ruta: lista / línea de ruta (también en expediciones; su base `BackdropRow`, también en la sala de un jefe) / diálogo de comenzar / en curso / combate | `ui/route/RouteMap`, `RouteRow`, `RouteStartDialog`, `RunView`, `RouteBattle` |
| Escena de paseo / efectos de golpe | `ui/route/WalkScene.tsx` / `HitEffect.tsx` |
| Fondos de ruta por bioma (pixel art generado en canvas) | `ui/route/pixelScene/` (`index.ts` bioma → escena, `usePixelScene`, `engine/`, `paint/`, `elements/`, `scenes/<bioma>/`) |
| Banco de pruebas de los fondos pixel art (`/tools/scenery-lab/` con `npm run dev`) | `tools/scenery-lab/` (skill `fondos-pixel-art`) |
| Menú inferior y pestañas | `App.tsx` |
| Versión nueva de la app: service worker, cada cuánto se mira y `reloadApp` (botón de la pantalla de error, `ui/shared/ErrorBoundary.tsx`) / aviso para recargar | `net/appUpdate.ts` (`registerType: 'prompt'` en `../vite.config.ts`) / `ui/shared/UpdatePrompt.tsx` |
| Barra superior / ajustes | `ui/shared/TopBar.tsx` / `ui/settings/` |
| Notificaciones push: temas y validación / plan del móvil (expediciones, fin de ruta) / avisos de raids / cliente / ajustes / servidor | `game/core/push.ts` / `game/core/pushPlan.ts` / `game/raid/online/raidPushes.ts` / `net/push.ts`, `../public/sw-notifications.js` / `ui/settings/NotificationsDialog.tsx` / `../worker/push/`, `../worker/scheduled.ts` (cron), claves con `../scripts/make-vapid-key.mjs` |
| Sprite, barras, chips de tipo y de ataque | `ui/shared/common.tsx` |
| Iconos (objetos de PokeAPI, sin emojis) | `ui/shared/icons.ts` (qué objeto es cada cosa), `ItemIcon.tsx`, `data/items.ts` |
| Premios a pantalla completa, aparición, confirmación | `ui/shared/RewardOverlay`, `RevealOverlay`, `ConfirmDialog` |
| Colores y variables / estructura / piezas comunes | `styles/tokens.css` / `layout.css` / `components.css` |
| Números de balance | tabla «Sistemas» de `docs/diseno.md` (dice la constante y el fichero) |

Diccionarios (nunca strings ni números sueltos): `POKEMON` en `data/pokemon.ts`; `NodeKind`, `Biome`, `RouteId`, `StopLandmark` en
`data/maps/mapCommon.ts`; `Rarity` en `data/species.ts`; `Potion` en `data/potions.ts`; `TutorialStep`, `MonPlace` en `game/core/state.ts`; `CombineKind` en
`game/collection/pieces.ts`; `Stone` en `data/stones.ts`.

Si creas, mueves o cambias de función un fichero, actualiza esta tabla en el mismo cambio.

## Reglas que no se negocian

- **Código limpio antes que rápido.** Nombres claros, funciones cortas, sin código muerto ni comentarios obvios.
- **Ficheros pequeños.** Objetivo < 200 líneas; si un cambio lo supera, divide por responsabilidad.
- **La lógica del juego vive en `src/game`** y es pura: recibe el estado (y un `rng` inyectable) y lo modifica.
  La UI solo lee el estado y llama a acciones mediante `act()`.
- **Constantes de balance con nombre y `/** comentario */`** que explique la unidad y el efecto.
- **Cambios en `GameState`** ⇒ subir `SAVE_VERSION` en `src/game/core/state.ts`. **No se pierde nada**: la partida de la
  versión anterior se migra campo a campo (`core/saveMigration.ts`). Si un campo cambia de nombre o de significado,
  añade su paso en `SAVE_MIGRATIONS` (de la versión que dejas a la nueva) y su test en `saveMigration.test.ts`; si
  añades un campo con validación propia (ids de especie, ruta, objeto…), su regla en `RULES`.
- **Tests** para toda lógica nueva o modificada en `src/game` (`*.test.ts` junto al fichero).
- **Los tests no fijan contenido ni balance** (nombres, tiempos, números): usan `game/core/test-map.ts` y leen las
  constantes, para que editar datos a mano nunca rompa un test.
- Identificadores en inglés; comentarios, textos de UI y documentación en español.

Convenciones completas en [docs/convenciones.md](docs/convenciones.md).

## Documentación

- [docs/diseno.md](docs/diseno.md): reglas del juego, bucle principal y dónde está cada número de balance.
- [docs/arquitectura.md](docs/arquitectura.md): capas, estructura de carpetas, store, guardado, flujo de una ruta.
- [docs/convenciones.md](docs/convenciones.md): estilo de código, tests y checklist de revisión.
- [docs/fondos.md](docs/fondos.md): fondos pixel art de las rutas: estilo, motor, piezas y cómo crear uno nuevo.
- [docs/servidor.md](docs/servidor.md): servidor en Cloudflare (plan gratuito): despliegue paso a paso, Brevo, base de datos y consumo.

Si cambias una mecánica o la estructura, actualiza el documento correspondiente en el mismo cambio.

## Skills del proyecto

Hay skills en `.claude/skills/` para las tareas habituales: `nuevo-contenido`, `nueva-mecanica`,
`nueva-pantalla`, `revision-limpia` y `fondos-pixel-art`. Úsalas cuando la tarea encaje.

## Fuera de alcance

Existe otro proyecto anterior (`poke/Game/pokeproject`) que **no forma parte de este proyecto**. No leerlo, copiarlo
ni tomarlo como referencia salvo que se pida explícitamente.
