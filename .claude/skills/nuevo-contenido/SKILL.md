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

### Ruta (`data/maps.ts`)
- `id` en kebab-case y en español (`ruta-2`, `cueva-celeste`).
- Encadénala: la ruta anterior debe tener `unlocks: '<id nuevo>'`.
- Camino único: usa `chain(...)` con las paradas en orden; `steps` son los pasos para llegar a cada una.
- Con bifurcaciones: escribe los nodos a mano con varios `next`. El jugador elige rama antes de salir.
- Exactamente un nodo `kind: 'start'`. El nodo final tiene `next: []`.
- Todo `next[].to` apunta a un nodo existente y todo nodo es alcanzable desde el inicio.
- Encuentros con `enc({ Pidgey: 30, Rattata: 70 })`: nombre exacto de `pokemon.json` y probabilidad en %.
  Cada lista (la de la ruta y la de cada parada que la sustituya) debe sumar 100.
- `levels` y `reward` en progresión con la ruta anterior (ver tabla en `docs/diseno.md`).
- `biome` debe existir en `Biome` y en `SCENES` de `src/ui/scenery.ts`. Un bioma nuevo obliga a añadir su
  escena allí.

### Movimiento (`data/moves.ts`)
- Añádelo a `LIST` con el helper `m(id, nombre, tipo, potencia, precisión?)`. Solo hay movimientos de daño:
  no hay categoría física/especial ni efectos de estado.
- `id` en inglés kebab-case (como PokeAPI) y nombre oficial en español.
- Si debe aprenderse, colócalo en `TIERS`. Si no, no lo aprenderá nadie.

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
