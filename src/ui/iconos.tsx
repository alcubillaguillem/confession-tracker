// Iconos de trazo (24×24) propios: sin fuentes ni CDNs externos (CSP).
const TRAZOS = {
  buscar: 'M16 10a6 6 0 1 1-12 0a6 6 0 0 1 12 0zM20 20l-5.6-5.6',
  ruta: 'M6 21a2 2 0 1 0 0-4a2 2 0 0 0 0 4zM18 7a2 2 0 1 0 0-4a2 2 0 0 0 0 4zM8 19h8.5a3.5 3.5 0 0 0 0-7h-9a3.5 3.5 0 0 1 0-7H16',
  mensual: 'M4 6l1.5 1.5L8 5M4 12l1.5 1.5L8 11M4 18l1.5 1.5L8 17M11 6h9M11 12h9M11 18h9',
  ajustes: 'M4 7h9M17 7h3M4 17h3M11 17h9M15 5v4M9 15v4',
  cruz: 'M12 3v18M7 8h10',
  mas: 'M12 5v14M5 12h14',
  check: 'M5 12l5 5L20 7',
  x: 'M6 6l12 12M18 6L6 18',
  puntos: 'M12 5.5v.01M12 12v.01M12 18.5v.01',
  lapiz: 'M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4',
  horario: 'M5 5h14v15H5zM5 10h14M9 3v4M15 3v4',
  ocultar: 'M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.4 5.2A9 9 0 0 1 12 5c4.5 0 8 4 9 7a12 12 0 0 1-2.4 3.6M6.6 6.6C4.7 7.8 3.5 9.8 3 12c1 3 4.5 7 9 7a9 9 0 0 0 4.4-1.1',
  mostrar: 'M3 12c1-3 4.5-7 9-7s8 4 9 7c-1 3-4.5 7-9 7s-8-4-9-7zM14.5 12a2.5 2.5 0 1 1-5 0a2.5 2.5 0 0 1 5 0z',
  importar: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  exportar: 'M12 15V4M7 9l5-5 5 5M5 20h14',
  papelera: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  luna: 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z',
  letra: 'M4 7V5h10v2M9 5v14M7 19h4M14 13v-1h6v1M17 12v7M16 19h2',
  campana: 'M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4',
  volver: 'M15 6l-6 6 6 6',
  reloj: 'M21 12a9 9 0 1 1-18 0a9 9 0 0 1 18 0zM12 7v5l3 2',
} as const;

export type NombreIcono = keyof typeof TRAZOS;

export const Icono = ({ n, class: c }: { n: NombreIcono; class?: string }) => (
  <svg class={`icono ${c ?? ''}`} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor"
    stroke-width={n === 'puntos' ? 3 : 2} stroke-linecap="round" stroke-linejoin="round">
    <path d={TRAZOS[n]} />
  </svg>
);
