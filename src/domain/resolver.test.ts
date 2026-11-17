import { describe, expect, it } from 'vitest';
import { construir, type Alumno } from './importar';
import { crudasEjemplo } from './prueba';
import { agruparPorAula, asignaturasDe, asignaturasFiltrables, consultar, franjaDe, modalidadDe } from './resolver';

const datos = construir(crudasEjemplo()).datos!;
const alumno = (grupo: string, opcion: string, optativa: string): Alumno =>
  ({ expediente: '1', apellidos: 'X', nombre: 'Y', grupo, opcion, optativa, confesionMensual: false });

// Sección 5.4 de la especificación.
const CASOS: [string, string, string, string, string, string][] = [
  ['1B', '2', 'ANAT', 'F3', 'Biología y Geología', '3.3'],
  ['1B', '2', 'ANAT', 'F4', 'Anatomía', '4.3'],
  ['1B', '2', 'ANAT', 'F5', 'Física y Química', '3.3'],
  ['1B', '2', 'ECO', 'F3', 'Economía', '4.3'],
  ['1B', '2', 'ECO', 'F4', 'Física y Química', '3.3'],
  ['1B', '2', 'ECO', 'F5', 'Biología y Geología', '4.1'],
  ['1A', '3', 'D.T', 'F3', 'Tecnología e Ingeniería I', '4.4'],
  ['1A', '3', 'D.T', 'F5', 'Dibujo Técnico I', 'A. Dibujo'],
  ['1D', '5', 'ECO', 'F1', 'Literatura Universal', '4.2'],
  ['1D', '5', 'ECO', 'F3', 'Economía', '4.3'],
  ['1D', '5', 'ECO', 'F4', 'Latín I', 'A. Emp'],
  ['2A', 'D', 'FIS', 'F2', 'Química', '3.1'],
  ['2A', 'D', 'FIS', 'F6', 'Biología', '3.1'],
  ['2A', 'D', 'FIS', 'F7', 'Física', '3.2'],
  ['2E', 'I', 'EMP', 'F1', 'Geografía', '2.2'],
  ['2E', 'I', 'EMP', 'F2', 'Empresa', '2.1'],
  ['2E', 'I', 'EMP', 'F7', 'Historia del Arte', '1.1'],
  ['2C', 'F', 'LAT', 'F3', 'Latín II', 'A. Emp'],
  ['2C', 'F', 'LAT', 'F4', 'Mat CCSS II', '2.2'],
  ['2C', 'F', 'LAT', 'F7', 'Geografía', '1.2'],
];

describe('consultar', () => {
  it.each(CASOS)('%s op %s %s lunes %s → %s %s', (g, op, opt, franja, asignatura, aula) => {
    const r = consultar(datos, alumno(g, op, opt), 'lunes', franja);
    expect(r.ambiguo).toBe(false);
    expect(r.opciones).toEqual([expect.objectContaining({ asignatura, aula })]);
  });

  it('recreo, celda vacía, Ed. Física y asignatura común', () => {
    const a = alumno('1A', '3', 'D.T');
    expect(consultar(datos, a, 'lunes', 'RECREO').mensaje).toBe('Recreo');
    expect(consultar(datos, a, 'lunes', 'F7').mensaje).toBe('Sin clase');
    expect(consultar(datos, a, 'martes', 'F5').opciones[0]?.aula).toBe('Gimnasio');
    expect(consultar(datos, a, 'lunes', 'F1').opciones[0]).toEqual({ asignatura: 'Filosofía', aula: '4.4', supuesta: false });
  });

  it('2A opción A + Psicología: "Biología / Química / DT II" → DT II', () => {
    expect(consultar(datos, alumno('2A', 'A', 'PSI'), 'lunes', 'F6').opciones[0]?.asignatura).toBe('Dibujo Técnico II');
  });

  it('sin solución → horario ambiguo con opciones', () => {
    // 2A opción D + Psicología: Química y Psicología solo caben en el mismo bloque → 0 soluciones.
    const r = consultar(datos, alumno('2A', 'D', 'PSI'), 'lunes', 'F2');
    expect(r.ambiguo).toBe(true);
    expect(r.opciones.map((o) => o.asignatura)).toEqual(['Química', 'Psicología']);
  });
});

describe('franjaDe y agruparPorAula', () => {
  it('hora → franja', () => {
    expect(franjaDe(datos, new Date(2026, 10, 16, 10, 30))).toEqual({ dia: 'lunes', franja: 'F3' });
    expect(franjaDe(datos, new Date(2026, 10, 15, 10, 30))).toBeNull(); // domingo
    expect(franjaDe(datos, new Date(2026, 10, 16, 16, 0))).toBeNull();
  });

  it('agrupa por aula y ordena por planta', () => {
    const r = agruparPorAula(datos, [alumno('1B', '2', 'ECO'), alumno('2E', 'I', 'EMP'), alumno('1B', '2', 'ANAT')], 'lunes', 'F3');
    expect(r.map((g) => g.aula)).toEqual(['A. Emp', '3.3', '4.3']);
  });
});

describe('filtros por modalidad y asignatura', () => {
  it('modalidad según las asignaturas de cada opción', () => {
    const m = (g: string, op: string) => modalidadDe(datos, alumno(g, op, 'C.C'));
    expect([m('1A', '1'), m('1A', '3'), m('2A', 'A'), m('2C', 'C')]).toEqual(['Tecnológico', 'Tecnológico', 'Tecnológico', 'Tecnológico']);
    expect([m('1B', '2'), m('2B', 'B'), m('2D', 'D')]).toEqual(['Ciencias', 'Ciencias', 'Ciencias']);
    expect([m('1E', '4'), m('1D', '6'), m('2F', 'F'), m('2E', 'G')]).toEqual(['Sociales', 'Sociales', 'Sociales', 'Sociales']);
    expect([m('1D', '5'), m('2E', 'I')]).toEqual(['Humanidades', 'Humanidades']);
  });

  it('asignaturas: las de la opción más la optativa; la lista del filtro las incluye', () => {
    expect(asignaturasDe(datos, alumno('1D', '5', 'ECO')).sort()).toEqual(['Economía', 'Historia Mundo', 'Latín I', 'Literatura Universal']);
    expect(asignaturasFiltrables(datos)).toEqual(expect.arrayContaining(['Economía', 'Latín I', 'Computación', 'Anatomía']));
    expect(asignaturasFiltrables(datos)).not.toContain('Religión');
  });
});
