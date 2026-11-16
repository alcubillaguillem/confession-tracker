import { describe, expect, it } from 'vitest';
import { alternarConfesado, alternarMensual, esMensual, estadoVacio, nombreDe, ocultar, mostrar, ponerApodo, textoBusqueda, visibles } from './almacen';
import type { Alumno } from './domain/importar';

const ana: Alumno = { expediente: '900001', apellidos: 'Prueba Uno', nombre: 'Ana', grupo: '1B', opcion: '2', optativa: 'ANAT', confesionMensual: true };
const luis: Alumno = { ...ana, expediente: '900002', nombre: 'Luis', confesionMensual: false };

describe('estado del usuario', () => {
  it('apodo: se muestra y se busca junto al nombre real; vacío lo quita', () => {
    const e = ponerApodo('900001', '  Anita ')(estadoVacio());
    expect(nombreDe(ana, e)).toBe('Anita Prueba Uno');
    expect(textoBusqueda(ana, e)).toContain('Anita');
    expect(textoBusqueda(ana, e)).toContain('Ana');
    expect(ponerApodo('900001', ' ')(e).apodos).toEqual({});
  });

  it('confesión mensual: alterna respecto al CSV sin guardar lo que ya dice el CSV', () => {
    const e = alternarMensual(luis)(estadoVacio());
    expect(esMensual(luis, e)).toBe(true);
    expect(alternarMensual(luis)(e).mensual).toEqual({});
  });

  it('confesado: marca y desmarca', () => {
    const e = alternarConfesado('900001')(estadoVacio());
    expect(e.confesados.exps).toEqual(['900001']);
    expect(alternarConfesado('900001')(e).confesados.exps).toEqual([]);
  });

  it('ocultar borra sus marcas y su apodo; mostrar lo recupera', () => {
    let e = estadoVacio();
    e = { ...e, confesados: { ...e.confesados, exps: ['900002'] } };
    e = ponerApodo('900002', 'Luisito')(alternarMensual(luis)(e));
    e = ocultar('900002')(e);
    expect(visibles([ana, luis], e)).toEqual([ana]);
    expect(e).toMatchObject({ mensual: {}, apodos: {}, confesados: { exps: [] } });
    expect(visibles([ana, luis], mostrar('900002')(e))).toEqual([ana, luis]);
  });
});
