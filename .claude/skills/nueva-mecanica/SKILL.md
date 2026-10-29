---
name: nueva-mecanica
description: Diseñar e implementar una mecánica o regla de juego nueva, o cambiar una existente, en src/game (combate, stats, recompensas, tipos de nodo, rancho, gacha, economía, balance). Úsala para "añade entrenadores", "que los Pokémon evolucionen", "cambia la fórmula de daño", "rebalancea la EXP", etc.
---

# Implementar una mecánica en `src/game`

## 1. Entender y acordar

- Lee `docs/diseno.md` y los módulos de `src/game` afectados.
- Si la regla es ambigua (números, casos límite, qué pasa al perder…), **pregunta antes de escribir código**.
  Propón valores concretos para que el usuario solo tenga que confirmar.
- Decide dónde vive: amplía un módulo existente si es su responsabilidad, o crea uno nuevo
  (`game/evolution.ts`) si es un concepto propio o el módulo superaría ~200 líneas.

## 2. Modelo de datos

- Si añade campos a `GameState`, `OwnedMon` o `Run`: actualiza `initialState()` y **sube `SAVE_VERSION`**.
- Datos estáticos nuevos (tablas, catálogos) van en `src/data`, no en `src/game`.
- Usa uniones de strings y `Record<Union, ...>` para que el compilador obligue a cubrir todos los casos.

## 3. Lógica

- Funciones puras sobre `s: GameState` que mutan el borrador; sin React, DOM ni store.
- Azar siempre con `rng: Rng = Math.random` como último parámetro.
- Cada número de balance va en una constante con nombre y `/** unidad y efecto */`, al principio del módulo.
- Las acciones validan sus precondiciones y salen sin efecto si no se cumplen.
- Si el resultado se muestra en la UI, devuélvelo como un objeto tipado (como `LevelUpResult` o `PullResult`).

## 4. Tests (obligatorio)

- `*.test.ts` junto al módulo. Cubre el caso normal, los límites (máximos, 0, sin dinero o tickets) y el azar con
  `seqRng` de `src/game/test-utils.ts`.
- Construye el estado con `initialState()` y las acciones reales (`chooseStarter`, `startRun`…), no a mano.

## 5. Conectar con la UI

Solo cuando la lógica está testeada. Usa la skill `nueva-pantalla` si hay cambios visuales relevantes.

## 6. Cerrar

- `npm run check`.
- Actualiza la tabla de sistemas de `docs/diseno.md` (regla y dónde están las constantes) y, si cambió el
  flujo, `docs/arquitectura.md`.
