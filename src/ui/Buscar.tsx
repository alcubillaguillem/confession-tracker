import { useMemo, useState } from 'preact/hooks';
import { esMensual, type Actualizar, type Estado } from '../almacen';
import { DIAS, norm, type Dia } from '../domain/catalogo';
import type { Alumno, Datos } from '../domain/importar';
import { agruparPorAula, franjaDe, type Consulta } from '../domain/resolver';

type Props = { datos: Datos; estado: Estado; setEstado: Actualizar; verHorario: (a: Alumno) => void };

/** Al abrir: hoy y la franja actual; fuera de franja, sin franja; en fin de semana, sin día. */
function inicial(datos: Datos): { dia: Dia | ''; franja: string } {
  const ahora = new Date();
  return { dia: DIAS[ahora.getDay() - 1] ?? '', franja: franjaDe(datos, ahora)?.franja ?? '' };
}

export const nombreDe = (a: Alumno) => `${a.apellidos}, ${a.nombre} · ${a.grupo}`;

export function Ubicacion({ c }: { c: Consulta }) {
  if (!c.opciones.length) return <span class="tenue">{c.mensaje}</span>;
  return (
    <span>
      {c.ambiguo && <strong>Horario ambiguo: </strong>}
      {c.opciones.map((o) => `${o.asignatura} — ${o.aula}${o.supuesta ? ' (aula supuesta)' : ''}`).join(' · o · ')}
    </span>
  );
}

export function Buscar({ datos, estado, setEstado, verHorario }: Props) {
  const [q, setQ] = useState('');
  const [sel, setSel] = useState<string[]>([]);
  const [soloMensual, setSoloMensual] = useState(false);
  const [{ dia, franja }, setCuando] = useState(() => inicial(datos));
  const [nombreLista, setNombreLista] = useState('');

  const repetidos = useMemo(() => {
    const n = new Map<string, number>();
    for (const a of datos.alumnos) n.set(norm(a.nombre + a.apellidos), (n.get(norm(a.nombre + a.apellidos)) ?? 0) + 1);
    return n;
  }, [datos]);

  const palabras = norm(q).split(' ').filter(Boolean);
  const encontrados = palabras.length || soloMensual
    ? datos.alumnos.filter((a) => (!soloMensual || esMensual(a, estado)) &&
        palabras.every((p) => norm(`${a.nombre} ${a.apellidos} ${a.grupo}`).includes(p)))
    : [];
  const seleccionados = datos.alumnos.filter((a) => sel.includes(a.expediente));

  const alternar = (exp: string) => setSel(sel.includes(exp) ? sel.filter((x) => x !== exp) : [...sel, exp]);
  const alternarMensual = (a: Alumno) => setEstado((e) => {
    const { [a.expediente]: _, ...resto } = e.mensual;
    const nuevo = !esMensual(a, e);
    return { ...e, mensual: nuevo === a.confesionMensual ? resto : { ...resto, [a.expediente]: nuevo } };
  });
  const guardarLista = () => {
    const nombre = nombreLista.trim().slice(0, 60);
    if (nombre && sel.length) { setEstado((e) => ({ ...e, listas: { ...e.listas, [nombre]: sel } })); setNombreLista(''); }
  };
  const borrarLista = (nombre: string) => {
    if (!confirm(`¿Borrar la lista "${nombre}"?`)) return;
    setEstado((e) => {
      const { [nombre]: _, ...listas } = e.listas;
      return { ...e, listas };
    });
  };

  return (
    <section>
      <fieldset class="fila">
        <label>Día{' '}
          <select value={dia} onChange={(e) => setCuando({ dia: e.currentTarget.value as Dia | '', franja })}>
            <option value="">—</option>
            {DIAS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </label>
        <label>Franja{' '}
          <select value={franja} onChange={(e) => setCuando({ dia, franja: e.currentTarget.value })}>
            <option value="">—</option>
            {datos.franjas.map((f) => <option key={f.franja} value={f.franja}>{f.franja} ({f.inicio}–{f.fin})</option>)}
          </select>
        </label>
        <button onClick={() => setCuando(inicial(datos))}>Ahora</button>
      </fieldset>

      <input type="search" placeholder="Nombre, apellido o grupo" value={q} maxLength={80}
        onInput={(e) => setQ(e.currentTarget.value)} />
      <label class="fila"><input type="checkbox" checked={soloMensual}
        onChange={(e) => setSoloMensual(e.currentTarget.checked)} /> Solo confesión mensual</label>

      {encontrados.length > 0 && (
        <ul class="lista">
          {encontrados.slice(0, 50).map((a) => (
            <li key={a.expediente}>
              <label><input type="checkbox" checked={sel.includes(a.expediente)} onChange={() => alternar(a.expediente)} />{' '}
                {nombreDe(a)}{(repetidos.get(norm(a.nombre + a.apellidos)) ?? 0) > 1 && <em> (nombre repetido)</em>}
              </label>
              <span class="acciones">
                <button class={esMensual(a, estado) ? 'marcado' : ''} onClick={() => alternarMensual(a)}>
                  {esMensual(a, estado) ? '✓ Confesión mensual' : '+ Confesión mensual'}
                </button>
                <button onClick={() => verHorario(a)}>Horario</button>
              </span>
            </li>
          ))}
        </ul>
      )}
      {encontrados.length > 50 && <p class="tenue">Mostrando 50 de {encontrados.length}. Afina la búsqueda.</p>}

      <div class="fila">
        {encontrados.length > 0 && <button onClick={() => setSel([...new Set([...sel, ...encontrados.map((a) => a.expediente)])])}>Seleccionar todos</button>}
        {sel.length > 0 && <button onClick={() => setSel([])}>Limpiar selección ({sel.length})</button>}
      </div>

      <h2>Dónde están</h2>
      {!dia ? <p class="tenue">Fin de semana o sin día: elige un día.</p>
        : !franja ? <p class="tenue">Fuera de franja: elige una franja.</p>
        : !seleccionados.length ? <p class="tenue">Selecciona alumnos para ver dónde están.</p>
        : agruparPorAula(datos, seleccionados, dia, franja).map((g) => (
          <article key={g.aula} class="aula">
            <h3>{g.aula}{g.planta !== null && <span class="tenue"> · planta {g.planta}</span>}</h3>
            <ul>{g.alumnos.map(({ alumno, consulta }) => (
              <li key={alumno.expediente}>{nombreDe(alumno)}: <Ubicacion c={consulta} /></li>
            ))}</ul>
          </article>
        ))}

      <h2>Listas guardadas</h2>
      <div class="fila">
        <input placeholder="Nombre de la lista" value={nombreLista} maxLength={60} onInput={(e) => setNombreLista(e.currentTarget.value)} />
        <button disabled={!sel.length || !nombreLista.trim()} onClick={guardarLista}>Guardar selección</button>
      </div>
      <ul class="lista">
        {Object.entries(estado.listas).map(([nombre, exps]) => (
          <li key={nombre}>
            <span>{nombre} ({exps.length})</span>
            <span class="acciones">
              <button onClick={() => setSel(exps)}>Cargar</button>
              <button onClick={() => borrarLista(nombre)}>Borrar</button>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
