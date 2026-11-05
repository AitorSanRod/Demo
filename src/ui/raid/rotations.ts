import { RaidRotation } from '../../game/raid/online/protocol'

/** Nombre de cada rotación de jefes en las pestañas y en la lista de salas */
export const ROTATION_LABEL: Record<RaidRotation, string> = {
  [RaidRotation.Ordered]: 'En orden',
  [RaidRotation.Random]: 'Al azar',
}
