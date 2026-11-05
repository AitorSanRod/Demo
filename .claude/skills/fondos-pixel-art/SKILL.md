---
name: fondos-pixel-art
description: Diseñar, generar e iterar los fondos pixel art en capas (parallax) de las rutas de Pokérancho con el banco de pruebas tools/scenery-lab, en el estilo acordado (juego de Pokémon, colores vivos, formas redondeadas, simple y orgánico). Úsala para "haz el fondo de la cueva", "otra escena", "cambia los árboles del fondo", "añade una parada visual (casa, cartel, fuente)", "las nubes no pegan", etc.
---

# Fondos pixel art de las rutas

**Lee primero [docs/fondos.md](../../../docs/fondos.md)**: es la referencia completa (dónde está cada cosa, guía de
estilo con lo aprobado y lo rechazado, motor, medidas, catálogo de piezas, receta de escena nueva, cómo llevarla al
juego y problemas ya resueltos). Esta skill solo resume lo imprescindible.

## Forma de trabajar

- Los fondos se generan por código en `src/ui/route/pixelScene/` (el mismo código que usa el juego) y se revisan en
  `tools/scenery-lab/` (`npm run dev` → `/tools/scenery-lab/`).
- **No se toman decisiones de diseño por cuenta propia**: preguntar referencia, elementos, luz y tipo de camino antes
  de empezar, y ante cualquier duda.
- Ciclo: crear → capturas en **móvil y ancho** (puppeteer-core contra `npx vite --port 5199`, ver la memoria
  *entorno-windows*) → revisarlas uno mismo y corregir lo obvio → enseñar con las rutas absolutas de las capturas y
  preguntas concretas → iterar.
- Una escena entra en el juego (`BUILDERS` de `pixelScene/index.ts`) **solo con el visto bueno**.
- Referencias del usuario en `referencias/` (prado, pueblo, bosque).

## Estilo en una línea por regla

1. Simple y de juego de Pokémon, nunca realista; si se ve recargado, sobra.
2. Copas de **pocas bolas grandes como una sola masa** (ni círculo perfecto ni muchos bultos).
3. Colores planos y vivos, 3–5 tonos, sin tramado, luz arriba a la izquierda.
4. Contorno solo en el lado de sombra, nunca negro; nubes y colinas sin contorno.
5. Píxel ×3, todo en enteros.
6. Orgánico: varias profundidades, tamaños variados, huecos irregulares, nada en fila.
7. Nada se corta en seco ni cambia de golpe: postes en las vallas, bordes escalonados, raíces en los árboles,
   caminos con sentido, transiciones graduales, sin franjas de borde recto.
8. Ritmo tranquilo: cambios de suelo en tramos largos y de tarde en tarde; efectos (humo) esporádicos.

La lista completa de lo rechazado está en `docs/fondos.md`: revisarla antes de entregar.
