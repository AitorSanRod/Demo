import { PUSH_TOPICS, PushTopic } from '../../game/core/push'
import { AccountStatus, useAccount } from '../../net/account'
import { PushStatus, setPushTopics, usePush } from '../../net/push'
import { AccountModal } from '../account/AccountModal'

const TOPIC_TEXT: Record<PushTopic, { title: string; detail: string }> = {
  [PushTopic.Expedition]: { title: 'Expedición de vuelta', detail: 'Cuando un Pokémon termina su expedición' },
  [PushTopic.Run]: { title: 'Fin de la ruta', detail: 'Cuando tu Pokémon acaba la ruta, se debilita o llega al jefe (hora aproximada)' },
  [PushTopic.Gift]: { title: 'Obsequio diario listo', detail: 'Cuando vuelve a poderse recoger (con cuenta)' },
  [PushTopic.Raid]: { title: 'Jefes de Raids', detail: 'Cuando cae un jefe contigo dentro, se escapa o aparece el siguiente' },
}

const STATUS_TEXT: Partial<Record<PushStatus, string>> = {
  [PushStatus.Unsupported]: 'Este navegador no admite notificaciones. En iPhone, instala la app en la pantalla de inicio (iOS 16.4 o posterior).',
  [PushStatus.Denied]: 'Las notificaciones están bloqueadas para esta web en el navegador: permítelas en sus ajustes y vuelve a probar.',
  [PushStatus.Refused]: 'El navegador no ha dejado activar los avisos. En iPhone, instala la app en la pantalla de inicio; en el ordenador, revisa que no estén bloqueados para esta web.',
  [PushStatus.Unavailable]: 'No se ha podido conectar con el servidor de avisos. Prueba otra vez más tarde.',
}

/** Ajustes › Notificaciones: un botón para todos los avisos y un interruptor por tipo (llegan aunque la app esté cerrada) */
export function NotificationsDialog({ onClose }: { onClose: () => void }) {
  const push = usePush()
  const { status } = useAccount()
  const all = push.topics.length === PUSH_TOPICS.length
  const toggle = (topic: PushTopic) => void setPushTopics(push.topics.includes(topic) ? push.topics.filter((t) => t !== topic) : [...push.topics, topic])
  const disabled = push.busy || push.status === PushStatus.Unsupported

  return (
    <AccountModal title="Notificaciones" onClose={onClose}>
      <p className="tiny muted">Llegan aunque la app esté cerrada. Se pueden quitar cuando quieras.</p>
      {STATUS_TEXT[push.status] && <p className="small account-error">{STATUS_TEXT[push.status]}</p>}
      <button className={`btn wide ${all ? '' : 'primary'}`} disabled={disabled} onClick={() => void setPushTopics(all ? [] : PUSH_TOPICS)}>
        {all ? 'Quitar todos los avisos' : 'Activar todos los avisos'}
      </button>
      <div className="notify-topics">
        {PUSH_TOPICS.map((topic) => (
          <label key={topic} className="notify-topic">
            <input type="checkbox" checked={push.topics.includes(topic)} disabled={disabled} onChange={() => toggle(topic)} />
            <span className="grow">
              <strong className="small">{TOPIC_TEXT[topic].title}</strong>
              <span className="tiny muted notify-detail">
                {TOPIC_TEXT[topic].detail}
                {topic === PushTopic.Gift && status !== AccountStatus.SignedIn && ' · Entra en tu cuenta para recibirlo'}
              </span>
            </span>
          </label>
        ))}
      </div>
      <button className="btn primary wide" onClick={onClose}>
        Aceptar
      </button>
    </AccountModal>
  )
}
