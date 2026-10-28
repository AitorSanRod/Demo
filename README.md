# Pokérancho (demo de concepto)

Juego idle tipo digivice: tu Pokémon recorre rutas solo, tú eliges camino y movimiento en cada nodo y puedes
acelerarlo tocando la pantalla. Si se debilita vuelve al Pokérancho (curar, entrenar, gacha, cambiar de Pokémon).

PWA hecha con Vite + React + TypeScript, pensada para móvil en vertical.

## Arrancar

```bash
npm install
npm run dev        # http://localhost:5173 (también expuesto en la red local para probar en el móvil)
npm run build      # build de producción con service worker en dist/
npm run preview    # sirve dist/ en http://localhost:4173
```

Para **instalarla como app** hace falta HTTPS (o `localhost`): despliega `dist/` en cualquier hosting estático
(Netlify, Vercel, GitHub Pages…) y en el móvil usa "Añadir a pantalla de inicio" / "Instalar app".

## Cómo se juega

- **Pasos**: cada tramo entre nodos tiene N pasos. El Pokémon anda solo a `12 + velocidad base × 0.15 + nivel × 0.25`
  pasos/min; cada toque en el mapa suma 1 paso. El progreso continúa con la app cerrada (máx. 12 h).
- **Nodos**: al llegar hay un combate salvaje automático. Después eliges el siguiente camino (si hay bifurcación)
  y el movimiento que usarás en el próximo combate.
- **Combate**: el jugador usa siempre el movimiento elegido; el enemigo elige entre sus (hasta) 4 con una IA que
  puntúa daño esperado, eficacia de tipos y si puede rematar, con algo de azar.
- **Recompensas**: EXP, pokécuartos (₽) y 15% de probabilidad de ticket por victoria; bonus al completar la ruta,
  que además desbloquea la siguiente.
- **Derrota**: la ruta termina y se pierde la mitad del dinero ganado en ella. Los PS no se recuperan durante la
  ruta salvo un 10% tras cada victoria, así que hay que entrenar antes de las rutas difíciles.
- **Escena**: mientras camina, el Pokémon avanza sobre un fondo pixel-art con parallax (`src/ui/scenery.ts`),
  distinto según el bioma de la ruta (prado, bosque, cueva, mar).
- **Rancho**: los Pokémon que no están en ruta recuperan un 10% de PS/min. Curar al instante, entrenar (EXP),
  editar movimientos (máx. 4) y elegir Pokémon activo.
- **Gacha**: 1 ticket = 1 tirada, rareza según stats base (68/24/7/1%). Duplicados dan ★ (+4% stats) y ₽.
- **⏱ x1 / x10 / x60** en la barra superior acelera el tiempo para probar la demo.

## Estructura

```
src/data/      datos estáticos: especies (PokeAPI), tipos, movimientos, mapas y rutas
src/game/      lógica pura: estado, stats, combate + IA, motor (tiempo, runs, rancho), gacha, store
src/ui/        pantallas React
scripts/       fetch-pokemon.mjs (regenera src/data/pokemon.json) y make-icons.mjs (iconos PWA)
```

Los nodos ya tienen `kind` para añadir entrenadores, cofres, descansos, jefes y combates especiales
(`src/data/maps.ts`); de momento solo hay `wild`.

> Los datos y sprites de Pokémon son propiedad de Nintendo / Game Freak / The Pokémon Company. Esta demo es solo
> para uso personal y no debe publicarse ni monetizarse con ellos.
