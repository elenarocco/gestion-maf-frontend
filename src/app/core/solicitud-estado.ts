// Valores que usa el contrato de /api/solicitudes y su texto en pantalla.
// El listado antiguo (/api/Solicitud) todavía envía "En proceso"; se normaliza a "EnProceso".

export const ESTADOS = [
  { valor: 'Pendiente', etiqueta: 'Pendiente' },
  { valor: 'EnProceso', etiqueta: 'En proceso' },
  { valor: 'Completada', etiqueta: 'Completada' },
  { valor: 'Rechazada', etiqueta: 'Rechazada' }
];

export const TIPOS = [
  { valor: 'Ingreso', etiqueta: 'Ingreso' },
  { valor: 'Modificacion', etiqueta: 'Modificación' },
  { valor: 'Bloqueo', etiqueta: 'Bloqueo' },
  { valor: 'Vpn', etiqueta: 'VPN' }
];

export function normalizarEstado(estado: string): string {
  return estado === 'En proceso' ? 'EnProceso' : estado;
}

export function etiquetaEstado(estado: string): string {
  const e = normalizarEstado(estado);
  return ESTADOS.find(x => x.valor === e)?.etiqueta ?? estado;
}

export function etiquetaTipo(tipo: string): string {
  return TIPOS.find(x => x.valor.toLowerCase() === tipo.toLowerCase())?.etiqueta ?? tipo;
}

// Las fechas DateOnly llegan como "YYYY-MM-DD"; se muestran como DD-MM-YYYY sin pasar por Date (evita desfase de zona).
export function formatoFecha(valor: string | null | undefined): string {
  if (!valor) return '—';
  const [a, m, d] = valor.slice(0, 10).split('-');
  return `${d}-${m}-${a}`;
}

// Fechas con hora (UTC) en hora local.
export function formatoFechaHora(valor: string | null | undefined): string {
  if (!valor) return '—';
  return new Date(valor).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
}
