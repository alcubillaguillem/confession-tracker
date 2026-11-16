# Prompt para transcribir horarios y desdobles con IA

Lo usa el sacerdote (o quien prepare los datos) con cualquier IA: Claude, ChatGPT, Gemini. Adjuntar **solo** las fotos de horarios y de la hoja de desdobles
(nunca las listas de alumnos: esas se suben directamente a la app). Si existe, adjuntar también el Excel del curso anterior como modelo.
La IA devuelve `horarios.xlsx`, que se importa en la app junto a las listas del colegio (Ajustes → Importar datos).

```
Eres un asistente que transcribe horarios escolares a un formato exacto. Te adjunto fotos de los horarios de cada grupo de Bachillerato y de la hoja de desdobles. Devuélveme UN archivo Excel llamado horarios.xlsx con 7 hojas, siguiendo estas reglas al pie de la letra. Si te adjunto el Excel del año anterior, úsalo como modelo exacto.

REGLAS GENERALES
- No inventes nada. Si algo no se lee o es ambiguo, pregúntamelo antes de generar los archivos.
- Usa exactamente los nombres de hoja y de columna indicados (fila 1 = nombres de columna).
- Escribe todo como texto, también las horas (08:15) y los números de aula (3.3).
- Días: lunes, martes, miercoles, jueves, viernes (sin tildes). Horas: HH:MM.
- Varias asignaturas alternativas en una celda (desdoble): sepáralas con " / ". Celda sin clase: vacía.

NOMBRES DE ASIGNATURA PERMITIDOS (solo estos, tal cual):
Lengua I, Lengua II, Inglés I, Inglés II, Filosofía, Hª Filosofía, Religión, Ed. Física, Tutoría, Historia Mundo, Historia de España, Matemáticas I, Matemáticas II, Mat CCSS I, Mat CCSS II, Física y Química, Física, Química, Biología y Geología, Biología, Tecnología e Ingeniería I, Tecnología e Ingeniería II, Dibujo Técnico I, Dibujo Técnico II, Anatomía, Computación, Literatura Universal, Historia del Arte, Psicología, Francés I, Francés II, Alemán I, Alemán II, Economía, Empresa, Geografía, Latín I, Latín II.
Equivalencias: "HISTORIA" en 1º = Historia Mundo y en 2º = Historia de España; "Biología" en 1º = Biología y Geología; "F/Q" = Física y Química; "B/G" = Biología y Geología. Si aparece otra, pregúntame.

HOJAS
1. franjas → franja;inicio;fin   (F1, F2, …, y RECREO)
2. grupos → grupo;curso;aula_base   (grupo 1A, 2C…; curso 1 o 2)
3. aulas → aula;planta;descripcion   (todas las aulas usadas; planta solo el número o vacía; incluye Gimnasio)
4. horarios → grupo;franja;lunes;martes;miercoles;jueves;viernes   (una fila por grupo y franja, sin RECREO)
5. desdobles → dia;franja;curso;asignatura;grupos;aula   ("Economía ABCD: Aula 4.3" → grupos ABCD, aula 4.3)
6. opciones → curso;opcion;asignaturas   (3 asignaturas separadas por " / ")
7. optativas → curso;codigo;asignatura   (códigos como en las listas: TIN, D.T, C.C, ECO, FRA…)

ANTES DE ENTREGAR, COMPRUEBA
- Cada grupo tiene todas sus franjas y los 5 días.
- Cada asignatura desdoblada de un horario tiene su fila en desdobles para ese día y franja (si falta, avísame).
- Todas las aulas usadas están en la hoja aulas.
Entrega el Excel y un resumen: número de grupos, franjas y desdobles, y la lista de dudas.
```
