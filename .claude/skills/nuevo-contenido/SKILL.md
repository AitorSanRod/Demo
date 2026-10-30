---
name: nuevo-contenido
description: Añadir o modificar contenido de datos del juego (especies, movimientos, rutas, nodos, encuentros, biomas o rarezas) en src/data. Úsala cuando la tarea sea "añade una ruta", "mete este Pokémon", "nuevo movimiento", "cambia los encuentros", etc. No sirve para mecánicas nuevas (usa nueva-mecanica).
---

# Añadir contenido en `src/data`

El contenido es **datos**, no lógica. Si para añadirlo hace falta una regla nueva (p. ej. un nodo `trainer` que
se comporte distinto), primero implementa la regla con la skill `nueva-mecanica`.

## Antes de empezar

1. Lee el fichero de datos afectado y copia el formato de las entradas vecinas (helpers `m()`, `enc()`, etc.).
2. Comprueba que los IDs referenciados existen: especies en `pokemon.json`, movimientos en `MOVES` y rutas en
   `KANTO.routes`.

## Por tipo de contenido

### Ruta (`data/maps/kantoMaps.ts`)
- Cada región tiene su fichero `xxxMaps.ts`, solo con sus datos. Una región nueva se añade a `REGIONS` en
  `data/maps/index.ts`; lo común a todas está en `mapCommon.ts`.
- Añade su id a `RouteId` (valor en kebab-case y en español: `Ruta2: 'ruta-2'`) y úsalo como `id: RouteId.Ruta2`.
- Encadénala: la ruta anterior debe tener `unlocks: RouteId.<la nueva>`.
- Camino único: usa `chain(...)` con las paradas en orden; `steps` son los pasos para llegar a cada una.
- Con bifurcaciones: escribe los nodos a mano con varios `next`. El jugador elige rama antes de salir.
- Exactamente un nodo `kind: NodeKind.Start`. El nodo final tiene `next: []`.
- Jefe: `kind: NodeKind.Boss` con `boss: boss(POKEMON.Pidgeotto, nivel)`. Lucha con stats
  completas, así que su nivel debe quedar por debajo del de los salvajes de alrededor: ajústalo simulando.
- Todo `next[].to` apunta a un nodo existente y todo nodo es alcanzable desde el inicio.
- Encuentros con `enc([POKEMON.Pidgey, 30], [POKEMON.Rattata, 70])`: especie de `POKEMON` y probabilidad en %.
  Cada lista (la de la ruta y la de cada parada que la sustituya) debe sumar 100.
- `levels` y `reward` en progresión con la ruta anterior (ver tabla en `docs/diseno.md`).
  `reward.firstClearTickets` (opcional) son tickets extra que solo se dan la primera vez que se completa.
- Para fijar duración y dificultad, simula con el motor real (`advanceRun` en tiempo real a x1) con los tres
  iniciales y anota los resultados en `docs/diseno.md`.
- `biome` es un valor de `Biome` (`Biome.Forest`) y debe estar en `SCENES` de `src/ui/route/scenery/index.ts` (cada bioma en su fichero). Un bioma nuevo obliga a añadir su
  escena allí.

### Movimiento (`data/moves.ts`)
- Hay exactamente uno por tipo y rareza en `BY_TYPE` (`m(id, nombre, tipo, potencia, precisión?)`); cada
  especie usa el de su primer tipo y su rareza (`signatureMove`). Cambiar uno cambia el ataque de todas esas especies.
- Solo hay movimientos de daño: no hay categoría física/especial ni efectos de estado.
- La potencia debe crecer con la rareza dentro de cada tipo (lo comprueba `moves.test.ts`).
- `id` en inglés kebab-case (como PokeAPI) y nombre oficial en español.

### Especie
- No edites `pokemon.json` a mano: cambia `TOTAL` en `scripts/fetch-pokemon.mjs` y regenera con
  `node scripts/fetch-pokemon.mjs`.
- Rareza, sprites y movimientos se derivan solos. Las 6 stats de PokeAPI se reducen a 4 en `species.ts`
  (`simplifyStats`).

## Verificación

1. Añade o amplía un test de integridad de datos (`src/data/*.test.ts`) si el tipo de contenido no lo tiene:
   referencias válidas, rutas alcanzables y encuentros que suman 100%.
2. `npm run check`.
3. Si cambia lo que ve el jugador, actualiza "Contenido actual" en `docs/diseno.md`.
