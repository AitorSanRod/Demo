/**
 * Aspecto de cada rancho, por orden de compra. PROVISIONAL: todos usan la misma imagen con otro tono hasta tener un
 * fondo propio para cada uno. Si hay más ranchos que aspectos, se repiten.
 */
const RANCH_FILTERS = ['none', 'hue-rotate(-35deg) saturate(1.2)', 'hue-rotate(160deg) saturate(0.8)', 'sepia(0.6) hue-rotate(-20deg)']

export const ranchFilter = (ranch: number): string => RANCH_FILTERS[ranch % RANCH_FILTERS.length]
