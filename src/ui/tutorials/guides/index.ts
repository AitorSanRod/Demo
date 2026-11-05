import { EVOLVE_GUIDE } from './evolveGuide'
import type { Guide } from './guide'
import { MONEY_GUIDE } from './moneyGuide'
import { PLAY_GUIDE } from './playGuide'
import { RAID_GUIDE } from './raidGuide'

/** Guías del menú Tutoriales, en el orden en que se muestran */
export const GUIDES: Guide[] = [PLAY_GUIDE, RAID_GUIDE, EVOLVE_GUIDE, MONEY_GUIDE]
