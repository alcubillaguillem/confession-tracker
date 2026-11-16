import { describe, expect, it } from 'vitest';
import { cifrar, descifrar, nuevaClave } from './cifrado.ts';

describe('cifrado del curso', () => {
  it('ida y vuelta con la misma clave', async () => {
    const clave = nuevaClave();
    const datos = { version: 1, id: '2026-27', crudas: { grupos: [{ grupo: '1A' }] } };
    expect(await descifrar(await cifrar(datos, clave), clave)).toEqual(datos);
  });

  it('otra clave o un byte alterado → error', async () => {
    const bytes = await cifrar({ a: 1 }, nuevaClave());
    await expect(descifrar(bytes, nuevaClave())).rejects.toThrow();
    const clave = nuevaClave();
    const ok = await cifrar({ a: 1 }, clave);
    ok[20]! ^= 1;
    await expect(descifrar(ok, clave)).rejects.toThrow();
  });

  it('clave mal formada → error', async () => {
    await expect(descifrar(new Uint8Array(40), 'corta')).rejects.toThrow();
  });
});
