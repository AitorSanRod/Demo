import { ITEM } from '../../data/items'

/** Qué objeto representa cada cosa de la interfaz; cambiar aquí cambia el icono en toda la app */
export const ICON = {
  Route: ITEM.TownMap,
  Ranch: ITEM.BerryPouch,
  Shop: ITEM.CoinCase,
  Gacha: ITEM.GreatBall,
  Dex: ITEM.PokeRadar,
  Expedition: ITEM.Bicycle,
  /** Ticket de gacha */
  Ticket: ITEM.Pass,
  /** Ticket de un Pokémon (las piezas del juego) */
  Piece: ITEM.Coupon,
  Shard: ITEM.CometShard,
  Shredder: ITEM.DnaSplicers,
  Settings: ITEM.VsSeeker,
  Notify: ITEM.SootheBell,
  Box: ITEM.BoxLink,
  Heal: ITEM.Potion,
  Rest: ITEM.FullRestore,
  Train: ITEM.RareCandy,
  Evolve: ITEM.MoonStone,
  Active: ITEM.PokeBall,
  Money: ITEM.AmuletCoin,
  Wins: ITEM.Protein,
  Exp: ITEM.ExpShare,
  Locked: ITEM.LockCapsule,
} as const
