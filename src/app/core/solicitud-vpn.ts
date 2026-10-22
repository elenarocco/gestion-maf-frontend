import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// Pantallas de Jefatura para VPN (pedir acceso y completar la ficha). Lo de TI está en la Bandeja de TI.

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

export interface MiSolicitud {
  id: number;
  tipo: string;
  estado: string;
  fechaCreacion: string;
  fechaVencimientoSLA: string;
  vencida: boolean;
  motivoNombre: string | null;
  formularioHabilitado: boolean;
  motivoRechazo: string | null;
  fichaCompletada: boolean;
}

export interface PaginaMisSolicitudes {
  items: MiSolicitud[];
  total: number;
  pagina: number;
  tamano: number;
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
    return this.http.get<MotivoVpn[]>(`${environment.apiUrl}/catalogos`, { params: { tipo: 'MotivoVpn' } });
  }

  // El backend filtra por el usuario de la sesión.
  mias(estado = '', pagina = 1, tamano = 20): Observable<PaginaMisSolicitudes> {
    let params = new HttpParams().set('tipo', 'Vpn').set('pagina', pagina).set('tamano', tamano);
    if (estado) params = params.set('estado', estado);
    return this.http.get<PaginaMisSolicitudes>(`${this.apiUrl}/mias`, { params });
  }

  detalle(id: number): Observable<SolicitudVpnDetalle> {
    return this.http.get<SolicitudVpnDetalle>(`${this.apiUrl}/vpn/${id}`);
  }

  crear(motivoId: number): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(`${this.apiUrl}/vpn`, { motivoId });
  }

  completarFicha(id: number, ficha: FichaVpn): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/vpn/${id}/ficha`, ficha);
  }
}

// En "Mis solicitudes VPN": botón "Completar ficha" solo si TI la habilitó, aún no se envía y sigue Pendiente.
export function puedeCompletarFicha(s: MiSolicitud): boolean {
  return s.formularioHabilitado && !s.fichaCompletada && s.estado === 'Pendiente';
}

// En la ficha: editable solo si TI la habilitó y sigue Pendiente; si no, se muestra en solo lectura.
export function fichaEditable(s: SolicitudVpnDetalle): boolean {
  return s.formularioHabilitado && s.estado === 'Pendiente';
}
