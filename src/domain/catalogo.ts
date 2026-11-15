/** Minúsculas, sin tildes ni espacios sobrantes. */
export const norm = (s: string) =>
  s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/\s+/g, ' ').trim();

// Nombre canónico → alias (sección 8.7). El propio nombre canónico siempre es válido.
const ALIAS: Record<string, string[]> = {
  'Lengua I': ['LENG-LIT I', 'Lengua-Liter I'],
  'Lengua II': ['LENG-LIT II', 'Lengua-Liter II'],
  'Ed. Física': ['E. FÍSICA', 'Educ. Física'],
  'Historia Mundo': ['Hª Mundo C.'],
  'Historia de España': ['Hª España'],
  'Hª Filosofía': [],
  'Física y Química': ['FÍS-QUÍM', 'F/Q', 'Física Química'],
  'Biología y Geología': ['BIO-GEO-C AMB', 'B/G', 'Biología Geo y C Amb'],
  'Tecnología e Ingeniería I': ['T. ING I', 'TECN ING I', 'Tecn. Ing I'],
  'Tecnología e Ingeniería II': ['TING II', 'Tecn Ingeniería II'],
  'Dibujo Técnico I': ['DIB. TÉCN I', 'D.TEC I'],
  'Dibujo Técnico II': ['DIB.TECN II'],
  'Anatomía': ['ANAT y FISIO HUM', 'Anatomía y Fisio Hum'],
  'Computación': ['C. COMP', 'CC COMP', 'C Computación', 'CC. Computación'],
  'Mat CCSS I': ['MAT. CC.SS. I'],
  'Mat CCSS II': ['MATCC.SS.II', 'Matem. CCSS II'],
  'Literatura Universal': ['LIT. UNIV.', 'Literatura Univ'],
  'Historia del Arte': ['Hª ARTE', 'Arte'],
  'Psicología': ['PSIC', 'PSICO'],
  'Francés I': [], 'Francés II': [], 'Alemán I': [], 'Alemán II': [],
  'Economía': [], 'Empresa': [], 'Geografía': [], 'Latín I': [], 'Latín II': [],
  'Química': [], 'Física': [], 'Biología': [], 'Matemáticas I': [], 'Matemáticas II': [],
  'Religión': [], 'Inglés I': [], 'Inglés II': [], 'Filosofía': [], 'Tutoría': [],
};

const INDICE = new Map<string, string>();
for (const [canon, alias] of Object.entries(ALIAS)) for (const a of [canon, ...alias]) INDICE.set(norm(a), canon);

// Alias que dependen del curso: [1º, 2º].
const POR_CURSO: Record<string, [string, string]> = {
  historia: ['Historia Mundo', 'Historia de España'],
  biologia: ['Biología y Geología', 'Biología'],
  frances: ['Francés I', 'Francés II'], fr: ['Francés I', 'Francés II'], '2ªl.ex: frances': ['Francés I', 'Francés II'],
  aleman: ['Alemán I', 'Alemán II'], ale: ['Alemán I', 'Alemán II'], '2ªl.ex: aleman': ['Alemán I', 'Alemán II'],
  lengua: ['Lengua I', 'Lengua II'], ingles: ['Inglés I', 'Inglés II'],
};

/** Nombre canónico de una asignatura (según el curso), o undefined si no está en el catálogo. */
export const canon = (nombre: string, curso?: string) => {
  const n = norm(nombre);
  const c = POR_CURSO[n];
  if (c && (curso === '1' || curso === '2')) return c[curso === '1' ? 0 : 1];
  return INDICE.get(n);
};

export const COMUNES: Record<string, ReadonlySet<string>> = {
  '1': new Set(['Filosofía', 'Lengua I', 'Inglés I', 'Ed. Física', 'Religión']),
  '2': new Set(['Lengua II', 'Inglés II', 'Historia de España', 'Hª Filosofía', 'Religión', 'Tutoría']),
};

export const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'] as const;
export type Dia = (typeof DIAS)[number];
