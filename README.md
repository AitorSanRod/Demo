# Pokérancho

Juego idle para móvil: tu Pokémon recorre las rutas y combate solo; tú eliges el camino antes de salir y, entre
ruta y ruta, cuidas de tu equipo en el rancho, mandas al resto de expedición y consigues Pokémon nuevos juntando
piezas del gacha.

PWA con Vite + React + TypeScript, pensada para móvil en vertical. La partida se guarda en el navegador
(`localStorage`). Por servidor van las salas compartidas de los jefes comunitarios y, con una cuenta opcional (email y
contraseña), la partida en la nube: un Worker de Cloudflare con base de datos D1 (ver [docs/servidor.md](docs/servidor.md)).
Sin servidor, todo se juega en local.

## Arrancar

Requiere Node `>=22.13` (ver `.nvmrc`).

```bash
npm install
npm run dev        # http://localhost:5173 (también en la red local para probar en el móvil)
npm run check      # typecheck + lint + tests
npm run build      # build de producción con service worker en dist/
npm run preview    # sirve dist/ en http://localhost:4173
```

En desarrollo aparece en la barra superior un botón **⏱ x1 / x10 / x60** para acelerar el tiempo.

Para **instalarla como app** (y para las notificaciones) hace falta HTTPS o `localhost`: publícala (ver abajo) y en
el móvil usa «Añadir a pantalla de inicio».

## Publicar en Cloudflare

Paso a paso en [docs/servidor.md](docs/servidor.md): se crea la base de datos D1, se conecta el repositorio en
Cloudflare (despliega solo en cada push a `main`) y se ponen las claves de Brevo para los correos. Para probar el
servidor en local: `npm run db:migrate:local` (una vez) y `npm run preview` (http://localhost:8787).

GitHub Actions ([.github/workflows/check.yml](.github/workflows/check.yml)) pasa `npm run check` en cada push.

## Cómo se juega

1. **Tutorial**: eliges a ciegas uno de los tres iniciales, combinas sus piezas en la Pokédex y sales a la
   primera ruta.
2. **Rutas**: el Pokémon activo camina solo de parada en parada y combate en cada una con su único ataque (el de su
   tipo y su rareza). Al completarla gana EXP, ₽ y tickets; si cae, vuelve al rancho.
3. **Rancho**: curar, entrenar con ₽ y elegir compañero de viaje.
4. **Expediciones**: el resto del equipo hace rutas por tiempo y vuelve con premio, sin riesgo.
5. **Gacha y Pokédex**: cada tirada da 5 piezas; con 5 iguales se desbloquea el Pokémon o gana una ★. Las piezas
   que sobran se trituran en trozos de MissingNo para comprar las del Pokémon que quieras.

Las reglas y todos los números de balance están en [docs/diseno.md](docs/diseno.md).

## Documentación

- [docs/diseno.md](docs/diseno.md): reglas del juego y dónde está cada número de balance.
- [docs/arquitectura.md](docs/arquitectura.md): capas, estructura de carpetas, store, guardado y flujo de una ruta.
- [docs/convenciones.md](docs/convenciones.md): estilo de código, tests y definición de terminado.
- [docs/servidor.md](docs/servidor.md): servidor en Cloudflare (plan gratuito): salas compartidas y cuentas, paso a paso.

## Scripts

- `scripts/fetch-pokemon.mjs`: regenera `src/data/pokemon.json` desde PokeAPI.
- `scripts/make-icons.mjs`: genera los iconos de la PWA.

> Los datos y sprites de Pokémon son propiedad de Nintendo / Game Freak / The Pokémon Company. Proyecto solo para
> uso personal: no publicar ni monetizar.
