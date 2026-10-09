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
}

export interface SolicitudBloqueoResultado {
  solicitudId: number;
  fechaVencimientoSLA: string;
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
  getAll(filtros: { tipo?: string, estado?: string, urgente?: boolean } = {}, pagina = 1): Observable<any> {
  const params = new URLSearchParams({ pagina: String(pagina), tamanoPagina: '20' });
  if (filtros.tipo) params.set('tipo', filtros.tipo);
  if (filtros.estado) params.set('estado', filtros.estado);
  if (filtros.urgente) params.set('urgente', 'true');
  return this.http.get(`${this.apiUrl}?${params.toString()}`);
}
}