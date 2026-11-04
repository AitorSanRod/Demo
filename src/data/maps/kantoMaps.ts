import palletTown from '../../assets/routes/pallet-town.webp'
import route1 from '../../assets/routes/route-1.webp'
import viridianForest from '../../assets/routes/viridian-forest.webp'
import { POKEMON } from '../pokemon'
import { RaidTier } from '../raidBosses'
import { Biome, boss, chain, enc, NodeKind, raidBoss, RouteId, type GameMap } from './mapCommon'

export const KANTO: GameMap = {
  id: 'kanto',
  name: 'Kanto',
  routes: [
    {
      // Tutorial: ~5,5 min con un inicial (≈21 pasos/min) y 4 combates, el último contra un jefe
      id: RouteId.PuebloPaleta,
      name: 'Pueblo Paleta',
      description: 'Tu primer paseo: da una vuelta por el pueblo antes de salir a la Ruta 1.',
      biome: Biome.PalletTown,
      backdrop: { image: palletTown, focusY: 45 },
      levels: [2, 3],
      encounters: enc([POKEMON.Pidgey, 40], [POKEMON.Rattata, 40], [POKEMON.Caterpie, 20]),
      reward: { tickets: 2, money: 350, exp: 150 },
      unlocks: RouteId.Ruta1,
      nodes: chain(
        { id: 's', name: 'Casa', kind: NodeKind.Start, steps: 0 },
        { id: 'a', name: 'Jardín', kind: NodeKind.Wild, steps: 30 },
        { id: 'b', name: 'Plaza', kind: NodeKind.Wild, steps: 35 },
        { id: 'c', name: 'Afueras', kind: NodeKind.Wild, steps: 20 },
        { id: 'e', name: 'Salida del Pueblo Paleta', kind: NodeKind.Boss, steps: 30, boss: boss(POKEMON.Togepi, 5) },
      ),
    },
    {
      // ~6 min y 7 combates, el último contra un jefe: con un inicial sin mejorar se pierde casi siempre
      id: RouteId.Ruta1,
      name: 'Ruta 1',
      description: 'El camino a Ciudad Verde. Más largo y peligroso de lo que parece.',
      biome: Biome.Meadow,
      backdrop: { image: route1, focusY: 40 },
      levels: [5, 8],
      encounters: enc([POKEMON.Pidgey, 30], [POKEMON.Rattata, 30], [POKEMON.Caterpie, 13], [POKEMON.Weedle, 13], [POKEMON.NidoranF, 7], [POKEMON.NidoranM, 7]),
      reward: { tickets: 2, money: 400, exp: 250 },
      unlocks: RouteId.Ruta1Boss,
      nodes: chain(
        { id: 's', name: 'Salida del pueblo', kind: NodeKind.Start, steps: 0 },
        { id: 'a', name: 'Prado', kind: NodeKind.Wild, steps: 25 },
        { id: 'b', name: 'Hierba alta', kind: NodeKind.Wild, steps: 25, levelBonus: 1 },
        { id: 'c', name: 'Arboleda', kind: NodeKind.Wild, steps: 20, encounters: enc([POKEMON.Caterpie, 40], [POKEMON.Weedle, 40], [POKEMON.Pidgey, 20]) },
        { id: 'd', name: 'Senda', kind: NodeKind.Wild, steps: 15 },
        { id: 'e', name: 'Campo', kind: NodeKind.Wild, steps: 25, encounters: enc([POKEMON.Rattata, 40], [POKEMON.NidoranF, 30], [POKEMON.NidoranM, 30]) },
        { id: 'f', name: 'Hierba crecida', kind: NodeKind.Wild, steps: 30, levelBonus: 2 },
        { id: 'g', name: 'Hierba crecida', kind: NodeKind.Boss, steps: 30, boss: boss(POKEMON.Rattata, 7) },
        { id: 'h', name: 'Entrada a Ciudad Verde', kind: NodeKind.Raid, steps: 45, boss: raidBoss(POKEMON.Pidgeotto, 12, RaidTier.Low, { soloMinutes: 3 }) },
      ),
    },
    {
      id: RouteId.Ruta1Boss,
      name: 'Ruta 1 - Jefe',
      description: 'El camino a Ciudad Verde. Más largo y peligroso de lo que parece.',
      biome: Biome.Meadow,
      backdrop: { image: route1, focusY: 40 },
      levels: [6, 10],
      encounters: enc([POKEMON.Pidgey, 30], [POKEMON.Rattata, 30], [POKEMON.Caterpie, 13], [POKEMON.Weedle, 13], [POKEMON.NidoranF, 7], [POKEMON.NidoranM, 7]),
      reward: { tickets: 1, money: 250, exp: 300 },
      unlocks: RouteId.BosqueVerde,
      nodes: chain(
        { id: 's', name: 'Ruta 1', kind: NodeKind.Start, steps: 0 },
        { id: 'a', name: 'Entrada a Bosque Verde', kind: NodeKind.Raid, steps: 30, boss: raidBoss(POKEMON.Pidgeotto, 10, RaidTier.Low, { soloMinutes: 3 }) },
      ),
    },
    {
      id: RouteId.BosqueVerde,
      name: 'Bosque Verde',
      description: 'Un bosque frondoso lleno de Pokémon bicho.',
      biome: Biome.Forest,
      backdrop: { image: viridianForest, focusY: 50 },
      levels: [9, 16],
      encounters: enc([POKEMON.Caterpie, 20], [POKEMON.Weedle, 20], [POKEMON.Metapod, 15], [POKEMON.Kakuna, 15], [POKEMON.Pidgey, 8], [POKEMON.Oddish, 8], [POKEMON.Bellsprout, 8], [POKEMON.Pikachu, 6]),
      reward: { tickets: 2, money: 400, exp: 350 },
      //unlocks: RouteId.MonteMoon,
      nodes: chain(
        { id: 's', name: 'Linde del bosque', kind: NodeKind.Start, steps: 0 },
        { id: 'a', name: 'Sotobosque', kind: NodeKind.Wild, steps: 80 },
        { id: 'b', name: 'Matorral', kind: NodeKind.Wild, steps: 90, encounters: enc([POKEMON.Oddish, 40], [POKEMON.Bellsprout, 40], [POKEMON.Caterpie, 20]) },
        { id: 'c', name: 'Tronco hueco', kind: NodeKind.Wild, steps: 80, encounters: enc([POKEMON.Metapod, 43], [POKEMON.Kakuna, 43], [POKEMON.Pikachu, 14]) },
        { id: 'd', name: 'Claro', kind: NodeKind.Wild, steps: 80, levelBonus: 1 },
        { id: 'e', name: 'Corazón del bosque', kind: NodeKind.Wild, steps: 70, levelBonus: 2, encounters: enc([POKEMON.Pikachu, 60], [POKEMON.Butterfree, 20], [POKEMON.Beedrill, 20]) },
        { id: 'f', name: 'Final', kind: NodeKind.Raid, steps: 45, boss: raidBoss(POKEMON.Nidorino, 17, RaidTier.Low, { soloMinutes: 6 }) },
        { id: 'g', name: 'Final', kind: NodeKind.Raid, steps: 45, boss: raidBoss(POKEMON.Nidorina, 17, RaidTier.Low, { soloMinutes: 6 }) },
      ),
    }
    // {
    //   id: RouteId.MonteMoon,
    //   name: 'Monte Moon',
    //   description: 'Cuevas oscuras donde dicen que caen meteoritos.',
    //   biome: Biome.Cave,
    //   backdrop: { image: mtMoon, focusY: 50 }, (importar '../../assets/routes/mt-moon.webp')
    //   levels: [7, 11],
    //   encounters: enc([POKEMON.Zubat, 25], [POKEMON.Geodude, 20], [POKEMON.Paras, 15], [POKEMON.Sandshrew, 10], [POKEMON.Ekans, 10], [POKEMON.Machop, 10], [POKEMON.Clefairy, 5], [POKEMON.Jigglypuff, 5]),
    //   reward: { tickets: 5, money: 300, exp: 800 },
    //   unlocks: RouteId.RutaMarina,
    //   nodes: chain(
    //     { id: 's', name: 'Entrada a la cueva', kind: NodeKind.Start, steps: 0 },
    //     { id: 'a', name: 'Galería', kind: NodeKind.Wild, steps: 90 },
    //     { id: 'b', name: 'Túnel de rocas', kind: NodeKind.Wild, steps: 100, encounters: enc([POKEMON.Geodude, 50], [POKEMON.Sandshrew, 25], [POKEMON.Machop, 25]) },
    //     { id: 'c', name: 'Charca subterránea', kind: NodeKind.Wild, steps: 90, encounters: enc([POKEMON.Zubat, 45], [POKEMON.Paras, 33], [POKEMON.Ekans, 22]) },
    //     { id: 'd', name: 'Cráter lunar', kind: NodeKind.Wild, steps: 100, levelBonus: 1, encounters: enc([POKEMON.Clefairy, 45], [POKEMON.Jigglypuff, 33], [POKEMON.Zubat, 22]) },
    //     { id: 'e', name: 'Cima del monte', kind: NodeKind.Wild, steps: 80, levelBonus: 3, encounters: enc([POKEMON.Clefairy, 33], [POKEMON.Geodude, 33], [POKEMON.Golbat, 17], [POKEMON.Graveler, 17]) },
    //   ),
    // },
    // {
    //   id: RouteId.RutaMarina,
    //   name: 'Ruta Marina',
    //   description: 'Islotes y corrientes. Hay que nadar mucho.',
    //   biome: Biome.Sea,
    //   backdrop: { image: route19, focusY: 15 }, (importar '../../assets/routes/route-19.webp')
    //   levels: [13, 18],
    //   encounters: enc([POKEMON.Tentacool, 22], [POKEMON.Magikarp, 17], [POKEMON.Psyduck, 13], [POKEMON.Poliwag, 13], [POKEMON.Horsea, 9], [POKEMON.Krabby, 9], [POKEMON.Staryu, 9], [POKEMON.Shellder, 8]),
    //   reward: { tickets: 6, money: 450, exp: 1800 },
    //   nodes: chain(
    //     { id: 's', name: 'Playa', kind: NodeKind.Start, steps: 0 },
    //     { id: 'a', name: 'Bajío', kind: NodeKind.Wild, steps: 100 },
    //     { id: 'b', name: 'Arrecife', kind: NodeKind.Wild, steps: 110, encounters: enc([POKEMON.Staryu, 34], [POKEMON.Shellder, 33], [POKEMON.Krabby, 33]) },
    //     { id: 'c', name: 'Mar abierto', kind: NodeKind.Wild, steps: 100, encounters: enc([POKEMON.Tentacool, 40], [POKEMON.Horsea, 30], [POKEMON.Magikarp, 30]) },
    //     { id: 'd', name: 'Cala', kind: NodeKind.Wild, steps: 110, levelBonus: 2, encounters: enc([POKEMON.Psyduck, 38], [POKEMON.Poliwag, 37], [POKEMON.Slowpoke, 25]) },
    //     { id: 'e', name: 'Remolino', kind: NodeKind.Wild, steps: 90, levelBonus: 3, encounters: enc([POKEMON.Tentacruel, 40], [POKEMON.Gyarados, 20], [POKEMON.Starmie, 20], [POKEMON.Golduck, 20]) },
    //   ),
    // },
  ],
}
