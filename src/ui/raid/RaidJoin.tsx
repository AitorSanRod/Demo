import { useState } from 'react'
import { species } from '../../data/species'
import { findMon, MonPlace, monPlace, type GameState } from '../../game/core/state'
import { act } from '../../game/core/store'
import { joinRaid, leaveRaid, playerMembers, raidBlocker } from '../../game/raid/raid'
import { earnsPrize, presenceShare, RAID_MIN_PRESENCE } from '../../game/raid/raidPrizes'
import { RaidMemberKind, type Raid } from '../../game/raid/raidRoom'
import { ConfirmDialog } from '../shared/ConfirmDialog'
import { Sprite } from '../shared/common'
import { ICON } from '../shared/icons'
import { MonPicker } from '../shared/MonPicker'
import { BigAction } from '../shared/sheet/MonSheet'

const percent = (fraction: number) => `${Math.floor(fraction * 100)}%`

/** Tu Pokémon en la sala: su participación y retirarlo, o elegir a uno del rancho y mandarlo */
export function RaidJoin({ game, raid }: { game: GameState; raid: Raid }) {
  const mine = playerMembers(raid)[0]
  return mine ? <InRaid game={game} raid={raid} uid={mine.id} /> : <JoinPicker game={game} raid={raid} />
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

function JoinPicker({ game, raid }: { game: GameState; raid: Raid }) {
  const home = game.owned.filter((m) => monPlace(game, m.uid) === MonPlace.Ranch)
  const [selectedUid, setSelectedUid] = useState('')
  const mon = home.find((m) => m.uid === selectedUid) ?? home[0]
  const blocker = mon ? raidBlocker(game, mon.uid) : 'No queda ningún Pokémon en el rancho.'
  const secured = raid.members.some((m) => m.kind === RaidMemberKind.Player && earnsPrize(m, raid.elapsedMs))

  return (
    <>
      {secured && <p className="small muted">Ya tienes asegurado el premio de este jefe.</p>}
      <MonPicker mons={home} selectedUid={mon?.uid} onSelect={setSelectedUid} />
      {blocker && <p className="small muted">{blocker}</p>}
      <BigAction
        icon={ICON.Raid}
        label={mon ? `Mandar a ${species(mon.speciesId).name}` : 'Mandar a luchar'}
        className="primary"
        disabled={!!blocker}
        onClick={() => act((s) => joinRaid(s, mon.uid))}
      />
    </>
  )
}
