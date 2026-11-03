/** Clase que alterna en cada ronda para que la animación de golpe vuelva a empezar sin remontar el sprite */
export const roundClass = (round: number, name: string) => `${name}-${round % 2}`
