import { describe, expect, it } from 'vitest';
import { cifrar, descifrar } from './cifrado.ts';

describe('cifrado del curso con contraseña', () => {
  it('ida y vuelta con la misma contraseña', async () => {
    const datos = { version: 1, id: '2026-27', crudas: { grupos: [{ grupo: '1A' }] } };
    expect(await descifrar(await cifrar(datos, 'estola-marfil-trigo'), 'estola-marfil-trigo')).toEqual(datos);
  });

  it('otra contraseña o un byte alterado → error', async () => {
    const bytes = await cifrar({ a: 1 }, 'correcta');
    await expect(descifrar(bytes, 'incorrecta')).rejects.toThrow();
    bytes[40]! ^= 1;
    await expect(descifrar(bytes, 'correcta')).rejects.toThrow();
  });
});
