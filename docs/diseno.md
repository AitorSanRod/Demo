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
   ataque), **Cuidados** (entrenar
   (sin menús: − y + eligen las sesiones, el arco marca en amarillo hasta dónde llegará (si sube de nivel,
   pasa a ser el arco del nivel final con la EXP que tendrá ahí), el nivel dice «+X» y cada stat de Datos, cuánto
   subiría, también en amarillo; al
   aceptar, el arco se llena animado nivel a nivel y cada nivel se celebra con un salto, destello, flechas doradas
   y «¡Nv. N!»)), **Tickets** (combinar y crear tickets con trozos), **Evolución** y
   **Mover a…** (otro rancho o la Caja). El corazón de la esquina superior derecha de la cabecera lo marca como favorito; la Poké Ball de la izquierda (vacía, o roja y blanca si ya lo es) lo hace compañero de viaje, solo desde el rancho y sin ruta en curso. La poción de abajo a la izquierda lo cura: dice el precio y pide aceptar o cancelar (gris si tiene todos los PS, no está en el rancho o no hay dinero). Se cierra con el botón redondo ✕ de abajo. Arrastrándolo se deja en otro sitio del prado o, soltándolo sobre
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
6. **Jefes comunitarios** (pestaña Ruta › Raids): hay un jefe grande activo; al caer, la sala se vacía y el siguiente
   de la lista aparece a los 15 minutos de juego. Mientras tanto la pestaña muestra la escena vacía con el siguiente
   jefe en silueta y la cuenta atrás «Aparece en mm:ss» (y el botón de recoger el premio); no se puede mandar a nadie. Se manda a un Pokémon concreto del rancho, con su propio hueco (no quita el de expedición
   ni bloquea al activo), y lucha solo, también con la app cerrada. La pelea se ve como un combate de ruta: el
   paisaje (el de la ruta o, en la pestaña, uno según el tipo del jefe), el jefe a la derecha con su barra «JEFE» y
   la sala (hasta 10) a la izquierda en filas al tresbolillo, cada uno algo movido para que no parezca una rejilla y
   los de atrás más pequeños. Los golpes de cada ronda salen uno tras otro a lo largo de ella (el del jefe, a mitad):
   quien ataca embiste, quien lo recibe tiembla con su número y el destello del tipo, y la vida del jefe baja golpe a
   golpe. En reposo se balancean y el jefe respira, así que la escena nunca está quieta; los debilitados se ven tumbados en gris con la
   cuenta atrás (en segundos) encima del sprite; sobre el grupo no hay barras. El tuyo lleva «Tú» a los pies; debajo, la vida del jefe, el tiempo estimado y la lista
   de la sala con el entrenador, nivel y PS de cada uno. La sala es compartida con otros jugadores (con servidor; ver «Salas compartidas»), y 2–5 bots entran y salen para rellenarla: si un jugador quiere entrar en una sala llena, sale un bot. Al caer el
   jefe cobra quien haya estado dentro al menos el 10% de la pelea o siga dentro al final, y tu Pokémon vuelve al
   rancho (no se queda para el siguiente). El premio se recoge en la misma pestaña. Se puede retirar al Pokémon
   cuando se quiera (con confirmación; avisa si aún no cobraría). Bajo la vida del jefe se ve cuánto tardará en caer
   al ritmo de los que hay en la sala.

   **Jefes comunitarios de ruta**: una ruta puede tener una parada de jefe comunitario (`NodeKind.Raid`). Al
   llegar, la ruta se para y empieza la pelea: se entra en una sala de esa parada si tiene hueco (máx. 10) y al
   jefe le queda más del 25% de vida; si no, se abre otra. Los que llegan después (otros jugadores y bots)
   se unen; un jugador que llega a una sala llena echa a un bot. La pelea es la misma que en la pestaña Raids, pero sin salir de la vista de la ruta: misma pantalla,
   mismo marcador arriba (con una línea del jefe y «Retirarse» en lugar de «Abandonar») y el grupo, con tu Pokémon
   dentro, luchando en la escena de la ruta; lo que tarda depende de quién luche (su vida
   es la que un Pokémon de su nivel tardaría ≈3 h en quitarle solo: uno de Nv. 100 lo tira en 1–2 min). Al caer,
   la ruta sigue o se completa (premio de ruta y desbloqueo). Tu Pokémon tiene 10 vidas contra el jefe de la parada
   (en la pestaña Raids no hay límite): al caer la décima vez sale de la sala, se recupera y vuelve al principio de la
   ruta (conserva lo ganado); al llegar otra vez a la parada entra en una sala en marcha con el jefe lo más cerca
   posible de la vida que tenía entonces (nunca por debajo del 25% para unirse). El premio del jefe es parte del de la ruta: se suma a
   lo ganado en ella y sale en su resumen final; no tiene nada que ver con la pestaña Raids. Retirarse cuenta como
   derrota: la ruta acaba sin el premio del jefe y se pierde la mitad del dinero ganado en ella. En la lista de rutas
   no se anuncia: el jefe se descubre al llegar a su parada.
7. **Gacha**: cada ticket abre una Pokéball (animación de captura; tocarla la abre antes) con 5 piezas.
8. **Trituradora y MissingNo** (pestañas del gacha): las piezas que sobran se trituran en trozos de MissingNo, que
   se cambian por piezas del Pokémon que se quiera.
9. **Pokédex**: combinar 5 piezas iguales y pagar para crear el Pokémon o, si ya lo tienes, darle una ★. Solo se
   puede combinar una especie vista: en un combate de ruta, descubierta en una expedición o elegida como inicial.
   Las especies no vistas se muestran con una interrogación pixelada, tengan piezas o no (las que tienen piezas
   enseñan el contador y se pueden abrir); sus piezas se guardan y salen como ??? en gacha, trituradora y MissingNo.
   La pantalla tiene un desplegable por Pokédex regional (cabecera con el mapa de la región difuminado; la de Kanto,
   abierta al entrar) y debajo la Nacional, con las especies que no caen en el rango de ninguna región
   (`data/pokedexes.ts › REGIONAL_DEXES`).
   Las casillas listas para combinar brillan con un destello y la etiqueta «¡Crear!» (o «+1 ★»).
   El aviso de cuántas hay se puede tocar para ver solo esas; el aspa del aviso quita el filtro.
   Tocar una casilla abre exactamente la misma ficha que en el rancho (es el mismo componente), con todas sus
   secciones si lo tienes. Si no lo tienes, su paisaje con la silueta, tipos, rareza y
   ataque (sin stats) y «Crear Pokémon» en Tickets; sin descubrir, fondo oscuro con la ¿ pixelada y solo la rareza. Crear un Pokémon (y evolucionar, desde la Pokédex o el rancho) se ve como en los juegos: fondo oscuro,
   haces de luz y destellos, el Pokémon brillando en blanco (alternando con su evolución), un fogonazo y la
   revelación en color.
10. **Evolución** (ficha del rancho o de la Pokédex): un Pokémon evoluciona al llegar al nivel de su evolución o, si
   es por piedra, gastando la piedra (a cualquier nivel), y pagando según la rareza de la evolución. Es el mismo
   Pokémon con otra especie: conserva nivel y EXP, pierde sus ★ y queda con todos sus PS. Se puede en el rancho o en
   la Caja (allí se queda); en un rancho se queda en el suyo si cabe y si no va al primero con hueco (el diálogo de
   confirmar lo dice); si no cabe en ninguno, o si ya tienes esa especie, el botón sale desactivado con el aviso. En
   la Pokédex la especie de antes vuelve a quedar como silueta (vista, no conseguida) y se puede volver a crear con
   sus piezas. Las piedras (Fuego, Agua, Trueno, Hoja y Lunar) se compran en la Tienda, sin límite, y se guardan
   hasta gastarlas. Eevee elige entre sus tres.

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
| Dinero | Todo el dinero que se gana (combates, expediciones, premio de ruta, premios de raid y tickets sobrantes convertidos en ₽) se multiplica por 1,15 y se redondea. Al ganar un combate, el premio sale en dos líneas: el ₽ (y el ticket o pieza que suelte) en amarillo y la EXP debajo, en azul | `rewards.ts › MONEY_GAIN_MULT, boostedMoney` |
| Recompensas por combate | `(⌈nivel × 0.5⌉ + 2..3) × 1,15` ₽ (3–8 ₽ de Nv. 2 a 8: Pueblo Paleta y Ruta 1), ticket según la rareza del salvaje (10 / 20 / 35 / 60%) y 1 pieza de su especie (5 / 4 / 3 / 2,5%); cura 25% al ganar. En expediciones se multiplican según la duración | `rewards.ts › MONEY_PER_LEVEL, MONEY_BONUS_RANGE, TICKET_DROP_CHANCE, PIECE_DROP_CHANCE`, `runBattle.ts › POST_WIN_HEAL` |
| Combate en ruta | 0,7 s por evento + 1,2 s final, en tiempo real (no le afecta `timeScale`); sin pasos mientras dura | `runBattle.ts › BATTLE_EVENT_MS, BATTLE_END_MS` |
| Jefes | Parada `boss`: siempre el mismo Pokémon a nivel fijo, con stats completas (sin el ×0.8). Da ₽ ×3, EXP ×2 y los tickets de `BOSS_TICKETS` (ahora 0) en vez de la probabilidad de un salvaje; se ve más grande, con «JEFE» y un aviso al aparecer | `mapCommon.ts › boss()`, `runBattle.ts › BOSS_MONEY_MULT, BOSS_EXP_MULT, BOSS_TICKETS` |
| Derrota | Fin de la ruta y pérdida del 50% del dinero ganado en ella | `runBattle.ts › DEFEAT_MONEY_LOSS` |
| Expediciones | 15 min, 1 h, 4 h u 8 h; 8 combates/h; victoria con probabilidad `nivel / nivel medio de la ruta` (mín. 20%). Sin derrota. Se puede cancelar antes de que vuelva, sin ningún premio (`cancelExpedition`). La EXP sale de las victorias (misma regla que en ruta). EXP, ₽, tickets y piezas de cada victoria ×1 / ×2,5 / ×3 / ×3 según la duración (con decimales, cada ticket o pieza suelta saca 2 o 3 al azar, de media 2,5; EXP y ₽ se redondean). Cada combate puede descubrir una especie no vista: 15 / 10 / 7,5 / 5% (común / raro / épico / legendario). 1 Pokémon a la vez (+1 por mejora) | `expedition.ts › EXPEDITION_DURATIONS, DURATION_REWARD_MULT, scaleCount, DISCOVERY_CHANCE, BASE_EXPEDITION_SLOTS` |
| Jefes comunitarios | Jefes en orden de la lista (`RAID_BOSSES`), con su Ataque ×0.35 (y nunca quita más del 40% de los PS máximos de un golpe) y una vida tal que un Pokémon neutral de su nivel tardaría ≈3 h solo (o los minutos que diga el jefe en `soloMinutes`: el de la Ruta 1, 10 min) (con tipos a favor o en contra, de 30 min a 6 h; con 2–5 bots, 30–75 min). Rondas de 4 s de juego: cada uno en pie pega al jefe con la fórmula de siempre (tipos, STAB, pasivas de su rancho) y el jefe pega a uno al azar. Debilitado, vuelve a los 30 s con todos sus PS. EXP: `nivel del jefe × 1` por minuto en pie. Sala de 10; 1 Pokémon del jugador. Un jefe puede pedir un nivel mínimo para entrar (`minLevel`; Snorlax, Nv. 10). Bots: 2–5 (entra uno más cada ≈17 min de media, al azar, pero nunca pasan más de 10 min sin que entre uno mientras haya hueco); la sala empieza vacía con cada jefe y los 2 mínimos entran al aparecer; se quedan 15–90 min, llegan 0–6 niveles por debajo del jefe, especies comunes o raras. Cobra quien estuvo ≥10% de la pelea o sigue dentro al caer; premio igual para todos: cada jefe lleva una categoría (`tier`: baja, media o alta) que elige su tabla de premios, y cada línea de la tabla se tira por separado. En las paradas de ruta se escribe con `raidBoss(especie, nivel, RaidTier.X, { soloMinutes })`. Tiempo estimado: se simulan 60 rondas con los que hay ahora en la sala (sin que entre ni salga nadie) y se divide la vida que queda entre su daño medio. Paradas de ruta (`NodeKind.Raid`): sin mínimo de bots, el primero entra a los 5 s y luego van llegando (uno cada ≈40 s de media) hasta llenar la sala; al llegar, 50% de encontrar una sala en marcha; se entra en una sala con hueco si al jefe le queda más del 25%; 10 vidas para el Pokémon del jugador (al gastarlas, vuelta al inicio de la ruta y reenganche a una sala con el jefe a la vida más cercana a la que dejó) | `data/raidBosses.ts › RAID_BOSSES (con minLevel y tier), RaidTier, RAID_PRIZE_TABLES`, `raidEngine.ts › RAID_SOLO_MINUTES` (o `soloMinutes` del jefe, en su mapa o en `RAID_BOSSES`), `raidEngine.ts › RAID_EXP_PER_MINUTE_PER_LEVEL`, `raid.ts › RAID_PLAYER_SLOTS, RAID_COOLDOWN_MS`, `stopRoom.ts › ROUTE_RAID_BOTS, ROUTE_RAID_FIRST_BOT_MS, ROUTE_RAID_JOIN_MIN_HP`, `routeRaid.ts › ROUTE_RAID_RUNNING_CHANCE, ROUTE_RAID_LIVES`, `raidCombat.ts › RAID_ROUND_MS, RAID_REVIVE_MS, RAID_BOSS_ATK_MULT, RAID_BOSS_MAX_HIT`, `raidEstimate.ts › ESTIMATE_ROUNDS`, `raidRoom.ts › RAID_ROOM_SIZE`, `raidBots.ts › RAID_BOTS (con maxGapMinutes)`, `raidPrizes.ts › RAID_MIN_PRESENCE` |
| Salas compartidas (servidor) | Las salas las juega el servidor con las mismas reglas y bots, en tiempo real (x1). Al entrar: la sala en la que ya estuvo el jugador o la que tenga más jugadores; si está llena, sale un bot. Sala de 10, un Pokémon por jugador. Con la app cerrada se pone al día como mucho 12 h de golpe; una sala sin consultas en 24 h se borra. Consultas: cada 5 s con la pelea en pantalla, cada 60 s con la app abierta en otra pestaña, ninguna con la app cerrada o en segundo plano. Apodo de hasta 14 letras | `online/sharedRoom.ts › ROOM_MAX_CATCHUP_MS`, `online/roomServer.ts › ROOM_TTL_MS`, `net/raidSync.ts › WATCH_SYNC_MS, BACKGROUND_SYNC_MS`, `online/protocol.ts › NICKNAME_MAX` |
| Ciclo del jefe de la pestaña Raids (servidor) | Un jefe por ciclo, igual para todos, con una sala principal siempre abierta. Al caer en la primera sala empieza la espera de 15 min y ya no se abren salas (se puede entrar en las que siguen peleando con jugadores). El siguiente aparece al acabar la espera si no queda ninguna sala con jugadores en pie; si alguna sigue, cuando acabe; como mucho 1 h después de la espera (el jefe se escapa de las que queden, sin premio) | `online/raidCycle.ts › CYCLE_COOLDOWN_MS (= raid.ts › RAID_COOLDOWN_MS), CYCLE_MAX_EXTRA_MS`, `online/tabRooms.ts › ROOMS_PER_REQUEST`, `net/raidFeed.ts › FEED_WATCH_MS, FEED_OWN_ROOM_MS` |
| Cuenta y partida en la nube | Opcional (email y contraseña; hay que confirmar el email). Contraseña de 8 caracteres o más. La partida se sube cada 2 min con la app delante y al ocultarla; gana la última subida. Al entrar con partida en los dos sitios, se elige cuál conservar. Partida de 1 MB como mucho | `net/account.ts › MIN_PASSWORD`, `net/cloudSync.ts › UPLOAD_EVERY_MS`, `game/core/cloudSave.ts › MAX_SAVE_BYTES` |
| Rancho | Regenera 10% PS/min (no en ruta, de expedición, contra el jefe ni en la Caja); curar `5 + nivel × 3` ₽; entrenar `20 + 2 × nivel²` ₽ por sesión (25% de un nivel: 4 sesiones por nivel), varias seguidas de una vez (cada una cobra según el nivel al empezarla; no pasa del nivel máximo) | `ranch.ts › TRAIN_EXP_FRACTION, TRAIN_BASE_COST, TRAIN_COST_PER_LEVEL_SQ` |
| Pasivas de rancho | Con 3 Pokémon de un tipo en el rancho del activo (cuentan todos los que pertenecen a él, estén donde estén, el activo incluido; los de dos tipos, en ambos), el activo gana el nivel 1 de la pasiva de ese tipo en las rutas; con 5, el nivel 2. Se suman todas. Dan stats, estados alterados (quemar, envenenar, paralizar, congelar, confundir), regeneración, robo de vida, reducción de daño, esquiva, crítico, cura al ganar o daño extra por tipo. Los jefes pueden llevar pasivas escritas en el mapa. Se ven en el botón de arriba a la izquierda del rancho. No cuentan en expediciones | `data/passives.ts` (umbrales, efectos y estados, para editar a mano), `team/ranchPassives.ts`, `battle/combatBonus.ts`, `battle/status.ts` |
| Tipos de rancho | Objetos que se compran en la Tienda (10000 ₽ los de un tipo, 25000 ₽ los de dos; como mucho 3 de cada uno, contando los colocados) y se ponen y quitan en un rancho desde su panel. En ese rancho hace falta un Pokémon menos de sus tipos para cada nivel de pasiva, y cambia el fondo (provisional: el prado con otro tono) | `data/ranchTypes.ts` (lista para editar a mano), `team/ranchTypes.ts`, `ui/ranch/ranchLooks.ts` |
| Espacios | Cada rancho tiene 10 espacios; un Pokémon ocupa 1 / 2 / 3 / 5 (común / raro / épico / legendario), también mientras está en ruta o de expedición. Lo que no cabe no se puede crear ni evolucionar. Los nuevos van al primer rancho con hueco | `ranches.ts › RANCH_SLOTS`, `RARITY_INFO.ranchSlots` |
| Caja | 8 Pokémon, 1 sitio cada uno sea cual sea su rareza. Solo guarda: no descansan, ni se gestionan, ni salen. Si se guarda el activo, pasa a serlo otro del rancho al azar (si no hay otro, no se puede) | `ranches.ts › BOX_SLOTS` |
| Tienda | Pestaña Tienda del menú inferior. Tipos de rancho (ver arriba). Piedras evolutivas (ver Evolución). Espacio de expedición: +1 hueco, 1 nivel, 500 ₽. Rancho nuevo: 3 niveles, 5000 / 15000 / 40000 ₽ (provisional, con el mismo fondo en otro tono: `ui/ranch/ranchLooks.ts`) | `upgrades.ts › UPGRADES` |
| Trituradora | En el gacha: cada pieza triturada da 1 / 1 / 2 / 3 trozos de MissingNo (común / raro / épico / legendario). Se marcan una a una o todas las de una rareza (botones de su color con el número de piezas) y se confirma. Los favoritos de la Pokédex no aparecen ni se pueden triturar | `shredder.ts › SHARDS_PER_PIECE`, `dex.ts › toggleFavorite` |
| MissingNo | En el gacha o desde la ficha de la Pokédex: piezas del Pokémon que elijas por 10 / 15 / 20 / 25 trozos cada una (común / raro / épico / legendario). Se eligen cuántas con − / + o «Máx.» (las que se pueden pagar) | `shredder.ts › PIECE_SHARD_PRICE, maxPiecesToBuy` |
| Gacha | 250 ₽/ticket (se compran varios de golpe con − / + o «Máx.»); 5 piezas por tirada, cada una con rareza 68/24/7/1% (según el total de las 4 stats base) | `gacha.ts › PIECES_PER_PULL, TICKET_PRICE, maxTicketsToBuy`, `species.ts › rarityOf` |
| Piezas | 5 iguales crean el Pokémon a Nv. 5 por 1000 / 2500 / 5000 / 10000 ₽ (común / raro / épico / legendario; el inicial del tutorial es gratis) o dan +1 ★ por 1000 ₽ (provisional); con 5 ★, se cambian por ₽ según rareza | `pieces.ts › PIECES_PER_COMBINE, STAR_PRICE`, `RARITY_INFO.createPrice, surplusMoney`, `mons.ts › NEW_MON_LEVEL` |
| Evolución | Por nivel (los de los juegos; las de intercambio: Alakazam 36, Machamp 40, Golem 40, Gengar 38) o por piedra (a cualquier nivel). Precio según la rareza de la evolución: común 1000, raro 2500, épico 5000, legendario 10000 ₽, más la piedra si hace falta. Conserva nivel y EXP, pierde las ★, PS llenos. No si ya tienes la especie. Piedras: 2000 ₽ cada una en la Tienda, sin límite | `data/evolutions.ts` (nivel o piedra de cada una), `species.ts › RARITY_INFO.evolvePrice`, `data/stones.ts`, `stones.ts › STONE_PRICE`, `evolution.ts` |

Dificultad medida con 300 simulaciones por caso (Bulbasaur / Charmander / Squirtle), en tiempo real a x1:

| Ruta | Nivel del inicial | La completa | Duración |
|---|---|---|---|
| Pueblo Paleta (tutorial) | 5 | 100% | 2,7–3,1 min |
| Ruta 1 | 6 (tras el tutorial, sin entrenar) | 0 / 0 / 0% | — |
| Ruta 1 | 8 | 0 / 82 / 27% | ≈6 min |
| Ruta 1 | 10 | 56 / 100 / 99% | ≈6 min |
| Ruta 1 | 12 | 100 / 100 / 100% | ≈6 min |

La tabla anterior se midió con un jefe normal (Pidgeotto Nv. 7) al final de la Ruta 1. Ahora el final es un jefe
comunitario (Pidgeotto Nv. 12): no se pierde la ruta por él, sino que tarda más o menos según el nivel del Pokémon y
quién haya en la sala.

El premio final de cada ruta (`reward` en `kantoMaps.ts`) solo se da la primera vez que se completa.

## Contenido actual

- Mapa de Kanto con 2 rutas activas, de camino único: Pueblo Paleta (tutorial, 4 combates, el último contra un jefe) y Ruta 1 (6 combates
  y el jefe comunitario Pidgeotto Nv. 12 al final). Bosque Verde, Monte Moon y Ruta Marina están comentadas en
  `src/data/maps/kantoMaps.ts`; al reactivarlas hay que devolver `unlocks` a la ruta anterior.
- Los 151 Pokémon de 1ª generación, de PokeAPI, en `src/data/pokemon.json` (se regenera con
  `scripts/fetch-pokemon.mjs`; los Pokémon de fuera de Kanto se añaden en su `NATIONAL_IDS`).
- Existen nodos `start`, `wild`, `boss` (el final de Pueblo Paleta) y `raid` (jefe comunitario: Pidgeotto Nv. 12 al final de la Ruta 1).

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
