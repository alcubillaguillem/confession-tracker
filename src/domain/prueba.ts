// Utilidad de tests: carga data/ejemplo (datos ficticios).
import { readFileSync } from 'node:fs';
import { TABLAS, type Crudas } from './esquemas';
import { leerCsv } from './importar';

export const crudasEjemplo = (): Crudas =>
  Object.fromEntries(TABLAS.map((t) => [t, leerCsv(readFileSync(`data/ejemplo/${t}.csv`, 'utf8'))]));
