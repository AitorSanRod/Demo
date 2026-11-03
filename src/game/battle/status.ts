import { STATUS_INFO, type StatusId } from '../../data/passives'
import type { Rng } from '../core/random'
import { heal } from './attack'
import { label, type Fighter, type Push } from './battle'

/** Le pone un estado si no tiene ya uno (como en los juegos, solo uno a la vez) */
export function inflictStatus(f: Fighter, status: StatusId, push: Push) {
  if (f.status || f.hp === 0) return
  f.status = status
  f.frozenTurns = STATUS_INFO[status].skipTurns ?? 0
  push({ kind: 'status', side: f.side, status, text: `¡${label(f)} ${STATUS_INFO[status].verb}!` })
}

/** Antes de atacar: si el estado le impide moverse este turno ('skip') o le hace golpearse a sí mismo ('self-hit') */
export function blockedByStatus(f: Fighter, push: Push, rng: Rng): 'skip' | 'self-hit' | null {
  if (!f.status) return null
  const info = STATUS_INFO[f.status]
  if (f.frozenTurns > 0) {
    f.frozenTurns--
    push({ kind: 'status', side: f.side, status: f.status, text: `${label(f)} está congelado y no se mueve.` })
    if (f.frozenTurns === 0) f.status = null
    return 'skip'
  }
  if (info.skipChance && rng() < info.skipChance) {
    push({ kind: 'status', side: f.side, status: f.status, text: `${label(f)} está paralizado y no se mueve.` })
    return 'skip'
  }
  if (info.selfHitChance && rng() < info.selfHitChance) return 'self-hit'
  return null
}

/** Final del turno: quemadura y veneno quitan PS; después, quien regenera recupera los suyos */
export function endOfTurn(fighters: Fighter[], push: Push) {
  for (const f of fighters) {
    const perTurn = f.status ? STATUS_INFO[f.status].damagePerTurn : undefined
    if (!perTurn || f.hp === 0) continue
    f.hp = Math.max(0, f.hp - Math.max(1, Math.floor(f.maxHp * perTurn)))
    push({ kind: 'hit', side: f.side, status: f.status!, text: STATUS_INFO[f.status!].name })
    if (f.hp === 0) push({ kind: 'faint', side: f.side, text: `¡${label(f)} se debilitó!` })
  }
  for (const f of fighters) if (f.hp > 0 && f.bonus.regen > 0) heal(f, f.maxHp * f.bonus.regen, push)
}
