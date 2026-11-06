# Servidor en Cloudflare (plan gratuito, sin tarjeta)

Pokérancho se publica como un **Worker de Cloudflare**: sirve la web (`dist/`) y una pequeña API en `/api/*` con una
base de datos **D1** (SQLite). Por la API van:

- **Salas compartidas** de los jefes comunitarios (pestaña Raids y paradas de ruta), sin cuenta.
- **Cuentas opcionales** con email y contraseña, para guardar la partida en la nube y seguirla en otro dispositivo.
  Los correos de confirmar la cuenta y recuperar la contraseña los manda **Brevo** (gratis, sin tarjeta).

Sin servidor (p. ej. con `npm run dev`) se juega todo igual en local: raids con bots y sin cuentas.

Cómo funciona por dentro: [arquitectura.md › Salas compartidas](arquitectura.md#salas-compartidas-servidor) y
[› Cuentas](arquitectura.md#cuentas-y-partida-en-la-nube).

## Qué hay montado

| Pieza | Dónde |
|---|---|
| Configuración del Worker: nombre, web, base de datos | `wrangler.jsonc` |
| Esquema de la base de datos (cuentas, sesiones, partidas, salas) | `migrations/0001_init.sql` |
| Entrada del Worker y rutas de la API | `worker/index.ts` |
| Salas: `POST /api/raid` | `worker/raid.ts` + `worker/db/rooms.ts` |
| Partida en la nube: `GET` / `POST /api/save` (solo con sesión) | `worker/save.ts` + `worker/db/saves.ts` |
| Cuentas: `/api/auth/*` (crear, confirmar, entrar, salir, recuperar, apodo) | `worker/auth/` + `worker/db/users.ts` |
| Obsequio diario: `GET` / `POST /api/gift` (solo con sesión) | `worker/gift.ts` + `worker/db/gifts.ts` |
| Intercambios: `GET` (tablón) / `POST /api/trade` (anunciar, aceptar, retirar, recoger; solo con sesión) | `worker/trade.ts` + `worker/tradeActions.ts` + `worker/db/trades.ts`, `tradeWrites.ts`; tablas en `migrations/0007_trades.sql` |
| Rankings de dinero y de daño a jefes: `GET /api/ranking` (solo con sesión, apodo y sin ocultarse; las fotos se rehacen cada hora). El daño lo apunta el propio servidor al terminar cada jefe (caer o escaparse), al guardar la sala: una escritura por Pokémon de jugador con cuenta | `worker/ranking.ts` + `worker/db/ranking.ts`, `worker/db/damageRanking.ts`; tablas en `migrations/0008_ranking.sql` y `0009_damage_ranking.sql` |
| Notificaciones push: `/api/push/*` y el envío (VAPID, cifrado) | `worker/push/` |
| Tarea programada cada minuto (raids sin nadie mirando, borrar paradas viejas, anuncios caducados, ranking cada hora, avisos que tocan) | `worker/scheduled.ts`, `triggers` en `wrangler.jsonc` |
| Correos (Brevo) y su texto | `worker/mail.ts` |
| Lógica del juego que usa el servidor (con tests) | `src/game/raid/online/`, `src/game/core/cloudSave.ts`, `accountRules.ts`, `ranking.ts` |
| Cliente: cuenta, partida en la nube, id y apodo, cada cuánto consulta | `src/net/` |

## Paso a paso: publicar

Necesitas Node 22 (ver `.nvmrc`) y el repositorio en GitHub.

### 1. Cuentas gratuitas

1. **Cloudflare**: crea una cuenta en <https://dash.cloudflare.com/sign-up>. No pide tarjeta.
2. **Brevo** (correos): crea una cuenta en <https://www.brevo.com/> con el plan *Free*. Tampoco pide tarjeta.

### 2. Crear la base de datos (desde tu ordenador, una vez)

En la carpeta del proyecto:

```bash
npm install
npx wrangler login              # abre el navegador para autorizar a Wrangler en tu cuenta de Cloudflare
npx wrangler d1 create pokerancho
```

El último comando escribe un `database_id` (un id largo con guiones). Pégalo en `wrangler.jsonc`, en
`d1_databases[0].database_id`, en lugar del de ceros. Después crea las tablas en la base de datos de verdad:

```bash
npm run db:migrate              # aplica migrations/ a la base de datos remota
```

Haz commit y push del `wrangler.jsonc` con el id.

### 3. Conectar el repositorio (despliegue automático)

1. En el panel de Cloudflare: *Workers & Pages → Create → Workers → Import a repository*.
2. Conecta GitHub, autoriza el acceso y elige el repositorio.
3. Configuración del proyecto:
   - *Project name*: `pokerancho` (tiene que coincidir con `name` de `wrangler.jsonc`).
   - *Build command*: `npm run build`
   - *Deploy command*: `npx wrangler deploy` (el que viene por defecto).
4. *Save and Deploy*. En un par de minutos la web queda en `https://pokerancho.<tu-subdominio>.workers.dev`.

Desde entonces, cada push a `main` vuelve a desplegar solo. GitHub Actions (`.github/workflows/check.yml`) pasa
`npm run check` en cada push para avisar si algo se ha roto.

### 4. Activar los correos (Brevo)

1. En Brevo: *Settings → Senders, domains & dedicated IPs → Senders → Add a sender*. Pon tu email (puede ser un
   Gmail) y confírmalo con el correo que te mandan. Ese será el remitente.
2. En Brevo: *SMTP & API → API keys → Generate a new API key*. Cópiala: solo se ve una vez.
3. En Cloudflare: *Workers & Pages → pokerancho → Settings → Variables and Secrets → Add*, dos veces, como tipo
   **Secret** (los secretos no se borran al desplegar):
   - `BREVO_API_KEY`: la clave de Brevo.
   - `MAIL_FROM`: el email del remitente verificado.

Sin estos dos secretos la web funciona, pero los correos no salen: el enlace se escribe en los registros del
Worker (*pokerancho → Logs*), útil para probar.

### 5. Activar las notificaciones push

Hacen falta unas claves VAPID (con ellas el servidor firma los avisos). Se generan y se guardan como secreto de una
vez, sin que se vean, desde la carpeta del proyecto:

```bash
node scripts/make-vapid-key.mjs | npx wrangler secret put VAPID_KEY
```

No hay que hacer nada más: la tarea programada de cada minuto ya va en `wrangler.jsonc`. No cambies las claves después:
cada navegador tendría que volver a activar los avisos. Sin ellas, Ajustes › Notificaciones dice que no puede conectar.

### 6. Probarlo

1. Abre la web en el móvil y en el ordenador (o en una ventana de incógnito: cuenta como otro jugador).
2. **Raids**: en los dos, termina el tutorial, ve a *Ruta › Raids* y manda un Pokémon (la primera vez pide el
   apodo). Los dos aparecen en la misma sala.
3. **Cuenta**: *Ajustes (engranaje) › Cuenta › Crear una cuenta*. Llega un correo (mira en spam); al abrir el
   enlace vuelves a la web con la sesión iniciada y la partida se sube sola. En otro dispositivo, en la pantalla del
   inicial, pulsa «¿Ya tienes cuenta? Entrar» y sigues con esa partida.
4. Instálala como app desde el móvil («Añadir a pantalla de inicio»).

## Probar en local

- `npm run dev`: solo la app, en <http://localhost:5173>. Sin servidor: raids con bots locales y sin cuentas.
- Con servidor: `npm run db:migrate:local` (una vez, crea la base de datos local en `.wrangler/`) y luego
  `npm run preview`, que compila y arranca el Worker en <http://localhost:8787> con el mismo runtime que Cloudflare.
  Los correos no salen: el enlace aparece en la terminal.

## Cambiar la base de datos

Un cambio de tablas es un fichero nuevo en `migrations/` (`0003_….sql`, el siguiente número libre); nunca se edita uno ya aplicado. Antes de
hacer push del código que lo usa, aplícalo con `npm run db:migrate` (y `npm run db:migrate:local` para probar).

## Lo que gasta del plan gratuito

Límites del plan gratuito de Cloudflare (se renuevan cada día; si se pasan, la API falla hasta el día siguiente y
**no se cobra nada**):

| Recurso | Límite gratis | Qué lo gasta |
|---|---|---|
| Peticiones al Worker | 100 000 / día | Solo `/api/*`: la web la sirve Cloudflare sin pasar por el Worker |
| CPU por petición | 10 ms | Las salas juegan como mucho 30 rondas por consulta (`ROOM_PLAYED_ROUNDS`); lo anterior se resume |
| Filas escritas en D1 | 100 000 / día | Cada consulta de sala y cada subida de partida escriben una; los rankings, una por cuenta activa y ranking cada hora (24 al día); el daño a jefes, una por Pokémon de jugador con cuenta al terminar cada jefe |
| Filas leídas en D1 | 5 millones / día | Sobra |
| Almacenamiento D1 | 5 GB | Una sala ocupa unos KB; una partida, decenas de KB (máx. 1 MB, `MAX_SAVE_BYTES`) |
| Tarea programada (cron) | Incluida | Una ejecución por minuto (≈ 1 440 al día), con poca CPU: pone al día como mucho 3 salas y manda como mucho 20 avisos |
| Correos (Brevo) | 300 / día | Crear cuenta, entrar sin confirmar y recuperar contraseña (como mucho uno por minuto y cuenta) |

Lo que consulta cada jugador (solo con la app delante; cerrada, el servidor sigue y se pone al día al volver):

| Situación | Peticiones por hora |
|---|---|
| Mirando la pelea de un jefe (cada 5 s) | ≈ 720 |
| App abierta en otra pestaña con un Pokémon en una sala (cada 60 s; se puede estar en una sala de cada rotación de Raids y en la de la ruta) | ≈ 60 por sala |
| Con cuenta: subir la partida (cada 2 min) | ≈ 30 |
| Con cuenta: tablón de intercambios y Notificaciones (cada 60 s, `REFRESH_EVERY_MS` en `src/net/tradeBoard.ts`) | ≈ 60 |
| Sin Pokémon en salas y sin cuenta | 0 |

Con 100 000 peticiones al día caben ≈ 130 horas diarias de alguien mirando una pelea: de sobra para poco tráfico. Si
se quedara corto, sube `WATCH_SYNC_MS` y `BACKGROUND_SYNC_MS` en `src/net/raidSync.ts` o `UPLOAD_EVERY_MS` en
`src/net/cloudSync.ts`. El consumo se ve en *Workers & Pages → pokerancho → Metrics* y en *D1 → pokerancho*.

## Mantenimiento

- **Registros y errores**: *Workers & Pages → pokerancho → Logs*.
- **Ver o tocar los datos**: *Storage & Databases → D1 → pokerancho → Console*. Por ejemplo, borrar una cuenta (con
  su partida y sesiones): `DELETE FROM users WHERE email = 'alguien@ejemplo.com';`. Borrar todas las salas (los
  jugadores que estuvieran dentro siguen en local): `DELETE FROM rooms;`.
- **Cambias el juego** (jefes, reglas, `RAID_ROOM_SIZE`…): el Worker usa el mismo código de `src/game` y `src/data`,
  así que se actualiza con cada despliegue. Las salas ya guardadas siguen con su jefe hasta que caen o caducan (24 h
  sin consultas).
- **Cambias `SAVE_VERSION`**: no afecta al servidor. Las partidas de la nube de otra versión se migran igual que las del
  navegador, sin perder nada.

## Límites que conviene saber

- **No hay protección contra trampas**: la partida la juega el navegador y el servidor solo la guarda. Quien sepa
  mandar peticiones a mano puede inventarse su partida o el nivel de su Pokémon en las raids. El servidor valida que
  los datos tengan sentido (especie existente, nivel 1–100, apodo limpio), pero no puede comprobar la partida.
- **Contraseñas**: se guardan con PBKDF2-SHA256 de 100 000 iteraciones (lo máximo que deja Cloudflare), nunca en
  claro. Si al entrar apareciera un error 1102 (CPU agotada), baja `PASSWORD_ITERATIONS` en
  `worker/auth/crypto.ts`: cada contraseña guarda sus iteraciones y las ya creadas siguen valiendo.
- **Correos a spam**: sin dominio propio, Brevo manda desde tu email verificado y algunos correos pueden acabar en
  spam. Con un dominio propio se puede verificar en Brevo y mejora.
- **Sin cuenta, todo está en el navegador**: si se borran los datos del sitio se pierde la partida y el dispositivo
  es un jugador nuevo para las raids. Con cuenta se recupera entrando otra vez.
- **No es tiempo real al milisegundo**: el servidor juega la sala cuando alguien consulta y cada cliente pregunta
  cada pocos segundos. Para un juego idle basta.
