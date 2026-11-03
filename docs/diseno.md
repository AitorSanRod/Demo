# Diseño del juego

Documento vivo: describe las reglas **tal como están implementadas**. Si cambias una regla, cámbiala aquí.

## Idea

Juego idle para móvil inspirado en los digivice. El jugador solo decide antes de salir; durante la ruta todo es
automático. Entre rutas gestiona su equipo en el rancho y manda al resto de Pokémon de expedición.

**Nombres en la interfaz:** las piezas de cada especie se llaman «tickets de X» (p. ej. «ticket de Pikachu», icono de
cupón) y los tickets que se gastan en el gacha, «tickets de gacha». En el código y en este documento siguen siendo
`pieces` / piezas y `tickets`.

## Bucle principal

0. **Tutorial** (solo al empezar): tres Pokéball; cada una muestra la silueta de un inicial. Se elige uno a ciegas
   y se reciben 5 piezas suyas. Bocadillos guían a la Pokédex para combinarlas (el Pokémon sale como activo) y
   después a la primera ruta; al pulsar «¡En marcha!» el tutorial termina. Pasos en `state.tutorial`, ver
   `tutorial.ts`.
1. **Rancho**: pantalla completa, sin scroll, con el equipo de ese rancho paseando por el prado. Tocar un Pokémon
   abre su ficha a pantalla completa: arriba, sobre el paisaje de su primer tipo, nombre, nivel y ★, un arco con la
   EXP del nivel sobre el sprite y los PS debajo; abajo, por secciones: **Datos** (tipos, rareza, dónde está, stats y
   ataque), **Cuidados** (botones anchos para curar, entrenar
   (sin menús: − y + eligen las sesiones, el arco marca en amarillo hasta dónde llegará (si sube de nivel,
   pasa a ser el arco del nivel final con la EXP que tendrá ahí) y el nivel dice «+X»; al
   aceptar, el arco se llena animado nivel a nivel y cada nivel se celebra con un salto, destello, flechas doradas
   y «¡Nv. N!») y hacerlo compañero), **Tickets** (combinar y crear tickets con trozos), **Evolución** y
   **Mover a…** (otro rancho o la Caja). El corazón de la esquina superior derecha de la cabecera lo marca como favorito. Se cierra con el botón redondo ✕ de abajo. Arrastrándolo se deja en otro sitio del prado o, soltándolo sobre
   el botón de la Caja, se guarda en ella. Arriba, el contador de espacios (tocándolo se ve quién está fuera); con más de un
   rancho, flechas amarillas a los lados para pasar de uno a otro.
2. **Elegir ruta**: una línea por ruta, sobre la imagen de su zona difuminada, con su nombre, niveles, ✓ si está
   completada y «Comenzar» (las bloqueadas, con candado). «Comenzar» abre un diálogo con la cabecera de las fichas (paisaje de la ruta y el Pokémon que sale, con
   sus PS) y los Pokémon que pueden aparecer (los no vistos, como ¿ pixelada); «¡En marcha!» sale por el camino
   principal.
3. **Ruta automática**: el Pokémon activo camina de parada en parada. En cada una el rival aparece en la misma
   escena, el paisaje y los pasos se paran y combaten ahí, con sus barras de vida y el daño flotando. Tocar la
   pantalla suma pasos o, en combate, lo acelera.
4. **Fin**: completar la ruta (premio y desbloqueo de la siguiente, solo la primera vez) o caer derrotado (se pierde
   dinero). Repetir una ruta ya completada solo da lo de sus combates.
5. **Expediciones** (pestaña Ruta › Expediciones): el resto del equipo hace rutas por tiempo y vuelve con EXP,
   dinero, tickets, piezas y, a veces, Pokémon descubiertos; cuanto más larga, más rinde. Ahí se ve quién está fuera, se recoge a los que han vuelto y se envía a cualquiera del rancho. Una expedición en curso se puede cancelar (con confirmación): el Pokémon vuelve al rancho y no gana nada.
   Se puede usar también con la ruta del activo en marcha.
   Opcionalmente avisa con una notificación del sistema al volver (menú ⚙️ del rancho; solo con la app en
   segundo plano, no cerrada).
6. **Gacha**: cada ticket abre una Pokéball (animación de captura; tocarla la abre antes) con 5 piezas.
7. **Trituradora y MissingNo** (pestañas del gacha): las piezas que sobran se trituran en trozos de MissingNo, que
   se cambian por piezas del Pokémon que se quiera.
8. **Pokédex**: combinar 5 piezas iguales y pagar para crear el Pokémon o, si ya lo tienes, darle una ★. Solo se
   puede combinar una especie vista: en un combate de ruta, descubierta en una expedición o elegida como inicial.
   Las especies no vistas se muestran con una interrogación pixelada, tengan piezas o no (las que tienen piezas
   enseñan el contador y se pueden abrir); sus piezas se guardan y salen como ??? en gacha, trituradora y MissingNo.
   Las casillas listas para combinar brillan con un destello y la etiqueta «¡Crear!» (o «+1 ★»).
   Tocar una casilla abre exactamente la misma ficha que en el rancho (es el mismo componente), con todas sus
   secciones si lo tienes. Si no lo tienes, su paisaje con la silueta, tipos, rareza y
   ataque (sin stats) y «Crear Pokémon» en Tickets; sin descubrir, fondo oscuro con la ¿ pixelada y solo la rareza. Crear un Pokémon (y evolucionar, desde la Pokédex o el rancho) se ve como en los juegos: fondo oscuro,
   haces de luz y destellos, el Pokémon brillando en blanco (alternando con su evolución), un fogonazo y la
   revelación en color.
9. **Evolución** (ficha del rancho o de la Pokédex): un Pokémon con 5 ★ que tenga evolución puede evolucionar pagando. Se pierde y
   llega su evolución a Nv. 5 y sin ★, en su mismo rancho (tiene que caber); si ya la tenías, esa gana una ★ y
   conserva todo lo demás. Eevee elige entre sus tres.

Los premios del gacha, de las expediciones, del final de ruta y de cada combinación se muestran en una pantalla
a oscuras, de uno en uno, sin tarjetas: la imagen sobre un halo y el título debajo (`RewardOverlay`).

## Stats

Solo hay cuatro: **PS, Ataque, Defensa y Velocidad**. Se derivan de las 6 de PokeAPI en `species.ts ›
simplifyStats`. El ataque es el mayor entre el físico y el especial, así que un Pokémon especial pega con su
At. Esp. La defensa es la media de ambas defensas.

## Sistemas y dónde están sus números

| Sistema | Regla | Constantes |
|---|---|---|
| Pasos | `12 + vel. base × 0.15 + nivel × 0.25 + estrellas` pasos/min; cada toque suma 1 | `stats.ts › stepsPerMinute` |
| Offline | El progreso sigue con la app cerrada, máx. 12 h | `core/tick.ts › MAX_OFFLINE_MS` |
| Stats | Fórmula estilo Gen III sin IV/EV; +4% por estrella (máx. 5) | `stats.ts › STAR_BONUS, MAX_STARS` |
| EXP | Curva cúbica `(n+1)³ − n³`. Se gana con cada victoria (`nivel del rival × 3`, jefes ×2; nada si el rival tiene más de 3 niveles menos que el Pokémon), al completar una ruta por primera vez (`reward.exp`), en expediciones (la EXP de sus victorias × el multiplicador de duración) o entrenando con ₽. Pensado para que haga falta repetir una ruta varias veces para subir un nivel | `rewards.ts › EXP_PER_LEVEL, EXP_LEVEL_GAP`, `runBattle.ts › BOSS_EXP_MULT`, `stats.ts`, `kantoMaps.ts › reward.exp` |
| Ataque | Cada Pokémon (también los salvajes) tiene uno solo, fijo: el de su primer tipo y el escalón de su rareza (común ≈40, raro ≈85, épico ≈105, legendario 120 de potencia). No se elige ni cambia con el nivel | `moves.ts › signatureMove` |
| Combate | Automático por turnos; actúa primero el más rápido. Daño con Ataque contra Defensa, STAB ×1.5 y tabla de tipos. Máx. 25 turnos (luego el salvaje huye) | `battle.ts › MAX_TURNS, STAB` |
| Salvajes | Stats ×0.8 | `runBattle.ts › WILD_STAT_MULT` |
| Recompensas por combate | `⌈nivel × 0.5⌉ + 2..3` ₽ (3–7 ₽ de Nv. 2 a 8: Pueblo Paleta y Ruta 1), ticket según la rareza del salvaje (10 / 20 / 35 / 60%) y 1 pieza de su especie (5 / 4 / 3 / 2,5%); cura 25% al ganar. En expediciones se multiplican según la duración | `rewards.ts › MONEY_PER_LEVEL, MONEY_BONUS_RANGE, TICKET_DROP_CHANCE, PIECE_DROP_CHANCE`, `runBattle.ts › POST_WIN_HEAL` |
| Combate en ruta | 0,7 s por evento + 1,2 s final, en tiempo real (no le afecta `timeScale`); sin pasos mientras dura | `runBattle.ts › BATTLE_EVENT_MS, BATTLE_END_MS` |
| Jefes | Parada `boss`: siempre el mismo Pokémon a nivel fijo, con stats completas (sin el ×0.8). Da ₽ ×3, EXP ×2 y 1 ticket seguro; se ve más grande, con «JEFE» y un aviso al aparecer | `mapCommon.ts › boss()`, `runBattle.ts › BOSS_MONEY_MULT, BOSS_EXP_MULT, BOSS_TICKETS` |
| Derrota | Fin de la ruta y pérdida del 50% del dinero ganado en ella | `runBattle.ts › DEFEAT_MONEY_LOSS` |
| Expediciones | 15 min, 1 h o 4 h; 8 combates/h; victoria con probabilidad `nivel / nivel medio de la ruta` (mín. 20%). Sin derrota. Se puede cancelar antes de que vuelva, sin ningún premio (`cancelExpedition`). La EXP sale de las victorias (misma regla que en ruta). EXP, ₽, tickets y piezas ×1 / ×2 / ×4 según la duración. Cada combate puede descubrir una especie no vista: 15 / 10 / 7,5 / 5% (común / raro / épico / legendario). 1 Pokémon a la vez (+1 por mejora) | `expedition.ts › DURATION_REWARD_MULT, DISCOVERY_CHANCE, BASE_EXPEDITION_SLOTS` |
| Rancho | Regenera 10% PS/min (no en ruta, de expedición ni en la Caja); curar `5 + nivel × 3` ₽; entrenar `20 + 2 × nivel²` ₽ por sesión (25% de un nivel: 4 sesiones por nivel), varias seguidas de una vez (cada una cobra según el nivel al empezarla; no pasa del nivel máximo) | `ranch.ts › TRAIN_EXP_FRACTION, TRAIN_BASE_COST, TRAIN_COST_PER_LEVEL_SQ` |
| Espacios | Cada rancho tiene 10 espacios; un Pokémon ocupa 1 / 2 / 3 / 5 (común / raro / épico / legendario), también mientras está en ruta o de expedición. Lo que no cabe no se puede crear ni evolucionar. Los nuevos van al primer rancho con hueco | `ranches.ts › RANCH_SLOTS`, `RARITY_INFO.ranchSlots` |
| Caja | 8 Pokémon, 1 sitio cada uno sea cual sea su rareza. Solo guarda: no descansan, ni se gestionan, ni salen. Si se guarda el activo, pasa a serlo otro del rancho al azar (si no hay otro, no se puede) | `ranches.ts › BOX_SLOTS` |
| Tienda | Pestaña Tienda del menú inferior. Espacio de expedición: +1 hueco, 1 nivel, 500 ₽. Rancho nuevo: 3 niveles, 5000 / 15000 / 40000 ₽ (provisional, con el mismo fondo en otro tono: `ui/ranch/ranchLooks.ts`) | `upgrades.ts › UPGRADES` |
| Trituradora | En el gacha: cada pieza triturada da 1 / 1 / 2 / 3 trozos de MissingNo (común / raro / épico / legendario). Se marcan una a una o todas las de una rareza (botones de su color con el número de piezas) y se confirma. Los favoritos de la Pokédex no aparecen ni se pueden triturar | `shredder.ts › SHARDS_PER_PIECE`, `dex.ts › toggleFavorite` |
| MissingNo | En el gacha o desde la ficha de la Pokédex: piezas del Pokémon que elijas por 10 / 15 / 20 / 25 trozos cada una (común / raro / épico / legendario). Se eligen cuántas con − / + o «Máx.» (las que se pueden pagar) | `shredder.ts › PIECE_SHARD_PRICE, maxPiecesToBuy` |
| Gacha | 250 ₽/ticket (se compran varios de golpe con − / + o «Máx.»); 5 piezas por tirada, cada una con rareza 68/24/7/1% (según el total de las 4 stats base) | `gacha.ts › PIECES_PER_PULL, TICKET_PRICE, maxTicketsToBuy`, `species.ts › rarityOf` |
| Piezas | 5 iguales crean el Pokémon a Nv. 5 por 1000 / 2500 / 5000 / 10000 ₽ (común / raro / épico / legendario; el inicial del tutorial es gratis) o dan +1 ★ por 1000 ₽ (provisional); con 5 ★, se cambian por ₽ según rareza | `pieces.ts › PIECES_PER_COMBINE, STAR_PRICE`, `RARITY_INFO.createPrice, surplusMoney`, `mons.ts › NEW_MON_LEVEL` |
| Evolución | Con 5 ★ (y en el rancho), por 1000 ₽ (provisional): el Pokémon se va y llega su evolución a Nv. 5 sin ★ en su mismo rancho (si cabe), o la que ya tenías gana +1 ★ (no se puede si ya tiene 5). Si era el activo, la evolución pasa a serlo. Solo evoluciones dentro de la 1ª gen. | `evolution.ts › EVOLUTION_STARS, EVOLVE_PRICE`, `mons.ts › NEW_MON_LEVEL`, `data/evolutions.ts` |

Dificultad medida con 300 simulaciones por caso (Bulbasaur / Charmander / Squirtle), en tiempo real a x1:

| Ruta | Nivel del inicial | La completa | Duración |
|---|---|---|---|
| Pueblo Paleta (tutorial) | 5 | 100% | 2,7–3,1 min |
| Ruta 1 | 6 (tras el tutorial, sin entrenar) | 0 / 0 / 0% | — |
| Ruta 1 | 8 | 0 / 82 / 27% | ≈6 min |
| Ruta 1 | 10 | 56 / 100 / 99% | ≈6 min |
| Ruta 1 | 12 | 100 / 100 / 100% | ≈6 min |

El jefe de la Ruta 1 (Pidgeotto) está a Nv. 7 con stats completas: a Nv. 10 ya no lo ganaba ningún inicial a Nv. 10, y
Bulbasaur ni a Nv. 12 (Pidgeotto es más rápido y resiste planta). A Nv. 7 es donde más se pierde la ruta con un
inicial a Nv. 8–10.

El premio final de cada ruta (`reward` en `kantoMaps.ts`) solo se da la primera vez que se completa.

## Contenido actual

- Mapa de Kanto con 2 rutas activas, de camino único: Pueblo Paleta (tutorial, 4 combates, el último contra un jefe) y Ruta 1 (6 combates
  y el jefe Pidgeotto Nv. 7 al final, exige entrenar). Bosque Verde, Monte Moon y Ruta Marina están comentadas en
  `src/data/maps/kantoMaps.ts`; al reactivarlas hay que devolver `unlocks` a la ruta anterior.
- Los 151 Pokémon de 1ª generación, de PokeAPI, en `src/data/pokemon.json` (se regenera con
  `scripts/fetch-pokemon.mjs`).
- Existen nodos `start`, `wild` y `boss` (el final de Pueblo Paleta y el de la Ruta 1).

## Ideas previstas (no implementadas)

- Rutas con bifurcaciones: el modelo ya las admite, pero ahora se sale siempre por el camino principal. La idea es
  que la ruta se pare en cada cruce a la espera de que el jugador elija (y una opción para elegir siempre lo mismo).
- Tipos de nodo: `trainer`, `chest`, `rest`, `special`.
- Migración de partidas guardadas entre versiones.

Cuando una idea se implemente, muévela a la sección de sistemas.

## Iconos y fondos

- La interfaz no usa emojis: los iconos son sprites de objetos de los juegos, del repositorio de PokeAPI (los mismos
  que los sprites de Pokémon). Qué objeto representa cada cosa está en `ui/shared/icons.ts › ICON`; las partículas de
  los golpes son la gema de su tipo (`data/items.ts › typeGemSprite`).
- El fondo de la ficha depende del primer tipo del Pokémon (`ui/shared/sheet/scenery.ts › TYPE_SCENERY`; el de las rutas, por bioma, en `BIOME_SCENERY`). Son fondos de combate de
  Pokémon Showdown (`play.pokemonshowdown.com/fx/bg-*.png`), guardados en `src/assets/scenery`.
- Cada ruta de la lista lleva detrás la imagen de su zona (`backdrop` en `kantoMaps.ts`: `image` y `focusY`, el % vertical
  de la imagen que se ve). Son mapas y capturas de la wiki de Pokémon en Fandom (HeartGold/SoulSilver y
  FireRed/LeafGreen), guardados en `src/assets/routes`; los de Bosque Verde, Mt. Moon y Ruta 19 ya están para cuando se
  reactiven esas rutas.

## Aviso legal

Los datos y sprites de Pokémon son propiedad de Nintendo / Game Freak / The Pokémon Company. Proyecto solo para uso
personal: no publicar ni monetizar.
