---
name: formato-importacion
description: Formato estándar de las 8 tablas de importación (CSV ; UTF-8 o XLSX con 8 hojas), alias de asignaturas y reglas de validación. Úsala al tocar src/domain/importar.ts, esquemas o catálogo.
---
# Formato de importación

Implementación: `src/domain/esquemas.ts` (Zod), `src/domain/importar.ts`, `src/domain/catalogo.ts`, `src/domain/listas.ts` (listas del colegio .docx → tabla alumnos). Ejemplo completo: `data/ejemplo/`.

| Tabla | Columnas |
|---|---|
| franjas | franja;inicio;fin |
| grupos | grupo;curso;aula_base |
| aulas | aula;planta;descripcion |
| horarios | grupo;franja;lunes;martes;miercoles;jueves;viernes |
| desdobles | dia;franja;curso;asignatura;grupos;aula |
| opciones | curso;opcion;asignaturas |
| optativas | curso;codigo;asignatura |
| alumnos | expediente;apellidos;nombre;grupo;opcion;optativa;confesion_mensual |

Reglas:
- Separador `;`, UTF-8 (quitar BOM). Alternativas en celda: ` / `. En XLSX, una hoja por tabla con el mismo nombre.
- Errores siempre como `archivo, fila N: motivo` (fila 1 = cabecera).
- Asignaturas → nombre canónico vía `catalogo.ts` (alias, sin tildes ni mayúsculas). Desconocida = error.
- `grupos` en desdobles = letras (`ABCD`). Código optativa `C.C.` → `C.C`.
- `expediente` único. `confesion_mensual` = `si` o vacío.
- La tabla alumnos puede venir de las listas del colegio (.docx): filas «BAJA» excluidas; sin columna de opción → se deduce del horario del grupo.
- Importación parcial: solo `alumnos` o solo las listas .docx (sin tocar horarios). Importar siempre empieza de cero.
- Al importar, la app avisa de alumnos con horario ambiguo (`avisosAmbiguos`).
- Coherencia (aviso, no error): asignatura desdoblada de un grupo sin fila en desdobles para ese día y franja.
