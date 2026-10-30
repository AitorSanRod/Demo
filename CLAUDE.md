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

## Reglas que no se negocian

- **Código limpio antes que rápido.** Nombres claros, funciones cortas, sin código muerto ni comentarios obvios.
- **Ficheros pequeños.** Objetivo < 200 líneas; si un cambio lo supera, divide por responsabilidad.
- **La lógica del juego vive en `src/game`** y es pura: recibe el estado (y un `rng` inyectable) y lo modifica.
  La UI solo lee el estado y llama a acciones mediante `act()`.
- **Constantes de balance con nombre y `/** comentario */`** que explique la unidad y el efecto.
- **Cambios en `GameState`** ⇒ subir `SAVE_VERSION` en `src/game/core/state.ts`.
- **Tests** para toda lógica nueva o modificada en `src/game` (`*.test.ts` junto al fichero).
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
