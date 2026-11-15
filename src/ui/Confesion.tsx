import { useState } from 'preact/hooks';
import { esMensual, type Actualizar, type Estado } from '../almacen';
import type { Datos } from '../domain/importar';
import { nombreDe } from './Buscar';

type Props = { datos: Datos; estado: Estado; setEstado: Actualizar };

export function Confesion({ datos, estado, setEstado }: Props) {
  const [permiso, setPermiso] = useState(() => ('Notification' in globalThis ? Notification.permission : 'denied'));
  const mensuales = datos.alumnos.filter((a) => esMensual(a, estado))
    .sort((x, y) => x.grupo.localeCompare(y.grupo) || x.apellidos.localeCompare(y.apellidos, 'es'));
  const hechos = new Set(estado.confesados.exps);
  const nHechos = mensuales.filter((a) => hechos.has(a.expediente)).length;
  const total = mensuales.length;
  const pct = total ? nHechos / total : 0;

  const alternar = (exp: string) => setEstado((e) => {
    const exps = e.confesados.exps;
    return { ...e, confesados: { ...e.confesados, exps: exps.includes(exp) ? exps.filter((x) => x !== exp) : [...exps, exp] } };
  });

  return (
    <section>
      <h2>Confesión mensual · {estado.confesados.mes}</h2>
      <svg class="grafico" viewBox="0 0 100 10" role="img" aria-label={`${nHechos} confesados de ${total}`}>
        <rect class="pendiente" x="0" y="0" width="100" height="10" rx="2" />
        <rect class="hecho" x="0" y="0" width={100 * pct} height="10" rx="2" />
      </svg>
      <p><strong>{nHechos}</strong> confesados · <strong>{total - nHechos}</strong> por confesar · {total} en total</p>
      {permiso === 'default' && (
        <button onClick={() => void Notification.requestPermission().then(setPermiso)}>Activar avisos del mes</button>
      )}
      {!total && <p class="tenue">Nadie en confesión mensual. Añádelos desde Buscar.</p>}
      <ul class="lista">
        {mensuales.map((a) => (
          <li key={a.expediente} class={hechos.has(a.expediente) ? 'hecho' : ''}>
            <label><input type="checkbox" checked={hechos.has(a.expediente)} onChange={() => alternar(a.expediente)} />{' '}
              {nombreDe(a)}</label>
          </li>
        ))}
      </ul>
    </section>
  );
}
