---
name: preparar-curso
description: Procedimiento anual para convertir las fotos de horarios/desdobles y las listas del colegio en el archivo único que importa el sacerdote. Úsala cuando haya que preparar o actualizar los datos de un curso, o al delegar esta tarea.
---
# Preparar los datos de un curso

Se hace **una vez al año**. **El sacerdote no importa nada**: abre la web, escribe la contraseña la primera vez y la
app ya tiene todos los datos guardados en su dispositivo (no se vuelve a pedir).

**Cómo funciona**: los datos validados se cifran con la contraseña (PBKDF2-SHA256 600 000 iteraciones → AES-256-GCM)
en `public/curso.enc`, que se publica con la web. La contraseña se pasa en la variable `CT_CONTRASENA` al publicar y
nunca se guarda en el repositorio ni en archivos. Recomendado: 4 palabras o 16+ caracteres (el archivo cifrado es público).

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
npm run preparar -- horarios_y_alumnos/<curso>             # solo validar
CT_CONTRASENA='…' npm run preparar -- horarios_y_alumnos/<curso> --publicar  # validar y cifrar en public/curso.enc
```
- Si una lista no trae columna de opción (1ºE), se deduce del horario del grupo: la única opción cuyas 3 asignaturas aparecen en él.
- El script lee las listas (excluye las filas con «BAJA»), valida todo con las reglas de la app y muestra recuentos por grupo.
- **Criterio de aceptación**: 0 errores y 0 horarios ambiguos. Revisar los avisos de coherencia (asignatura desdoblada sin aula): si un grupo no tiene alumnos en esa asignatura, se puede ignorar.
- Si hay errores: corregir `tablas/` y repetir. Si hay horarios ambiguos: suele faltar o sobrar una asignatura en un bloque del horario de ese grupo.

## 4. Comprobar a mano (2 minutos)
Comparar 3 alumnos al azar de distintos grupos con su horario en papel (vista Horario de la app, tras importar en un navegador de prueba).

## 5. Publicar y entregar
1. `CT_CONTRASENA='…' npm run preparar -- horarios_y_alumnos/<curso> --publicar` (exige 0 errores y 0 horarios ambiguos).
2. Comprobar que `public/curso.enc` no contiene texto legible; commit y push (el despliegue lo publica).
3. Dar al sacerdote el enlace de la web y, por otra vía (en persona o por teléfono), la contraseña.

Curso nuevo = contraseña nueva.

## Altas y bajas a mitad de curso
La app actual solo carga los datos la primera vez. Para cambios a mitad de curso habría que añadir un botón de actualización (no implementado por decisión del usuario).
