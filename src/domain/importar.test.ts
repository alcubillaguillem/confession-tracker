import { describe, expect, it } from 'vitest';
import { canon } from './catalogo';
import { construir } from './importar';
import { crudasEjemplo } from './prueba';

describe('catálogo', () => {
  it('alias → canónico', () => {
    expect(canon('F/Q')).toBe('Física y Química');
    expect(canon('fís-quím')).toBe('Física y Química');
    expect(canon('Biología', '1')).toBe('Biología y Geología');
    expect(canon('Biología', '2')).toBe('Biología');
    expect(canon('HISTORIA', '2')).toBe('Historia de España');
    expect(canon('Cocina')).toBeUndefined();
  });
});

describe('construir', () => {
  it('datos de ejemplo sin errores y con aviso de Francés I en 1A', () => {
    const r = construir(crudasEjemplo());
    expect(r.errores).toEqual([]);
    expect(r.datos?.alumnos).toHaveLength(7);
    expect(r.avisos.some((a) => a.startsWith('1A · Francés I'))).toBe(true);
  });

  it('errores con archivo, fila y motivo', () => {
    const c = crudasEjemplo();
    const base = { apellidos: 'A', nombre: 'B', opcion: '1', optativa: 'TIN' };
    c.alumnos = [
      { ...base, expediente: '1', grupo: '9Z', confesion_mensual: '' },
      { ...base, expediente: 'x', grupo: '1A', confesion_mensual: 'tal vez' },
      { ...base, expediente: '2', grupo: '1A', optativa: 'C.C.', confesion_mensual: 'si' },
    ];
    c.horarios = [...c.horarios!, { grupo: '1A', franja: 'F9', lunes: '', martes: '', miercoles: '', jueves: '', viernes: '' }];
    const r = construir(c);
    expect(r.datos).toBeUndefined();
    expect(r.errores).toEqual([
      expect.stringMatching(/^horarios, fila 75: franja "F9"/),
      expect.stringMatching(/^alumnos, fila 3: expediente: .*confesion_mensual: si o vacío$/),
      expect.stringMatching(/^alumnos, fila 2: grupo "9Z"/),
    ]);
  });

  it('falta un archivo', () => {
    const c = crudasEjemplo();
    delete c.aulas;
    expect(construir(c).errores[0]).toBe('aulas: falta el archivo o está vacío');
  });
});
