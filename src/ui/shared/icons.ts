import { ITEM } from '../../data/items'

/** Qué objeto representa cada cosa de la interfaz; cambiar aquí cambia el icono en toda la app */
export const ICON = {
  Route: ITEM.TownMap,
  Ranch: ITEM.BerryPouch,
  Shop: ITEM.CoinCase,
  Gacha: ITEM.GreatBall,
  Dex: ITEM.PokeRadar,
  Expedition: ITEM.Bicycle,
  /** Jefe comunitario */
  Raid: ITEM.DynamaxBand,
  /** Ticket de gacha */
  Ticket: ITEM.Pass,
  /** Ticket de un Pokémon (las piezas del juego) */
  Piece: ITEM.Coupon,
  Shard: ITEM.CometShard,
  Shredder: ITEM.DnaSplicers,
  Settings: ITEM.VsSeeker,
  Notify: ITEM.SootheBell,
  /** Cuenta y partida en la nube */
  Account: ITEM.MemberCard,
  /** Obsequio diario */
  Gift: ITEM.MysteryEgg,
  /** Menú del rancho */
  Menu: ITEM.Xtransceiver,
  Box: ITEM.BoxLink,
  /** Mochila: lo comprado y aún sin usar */
  Bag: ITEM.ExplorerKit,
  Tutorials: ITEM.TeachyTv,
  Heal: ITEM.Potion,
  Rest: ITEM.FullRestore,
  Train: ITEM.RareCandy,
  Evolve: ITEM.MoonStone,
  Active: ITEM.PokeBall,
  Money: ITEM.AmuletCoin,
  Wins: ITEM.Protein,
  Exp: ITEM.ExpShare,
  Locked: ITEM.LockCapsule,
  /** Participante de una sala que no es un jugador */
  Bot: ITEM.PokeDoll,
} as const
