import type { PassiveRef } from '../../data/passives'
import { effectiveness } from '../../data/types'
import { attack } from '../battle/attack'
import { makeFighter, type Fighter } from '../battle/battle'
import type { Rng } from '../core/random'
import { BOSS_ID, type Raid, type RaidHit, type RaidMember } from './raidRoom'

/** Milisegundos de juego entre rondas: en cada una pegan todos los que están en pie y el jefe pega a uno al azar */
export const RAID_ROUND_MS = 4_000
/** Milisegundos de juego que tarda en revivir, con todos sus PS, un Pokémon debilitado en la sala */
export const RAID_REVIVE_MS = 30_000
/** Multiplicador del Ataque del jefe: pega a uno por ronda, y con su Ataque entero los debilitaría casi siempre */
export const RAID_BOSS_ATK_MULT = 0.35
/** Fracción máxima de los PS máximos de un Pokémon que le puede quitar el jefe de un golpe */
export const RAID_BOSS_MAX_HIT = 0.4

/** Pasivas que lleva un participante (las de su rancho, para los del jugador) */
export type PassivesOf = (m: RaidMember) => PassiveRef[]

const silent = () => {}

const isFighting = (m: RaidMember) => !m.left && m.downMs === 0

function memberFighter(m: RaidMember, passives: PassiveRef[]): Fighter {
  const f = makeFighter('player', m.speciesId, m.level, { stars: m.stars, passives })
  f.hp = Math.round(f.maxHp * m.hpFraction)
  return f
}

/** El jefe con su ataque rebajado y la vida compartida de la sala en vez de la suya */
function bossFighter(raid: Raid): Fighter {
  const boss = makeFighter('enemy', raid.boss.speciesId, raid.boss.level)
  boss.stats.atk = Math.max(1, Math.round(boss.stats.atk * RAID_BOSS_ATK_MULT))
  return { ...boss, hp: raid.hp, maxHp: raid.maxHp }
}

function knockOut(m: RaidMember) {
  m.hpFraction = 0
  m.downMs = RAID_REVIVE_MS
  if (m.lives !== null) m.lives = Math.max(0, m.lives - 1)
}

/** Golpe de `atk` a `def` con la fórmula de siempre; devuelve el daño hecho */
function strike(atk: Fighter, def: Fighter, rng: Rng): { dealt: number; eff: number } {
  const before = def.hp
  attack(atk, def, silent, rng)
  return { dealt: before - def.hp, eff: effectiveness(atk.move.type, def.types) }
}

/** Golpe del jefe: nunca quita más de RAID_BOSS_MAX_HIT de los PS máximos de un Pokémon */
function bossStrike(boss: Fighter, target: Fighter, rng: Rng): { dealt: number; eff: number } {
  const before = target.hp
  const hit = strike(boss, target, rng)
  const cap = Math.ceil(target.maxHp * RAID_BOSS_MAX_HIT)
  if (hit.dealt <= cap) return hit
  target.hp = Math.max(0, before - cap)
  return { ...hit, dealt: before - target.hp }
}

/** Una ronda: cada participante en pie pega al jefe y, si sigue vivo, el jefe pega a uno de ellos */
export function playRound(raid: Raid, passivesOf: PassivesOf, rng: Rng): RaidHit[] {
  const hits: RaidHit[] = []
  const boss = bossFighter(raid)
  const fighters = new Map(raid.members.filter(isFighting).map((m) => [m, memberFighter(m, passivesOf(m))]))

  for (const [m, f] of fighters) {
    if (boss.hp === 0) break
    const { dealt, eff } = strike(f, boss, rng)
    m.damage += dealt
    hits.push({ from: m.id, to: BOSS_ID, dealt, eff, fainted: boss.hp === 0 })
  }

  const standing = [...fighters].filter(([, f]) => f.hp > 0)
  if (boss.hp > 0 && standing.length > 0) {
    const [target, f] = standing[Math.floor(rng() * standing.length)]
    const { dealt, eff } = bossStrike(boss, f, rng)
    hits.push({ from: BOSS_ID, to: target.id, dealt, eff, fainted: f.hp === 0 })
  }

  for (const [m, f] of fighters) {
    if (f.hp === 0) knockOut(m)
    else m.hpFraction = f.hp / f.maxHp
  }
  raid.hp = boss.hp
  return hits
}

/** Pasa el tiempo de una ronda para los que están en la sala: cuenta su presencia y los debilitados se recuperan */
export function elapseRound(raid: Raid) {
  raid.elapsedMs += RAID_ROUND_MS
  for (const m of raid.members) {
    if (m.left) continue
    m.presentMs += RAID_ROUND_MS
    if (m.downMs === 0) continue
    m.downMs = Math.max(0, m.downMs - RAID_ROUND_MS)
    if (m.downMs === 0) m.hpFraction = 1
  }
}
