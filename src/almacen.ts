import { clear, get, set } from 'idb-keyval';
import { z } from 'zod';
import { TABLAS, type Crudas } from './domain/esquemas';
import { construir, MAX_BYTES, type Alumno } from './domain/importar';

// El CSV importado (crudas) nunca se modifica. Lo que hace el usuario vive aparte, en `estado`.
const exps = z.array(z.string().max(12)).max(5000);
const ESTADO = z.object({
  mensual: z.record(z.string().max(12), z.boolean()), // añadidos (true) o quitados (false) respecto al CSV
  confesados: z.object({ mes: z.string(), exps }),
  listas: z.record(z.string().max(60), exps),
  avisos: z.object({ mes: z.string(), enviados: z.array(z.string()) }),
  prefs: z.object({ oscuro: z.boolean(), grande: z.boolean() }),
});
const CRUDAS = z.partialRecord(z.enum(TABLAS), z.array(z.record(z.string(), z.string())).max(5000));
const COPIA = z.object({ version: z.literal(1), crudas: CRUDAS, estado: ESTADO });

export type Estado = z.infer<typeof ESTADO>;
/** Actualización funcional: evita perder cambios con clics rápidos. */
export type Actualizar = (f: (e: Estado) => Estado) => void;

export const mesDe = (f: Date) => `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}`;

export const estadoVacio = (prefs = { oscuro: false, grande: false }): Estado => {
  const mes = mesDe(new Date());
  return { mensual: {}, confesados: { mes, exps: [] }, listas: {}, avisos: { mes, enviados: [] }, prefs };
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

/** Importar datos nuevos = empezar de cero (se conservan solo las preferencias de visualización). */
export async function reemplazarDatos(crudas: Crudas, prefs: Estado['prefs']): Promise<Estado> {
  const estado = estadoVacio(prefs);
  await set('crudas', crudas);
  await set('estado', estado);
  return estado;
}

export const borrarTodo = () => clear();

export const esMensual = (a: Alumno, e: Estado) => e.mensual[a.expediente] ?? a.confesionMensual;

export const copiaJson = (crudas: Crudas, estado: Estado) =>
  new Blob([JSON.stringify({ version: 1, crudas, estado })], { type: 'application/json' });

export async function leerCopia(f: File): Promise<{ crudas: Crudas; estado: Estado } | string> {
  if (f.size > MAX_BYTES) return 'La copia supera 5 MB';
  let json: unknown;
  try { json = JSON.parse(await f.text()); } catch { return 'El archivo no es JSON válido'; }
  const r = COPIA.safeParse(json);
  if (!r.success) return 'La copia no tiene el formato esperado';
  const errores = construir(r.data.crudas).errores;
  if (errores.length) return `Copia con datos no válidos: ${errores[0]}`;
  await set('crudas', r.data.crudas);
  await set('estado', alDia(r.data.estado));
  return { crudas: r.data.crudas, estado: alDia(r.data.estado) };
}
