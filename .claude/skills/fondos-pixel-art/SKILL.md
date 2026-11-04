---
name: fondos-pixel-art
description: Diseñar, generar e iterar los fondos pixel art en capas (parallax) de las rutas de Pokérancho con el banco de pruebas tools/scenery-lab, en el estilo acordado (prado de Pokémon, colores vivos, formas redondeadas y simples). Úsala para "haz el fondo de Pueblo Paleta", "otra escena", "cambia los árboles del fondo", "añade una parada visual (casa, cartel, fuente)", "las nubes no pegan", etc.
---

# Fondos pixel art de las rutas

Los fondos se **generan por código** (semilla reproducible) en `src/ui/route/pixelScene/` (el mismo código que usa el
juego) y se revisan en el banco de pruebas `tools/scenery-lab/` antes de enseñarlos. Se itera con el usuario: se crea algo, se hacen capturas, el usuario opina.
**No se toman decisiones de diseño por cuenta propia**: si algo no está claro, se pregunta.

## Abrir el banco de pruebas

`npm run dev` → `http://localhost:5173/tools/scenery-lab/`. Controles: escena, semilla, pantalla (móvil vertical por
defecto: el juego es una PWA vertical), Pokémon de referencia (mismo GIF y escala que `Sprite`), velocidad, mostrar/
ocultar capas, un botón por parada y descargar las capas en PNG.

Capturas para revisar uno mismo antes de enseñar nada: ver la memoria *entorno-windows* (vite en el puerto 5199 +
puppeteer-core con Chrome). Mirar siempre la vista **móvil** y la **ancha**.

## Estilo (lo que ha pedido el usuario, en orden de importancia)

Referencias en `referencias/` (`prado-montanas.png` es la base de Ruta 1; `pueblo-2d.png`, la de Pueblo Paleta; `bosque-arboles-grandes.png`, idea de
árboles cercanos). La referencia principal de Ruta 1 fue una captura vertical de prado: cielo azul limpio, una nube
grande sobre colinas suaves, llanura verde amarillenta lisa con pocos árboles oscuros redondos, franja de plantas de
hoja ancha con alguna margarita, borde de hierba y un camino naranja ancho.

1. **Simple y "Pokémon", nunca realista.** Pocas piezas, mucho espacio liso. Si se ve recargado, quitar.
2. **Formas redondeadas y con poco detalle.** Las copas que gustan son las de pocas bolas grandes (3–5) pintadas como
   una masa; muchas nubes o bultos pequeños se ven sobrecargados. Copas = una bola grande con pocos bultos en el borde (`domeCanopy`), sin huecos oscuros
   dentro. Nada de racimos irregulares ni árboles "de verdad".
3. **Colores planos y vivos, 3–5 tonos por material, sin tramado** (`DITHER = 0`). Luz arriba a la izquierda.
4. **Contornos suaves.** Contorno oscuro solo en el lado de sombra (abajo/derecha); el lado iluminado se funde con
   el fondo. Nubes y colinas, sin contorno.
5. **Píxel ×3** (cada píxel de arte = 3×3 de pantalla). Todo encaja en enteros.
6. **Movimiento:** parallax por capa, nubes con movimiento propio, hierba y plantas que se mecen (fotogramas en
   bucle), partículas (mariposas, pétalos) y hojas de primer plano que pasan **solo de vez en cuando**.
7. **Paradas visuales:** al acercarse a una parada entra un elemento (cartel, casa…) que pasa y se queda atrás.
8. **Orgánico, nunca en fila ni cortado en seco.** Elementos a varias profundidades (capas con distinto parallax),
   tamaños y alturas variados, huecos irregulares. Todo lo que empieza o acaba lo hace con sentido: vallas con poste
   en los extremos, plazas con borde escalonado de baldosas, caminos que llevan a algún sitio (puerta → calle) y
   que, si algo los tapa, siguen por detrás. Superficies grandes con degradado suave y alguna marca, no planas.
   Árboles con raíces, sombra y briznas en el pie; casas cercanas con ladrillo.
9. **Ritmo tranquilo.** Lo que cambia el suelo (plaza, puente…) va en tramos largos y de tarde en tarde (tesela
   ancha), no alternando cada poco. Los efectos (humo) son esporádicos: a ratos y en pocas casas, nunca fijos.

Rechazado por el usuario (no repetir): tramado visible, árboles por pisos rectos, copas de racimos realistas, seto
continuo recargado, llanuras con muchas manchas o filas de árboles, pinos en el prado, borde oscuro en la cara clara
de las hojas, casas alineadas en una sola fila, caminos o vallas que se cortan de golpe, césped plano sin variación, rellenos
rectangulares (franjas sólidas con borde recto) y cambios de golpe: todo borde es follaje o forma orgánica y las
transiciones (p. ej. hacia un claro) son graduales.

## Estructura del código

```
src/ui/route/pixelScene/
  index.ts   bioma → escena (BUILDERS), PIXEL = 3, semilla fija; usePixelScene.ts (canvas animado para WalkScene)
  paint/     pixmap (lienzo con wrap en X), noise (rng, ruido periódico, ondas), shade (rampas),
             spheres (volúmenes con contorno), foliage (follaje: borde mordido, luz, sin/con huecos)
  elements/  clouds, trees (broadTree: copa redonda, ramas, raíces y pie con sombra), lawn (césped con degradado y
             senderos ondulados), shrubs (bush, hedge, mossyRock, pine),
             grass (grassField, tufts que se mecen, daisy, flower), leaves (FERN_LEAVES / BROAD_LEAVES),
             signpost (cartel con fuente 3×5; añadir letras a GLYPHS si faltan), house (casa; ancha = 4 ventanas),
             fence (valla blanca de estacas y parterre de flores de tallo alto), fountain (fuente de plaza),
             forest (árbol de fondo, banda de copas con claros graduales, rayos que se desvanecen), forestTree (árbol
             grande del bosque: torcido, con ramas y copa de pocas bolas grandes como una sola masa, distinto cada vez), log (tronco
             hueco), mushroom (seta)
  engine/    types (SceneDef, SceneLayer con `emitters` de humo, Landmark, ParticleSystem), renderer (pinta y anima),
             smoke (humo de chimeneas a ratos, ligado a su capa)
  scenes/    una carpeta por escena (forest = Bosque Verde: bruma, dos planos de árboles con matorral, copas y rayos
             alineados por tesela, árboles grandes, sotobosque en grupos, camino húmedo con raíces; meadow = prado de Ruta 1, con plain (llanura en dos planos con sendero y
             árboles por profundidad); palletTown = pueblo con town (filas de casas sin solape, calle), walkway (caminito), ground (arena y plaza por baldosas); reutiliza el cielo y las
             colinas del prado y añade town (casas, jardines) y su camino con plaza): palette, backdrop (cielo, nubes, colinas, llanura), near (plano cercano),
             ground (camino y matas), particles, index (lista de capas)
```

`tools/scenery-lab/` solo tiene la página de pruebas (`index.html`, `main.ts` con su lista `SCENES`, `lab.css`).

- Una escena es una `SceneDef`: `sky(height)`, `layers` (de lejos a cerca, cada una con `anchor`/`offset` en píxeles
  de arte, `parallax` respecto al camino y `drift` propio), `walkerBottom`, `particles` y `landmarks`.
- Las capas son **teselas que se repiten**: dibujar siempre con `Pixmap` en `wrapX` y usar ruido periódico
  (`valueNoise(..., period = pix.w)`, `periodicWave`) para que no haya costura. Los periodos deben dividir el ancho.
- Para que algo salga "de vez en cuando", usar una tesela ancha (500–700 px) con pocos elementos.
- Colores en `palette.ts` de la escena, con comentario de qué es cada tono. Nada de colores sueltos en los dibujos.
- Reutilizar `elements/` antes de crear piezas nuevas; si una pieza nueva sirve para otras escenas, va a `elements/`.
- Ficheros < 200 líneas, identificadores en inglés y comentarios en español (reglas del proyecto).

## Escena nueva (pasos)

1. Preguntar al usuario la referencia (captura) y qué elementos quiere; mirar las de `referencias/`.
2. Crear `scenes/<escena>/` copiando la estructura de `meadow` y registrarla en `SCENES` de `tools/scenery-lab/main.ts`.
3. Paleta a partir de la referencia; capas de lejos a cerca; ajustar alturas en móvil (unos 240 px de arte de alto).
4. Capturas móvil y ancha, revisarlas y corregir lo obvio antes de enseñarlas.
5. Entregar con las rutas absolutas de las capturas y preguntas concretas para la siguiente vuelta.

## Cómo llega al juego

`WalkScene` pregunta `pixelSceneFor(biome)`: si el bioma está en `BUILDERS` (`pixelScene/index.ts`) pinta dos lienzos
animados (detrás y delante del Pokémon) con `usePixelScene`; si no, usa el SVG de `ui/route/scenery/`. Llevar una
escena al juego = añadirla a `BUILDERS` y quitar el SVG de ese bioma de `scenery/` (sin código muerto). `--ground`
sale de `walkerBottom × PIXEL`. Hoy Meadow (Ruta 1 y Ruta 1 - Final) usa el prado,
PalletTown (solo Pueblo Paleta) el pueblo y Forest (Bosque Verde) el bosque; Cave y Sea siguen en SVG. Un bioma nuevo necesita además su imagen en
`BIOME_SCENERY` (`ui/shared/sheet/scenery.ts`).

Pendiente, preguntar antes de hacerlo: que las paradas del juego disparen sus elementos (cartel, casa, fuente…) al
acercarse al nodo. La lógica de cuándo aparece algo iría en `src/game` (pura y con tests); el dibujo, en
`pixelScene/`. Actualizar CLAUDE.md y `docs/`.
