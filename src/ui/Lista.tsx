import { useState } from 'preact/hooks';
import { alternarLista, confesarEnLista, nombreDe, textoBusqueda } from '../almacen';
import { norm } from '../domain/catalogo';
import type { Alumno } from '../domain/importar';
import { consultar, momentosDe } from '../domain/resolver';
import { Barra, FilaAlumno, textoUbicacion, type Ctx } from './comun';
import { Icono } from './iconos';

type Clase = { clave: string; aula: string; asignatura: string; planta: number; alumnos: Alumno[] };

/** Lista para confesar: alumnos agrupados por la clase en la que están ahora. Dura hasta confesarlos a todos. */
export function Lista({ datos, estado, setEstado, alumnos, abrirMenu, avisar }: Ctx) {
  const [q, setQ] = useState('');
  const porExp = new Map(alumnos.map((a) => [a.expediente, a]));
  const deLista = estado.lista.exps.map((e) => porExp.get(e)).filter((a): a is Alumno => !!a);
  const hechos = new Set(estado.lista.hechos);
  const pendientes = deLista.filter((a) => !hechos.has(a.expediente));
  const confesados = deLista.filter((a) => hechos.has(a.expediente));
  const { dia, actual, siguiente } = momentosDe(datos, new Date());

  const palabras = norm(q).split(' ').filter(Boolean);
  const resultados = palabras.length
    ? alumnos.filter((a) => !estado.lista.exps.includes(a.expediente) && palabras.every((p) => norm(textoBusqueda(a, estado)).includes(p))).slice(0, 8)
    : [];

  const confesar = (exp: string) => {
    const ultimo = pendientes.length === 1 && pendientes[0]!.expediente === exp;
    setEstado(confesarEnLista(exp));
    if (ultimo) avisar('Lista completada: todos confesados.');
  };

  /** Agrupa los pendientes por la clase en la que están ahora (asignatura + aula), de la planta más baja a la más alta. */
  const clases: Clase[] = [];
  const sinClase: Alumno[] = [];
  for (const a of pendientes) {
    const c = dia && actual ? consultar(datos, a, dia, actual.franja) : undefined;
    if (!c?.opciones.length) { sinClase.push(a); continue; }
    const o = c.ambiguo ? { aula: 'Por confirmar', asignatura: textoUbicacion(c) } : c.opciones[0]!;
    const clave = `${o.aula}|${o.asignatura}`;
    let g = clases.find((x) => x.clave === clave);
    if (!g) clases.push(g = { clave, aula: o.aula, asignatura: o.asignatura, planta: datos.aulas[o.aula]?.planta ?? 99, alumnos: [] });
    g.alumnos.push(a);
  }
  clases.sort((x, y) => x.planta - y.planta || x.aula.localeCompare(y.aula, 'es', { numeric: true }));
  const nombreAula = (aula: string) => (/^\d/.test(aula) ? `Aula ${aula}` : aula);
  const motivo = !dia ? 'Fin de semana' : !actual ? 'Fuera de horario' : 'Sin clase ahora';

  const fila = (a: Alumno) => {
    const luego = dia && siguiente ? consultar(datos, a, dia, siguiente.franja) : undefined;
    return (
      <FilaAlumno key={a.expediente} a={a} estado={estado} onTap={() => confesar(a.expediente)} onMenu={abrirMenu}
        sub={`${a.grupo}${luego && siguiente ? ` · después (${siguiente.inicio}): ${textoUbicacion(luego)}` : ''}`}
        izquierda={<span class="casilla" aria-hidden="true" />}
        derecha={<button class="icono-btn" aria-label={`Quitar a ${nombreDe(a, estado)} de la lista`}
          onClick={() => setEstado(alternarLista(a.expediente))}><Icono n="x" /></button>} />
    );
  };

  return (
    <section class="lista-dia">
      <label class="buscador">
        <Icono n="buscar" />
        <input type="search" placeholder="Añadir alumno a la lista" value={q} maxLength={80} aria-label="Añadir alumno a la lista"
          onInput={(e) => setQ(e.currentTarget.value)} />
      </label>
      {palabras.length > 0 && (
        resultados.length ? (
          <ul class="lista resultados">
            {resultados.map((a) => (
              <FilaAlumno key={a.expediente} a={a} estado={estado} onMenu={abrirMenu} onTap={() => { setEstado(alternarLista(a.expediente)); setQ(''); }}
                derecha={<button class="icono-btn" aria-label={`Añadir a ${nombreDe(a, estado)}`}
                  onClick={() => { setEstado(alternarLista(a.expediente)); setQ(''); }}><Icono n="mas" /></button>} />
            ))}
          </ul>
        ) : <p class="vacio">No hay alumnos que coincidan (o ya están en la lista).</p>
      )}

      {!deLista.length ? (
        <p class="tarjeta vacio">Añada a los alumnos que quiera confesar y verá aquí, en tiempo real, dónde está cada uno.</p>
      ) : (
        <>
          <div class="tarjeta resumen-lista">
            <p><strong>{pendientes.length}</strong> por confesar · <strong class="dorado">{confesados.length}</strong> confesados</p>
            <Barra hechos={confesados.length} total={deLista.length} />
            <p class="tenue">{actual ? `Ahora: ${actual.franja} (hasta ${actual.fin})` : dia ? 'Ahora no hay clase' : 'Fin de semana'}
              {siguiente ? ` · después: ${siguiente.franja} a las ${siguiente.inicio}` : ''}</p>
          </div>

          <div class="panel-lista">
            {clases.map((g) => (
              <article key={g.clave} class="grupo-clase">
                <header>
                  <span class="etiqueta">{actual!.inicio} · hasta {actual!.fin}</span>
                  <strong class="aula">{nombreAula(g.aula)}</strong>
                  <span class="asignatura">{g.asignatura}</span>
                  <span class="cuantos">{g.alumnos.length}</span>
                </header>
                <ul class="lista">{g.alumnos.map(fila)}</ul>
              </article>
            ))}
            {sinClase.length > 0 && (
              <article class="grupo-clase sin-clase">
                <header>
                  <span class="etiqueta">{actual ? `${actual.inicio} · hasta ${actual.fin}` : 'Ahora'}</span>
                  <strong class="aula">{motivo}</strong>
                  <span class="cuantos">{sinClase.length}</span>
                </header>
                <ul class="lista">{sinClase.map(fila)}</ul>
              </article>
            )}
          </div>

          {confesados.length > 0 && (
            <details class="hechos" open>
              <summary><Icono n="check" />Hechos ({confesados.length})</summary>
              <ul class="lista">
                {confesados.map((a) => (
                  <FilaAlumno key={a.expediente} a={a} estado={estado} tachada onTap={() => confesar(a.expediente)} onMenu={abrirMenu}
                    sub={`${a.grupo} · confesado`}
                    izquierda={<span class="casilla marcada" aria-hidden="true"><Icono n="check" /></span>} />
                ))}
              </ul>
            </details>
          )}
        </>
      )}
    </section>
  );
}
