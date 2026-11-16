import { useMemo, useState } from 'preact/hooks';
import { alternarMensual, esMensual, textoBusqueda } from '../almacen';
import { norm } from '../domain/catalogo';
import type { Alumno } from '../domain/importar';
import { consultar } from '../domain/resolver';
import { Anillo, FilaAlumno, SelectorCuando, textoUbicacion, type Ctx } from './comun';
import { Icono } from './iconos';
import { Ruta } from './Ruta';

export function Buscar(ctx: Ctx & { hechos: number; total: number }) {
  const { datos, estado, setEstado, alumnos, sel, setSel, cuando, setCuando, abrirMenu, ir, hechos, total } = ctx;
  const [q, setQ] = useState('');
  const [soloMensual, setSoloMensual] = useState(false);

  const repetidos = useMemo(() => {
    const n = new Map<string, number>();
    for (const a of alumnos) { const k = norm(a.nombre + a.apellidos); n.set(k, (n.get(k) ?? 0) + 1); }
    return n;
  }, [alumnos]);

  const palabras = norm(q).split(' ').filter(Boolean);
  const buscando = palabras.length > 0 || soloMensual;
  const lista = buscando
    ? alumnos.filter((a) => (!soloMensual || esMensual(a, estado)) && palabras.every((p) => norm(textoBusqueda(a, estado)).includes(p)))
    : alumnos.filter((a) => sel.includes(a.expediente));

  const sub = (a: Alumno) => {
    const donde = cuando.dia && cuando.franja ? ` · ${textoUbicacion(consultar(datos, a, cuando.dia, cuando.franja))}` : '';
    return `${a.grupo}${donde}${(repetidos.get(norm(a.nombre + a.apellidos)) ?? 0) > 1 ? ' · nombre repetido' : ''}`;
  };
  const alternar = (exp: string) => setSel((s) => (s.includes(exp) ? s.filter((x) => x !== exp) : [...s, exp]));

  return (
    <div class="dos-columnas">
      <section class="columna">
        <div class="tarjeta progreso">
          <Anillo hechos={hechos} total={total} />
          <div class="cifras">
            <div><span class="etiqueta">Confesados</span><strong class="dorado">{hechos}</strong></div>
            <div><span class="etiqueta">Por confesar</span><strong>{total - hechos}</strong></div>
          </div>
        </div>

        <label class="buscador">
          <Icono n="buscar" />
          <input type="search" placeholder="Buscar alumno o grupo" value={q} maxLength={80} aria-label="Buscar alumno o grupo"
            onInput={(e) => setQ(e.currentTarget.value)} />
        </label>
        <div class="chips">
          <SelectorCuando datos={datos} cuando={cuando} setCuando={setCuando} />
          <button class="chip" aria-pressed={soloMensual} onClick={() => setSoloMensual(!soloMensual)}><Icono n="cruz" />Mensual</button>
        </div>

        {!buscando && !lista.length && <p class="vacio">Escribe un nombre, apellido o grupo. Toca para seleccionar y mantén pulsado para más opciones.</p>}
        {buscando && !lista.length && <p class="vacio">No hay alumnos que coincidan.</p>}
        {!buscando && lista.length > 0 && <p class="seccion">Seleccionados</p>}
        <ul class="lista">
          {lista.slice(0, 60).map((a) => {
            const m = esMensual(a, estado);
            return (
              <FilaAlumno key={a.expediente} a={a} estado={estado} sub={sub(a)} activa={sel.includes(a.expediente)}
                onTap={() => alternar(a.expediente)} onMenu={abrirMenu}
                derecha={
                  <button class={`icono-btn${m ? ' dorado' : ''}`} aria-pressed={m}
                    aria-label={m ? 'Quitar de confesión mensual' : 'Poner en confesión mensual'}
                    onClick={() => setEstado(alternarMensual(a))}><Icono n={m ? 'cruz' : 'mas'} /></button>
                } />
            );
          })}
        </ul>
        {lista.length > 60 && <p class="vacio">Mostrando 60 de {lista.length}. Afina la búsqueda.</p>}

        {sel.length > 0 && (
          <div class="barra-seleccion">
            <span>{sel.length} {sel.length === 1 ? 'seleccionado' : 'seleccionados'}</span>
            {buscando && <button class="boton" onClick={() => setSel((s) => [...new Set([...s, ...lista.map((a) => a.expediente)])])}>Todos</button>}
            <button class="boton" onClick={() => setSel(() => [])}>Limpiar</button>
            <button class="boton primario solo-movil" onClick={() => ir('ruta')}><Icono n="ruta" />Ver ruta</button>
          </div>
        )}
      </section>

      <aside class="columna solo-escritorio"><Ruta {...ctx} compacta /></aside>
    </div>
  );
}
