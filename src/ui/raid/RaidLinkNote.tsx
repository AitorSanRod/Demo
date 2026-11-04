import type { Raid } from '../../game/raid/raidRoom'
import { useRaidOnline } from '../../net/raidSync'

/** Una línea sobre la sala compartida mientras se busca sitio en ella o si se ha perdido la conexión con el servidor */
export function RaidLinkNote({ raid }: { raid: Raid }) {
  const online = useRaidOnline()
  if (!raid.remote) return null
  if (raid.remote.roomId === null) return <p className="tiny muted">Buscando sala con otros jugadores…</p>
  if (online === false) return <p className="tiny muted">Sin conexión con el servidor: la pelea sigue allí, reintentando…</p>
  return null
}
