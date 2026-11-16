# Confession Tracker — PWA localizador de alumnos

Fuente de verdad: `horarios_y_alumnos/Claude outputs/app-confesiones-especificacion.md`. Las imágenes, XLSX y DOCX sueltos de esa carpeta no se usan directamente: cada curso se prepara en `horarios_y_alumnos/<curso>/` con la skill `preparar-curso`.

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
- `src/ui/` Preact: `App` (barra inferior en móvil, menú lateral en escritorio), pantallas `Buscar`, `Ruta`, `Mensual`, `Ajustes`, `Horario`; `comun.tsx` (fila con pulsación larga, menú del alumno, anillo); `iconos.tsx` (SVG propios). Paleta morado y dorado en `estilos.css`.
- Ocultar alumno y apodos viven en `estado` (`almacen.ts`); el CSV nunca cambia.
- `public/sw.js` offline. Icono: estola dorada sobre morado (`icon.svg` + PNG 180/192/512).
- Grafo: `graphify update .` (solo código, local). `graphify query "..." --budget 800` para consultar.
- `data/ejemplo/` datos de prueba (alumnos ficticios 9000xx).
- Datos de cada curso: skill `preparar-curso` → `npm run preparar -- horarios_y_alumnos/<curso>` genera el `.json` que el sacerdote importa. Las listas de alumnos nunca pasan por una IA externa.

## Comandos
`npm run dev` · `npm test` · `npm run build` · `npm audit` · `npm run preparar -- <carpeta>`
