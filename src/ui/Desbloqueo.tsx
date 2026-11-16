import { useState } from 'preact/hooks';
import { desbloquear, type Estado } from '../almacen';
import type { Crudas } from '../domain/esquemas';
import { Icono } from './iconos';

/** Inicio de sesión (solo la primera vez): la contraseña abre los datos del curso y quedan guardados en el dispositivo. */
export function Desbloqueo({ prefs, listo }: { prefs: Estado['prefs']; listo: (c: Crudas, e: Estado) => void }) {
  const [clave, setClave] = useState('');
  const [ver, setVer] = useState(false);
  const [error, setError] = useState('');
  const [abriendo, setAbriendo] = useState(false);

  async function entrar(e: Event) {
    e.preventDefault();
    setAbriendo(true);
    setError('');
    const r = await desbloquear(clave, prefs);
    setAbriendo(false);
    if (typeof r === 'string') setError(r);
    else listo(r.crudas, r.estado);
  }

  return (
    <main class="desbloqueo">
      <form onSubmit={(e) => void entrar(e)}>
        <img src="./icon.svg" alt="" width="76" height="76" />
        <h1>Confession Tracker</h1>
        <label class="campo-clave">
          <span>Contraseña</span>
          <span class="clave-caja">
            <input type={ver ? 'text' : 'password'} autoComplete="current-password" value={clave} maxLength={200} autoFocus
              onInput={(e) => setClave(e.currentTarget.value)} />
            <button type="button" class="icono-btn" aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={ver}
              onClick={() => setVer(!ver)}><Icono n={ver ? 'ocultar' : 'mostrar'} /></button>
          </span>
        </label>
        {error && <p class="aviso-error" role="alert">{error}</p>}
        <button type="submit" class="boton dorado-lleno" disabled={abriendo || !clave}>{abriendo ? 'Entrando…' : 'Iniciar sesión'}</button>
      </form>
    </main>
  );
}
