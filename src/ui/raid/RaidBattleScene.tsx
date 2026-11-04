import type { CSSProperties } from 'react'
import type { Biome } from '../../data/maps'
import { signatureMove } from '../../data/moves'
import { species } from '../../data/species'
import { BOSS_ID, presentMembers, RaidMemberKind, type Raid, type RaidMember } from '../../game/raid/raidRoom'
import { HitEffect } from '../route/HitEffect'
import { WalkScene } from '../route/WalkScene'
import { Bar, Sprite } from '../shared/common'
import { partySpot } from './partySpot'
import { roundClass } from './roundClass'
import { shownBossHp, visibleHits, type ReplayHit } from './roundReplay'
import '../route/battle.css'
import './raid-scene.css'

/** El jefe se ve más grande que el de una ruta */
const BOSS_SPRITE_SIZE = 168
const PARTY_SPRITE_SIZE = 96
/** Desfase del balanceo de cada Pokémon del grupo, para que no se muevan todos a la vez */
const IDLE_PHASE_S = 0.37

/** La pelea de la pestaña Raids: su propio paisaje, en una franja de la pantalla, con la pelea dentro */
export function RaidBattleScene({ raid, biome, timeScale }: { raid: Raid; biome: Biome; timeScale: number }) {
  return (
    <div className="raid-stage">
      <WalkScene biome={biome} moving={false} speed={1}>
        <RaidBattle raid={raid} timeScale={timeScale} />
      </WalkScene>
    </div>
  )
}

/**
 * La pelea contra el jefe sobre una escena de ruta (se pinta dentro de WalkScene, como RouteBattle): el jefe a la
 * derecha y el grupo a la izquierda en filas desordenadas. Los golpes de cada ronda salen uno tras otro (ver
 * roundReplay.ts): quien ataca embiste, quien lo recibe tiembla con su número y el destello del tipo
 */
export function RaidBattle({ raid, timeScale }: { raid: Raid; timeScale: number }) {
  // El del jugador, delante del todo
  const party = presentMembers(raid).sort((a, b) => Number(b.kind === RaidMemberKind.Player) - Number(a.kind === RaidMemberKind.Player))
  const hits = visibleHits(raid, timeScale)

  return (
    <div className="route-battle">
      {party.map((m, i) => (
        <PartyMon
          key={m.id}
          m={m}
          index={i}
          attack={hits.find((h) => h.from === m.id)}
          struck={hits.find((h) => h.from === BOSS_ID && h.to === m.id)}
          bossSpeciesId={raid.boss.speciesId}
          timeScale={timeScale}
        />
      ))}
      <BossFighter raid={raid} hits={hits} party={party} />
    </div>
  )
}

function BossFighter({ raid, hits, party }: { raid: Raid; hits: ReplayHit[]; party: RaidMember[] }) {
  const received = hits.filter((h) => h.to === BOSS_ID)
  const latest = received.at(-1)
  const hitter = latest && party.find((m) => m.id === latest.from)
  const attack = hits.find((h) => h.from === BOSS_ID)

  return (
    <div className="route-fighter enemy boss raid-boss-fighter">
      <div className="route-hp">
        <span className="tiny">
          <strong className="boss-label">JEFE </strong>
          <strong>{species(raid.boss.speciesId).name}</strong> Nv. {raid.boss.level}
        </span>
        <Bar value={shownBossHp(raid)} max={raid.maxHp} kind="hp" />
      </div>
      {received.map((h) => (
        <span key={h.seq} className="battle-pop hit">
          {h.dealt > 0 ? `-${h.dealt}` : 'Fallo'}
        </span>
      ))}
      {latest && latest.dealt > 0 && hitter && <HitEffect key={`fx-${latest.seq}`} type={signatureMove(hitter.speciesId).type} />}
      <div className={attack ? roundClass(attack.seq, 'raid-boss-lunge') : ''}>
        <div className={latest ? roundClass(latest.seq, 'raid-shake') : ''}>
          <div className="raid-idle boss">
            <Sprite id={raid.boss.speciesId} size={BOSS_SPRITE_SIZE} />
          </div>
        </div>
      </div>
    </div>
  )
}

interface PartyMonProps {
  m: RaidMember
  index: number
  /** Su golpe al jefe, si se está viendo ahora */
  attack?: ReplayHit
  /** El golpe del jefe, si se lo está llevando ahora */
  struck?: ReplayHit
  bossSpeciesId: number
  timeScale: number
}

function PartyMon({ m, index, attack, struck, bossSpeciesId, timeScale }: PartyMonProps) {
  const spot = partySpot(index, m.id)
  const down = m.downMs > 0
  const mine = m.kind === RaidMemberKind.Player
  const style = {
    left: `${spot.left}%`,
    bottom: `calc(var(--ground) + ${spot.rise}px)`,
    zIndex: spot.z,
    ['--spot-scale' as string]: spot.scale,
    ['--idle-delay' as string]: `${-index * IDLE_PHASE_S}s`,
  } as CSSProperties

  return (
    <div className={`raid-party-mon ${down ? 'down' : ''} ${mine ? 'mine' : ''}`} style={style}>
      {/* Con 10 en la escena, solo el del jugador lleva su barra; los PS de todos están en la lista de la sala */}
      {(mine || down) && (
        <div className="raid-party-hp">
          {mine && <span className="raid-mine-tag">Tú</span>}
          {down ? <span className="raid-revive">{Math.ceil(m.downMs / 1000 / timeScale)} s</span> : <Bar value={m.hpFraction} max={1} kind="hp" />}
        </div>
      )}
      {struck && (
        <span key={struck.seq} className="battle-pop hit">
          {struck.dealt > 0 ? `-${struck.dealt}` : 'Fallo'}
        </span>
      )}
      {struck && struck.dealt > 0 && <HitEffect key={`fx-${struck.seq}`} type={signatureMove(bossSpeciesId).type} />}
      <div className={attack ? roundClass(attack.seq, 'raid-lunge') : ''}>
        <div className={struck ? roundClass(struck.seq, 'raid-shake') : ''}>
          <div className={down ? '' : 'raid-idle'}>
            <Sprite id={m.speciesId} size={PARTY_SPRITE_SIZE} />
          </div>
        </div>
      </div>
    </div>
  )
}
