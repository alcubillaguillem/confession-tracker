export type Aviso = 'mitad' | 'final' | 'enhorabuena';

/** Qué aviso toca mostrar (como mucho uno, y cada uno una vez al mes). */
export function avisoPendiente(fecha: Date, total: number, pendientes: number, enviados: string[]): Aviso | null {
  if (!total) return null;
  const tipo: Aviso | null = pendientes === 0 ? 'enhorabuena'
    : fecha.getDate() > new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0).getDate() - 3 ? 'final'
    : fecha.getDate() >= 15 ? 'mitad' : null;
  return tipo && !enviados.includes(tipo) ? tipo : null;
}

// Solo recuentos: una notificación del sistema puede verse en la pantalla de bloqueo.
export const textoAviso = (a: Aviso, total: number, pendientes: number) => ({
  mitad: `Mitad de mes: te quedan ${pendientes} de ${total} por confesar.`,
  final: `Últimos días del mes: te quedan ${pendientes} de ${total} por confesar.`,
  enhorabuena: `¡Enhorabuena! Este mes se han confesado los ${total}.`,
})[a];

export async function notificar(texto: string) {
  if (!('Notification' in globalThis) || Notification.permission !== 'granted') return;
  const reg = await navigator.serviceWorker?.getRegistration();
  if (reg) await reg.showNotification('¿Dónde está?', { body: texto, icon: './icon.svg' });
  else new Notification('¿Dónde está?', { body: texto });
}
