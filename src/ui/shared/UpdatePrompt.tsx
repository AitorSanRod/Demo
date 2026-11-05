import { dismissUpdate, reloadToUpdate, useAppUpdate } from '../../net/appUpdate'
import { ConfirmDialog } from './ConfirmDialog'

/** Aviso de versión nueva de la app: recargar ahora o más tarde (se vuelve a avisar al volver a la app) */
export function UpdatePrompt() {
  const { ready, dismissed } = useAppUpdate()
  if (!ready || dismissed) return null
  return (
    <ConfirmDialog title="Nueva versión disponible" confirmLabel="Recargar" cancelLabel="Más tarde" onConfirm={reloadToUpdate} onCancel={dismissUpdate}>
      <p className="small">Hay una versión nueva de Pokérancho. Recarga para usarla o cierra y vuelve a abrir la app. Tu partida no se pierde.</p>
    </ConfirmDialog>
  )
}
