import { useMemo, useState } from 'preact/hooks';
import { alternarMensual, esMensual, textoBusqueda } from '../almacen';
import { norm } from '../domain/catalogo';
import { asignaturasDe, asignaturasFiltrables, consultar, MODALIDADES, modalidadDe } from '../domain/resolver';
import { FilaAlumno, textoUbicacion, type Ctx } from './comun';
import { Icono } from './iconos';

const PAGINA = 20;
const inicial = (s: string) => norm(s).charAt(0).toUpperCase();

/** Todos los alumnos por orden alfabético (de 20 en 20), con buscador, filtros y dónde está cada uno. */
export function Alumnos({ datos, estado, setEstado, alumnos, cuando, abrirMenu }: Ctx) {
  const [q, setQ] = useState('');
  const [soloMensual, setSoloMensual] = useState(false);
  const [clase, setClase] = useState('');
  const [materia, setMateria] = useState(''); // 'm:<modalidad>' o 'a:<asignatura>'
  const [mostrar, setMostrar] = useState(PAGINA);

  const ordenados = useMemo(() => [...alumnos].sort((x, y) =>
    x.apellidos.localeCompare(y.apellidos, 'es') || x.nombre.localeCompare(y.nombre, 'es')), [alumnos]);
  const repetidos = useMemo(() => {
    const n = new Map<string, number>();
    for (const a of alumnos) { const k = norm(a.nombre + a.apellidos); n.set(k, (n.get(k) ?? 0) + 1); }
    return n;
  }, [alumnos]);

  const palabras = norm(q).split(' ').filter(Boolean);
  const grupos = useMemo(() => Object.keys(datos.grupos).sort(), [datos]);
  const asignaturas = useMemo(() => asignaturasFiltrables(datos), [datos]);
  const cumpleMateria = (a: (typeof alumnos)[number]) =>
    !materia || (materia.startsWith('m:') ? modalidadDe(datos, a) === materia.slice(2) : asignaturasDe(datos, a).includes(materia.slice(2)));

  const lista = ordenados.filter((a) => (!soloMensual || esMensual(a, estado)) && (!clase || a.grupo === clase) &&
    cumpleMateria(a) && palabras.every((p) => norm(textoBusqueda(a, estado)).includes(p)));
  const filtrar = (f: () => void) => { f(); setMostrar(PAGINA); };
  const hayFiltros = Boolean(soloMensual || clase || materia || q);

  return (
    <section>
      <label class="buscador">
        <Icono n="buscar" />
        <input type="search" placeholder="Buscar alumno o grupo" value={q} maxLength={80} aria-label="Buscar alumno o grupo"
          onInput={(e) => { const v = e.currentTarget.value; filtrar(() => setQ(v)); }} />
      </label>
      <div class="filtros">
        <label class="filtro">
          <span>Clase</span>
          <select value={clase} onChange={(e) => { const v = e.currentTarget.value; filtrar(() => setClase(v)); }}>
            <option value="">Todas</option>
            {grupos.map((g) => <option key={g} value={g}>{g[0]}º{g.slice(1)}</option>)}
          </select>
        </label>
        <label class="filtro">
          <span>Asignatura</span>
          <select value={materia} onChange={(e) => { const v = e.currentTarget.value; filtrar(() => setMateria(v)); }}>
            <option value="">Todas</option>
            <optgroup label="Modalidad">
              {MODALIDADES.map((m) => <option key={m} value={`m:${m}`}>{m}</option>)}
            </optgroup>
            <optgroup label="Asignatura">
              {asignaturas.map((x) => <option key={x} value={`a:${x}`}>{x}</option>)}
            </optgroup>
          </select>
        </label>
        <button class="chip" aria-pressed={soloMensual} onClick={() => filtrar(() => setSoloMensual(!soloMensual))}>
          <Icono n="cruz" />Solo confesión mensual
        </button>
      </div>
      {hayFiltros && (
        <p class="resumen-filtros">
          <span>{lista.length} {lista.length === 1 ? 'alumno' : 'alumnos'}</span>
          <button class="enlace" onClick={() => filtrar(() => { setQ(''); setClase(''); setMateria(''); setSoloMensual(false); })}>Quitar filtros</button>
        </p>
      )}

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
