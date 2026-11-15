---
name: resolver-horario
description: Reglas para calcular en qué aula está un alumno (desdobles, asignación semanal, consulta) y casos de prueba obligatorios. Úsala al tocar src/domain/resolver.ts o sus tests.
---
# Resolver horario

Implementación: `src/domain/resolver.ts`. Fuente: secciones 4 y 5 de la especificación.

## Modelo
- Cada grupo tiene aula base. Celda con varias asignaturas (`A / B / C`) = desdoble.
- Asignaturas del alumno = `opción(curso, opcion)` (3) ∪ `{optativa}` (1) = 4 no comunes.
- Comunes 1º: Filosofía, Lengua I, Inglés I, Ed. Física, Religión. Comunes 2º: Lengua II, Inglés II, Historia de España, Hª Filosofía, Religión, Tutoría.

## Asignación semanal (una vez por alumno, cacheada)
1. Celdas del grupo que no son comunes → agrupar por conjunto de asignaturas = "tipo de bloque".
2. Buscar asignaciones tipo → asignatura del alumno contenida en él, o "libre", con cada una de las 4 asignaturas en exactamente un tipo.
3. Backtracking (≤ 6 tipos). 1 solución = OK; 0 o varias = "horario ambiguo": mostrar todas las opciones.

## Consulta (alumno, día, hora)
1. Hora → franja. RECREO o fuera de horario → indicarlo.
2. Celda vacía → "Sin clase". Común → esa asignatura. Si no, la asignatura asignada al tipo de bloque; "libre" → "Sin clase en esta franja".
3. Aula: fila de desdobles (día, franja, curso, asignatura, grupo ∈ grupos). Si no hay: Ed. Física → Gimnasio; resto → aula base. En celda con varias asignaturas sin fila → marcar "(aula supuesta)".

## Casos obligatorios (sección 5.4)
| Grupo | Opción | Optativa | Franja (lunes) | Resultado |
|---|---|---|---|---|
| 1B | 2 | ANAT | F3 / F4 / F5 | Biología y Geología 3.3 / Anatomía 4.3 / Física y Química 3.3 |
| 1B | 2 | ECO | F3 / F4 / F5 | Economía 4.3 / Física y Química 3.3 / Biología y Geología 4.1 |
| 1A | 3 | D.T | F3 / F5 | Tecnología e Ingeniería I 4.4 / Dibujo Técnico I A. Dibujo |
| 1D | 5 | ECO | F1 / F3 / F4 | Literatura Universal 4.2 / Economía 4.3 / Latín I A. Emp |
| 2A | D | FIS | F2 / F6 / F7 | Química 3.1 / Biología 3.1 / Física 3.2 |
| 2E | I | EMP | F1 / F2 / F7 | Geografía 2.2 / Empresa 2.1 / Historia del Arte 1.1 |
| 2C | F | LAT | F3 / F4 / F7 | Latín II A. Emp / Mat CCSS II 2.2 / Geografía 1.2 |

Aceptación con datos reales: los 298 alumnos tienen exactamente 1 solución (`src/domain/aceptacion.test.ts`, solo recuentos).
