import type { ComponentChildren } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { alternarMensual, esMensual, nombreDe, ocultar, ponerApodo, type Actualizar, type Estado } from '../almacen';
import { DIAS, type Dia } from '../domain/catalogo';
import type { Alumno, Datos } from '../domain/importar';
import { franjaDe, type Consulta } from '../domain/resolver';
import { Icono } from './iconos';

export type Cuando = { dia: Dia | ''; franja: string };
export type Pestana = 'principal' | 'alumnos' | 'ajustes';

/** Lo que comparten las pantallas. */
export type Ctx = {
  datos: Datos; estado: Estado; setEstado: Actualizar; alumnos: Alumno[];
  cuando: Cuando; // siempre el momento actual
  abrirMenu: (a: Alumno) => void;
};

/** Al abrir: hoy y la franja actual; fuera de franja, sin franja; en fin de semana, sin día. */
export function ahora(datos: Datos): Cuando {
  const f = new Date();
  return { dia: DIAS[f.getDay() - 1] ?? '', franja: franjaDe(datos, f)?.franja ?? '' };
}

export const DIA_LARGO: Record<Dia, string> = { lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles', jueves: 'Jueves', viernes: 'Viernes' };
export const nombreMes = (mes: string) =>
  new Date(`${mes}-15T12:00`).toLocaleDateString('es', { month: 'long' }).replace(/^./, (c) => c.toUpperCase());

/** Texto corto de dónde está: "Biología · 3.3". */
export function textoUbicacion(c: Consulta) {
  if (!c.opciones.length) return c.mensaje ?? '';
  if (c.ambiguo) return `Ambiguo: ${c.opciones.map((o) => o.aula).join(' o ')}`;
  const o = c.opciones[0]!;
  return `${o.asignatura} · ${o.aula}${o.supuesta ? ' (supuesta)' : ''}`;
}

export function Anillo({ hechos, total }: { hechos: number; total: number }) {
  const pct = total ? hechos / total : 0;
  const L = 2 * Math.PI * 15;
  return (
    <svg class="anillo" viewBox="0 0 36 36" role="img" aria-label={`${hechos} de ${total} confesados`}>
      <circle cx="18" cy="18" r="15" class="anillo-fondo" />
      {pct > 0 && <circle cx="18" cy="18" r="15" class="anillo-valor" stroke-dasharray={`${pct * L} ${L}`} transform="rotate(-90 18 18)" />}
      <text x="18" y="21" text-anchor="middle">{Math.round(pct * 100)}%</text>
    </svg>
  );
}

export const Barra = ({ hechos, total }: { hechos: number; total: number }) => (
  <svg class="barra" viewBox="0 0 100 6" preserveAspectRatio="none" role="img" aria-label={`${hechos} de ${total}`}>
    <rect class="barra-fondo" width="100" height="6" rx="3" />
    <rect class="barra-valor" width={total ? (100 * hechos) / total : 0} height="6" rx="3" />
  </svg>
);

const iniciales = (a: Alumno, e: Estado) =>
  nombreDe(a, e).split(' ').slice(0, 2).map((p) => p[0] ?? '').join('').toUpperCase();

type FilaProps = {
  a: Alumno; estado: Estado; sub?: ComponentChildren;
  izquierda?: ComponentChildren; derecha?: ComponentChildren;
  activa?: boolean; tachada?: boolean;
  onTap?: () => void; onMenu: (a: Alumno) => void;
};

/** Fila de alumno: toque = acción principal; pulsación larga, clic derecho o ⋮ = menú. */
export function FilaAlumno(p: FilaProps) {
  const t = useRef<number>();
  const largo = useRef(false);
  const cancelar = () => clearTimeout(t.current);
  const abrir = () => { largo.current = true; p.onMenu(p.a); };
  return (
    <li class={`fila-alumno${p.activa ? ' activa' : ''}${p.tachada ? ' tachada' : ''}`}
      onPointerDown={(e) => { largo.current = false; cancelar(); if (!e.button) t.current = window.setTimeout(abrir, 500); }}
      onPointerUp={cancelar} onPointerLeave={cancelar} onPointerCancel={cancelar}
      onContextMenu={(e) => { e.preventDefault(); cancelar(); if (!largo.current) abrir(); }}>
      <button class="fila-principal" onClick={() => { if (largo.current) largo.current = false; else p.onTap?.(); }}>
        {p.izquierda ?? <span class="avatar">{p.activa ? <Icono n="check" /> : iniciales(p.a, p.estado)}</span>}
        <span class="fila-texto">
          <span class="fila-nombre">{nombreDe(p.a, p.estado)}</span>
          <span class="fila-sub">{p.sub ?? p.a.grupo}</span>
        </span>
      </button>
      {p.derecha}
      <button class="icono-btn solo-raton" aria-label="Más opciones" onClick={() => p.onMenu(p.a)}><Icono n="puntos" /></button>
    </li>
  );
}

type MenuProps = { a: Alumno; estado: Estado; setEstado: Actualizar; verHorario: (a: Alumno) => void; cerrar: () => void };

export function MenuAlumno({ a, estado, setEstado, verHorario, cerrar }: MenuProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const arrastre = useRef<{ y: number; t: number; dy: number } | null>(null);
  const arrastrado = useRef(false);
  const [editando, setEditando] = useState(false);
  const [apodo, setApodo] = useState(estado.apodos[a.expediente] ?? '');
  useEffect(() => { ref.current?.showModal(); }, []);
  const mensual = esMensual(a, estado);

  /** Cierre animado: la hoja baja (o se desvanece en escritorio) y después se desmonta. */
  const salir = (despues?: () => void) => {
    const d = ref.current;
    if (!d || d.classList.contains('saliendo')) return;
    d.classList.remove('arrastrando');
    d.style.transform = '';
    d.classList.add('saliendo');
    const fin = () => { cerrar(); despues?.(); };
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) fin(); else setTimeout(fin, 260);
  };
  const aplicar = (f: (e: Estado) => Estado) => { setEstado(f); salir(); };

  // Deslizar hacia abajo para cerrar (pantallas táctiles).
  const empezar = (e: PointerEvent) => {
    if (e.pointerType === 'mouse' || (e.target as HTMLElement).closest('input')) return;
    arrastre.current = { y: e.clientY, t: e.timeStamp, dy: 0 };
    arrastrado.current = false;
  };
  const mover = (e: PointerEvent) => {
    const r = arrastre.current;
    const d = ref.current;
    if (!r || !d) return;
    r.dy = Math.max(0, e.clientY - r.y);
    if (r.dy > 6) { arrastrado.current = true; d.classList.add('arrastrando'); d.style.transform = `translateY(${r.dy}px)`; }
  };
  const soltar = (e: PointerEvent) => {
    const r = arrastre.current;
    arrastre.current = null;
    if (!r || !arrastrado.current) return;
    const rapido = r.dy / Math.max(1, e.timeStamp - r.t) > 0.6;
    if (r.dy > 90 || rapido) salir();
    else { ref.current?.classList.remove('arrastrando'); if (ref.current) ref.current.style.transform = ''; }
  };

  return (
    <dialog ref={ref} class="hoja" onClose={cerrar} onCancel={(e) => { e.preventDefault(); salir(); }}
      onPointerDown={empezar} onPointerMove={mover} onPointerUp={soltar} onPointerCancel={soltar}
      onClickCapture={(e) => { if (arrastrado.current) { e.stopPropagation(); e.preventDefault(); arrastrado.current = false; } }}
      onClick={(e) => { if (e.target === ref.current) salir(); }}>
      <div class="hoja-asa" />
      <p class="hoja-titulo" tabIndex={-1} autofocus>{nombreDe(a, estado)} <span class="tenue">· {a.grupo}</span></p>
      {editando ? (
        <form class="hoja-form" onSubmit={(e) => { e.preventDefault(); aplicar(ponerApodo(a.expediente, apodo)); }}>
          <label>Apodo
            <input value={apodo} maxLength={60} placeholder={a.nombre} autoFocus onInput={(e) => setApodo(e.currentTarget.value)} />
          </label>
          <p class="tenue">El buscador seguirá encontrando su nombre real. Déjalo vacío para quitar el apodo.</p>
          <div class="botones">
            <button type="button" class="boton" onClick={() => setEditando(false)}>Cancelar</button>
            <button type="submit" class="boton primario">Guardar</button>
          </div>
        </form>
      ) : (
        <ul class="hoja-acciones">
          <li><button onClick={() => aplicar(alternarMensual(a))}><Icono n="cruz" class="dorado" />
            {mensual ? 'Quitar de confesión mensual' : 'Poner en confesión mensual'}</button></li>
          <li><button onClick={() => setEditando(true)}><Icono n="lapiz" />Cambiar nombre</button></li>
          <li><button onClick={() => salir(() => verHorario(a))}><Icono n="horario" />Ver horario</button></li>
          <li><button class="peligro" onClick={() => {
            if (confirm(`¿Eliminar a ${nombreDe(a, estado)} de la app? Se borrarán sus marcas y su apodo. Puedes recuperarlo en Ajustes → Alumnos ocultos.`)) aplicar(ocultar(a.expediente));
          }}><Icono n="ocultar" />Eliminar de la lista</button></li>
        </ul>
      )}
    </dialog>
  );
}
