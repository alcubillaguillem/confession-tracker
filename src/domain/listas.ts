// Listas de alumnos tal como las da el colegio (.docx): un párrafo "Grupo: 1ºA" seguido de una tabla
// Nº | Expte. | Alumnos ("Apellidos, Nombre") | Opc. | Opt. | (BAJA dd/mm). Se procesan en el dispositivo.

const MAX_XML = 20 * 1024 * 1024; // freno ante archivos comprimidos maliciosos

/** Extrae un archivo de un zip (.docx) leyendo su directorio central. Sin dependencias. */
export async function leerZip(bytes: Uint8Array, nombre: string): Promise<string> {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let fin = bytes.length - 22;
  while (fin >= 0 && dv.getUint32(fin, true) !== 0x06054b50) fin--;
  if (fin < 0) throw new Error('no es un documento Word (.docx) válido');
  const dec = new TextDecoder();
  let p = dv.getUint32(fin + 16, true);
  for (let i = 0, n = dv.getUint16(fin + 10, true); i < n; i++) {
    const largo = dv.getUint16(p + 28, true);
    if (dec.decode(bytes.subarray(p + 46, p + 46 + largo)) === nombre) {
      if (dv.getUint32(p + 24, true) > MAX_XML) throw new Error('documento demasiado grande');
      const off = dv.getUint32(p + 42, true);
      const ini = off + 30 + dv.getUint16(off + 26, true) + dv.getUint16(off + 28, true);
      const datos = bytes.slice(ini, ini + dv.getUint32(p + 20, true));
      if (dv.getUint16(p + 10, true) !== 8) return dec.decode(datos);
      return new Response(new Blob([datos]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text();
    }
    p += 46 + largo + dv.getUint16(p + 30, true) + dv.getUint16(p + 32, true);
  }
  throw new Error('no es un documento Word (.docx) válido');
}

const ENT: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
const texto = (xml: string) =>
  [...xml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1]).join('').replace(/&(\w+);/g, (_, e) => ENT[e] ?? '').trim();

/** Filas de la tabla alumnos (opción vacía si la lista no la trae) y avisos de bajas excluidas. */
export function alumnosDeDocx(xml: string): { filas: Record<string, string>[]; avisos: string[] } {
  const filas: Record<string, string>[] = [];
  const avisos: string[] = [];
  let grupo = '';
  for (const [bloque] of xml.matchAll(/<w:tbl>[\s\S]*?<\/w:tbl>|<w:p[ >][\s\S]*?<\/w:p>/g)) {
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
      const expediente = f[col('expte')] ?? '';
      if (!expediente) continue; // filas en blanco
      if (f.some((c) => /^baja\b/i.test(c))) { avisos.push(`${grupo}: baja excluida (expediente ${expediente})`); continue; }
      const [apellidos = '', nombre = ''] = (f[col('alumno')] ?? '').split(',').map((s) => s.trim());
      filas.push({
        expediente, apellidos, nombre, grupo,
        opcion: col('opc') >= 0 ? f[col('opc')] ?? '' : '', optativa: f[col('opt')] ?? '', confesion_mensual: '',
      });
    }
  }
  return { filas, avisos };
}
