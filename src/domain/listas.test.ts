import { describe, expect, it } from 'vitest';
import { construir } from './importar.ts';
import { alumnosDeDocx } from './listas.ts';
import { crudasEjemplo } from './prueba.ts';
import { avisosAmbiguos } from './resolver.ts';

// Fragmento con la forma de las listas del colegio (datos ficticios).
const p = (t: string) => `<w:p><w:r><w:t>${t}</w:t></w:r></w:p>`;
const fila = (...c: string[]) => `<w:tr>${c.map((x) => `<w:tc>${p(x)}</w:tc>`).join('')}</w:tr>`;
const XML = p('Curso 2026 – 2027') + p('Grupo: 1ºB')
  + `<w:tbl>${fila('Op: 2 (M-F/Q-B/G)', '')}</w:tbl>`
  + `<w:tbl>${fila('Nº', 'Expte.', 'Alumnos', 'Opc.', 'Opt.', '')}${fila('1', '900001', 'Prueba Uno, Ana', '2', 'ANAT', '')}`
  + `${fila('2', '900009', 'Prueba Baja, Eva', '2', 'ECO', 'BAJA 20/10/2026')}${fila('', '', '', '', '', '')}</w:tbl>`
  + p('Grupo: 1ºE') + `<w:tbl>${fila('Nº', 'Expte.', 'Alumnos', 'Opt.', '')}${fila('1', '900010', 'Prueba Diez, Rosa', 'C.C', '')}</w:tbl>`;

describe('listas del colegio', () => {
  it('lee grupo, nombre y opción; excluye bajas y filas vacías', () => {
    const r = alumnosDeDocx(XML);
    expect(r.filas).toEqual([
      { expediente: '900001', apellidos: 'Prueba Uno', nombre: 'Ana', grupo: '1B', opcion: '2', optativa: 'ANAT', confesion_mensual: '' },
      { expediente: '900010', apellidos: 'Prueba Diez', nombre: 'Rosa', grupo: '1E', opcion: '', optativa: 'C.C', confesion_mensual: '' },
    ]);
    expect(r.avisos).toEqual(['1B: baja excluida (expediente 900009)']);
  });

  it('sin columna de opción la deduce del horario del grupo (1ºE → opción 4) y no hay ambiguos', () => {
    const r = construir({ ...crudasEjemplo(), alumnos: alumnosDeDocx(XML).filas });
    expect(r.errores).toEqual([]);
    expect(r.datos!.alumnos.find((a) => a.grupo === '1E')?.opcion).toBe('4');
    expect(avisosAmbiguos(r.datos!)).toEqual([]);
  });

  it('avisa de horarios ambiguos', () => {
    const c = crudasEjemplo();
    c.alumnos = [{ expediente: '1', apellidos: 'X', nombre: 'Y', grupo: '2A', opcion: 'D', optativa: 'PSI', confesion_mensual: '' }];
    expect(avisosAmbiguos(construir(c).datos!)).toEqual(['2A: horario ambiguo para el expediente 1 (opción D, PSI)']);
  });
});
