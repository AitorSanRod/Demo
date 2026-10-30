---
name: nueva-pantalla
description: Crear o modificar pantallas y componentes React en src/ui (rancho, rutas, combate, gacha, pokédex, escena de paseo, barra superior y navegación) y sus estilos CSS. Úsala para cambios de interfaz, layout, animaciones o nuevas vistas.
---

# Trabajar en `src/ui`

## Reglas de la capa

- La UI **muestra** el estado y **dispara** acciones: `act((s) => accion(s, ...))`. No calcula reglas del juego.
  Si necesitas un número derivado (coste, probabilidad, PS…), créalo o úsalo desde `src/game`.
- El estado del juego llega por props (`game: GameState`) desde `App.tsx`. `useState` solo para estado visual
  (selección, pestaña, animación).
- Pantalla nueva: una carpeta en `src/ui/` con `XxxScreen.tsx` (un componente exportado) y su `xxx.css`. Si es
  una pestaña, regístrala en `TABS` de `App.tsx`.

## Componentes y estilos

- Reutiliza `ui/shared/`: `Sprite`, `Bar`, `TypeBadge`, `MoveChip`, `RewardOverlay`, `RevealOverlay`,
  `ConfirmDialog`, `TutorialHint`. Si una pieza se repite en dos pantallas, llévala allí.
- Clases CSS en el `.css` de la carpeta de la pantalla (lo importa su componente) con las variables de `:root`
  (`--card`, `--accent`, `--muted`…). Clases comunes de `src/styles/` antes que nuevas: `screen scroll`,
  `section-title`, `notice`, `muted small`.
- Una pantalla superpuesta (fondo oscuro, diálogo) se pinta con `createPortal` en `<body>`, como `ConfirmDialog`.
- Diseño **móvil en vertical**: objetivos táctiles de ≥ 44 px, sin scroll horizontal y respeto de
  `--safe-top`/`--safe-bottom`.
- Textos visibles en español.

## Tamaño

- Si un fichero pasa de ~200 líneas, extrae subcomponentes a su propio fichero (`RanchScreen.tsx` →
  `MonDetail.tsx`).
- Lo mismo con el CSS: si crece mucho, divídelo por componente (como `route/scene.css`, `run.css`, `battle.css`).

## Verificación

1. `npm run check`.
2. Pruébalo con `npm run dev` en un viewport móvil (≈ 390×844) y comprueba los estados vacío, normal y límite
   (sin dinero, Pokémon debilitado, run en curso).
3. Usa `⏱ x60` en la barra superior (solo aparece en `npm run dev`) para no esperar en tiempo real.
