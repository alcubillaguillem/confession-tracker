import { useState } from 'preact/hooks';
import { mostrar, nombreDe, type Actualizar, type Estado } from '../almacen';
import type { Datos } from '../domain/importar';
import { Icono } from './iconos';

export function Ajustes({ datos, estado, setEstado }: { datos: Datos; estado: Estado; setEstado: Actualizar }) {
  const [permiso, setPermiso] = useState(() => ('Notification' in globalThis ? Notification.permission : 'denied'));
  const ocultos = datos.alumnos.filter((a) => estado.ocultos.includes(a.expediente));
  const pref = (k: keyof Estado['prefs'], v: boolean) => setEstado((e) => ({ ...e, prefs: { ...e.prefs, [k]: v } }));

  return (
    <section class="ajustes">
      <h2 class="seccion">Apariencia y avisos</h2>
      <ul class="lista">
        <li><label class="fila-ajuste"><Icono n="luna" /><span>Modo oscuro</span>
          <input type="checkbox" role="switch" class="interruptor" checked={estado.prefs.oscuro} onChange={(e) => pref('oscuro', e.currentTarget.checked)} /></label></li>
        <li><button class="fila-ajuste" disabled={permiso !== 'default'} onClick={() => void Notification.requestPermission().then(setPermiso)}>
          <Icono n="campana" /><span>Avisos del mes<small>{permiso === 'granted' ? 'Activados' : permiso === 'denied' ? 'Bloqueados en los ajustes del navegador' : 'Mitad de mes, final de mes y enhorabuena'}</small></span></button></li>
      </ul>

      {ocultos.length > 0 && (
        <>
          <h2 class="seccion">Alumnos ocultos</h2>
          <ul class="lista">
            {ocultos.map((a) => (
              <li key={a.expediente} class="fila-simple">
                <span>{nombreDe(a, estado)} <span class="tenue">· {a.grupo}</span></span>
                <button class="boton" onClick={() => setEstado(mostrar(a.expediente))}><Icono n="mostrar" />Recuperar</button>
              </li>
            ))}
          </ul>
        </>
      )}

      <h2 class="seccion">Privacidad</h2>
      <p class="tenue">Los datos del curso y sus marcas se guardan solo en este dispositivo. Nada se envía a ningún servidor.</p>
    </section>
  );
}
