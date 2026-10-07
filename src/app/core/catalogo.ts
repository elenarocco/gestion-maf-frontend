import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Catalogo {
  id: number;
  tipo: string;
  nombre: string;
  activo: boolean;
}

interface RespuestaPaginadaCatalogo {
  total: number; pagina: number; tamanoPagina: number; datos: Catalogo[];
}

@Injectable({ providedIn: 'root' })
export class CatalogoService {
  private apiUrl = 'http://localhost:5153/api/Catalogo';
  constructor(private http: HttpClient) { }

  getPorTipo(tipo: string): Observable<RespuestaPaginadaCatalogo> {
    return this.http.get<RespuestaPaginadaCatalogo>(`${this.apiUrl}?tipo=${tipo}&tamanoPagina=500`);
  }
}