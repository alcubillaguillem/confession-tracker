import { agruparPorAula } from '../domain/resolver';
import { DIA_LARGO, FilaAlumno, textoUbicacion, type Ctx } from './comun';
import { Icono } from './iconos';

const nombreAula = (aula: string) => (/^\d/.test(aula) ? `Aula ${aula}` : aula);

/** Alumnos seleccionados en Buscar, agrupados por aula y ordenados por planta. */
export function DondeEstan({ datos, estado, alumnos, sel, setSel, cuando, abrirMenu }: Ctx) {
  const seleccionados = alumnos.filter((a) => sel.includes(a.expediente));
  const { dia, franja } = cuando;

  return (
    <section id="donde-estan">
      <div class="ruta-cabecera">
        <h2>Dónde están{dia && franja ? ` · ${DIA_LARGO[dia]} ${franja}` : ''}</h2>
        <span class="tenue">{seleccionados.length} {seleccionados.length === 1 ? 'alumno' : 'alumnos'}</span>
      </div>
      {!seleccionados.length ? <p class="vacio">Toca varios alumnos para verlos agrupados por aula y planta.</p>
        : !dia ? <p class="vacio">Fin de semana: elige un día.</p>
        : !franja ? <p class="vacio">Fuera de franja: elige una franja.</p>
        : agruparPorAula(datos, seleccionados, dia, franja).map((g) => (
          <article key={g.aula} class="parada">
            <header><strong>{nombreAula(g.aula)}</strong>{g.planta !== null && <span class="tenue">Planta {g.planta}</span>}</header>
            <ul class="lista">
              {g.alumnos.map(({ alumno, consulta }) => (
                <FilaAlumno key={alumno.expediente} a={alumno} estado={estado} sub={textoUbicacion(consulta)} onMenu={abrirMenu}
                  derecha={<button class="icono-btn" aria-label="Quitar de la selección"
                    onClick={() => setSel((s) => s.filter((x) => x !== alumno.expediente))}><Icono n="x" /></button>} />
              ))}
            </ul>
          </article>
        ))}
    </section>
  );
}
