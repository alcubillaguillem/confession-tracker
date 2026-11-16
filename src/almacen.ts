import { get, set } from 'idb-keyval';
import { z } from 'zod';
import { descifrar } from './domain/cifrado.ts';
import { TABLAS, type Crudas } from './domain/esquemas.ts';
import { construir, type Alumno } from './domain/importar.ts';

// Base de datos local (IndexedDB). Los datos del curso (crudas) nunca se modifican; lo que hace el usuario vive en `estado`.
const exps = z.array(z.string().max(12)).max(5000);
const ESTADO = z.object({
  mensual: z.record(z.string().max(12), z.boolean()), // añadidos (true) o quitados (false) respecto al CSV
  confesados: z.object({ mes: z.string(), exps }),
  avisos: z.object({ mes: z.string(), enviados: z.array(z.string()) }),
  prefs: z.object({ oscuro: z.boolean(), grande: z.boolean() }),
  ocultos: exps.default([]), // "eliminados" por el usuario; el CSV no cambia
  apodos: z.record(z.string().max(12), z.string().trim().min(1).max(60)).default({}),
});
const CRUDAS = z.partialRecord(z.enum(TABLAS), z.array(z.record(z.string(), z.string())).max(5000));
const CURSO = z.object({ version: z.literal(1), id: z.string().max(100), crudas: CRUDAS });

export type Estado = z.infer<typeof ESTADO>;
/** Actualización funcional: evita perder cambios con clics rápidos. */
export type Actualizar = (f: (e: Estado) => Estado) => void;

export const mesDe = (f: Date) => `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}`;

export const estadoVacio = (prefs = { oscuro: false, grande: false }): Estado => {
  const mes = mesDe(new Date());
  return { mensual: {}, confesados: { mes, exps: [] }, avisos: { mes, enviados: [] }, prefs, ocultos: [], apodos: {} };
};

/** Las marcas mensuales caducan al cambiar de mes. */
const alDia = (e: Estado): Estado => {
  const mes = mesDe(new Date());
  return {
    ...e,
    confesados: e.confesados.mes === mes ? e.confesados : { mes, exps: [] },
    avisos: e.avisos.mes === mes ? e.avisos : { mes, enviados: [] },
  };
};

export async function cargar(): Promise<{ crudas?: Crudas; estado: Estado }> {
  const c = CRUDAS.safeParse(await get('crudas'));
  const e = ESTADO.safeParse(await get('estado'));
  return { crudas: c.success ? c.data : undefined, estado: alDia(e.success ? e.data : estadoVacio()) };
}

export const guardarEstado = (e: Estado) => set('estado', e);

/**
 * Primera apertura: descifra los datos del curso (./curso.enc, publicado con la app) con la contraseña,
 * los valida y los guarda en la base de datos local. Después la app ya no la vuelve a pedir.
 */
export async function desbloquear(contrasena: string, prefs: Estado['prefs']): Promise<{ crudas: Crudas; estado: Estado } | string> {
  let bytes: Uint8Array;
  try { bytes = new Uint8Array(await (await fetch('./curso.enc', { cache: 'no-store' })).arrayBuffer()); }
  catch { return 'Sin conexión. La primera vez hace falta internet.'; }
  let json: unknown;
  try { json = await descifrar(bytes, contrasena); } catch { return 'Contraseña incorrecta.'; }
  const r = CURSO.safeParse(json);
  if (!r.success || construir(r.data.crudas).errores.length) return 'Los datos del curso no son válidos.';
  const estado = estadoVacio(prefs);
  await set('crudas', r.data.crudas);
  await set('estado', estado);
  return { crudas: r.data.crudas, estado };
}

export const esMensual = (a: Alumno, e: Estado) => e.mensual[a.expediente] ?? a.confesionMensual;

export const visibles = (alumnos: Alumno[], e: Estado) => {
  const ocultos = new Set(e.ocultos);
  return alumnos.filter((a) => !ocultos.has(a.expediente));
};

/** Nombre a mostrar: el apodo, si lo hay. */
export const nombreDe = (a: Alumno, e: Estado) => `${e.apodos[a.expediente] ?? a.nombre} ${a.apellidos}`;

/** Texto en el que busca el buscador: apodo, nombre real, apellidos y grupo. */
export const textoBusqueda = (a: Alumno, e: Estado) =>
  `${e.apodos[a.expediente] ?? ''} ${a.nombre} ${a.apellidos} ${a.grupo}`;

export const alternarMensual = (a: Alumno) => (e: Estado): Estado => {
  const { [a.expediente]: _, ...resto } = e.mensual;
  const nuevo = !esMensual(a, e);
  return { ...e, mensual: nuevo === a.confesionMensual ? resto : { ...resto, [a.expediente]: nuevo } };
};

export const ponerApodo = (exp: string, apodo: string) => (e: Estado): Estado => {
  const { [exp]: _, ...apodos } = e.apodos;
  const limpio = apodo.trim().slice(0, 60);
  return { ...e, apodos: limpio ? { ...apodos, [exp]: limpio } : apodos };
};

/** Oculta al alumno y borra todo lo que la app guardaba de él. */
export const ocultar = (exp: string) => (e: Estado): Estado => {
  const { [exp]: _m, ...mensual } = e.mensual;
  const { [exp]: _a, ...apodos } = e.apodos;
  return {
    ...e, mensual, apodos,
    ocultos: [...new Set([...e.ocultos, exp])],
    confesados: { ...e.confesados, exps: e.confesados.exps.filter((x) => x !== exp) },
  };
};

export const mostrar = (exp: string) => (e: Estado): Estado => ({ ...e, ocultos: e.ocultos.filter((x) => x !== exp) });
