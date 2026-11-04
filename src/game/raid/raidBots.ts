import { BOT_TRAINERS } from '../../data/raidBosses'
import { Rarity, rarityOf, SPECIES } from '../../data/species'
import { randInt, type Rng } from '../core/random'
import { hasRoom, newMember, presentMembers, RaidMemberKind, type Raid } from './raidRoom'

// Bots que llenan la sala mientras no haya servidor. Con jugadores reales, este módulo se cambia por lo que diga el
// servidor sobre quién entra y quién sale.

/** Cuántos bots puede haber en una sala y cómo llegan */
export interface BotPolicy {
  /** Mínimo: si se va uno y quedan menos, entra otro enseguida */
  min: number
  max: number
  /** Bots que entran de media por minuto de juego mientras haya menos del máximo */
  joinPerMinute: number
}

/** Bots de la sala del jefe de la pestaña Raids: siempre hay de 2 a 5 */
export const RAID_BOTS: BotPolicy = { min: 2, max: 5, joinPerMinute: 0.06 }
/** Minutos de juego que se queda un bot, al azar entre ambos */
export const RAID_BOT_STAY_MINUTES: readonly [number, number] = [15, 90]
/** Niveles por debajo del jefe con los que llega un bot, al azar entre ambos */
export const RAID_BOT_LEVELS_BELOW_BOSS: readonly [number, number] = [0, 6]
/** Rarezas de las especies que llevan los bots */
const BOT_RARITIES: Rarity[] = [Rarity.Common, Rarity.Rare]

const botSpecies = () => SPECIES.filter((sp) => BOT_RARITIES.includes(rarityOf(sp)))

const presentBots = (raid: Raid) => presentMembers(raid).filter((m) => m.kind === RaidMemberKind.Bot)

const pick = <T>(list: T[], rng: Rng): T => list[Math.floor(rng() * list.length)]

/** Entra un bot nuevo en la sala */
export function addBot(raid: Raid, rng: Rng) {
  const busy = new Set(presentMembers(raid).map((m) => m.trainer))
  const free = BOT_TRAINERS.filter((t) => !busy.has(t))
  const [minBelow, maxBelow] = RAID_BOT_LEVELS_BELOW_BOSS
  const [minStay, maxStay] = RAID_BOT_STAY_MINUTES
  const bot = newMember(
    {
      id: `bot-${raid.nextBotId++}`,
      kind: RaidMemberKind.Bot,
      trainer: pick(free.length ? free : BOT_TRAINERS, rng),
      speciesId: pick(botSpecies(), rng).id,
      level: Math.max(1, raid.boss.level - randInt(minBelow, maxBelow, rng)),
      stars: 0,
    },
    1,
    randInt(minStay, maxStay, rng) * 60_000,
  )
  raid.members.push(bot)
}

/** Los bots cuyo tiempo se acaba se van; entra alguno nuevo al azar y siempre hay al menos el mínimo de `policy` */
export function updateBots(raid: Raid, ms: number, policy: BotPolicy, rng: Rng) {
  for (const bot of presentBots(raid)) {
    bot.stayMs = Math.max(0, bot.stayMs! - ms)
    if (bot.stayMs === 0) bot.left = true
  }
  while (presentBots(raid).length < policy.min && hasRoom(raid)) addBot(raid, rng)
  if (presentBots(raid).length < policy.max && hasRoom(raid) && rng() < (policy.joinPerMinute * ms) / 60_000) addBot(raid, rng)
}
