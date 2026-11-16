import { useEffect, useMemo, useState } from 'preact/hooks';
import { cargar, esMensual, guardarEstado, visibles, type Actualizar, type Estado } from '../almacen';
import { avisoPendiente, notificar, textoAviso } from '../avisos';
import type { Crudas } from '../domain/esquemas';
import { construir, type Alumno } from '../domain/importar';
import { Ajustes } from './Ajustes';
import { Buscar } from './Buscar';
import { ahora, Barra, DIA_LARGO, MenuAlumno, nombreMes, type Ctx, type Cuando, type Pestana } from './comun';
import { Horario } from './Horario';
import { Icono, type NombreIcono } from './iconos';
import { Mensual } from './Mensual';
import { Ruta } from './Ruta';

const NAV: [Pestana, string, NombreIcono][] = [
  ['buscar', 'Buscar', 'buscar'], ['ruta', 'Ruta', 'ruta'], ['mensual', 'Mensual', 'mensual'], ['ajustes', 'Ajustes', 'ajustes'],
];

export function App() {
  const [crudas, setCrudas] = useState<Crudas>();
  const [estado, setEstadoLocal] = useState<Estado>();
  const [pestana, setPestana] = useState<Pestana>('buscar');
  const [horarioDe, setHorarioDe] = useState<Alumno | null>(null);
  const [menuDe, setMenuDe] = useState<Alumno | null>(null);
  const [banner, setBanner] = useState('');
  const [sel, setSel] = useState<string[]>([]);
  const [cuando, setCuando] = useState<Cuando>({ dia: '', franja: '' });

  useEffect(() => { void cargar().then((r) => { setCrudas(r.crudas); setEstadoLocal(r.estado); }); }, []);
  const datos = useMemo(() => (crudas ? construir(crudas).datos : undefined), [crudas]);
  useEffect(() => { if (datos) setCuando(ahora(datos)); }, [datos]);

  const setEstado: Actualizar = (f) => setEstadoLocal((prev) => {
    const e = f(prev!);
    void guardarEstado(e);
    return e;
  });

  const alumnos = useMemo(() => (datos && estado ? visibles(datos.alumnos, estado) : []), [datos, estado?.ocultos]);
  const mensuales = estado ? alumnos.filter((a) => esMensual(a, estado)) : [];
  const hechos = new Set(estado?.confesados.exps);
  const nHechos = mensuales.filter((a) => hechos.has(a.expediente)).length;

  // Avisos de confesión: al abrir y cada vez que cambia el estado.
  useEffect(() => {
    if (!datos || !estado) return;
    const aviso = avisoPendiente(new Date(), mensuales.length, mensuales.length - nHechos, estado.avisos.enviados);
    if (!aviso) return;
    const texto = textoAviso(aviso, mensuales.length, mensuales.length - nHechos);
    setBanner(texto);
    void notificar(texto);
    setEstado((e) => ({ ...e, avisos: { ...e.avisos, enviados: [...e.avisos.enviados, aviso] } }));
  }, [datos, estado]);

  useEffect(() => {
    document.documentElement.classList.toggle('oscuro', !!estado?.prefs.oscuro);
    document.documentElement.classList.toggle('grande', !!estado?.prefs.grande);
  }, [estado?.prefs]);

  if (!estado) return null;
  const actual: Pestana = datos ? pestana : 'ajustes';
  const ir = (p: Pestana) => { setPestana(p); setHorarioDe(null); };

  const franja = datos?.franjas.find((f) => f.franja === cuando.franja);
  const subtitulo = {
    buscar: !cuando.dia ? 'Fin de semana' : `${DIA_LARGO[cuando.dia]} · ${franja ? `${franja.franja} · ${franja.inicio}` : 'fuera de franja'}`,
    ruta: `${sel.length} ${sel.length === 1 ? 'alumno' : 'alumnos'}`,
    mensual: `${nombreMes(estado.confesados.mes)} · ${nHechos} de ${mensuales.length}`,
    ajustes: datos ? `${datos.alumnos.length} alumnos · ${Object.keys(datos.grupos).length} grupos` : 'Sin datos',
  }[actual];

  const ctx: Ctx | undefined = datos && {
    datos, estado, setEstado, alumnos, sel, setSel: (f) => setSel(f), cuando, setCuando, abrirMenu: setMenuDe, ir,
  };

  const botonesNav = NAV.map(([id, txt, ico]) => (
    <button key={id} class={actual === id ? 'activa' : ''} aria-current={actual === id ? 'page' : undefined}
      disabled={!datos && id !== 'ajustes'} onClick={() => ir(id)}>
      <Icono n={ico} /><span>{txt}</span>
    </button>
  ));

  return (
    <div class="app">
      <aside class="lateral">
        <div class="marca"><img src="./icon.svg" alt="" width="32" height="32" />¿Dónde está?</div>
        <nav class="nav-lateral" aria-label="Secciones">{botonesNav}</nav>
        {mensuales.length > 0 && (
          <div class="mini-progreso">
            {nombreMes(estado.confesados.mes)}<Barra hechos={nHechos} total={mensuales.length} />{nHechos} de {mensuales.length}
          </div>
        )}
      </aside>

      <div class="cuerpo">
        <header class="cabecera">
          <h1>{horarioDe ? 'Horario' : NAV.find(([id]) => id === actual)![1]}</h1>
          <p>{subtitulo}</p>
        </header>
        {banner && <p class="banner" role="status">{banner}<button class="icono-btn" aria-label="Cerrar aviso" onClick={() => setBanner('')}><Icono n="x" /></button></p>}
        <main class="contenido">
          {horarioDe && ctx ? <Horario datos={ctx.datos} estado={estado} alumno={horarioDe} volver={() => setHorarioDe(null)} />
            : actual === 'ajustes' || !ctx
              ? <Ajustes crudas={crudas} datos={datos} estado={estado} setEstado={setEstado}
                  setCrudas={(c, e) => { setCrudas(c); setEstadoLocal(e); setSel([]); }} />
              : actual === 'buscar' ? <Buscar {...ctx} total={mensuales.length} hechos={nHechos} />
              : actual === 'ruta' ? <Ruta {...ctx} />
              : <Mensual {...ctx} />}
        </main>
      </div>

      <nav class="nav-inferior" aria-label="Secciones">{botonesNav}</nav>

      {menuDe && <MenuAlumno a={menuDe} estado={estado} setEstado={setEstado} verHorario={setHorarioDe} cerrar={() => setMenuDe(null)} />}
    </div>
  );
}
