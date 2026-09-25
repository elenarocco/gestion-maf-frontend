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

@Injectable({
  providedIn: 'root'
})
export class TrabajadorService {
  private apiUrl = 'http://localhost:5153/api/Trabajador';

  constructor(private http: HttpClient) { }

  getAll(): Observable<RespuestaPaginada> {
    return this.http.get<RespuestaPaginada>(`${this.apiUrl}?pagina=1&tamanoPagina=1000`);
  }
}