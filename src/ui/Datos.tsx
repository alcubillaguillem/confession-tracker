import { useState } from 'preact/hooks';
import { borrarTodo, copiaJson, estadoVacio, leerCopia, reemplazarDatos, type Actualizar, type Estado } from '../almacen';
import type { Crudas } from '../domain/esquemas';
import { construir, leerArchivos } from '../domain/importar';

type Props = {
  crudas?: Crudas; estado: Estado;
  setEstado: Actualizar; setCrudas: (c: Crudas | undefined, e: Estado) => void;
};

const AVISO_CERO = 'Se empezará de cero: se borrarán los datos actuales, las marcas de confesión y las listas guardadas. No se puede deshacer. ¿Continuar?';

export function Datos({ crudas, estado, setEstado, setCrudas }: Props) {
  const [errores, setErrores] = useState<string[]>([]);
  const [avisos, setAvisos] = useState<string[]>([]);
  const resumen = crudas && construir(crudas).datos;

  async function importar(files: File[]) {
    if (!files.length) return;
    const leido = await leerArchivos(files);
    // Solo alumnos.csv → se conservan los horarios actuales.
    const solo = Object.keys(leido.crudas);
    const nuevas = crudas && solo.length === 1 && solo[0] === 'alumnos' ? { ...crudas, ...leido.crudas } : leido.crudas;
    const r = construir(nuevas);
    setErrores([...leido.errores, ...r.errores]);
    setAvisos(r.avisos);
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
    a.download = `donde-esta-copia-${estado.confesados.mes}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function borrar() {
    if (!confirm('Se borrarán TODOS los datos de este dispositivo: alumnos, horarios, marcas de confesión y listas. No se puede deshacer. ¿Continuar?')) return;
    await borrarTodo();
    setErrores([]); setAvisos([]);
    setCrudas(undefined, estadoVacio());
  }

  return (
    <section>
      <h2>Datos</h2>
      <p>{resumen ? `${resumen.alumnos.length} alumnos y ${Object.keys(resumen.grupos).length} grupos cargados.`
        : 'No hay datos. Importa los 8 CSV (separados por ;) o un Excel con 8 hojas.'}</p>
      <label class="boton">Importar CSV / Excel
        <input type="file" multiple accept=".csv,.xlsx" class="oculto"
          onChange={(e) => { void importar([...(e.currentTarget.files ?? [])]); e.currentTarget.value = ''; }} />
      </label>
      <p class="tenue">Para altas y bajas a mitad de curso, importa solo alumnos.csv: se mantienen los horarios.</p>

      {errores.length > 0 && <div class="error"><strong>No se ha importado:</strong><ul>{errores.map((x) => <li key={x}>{x}</li>)}</ul></div>}
      {avisos.length > 0 && <details class="aviso"><summary>{avisos.length} avisos de coherencia</summary><ul>{avisos.map((x) => <li key={x}>{x}</li>)}</ul></details>}

      <h2>Copia de seguridad</h2>
      <div class="fila">
        <button disabled={!crudas} onClick={descargar}>Exportar copia (JSON)</button>
        <label class="boton">Restaurar copia
          <input type="file" accept=".json" class="oculto"
            onChange={(e) => { void restaurar(e.currentTarget.files?.[0]); e.currentTarget.value = ''; }} />
        </label>
      </div>

      <h2>Visualización</h2>
      <label class="fila"><input type="checkbox" checked={estado.prefs.oscuro}
        onChange={(ev) => { const oscuro = ev.currentTarget.checked; setEstado((e) => ({ ...e, prefs: { ...e.prefs, oscuro } })); }} /> Modo oscuro</label>
      <label class="fila"><input type="checkbox" checked={estado.prefs.grande}
        onChange={(ev) => { const grande = ev.currentTarget.checked; setEstado((e) => ({ ...e, prefs: { ...e.prefs, grande } })); }} /> Letra grande</label>

      <h2>Privacidad</h2>
      <p class="tenue">Todo se guarda solo en este dispositivo. Nada se envía a ningún servidor.</p>
      <button class="peligro" onClick={() => void borrar()}>Borrar todos los datos</button>
    </section>
  );
}
