// Prepara los datos de un curso sin pasar por la app (procedimiento: skill `preparar-curso`).
//   npm run preparar -- horarios_y_alumnos/2026-27
// Entrada:  <carpeta>/listas/*.docx (listas del colegio) y <carpeta>/tablas/*.csv (las otras 7 tablas).
// Salida:   <carpeta>/alumnos.csv (para revisar) y <carpeta>/confession-tracker-<curso>.json (Ajustes → Restaurar copia).
// Usa el mismo lector y las mismas validaciones que la app. No envía nada a ningún sitio.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { estadoVacio } from '../src/almacen.ts';
import { TABLAS, type Crudas } from '../src/domain/esquemas.ts';
import { construir, leerCsv } from '../src/domain/importar.ts';
import { alumnosDeDocx, leerZip } from '../src/domain/listas.ts';
import { avisosAmbiguos } from '../src/domain/resolver.ts';

const carpeta = process.argv[2];
if (!carpeta) throw new Error('Uso: npm run preparar -- <carpeta-del-curso>');

const avisos: string[] = [];
const alumnos: Record<string, string>[] = [];
const docx = readdirSync(join(carpeta, 'listas')).filter((f) => f.toLowerCase().endsWith('.docx'));
for (const f of docx) {
  const r = alumnosDeDocx(await leerZip(readFileSync(join(carpeta, 'listas', f)), 'word/document.xml'));
  alumnos.push(...r.filas);
  avisos.push(...r.avisos);
}
const crudas: Crudas = { alumnos };
for (const t of TABLAS.filter((t) => t !== 'alumnos')) crudas[t] = leerCsv(readFileSync(join(carpeta, 'tablas', `${t}.csv`), 'utf8'));

const r = construir(crudas);
const cuenta = new Map<string, number>();
for (const a of alumnos) cuenta.set(a.grupo!, (cuenta.get(a.grupo!) ?? 0) + 1);
console.log(`Listas leídas: ${docx.join(', ')}\nAlumnos: ${alumnos.length} (${[...cuenta].map(([g, n]) => `${g}: ${n}`).join(' · ')})`);
if (!r.datos) {
  for (const a of avisos) console.log(`  aviso  ${a}`);
  for (const e of r.errores) console.log(`  ERROR  ${e}`);
  console.log(`\n${r.errores.length} errores. Corrige las tablas y vuelve a ejecutar.`);
  process.exit(1);
}
const ambiguos = avisosAmbiguos(r.datos);
for (const a of [...avisos, ...ambiguos, ...r.avisos]) console.log(`  aviso  ${a}`);

const cab = 'expediente;apellidos;nombre;grupo;opcion;optativa;confesion_mensual';
writeFileSync(join(carpeta, 'alumnos.csv'), [cab, ...alumnos.map((a) => cab.split(';').map((k) => a[k]).join(';'))].join('\n') + '\n');
const salida = join(carpeta, `confession-tracker-${basename(carpeta)}.json`);
writeFileSync(salida, JSON.stringify({ version: 1, crudas, estado: estadoVacio() }));
console.log(`\nOK: ${r.datos.alumnos.length} alumnos, ${Object.keys(r.datos.grupos).length} grupos, ${ambiguos.length} horarios ambiguos.\nEntregable: ${salida}`);
