---
name: preparar-curso
description: Procedimiento anual para convertir las fotos de horarios/desdobles y las listas del colegio en el archivo único que importa el sacerdote. Úsala cuando haya que preparar o actualizar los datos de un curso, o al delegar esta tarea.
---
# Preparar los datos de un curso

Se hace **una vez al año** (y si hay cambios a mitad de curso). **El sacerdote no importa nada**: recibe un enlace y,
al pulsarlo, la app ya tiene todos los datos.

**Cómo funciona el enlace**: los datos validados se cifran (AES-256-GCM) en `public/curso.enc`, que se publica con la web.
La clave está en `horarios_y_alumnos/<curso>/clave.txt` (fuera de git) y viaja solo en el enlace, tras `#`
(`…/confession-tracker/#k=<clave>`), que el navegador nunca envía al servidor. Al abrirlo, la app descifra, valida, guarda
los datos en el dispositivo y borra la clave de la barra de direcciones. Reabrir el mismo enlace con los mismos datos no
borra nada; si hay datos nuevos publicados, se cargan (empezando de cero).

Alternativas que siguen funcionando: importar en la app (Ajustes → Importar datos: Excel de horarios + listas .docx) o
restaurar el `.json` (Ajustes → Restaurar copia).

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
npm run preparar -- horarios_y_alumnos/<curso> --publicar  # validar, cifrar en public/curso.enc y mostrar el enlace
```
- Si una lista no trae columna de opción (1ºE), se deduce del horario del grupo: la única opción cuyas 3 asignaturas aparecen en él.
- El script lee las listas (excluye las filas con «BAJA»), valida todo con las reglas de la app y muestra recuentos por grupo.
- **Criterio de aceptación**: 0 errores y 0 horarios ambiguos. Revisar los avisos de coherencia (asignatura desdoblada sin aula): si un grupo no tiene alumnos en esa asignatura, se puede ignorar.
- Si hay errores: corregir `tablas/` y repetir. Si hay horarios ambiguos: suele faltar o sobrar una asignatura en un bloque del horario de ese grupo.

## 4. Comprobar a mano (2 minutos)
Comparar 3 alumnos al azar de distintos grupos con su horario en papel (vista Horario de la app, tras importar en un navegador de prueba).

## 5. Publicar y entregar
1. `npm run preparar -- horarios_y_alumnos/<curso> --publicar` (exige 0 errores y 0 horarios ambiguos).
2. Comprobar que `public/curso.enc` no contiene texto legible; commit y push de `public/curso.enc` (el despliegue lo publica).
3. Enviar al sacerdote, por chat privado, el enlace que muestra el script:
   > Padre, este es su enlace de Confession Tracker. Ábralo en el móvil y la app quedará lista. No lo reenvíe a nadie: da acceso a los datos.

Curso nuevo = carpeta nueva = clave nueva (se genera sola): el enlace del año anterior deja de abrir los datos nuevos.

## Altas y bajas a mitad de curso
Pedir la lista actualizada, sustituirla en `listas/` y repetir los pasos 3 y 5 con la misma carpeta (misma clave): el sacerdote vuelve a pulsar su enlace de siempre. Al cargarse datos nuevos, la app empieza de cero (marcas incluidas).
