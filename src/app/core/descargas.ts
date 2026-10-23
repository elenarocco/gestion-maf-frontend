import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { mensajesError } from './errores-api';

export type FormatoReporte = 'excel' | 'pdf';
export type FiltrosReporte = Record<string, string | number | boolean | null | undefined>;

// Descarga un reporte que genera el backend (Excel o PDF). El backend decide qué datos van y deja
// registrada la descarga; aquí solo se pide el archivo y se guarda con el nombre que manda la API.
@Injectable({ providedIn: 'root' })
export class DescargaService {
  private http = inject(HttpClient);

  async descargar(ruta: string, formato: FormatoReporte, filtros: FiltrosReporte): Promise<void> {
    let params = new HttpParams().set('formato', formato);
    for (const [clave, valor] of Object.entries(filtros))
      if (valor !== null && valor !== undefined && valor !== '') params = params.set(clave, String(valor));

    try {
      const r = await firstValueFrom(this.http.get(`${environment.apiUrl}${ruta}`,
        { params, responseType: 'blob', observe: 'response' }));
      const nombre = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(r.headers.get('Content-Disposition') ?? '')?.[1];
      guardar(r.body!, nombre ? decodeURIComponent(nombre) : `reporte.${formato === 'excel' ? 'xlsx' : 'pdf'}`);
    } catch (e) {
      throw new Error(await mensaje(e));
    }
  }
}

function guardar(archivo: Blob, nombre: string): void {
  const url = URL.createObjectURL(archivo);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Con responseType 'blob' el error del backend también llega como archivo: se lee como JSON.
async function mensaje(e: unknown): Promise<string> {
  if (!(e instanceof HttpErrorResponse)) return 'No se pudo descargar el reporte.';
  let error: unknown = e.error;
  if (error instanceof Blob) {
    try { error = JSON.parse(await error.text()); } catch { error = null; }
  }
  const conCuerpo = new HttpErrorResponse({ error, status: e.status, statusText: e.statusText, url: e.url ?? undefined });
  return mensajesError(conCuerpo, 'No se pudo descargar el reporte.')[0];
}
