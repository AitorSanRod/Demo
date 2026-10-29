# Diseño del juego

Documento vivo: describe las reglas **tal como están implementadas**. Si cambias una regla, cámbiala aquí.

## Idea

Juego idle para móvil inspirado en los digivice. El jugador solo decide antes de salir; durante la ruta todo es
automático. Entre rutas gestiona su equipo en el rancho y manda al resto de Pokémon de expedición.

## Bucle principal

1. **Rancho**: todo el equipo pasea por el prado. Tocar un Pokémon abre su ficha: elegir su movimiento, curar,
   entrenar, hacerlo activo o mandarlo de expedición.
2. **Planificar**: elegir ruta y, si tiene bifurcaciones, el camino completo. Después, «¡En marcha!».
3. **Ruta automática**: el Pokémon activo camina de parada en parada. En cada una el rival aparece en la misma
   escena, el paisaje y los pasos se paran y combaten ahí, con sus barras de vida y el daño flotando. Tocar la
   pantalla suma pasos o, en combate, lo acelera.
4. **Fin**: completar la ruta (premio y desbloqueo de la siguiente) o caer derrotado (se pierde dinero).
5. **Expediciones**: el resto del equipo hace rutas por tiempo y vuelve con EXP, dinero y tickets. La pestaña
   Expediciones muestra quién está fuera, permite recoger a los que han vuelto y enviar a cualquiera del rancho
   (también se puede desde su ficha).
6. **Gacha**: cada ticket abre una Pokéball (animación de captura; tocarla la abre antes) con 5 piezas.
7. **Trituradora y MissingNo** (pestañas del gacha): las piezas que sobran se trituran en trozos de MissingNo,
   que se cambian por piezas del Pokémon que se quiera.
8. **Pokédex**: combinar 5 piezas iguales para desbloquear el Pokémon o, si ya lo tienes, darle una ★.

Los premios del gacha, de las expediciones, del final de ruta y de cada combinación se muestran en una pantalla
a oscuras, de uno en uno (`RewardOverlay`).

## Stats

Solo hay cuatro: **PS, Ataque, Defensa y Velocidad**. Se derivan de las 6 de PokeAPI en `species.ts ›
simplifyStats`. El ataque es el mayor entre el físico y el especial, así que un Pokémon especial pega con su
At. Esp. La defensa es la media de ambas defensas.

## Sistemas y dónde están sus números

| Sistema | Regla | Constantes |
|---|---|---|
| Pasos | `12 + vel. base × 0.15 + nivel × 0.25 + estrellas` pasos/min; cada toque suma 1 | `stats.ts › stepsPerMinute` |
| Offline | El progreso sigue con la app cerrada, máx. 12 h | `engine.ts › MAX_OFFLINE_MS` |
| Stats | Fórmula estilo Gen III sin IV/EV; +4% por estrella (máx. 5) | `stats.ts › STAR_BONUS, MAX_STARS` |
| EXP | Curva cúbica `(n+1)³ − n³`. Solo se gana al completar una ruta (`reward.exp`), al recoger una expedición (la misma EXP de su ruta) o entrenando con ₽. Los combates no dan EXP | `stats.ts`, `maps.ts › reward.exp` |
| Movimiento | El jugador lleva uno, elegido en el rancho. Si aprende otro más potente, lo equipa solo | `ranch.ts › setMove`, `stats.ts › gainExp` |
| Combate | Automático por turnos; actúa primero el más rápido. Daño con Ataque contra Defensa, STAB ×1.5 y tabla de tipos. Máx. 25 turnos (luego el salvaje huye) | `battle.ts › MAX_TURNS, STAB` |
| Salvajes | Stats ×0.8; usan al azar uno de sus 4 últimos movimientos | `runBattle.ts › WILD_STAT_MULT`, `moves.ts › wildMoves` |
| Recompensas por combate | `8 + nivel × 4 + 0..5` ₽, 15% de ticket; cura 25% al ganar | `rewards.ts`, `runBattle.ts › POST_WIN_HEAL` |
| Combate en ruta | 0,7 s por evento + 1,2 s final, en tiempo real (no le afecta `timeScale`); sin pasos mientras dura | `runBattle.ts › BATTLE_EVENT_MS, BATTLE_END_MS` |
| Derrota | Fin de la ruta y pérdida del 50% del dinero ganado en ella | `runBattle.ts › DEFEAT_MONEY_LOSS` |
| Expediciones | 15 min, 1 h o 4 h; 8 combates/h; victoria con probabilidad `nivel / nivel medio de la ruta` (mín. 20%). Sin derrota. 1 Pokémon a la vez (+1 por mejora) | `expedition.ts › BASE_EXPEDITION_SLOTS` |
| Rancho | Regenera 10% PS/min (no en ruta ni de expedición); curar `5 + nivel × 3` ₽; entrenar `20 + nivel × 8` ₽ (40% de un nivel) | `ranch.ts` |
| Tienda | Botón «Mejoras» del rancho. Espacio de expedición: +1 hueco, 1 nivel, 500 ₽ | `upgrades.ts › UPGRADES` |
| Trituradora | En el gacha: cada pieza triturada da 1 / 1 / 2 / 3 trozos de MissingNo (común / raro / épico / legendario). Se marcan una a una o «Todos los …» por rareza y se confirma. Los favoritos de la Pokédex no aparecen ni se pueden triturar | `shredder.ts › SHARDS_PER_PIECE`, `dex.ts › toggleFavorite` |
| MissingNo | En el gacha: 1 pieza del Pokémon que elijas por 10 / 15 / 20 / 25 trozos (común / raro / épico / legendario) | `shredder.ts › PIECE_SHARD_PRICE` |
| Gacha | 250 ₽/ticket; 5 piezas por tirada, cada una con rareza 68/24/7/1% (según el total de las 4 stats base) | `gacha.ts › PIECES_PER_PULL`, `species.ts › rarityOf` |
| Piezas | 5 iguales desbloquean el Pokémon (llega al 70% del nivel máximo del equipo, mín. 5) o dan +1 ★; con 5 ★, se cambian por ₽ según rareza | `pieces.ts › PIECES_PER_COMBINE`, `RARITY_INFO.dupeMoney` |
| Aprendizaje | Generado por tipo (3 niveles de potencia) | `moves.ts › learnset` |

Con la Ruta 1 en niveles 5–12, un inicial de Nv. 5 casi nunca la completa (≈0%): hay que entrenarlo antes.

## Contenido actual

- Mapa de Kanto con 4 rutas encadenadas (prado, bosque, cueva, mar), todas de camino único. Ver
  `src/data/maps.ts`.
- Los 151 Pokémon de 1ª generación, de PokeAPI, en `src/data/pokemon.json` (se regenera con
  `scripts/fetch-pokemon.mjs`).
- Solo existen nodos `start` y `wild`.

## Ideas previstas (no implementadas)

- Rutas con bifurcaciones: el modelo y el planificador ya las admiten; falta contenido.
- Tipos de nodo: `trainer`, `chest`, `rest`, `boss`, `special`.
- Migración de partidas guardadas entre versiones.

Cuando una idea se implemente, muévela a la sección de sistemas.

## Aviso legal

Los datos y sprites de Pokémon son propiedad de Nintendo / Game Freak / The Pokémon Company. Demo solo para uso
personal: no publicar ni monetizar.
