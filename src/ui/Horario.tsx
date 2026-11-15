import { DIAS } from '../domain/catalogo';
import type { Alumno, Datos } from '../domain/importar';
import { consultar } from '../domain/resolver';
import { nombreDe, Ubicacion } from './Buscar';

export function Horario({ datos, alumno, volver }: { datos: Datos; alumno: Alumno; volver: () => void }) {
  return (
    <section>
      <button onClick={volver}>← Volver</button>
      <h2>{nombreDe(alumno)}</h2>
      <div class="tabla">
        <table>
          <thead><tr><th>Franja</th>{DIAS.map((d) => <th key={d}>{d}</th>)}</tr></thead>
          <tbody>
            {datos.franjas.map((f) => (
              <tr key={f.franja}>
                <th>{f.franja}<br /><span class="tenue">{f.inicio}</span></th>
                {DIAS.map((d) => <td key={d}><Ubicacion c={consultar(datos, alumno, d, f.franja)} /></td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
