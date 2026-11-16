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
