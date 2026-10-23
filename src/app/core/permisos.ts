// Códigos de permiso que define el backend (tabla Permisos). El frontend solo los usa para mostrar u
// ocultar pantallas; quien autoriza de verdad es la API, que vuelve a validar cada llamada.
export const PERMISOS = {
  consultarTrabajadores: 'ConsultarTrabajadoresYAccesos',
  consultarTodasLasSolicitudes: 'ConsultarTodasLasSolicitudes',
  consultarSolicitudesPropias: 'ConsultarSolicitudesPropias',
  crearIngreso: 'CrearSolicitudIngreso',
  crearModificacion: 'CrearSolicitudModificacion',
  crearBloqueo: 'CrearSolicitudBloqueo',
  solicitarVpn: 'SolicitarAccesoVPN',
  completarFichaVpn: 'CompletarFichaVPN',
  bandejaTi: 'GestionarBandejaTI',
  administrarCatalogos: 'AdministrarCatalogos',
  exportarReportes: 'ExportarReportes'
} as const;

// Con cualquiera de estos se puede crear algún tipo de solicitud.
export const PERMISOS_CREAR_SOLICITUD = [
  PERMISOS.crearIngreso, PERMISOS.crearModificacion, PERMISOS.crearBloqueo, PERMISOS.solicitarVpn
];

// El listado de solicitudes muestra las que el rol puede consultar o crear.
export const PERMISOS_VER_SOLICITUDES = [
  PERMISOS.consultarTodasLasSolicitudes, PERMISOS.consultarSolicitudesPropias, ...PERMISOS_CREAR_SOLICITUD
];
