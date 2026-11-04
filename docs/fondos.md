# Fondos pixel art de las rutas

Cómo están hechos los fondos animados de la escena de paseo y cómo crear más. Los fondos **no son imágenes**: se
generan por código al abrir la primera ruta de cada bioma (semilla fija, siempre el mismo resultado) y se animan en un
`<canvas>`. El mismo código se usa en el juego y en el banco de pruebas.

Escenas hechas: **Prado** (bioma `Meadow`: Ruta 1 y Ruta 1 - Final), **Pueblo Paleta** (`PalletTown`, solo esa ruta)
y **Bosque Verde** (`Forest`). Cueva (`Cave`) y mar (`Sea`) siguen con el paisaje SVG antiguo de `ui/route/scenery/`.

## Índice

1. [Dónde está cada cosa](#dónde-está-cada-cosa)
2. [Cómo se trabaja](#cómo-se-trabaja)
3. [Guía de estilo](#guía-de-estilo)
4. [Cómo funciona el motor](#cómo-funciona-el-motor)
5. [Medidas de referencia](#medidas-de-referencia)
6. [Catálogo de piezas](#catálogo-de-piezas)
7. [Receta: escena nueva](#receta-escena-nueva)
8. [Llevar una escena al juego](#llevar-una-escena-al-juego)
9. [Problemas ya resueltos](#problemas-ya-resueltos)
10. [Pendiente](#pendiente)

## Dónde está cada cosa

```
src/ui/route/pixelScene/
  index.ts          bioma → escena (BUILDERS), PIXEL = 3, semilla fija y caché
  usePixelScene.ts  hook que anima la escena en dos lienzos dentro de WalkScene
  engine/           types (SceneDef, SceneLayer, Landmark, ParticleSystem), renderer, smoke
  paint/            pixmap, noise, shade, spheres, foliage  (herramientas de dibujo)
  elements/         piezas reutilizables entre escenas (árboles, casas, hierba…)
  scenes/<escena>/  palette, backdrop, near/plain/town, ground, particles, index
tools/scenery-lab/  banco de pruebas: index.html, main.ts (lista SCENES), lab.css
.claude/skills/fondos-pixel-art/   skill + capturas de referencia (referencias/)
```

Flujo en el juego: `WalkScene` → `pixelSceneFor(route.biome)` → si hay escena, `usePixelScene` crea un
`SceneRenderer` con dos lienzos (detrás y delante del Pokémon) y lo anima con `requestAnimationFrame`; si no, pinta
las capas SVG de `ui/route/scenery/`. La escena se genera una sola vez por bioma y queda en memoria.

Reglas de capa del proyecto: todo esto es dibujo, así que vive en `src/ui` (no en `src/game`) y no necesita tests.
Si algún día la escena depende del estado de la partida (p. ej. paradas que aparecen según los pasos), la regla de
*cuándo* va en `src/game` con sus tests y aquí solo el *qué se pinta*.

## Cómo se trabaja

1. `npm run dev` y abrir `http://localhost:5173/tools/scenery-lab/`. Controles: escena, semilla, tamaño de pantalla
   (móvil vertical por defecto), Pokémon de referencia (mismo GIF y escala que el juego), velocidad, caminar/parar,
   mostrar u ocultar cada capa y las partículas, un botón por parada («Parada: Cartel»…), paradas automáticas cada
   12 s y descargar las capas en PNG.
2. Para registrar una escena en el banco: añadirla a `SCENES` de `tools/scenery-lab/main.ts`.
3. Revisar siempre en **móvil** (390×720) y en **ancho** (960×540) antes de enseñar nada. Las capturas automáticas
   se hacen con puppeteer-core y Chrome contra `npx vite --port 5199` (ver la memoria *entorno-windows*).
4. Se itera con el usuario: se enseña, opina y se corrige. **Las decisiones de diseño las toma el usuario**; ante la
   duda, se pregunta (referencia, elementos, luz, tipo de camino…).
5. Una escena entra en el juego solo cuando el usuario da el visto bueno (ver
   [Llevar una escena al juego](#llevar-una-escena-al-juego)).

## Guía de estilo

Sale de muchas vueltas con el usuario. Referencias en `.claude/skills/fondos-pixel-art/referencias/`:
`prado-montanas.png` (prado), `pueblo-2d.png` (pueblo), `bosque-arboles-grandes.png` (bosque).

### Lo que funciona

1. **Simple, de juego de Pokémon, nunca realista.** Pocas piezas y mucho espacio liso. Si algo se ve recargado,
   sobra.
2. **Formas redondeadas y con poco detalle.** Las copas que gustan son **pocas bolas grandes (3–5) pintadas como una
   sola masa**: `domeCanopy` en los árboles redondos, `crownLobes` en los grandes del bosque, `distantTree` en los de
   fondo. Muchos bultos o nubes pequeñas se ven sobrecargados; una sola bola, un círculo perfecto: los dos extremos
   están mal.
3. **Colores planos y vivos**, 3–5 tonos por material y **sin tramado** (`DITHER = 0`). Luz siempre arriba a la
   izquierda.
4. **Contorno solo en el lado de sombra** (abajo/derecha), de un tono oscuro del mismo color, nunca negro. El lado
   iluminado se funde con lo de detrás. Nubes y colinas, sin contorno.
5. **Píxel ×3**: cada píxel de arte ocupa 3×3 de pantalla y todo se dibuja en enteros.
6. **Orgánico.** Elementos a varias profundidades (capas con distinto parallax), tamaños y alturas variados, huecos
   irregulares. Nada alineado en una fila.
7. **Nada se corta en seco.** Todo empieza y acaba con sentido: vallas con poste en los extremos, plazas con borde
   escalonado de baldosas, árboles con raíces, sombra y briznas en el pie, caminos que van de la puerta a una calle y
   que, si algo los tapa, siguen por detrás. Las transiciones son graduales (la copa se abre poco a poco hacia un
   claro, los rayos de luz se desvanecen).
8. **Superficies con vida.** Césped con degradado suave y alguna marca; casas cercanas con ladrillo; tierra con
   manchas muy suaves.
9. **Ritmo tranquilo.** Lo que cambia el suelo (plaza, raíces) va en tramos largos y de tarde en tarde (tesela
   ancha). Los efectos son esporádicos: humo a ratos y en pocas chimeneas; hojas de primer plano de vez en cuando.
10. **Bosque cerrado:** troncos gruesos, copas grandes acordes al tronco y bajas, fondo oscuro, nunca se ve el cielo
    por arriba.

### Rechazado por el usuario (no repetir)

Tramado visible · árboles de pisos rectos · copas de racimos realistas · copas que son un círculo perfecto · copas
sobrecargadas de bultos · seto continuo recargado · llanuras con muchas manchas o filas de árboles · pinos en el prado
· borde oscuro en la cara clara de las hojas · casas alineadas en una sola fila · casas superpuestas cuyo camino se
corta · vallas o caminos que acaban de golpe · el mismo árbol repetido todo el rato · césped plano · franjas sólidas
con borde recto · cielo visible por encima de las copas del bosque · suelo que cambia cada poco · humo continuo o en
todas las casas · rayos de luz que se cortan.

## Cómo funciona el motor

### Pixmap y teselas

`Pixmap` (`paint/pixmap.ts`) es un lienzo en memoria a resolución de arte. Con `wrapX` (por defecto) lo que se sale
por un lado aparece por el otro: así **cada capa es una tesela que se repite en horizontal sin costura**. Para que no
se note la costura:

- Dibujar con coordenadas que pueden pasarse del ancho (el wrap las coloca).
- Usar ruido periódico: `valueNoise(x, y, cell, period = pix.w, seed)` y `periodicWave(x, period, waves)` con un
  número entero de ciclos por tesela. Cualquier periodo tiene que dividir el ancho de la tesela.
- Para que algo aparezca **de vez en cuando**, usar una tesela ancha (500–1300 px de arte) con pocos elementos.

Colores: `hex('#rrggbb')`, `palette(...)` para rampas (de oscuro a claro) y `rgba(code, alpha)` para luces y brumas
semitransparentes. Un píxel a `TRANSPARENT` deja ver la capa de detrás.

### Escena y capas

Una escena es una `SceneDef` (`engine/types.ts`):

| Campo | Qué es |
|---|---|
| `sky(height)` | Fondo de toda la pantalla (degradado), para una altura dada en píxeles de arte |
| `layers` | Capas **de la más lejana a la más cercana** (es el orden de pintado) |
| `walkerBottom` | Altura de los pies del Pokémon sobre el borde inferior (el juego lo usa como `--ground`) |
| `particles?` | Sistema de partículas opcional (mariposas y pétalos en el prado) |
| `landmarks` | Elementos de las paradas (cartel, casa, fuente, tronco…) |

Cada `SceneLayer`:

| Campo | Qué es |
|---|---|
| `frames` | Una tesela, o varias si se mece (hierba, plantas, helechos) |
| `fps` | Fotogramas por segundo del balanceo |
| `anchor` + `offset` | Pegada arriba o abajo, a `offset` píxeles de arte de ese borde |
| `parallax` | Fracción de la velocidad del camino: 1 = con el suelo, 0 = quieta |
| `drift` | Movimiento propio en px/s aunque el Pokémon esté parado (nubes) |
| `plane` | `back` (detrás del Pokémon) o `front` (delante: hierba de delante y hojas de primer plano) |
| `emitters` | Puntos de la tesela que sueltan humo (chimeneas) |

Las escenas usan un ayudante `layer(id, label, frames, offset, parallax, extra)` en su `index.ts`.

### Paradas, partículas y humo

- **`Landmark`**: imagen que entra por la derecha al acercarse a una parada, pasa y se queda atrás. Lleva `parallax`
  (menos de 1 si está más lejos que el camino), `bottom` (altura de su base) y `afterLayer` (se pinta justo después
  de esa capa, para que lo de delante lo tape). En el banco de pruebas se lanzan con los botones de parada; **en el
  juego aún no se disparan** (ver [Pendiente](#pendiente)).
- **`ParticleSystem`**: `update(dt, pathSpeed, w, h)` y `draw(ctx)` en el lienzo de delante.
- **Humo** (`engine/smoke.ts`): cada emisor de una capa humea a ratos (encendido 4–9 s y apagado 10–26 s, a su aire).
  Las bocanadas viajan con su capa y guardan la altura relativa a ella.

### Bucle de animación

`SceneRenderer.update(dt)` avanza el desplazamiento de cada capa (`PATH_SPEED × velocidad × parallax + drift`), el
humo, las paradas y las partículas; `draw()` pinta cielo, capas en orden (con su humo y sus paradas detrás) y
partículas. `usePixelScene` ajusta los lienzos al tamaño de la escena (`ResizeObserver`), limita el paso a 0,1 s y
nunca lo deja negativo.

## Medidas de referencia

Todo en píxeles de arte (×3 en pantalla). Una pantalla de móvil tiene unos **130 de ancho y 240 de alto**.

Camino común (`PATH` en `scenes/meadow/ground.ts`, lo reutilizan las tres escenas): 72 de alto, con la hierba de atrás
en las filas 0–8, la tierra en 8–60 y la hierba de delante en 60–72. `walkerBottom = 34` (los pies quedan en mitad
del camino). `PATH_TOP = 64` es la altura del borde de atrás de la tierra.

Disposición típica (`offset` desde abajo):

| Capa | Prado | Pueblo | Bosque |
|---|---|---|---|
| Nubes | arriba 8 y abajo 128 | igual que el prado | — |
| Colinas lejanas / cercanas | 112 / 104 | 112 / 104 | — |
| Plano lejano | llanura 92 | casas lejanas 90 | árboles lejanos 70 |
| Plano medio | llanura 64 | casas 60 | árboles medios 62 |
| Arriba | — | — | rayos y copas (anclados arriba) |
| Cerca | árboles 68, plantas 69 | jardines 70 | árboles grandes 66, sotobosque 69 |
| Camino y hierba | 0, 61, 2 | 0, 61, 2 | 0, 61, 2 |
| Primer plano | hojas −10 | — | hojas −10 |

Parallax habitual: nubes 0,02–0,03 · colinas 0,05–0,1 · plano lejano 0,1–0,18 · medio 0,22–0,32 · copas del bosque
0,4 · cerca 0,6–0,75 · camino y hierba de atrás 1 · hierba de delante 1,15 · hojas de primer plano 1,6.

## Catálogo de piezas

### `paint/` (herramientas)

| Fichero | Qué ofrece |
|---|---|
| `pixmap` | `Pixmap` (`set`, `get`, `rect`, `stamp`, `toCanvas`), `hex`, `palette`, `rgba`, `TRANSPARENT` |
| `noise` | `makeRng(seed)`, `between`, `pick`, `hash`, `valueNoise` periódico, `periodicWave` y su pendiente |
| `shade` | `ramp(colors, t, x, y)`: elige tono de una rampa; `verticalGradient` |
| `spheres` | `paintSpheres`: volumen de esferas con contorno y líneas entre ellas (rocas) |
| `foliage` | `paintFoliage`: follaje de esferas con borde mordido, luz, manchas de hojas; `gaps: false` = sin huecos oscuros (lo habitual) |

### `elements/` (piezas reutilizables)

| Fichero | Piezas |
|---|---|
| `clouds` | `cumulus`: nube algodonosa sin contorno, sombra lila abajo |
| `trees` | `broadTree` (árbol de copa redonda `domeCanopy` con ramas, raíces y sombra), `treeBase`, `barkTone` |
| `forestTree` | `forestTree`: árbol grande del bosque, torcido e inclinado, copa de lóbulos acorde al tronco, distinto cada vez |
| `forest` | `distantTree` (árbol de fondo), `canopyBand` (copas que cuelgan de arriba con claros graduales), `lightRays` |
| `shrubs` | `bush`, `hedge` (fila de matas), `mossyRock`, `pine` (sin usar ahora; descartado en el prado) |
| `lawn` | `lawn` (césped con borde ondulado y degradado; devuelve su borde), `lane` (sendero o calle ondulada) |
| `grass` | `grassField`, `scatterTufts` + `tuftFrames` (matas que se mecen), `daisy`, `flower` |
| `leaves` | `makeClump` + `leafFrames`: matas de hojas que se mecen, estilo `FERN_LEAVES` o `BROAD_LEAVES` |
| `house` | `house(palette, width, scale)` con tejado, chimenea, ladrillo, puerta y ventanas; `chimneyTop` para el humo |
| `fence` | `picketFence` (valla blanca con postes en los extremos), `flowerBed` (parterre de flores de tallo alto) |
| `fountain`, `log`, `mushroom`, `signpost` | Fuente de plaza, tronco hueco, seta, cartel de madera con fuente 3×5 (añadir letras a `GLYPHS` si faltan) |

Piezas propias de cada escena que pueden servir de modelo: `meadow/plain.ts` (llanura en dos planos con árboles por
profundidad), `palletTown/town.ts` (filas de casas sin solape con calle y caminitos), `palletTown/ground.ts` (plaza
por baldosas con borde escalonado), `forest/backdrop.ts` (planos de árboles con matorral; copas y rayos alineados),
`forest/ground.ts` (tierra húmeda con raíces).

## Receta: escena nueva

1. **Preguntar** al usuario la referencia (captura) y qué quiere: elementos, luz, tipo de camino, paradas. Guardar la
   referencia en `referencias/`.
2. **Carpeta** `src/ui/route/pixelScene/scenes/<escena>/`, copiando la estructura de la escena más parecida:
   - `palette.ts`: todas las rampas, de oscuro a claro, con comentario de qué es cada tono. Nada de colores sueltos
     en los dibujos.
   - `backdrop.ts`: cielo y planos lejanos. Puede reutilizar los de otra escena (el pueblo usa los del prado).
   - `near.ts` (o `town.ts`, `plain.ts`…): planos cercanos.
   - `ground.ts`: camino (partir de `PATH`) y matas de los bordes.
   - `index.ts`: la `SceneDef` con la lista de capas y paradas.
3. **Registrar** en `SCENES` de `tools/scenery-lab/main.ts` y probar en móvil y ancho. Comprobar que no se ve el cielo
   donde no debe, que nada se corta en seco y que la repetición de las teselas no canta.
4. **Iterar** con el usuario hasta el visto bueno.
5. **Ficheros < 200 líneas**, identificadores en inglés, comentarios en español, constantes con nombre y comentario.
   Una pieza que sirva para otras escenas va a `elements/`.

Esqueleto de `index.ts`:

```ts
export function caveScene(seed: number): SceneDef {
  return {
    name: 'Cueva',
    sky,
    walkerBottom: 34,
    layers: [
      layer('far-rocks', 'Rocas lejanas', [farRocks(seed)], 80, 0.1),
      layer('path', 'Camino', [cavePath(seed)], 0, 1),
      layer('back-tufts', 'Hierba de atrás', backTufts(seed, SWAY_FRAMES), PATH_TOP - 3, 1, { fps: 5 }),
    ],
    landmarks: [],
  }
}
```

## Llevar una escena al juego

1. Añadir la escena a `BUILDERS` en `src/ui/route/pixelScene/index.ts` para su bioma.
2. Quitar el SVG de ese bioma de `ui/route/scenery/` (y lo que solo usaba él): nada de código muerto.
3. **Bioma nuevo** (como `PalletTown`): añadirlo a `Biome` en `data/maps/mapCommon.ts`, asignarlo a la ruta en
   `kantoMaps.ts` y darle imagen en `BIOME_SCENERY` (`ui/shared/sheet/scenery.ts`), que es la cabecera del diálogo de
   comenzar ruta. El bioma no se guarda en la partida, así que no hace falta subir `SAVE_VERSION`.
4. Las raids usan el fondo del bioma según el tipo del jefe (`ui/raid/RaidScene.tsx`): una escena nueva también
   cambia esas peleas.
5. Probar dentro del juego con una ruta en curso de ese bioma (se puede inyectar `pokerancho-save` montando el estado
   con `initialState`, `pickStarter`, `combine` y `startRun`) y pasar `npm run check`.
6. Actualizar este documento, CLAUDE.md y la skill si cambian piezas o estructura.

## Problemas ya resueltos

- **Primer fotograma con paso negativo**: el `now` de `requestAnimationFrame` puede ser anterior al inicial. El paso
  se limita a `[0, 0,1]` s y el índice de fotograma se calcula con módulo positivo.
- **Humo flotando tras redimensionar**: las bocanadas guardaban la altura de pantalla. Ahora guardan la altura
  relativa a su capa.
- **`erasableSyntaxOnly`**: el proyecto no admite propiedades declaradas en el constructor (`constructor(readonly w…)`);
  hay que declarar los campos aparte.
- **`ImageData` con arrays tipados**: copiar a un `Uint8ClampedArray` nuevo en vez de pasar el `buffer` del
  `Uint32Array`.
- **Refs en el render**: desestructurar lo que devuelve `usePixelScene` (`{ container, back, front }`) en vez de leer
  `canvas.back`, o el lint avisa.
- **Vitest tras parar Vite**: justo después de parar o arrancar el servidor, `vitest run` a veces da «30 failed, no
  tests» (`reading 'config'`). Es pasajero: se repite y pasa.
- **Scripts de edición en Windows**: los ficheros de `src` pueden tener CRLF y las comillas invertidas se rompen
  dentro de `node -e` en Git Bash. Mejor usar el editor o un script escrito en un fichero.

## Pendiente

- **Paradas en el juego**: que el cartel, la casa, la fuente o el tronco aparezcan al acercarse al nodo
  correspondiente. Hay que decidir con el usuario cómo se asigna cada elemento a cada parada (¿por nombre del nodo?,
  ¿un campo en `kantoMaps.ts`?) y cuándo entra (pasos que faltan). La regla irá en `src/game` con tests.
- **Cueva y mar**: siguen en SVG.
- `pine` (`elements/shrubs.ts`) no se usa ahora mismo; se guarda para un posible bosque de coníferas.
