import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UsuarioSistema {
  id: number;
  trabajadorId: number;
  trabajadorNombre: string;
  trabajadorCorreo: string;
  trabajadorRut: string;
  trabajadorActivo: boolean;
  rolId: number;
  rolNombre: string;
  areaId: number | null;
  areaNombre: string | null;
  activo: boolean;
  esUstedMismo: boolean;
}

export interface CandidatoAcceso {
  trabajadorId: number;
  nombre: string;
  rut: string;
  correo: string;
  areaId: number;
  areaNombre: string;
}

export interface Rol {
  id: number;
  nombre: string;
  descripcion: string | null;
  permisos: string[];
  usuariosActivos: number;
}

export interface Permiso {
  id: number;
  codigo: string;
  descripcion: string | null;
}

export interface CambioUsuario {
  fecha: string;
  accion: string;
  detalle: string;
  realizadoPorNombre: string;
}

export interface FiltrosUsuarios {
  q?: string;
  rolId?: number;
  activo?: boolean;
}

// Administración de accesos (solo Super Admin). Las reglas las aplica el backend; aquí solo se llama a la API.
@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  listar(filtros: FiltrosUsuarios, pagina: number, tamano: number): Observable<{ total: number; datos: UsuarioSistema[] }> {
    let params = new HttpParams().set('pagina', pagina).set('tamanoPagina', tamano);
    if (filtros.q) params = params.set('q', filtros.q);
    if (filtros.rolId) params = params.set('rolId', filtros.rolId);
    if (filtros.activo !== undefined) params = params.set('activo', filtros.activo);
    return this.http.get<{ total: number; datos: UsuarioSistema[] }>(`${this.api}/UsuarioSistema`, { params });
  }

  candidatos(q: string): Observable<CandidatoAcceso[]> {
    return this.http.get<CandidatoAcceso[]>(`${this.api}/UsuarioSistema/candidatos`, { params: { q } });
  }

  darAcceso(trabajadorId: number, rolId: number, areaId: number | null): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(`${this.api}/UsuarioSistema`, { trabajadorId, rolId, areaId });
  }

  cambiar(id: number, rolId: number, areaId: number | null): Observable<void> {
    return this.http.put<void>(`${this.api}/UsuarioSistema/${id}`, { rolId, areaId });
  }

  desactivar(id: number): Observable<void> {
    return this.http.put<void>(`${this.api}/UsuarioSistema/${id}/desactivar`, {});
  }

  reactivar(id: number): Observable<void> {
    return this.http.put<void>(`${this.api}/UsuarioSistema/${id}/reactivar`, {});
  }

  historial(id: number): Observable<CambioUsuario[]> {
    return this.http.get<CambioUsuario[]>(`${this.api}/UsuarioSistema/${id}/historial`);
  }

  roles(): Observable<Rol[]> {
    return this.http.get<Rol[]>(`${this.api}/Rol`);
  }

  permisos(): Observable<Permiso[]> {
    return this.http.get<Permiso[]>(`${this.api}/Permiso`);
  }
}
