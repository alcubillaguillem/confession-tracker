import { useState } from 'preact/hooks';
import { alternarLista, confesarEnLista, nombreDe, textoBusqueda } from '../almacen';
import { norm } from '../domain/catalogo';
import type { Alumno } from '../domain/importar';
import { consultar, momentosDe } from '../domain/resolver';
import { Barra, FilaAlumno, textoUbicacion, type Ctx } from './comun';
import { Icono } from './iconos';

/** Lista para confesar: panel con dónde está cada alumno ahora y adónde va después. Dura hasta confesarlos a todos. */
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

  const ahora = (a: Alumno) => {
    if (!dia) return { aula: 'Fin de semana', detalle: '' };
    if (!actual) return { aula: 'Fuera de horario', detalle: '' };
    const c = consultar(datos, a, dia, actual.franja);
    if (c.opciones.length === 1 && !c.ambiguo) {
      const o = c.opciones[0]!;
      return { aula: /^\d/.test(o.aula) ? `Aula ${o.aula}` : o.aula, detalle: `${o.asignatura}${o.supuesta ? ' (aula supuesta)' : ''}` };
    }
    return { aula: c.opciones.length ? 'Varias opciones' : c.mensaje ?? '', detalle: c.opciones.length ? textoUbicacion(c) : '' };
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
            {pendientes.map((a) => {
              const ya = ahora(a);
              const luego = dia && siguiente ? consultar(datos, a, dia, siguiente.franja) : undefined;
              return (
                <article key={a.expediente} class="tarjeta-alumno" onContextMenu={(e) => { e.preventDefault(); abrirMenu(a); }}>
                  <header>
                    <div><strong>{nombreDe(a, estado)}</strong><span class="tenue">{a.grupo}</span></div>
                    <button class="icono-btn" aria-label="Más opciones" onClick={() => abrirMenu(a)}><Icono n="puntos" /></button>
                  </header>
                  <div class="ahora">
                    <span class="etiqueta">Ahora{actual ? ` · hasta ${actual.fin}` : ''}</span>
                    <strong class="aula">{ya.aula}</strong>
                    {ya.detalle && <span>{ya.detalle}</span>}
                  </div>
                  {luego && siguiente && (
                    <p class="despues"><span class="etiqueta">Después · {siguiente.inicio}</span> {textoUbicacion(luego)}</p>
                  )}
                  <footer>
                    <button class="boton primario" onClick={() => confesar(a.expediente)}><Icono n="check" />Confesado</button>
                    <button class="boton" onClick={() => setEstado(alternarLista(a.expediente))}>Quitar</button>
                  </footer>
                </article>
              );
            })}
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
