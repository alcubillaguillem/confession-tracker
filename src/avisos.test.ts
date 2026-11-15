import { describe, expect, it } from 'vitest';
import { avisoPendiente } from './avisos';

const dia = (d: number) => new Date(2026, 10, d); // noviembre: 30 días

describe('avisoPendiente', () => {
  it('nada antes del 15 ni sin alumnos', () => {
    expect(avisoPendiente(dia(10), 5, 3, [])).toBeNull();
    expect(avisoPendiente(dia(20), 0, 0, [])).toBeNull();
  });
  it('mitad, final y una vez al mes', () => {
    expect(avisoPendiente(dia(15), 5, 3, [])).toBe('mitad');
    expect(avisoPendiente(dia(20), 5, 3, ['mitad'])).toBeNull();
    expect(avisoPendiente(dia(28), 5, 3, ['mitad'])).toBe('final');
    expect(avisoPendiente(dia(29), 5, 3, ['mitad', 'final'])).toBeNull();
  });
  it('enhorabuena en cuanto no quedan pendientes', () => {
    expect(avisoPendiente(dia(3), 5, 0, [])).toBe('enhorabuena');
    expect(avisoPendiente(dia(4), 5, 0, ['enhorabuena'])).toBeNull();
  });
});
