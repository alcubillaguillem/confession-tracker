import Papa from 'papaparse';
import { canon, DIAS, norm, type Dia } from './catalogo';
import { ESQUEMAS, TABLAS, type Crudas, type Fila, type Tabla } from './esquemas';

export const MAX_BYTES = 5 * 1024 * 1024;

export type Alumno = {
  expediente: string; apellidos: string; nombre: string; grupo: string;
  opcion: string; optativa: string; confesionMensual: boolean;
};
export type Datos = {
  franjas: Fila<'franjas'>[];
  grupos: Record<string, { curso: '1' | '2'; aulaBase: string }>;
  aulas: Record<string, { planta: number | null; descripcion: string }>;
  /** grupo → franja → día → asignaturas canónicas de la celda */
  horarios: Record<string, Record<string, Partial<Record<Dia, string[]>>>>;
  desdobles: { dia: Dia; franja: string; curso: string; asignatura: string; grupos: string; aula: string }[];
  /** "curso|opcion" → asignaturas; "curso|codigo" → asignatura */
  opciones: Record<string, string[]>;
  optativas: Record<string, string>;
  alumnos: Alumno[];
};
export type Resultado = { datos?: Datos; errores: string[]; avisos: string[] };

export const codigoOptativa = (c: string) => c.trim().toUpperCase().replace(/\.$/, '');
const celda = (v: string) => v.split(/\s+\/\s+/).map((s) => s.trim()).filter(Boolean);

export function leerCsv(texto: string): Record<string, string>[] {
  const r = Papa.parse<Record<string, string>>(texto.replace(/^﻿/, ''), {
    header: true, delimiter: ';', skipEmptyLines: 'greedy', transformHeader: (h) => h.trim().toLowerCase(),
  });
  return r.data;
}

/** Tabla a la que corresponde un nombre de archivo u hoja ("alumnos_2026-27.csv" → alumnos). */
export const tablaDe = (nombre: string) => TABLAS.find((t) => norm(nombre).startsWith(t));

/** Lee CSV sueltos o un XLSX con una hoja por tabla. */
export async function leerArchivos(files: File[]): Promise<{ crudas: Crudas; errores: string[] }> {
  const crudas: Crudas = {};
  const errores: string[] = [];
  for (const f of files) {
    if (f.size > MAX_BYTES) { errores.push(`${f.name}: supera 5 MB`); continue; }
    if (/\.xlsx$/i.test(f.name)) {
      const { default: leerXlsx, readSheetNames } = await import('read-excel-file');
      for (const hoja of await readSheetNames(f)) {
        const t = tablaDe(hoja);
        if (!t) continue;
        const [cab = [], ...filas] = await leerXlsx(f, { sheet: hoja });
        const claves = cab.map((c) => String(c ?? '').trim().toLowerCase());
        crudas[t] = filas.map((fila) => Object.fromEntries(claves.map((k, i) => [k, texto(fila[i])])));
      }
    } else {
      const t = tablaDe(f.name);
      if (t) crudas[t] = leerCsv(await f.text());
      else errores.push(`${f.name}: nombre de archivo no reconocido`);
    }
  }
  return { crudas, errores };
}

const texto = (v: unknown) =>
  v instanceof Date ? v.toISOString().slice(11, 16) : v == null ? '' : String(v);

/** Valida las tablas crudas y construye el modelo. Si hay errores, no devuelve datos. */
export function construir(crudas: Crudas): Resultado {
  const errores: string[] = [];
  const avisos: string[] = [];
  const err = (t: Tabla, i: number, m: string): void => { errores.push(`${t}, fila ${i + 2}: ${m}`); };

  const v = <T extends Tabla>(t: T): Fila<T>[] => {
    const filas = crudas[t];
    if (!filas?.length) { errores.push(`${t}: falta el archivo o está vacío`); return []; }
    const out: Fila<T>[] = [];
    filas.forEach((f, i) => {
      const r = ESQUEMAS[t].safeParse(f);
      if (r.success) out.push(r.data as Fila<T>);
      else err(t, i, r.error.issues.map((x) => `${x.path.join('.')}: ${x.message}`).join('; '));
    });
    return out;
  };
  const asig = (t: Tabla, i: number, nombre: string, curso: string) => {
    const c = canon(nombre, curso);
    if (!c) err(t, i, `asignatura desconocida "${nombre}"`);
    return c ?? nombre;
  };

  const d: Datos = { franjas: v('franjas'), grupos: {}, aulas: {}, horarios: {}, desdobles: [], opciones: {}, optativas: {}, alumnos: [] };
  const franjas = new Set(d.franjas.map((f) => f.franja));

  for (const a of v('aulas')) d.aulas[a.aula] = { planta: a.planta ? Number(a.planta) : null, descripcion: a.descripcion };
  v('grupos').forEach((g, i) => {
    if (!d.aulas[g.aula_base]) err('grupos', i, `aula "${g.aula_base}" no está en aulas`);
    d.grupos[g.grupo] = { curso: g.curso, aulaBase: g.aula_base };
  });
  v('horarios').forEach((h, i) => {
    const g = d.grupos[h.grupo];
    if (!g) return err('horarios', i, `grupo "${h.grupo}" no está en grupos`);
    if (!franjas.has(h.franja)) return err('horarios', i, `franja "${h.franja}" no está en franjas`);
    const fila: Partial<Record<Dia, string[]>> = ((d.horarios[h.grupo] ??= {})[h.franja] = {});
    for (const dia of DIAS) fila[dia] = celda(h[dia]).map((s) => asig('horarios', i, s, g.curso));
  });
  v('desdobles').forEach((x, i) => {
    if (!franjas.has(x.franja)) err('desdobles', i, `franja "${x.franja}" no está en franjas`);
    if (!d.aulas[x.aula]) err('desdobles', i, `aula "${x.aula}" no está en aulas`);
    d.desdobles.push({ ...x, asignatura: asig('desdobles', i, x.asignatura, x.curso) });
  });
  v('opciones').forEach((o, i) => {
    d.opciones[`${o.curso}|${o.opcion}`] = celda(o.asignaturas).map((s) => asig('opciones', i, s, o.curso));
  });
  v('optativas').forEach((o, i) => {
    d.optativas[`${o.curso}|${codigoOptativa(o.codigo)}`] = asig('optativas', i, o.asignatura, o.curso);
  });

  const vistos = new Set<string>();
  v('alumnos').forEach((a, i) => {
    const g = d.grupos[a.grupo];
    if (vistos.has(a.expediente)) return err('alumnos', i, `expediente ${a.expediente} repetido`);
    vistos.add(a.expediente);
    if (!g) return err('alumnos', i, `grupo "${a.grupo}" no está en grupos`);
    const optativa = codigoOptativa(a.optativa);
    if (!d.opciones[`${g.curso}|${a.opcion}`]) return err('alumnos', i, `opción "${a.opcion}" no existe en ${g.curso}º`);
    if (!d.optativas[`${g.curso}|${optativa}`]) return err('alumnos', i, `optativa "${a.optativa}" no existe en ${g.curso}º`);
    d.alumnos.push({ ...a, optativa, confesionMensual: a.confesion_mensual !== '' });
  });

  avisos.push(...coherencia(d));
  return errores.length ? { errores, avisos } : { datos: d, errores, avisos };
}

/** Asignaturas desdobladas de un grupo sin aula en la hoja de desdobles (sección 6, "chequeo de coherencia"). */
function coherencia(d: Datos): string[] {
  const huecos = new Map<string, string[]>();
  for (const [grupo, franjas] of Object.entries(d.horarios)) {
    for (const [franja, dias] of Object.entries(franjas)) {
      for (const [dia, asigs = []] of Object.entries(dias)) {
        if (asigs.length < 2) continue;
        for (const a of asigs) {
          if (buscarAula(d, grupo, dia as Dia, franja, a)) continue;
          const k = `${grupo} · ${a}`;
          huecos.set(k, [...(huecos.get(k) ?? []), `${dia} ${franja}`]);
        }
      }
    }
  }
  return [...huecos].map(([k, cuando]) => `${k}: sin aula en desdobles (${cuando.join(', ')})`);
}

export const buscarAula = (d: Datos, grupo: string, dia: Dia, franja: string, asignatura: string) =>
  d.desdobles.find((x) => x.dia === dia && x.franja === franja && x.asignatura === asignatura &&
    x.curso === d.grupos[grupo]?.curso && x.grupos.includes(grupo.slice(1)))?.aula;
