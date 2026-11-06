import type { CSSProperties } from 'react'
import type { Biome } from '../../data/maps'
import { signatureMove } from '../../data/moves'
import { species } from '../../data/species'
import { BOSS_ID, presentMembers, RaidMemberKind, type Raid, type RaidMember } from '../../game/raid/raidRoom'
import { inFinale, isEnding } from '../../game/raid/raidEnding'
import { useWatchRaid } from '../../net/raidSync'
import { BattleHud } from '../route/BattleHud'
import { HitEffect } from '../route/HitEffect'
import { WalkScene } from '../route/WalkScene'
import { Sprite } from '../shared/common'
import { partySpot } from './partySpot'
import { RaidFinale } from './RaidFinale'
import { roundClass } from './roundClass'
import { shownBossHp, visibleHits, type ReplayHit } from './roundReplay'
import '../route/battle.css'
import './raid-scene.css'

/** El jefe se ve más grande que el de una ruta */
const BOSS_SPRITE_SIZE = 168
const PARTY_SPRITE_SIZE = 96
/** Desfase del balanceo de cada Pokémon del grupo, para que no se muevan todos a la vez */
const IDLE_PHASE_S = 0.37
/** Carriles en los que salen los números sobre el jefe (izquierda, centro, derecha) y separación entre ellos */
const POP_LANES = 3
const POP_LANE_PX = 34

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
 * roundReplay.ts): quien ataca embiste, quien lo recibe tiembla con su número y el destello del tipo. El marcador del
 * jefe va a sus pies. Cuando la pelea se para, se ve entera la última ronda, el jefe cae y queda el cartel del final
 * (RaidFinale) hasta que se aplica el resultado
 */
export function RaidBattle({ raid, timeScale }: { raid: Raid; timeScale: number }) {
  useWatchRaid()
  // El del jugador, delante del todo
  const party = presentMembers(raid).sort((a, b) => Number(b.kind === RaidMemberKind.Player) - Number(a.kind === RaidMemberKind.Player))
  const hits = visibleHits(raid, timeScale)
  const won = inFinale(raid) && raid.hp === 0
  const boss = { speciesId: raid.boss.speciesId, name: species(raid.boss.speciesId).name, level: raid.boss.level, maxHp: raid.maxHp }

  return (
    <div className={`route-battle ${won ? 'raid-won' : ''}`}>
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
      <div className="battle-hud-slot enemy boss raid-boss-hud">
        <BattleHud fighter={boss} hp={shownBossHp(raid)} status={null} boss />
      </div>
      {inFinale(raid) && <RaidFinale raid={raid} />}
    </div>
  )
}

function BossFighter({ raid, hits, party }: { raid: Raid; hits: ReplayHit[]; party: RaidMember[] }) {
  const received = hits.filter((h) => h.to === BOSS_ID)
  const latest = received.at(-1)
  const hitter = latest && party.find((m) => m.id === latest.from)
  const attack = hits.find((h) => h.from === BOSS_ID)
  const felled = isEnding(raid) && shownBossHp(raid) === 0
  const isMine = (h: ReplayHit) => party.some((m) => m.id === h.from && m.kind === RaidMemberKind.Player)

  return (
    <div className={`route-fighter enemy boss raid-boss-fighter ${felled ? 'felled' : ''}`}>
      {/* Varios golpes a la vez: cada número sale un poco a un lado, y los del jugador, más grandes */}
      {received.map((h) => (
        <span
          key={h.seq}
          className={`battle-pop hit ${isMine(h) ? 'mine' : ''}`}
          style={{ ['--pop-x' as string]: `${((h.seq % POP_LANES) - 1) * POP_LANE_PX}px` } as CSSProperties}
        >
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
      {/* Sin barras sobre el grupo: los PS de todos están en la lista de la sala */}
      {mine && <span className="raid-mine-tag">Tú</span>}
      {down && <span className="raid-revive-count">{Math.ceil(m.downMs / 1000 / timeScale)}</span>}
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
