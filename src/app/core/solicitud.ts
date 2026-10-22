import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SolicitudBloqueoCreate {
  trabajadorId: number;
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

@Injectable({ providedIn: 'root' })
export class SolicitudService {
  // Una sola API de solicitudes: la lista y el detalle están en BandejaTiService (api/solicitudes).
  private apiUrl = `${environment.apiUrl}/solicitudes`;
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
}
