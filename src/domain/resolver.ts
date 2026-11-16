import { COMUNES, DIAS, norm, type Dia } from './catalogo.ts';
import { buscarAula, type Alumno, type Datos } from './importar.ts';

export type Ubicacion = { asignatura: string; aula: string; supuesta: boolean };
/** opciones vacías → `mensaje`; más de una → horario ambiguo. */
export type Consulta = { mensaje?: string; opciones: Ubicacion[]; ambiguo: boolean };
type Asignacion = Map<string, string | null>; // tipo de bloque → asignatura del alumno o libre

const clave = (asigs: string[]) => [...asigs].sort().join(' / ');

export const asignaturasDe = (d: Datos, a: Alumno) => {
  const c = d.grupos[a.grupo]!.curso;
  return [...new Set([...(d.opciones[`${c}|${a.opcion}`] ?? []), d.optativas[`${c}|${a.optativa}`]!])];
};

/** Tipos de bloque del grupo: celdas no comunes agrupadas por conjunto de asignaturas (sección 5.2). */
function tiposDeBloque(d: Datos, grupo: string) {
  const comunes = COMUNES[d.grupos[grupo]!.curso]!;
  const tipos = new Map<string, string[]>();
  for (const dias of Object.values(d.horarios[grupo] ?? {}))
    for (const c of Object.values(dias))
      if (c?.length && !(c.length === 1 && comunes.has(c[0]!))) tipos.set(clave(c), c);
  return [...tipos];
}

const cache = new WeakMap<Alumno, Asignacion[]>();

/** Todas las asignaciones válidas (backtracking). Una sola = horario resuelto. */
export function asignaciones(d: Datos, a: Alumno): Asignacion[] {
  const hit = cache.get(a);
  if (hit) return hit;
  const tipos = tiposDeBloque(d, a.grupo);
  const mias = asignaturasDe(d, a);
  const sols: Asignacion[] = [];
  const actual: Asignacion = new Map();
  const usadas = new Set<string>();
  const bt = (i: number): void => {
    if (i === tipos.length) { if (usadas.size === mias.length) sols.push(new Map(actual)); return; }
    const [k, asigs] = tipos[i]!;
    for (const s of mias) {
      if (usadas.has(s) || !asigs.includes(s)) continue;
      usadas.add(s); actual.set(k, s); bt(i + 1); usadas.delete(s);
    }
    actual.set(k, null); bt(i + 1);
  };
  bt(0);
  cache.set(a, sols);
  return sols;
}

function ubicar(d: Datos, a: Alumno, dia: Dia, franja: string, asignatura: string, desdoble: boolean): Ubicacion {
  const aula = buscarAula(d, a.grupo, dia, franja, asignatura);
  if (aula) return { asignatura, aula, supuesta: false };
  if (asignatura === 'Ed. Física') return { asignatura, aula: 'Gimnasio', supuesta: false };
  return { asignatura, aula: d.grupos[a.grupo]!.aulaBase, supuesta: desdoble };
}

/** Dónde está un alumno en un día y franja (sección 5.3). */
export function consultar(d: Datos, a: Alumno, dia: Dia, franja: string): Consulta {
  const nada = (mensaje: string): Consulta => ({ mensaje, opciones: [], ambiguo: false });
  if (norm(franja) === 'recreo') return nada('Recreo');
  const celda = d.horarios[a.grupo]?.[franja]?.[dia] ?? [];
  if (!celda.length) return nada('Sin clase');
  if (celda.length === 1 && COMUNES[d.grupos[a.grupo]!.curso]!.has(celda[0]!))
    return { opciones: [ubicar(d, a, dia, franja, celda[0]!, false)], ambiguo: false };

  const sols = asignaciones(d, a);
  const k = clave(celda);
  let elegidas = [...new Set(sols.map((s) => s.get(k) ?? null))];
  if (!sols.length) { // sin solución: todas las del alumno presentes en la celda
    const mias = asignaturasDe(d, a).filter((s) => celda.includes(s));
    elegidas = mias.length ? mias : celda;
  }
  const opciones = elegidas.filter((s): s is string => s !== null)
    .map((s) => ubicar(d, a, dia, franja, s, celda.length > 1));
  const ambiguo = sols.length !== 1;
  return opciones.length ? { opciones, ambiguo } : { ...nada('Sin clase en esta franja'), ambiguo };
}

/** Alumnos sin una única asignación semanal: hay que revisar el horario o la hoja de desdobles. */
export const avisosAmbiguos = (d: Datos) => d.alumnos.filter((a) => asignaciones(d, a).length !== 1)
  .map((a) => `${a.grupo}: horario ambiguo para el expediente ${a.expediente} (opción ${a.opcion}, ${a.optativa})`);

/** Día y franja de una fecha, o null si es fin de semana o fuera de horario. */
export function franjaDe(d: Datos, fecha: Date): { dia: Dia; franja: string } | null {
  const dia = DIAS[fecha.getDay() - 1];
  const hhmm = fecha.toTimeString().slice(0, 5);
  const f = d.franjas.find((x) => x.inicio <= hhmm && hhmm < x.fin);
  return dia && f ? { dia, franja: f.franja } : null;
}

export type Grupo = { aula: string; planta: number | null; alumnos: { alumno: Alumno; consulta: Consulta }[] };

/** Búsqueda múltiple: agrupa por aula y ordena por planta (ruta). Sin aula única → grupo con el mensaje. */
export function agruparPorAula(d: Datos, alumnos: Alumno[], dia: Dia, franja: string): Grupo[] {
  const grupos = new Map<string, Grupo>();
  for (const alumno of alumnos) {
    const consulta = consultar(d, alumno, dia, franja);
    const aula = consulta.opciones.length === 1 ? consulta.opciones[0]!.aula
      : consulta.mensaje ?? 'Varias opciones';
    const g = grupos.get(aula) ?? { aula, planta: d.aulas[aula]?.planta ?? null, alumnos: [] };
    g.alumnos.push({ alumno, consulta });
    grupos.set(aula, g);
  }
  return [...grupos.values()].sort((x, y) =>
    (x.planta ?? 99) - (y.planta ?? 99) || x.aula.localeCompare(y.aula, 'es', { numeric: true }));
}
