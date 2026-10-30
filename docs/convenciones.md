# Convenciones de código

## Principios

1. **Legible primero.** Si hay que elegir entre corto y claro, gana claro.
2. **Una responsabilidad por fichero y por función.** Ficheros < 200 líneas como objetivo; funciones que quepan en
   una pantalla. Si crece, se divide por concepto, no por tamaño arbitrario.
3. **Sin abstracciones especulativas.** Nada de helpers, opciones o capas "por si acaso". Tres casos repetidos
   justifican extraer; dos, normalmente no.
4. **Sin código muerto.** Ni comentado, ni exports sin uso, ni parámetros ignorados.

## TypeScript

- Tipos explícitos en la API pública de cada módulo (parámetros y retorno de funciones exportadas).
- `interface` para objetos y `type` para uniones y alias.
- **Sin strings ni números sueltos para nombrar cosas del juego.** Cada conjunto cerrado de valores (tipos de
  parada, biomas, rutas, rarezas, pasos del tutorial, resultados de una acción…) es un diccionario `as const` con
  un tipo del mismo nombre, en lugar de `enum`:
  ```ts
  export const NodeKind = { Start: 'start', Wild: 'wild', Boss: 'boss' } as const
  export type NodeKind = (typeof NodeKind)[keyof typeof NodeKind]
  ```
  Se usa `NodeKind.Boss`, nunca `'boss'`; en un `Record` las claves van entre corchetes (`[Rarity.Common]: …`). El
  valor es el que se guarda en la partida: cambiarlo obliga a subir `SAVE_VERSION`.
- Las especies se nombran con `POKEMON` (`data/pokemon.ts`): `POKEMON.Pidgey`, no `16` ni `'Pidgey'`; también en
  los tests. Quedan fuera las clases CSS y los ids que solo usa una pantalla (p. ej. las pestañas de `App.tsx`).
- Prohibido `any`. Usa `!` solo cuando una invariante lo garantice y sea evidente en el contexto.
- `import type` para importar solo tipos (lo exige `verbatimModuleSyntax`).
- Datos con forma fija: `Record<Union, ...>` para que el compilador avise si falta un caso.

## Nombres

- Identificadores en **inglés**, `camelCase` para valores y funciones, `PascalCase` para tipos y componentes y
  `UPPER_SNAKE` para constantes de módulo.
- Funciones con verbo (`startRun`, `gainExp`). Booleanos con `is/has/can`.
- Textos visibles, comentarios y documentación en **español**.

## Comentarios

- Explican el **porqué** o una regla del juego, no lo que el código ya dice.
- Constantes de balance: siempre con `/** */` indicando la unidad y el efecto.
- Separadores de sección `// ---------------------------------------------------------------- Nombre` solo en
  ficheros con varias secciones claras.

## Capas

- `src/game` no importa React ni el DOM. Solo `core/store.ts` toca `window`/`localStorage`.
- Las funciones de `game` reciben `s: GameState`, lo mutan y devuelven, como mucho, un resultado para la UI.
- Las acciones validan sus precondiciones y salen sin hacer nada (`return`, `null` o `false`) si no se cumplen.
- La UI no calcula reglas: si un componente necesita un número del juego, va en `game/` como función.

## React

- Componentes de función, un componente principal por fichero; subcomponentes privados en el mismo fichero
  mientras sea corto. Cada pantalla en su carpeta de `src/ui` (ver `docs/arquitectura.md`).
- Reutiliza `ui/shared/` (`Sprite`, `Bar`, `TypeBadge`, `MoveChip`, `RewardOverlay`, `RevealOverlay`,
  `ConfirmDialog`) antes de crear piezas nuevas.
- Estilos de cada pantalla en un CSS en su carpeta, importado por su componente; lo común en `src/styles/`. Usa
  las variables de `:root` (`styles/tokens.css`): nada de colores sueltos si hay variable; para transparencias
  `color-mix(in srgb, var(--x) N%, transparent)`.
- Las pantallas superpuestas (premios, confirmaciones) se pintan en `<body>` con `createPortal`, para no heredar
  `pointer-events`, `z-index` ni filtros del sitio donde se usan.
- Paleta de los juegos de GBA: fondo crema (`--bg`), tarjetas blancas (`--card`), texto casi negro y rojo
  Pokédex (`--red`, que también es `--accent`) para la cabecera, el botón principal y la selección. El
  amarillo (`--yellow`) se reserva para el logo y los textos flotantes.
- Colores de tipos (`data/types.ts`) y rarezas (`data/species.ts`) siguen la paleta clásica de los juegos.
- Si cambias un color de marca, actualiza también `theme-color` en `index.html`, el manifest de
  `vite.config.ts`, `favicon.svg` y `scripts/make-icons.mjs`.
- Estado local (`useState`) solo para la UI (selección, pestañas); el estado del juego vive en el store.

## Tests

- Vitest, ficheros `*.test.ts` junto al módulo (`team/stats.ts` → `team/stats.test.ts`).
- Solo lógica de `src/game` (y consultas de `src/data`). No se testea la UI.
- Azar con un rng determinista (`seqRng` en `src/game/core/test-utils.ts`); `chooseStarter` da el inicial y
  salta el tutorial para empezar los tests desde una partida jugable.
- **Los tests no fijan contenido ni balance**: nada de nombres, tiempos o números del juego, para que editar datos
  a mano nunca rompa un test. Los del motor usan el mapa de `game/core/test-map.ts`
  (`vi.mock('../../data/maps/kantoMaps', () => import('../core/test-map'))`); los valores se leen de las constantes
  exportadas o se derivan de los datos (`speciesOfRarity`). Sobre los datos reales solo se comprueba la estructura
  (rutas conectadas, encuentros que suman 100…).
- Un test por comportamiento, con un nombre en español que lo describa: `it('no permite tirar sin tickets')`.

## Definición de terminado

- `npm run check` pasa (typecheck, lint y tests).
- Documentación actualizada si cambió una regla (`docs/diseno.md`) o la estructura (`docs/arquitectura.md`).
- `SAVE_VERSION` subido si cambió la forma del estado.
