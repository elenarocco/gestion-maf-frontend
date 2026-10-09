import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Catalogo {
  id: number;
  tipo: string;
  nombre: string;
  activo: boolean;
  padreId: number | null;
}

export interface RespuestaCatalogo {
  total: number;
  pagina: number;
  tamanoPagina: number;
  datos: Catalogo[];
}

@Injectable({ providedIn: 'root' })
export class CatalogoService {
  private apiUrl = 'http://localhost:5153/api/Catalogo';
  constructor(private http: HttpClient) { }

  // Para los formularios: solo elementos activos. Para las áreas, se puede filtrar por dirección (padreId)
  getPorTipo(tipo: string, padreId?: number): Observable<RespuestaCatalogo> {
    let params = new HttpParams().set('tipo', tipo).set('tamanoPagina', 500).set('soloActivos', true);
    if (padreId) params = params.set('padreId', padreId);
    return this.http.get<RespuestaCatalogo>(this.apiUrl, { params });
  }

  // Para la pantalla de administración: todos, con búsqueda y paginación
  administrar(tipo: string, q: string, pagina: number, tamanoPagina: number): Observable<RespuestaCatalogo> {
    let params = new HttpParams().set('tipo', tipo).set('pagina', pagina).set('tamanoPagina', tamanoPagina);
    if (q) params = params.set('q', q);
    return this.http.get<RespuestaCatalogo>(this.apiUrl, { params });
  }

  crear(tipo: string, nombre: string): Observable<Catalogo> {
    return this.http.post<Catalogo>(this.apiUrl, { tipo, nombre });
  }

  editar(id: number, nombre: string): Observable<Catalogo> {
    return this.http.put<Catalogo>(`${this.apiUrl}/${id}`, { nombre });
  }

  cambiarActivo(id: number, activo: boolean): Observable<Catalogo> {
    return this.http.patch<Catalogo>(`${this.apiUrl}/${id}/activo`, null, { params: { activo } });
  }
}