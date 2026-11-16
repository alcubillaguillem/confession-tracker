// Prepara los datos de un curso para la app (procedimiento: skill `preparar-curso`).
//   npm run preparar -- horarios_y_alumnos/2026-27 [--opcion 1E=4 ...]
// Entrada:  <carpeta>/listas/*.docx (listas del colegio) y <carpeta>/tablas/*.csv (las otras 7 tablas).
// Salida:   <carpeta>/alumnos.csv (para revisar) y <carpeta>/confession-tracker-<curso>.json (Ajustes → Restaurar copia).
// Valida con las mismas reglas que la app. No envía nada a ningún sitio.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { inflateRawSync } from 'node:zlib';
import { estadoVacio } from '../src/almacen.ts';
import { TABLAS, type Crudas } from '../src/domain/esquemas.ts';
import { construir, leerCsv } from '../src/domain/importar.ts';
import { asignaciones } from '../src/domain/resolver.ts';

const [carpeta, ...resto] = process.argv.slice(2);
if (!carpeta) throw new Error('Uso: npm run preparar -- <carpeta-del-curso> [--opcion 1E=4]');
// Grupos cuya lista no trae columna de opción (p. ej. 1E: todo el grupo es opción 4).
const opcionFija = Object.fromEntries(resto.filter((a) => a.includes('=')).map((a) => a.split('=') as [string, string]));

/** Extrae un archivo de un .docx (zip) leyendo su directorio central. */
function leerZip(buf: Buffer, nombre: string): string {
  const fin = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  let p = buf.readUInt32LE(fin + 16);
  for (let i = 0; i < buf.readUInt16LE(fin + 10); i++) {
    const largo = buf.readUInt16LE(p + 28);
    if (buf.toString('utf8', p + 46, p + 46 + largo) === nombre) {
      const off = buf.readUInt32LE(p + 42);
      const ini = off + 30 + buf.readUInt16LE(off + 26) + buf.readUInt16LE(off + 28);
      const datos = buf.subarray(ini, ini + buf.readUInt32LE(p + 20));
      return (buf.readUInt16LE(p + 10) === 8 ? inflateRawSync(datos) : datos).toString('utf8');
    }
    p += 46 + largo + buf.readUInt16LE(p + 30) + buf.readUInt16LE(p + 32);
  }
  throw new Error(`${nombre} no está en el archivo`);
}

const ENT: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
const texto = (xml: string) =>
  [...xml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1]).join('').replace(/&(\w+);/g, (_, e) => ENT[e] ?? '').trim();

/** Listas del colegio: "Grupo: 1ºA" seguido de una tabla Nº | Expte. | Alumnos | Opc. | Opt. | (BAJA …). */
function alumnosDeDocx(ruta: string, avisos: string[]) {
  const filas: Record<string, string>[] = [];
  const cuerpo = leerZip(readFileSync(ruta), 'word/document.xml');
  let grupo = '';
  for (const [bloque] of cuerpo.matchAll(/<w:tbl>[\s\S]*?<\/w:tbl>|<w:p[ >][\s\S]*?<\/w:p>/g)) {
    if (bloque.startsWith('<w:p')) {
      const g = texto(bloque).match(/Grupo:\s*([12])\s*º\s*([A-Z])/);
      if (g) grupo = g[1]! + g[2]!;
      continue;
    }
    const tabla = [...bloque.matchAll(/<w:tr[ >][\s\S]*?<\/w:tr>/g)]
      .map(([tr]) => [...tr.matchAll(/<w:tc>[\s\S]*?<\/w:tc>/g)].map(([tc]) => texto(tc)));
    const cab = tabla[0]?.map((c) => c.toLowerCase()) ?? [];
    const col = (n: string) => cab.findIndex((c) => c.startsWith(n));
    if (col('expte') < 0) continue; // leyenda de opciones u otras tablas
    for (const f of tabla.slice(1)) {
      const exp = f[col('expte')] ?? '';
      if (!exp) continue; // filas en blanco
      if (f.some((c) => /^baja\b/i.test(c))) { avisos.push(`${grupo}: baja excluida (expediente ${exp})`); continue; }
      const [apellidos = '', nombre = ''] = (f[col('alumno')] ?? '').split(',').map((s) => s.trim());
      const opcion = col('opc') >= 0 ? f[col('opc')] ?? '' : opcionFija[grupo] ?? '';
      if (col('opc') < 0 && !opcionFija[grupo]) throw new Error(`${basename(ruta)}: el grupo ${grupo} no tiene columna de opción. Añade --opcion ${grupo}=<opción>`);
      filas.push({ expediente: exp, apellidos, nombre, grupo, opcion, optativa: f[col('opt')] ?? '', confesion_mensual: '' });
    }
  }
  return filas;
}

const avisos: string[] = [];
const docx = readdirSync(join(carpeta, 'listas')).filter((f) => f.toLowerCase().endsWith('.docx'));
const alumnos = docx.flatMap((f) => alumnosDeDocx(join(carpeta, 'listas', f), avisos));
const crudas: Crudas = { alumnos };
for (const t of TABLAS.filter((t) => t !== 'alumnos')) crudas[t] = leerCsv(readFileSync(join(carpeta, 'tablas', `${t}.csv`), 'utf8'));

const r = construir(crudas);
const cuenta = new Map<string, number>();
for (const a of alumnos) cuenta.set(a.grupo!, (cuenta.get(a.grupo!) ?? 0) + 1);
const porGrupo = [...cuenta].map(([g, n]) => `${g}: ${n}`).join(' · ');
console.log(`Listas leídas: ${docx.join(', ')}\nAlumnos: ${alumnos.length} (${porGrupo})`);
for (const a of [...avisos, ...r.avisos]) console.log(`  aviso  ${a}`);
if (!r.datos) {
  for (const e of r.errores) console.log(`  ERROR  ${e}`);
  console.log(`\n${r.errores.length} errores. Corrige las tablas y vuelve a ejecutar.`);
  process.exit(1);
}
const d = r.datos;
const dudosos = d.alumnos.filter((a) => asignaciones(d, a).length !== 1);
for (const a of dudosos) console.log(`  aviso  horario ambiguo: expediente ${a.expediente} (${a.grupo}, opción ${a.opcion}, ${a.optativa})`);

const cab = 'expediente;apellidos;nombre;grupo;opcion;optativa;confesion_mensual';
writeFileSync(join(carpeta, 'alumnos.csv'), [cab, ...alumnos.map((a) => cab.split(';').map((k) => a[k]).join(';'))].join('\n') + '\n');
const salida = join(carpeta, `confession-tracker-${basename(carpeta)}.json`);
writeFileSync(salida, JSON.stringify({ version: 1, crudas, estado: estadoVacio() }));
console.log(`\nOK: ${d.alumnos.length} alumnos, ${Object.keys(d.grupos).length} grupos, ${dudosos.length} horarios ambiguos.\nEntregable: ${salida}`);
