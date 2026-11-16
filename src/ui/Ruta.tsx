import { useState } from 'preact/hooks';
import { agruparPorAula } from '../domain/resolver';
import { DIA_LARGO, FilaAlumno, SelectorCuando, textoUbicacion, type Ctx } from './comun';
import { Icono } from './iconos';

const nombreAula = (aula: string) => (/^\d/.test(aula) ? `Aula ${aula}` : aula);

/** Alumnos seleccionados agrupados por aula y ordenados por planta. `compacta`: panel lateral en escritorio. */
export function Ruta({ datos, estado, setEstado, alumnos, sel, setSel, cuando, setCuando, abrirMenu, compacta }: Ctx & { compacta?: boolean }) {
  const [nombre, setNombre] = useState('');
  const seleccionados = alumnos.filter((a) => sel.includes(a.expediente));
  const { dia, franja } = cuando;

  const guardar = () => {
    const n = nombre.trim().slice(0, 60);
    if (!n || !sel.length) return;
    setEstado((e) => ({ ...e, listas: { ...e.listas, [n]: sel } }));
    setNombre('');
  };
  const borrar = (n: string) => {
    if (!confirm(`¿Borrar la lista "${n}"?`)) return;
    setEstado((e) => { const { [n]: _, ...listas } = e.listas; return { ...e, listas }; });
  };

  return (
    <section class="ruta">
      <div class="ruta-cabecera">
        <h2>Ruta{dia && franja ? ` · ${DIA_LARGO[dia]} ${franja}` : ''}</h2>
        <span class="tenue">{seleccionados.length} {seleccionados.length === 1 ? 'alumno' : 'alumnos'}</span>
      </div>
      {!compacta && <SelectorCuando datos={datos} cuando={cuando} setCuando={setCuando} />}

      {!seleccionados.length ? <p class="vacio">Selecciona alumnos en Buscar para ver por qué aulas pasar.</p>
        : !dia ? <p class="vacio">Fin de semana: elige un día.</p>
        : !franja ? <p class="vacio">Fuera de franja: elige una franja.</p>
        : agruparPorAula(datos, seleccionados, dia, franja).map((g) => (
          <article key={g.aula} class="parada">
            <header><strong>{nombreAula(g.aula)}</strong>{g.planta !== null && <span class="tenue">Planta {g.planta}</span>}</header>
            <ul class="lista">
              {g.alumnos.map(({ alumno, consulta }) => (
                <FilaAlumno key={alumno.expediente} a={alumno} estado={estado} sub={textoUbicacion(consulta)} onMenu={abrirMenu}
                  derecha={<button class="icono-btn" aria-label="Quitar de la ruta"
                    onClick={() => setSel((s) => s.filter((x) => x !== alumno.expediente))}><Icono n="x" /></button>} />
              ))}
            </ul>
          </article>
        ))}

      {!compacta && (
        <>
          <h2 class="seccion">Listas guardadas</h2>
          <form class="fila-form" onSubmit={(e) => { e.preventDefault(); guardar(); }}>
            <input placeholder="Confesión noviembre" value={nombre} maxLength={60} aria-label="Nombre de la lista"
              onInput={(e) => setNombre(e.currentTarget.value)} />
            <button type="submit" class="boton primario" disabled={!sel.length || !nombre.trim()}>Guardar</button>
          </form>
          {!Object.keys(estado.listas).length && <p class="vacio">Guarda la selección actual para repetir la ruta otro mes.</p>}
          <ul class="lista">
            {Object.entries(estado.listas).map(([n, exps]) => (
              <li key={n} class="fila-simple">
                <span>{n} <span class="tenue">· {exps.length}</span></span>
                <span class="botones">
                  <button class="boton" onClick={() => setSel(() => exps)}>Cargar</button>
                  <button class="icono-btn" aria-label={`Borrar la lista ${n}`} onClick={() => borrar(n)}><Icono n="papelera" /></button>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
