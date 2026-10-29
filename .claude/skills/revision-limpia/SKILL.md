---
name: revision-limpia
description: Revisar o refactorizar código del proyecto con la checklist de código limpio de Pokérancho (tamaño de ficheros, nombres, duplicación, separación data/game/ui, constantes, tests). Úsala cuando pidan "revisa", "limpia", "refactoriza", "¿esto está bien?" o antes de dar por cerrada una tarea grande.
---

# Revisión de código limpio

## Alcance

- Por defecto, el diff actual (`git diff` + `git diff --staged`). Si se nombra un fichero o carpeta, solo eso.
- Revisar **no** es reescribir: propón primero y aplica solo lo que el usuario apruebe, salvo que haya pedido
  refactorizar directamente.

## Checklist

**Estructura**
- [ ] ¿Respeta `ui → game → data`? ¿Hay lógica de juego en un componente o React/DOM en `src/game`?
- [ ] ¿Algún fichero > 200 líneas o alguna función que no quepa en una pantalla? Propón cómo dividirlo por
      responsabilidad.
- [ ] ¿Cada módulo tiene una responsabilidad clara que coincide con `docs/arquitectura.md`?

**Claridad**
- [ ] ¿Nombres que dicen qué es o qué hace, sin abreviaturas crípticas?
- [ ] ¿Números mágicos? Deben ser constantes con nombre y `/** */`.
- [ ] ¿Comentarios que repiten el código (sobran) o reglas no evidentes sin explicar (faltan)?
- [ ] ¿Condicionales anidados que se simplifican con un retorno temprano?

**Corrección**
- [ ] ¿Las acciones validan sus precondiciones?
- [ ] ¿El azar entra por un `rng` inyectable?
- [ ] ¿Cambió la forma de `GameState` sin subir `SAVE_VERSION`?

**Higiene**
- [ ] ¿Duplicación real (3+ veces) que merezca extraerse? ¿O una abstracción prematura que sobre?
- [ ] ¿Código muerto, exports sin uso o `any`?
- [ ] ¿Tests para la lógica nueva o cambiada en `src/game`?
- [ ] ¿La documentación refleja el cambio?

## Formato del informe

Agrupa por gravedad y sé concreto. Cada punto con `fichero:línea`, el problema y la propuesta:

1. **Bloqueante**: bugs, ruptura de capas, partida guardada incompatible.
2. **Importante**: ficheros o funciones demasiado grandes, duplicación, tests que faltan.
3. **Menor**: nombres, comentarios, estilo.

Termina con `npm run check` y su resultado.
