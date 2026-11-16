// Aceptación (sección 5.2): con los datos reales, todos los alumnos tienen exactamente 1 solución.
// Solo se ejecuta si el archivo existe en este equipo y solo compara recuentos, nunca nombres.
import { existsSync, readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { construir, leerCsv } from './importar.ts';
import { crudasEjemplo } from './prueba.ts';
import { asignaciones } from './resolver.ts';

// Generado por `npm run preparar` a partir de las listas del colegio.
const REAL = 'horarios_y_alumnos/2026-27/alumnos.csv';

it.skipIf(!existsSync(REAL))('298 alumnos reales con horario único', () => {
  const r = construir({ ...crudasEjemplo(), alumnos: leerCsv(readFileSync(REAL, 'utf8')) });
  expect(r.errores.length).toBe(0);
  const d = r.datos!;
  const noUnicos = d.alumnos.filter((a) => asignaciones(d, a).length !== 1).length;
  expect({ total: d.alumnos.length, noUnicos }).toEqual({ total: 298, noUnicos: 0 });
});
