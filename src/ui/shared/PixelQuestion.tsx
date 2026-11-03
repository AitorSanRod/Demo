/** Dibujo de la interrogación, fila a fila: # es un píxel pintado */
const PIXELS = [
  '.####.',
  '##..##',
  '....##',
  '...##.',
  '..##..',
  '..##..',
  '......',
  '..##..',
]
const COLS = PIXELS[0].length

/** Interrogación pixelada que ocupa el sitio del sprite de una especie aún no descubierta */
export function PixelQuestion({ size }: { size: number }) {
  return (
    <svg className="pixel-question" width={size} height={size} viewBox={`-2 -1 ${COLS + 4} ${PIXELS.length + 2}`} shapeRendering="crispEdges" aria-label="Sin descubrir">
      {PIXELS.flatMap((row, y) => [...row].map((px, x) => (px === '#' ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} /> : null)))}
    </svg>
  )
}
