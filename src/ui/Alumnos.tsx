import { useMemo, useState } from 'preact/hooks';
import { alternarMensual, esMensual, textoBusqueda } from '../almacen';
import { norm } from '../domain/catalogo';
import { consultar } from '../domain/resolver';
import { FilaAlumno, SelectorCuando, textoUbicacion, type Ctx } from './comun';
import { Icono } from './iconos';

const PAGINA = 20;
const inicial = (s: string) => norm(s).charAt(0).toUpperCase();

/** Todos los alumnos por orden alfabético (de 20 en 20), con buscador y dónde está cada uno. */
export function Alumnos({ datos, estado, setEstado, alumnos, cuando, setCuando, abrirMenu }: Ctx) {
  const [q, setQ] = useState('');
  const [soloMensual, setSoloMensual] = useState(false);
  const [mostrar, setMostrar] = useState(PAGINA);

  const ordenados = useMemo(() => [...alumnos].sort((x, y) =>
    x.apellidos.localeCompare(y.apellidos, 'es') || x.nombre.localeCompare(y.nombre, 'es')), [alumnos]);
  const repetidos = useMemo(() => {
    const n = new Map<string, number>();
    for (const a of alumnos) { const k = norm(a.nombre + a.apellidos); n.set(k, (n.get(k) ?? 0) + 1); }
    return n;
  }, [alumnos]);

  const palabras = norm(q).split(' ').filter(Boolean);
  const lista = ordenados.filter((a) => (!soloMensual || esMensual(a, estado)) &&
    palabras.every((p) => norm(textoBusqueda(a, estado)).includes(p)));
  const filtrar = (f: () => void) => { f(); setMostrar(PAGINA); };

  return (
    <section>
      <label class="buscador">
        <Icono n="buscar" />
        <input type="search" placeholder="Buscar alumno o grupo" value={q} maxLength={80} aria-label="Buscar alumno o grupo"
          onInput={(e) => { const v = e.currentTarget.value; filtrar(() => setQ(v)); }} />
      </label>
      <div class="chips">
        <SelectorCuando datos={datos} cuando={cuando} setCuando={setCuando} />
        <button class="chip" aria-pressed={soloMensual} onClick={() => filtrar(() => setSoloMensual(!soloMensual))}><Icono n="cruz" />Mensual</button>
      </div>

      {!lista.length && <p class="vacio">No hay alumnos que coincidan.</p>}
      <ul class="lista">
        {lista.slice(0, mostrar).map((a, i, vis) => {
          const m = esMensual(a, estado);
          const letra = inicial(a.apellidos);
          const donde = cuando.dia && cuando.franja ? ` · ${textoUbicacion(consultar(datos, a, cuando.dia, cuando.franja))}` : '';
          return [
            (i === 0 || inicial(vis[i - 1]!.apellidos) !== letra) && <li key={`l-${letra}`} class="letra" aria-hidden="true">{letra}</li>,
            <FilaAlumno key={a.expediente} a={a} estado={estado} onTap={() => abrirMenu(a)} onMenu={abrirMenu}
              sub={`${a.grupo}${donde}${(repetidos.get(norm(a.nombre + a.apellidos)) ?? 0) > 1 ? ' · nombre repetido' : ''}`}
              derecha={
                <button class={`icono-btn${m ? ' dorado' : ''}`} aria-pressed={m}
                  aria-label={m ? 'Quitar de confesión mensual' : 'Poner en confesión mensual'}
                  onClick={() => setEstado(alternarMensual(a))}><Icono n={m ? 'cruz' : 'mas'} /></button>
              } />,
          ];
        })}
      </ul>
      {lista.length > mostrar && (
        <button class="boton ver-mas" onClick={() => setMostrar(mostrar + PAGINA)}>
          Ver más ({Math.min(mostrar, lista.length)} de {lista.length})
        </button>
      )}
    </section>
  );
}
