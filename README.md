# Pokérancho

Juego idle para móvil: tu Pokémon recorre las rutas y combate solo; tú eliges el camino antes de salir y, entre
ruta y ruta, cuidas de tu equipo en el rancho, mandas al resto de expedición y consigues Pokémon nuevos juntando
piezas del gacha.

PWA con Vite + React + TypeScript, pensada para móvil en vertical. No tiene servidor: la partida se guarda en el
navegador (`localStorage`).

## Arrancar

Requiere Node `^20.19 || >=22.12` (ver `.nvmrc`).

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

## Publicar en GitHub Pages

El workflow [.github/workflows/deploy.yml](.github/workflows/deploy.yml) publica la app en cada push a `main`:
pasa `npm run check`, compila con `BASE_PATH=/<repositorio>/` (la web vive en
`https://<usuario>.github.io/<repositorio>/`) y sube `dist/` a Pages. Si el check falla, no se publica.

Solo hay que activarlo una vez: **Settings → Pages → Build and deployment → Source: GitHub Actions**. También se
puede lanzar a mano desde la pestaña **Actions** (*Run workflow*).

Para probar en local el build tal y como queda en Pages:

```bash
BASE_PATH=/Demo/ npm run build && BASE_PATH=/Demo/ npm run preview   # http://localhost:4173/Demo/
```

En Git Bash (Windows) antepón `MSYS_NO_PATHCONV=1`, o convertirá `/Demo/` en una ruta de Windows.

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

## Scripts

- `scripts/fetch-pokemon.mjs`: regenera `src/data/pokemon.json` desde PokeAPI.
- `scripts/make-icons.mjs`: genera los iconos de la PWA.

> Los datos y sprites de Pokémon son propiedad de Nintendo / Game Freak / The Pokémon Company. Proyecto solo para
> uso personal: no publicar ni monetizar.
