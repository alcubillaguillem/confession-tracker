import { useEffect, useMemo, useState } from 'preact/hooks';
import { cargar, esMensual, guardarEstado, type Actualizar, type Estado } from '../almacen';
import { avisoPendiente, notificar, textoAviso } from '../avisos';
import type { Crudas } from '../domain/esquemas';
import { construir, type Alumno } from '../domain/importar';
import { Buscar } from './Buscar';
import { Confesion } from './Confesion';
import { Datos } from './Datos';
import { Horario } from './Horario';

type Pestana = 'buscar' | 'confesion' | 'datos';
const PESTANAS: [Pestana, string][] = [['buscar', 'Buscar'], ['confesion', 'Confesión'], ['datos', 'Datos']];

export function App() {
  const [crudas, setCrudas] = useState<Crudas>();
  const [estado, setEstadoLocal] = useState<Estado>();
  const [pestana, setPestana] = useState<Pestana>('buscar');
  const [horarioDe, setHorarioDe] = useState<Alumno | null>(null);
  const [banner, setBanner] = useState('');

  useEffect(() => { void cargar().then((r) => { setCrudas(r.crudas); setEstadoLocal(r.estado); }); }, []);
  const datos = useMemo(() => (crudas ? construir(crudas).datos : undefined), [crudas]);

  const setEstado: Actualizar = (f) => setEstadoLocal((prev) => {
    const e = f(prev!);
    void guardarEstado(e);
    return e;
  });

  // Avisos de confesión: al abrir y cada vez que cambia el estado.
  useEffect(() => {
    if (!datos || !estado) return;
    const mensuales = datos.alumnos.filter((a) => esMensual(a, estado));
    const hechos = new Set(estado.confesados.exps);
    const pendientes = mensuales.filter((a) => !hechos.has(a.expediente)).length;
    const aviso = avisoPendiente(new Date(), mensuales.length, pendientes, estado.avisos.enviados);
    if (!aviso) return;
    const texto = textoAviso(aviso, mensuales.length, pendientes);
    setBanner(texto);
    void notificar(texto);
    setEstado((e) => ({ ...e, avisos: { ...e.avisos, enviados: [...e.avisos.enviados, aviso] } }));
  }, [datos, estado]);

  useEffect(() => {
    document.documentElement.classList.toggle('oscuro', !!estado?.prefs.oscuro);
    document.documentElement.classList.toggle('grande', !!estado?.prefs.grande);
  }, [estado?.prefs]);

  if (!estado) return null;
  const actual = datos ? pestana : 'datos';
  const props = { datos: datos!, estado, setEstado };

  return (
    <main>
      <nav>
        {PESTANAS.map(([id, txt]) => (
          <button key={id} class={actual === id ? 'activa' : ''} disabled={!datos && id !== 'datos'}
            onClick={() => { setPestana(id); setHorarioDe(null); }}>{txt}</button>
        ))}
      </nav>
      {banner && <p class="banner" role="status">{banner} <button onClick={() => setBanner('')}>Cerrar</button></p>}
      {actual === 'datos' && (
        <Datos crudas={crudas} estado={estado} setEstado={setEstado}
          setCrudas={(c, e) => { setCrudas(c); setEstadoLocal(e); }} />
      )}
      {actual === 'buscar' && (horarioDe
        ? <Horario datos={datos!} alumno={horarioDe} volver={() => setHorarioDe(null)} />
        : <Buscar {...props} verHorario={setHorarioDe} />)}
      {actual === 'confesion' && <Confesion {...props} />}
    </main>
  );
}
