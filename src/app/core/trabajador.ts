import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Trabajador {
  id: number;
  rut: string;
  primerNombre: string;
  primerApellido: string;
  correo: string;
  cargo: string;
  activo: boolean;
}

export interface RespuestaPaginada {
  total: number;
  pagina: number;
  tamanoPagina: number;
  datos: Trabajador[];
}

@Injectable({ providedIn: 'root' })
export class TrabajadorService {
  private apiUrl = 'http://localhost:5153/api/Trabajador';

  constructor(private http: HttpClient) { }

  getAll(pagina: number = 1, tamanoPagina: number = 20): Observable<RespuestaPaginada> {
    return this.http.get<RespuestaPaginada>(`${this.apiUrl}?pagina=${pagina}&tamanoPagina=${tamanoPagina}`);
  }

  sugerirCorreo(primerNombre: string, primerApellido: string) {
    return this.http.get<{ correo: string | null, disponible: boolean }>(
      `${this.apiUrl}/sugerir-correo?primerNombre=${encodeURIComponent(primerNombre)}&primerApellido=${encodeURIComponent(primerApellido)}`
    );
  }
}