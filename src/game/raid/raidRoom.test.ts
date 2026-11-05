import { describe, expect, it } from 'vitest'
import { newMember, RaidMemberKind, rosterMembers, type Raid, type RaidMember } from './raidRoom'

const member = (id: string, kind: RaidMemberKind, left = false): RaidMember => ({
  ...newMember({ id, kind, trainer: id, speciesId: 1, level: 1, stars: 0 }),
  left,
})

describe('rosterMembers', () => {
  it('pone primero al jugador, después a los demás jugadores y al final a los bots, por orden de llegada', () => {
    const members = [
      member('bot1', RaidMemberKind.Bot),
      member('otro1', RaidMemberKind.Guest),
      member('yo', RaidMemberKind.Player),
      member('bot2', RaidMemberKind.Bot),
      member('otro2', RaidMemberKind.Guest),
    ]
    const raid = { members } as Raid
    expect(rosterMembers(raid).map((m) => m.id)).toEqual(['yo', 'otro1', 'otro2', 'bot1', 'bot2'])
  })

  it('no incluye a los que ya se fueron', () => {
    const raid = { members: [member('yo', RaidMemberKind.Player), member('ido', RaidMemberKind.Guest, true)] } as Raid
    expect(rosterMembers(raid).map((m) => m.id)).toEqual(['yo'])
  })
})
