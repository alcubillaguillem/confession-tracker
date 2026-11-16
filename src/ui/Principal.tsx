import { esMensual } from '../almacen';
import { consultar } from '../domain/resolver';
import { ahora, Anillo, Barra, FilaAlumno, textoUbicacion, type Ctx } from './comun';
import { Icono } from './iconos';

/** Dashboard: progreso del mes, avance por grupo y pendientes con dónde están ahora (marcar = confesado). */
export function Principal({ datos, estado, setEstado, alumnos, abrirMenu }: Ctx) {
  const hechos = new Set(estado.confesados.exps);
  const mensuales = alumnos.filter((a) => esMensual(a, estado));
  const nHechos = mensuales.filter((a) => hechos.has(a.expediente)).length;
  const { dia, franja } = ahora(datos);
  const donde = (a: (typeof alumnos)[number]) => (dia && franja ? consultar(datos, a, dia, franja) : undefined);
  const plantaDe = (c?: ReturnType<typeof donde>) => (c?.opciones.length === 1 ? datos.aulas[c.opciones[0]!.aula]?.planta ?? 99 : 100);

  const pendientes = mensuales.filter((a) => !hechos.has(a.expediente))
    .map((a) => ({ a, c: donde(a) }))
    .sort((x, y) => plantaDe(x.c) - plantaDe(y.c) || x.a.apellidos.localeCompare(y.a.apellidos, 'es'));
  const confesados = mensuales.filter((a) => hechos.has(a.expediente));

  const porGrupo = Object.keys(datos.grupos).sort().map((g) => {
    const delGrupo = mensuales.filter((a) => a.grupo === g);
    return { g, total: delGrupo.length, hechos: delGrupo.filter((a) => hechos.has(a.expediente)).length };
  }).filter((x) => x.total > 0);

  const alternar = (exp: string) => setEstado((e) => {
    const exps = e.confesados.exps;
    return { ...e, confesados: { ...e.confesados, exps: exps.includes(exp) ? exps.filter((x) => x !== exp) : [...exps, exp] } };
  });

  if (!mensuales.length) {
    return <p class="tarjeta">Todavía no hay nadie en confesión mensual. Añádalos desde <strong>Alumnos</strong> con el botón +.</p>;
  }

  return (
    <div class="panel">
      <section class="tarjeta progreso">
        <Anillo hechos={nHechos} total={mensuales.length} />
        <div class="kpis">
          <div><strong class="dorado">{nHechos}</strong><span>confesados</span></div>
          <div><strong>{mensuales.length - nHechos}</strong><span>pendientes</span></div>
        </div>
      </section>

      <section class="tarjeta">
        <h2>Por grupo</h2>
        <ul class="grupos">
          {porGrupo.map((x) => (
            <li key={x.g}><span>{x.g}</span><Barra hechos={x.hechos} total={x.total} /><span class="tenue">{x.hechos}/{x.total}</span></li>
          ))}
        </ul>
      </section>

      <section class="tarjeta ancha">
        <h2>Pendientes {dia && franja ? <span class="tenue">· dónde están ahora</span> : <span class="tenue">· ahora no hay clase</span>}</h2>
        {!pendientes.length ? <p class="vacio">No queda nadie por confesar este mes.</p> : (
          <ul class="lista">
            {pendientes.map(({ a, c }) => (
              <FilaAlumno key={a.expediente} a={a} estado={estado} onTap={() => alternar(a.expediente)} onMenu={abrirMenu}
                sub={`${a.grupo}${c ? ` · ${textoUbicacion(c)}` : ''}`}
                izquierda={<span class="casilla" aria-hidden="true" />} />
            ))}
          </ul>
        )}
        {confesados.length > 0 && (
          <details class="hechos">
            <summary><Icono n="check" />Confesados este mes ({confesados.length})</summary>
            <ul class="lista">
              {confesados.map((a) => (
                <FilaAlumno key={a.expediente} a={a} estado={estado} tachada onTap={() => alternar(a.expediente)} onMenu={abrirMenu}
                  sub={`${a.grupo} · confesado`}
                  izquierda={<span class="casilla marcada" aria-hidden="true"><Icono n="check" /></span>} />
              ))}
            </ul>
          </details>
        )}
      </section>
    </div>
  );
}
