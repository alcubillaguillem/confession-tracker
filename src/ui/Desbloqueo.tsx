import { useState } from 'preact/hooks';
import { desbloquear, type Estado } from '../almacen';
import type { Crudas } from '../domain/esquemas';

/** Solo la primera vez: la contraseña abre los datos del curso y quedan guardados en el dispositivo. */
export function Desbloqueo({ prefs, listo }: { prefs: Estado['prefs']; listo: (c: Crudas, e: Estado) => void }) {
  const [clave, setClave] = useState('');
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
        <p>Escriba la contraseña que le dieron. Solo se pide la primera vez.</p>
        <input type="password" autoComplete="current-password" aria-label="Contraseña" placeholder="Contraseña"
          value={clave} maxLength={200} autoFocus onInput={(e) => setClave(e.currentTarget.value)} />
        {error && <p class="aviso-error" role="alert">{error}</p>}
        <button type="submit" class="boton dorado-lleno" disabled={abriendo || !clave}>{abriendo ? 'Abriendo…' : 'Entrar'}</button>
      </form>
    </main>
  );
}
