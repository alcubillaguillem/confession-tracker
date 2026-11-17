# Tareas

Formato y ciclo: skill `flujo-tareas`.

## Base
- [x] T01 · Proyecto Vite + Preact + TS estricto, CSP en build, manifest y service worker
  - Archivos: package.json, vite.config.ts, index.html, public/ · Agente: implementador
- [x] T02 · Agentes, skills, CLAUDE.md, .gitignore/.graphifyignore
  - Archivos: .claude/, CLAUDE.md · Agente: planificador

## Dominio
- [x] T03 · Catálogo de asignaturas con alias y normalización
  - Archivos: src/domain/catalogo.ts · Acepta: alias de la sección 8.7 → canónico · Agente: implementador
- [x] T04 · Esquemas Zod de las 8 tablas
  - Archivos: src/domain/esquemas.ts · Agente: implementador
- [x] T05 · Importar CSV/XLSX y validar con errores "archivo, fila, motivo" + avisos de coherencia
  - Archivos: src/domain/importar.ts · Acepta: data/ejemplo importa sin errores; aviso Francés I 1A · Agente: implementador
- [x] T06 · Asignación semanal y consulta
  - Archivos: src/domain/resolver.ts · Acepta: 20 casos de la sección 5.4 · Agente: implementador
- [x] T07 · Tests de dominio + aceptación con datos reales (solo recuentos)
  - Archivos: src/domain/*.test.ts · Agente: tester

## Almacenamiento
- [x] T08 · Persistencia: tablas, listas, marcas, preferencias, copia JSON, borrar todo
  - Archivos: src/almacen.ts · Agente: implementador

## Interfaz
- [x] T09 · Búsqueda individual/múltiple agrupada por aula y planta, selector día/franja
  - Archivos: src/ui/Buscar.tsx · Agente: implementador
- [x] T10 · Horario semanal del alumno
  - Archivos: src/ui/Horario.tsx · Agente: implementador
- [x] T11 · Listas guardadas y marca "confesado este mes"
  - Archivos: src/ui/Buscar.tsx, src/almacen.ts · Agente: implementador
- [x] T12 · Pantalla Datos: importar, importación parcial, copia, borrar, modo oscuro, letra grande
  - Archivos: src/ui/Datos.tsx · Agente: implementador

## Cierre
- [x] T13 · Revisión de seguridad y auditoría · Agente: revisor-seguridad

## Rediseño v2 (morado y dorado)
- [x] T14 · Estado: alumnos ocultos y apodos (CSV intacto; se borran al importar)
  - Archivos: src/almacen.ts · Acepta: tests de ocultar/apodo/búsqueda · Agente: implementador
- [x] T15 · Icono E1 (estola dorada sobre morado) en SVG y PNG 180/192/512
  - Archivos: public/ · Agente: implementador
- [x] T16 · Componentes comunes: iconos, anillo, fila de alumno con pulsación larga, menú (mensual, apodo, horario, ocultar)
  - Archivos: src/ui/iconos.tsx, src/ui/comun.tsx · Agente: implementador
- [x] T17 · Pantallas Buscar (anillo), Ruta, Mensual y Ajustes con barra inferior / menú lateral
  - Archivos: src/ui/*.tsx · Agente: implementador
- [x] T18 · Estilos morado y dorado, modo oscuro, móvil y escritorio
  - Archivos: src/ui/estilos.css · Agente: implementador
- [x] T19 · Verificación en navegador y revisión de seguridad · Agente: revisor-seguridad

## Preparación anual de datos
- [x] T20 · Script `npm run preparar`: listas del colegio (.docx) → alumnos.csv, validación con las reglas de la app y archivo único .json
  - Archivos: scripts/preparar-curso.ts · Acepta: 298 alumnos 2026-27, 0 ambiguos, idéntico al CSV de la especificación
- [x] T21 · Skill `preparar-curso` y prompt de transcripción para delegar
  - Archivos: .claude/skills/preparar-curso/, docs/prompt-transcribir-horarios.md
- [x] T22 · La app importa las listas del colegio (.docx) junto al Excel de horarios; deduce la opción si falta; avisa de horarios ambiguos
  - Archivos: src/domain/listas.ts, src/domain/importar.ts, src/ui/Ajustes.tsx · Acepta: Excel + 2 Word reales → 298 alumnos sin errores
- [x] T23 · Enlace con los datos del curso: `public/curso.enc` cifrado (AES-256-GCM) + clave en el `#` del enlace; la app carga al abrirlo
  - Archivos: src/domain/cifrado.ts, src/almacen.ts, src/ui/App.tsx, scripts/preparar-curso.ts · Acepta: enlace abre 298 alumnos; reabrir conserva marcas; clave errónea no toca nada
- [x] T24 · Quitar la pestaña Ruta y las listas guardadas; «Dónde están» (selección agrupada por aula) dentro de Buscar
  - Archivos: src/ui/DondeEstan.tsx, src/ui/Buscar.tsx, src/ui/App.tsx, src/almacen.ts
- [x] T25 · Contraseña al abrir (datos cifrados en la app), pestañas Principal (dashboard) / Alumnos (A-Z, de 20 en 20, buscador) / Ajustes; fuera importar, exportar, restaurar, borrar y enlace
  - Archivos: src/ui/{Desbloqueo,Principal,Alumnos,Ajustes,App}.tsx, src/almacen.ts, src/domain/cifrado.ts
- [x] T26 · Confesión mensual precargada (57, desde la hoja de confesiones vía confesion_mensual.csv); Principal solo confesados/pendientes; menú con animación y deslizar para cerrar; Alumnos sin selector de día; inicio de sesión estándar
  - Archivos: scripts/preparar-curso.ts, src/ui/{Principal,Alumnos,Desbloqueo,App,comun}.tsx, src/ui/estilos.css
- [x] T27 · «Ver todos» en Pendientes; marcar/quitar confesado desde el menú; modo oscuro por defecto; fuera letra grande; agente `disenador` y pasada de pulido visual
  - Archivos: src/ui/{Principal,comun,Ajustes,App}.tsx, src/almacen.ts, src/ui/estilos.css, index.html, .claude/agents/disenador.md
- [x] T28 · Filtros en Alumnos: clase, asignatura (modalidad o asignatura suelta) y «Solo confesión mensual»; recuento y «Quitar filtros»
  - Archivos: src/domain/resolver.ts (modalidad, asignaturasFiltrables), src/ui/Alumnos.tsx, src/ui/estilos.css
