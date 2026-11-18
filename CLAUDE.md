# Confession Tracker — PWA localizador de alumnos

Fuente de verdad: `horarios_y_alumnos/Claude outputs/app-confesiones-especificacion.md`. Las imágenes, XLSX y DOCX sueltos de esa carpeta no se usan directamente: cada curso se prepara en `horarios_y_alumnos/<curso>/` con la skill `preparar-curso`.

## Reglas
- Seguridad y privacidad: skill `seguridad-privacidad` (obligatoria en todo cambio).
- Trabajo en tareas pequeñas: skill `flujo-tareas` y `TASKS.md`.
- Agentes: `planificador` → `implementador` → `tester` → `revisor-seguridad`, y `disenador` para pulir la interfaz (`.claude/agents/`).
- Código mínimo: reutiliza lo existente y las dependencias instaladas; no añadas dependencias sin aprobación.
- Ahorro de tokens: consulta el grafo de Graphify (`graphify-out/`) antes de leer archivos.

## Estructura
- `src/domain/` lógica pura y testeada: `catalogo.ts`, `esquemas.ts`, `importar.ts`, `resolver.ts`.
- `src/almacen.ts` base de datos local (IndexedDB, idb-keyval). Los datos del curso no se modifican nunca; marcas, apodos y ocultos viven aparte en `estado`. Sin importar, exportar ni borrar desde la interfaz.
- `src/avisos.ts` avisos de mitad de mes, final de mes y enhorabuena (al abrir la app; solo recuentos en las notificaciones).
- `src/ui/` Preact: `App` (barra inferior en móvil, menú lateral en escritorio), `Desbloqueo` (contraseña la primera vez), pestañas `Principal` (dashboard y pendientes), `Lista` (alumnos a confesar agrupados en tiempo real por la clase en la que están), `Alumnos` (lista alfabética de 20 en 20 con buscador), `Ajustes`; `Horario`; `comun.tsx` (fila con pulsación larga, menú del alumno, anillo); `iconos.tsx` (SVG propios). Paleta morado y dorado en `estilos.css`.
- Ocultar alumno y apodos viven en `estado` (`almacen.ts`); el CSV nunca cambia.
- `public/sw.js` offline. Icono: estola dorada sobre morado (`icon.svg` + PNG 180/192/512).
- Grafo: `graphify update .` (solo código, local). `graphify query "..." --budget 800` para consultar.
- `data/ejemplo/` datos de prueba (alumnos ficticios 9000xx).
- Datos de cada curso: skill `preparar-curso` → `CT_CONTRASENA=… npm run preparar -- horarios_y_alumnos/<curso> --publicar` cifra el curso con la contraseña (PBKDF2 + AES-256-GCM, `src/domain/cifrado.ts`) en `public/curso.enc`. El sacerdote abre la web, escribe la contraseña una vez y los datos quedan en su dispositivo. La contraseña nunca se escribe en el repositorio. Las listas nunca pasan por una IA externa.

## Comandos
`npm run dev` · `npm test` · `npm run build` · `npm audit` · `npm run preparar -- <carpeta>`
