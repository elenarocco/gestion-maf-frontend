import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// Módulo Sostenibilidad: todo el cálculo lo hace el backend; aquí solo se pide y se muestra.

export interface ParametrosSostenibilidad {
  hojasIngreso: number;
  hojasModificacion: number;
  hojasBloqueo: number;
  hojasVpn: number;
  copiasImpresas: number;
  gramosCO2PorHoja: number;
  kbTransferidosPorSolicitud: number;
  gramosCO2PorMB: number;
}

export interface SostenibilidadTipo {
  tipo: string;              // Ingreso | Modificacion | Bloqueo | Vpn
  cantidad: number;
  hojasPorFormulario: number;
  hojasEvitadas: number;
  co2PapelEvitadoGramos: number;
}

export interface ResumenSostenibilidad {
  desde: string;             // "2026-11-01" (fecha de Chile, incluida)
  hasta: string;
  esEjemplo: boolean;
  alcance: string;
  totalSolicitudes: number;
  cantidadPorTipo: SostenibilidadTipo[];
  hojasEvitadas: number;
  co2PapelEvitadoGramos: number;
  co2SistemaGramos: number;
  ahorroNetoGramos: number;
  supuestos: {
    parametros: ParametrosSostenibilidad;
    fechaActualizacion: string;
    formulas: string[];
    fuentes: { parametro: string; descripcion: string }[];
  };
}

@Injectable({ providedIn: 'root' })
export class SostenibilidadService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/sostenibilidad`;

  // Sin fechas, el backend usa el mes en curso.
  resumen(desde: string | null, hasta: string | null, ejemplo: boolean): Observable<ResumenSostenibilidad> {
    let params = new HttpParams();
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);
    if (ejemplo) params = params.set('ejemplo', true);
    return this.http.get<ResumenSostenibilidad>(`${this.apiUrl}/resumen`, { params });
  }

  actualizarParametros(parametros: ParametrosSostenibilidad): Observable<ParametrosSostenibilidad> {
    return this.http.put<ParametrosSostenibilidad>(`${this.apiUrl}/parametros`, parametros);
  }
}
