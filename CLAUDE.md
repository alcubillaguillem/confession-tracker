# ¿Dónde está? — PWA localizador de alumnos

Fuente de verdad: `horarios_y_alumnos/Claude outputs/app-confesiones-especificacion.md`. Las imágenes, XLSX y DOCX de esa carpeta **no se usan**.

## Reglas
- Seguridad y privacidad: skill `seguridad-privacidad` (obligatoria en todo cambio).
- Trabajo en tareas pequeñas: skill `flujo-tareas` y `TASKS.md`.
- Agentes: `planificador` → `implementador` → `tester` → `revisor-seguridad` (`.claude/agents/`).
- Código mínimo: reutiliza lo existente y las dependencias instaladas; no añadas dependencias sin aprobación.
- Ahorro de tokens: consulta el grafo de Graphify (`graphify-out/`) antes de leer archivos.

## Estructura
- `src/domain/` lógica pura y testeada: `catalogo.ts`, `esquemas.ts`, `importar.ts`, `resolver.ts`.
- `src/almacen.ts` IndexedDB (idb-keyval). El CSV importado no se modifica nunca; las marcas y listas viven aparte en `estado`. Importar = empezar de cero.
- `src/avisos.ts` avisos de mitad de mes, final de mes y enhorabuena (al abrir la app; solo recuentos en las notificaciones).
- `src/ui/` componentes Preact. `public/sw.js` offline.
- Grafo: `graphify update .` (solo código, local). `graphify query "..." --budget 800` para consultar.
- `data/ejemplo/` datos de prueba (alumnos ficticios 9000xx).

## Comandos
`npm run dev` · `npm test` · `npm run build` · `npm audit`
