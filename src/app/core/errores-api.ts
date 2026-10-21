import { HttpErrorResponse } from '@angular/common/http';

// Formas de error del backend:
//   { error: "mensaje" }                    → 400 / 403 / 409
//   { errores: { campo: "mensaje" } }       → 400 de validación (contrato nuevo)
//   { errores: ["mensaje", ...] }           → 400 de validación (endpoints anteriores)
export interface ErrorApi {
  mensajes: string[];
  porCampo: Record<string, string>;
}

const POR_ESTADO: Record<number, string> = {
  0: 'No se pudo conectar con el servidor.',
  401: 'Tu sesión no es válida. Vuelve a ingresar.',
  403: 'No tienes permiso para realizar esta acción.',
  // 404 sin cuerpo = la ruta no existe en el backend; se usa el mensaje de la pantalla.
  // Cuando la solicitud no existe, el backend responde { error: "La solicitud no existe." }.
  409: 'La acción no es válida para el estado actual de la solicitud. Recarga para ver su estado.'
};

export function leerError(err: HttpErrorResponse, porDefecto: string): ErrorApi {
  const cuerpo = err.error as { errores?: string[] | Record<string, string>; error?: string } | string | null;
  const porCampo: Record<string, string> = {};
  const mensajes: string[] = [];

  if (cuerpo && typeof cuerpo === 'object') {
    if (Array.isArray(cuerpo.errores)) mensajes.push(...cuerpo.errores);
    else if (cuerpo.errores) {
      Object.assign(porCampo, cuerpo.errores);
      mensajes.push(...Object.values(cuerpo.errores));
    }
    if (cuerpo.error) mensajes.push(cuerpo.error);
  } else if (typeof cuerpo === 'string' && cuerpo.trim() && err.status !== 0) {
    mensajes.push(cuerpo);
  }

  if (!mensajes.length) mensajes.push(POR_ESTADO[err.status] ?? porDefecto);
  return { mensajes, porCampo };
}

export function mensajesError(err: HttpErrorResponse, porDefecto: string): string[] {
  return leerError(err, porDefecto).mensajes;
}
