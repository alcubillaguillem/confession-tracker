---
name: preparar-curso
description: Procedimiento anual para convertir las fotos de horarios/desdobles y las listas del colegio en el archivo único que importa el sacerdote. Úsala cuando haya que preparar o actualizar los datos de un curso, o al delegar esta tarea.
---
# Preparar los datos de un curso

Se hace **una vez al año** (y si hay cambios de horario a mitad de curso). Dos caminos con el mismo formato y las mismas validaciones:

- **A. El sacerdote, solo, desde la app** (el habitual; lo explica la guía para sacerdotes): pasa las fotos a una IA con
  `docs/prompt-transcribir-horarios.md` → recibe `horarios.xlsx` (7 hojas) → en la app, **Ajustes → Importar datos**, elige a la vez
  ese Excel y las listas del colegio (.docx). La app lee las listas en el dispositivo, deduce la opción si la lista no la trae
  y avisa de bajas, aulas que faltan y horarios ambiguos.
- **B. Preparado por nosotros** (pasos 1–5 de abajo): el resultado es un único `confession-tracker-<curso>.json`
  que el sacerdote importa en **Ajustes → Restaurar copia**.

## 0. Privacidad (obligatorio)
- Todo vive en `horarios_y_alumnos/<curso>/`, excluido de git y de Graphify. Nunca se sube a GitHub.
- Las **listas de alumnos no se pasan a ninguna IA externa**: son datos de menores. Las procesa el script en local.
- Las fotos de horarios y desdobles no tienen datos personales: se pueden transcribir con IA.
- El `.json` final contiene nombres: se envía por chat privado y se borra del chat cuando esté importado.

## 1. Recibir y ordenar
Pedir al sacerdote: una foto por grupo del horario, la(s) foto(s) de la hoja de desdobles y las listas del colegio (`.docx`).
```
horarios_y_alumnos/<curso>/
  fotos/    horario_1A.jpeg … , desdobles.jpeg
  listas/   Listas definitivas 1º.docx, Listas definitivas 2º.docx
  tablas/   franjas, grupos, aulas, horarios, desdobles, opciones, optativas (.csv)
```
Partir de la carpeta `tablas/` del curso anterior: suele cambiar solo `horarios` y `desdobles`.

## 2. Transcribir las fotos → `tablas/*.csv`
- Formato y nombres de asignatura: skill `formato-importacion`. Separador `;`, alternativas con ` / `.
- Con Claude Code: leer cada foto y editar el CSV correspondiente.
- Sin Claude Code: usar el prompt de `docs/prompt-transcribir-horarios.md` adjuntando solo las fotos (devuelve un Excel; sus hojas se pueden guardar como los CSV de `tablas/`).
- Ante cualquier celda dudosa, **preguntar**, no adivinar.

## 3. Generar y validar
```bash
npm run preparar -- horarios_y_alumnos/<curso>
```
- Si una lista no trae columna de opción (1ºE), se deduce del horario del grupo: la única opción cuyas 3 asignaturas aparecen en él.
- El script lee las listas (excluye las filas con «BAJA»), valida todo con las reglas de la app y muestra recuentos por grupo.
- **Criterio de aceptación**: 0 errores y 0 horarios ambiguos. Revisar los avisos de coherencia (asignatura desdoblada sin aula): si un grupo no tiene alumnos en esa asignatura, se puede ignorar.
- Si hay errores: corregir `tablas/` y repetir. Si hay horarios ambiguos: suele faltar o sobrar una asignatura en un bloque del horario de ese grupo.

## 4. Comprobar a mano (2 minutos)
Comparar 3 alumnos al azar de distintos grupos con su horario en papel (vista Horario de la app, tras importar en un navegador de prueba).

## 5. Entregar
Enviar `horarios_y_alumnos/<curso>/confession-tracker-<curso>.json` al sacerdote por chat privado con este texto:
> Padre, le paso los datos del curso. En la app: Ajustes → Restaurar copia → elija este archivo. Después borre el archivo del chat.

Importar empieza de cero: se borran las marcas y listas del curso anterior (es lo esperado al empezar curso).

## Altas y bajas a mitad de curso
Pedir la lista actualizada, sustituirla en `listas/` y repetir los pasos 3 y 5. Igualmente empieza de cero (marcas incluidas).
