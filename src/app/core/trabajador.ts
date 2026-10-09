import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Trabajador {
  id: number;
  rut: string;
  primerNombre: string;
  primerApellido: string;
  correo: string;
  cargo: string;
  areaNombre: string;
  activo: boolean;
}

export interface RespuestaPaginada {
  total: number;
  pagina: number;
  tamanoPagina: number;
  datos: Trabajador[];
}

export interface FiltrosTrabajador {
  q?: string;
  areaId?: number;
  activo?: boolean;
}

export interface FichaSolicitud {
  id: number;
  tipo: string;
  estado: string;
  creadoPor: string;
  fechaCreacion: string;
}

export interface TrabajadorFicha {
  id: number;
  rut: string;
  nombreCompleto: string;
  correo: string;
  cargo: string;
  area: string;
  direccionCorporativa: string;
  lugarTrabajo: string;
  fechaIncorporacion: string;
  fechaSalida: string | null;
  activo: boolean;
  sistemas: string[];
  carpetas: string[];
  solicitudes: FichaSolicitud[];
}

export interface TrabajadorDetalle {
  id: number;
  rut: string;
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
  esCuentaGenerica: boolean;
  fechaIncorporacion: string;
  direccionDomicilio: string | null;
  jefeDirecto: string | null;
  homologarAccesosDesde: string | null;
  tieneTelefonoCorporativo: boolean;
  solicitaTelefono: boolean;
  activo: boolean;
}

@Injectable({ providedIn: 'root' })
export class TrabajadorService {
  private apiUrl = 'http://localhost:5153/api/Trabajador';

  constructor(private http: HttpClient) { }

  getAll(filtros: FiltrosTrabajador = {}, pagina = 1, tamanoPagina = 20): Observable<RespuestaPaginada> {
    let params = new HttpParams().set('pagina', pagina).set('tamanoPagina', tamanoPagina);
    if (filtros.q) params = params.set('q', filtros.q);
    if (filtros.areaId) params = params.set('areaId', filtros.areaId);
    if (filtros.activo !== undefined) params = params.set('activo', filtros.activo);
    return this.http.get<RespuestaPaginada>(this.apiUrl, { params });
  }

  getById(id: number): Observable<TrabajadorDetalle> {
    return this.http.get<TrabajadorDetalle>(`${this.apiUrl}/${id}`);
  }

  getFicha(id: number): Observable<TrabajadorFicha> {
    return this.http.get<TrabajadorFicha>(`${this.apiUrl}/${id}/ficha`);
  }

  sugerirCorreo(rut: string, primerNombre: string, primerApellido: string, segundoApellido: string) {
    const params = `rut=${encodeURIComponent(rut)}&primerNombre=${encodeURIComponent(primerNombre)}&primerApellido=${encodeURIComponent(primerApellido)}&segundoApellido=${encodeURIComponent(segundoApellido || '')}`;
    return this.http.get<{ correo: string | null, disponible: boolean, esReincorporacion: boolean }>(`${this.apiUrl}/sugerir-correo?${params}`);
  }
  verificarRut(rut: string) {
  return this.http.get<{ valido: boolean, mensaje: string | null }>(
    `${this.apiUrl}/verificar-rut?rut=${encodeURIComponent(rut)}`
  );
}
}