import { describe, expect, it, vi } from 'vitest'
import { RouteId } from '../../data/maps'
import { STARTERS } from '../../data/species'
import { startRun } from '../run/run'
import { EXPEDITION_DURATIONS, sendExpedition } from '../team/expedition'
import { createMon } from '../team/mons'
import { CLIENT_TOPICS, MAX_CLIENT_JOBS, MAX_PUSH_AHEAD_MS, parseClientJobs, PushTopic } from './push'
import { clientPushPlan, predictRunEnd } from './pushPlan'
import { initialState } from './state'
import { chooseStarter } from './test-utils'

vi.mock('../../data/maps/kantoMaps', () => import('./test-map'))

const NOW = 1_000_000

function withExpedition() {
  const s = initialState()
  chooseStarter(s, STARTERS[0])
  const mon = createMon(STARTERS[1], s.owned[0].level, 0)
  s.owned.push(mon)
  sendExpedition(s, mon.uid, RouteId.PuebloPaleta, EXPEDITION_DURATIONS[0])
  return { s, mon }
}

describe('avisos que programa el móvil', () => {
  it('cada expedición en curso avisa cuando vuelve', () => {
    const { s, mon } = withExpedition()
    expect(clientPushPlan(s, NOW)).toMatchObject([{ topic: PushTopic.Expedition, key: mon.uid, dueAt: NOW + EXPEDITION_DURATIONS[0] * 60_000 }])
  })

  it('una expedición que ya ha vuelto no avisa', () => {
    const { s } = withExpedition()
    s.expeditions[0].elapsedMin = s.expeditions[0].durationMin
    expect(clientPushPlan(s, NOW)).toEqual([])
  })

  it('con una ruta andando, avisa de cuándo acabará según la simulación', () => {
    const s = initialState()
    chooseStarter(s, STARTERS[0])
    startRun(s, RouteId.PuebloPaleta)
    const end = predictRunEnd(s, NOW)
    expect(end).not.toBeNull()
    expect(end!.at).toBeGreaterThan(NOW)
    expect(clientPushPlan(s, NOW)).toMatchObject([{ topic: PushTopic.Run, dueAt: end!.at }])
    // La simulación es sobre una copia: la partida no cambia
    expect(s.run!.stop).toBe(0)
  })

  it('sin ruta no hay aviso de ruta', () => {
    const s = initialState()
    expect(predictRunEnd(s, NOW)).toBeNull()
  })
})

describe('plan que acepta el servidor', () => {
  const job = { topic: PushTopic.Expedition, key: 'k', dueAt: NOW + 1000, title: 'Título', body: 'Texto' }

  it('acepta los avisos del móvil con fecha razonable', () => {
    expect(parseClientJobs([job], NOW)).toEqual([job])
    expect(parseClientJobs([{ ...job, dueAt: NOW - 5 }], NOW)![0].dueAt).toBe(NOW)
  })

  it('rechaza temas que no programa el móvil, fechas lejanas, textos vacíos y planes demasiado largos', () => {
    const serverTopic = Object.values(PushTopic).find((t) => !CLIENT_TOPICS.includes(t))
    expect(parseClientJobs([{ ...job, topic: serverTopic }], NOW)).toBeNull()
    expect(parseClientJobs([{ ...job, dueAt: NOW + MAX_PUSH_AHEAD_MS + 1 }], NOW)).toBeNull()
    expect(parseClientJobs([{ ...job, title: '' }], NOW)).toBeNull()
    expect(parseClientJobs(Array(MAX_CLIENT_JOBS + 1).fill(job), NOW)).toBeNull()
  })
})
