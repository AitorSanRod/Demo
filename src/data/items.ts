import type { PokeType } from './types'

/** Objetos de PokeAPI que se usan como iconos de la interfaz (el valor es su nombre en el repositorio de sprites) */
export const ITEM = {
  TownMap: 'town-map',
  BerryPouch: 'berry-pouch',
  CoinCase: 'coin-case',
  GreatBall: 'great-ball',
  PokeRadar: 'poke-radar',
  PokeBall: 'poke-ball',
  Potion: 'potion',
  SuperPotion: 'super-potion',
  HyperPotion: 'hyper-potion',
  FullRestore: 'full-restore',
  RareCandy: 'rare-candy',
  MoonStone: 'moon-stone',
  FireStone: 'fire-stone',
  WaterStone: 'water-stone',
  ThunderStone: 'thunder-stone',
  LeafStone: 'leaf-stone',
  BoxLink: 'pokemon-box-link',
  Bicycle: 'bicycle',
  Pass: 'pass',
  Coupon: 'coupon-2',
  CometShard: 'comet-shard',
  DnaSplicers: 'dna-splicers',
  VsSeeker: 'vs-seeker',
  SootheBell: 'soothe-bell',
  AmuletCoin: 'amulet-coin',
  Protein: 'protein',
  ExpShare: 'exp-share',
  LockCapsule: 'lock-capsule',
  DynamaxBand: 'dynamax-band',
  MemberCard: 'member-card',
  MysteryEgg: 'mystery-egg',
  Xtransceiver: 'xtransceiver',
  PokeDoll: 'poke-doll',
  ExplorerKit: 'explorer-kit',
  TeachyTv: 'teachy-tv',
  LinkingCord: 'linking-cord',
  Nugget: 'nugget',
  OrangeMail: 'orange-mail',
  RelicCrown: 'relic-crown',
} as const
export type Item = (typeof ITEM)[keyof typeof ITEM]

const ITEMS = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items'

export const itemSprite = (item: Item): string => `${ITEMS}/${item}.png`

/** Gema del tipo (fire-gem, water-gem…): icono de un tipo, p. ej. en las partículas de un golpe */
export const typeGemSprite = (type: PokeType): string => `${ITEMS}/${type}-gem.png`
