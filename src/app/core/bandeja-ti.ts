import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { FichaVpn, HistorialItem } from './solicitud-vpn';

// La Bandeja de TI es solo para este rol (el backend vuelve a validarlo).
export const ROLES_BANDEJA_TI = ['Admin TI'];

export type AccionTi = 'tomar' | 'completar' | 'rechazar' | 'confirmarEnvio' | 'rechazarFicha';

export interface SolicitudBandeja {
  id: number;
  tipo: string;
  estado: string;
  trabajadorNombre: string | null;
  creadoPorNombre: string;
  fechaCreacion: string;
  fechaVencimientoSLA: string;
  vencida: boolean;
}

export interface PaginaBandeja {
  items: SolicitudBandeja[];
  total: number;
  pagina: number;
  tamano: number;
}

export interface SolicitudDetalleTi {
  id: number;
  tipo: string;
  estado: string;
  motivoRechazo: string | null;
  fechaCreacion: string;
  fechaVencimientoSLA: string;
  vencida: boolean;
  creadoPorNombre: string;
  trabajadorNombre: string | null;
  detalle: Record<string, unknown> | null;   // campos según el tipo
  vpn: {
    motivoId: number;
    motivoNombre: string;
    formularioHabilitado: boolean;
    fechaEnvioProveedor: string | null;
    ficha: FichaVpn | null;
  } | null;
  historial: HistorialItem[];
  accionesPermitidas: AccionTi[];
}

@Injectable({ providedIn: 'root' })
export class BandejaTiService {
  private apiUrl = `${environment.apiUrl}/solicitudes`;
  constructor(private http: HttpClient) { }

  listar(filtros: { tipo?: string, estado?: string } = {}, pagina = 1, tamano = 20): Observable<PaginaBandeja> {
    let params = new HttpParams().set('pagina', pagina).set('tamano', tamano);
    if (filtros.tipo) params = params.set('tipo', filtros.tipo);
    if (filtros.estado) params = params.set('estado', filtros.estado);
    return this.http.get<PaginaBandeja>(this.apiUrl, { params });
  }

  detalle(id: number): Observable<SolicitudDetalleTi> {
    return this.http.get<SolicitudDetalleTi>(`${this.apiUrl}/${id}`);
  }

  // Ingreso/Modificación: Pendiente → EnProceso. VPN fase 1: habilita la ficha y sigue Pendiente.
  tomar(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/tomar`, {});
  }

  // Ingreso/Modificación/Bloqueo: EnProceso → Completada.
  completar(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/completar`, {});
  }

  rechazar(id: number, justificacion: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/rechazar`, { justificacion });
  }

  // VPN fase 3
  confirmarEnvio(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/vpn/${id}/confirmar-envio`, {});
  }

  rechazarFicha(id: number, justificacion: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/vpn/${id}/rechazar-ficha`, { justificacion });
  }
}
