---
name: flujo-tareas
description: Cómo dividir el trabajo en tareas pequeñas en TASKS.md y encadenar los agentes (planificador → implementador → tester → revisor-seguridad). Úsala al planificar o ejecutar cualquier tarea.
---
# Flujo de tareas

## Formato en TASKS.md
```
- [ ] T12 · Objetivo en una línea
  - Archivos: src/domain/x.ts
  - Acepta: test "..." pasa / comportamiento observable
  - Agente: implementador
```
Estados: `[ ]` pendiente, `[~]` en curso, `[x]` hecha.

## Reglas
- Tarea pequeña: un archivo principal, ≤ ~80 líneas de cambio y un criterio verificable.
- Orden: dominio → almacenamiento → interfaz.
- Ciclo por tarea: **implementador** → **tester** → **revisor-seguridad** (si toca src/, public/, index.html o package.json). Solo con los tres en verde se marca `[x]`.
- Ahorro de tokens: consulta el grafo de Graphify (`graphify-out/`) antes de leer archivos; lee solo la skill que aplica; no repitas la especificación en los prompts, cita la sección.
- Tras cerrar varias tareas, actualiza el grafo: `graphify update .`
