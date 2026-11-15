import { z } from 'zod';

const txt = z.string().trim().max(200);
const req = txt.min(1, 'vacío');
const hora = z.string().trim().regex(/^\d{2}:\d{2}$/, 'hora HH:MM');
const curso = z.enum(['1', '2'], 'curso 1 o 2');
const dia = z.enum(['lunes', 'martes', 'miercoles', 'jueves', 'viernes'], 'día no válido');

export const ESQUEMAS = {
  franjas: z.object({ franja: req, inicio: hora, fin: hora }),
  grupos: z.object({ grupo: z.string().trim().regex(/^[12][A-Z]$/, 'grupo tipo 1A'), curso, aula_base: req }),
  aulas: z.object({ aula: req, planta: z.string().trim().regex(/^\d*$/, 'planta numérica'), descripcion: txt.default('') }),
  horarios: z.object({ grupo: req, franja: req, lunes: txt, martes: txt, miercoles: txt, jueves: txt, viernes: txt }),
  desdobles: z.object({ dia, franja: req, curso, asignatura: req, grupos: z.string().trim().regex(/^[A-Z]+$/, 'letras de grupo'), aula: req }),
  opciones: z.object({ curso, opcion: req, asignaturas: req }),
  optativas: z.object({ curso, codigo: req, asignatura: req }),
  alumnos: z.object({
    expediente: z.string().trim().regex(/^\d{1,12}$/, 'expediente numérico'),
    apellidos: req, nombre: req, grupo: req,
    opcion: txt, optativa: req,
    confesion_mensual: z.string().trim().toLowerCase().refine((v) => ['', 'si', 'sí'].includes(v), 'si o vacío').default(''),
  }),
} as const;

export type Tabla = keyof typeof ESQUEMAS;
export const TABLAS = Object.keys(ESQUEMAS) as Tabla[];
export type Fila<T extends Tabla> = z.infer<(typeof ESQUEMAS)[T]>;
/** Filas crudas tal como vienen del archivo (cabecera → texto). */
export type Crudas = Partial<Record<Tabla, Record<string, string>[]>>;
