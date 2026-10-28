import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

// Pantallas de VPN: Admin TI la pide con la ficha completa (queda aprobada). Lo demás está en la Bandeja de TI.

export interface MotivoVpn {
  id: number;
  nombre: string;
}

export interface FichaVpn {
  fechaIncorporacion: string;   // YYYY-MM-DD
  fechaCaducidad: string;       // YYYY-MM-DD
  rut: string;
  cargo: string;
  nombres: string;
  apellidos: string;
  departamento: string;
  ubicacionFisica: string;
  equipoCorporativo: boolean;
  companiaExterna: string | null;
  cuentaCorreo: string;
  motivo: string;
}

export interface HistorialItem {
  accion: string;
  realizadoPorNombre: string;
  fecha: string;
  comentario: string | null;
}

export interface SolicitudVpnDetalle {
  id: number;
  estado: string;
  motivoId: number;
  motivoNombre: string;
  formularioHabilitado: boolean;
  motivoRechazo: string | null;
  fechaCreacion: string;
  fechaEnvioProveedor: string | null;
  ficha: FichaVpn | null;
  historial: HistorialItem[];
}

@Injectable({ providedIn: 'root' })
export class SolicitudVpnService {
  private apiUrl = `${environment.apiUrl}/solicitudes`;
  constructor(private http: HttpClient) { }

  motivos(): Observable<MotivoVpn[]> {
    const params = new HttpParams().set('tipo', 'MotivoVpn').set('soloActivos', true).set('tamanoPagina', 100);
    return this.http.get<{ datos: MotivoVpn[] }>(`${environment.apiUrl}/catalogos`, { params }).pipe(map(r => r.datos));
  }

  detalle(id: number): Observable<SolicitudVpnDetalle> {
    return this.http.get<SolicitudVpnDetalle>(`${this.apiUrl}/vpn/${id}`);
  }

  // Admin TI la crea con la ficha completa: queda aprobada al crearla.
  crear(motivoId: number, ficha: FichaVpn): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(`${this.apiUrl}/vpn`, { motivoId, ficha });
  }

  completarFicha(id: number, ficha: FichaVpn): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/vpn/${id}/ficha`, ficha);
  }
}

// En la ficha: editable solo si TI la habilitó y sigue Pendiente; si no, se muestra en solo lectura.
export function fichaEditable(s: SolicitudVpnDetalle): boolean {
  return s.formularioHabilitado && s.estado === 'Pendiente';
}
