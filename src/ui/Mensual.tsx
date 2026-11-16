import { useState } from 'preact/hooks';
import { esMensual } from '../almacen';
import { Barra, FilaAlumno, type Ctx } from './comun';
import { Icono } from './iconos';

type Filtro = 'pendientes' | 'hechos' | 'todos';
const FILTROS: [Filtro, string][] = [['pendientes', 'Pendientes'], ['hechos', 'Hechos'], ['todos', 'Todos']];

export function Mensual({ estado, setEstado, alumnos, abrirMenu }: Ctx) {
  const [filtro, setFiltro] = useState<Filtro>('pendientes');
  const hechos = new Set(estado.confesados.exps);
  const mensuales = alumnos.filter((a) => esMensual(a, estado))
    .sort((x, y) => x.grupo.localeCompare(y.grupo) || x.apellidos.localeCompare(y.apellidos, 'es'));
  const nHechos = mensuales.filter((a) => hechos.has(a.expediente)).length;
  const lista = mensuales.filter((a) => filtro === 'todos' || hechos.has(a.expediente) === (filtro === 'hechos'));

  const alternar = (exp: string) => setEstado((e) => {
    const exps = e.confesados.exps;
    return { ...e, confesados: { ...e.confesados, exps: exps.includes(exp) ? exps.filter((x) => x !== exp) : [...exps, exp] } };
  });

  return (
    <section>
      <div class="tarjeta">
        <Barra hechos={nHechos} total={mensuales.length} />
        <p class="tenue">{nHechos} de {mensuales.length} · quedan {mensuales.length - nHechos}</p>
      </div>
      <div class="chips" role="group" aria-label="Filtrar">
        {FILTROS.map(([id, txt]) => <button key={id} class="chip" aria-pressed={filtro === id} onClick={() => setFiltro(id)}>{txt}</button>)}
      </div>

      {!mensuales.length ? <p class="vacio">Nadie en confesión mensual todavía. Añádelos desde Buscar con el botón +.</p>
        : !lista.length ? <p class="vacio">{filtro === 'pendientes' ? 'No queda nadie por confesar este mes.' : 'Nadie marcado todavía.'}</p>
        : (
          <ul class="lista">
            {lista.map((a) => {
              const hecho = hechos.has(a.expediente);
              return (
                <FilaAlumno key={a.expediente} a={a} estado={estado} tachada={hecho} onTap={() => alternar(a.expediente)} onMenu={abrirMenu}
                  sub={hecho ? `${a.grupo} · confesado` : a.grupo}
                  izquierda={<span class={`casilla${hecho ? ' marcada' : ''}`} aria-hidden="true">{hecho && <Icono n="check" />}</span>} />
              );
            })}
          </ul>
        )}
    </section>
  );
}
