import { useState } from 'preact/hooks';
import { borrarTodo, cargarDesdeEnlace, copiaJson, estadoVacio, leerCopia, mostrar, nombreDe, reemplazarDatos, type Actualizar, type Estado } from '../almacen';
import type { Crudas } from '../domain/esquemas';
import { construir, leerArchivos, type Datos } from '../domain/importar';
import { avisosAmbiguos } from '../domain/resolver';
import { Icono } from './iconos';

type Props = {
  crudas?: Crudas; datos?: Datos; estado: Estado;
  setEstado: Actualizar; setCrudas: (c: Crudas | undefined, e: Estado) => void;
};

const AVISO_CERO = 'Se empezará de cero: se borrarán los datos actuales, las marcas de confesión, los apodos y las listas guardadas. No se puede deshacer. ¿Continuar?';

export function Ajustes({ crudas, datos, estado, setEstado, setCrudas }: Props) {
  const [errores, setErrores] = useState<string[]>([]);
  const [avisos, setAvisos] = useState<string[]>([]);
  const [permiso, setPermiso] = useState(() => ('Notification' in globalThis ? Notification.permission : 'denied'));
  const [enlace, setEnlace] = useState('');
  const ocultos = datos?.alumnos.filter((a) => estado.ocultos.includes(a.expediente)) ?? [];

  /** Enlace pegado a mano (iPhone: la app instalada no comparte datos con Safari ni recibe el enlace). */
  async function abrirEnlace() {
    const clave = enlace.match(/[#&]k=([\w-]+)/)?.[1] ?? (/^[\w-]{43}$/.test(enlace.trim()) ? enlace.trim() : '');
    if (!clave) return setErrores(['Pegue el enlace completo que le enviaron (termina en #k=…).']);
    const r = await cargarDesdeEnlace(clave, estado.prefs);
    if (typeof r === 'object') { setErrores([]); setEnlace(''); setCrudas(r.crudas, r.estado); }
    else setErrores(r === 'mismo' ? [] : [r]);
  }

  async function importar(files: File[]) {
    if (!files.length) return;
    const leido = await leerArchivos(files);
    // Solo alumnos.csv → se conservan los horarios actuales.
    const solo = Object.keys(leido.crudas);
    const nuevas = crudas && solo.length === 1 && solo[0] === 'alumnos' ? { ...crudas, ...leido.crudas } : leido.crudas;
    const r = construir(nuevas);
    setErrores([...leido.errores, ...r.errores]);
    setAvisos([...leido.avisos, ...(r.datos ? avisosAmbiguos(r.datos) : []), ...r.avisos]);
    if (!r.datos || (crudas && !confirm(AVISO_CERO))) return;
    setCrudas(nuevas, await reemplazarDatos(nuevas, estado.prefs));
  }

  async function restaurar(f?: File) {
    if (!f || (crudas && !confirm(AVISO_CERO))) return;
    const r = await leerCopia(f);
    if (typeof r === 'string') return setErrores([r]);
    setErrores([]);
    setCrudas(r.crudas, r.estado);
  }

  function descargar() {
    const url = URL.createObjectURL(copiaJson(crudas ?? {}, estado));
    const a = document.createElement('a');
    a.href = url;
    a.download = `confession-tracker-copia-${estado.confesados.mes}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function borrar() {
    if (!confirm('Se borrarán TODOS los datos de este dispositivo: alumnos, horarios, marcas de confesión, apodos y listas. No se puede deshacer. ¿Continuar?')) return;
    await borrarTodo();
    setErrores([]); setAvisos([]);
    setCrudas(undefined, estadoVacio());
  }

  const pref = (k: keyof Estado['prefs'], v: boolean) => setEstado((e) => ({ ...e, prefs: { ...e.prefs, [k]: v } }));

  return (
    <section class="ajustes">
      <form class={`tarjeta${datos ? '' : ' destacada'}`} onSubmit={(e) => { e.preventDefault(); void abrirEnlace(); }}>
        <label for="enlace">{datos ? 'Actualizar con su enlace' : 'Pegue aquí el enlace que le enviaron para cargar los datos del curso'}</label>
        <div class="fila-form">
          <input id="enlace" type="text" autoComplete="off" spellcheck={false} placeholder="https://…#k=…" value={enlace} maxLength={300}
            onInput={(e) => setEnlace(e.currentTarget.value)} />
          <button type="submit" class="boton primario">Abrir</button>
        </div>
      </form>

      <h2 class="seccion">Datos</h2>
      <ul class="lista">
        <li><label class="fila-ajuste"><Icono n="importar" /><span>Importar datos<small>Excel de horarios y listas del colegio (Word), a la vez. Solo listas: se mantienen los horarios.</small></span>
          <input type="file" multiple accept=".csv,.xlsx,.docx" class="oculto"
            onChange={(e) => { void importar([...(e.currentTarget.files ?? [])]); e.currentTarget.value = ''; }} /></label></li>
        <li><button class="fila-ajuste" disabled={!crudas} onClick={descargar}><Icono n="exportar" /><span>Exportar copia de seguridad<small>Archivo JSON con datos y marcas</small></span></button></li>
        <li><label class="fila-ajuste"><Icono n="importar" /><span>Restaurar copia</span>
          <input type="file" accept=".json" class="oculto"
            onChange={(e) => { void restaurar(e.currentTarget.files?.[0]); e.currentTarget.value = ''; }} /></label></li>
      </ul>
      {errores.length > 0 && <div class="error" role="alert"><strong>No se ha importado</strong><ul>{errores.map((x) => <li key={x}>{x}</li>)}</ul></div>}
      {avisos.length > 0 && <details class="aviso"><summary>{avisos.length} avisos de coherencia</summary><ul>{avisos.map((x) => <li key={x}>{x}</li>)}</ul></details>}

      {ocultos.length > 0 && (
        <>
          <h2 class="seccion">Alumnos ocultos</h2>
          <ul class="lista">
            {ocultos.map((a) => (
              <li key={a.expediente} class="fila-simple">
                <span>{nombreDe(a, estado)} <span class="tenue">· {a.grupo}</span></span>
                <button class="boton" onClick={() => setEstado(mostrar(a.expediente))}><Icono n="mostrar" />Recuperar</button>
              </li>
            ))}
          </ul>
        </>
      )}

      <h2 class="seccion">Apariencia y avisos</h2>
      <ul class="lista">
        <li><label class="fila-ajuste"><Icono n="luna" /><span>Modo oscuro</span>
          <input type="checkbox" role="switch" class="interruptor" checked={estado.prefs.oscuro} onChange={(e) => pref('oscuro', e.currentTarget.checked)} /></label></li>
        <li><label class="fila-ajuste"><Icono n="letra" /><span>Letra grande</span>
          <input type="checkbox" role="switch" class="interruptor" checked={estado.prefs.grande} onChange={(e) => pref('grande', e.currentTarget.checked)} /></label></li>
        {permiso === 'default' && (
          <li><button class="fila-ajuste" onClick={() => void Notification.requestPermission().then(setPermiso)}>
            <Icono n="campana" /><span>Activar avisos del mes<small>Mitad de mes, final de mes y enhorabuena</small></span></button></li>
        )}
      </ul>

      <h2 class="seccion">Privacidad</h2>
      <p class="tenue">Todo se guarda solo en este dispositivo. Nada se envía a ningún servidor.</p>
      <button class="fila-ajuste peligro" onClick={() => void borrar()}><Icono n="papelera" /><span>Borrar todos los datos</span></button>
    </section>
  );
}
