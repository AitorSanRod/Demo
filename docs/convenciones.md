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
- `interface` para objetos y `type` para uniones y alias. Uniones de strings en lugar de `enum`.
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

- `src/game` no importa React ni el DOM. Solo `store.ts` toca `window`/`localStorage`.
- Las funciones de `game` reciben `s: GameState`, lo mutan y devuelven, como mucho, un resultado para la UI.
- Las acciones validan sus precondiciones y salen sin hacer nada (`return`, `null` o `false`) si no se cumplen.
- La UI no calcula reglas: si un componente necesita un número del juego, va en `game/` como función.

## React

- Componentes de función, un componente principal por fichero de pantalla; subcomponentes privados en el mismo
  fichero mientras sea corto.
- Reutiliza `ui/common.tsx` (`Sprite`, `Bar`, `TypeBadge`, `MoveChip`) antes de crear piezas nuevas.
- Estilos en `src/index.css` con las variables de `:root`. Nada de colores sueltos si hay variable; para
  transparencias usa `color-mix(in srgb, var(--x) N%, transparent)`.
- Paleta de los juegos de GBA: fondo crema (`--bg`), tarjetas blancas (`--card`), texto casi negro y rojo
  Pokédex (`--red`, que también es `--accent`) para la cabecera, el botón principal y la selección. El
  amarillo (`--yellow`) se reserva para el logo y los textos flotantes.
- Colores de tipos (`data/types.ts`) y rarezas (`data/species.ts`) siguen la paleta clásica de los juegos.
- Si cambias un color de marca, actualiza también `theme-color` en `index.html`, el manifest de
  `vite.config.ts`, `favicon.svg` y `scripts/make-icons.mjs`.
- Estado local (`useState`) solo para la UI (selección, pestañas); el estado del juego vive en el store.

## Tests

- Vitest, ficheros `*.test.ts` junto al módulo (`stats.ts` → `stats.test.ts`).
- Solo lógica de `src/game` (y consultas de `src/data`). No se testea la UI.
- Azar con un rng determinista (`seqRng` en `src/game/test-utils.ts`).
- Un test por comportamiento, con un nombre en español que lo describa: `it('no permite tirar sin tickets')`.

## Definición de terminado

- `npm run check` pasa (typecheck, lint y tests).
- Documentación actualizada si cambió una regla (`docs/diseno.md`) o la estructura (`docs/arquitectura.md`).
- `SAVE_VERSION` subido si cambió la forma del estado.
