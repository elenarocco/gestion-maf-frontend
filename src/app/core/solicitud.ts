import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SolicitudService {
  private apiUrl = 'http://localhost:5153/api/Solicitud';
  constructor(private http: HttpClient) { }

  crearIngreso(dto: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/ingreso`, dto);
  }
}