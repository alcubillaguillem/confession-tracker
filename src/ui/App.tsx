import { useEffect, useMemo, useState } from 'preact/hooks';
import { cargar, esMensual, guardarEstado, visibles, type Actualizar, type Estado } from '../almacen';
import { avisoPendiente, notificar, textoAviso } from '../avisos';
import type { Crudas } from '../domain/esquemas';
import { construir, type Alumno } from '../domain/importar';
import { Ajustes } from './Ajustes';
import { Alumnos } from './Alumnos';
import { ahora, Barra, MenuAlumno, nombreMes, type Ctx, type Cuando, type Pestana } from './comun';
import { Desbloqueo } from './Desbloqueo';
import { Horario } from './Horario';
import { Icono, type NombreIcono } from './iconos';
import { Principal } from './Principal';

const NAV: [Pestana, string, NombreIcono][] = [
  ['principal', 'Principal', 'principal'], ['alumnos', 'Alumnos', 'alumnos'], ['ajustes', 'Ajustes', 'ajustes'],
];

export function App() {
  const [crudas, setCrudas] = useState<Crudas>();
  const [estado, setEstadoLocal] = useState<Estado>();
  const [pestana, setPestana] = useState<Pestana>('principal');
  const [horarioDe, setHorarioDe] = useState<Alumno | null>(null);
  const [menuDe, setMenuDe] = useState<Alumno | null>(null);
  const [banner, setBanner] = useState('');
  const [cuando, setCuando] = useState<Cuando>({ dia: '', franja: '' });

  useEffect(() => { void cargar().then((r) => { setCrudas(r.crudas); setEstadoLocal(r.estado); }); }, []);
  const datos = useMemo(() => (crudas ? construir(crudas).datos : undefined), [crudas]);
  // La app sigue la hora sola: recalcula el día y la franja cada 30 segundos.
  useEffect(() => {
    if (!datos) return;
    setCuando(ahora(datos));
    const t = setInterval(() => setCuando(ahora(datos)), 30_000);
    return () => clearInterval(t);
  }, [datos]);

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
  if (!datos) return <Desbloqueo prefs={estado.prefs} listo={(c, e) => { setCrudas(c); setEstadoLocal(e); }} />;

  const ir = (p: Pestana) => { setPestana(p); setHorarioDe(null); };
  const subtitulo = {
    principal: `${nombreMes(estado.confesados.mes)} · ${nHechos} de ${mensuales.length} confesados`,
    alumnos: `${alumnos.length} alumnos`,
    ajustes: `${datos.alumnos.length} alumnos · ${Object.keys(datos.grupos).length} grupos`,
  }[pestana];
  const ctx: Ctx = { datos, estado, setEstado, alumnos, cuando, abrirMenu: setMenuDe };

  const botonesNav = NAV.map(([id, txt, ico]) => (
    <button key={id} class={pestana === id ? 'activa' : ''} aria-current={pestana === id ? 'page' : undefined} onClick={() => ir(id)}>
      <Icono n={ico} /><span>{txt}</span>
    </button>
  ));

  return (
    <div class="app">
      <aside class="lateral">
        <div class="marca"><img src="./icon.svg" alt="" width="32" height="32" />Confession Tracker</div>
        <nav class="nav-lateral" aria-label="Secciones">{botonesNav}</nav>
        {mensuales.length > 0 && (
          <div class="mini-progreso">
            {nombreMes(estado.confesados.mes)}<Barra hechos={nHechos} total={mensuales.length} />{nHechos} de {mensuales.length}
          </div>
        )}
      </aside>

      <div class="cuerpo">
        <header class="cabecera">
          <h1>{horarioDe ? 'Horario' : NAV.find(([id]) => id === pestana)![1]}</h1>
          <p>{subtitulo}</p>
        </header>
        {banner && <p class="banner" role="status">{banner}<button class="icono-btn" aria-label="Cerrar aviso" onClick={() => setBanner('')}><Icono n="x" /></button></p>}
        <main class="contenido">
          {horarioDe ? <Horario datos={datos} estado={estado} alumno={horarioDe} volver={() => setHorarioDe(null)} />
            : pestana === 'principal' ? <Principal {...ctx} />
            : pestana === 'alumnos' ? <Alumnos {...ctx} />
            : <Ajustes datos={datos} estado={estado} setEstado={setEstado} />}
        </main>
      </div>

      <nav class="nav-inferior" aria-label="Secciones">{botonesNav}</nav>

      {menuDe && <MenuAlumno a={menuDe} estado={estado} setEstado={setEstado} verHorario={setHorarioDe} cerrar={() => setMenuDe(null)} />}
    </div>
  );
}
