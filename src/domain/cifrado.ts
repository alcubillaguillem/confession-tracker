// Datos del curso cifrados con una contraseña: PBKDF2-SHA256 (600 000 iteraciones) → AES-256-GCM.
// Web Crypto, también en Node. El archivo cifrado se publica con la web; la contraseña nunca se guarda en el código.

const ITERACIONES = 600_000;

async function derivar(contrasena: string, sal: Uint8Array<ArrayBuffer>, uso: 'encrypt' | 'decrypt') {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(contrasena.normalize('NFC')), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: sal, iterations: ITERACIONES, hash: 'SHA-256' },
    base, { name: 'AES-GCM', length: 256 }, false, [uso]);
}

/** sal (16 bytes) + iv (12 bytes) + texto cifrado. */
export async function cifrar(datos: unknown, contrasena: string): Promise<Uint8Array> {
  const sal = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await derivar(contrasena, sal, 'encrypt'),
    new TextEncoder().encode(JSON.stringify(datos)));
  const out = new Uint8Array(28 + ct.byteLength);
  out.set(sal);
  out.set(iv, 16);
  out.set(new Uint8Array(ct), 28);
  return out;
}

/** Lanza un error si la contraseña no es la correcta o el archivo está alterado (GCM autentica). */
export async function descifrar(bytes: Uint8Array, contrasena: string): Promise<unknown> {
  const clave = await derivar(contrasena, bytes.slice(0, 16), 'decrypt');
  const plano = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.slice(16, 28) }, clave, bytes.slice(28));
  return JSON.parse(new TextDecoder().decode(plano));
}
