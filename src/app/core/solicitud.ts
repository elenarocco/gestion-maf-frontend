import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SolicitudBloqueoCreate {
  trabajadorId: number;
  creadoPorId: number;
  esTemporal: boolean;
  desde: string | null;
  hasta: string | null;
  justificacion: string;
  tienePc: boolean | null;
  casillaOpera: boolean | null;
  solicitudOrigenId: number | null; // si corrige una solicitud rechazada
}

export interface SolicitudBloqueoResultado {
  solicitudId: number;
  fechaVencimientoSLA: string;
}

export interface SolicitudModificacionCreate {
  trabajadorId: number;
  creadoPorId: number;
  primerNombre: string;
  segundoNombre: string | null;
  primerApellido: string;
  segundoApellido: string | null;
  fechaNacimiento: string;
  sexo: string;
  correo: string;
  direccionCorporativaId: number;
  areaId: number;
  cargoId: number;
  lugarTrabajoId: number;
  fechaIncorporacion: string;
  direccionDomicilio: string | null;
  jefeDirecto: string | null;
  homologarAccesosDesde: string | null;
  tieneTelefonoCorporativo: boolean;
  solicitaTelefono: boolean;
  justificacion: string;
  catalogoIdsAgregar: number[];
  catalogoIdsQuitar: number[];
  solicitudOrigenId: number | null; // si corrige una solicitud rechazada
}

export interface SolicitudModificacionResultado {
  solicitudId: number;
  fechaVencimientoSLA: string;
}

export interface SolicitudAcceso {
  catalogoId: number;
  nombre: string;
  tipo: string;
  accion: 'Agregar' | 'Quitar';
}

export interface PasoHistorial {
  id: number;
  accion: string;
  realizadoPorCorreo: string;
  fecha: string;
  comentario: string | null;
}

export type AccionSolicitud = 'aprobar' | 'iniciar' | 'rechazar' | 'completar';
// 'corregir' no cambia el estado: abre el formulario para crear una solicitud nueva enlazada.
export type AccionDisponible = AccionSolicitud | 'corregir';

export interface SolicitudDetalle {
  id: number;
  trabajadorId: number;
  trabajadorNombre: string;
  areaNombre: string;
  creadoPorCorreo: string;
  tipo: string;
  estado: string;
  motivoRechazo: string | null;
  solicitudOrigenId: number | null; // esta solicitud corrige a esa
  corregidaPorId: number | null;    // esa solicitud corrige a esta
  fechaCreacion: string;
  fechaVencimientoSLA: string;
  bloqueo: { esTemporal: boolean; fechaInicio: string; fechaFin: string | null; justificacion: string;
             tienePc: boolean | null; casillaOpera: boolean | null } | null;
  modificacion: { justificacion: string } | null;
  accesosSolicitados: SolicitudAcceso[];
  historial: PasoHistorial[];
  accionesDisponibles: AccionDisponible[];
}

@Injectable({ providedIn: 'root' })
export class SolicitudService {
  private apiUrl = 'http://localhost:5153/api/Solicitud';
  constructor(private http: HttpClient) { }

  crearIngreso(dto: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/ingreso`, dto);
  }
  crearBloqueo(dto: SolicitudBloqueoCreate): Observable<SolicitudBloqueoResultado> {
    return this.http.post<SolicitudBloqueoResultado>(`${this.apiUrl}/bloqueo`, dto);
  }
  crearModificacion(dto: SolicitudModificacionCreate): Observable<SolicitudModificacionResultado> {
    return this.http.post<SolicitudModificacionResultado>(`${this.apiUrl}/modificacion`, dto);
  }
  getDetalle(id: number): Observable<SolicitudDetalle> {
    return this.http.get<SolicitudDetalle>(`${this.apiUrl}/${id}`);
  }
  // aprobar, iniciar y completar no llevan cuerpo; rechazar exige motivo.
  cambiarEstado(id: number, accion: AccionSolicitud, motivo?: string): Observable<{ solicitudId: number; estado: string }> {
    return this.http.post<{ solicitudId: number; estado: string }>(
      `${this.apiUrl}/${id}/${accion}`, accion === 'rechazar' ? { motivo } : null);
  }
  getAll(filtros: { tipo?: string, estado?: string, urgente?: boolean } = {}, pagina = 1, tamanoPagina = 20): Observable<any> {
  const params = new URLSearchParams({ pagina: String(pagina), tamanoPagina: String(tamanoPagina) });
  if (filtros.tipo) params.set('tipo', filtros.tipo);
  if (filtros.estado) params.set('estado', filtros.estado);
  if (filtros.urgente) params.set('urgente', 'true');
  return this.http.get(`${this.apiUrl}?${params.toString()}`);
}
}