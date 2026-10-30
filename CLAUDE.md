# Pokérancho

Juego idle tipo digivice: el jugador elige el camino antes de salir y su Pokémon recorre la ruta y combate solo.
En el rancho ve a todo su equipo, cura, entrena y elige compañero; manda al resto de expedición y consigue
Pokémon nuevos juntando piezas del gacha. PWA para móvil en vertical.

Stack: Vite 8 + React 19 + TypeScript 7 + Vitest. Sin backend: la partida se guarda en `localStorage`.

## Comandos

```bash
npm run dev        # servidor de desarrollo
npm run check      # typecheck + lint + tests (lo que debe pasar antes de dar algo por terminado)
npm test           # solo tests (vitest run)
npm run build      # build de producción
```

Requiere Node `^20.19 || >=22.12` (ver `.nvmrc`). Con versiones anteriores npm no instala los binarios nativos de
Vite/oxlint y `build`/`lint` fallan.

## Arquitectura en una línea

`src/data` (datos estáticos) → `src/game` (lógica pura, sin React ni DOM) → `src/ui` (pantallas React).
Las dependencias solo van en ese sentido. `src/game` se agrupa por dominio (`core`, `battle`, `run`, `team`,
`collection`) y `src/ui` por pantalla, cada una con su CSS. Detalle en [docs/arquitectura.md](docs/arquitectura.md).

## Cómo orientarse sin leer todo el programa

Este mapa basta para empezar: **no explores el proyecto entero**. Abre solo los ficheros de la fila que toque y
localiza lo demás con `Grep` por el nombre del símbolo. `docs/` se consulta cuando hace falta, no por sistema.
Cada `.ts` de `src/game` tiene su `.test.ts` al lado; las pantallas, su CSS en la misma carpeta.

| Quiero cambiar… | Dónde (`src/`) |
|---|---|
| Rutas, paradas, encuentros, jefes, premio de ruta | `data/maps/kantoMaps.ts` (un fichero por región) |
| Tipos de parada y biomas, ids de ruta, atajos y consultas de caminos | `data/maps/mapCommon.ts` |
| Lista de regiones y `route(id)` | `data/maps/index.ts` |
| Especies, rarezas, iniciales, evoluciones | `data/species.ts`, `data/evolutions.ts` |
| Ataques, tipos y eficacias | `data/moves.ts`, `data/types.ts` |
| Forma de la partida, estado inicial, `SAVE_VERSION` | `game/core/state.ts` |
| Guardado y copia del equipo | `game/core/store.ts`, `game/core/teamBackup.ts` |
| Paso del tiempo | `game/core/tick.ts`, `App.tsx` |
| Combate (turnos, daño) y sus premios | `game/battle/battle.ts`, `game/battle/rewards.ts` |
| Avance por la ruta / combates dentro de la ruta | `game/run/run.ts` / `game/run/runBattle.ts` |
| Stats, EXP, niveles, ★, pasos | `game/team/stats.ts` |
| Curar, entrenar, elegir activo, descanso | `game/team/ranch.ts` + `ui/ranch/MonDetail.tsx` |
| Evolución | `game/team/evolution.ts` + `ui/ranch/EvolvePanel.tsx` |
| Expediciones | `game/team/expedition.ts` + `ui/expeditions/` |
| Mejoras de la tienda | `game/team/upgrades.ts` + `ui/shop/UpgradeShop.tsx` |
| Tutorial e inicial | `game/team/tutorial.ts` + `ui/starter/`, `ui/shared/TutorialHint.tsx` |
| Piezas y Pokédex | `game/collection/pieces.ts`, `dex.ts` + `ui/dex/` |
| Gacha, trituradora, MissingNo | `game/collection/gacha.ts`, `shredder.ts` + `ui/gacha/` |
| Rancho | `ui/ranch/RanchScreen.tsx` |
| Pantalla de ruta: mapa / planificador / en curso / combate | `ui/route/RouteMap`, `RoutePlanner`, `RunView`, `RouteBattle` |
| Escena de paseo y biomas / efectos de golpe | `ui/route/WalkScene.tsx`, `scenery/` / `HitEffect.tsx` |
| Menú inferior y pestañas | `App.tsx` |
| Barra superior / ajustes y notificaciones | `ui/shared/TopBar.tsx` / `ui/settings/` |
| Sprite, barras, chips de tipo y de ataque | `ui/shared/common.tsx` |
| Premios a pantalla completa, aparición, confirmación | `ui/shared/RewardOverlay`, `RevealOverlay`, `ConfirmDialog` |
| Colores y variables / estructura / piezas comunes | `styles/tokens.css` / `layout.css` / `components.css` |
| Números de balance | tabla «Sistemas» de `docs/diseno.md` (dice la constante y el fichero) |

Diccionarios (nunca strings ni números sueltos): `POKEMON` en `data/pokemon.ts`; `NodeKind`, `Biome`, `RouteId` en
`data/maps/mapCommon.ts`; `Rarity` en `data/species.ts`; `TutorialStep`, `MonPlace` en `game/core/state.ts`; `CombineKind` en
`game/collection/pieces.ts`; `EvolveKind` en `game/team/evolution.ts`.

Si creas, mueves o cambias de función un fichero, actualiza esta tabla en el mismo cambio.

## Reglas que no se negocian

- **Código limpio antes que rápido.** Nombres claros, funciones cortas, sin código muerto ni comentarios obvios.
- **Ficheros pequeños.** Objetivo < 200 líneas; si un cambio lo supera, divide por responsabilidad.
- **La lógica del juego vive en `src/game`** y es pura: recibe el estado (y un `rng` inyectable) y lo modifica.
  La UI solo lee el estado y llama a acciones mediante `act()`.
- **Constantes de balance con nombre y `/** comentario */`** que explique la unidad y el efecto.
- **Cambios en `GameState`** ⇒ subir `SAVE_VERSION` en `src/game/core/state.ts`. La partida se reinicia, pero el
  equipo se conserva (`core/teamBackup.ts`, provisional hasta tener servidor).
- **Tests** para toda lógica nueva o modificada en `src/game` (`*.test.ts` junto al fichero).
- **Los tests no fijan contenido ni balance** (nombres, tiempos, números): usan `game/core/test-map.ts` y leen las
  constantes, para que editar datos a mano nunca rompa un test.
- Identificadores en inglés; comentarios, textos de UI y documentación en español.

Convenciones completas en [docs/convenciones.md](docs/convenciones.md).

## Documentación

- [docs/diseno.md](docs/diseno.md): reglas del juego, bucle principal y dónde está cada número de balance.
- [docs/arquitectura.md](docs/arquitectura.md): capas, estructura de carpetas, store, guardado, flujo de una ruta.
- [docs/convenciones.md](docs/convenciones.md): estilo de código, tests y checklist de revisión.

Si cambias una mecánica o la estructura, actualiza el documento correspondiente en el mismo cambio.

## Skills del proyecto

Hay skills en `.claude/skills/` para las tareas habituales: `nuevo-contenido`, `nueva-mecanica`,
`nueva-pantalla` y `revision-limpia`. Úsalas cuando la tarea encaje.

## Fuera de alcance

Existe otro proyecto anterior (`poke/Game/pokeproject`) que **no forma parte de este proyecto**. No leerlo, copiarlo
ni tomarlo como referencia salvo que se pida explícitamente.
