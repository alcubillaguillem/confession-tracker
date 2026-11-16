# Prompt para transcribir horarios y desdobles con IA

Para delegar el paso 2 de la skill `preparar-curso` sin Claude Code. Adjuntar **solo** las fotos de horarios y de la hoja de desdobles
(nunca las listas de alumnos). Si existe, adjuntar también la carpeta `tablas/` del curso anterior como modelo.

```
Eres un asistente que transcribe horarios escolares a un formato exacto. Te adjunto fotos de los horarios de cada grupo de Bachillerato y de la hoja de desdobles. Devuélveme 7 archivos CSV (separador ;, UTF-8) siguiendo estas reglas al pie de la letra. Si te adjunto los CSV del año anterior, úsalos como modelo exacto.

REGLAS GENERALES
- No inventes nada. Si algo no se lee o es ambiguo, pregúntamelo antes de generar los archivos.
- Usa exactamente los nombres de archivo y de columna indicados.
- Días: lunes, martes, miercoles, jueves, viernes (sin tildes). Horas: HH:MM.
- Varias asignaturas alternativas en una celda (desdoble): sepáralas con " / ". Celda sin clase: vacía.

NOMBRES DE ASIGNATURA PERMITIDOS (solo estos, tal cual):
Lengua I, Lengua II, Inglés I, Inglés II, Filosofía, Hª Filosofía, Religión, Ed. Física, Tutoría, Historia Mundo, Historia de España, Matemáticas I, Matemáticas II, Mat CCSS I, Mat CCSS II, Física y Química, Física, Química, Biología y Geología, Biología, Tecnología e Ingeniería I, Tecnología e Ingeniería II, Dibujo Técnico I, Dibujo Técnico II, Anatomía, Computación, Literatura Universal, Historia del Arte, Psicología, Francés I, Francés II, Alemán I, Alemán II, Economía, Empresa, Geografía, Latín I, Latín II.
Equivalencias: "HISTORIA" en 1º = Historia Mundo y en 2º = Historia de España; "Biología" en 1º = Biología y Geología; "F/Q" = Física y Química; "B/G" = Biología y Geología. Si aparece otra, pregúntame.

ARCHIVOS
1. franjas.csv → franja;inicio;fin   (F1, F2, …, y RECREO)
2. grupos.csv → grupo;curso;aula_base   (grupo 1A, 2C…; curso 1 o 2)
3. aulas.csv → aula;planta;descripcion   (todas las aulas usadas; planta solo el número o vacía; incluye Gimnasio)
4. horarios.csv → grupo;franja;lunes;martes;miercoles;jueves;viernes   (una fila por grupo y franja, sin RECREO)
5. desdobles.csv → dia;franja;curso;asignatura;grupos;aula   ("Economía ABCD: Aula 4.3" → grupos ABCD, aula 4.3)
6. opciones.csv → curso;opcion;asignaturas   (3 asignaturas separadas por " / ")
7. optativas.csv → curso;codigo;asignatura   (códigos como en las listas: TIN, D.T, C.C, ECO, FRA…)

ANTES DE ENTREGAR, COMPRUEBA
- Cada grupo tiene todas sus franjas y los 5 días.
- Cada asignatura desdoblada de un horario tiene su fila en desdobles para ese día y franja (si falta, avísame).
- Todas las aulas usadas están en aulas.csv.
Entrega los 7 CSV y un resumen: número de grupos, franjas y desdobles, y la lista de dudas.
```
