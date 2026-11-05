import { useState } from 'react'
import { species } from '../../data/species'
import { findMon, MonPlace, monPlace, type GameState } from '../../game/core/state'
import { act } from '../../game/core/store'
import { joinRaid, leaveRaid, raidBlocker } from '../../game/raid/raid'
import { playerMembers } from '../../game/raid/raidEngine'
import { earnsPrize, presenceShare, RAID_MIN_PRESENCE } from '../../game/raid/raidPrizes'
import { RaidMemberKind, type Raid } from '../../game/raid/raidRoom'
import { nickname } from '../../net/identity'
import { ConfirmDialog } from '../shared/ConfirmDialog'
import { Sprite } from '../shared/common'
import { ICON } from '../shared/icons'
import { MonPicker } from '../shared/MonPicker'
import { BigAction } from '../shared/sheet/MonSheet'
import { NicknameDialog } from './NicknameDialog'
import { RaidLinkNote } from './RaidLinkNote'

const percent = (fraction: number) => `${Math.floor(fraction * 100)}%`

/**
 * Tu Pokémon en la sala: su participación y retirarlo, o elegir a uno del rancho y mandarlo. `onJoin`: cómo se manda
 * (con servidor, a la sala que se está viendo); sin él, a la sala de la partida
 */
export function RaidJoin({ game, raid, onJoin }: { game: GameState; raid: Raid; onJoin?: (uid: string) => void }) {
  // Solo cuenta como tuyo si está en la partida de este dispositivo (con cuenta, puede estar luchando desde otro)
  const mine = playerMembers(raid).find((m) => findMon(game, m.id))
  return mine ? <InRaid game={game} raid={raid} uid={mine.id} /> : <JoinPicker game={game} raid={raid} onJoin={onJoin} />
}

function InRaid({ game, raid, uid }: { game: GameState; raid: Raid; uid: string }) {
  const [confirming, setConfirming] = useState(false)
  const member = playerMembers(raid)[0]
  const mon = findMon(game, uid)!
  const name = species(mon.speciesId).name

  return (
    <>
      <p className="small">
        {name} lleva el {percent(presenceShare(member, raid.elapsedMs))} de la pelea y ha hecho {member.damage} de daño. Recibe recompensas si llega al{' '}
        {percent(RAID_MIN_PRESENCE)} o si sigue dentro cuando caiga el jefe.
      </p>
      <RaidLinkNote raid={raid} />
      <BigAction icon={ICON.Ranch} label={`Retirar a ${name}`} onClick={() => setConfirming(true)} />
      {confirming && (
        <ConfirmDialog
          title="¿Retirarlo de la pelea?"
          confirmLabel="Retirar"
          cancelLabel="Que siga"
          onConfirm={() => {
            act((s) => leaveRaid(s, uid))
            setConfirming(false)
          }}
          onCancel={() => setConfirming(false)}
        >
          <div className="row gap">
            <Sprite id={mon.speciesId} size={64} animated={false} />
            <p className="small confirm-text">
              Vuelve al rancho con los PS que le queden.{' '}
              {earnsPrize({ ...member, left: true }, raid.elapsedMs)
                ? 'Ya ha luchado lo suficiente: cobrará cuando caiga el jefe.'
                : `Si se va ahora no cobrará: aún no llega al ${percent(RAID_MIN_PRESENCE)} de la pelea.`}
            </p>
          </div>
        </ConfirmDialog>
      )}
    </>
  )
}

function JoinPicker({ game, raid, onJoin }: { game: GameState; raid: Raid; onJoin?: (uid: string) => void }) {
  const home = game.owned.filter((m) => monPlace(game, m.uid) === MonPlace.Ranch)
  const [selectedUid, setSelectedUid] = useState('')
  // La primera vez se elige el apodo con el que te verán los demás jugadores
  const [naming, setNaming] = useState(false)
  const mon = home.find((m) => m.uid === selectedUid) ?? home[0]
  const blocker = mon ? raidBlocker(game, mon.uid, raid) : 'No queda ningún Pokémon en el rancho.'
  const send = () => {
    setNaming(false)
    if (onJoin) onJoin(mon.uid)
    else act((s) => joinRaid(s, mon.uid))
  }
  const secured = raid.members.some((m) => m.kind === RaidMemberKind.Player && earnsPrize(m, raid.elapsedMs))

  return (
    <>
      {secured && <p className="small muted">Ya tienes asegurado el premio de este jefe.</p>}
      {raid.boss.minLevel && <p className="small">Solo pueden entrar Pokémon de Nv. {raid.boss.minLevel} o más.</p>}
      <MonPicker mons={home} selectedUid={mon?.uid} onSelect={setSelectedUid} />
      {blocker && <p className="small muted">{blocker}</p>}
      <BigAction
        icon={ICON.Raid}
        label={mon ? `Mandar a ${species(mon.speciesId).name}` : 'Mandar a luchar'}
        className="primary"
        disabled={!!blocker}
        onClick={() => (nickname() ? send() : setNaming(true))}
      />
      {naming && <NicknameDialog onDone={send} onCancel={() => setNaming(false)} />}
    </>
  )
}
