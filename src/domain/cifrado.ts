// Datos del curso cifrados con AES-256-GCM (Web Crypto, también en Node). El archivo cifrado se publica
// con la web; la clave solo viaja en el enlace, tras "#", que el navegador nunca envía a ningún servidor.

const b64 = (b: Uint8Array) => btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const deb64 = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

export const nuevaClave = () => b64(crypto.getRandomValues(new Uint8Array(32)));

const importar = (clave: string, uso: 'encrypt' | 'decrypt') => {
  const raw = deb64(clave);
  if (raw.length !== 32) throw new Error('clave no válida');
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, [uso]);
};

/** iv (12 bytes) + texto cifrado. */
export async function cifrar(datos: unknown, clave: string): Promise<Uint8Array> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await importar(clave, 'encrypt'),
    new TextEncoder().encode(JSON.stringify(datos)));
  const out = new Uint8Array(12 + ct.byteLength);
  out.set(iv);
  out.set(new Uint8Array(ct), 12);
  return out;
}

/** Lanza un error si la clave no corresponde o el archivo está alterado (GCM autentica). */
export async function descifrar(bytes: Uint8Array, clave: string): Promise<unknown> {
  const plano = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.slice(0, 12) }, await importar(clave, 'decrypt'), bytes.slice(12));
  return JSON.parse(new TextDecoder().decode(plano));
}
