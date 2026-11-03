/** Clase que alterna con cada golpe (`seq`) para que la animación vuelva a empezar sin remontar el sprite */
export const roundClass = (seq: number, name: string) => `${name}-${seq % 2}`
