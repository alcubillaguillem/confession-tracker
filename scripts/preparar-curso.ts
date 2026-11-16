// Prepara los datos de un curso sin pasar por la app (procedimiento: skill `preparar-curso`).
//   npm run preparar -- horarios_y_alumnos/2026-27 [--publicar]   (con --publicar: variable CT_CONTRASENA)
// Entrada:  <carpeta>/listas/*.docx (listas del colegio), <carpeta>/tablas/*.csv (las otras 7 tablas) y, opcional, <carpeta>/confesion_mensual.csv.
// Salida:   <carpeta>/alumnos.csv (para revisar).
// --publicar: además cifra el curso con la contraseña de CT_CONTRASENA en public/curso.enc (la contraseña no se guarda).
// Usa el mismo lector y las mismas validaciones que la app. No envía nada a ningún sitio.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { cifrar } from '../src/domain/cifrado.ts';
import { TABLAS, type Crudas } from '../src/domain/esquemas.ts';
import { construir, leerCsv } from '../src/domain/importar.ts';
import { alumnosDeDocx, leerZip } from '../src/domain/listas.ts';
import { avisosAmbiguos } from '../src/domain/resolver.ts';

const [carpeta, opcion] = process.argv.slice(2);
if (!carpeta) throw new Error('Uso: npm run preparar -- <carpeta-del-curso>');

const avisos: string[] = [];
const alumnos: Record<string, string>[] = [];
const docx = readdirSync(join(carpeta, 'listas')).filter((f) => f.toLowerCase().endsWith('.docx'));
for (const f of docx) {
  const r = alumnosDeDocx(await leerZip(readFileSync(join(carpeta, 'listas', f)), 'word/document.xml'));
  alumnos.push(...r.filas);
  avisos.push(...r.avisos);
}
// Opcional: <carpeta>/confesion_mensual.csv (columna expediente) → quedan marcados en confesión mensual.
const rutaMensual = join(carpeta, 'confesion_mensual.csv');
if (existsSync(rutaMensual)) {
  const mensual = new Set(leerCsv(readFileSync(rutaMensual, 'utf8')).map((f) => f.expediente?.trim()));
  for (const a of alumnos) if (mensual.has(a.expediente)) a.confesion_mensual = 'si';
  const faltan = [...mensual].filter((e) => e && !alumnos.some((a) => a.expediente === e));
  avisos.push(`Confesión mensual: ${alumnos.filter((a) => a.confesion_mensual).length} marcados`, ...faltan.map((e) => `confesión mensual: expediente ${e} no está en las listas`));
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
console.log(`\nOK: ${r.datos.alumnos.length} alumnos, ${Object.keys(r.datos.grupos).length} grupos, ${ambiguos.length} horarios ambiguos.`);

if (opcion === '--publicar') {
  if (ambiguos.length) throw new Error('Hay horarios ambiguos: corrígelos antes de publicar.');
  const contrasena = process.env.CT_CONTRASENA ?? '';
  if (contrasena.length < 8) throw new Error('Define CT_CONTRASENA (mínimo 8 caracteres) con la contraseña que tendrá el sacerdote.');
  const id = `${basename(carpeta)}@${new Date().toISOString()}`;
  writeFileSync('public/curso.enc', await cifrar({ version: 1, id, crudas }, contrasena));
  console.log(`
Publicado cifrado en public/curso.enc (${id}). Haz commit y push para subirlo a la web.`);
}
