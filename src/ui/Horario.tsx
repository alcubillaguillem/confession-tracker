import { nombreDe, type Estado } from '../almacen';
import { DIAS } from '../domain/catalogo';
import type { Alumno, Datos } from '../domain/importar';
import { consultar } from '../domain/resolver';
import { DIA_LARGO } from './comun';
import { Icono } from './iconos';

export function Horario({ datos, estado, alumno, volver }: { datos: Datos; estado: Estado; alumno: Alumno; volver: () => void }) {
  return (
    <section>
      <button class="boton" onClick={volver}><Icono n="volver" />Volver</button>
      <h2>{nombreDe(alumno, estado)} <span class="tenue">· {alumno.grupo}</span></h2>
      <div class="tabla">
        <table>
          <thead><tr><th>Franja</th>{DIAS.map((d) => <th key={d}>{DIA_LARGO[d]}</th>)}</tr></thead>
          <tbody>
            {datos.franjas.map((f) => (
              <tr key={f.franja}>
                <th>{f.franja}<small>{f.inicio}</small></th>
                {DIAS.map((d) => {
                  const c = consultar(datos, alumno, d, f.franja);
                  return (
                    <td key={d}>
                      {c.opciones.length ? c.opciones.map((o) => (
                        <span key={o.asignatura} class="celda">{o.asignatura}<strong>{o.aula}{o.supuesta ? '*' : ''}</strong></span>
                      )) : <span class="tenue">{c.mensaje}</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p class="tenue">* Aula supuesta (no aparece en la hoja de desdobles).</p>
    </section>
  );
}
