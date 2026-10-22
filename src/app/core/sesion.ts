import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { MsalService } from '@azure/msal-angular';
import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { environment } from '../../environments/environment';
import { mensajesError } from './errores-api';

// Usuario de la sesión según el backend (GET /api/auth/yo): sale de Trabajadores + UsuariosSistema.
export interface UsuarioSesion {
  userId: number;
  correo: string;
  nombre: string;
  rol: string;
  areaId: number | null;
  areaNombre: string | null;
  alcance: 'area' | 'empresa';   // "area": solo ve su área (lo decide el backend)
  permisos: string[];
}

export interface UsuarioDesarrollo {
  usuarioId: number;
  nombre: string;
  correo: string;
  rol: string;
  area: string | null;
}

type Origen = 'entra' | 'desarrollo';

const CLAVE_TOKEN_DESARROLLO = 'maf-ti.token-desarrollo';

@Injectable({ providedIn: 'root' })
export class SesionService {
  private http = inject(HttpClient);
  private msal = inject(MsalService);

  private origen: Origen | null = null;

  usuario = signal<UsuarioSesion | null>(null);
  // Mensaje para la pantalla de login (ej. cuenta no registrada en el sistema).
  error = signal<string | null>(null);

  rol = computed(() => this.usuario()?.rol ?? '');

  tienePermiso(codigo: string): boolean {
    return this.usuario()?.permisos.includes(codigo) ?? false;
  }

  // Sin permisos pedidos = basta con tener sesión.
  tieneAlguno(codigos: readonly string[]): boolean {
    return codigos.length === 0 ? !!this.usuario() : codigos.some(c => this.tienePermiso(c));
  }

  soloSuArea = computed(() => this.usuario()?.alcance === 'area');

  // Al iniciar la app: completa el regreso desde Microsoft (redirect) y recupera la sesión si existe.
  async inicializar(): Promise<void> {
    try {
      await firstValueFrom(this.msal.initialize());
      const resultado = await firstValueFrom(this.msal.handleRedirectObservable());
      if (resultado?.account) this.msal.instance.setActiveAccount(resultado.account);
    } catch (err) {
      // Sin Microsoft disponible igual se muestra el login (y el de desarrollo, si aplica).
      // Se muestra el código de Microsoft (AADSTS...) para poder diagnosticar la configuración de la app.
      console.error('Inicio de sesión con Microsoft', err);
      const codigo = String((err as { errorMessage?: string })?.errorMessage ?? '').match(/AADSTS\d+/)?.[0]
        ?? (err as { errorCode?: string })?.errorCode;
      this.error.set(`No se pudo completar el inicio de sesión con Microsoft${codigo ? ` (${codigo})` : ''}. Inténtalo de nuevo.`);
    }

    if (environment.loginDesarrollo && this.leerTokenDesarrollo()) this.origen = 'desarrollo';
    else if (this.cuentaMicrosoft()) this.origen = 'entra';
    else return;

    await this.cargarUsuario();
  }

  // ---------- Microsoft Entra ID ----------

  iniciarConMicrosoft(): void {
    this.error.set(null);
    this.msal.loginRedirect({ scopes: [environment.entra.apiScope] }).subscribe();
  }

  private cuentaMicrosoft() {
    const instancia = this.msal.instance;
    const cuenta = instancia.getActiveAccount() ?? instancia.getAllAccounts()[0] ?? null;
    if (cuenta && !instancia.getActiveAccount()) instancia.setActiveAccount(cuenta);
    return cuenta;
  }

  // ---------- Login de desarrollo (solo con environment.loginDesarrollo) ----------

  usuariosDesarrollo(): Promise<UsuarioDesarrollo[]> {
    return firstValueFrom(this.http.get<UsuarioDesarrollo[]>(`${environment.apiUrl}/auth/dev/usuarios`));
  }

  async iniciarDesarrollo(usuarioId: number): Promise<boolean> {
    if (!environment.loginDesarrollo) return false;
    this.error.set(null);
    try {
      const r = await firstValueFrom(this.http.post<{ token: string }>(`${environment.apiUrl}/auth/dev/token`, { usuarioId }));
      sessionStorage.setItem(CLAVE_TOKEN_DESARROLLO, r.token);
      this.origen = 'desarrollo';
      return await this.cargarUsuario();
    } catch (err) {
      this.error.set(mensajesError(err as HttpErrorResponse, 'No se pudo iniciar la sesión de desarrollo.')[0]);
      return false;
    }
  }

  private leerTokenDesarrollo(): string | null {
    try { return sessionStorage.getItem(CLAVE_TOKEN_DESARROLLO); } catch { return null; }
  }

  // ---------- Común ----------

  // Token para la API según el origen de la sesión (lo usa el interceptor).
  async token(): Promise<string | null> {
    if (this.origen === 'desarrollo') return this.leerTokenDesarrollo();
    if (this.origen !== 'entra') return null;

    const account = this.cuentaMicrosoft();
    if (!account) return null;
    try {
      const r = await firstValueFrom(this.msal.acquireTokenSilent({ scopes: [environment.entra.apiScope], account }));
      return r.accessToken;
    } catch (err) {
      if (err instanceof InteractionRequiredAuthError) {
        this.msal.acquireTokenRedirect({ scopes: [environment.entra.apiScope], account }).subscribe();
      }
      return null;
    }
  }

  private async cargarUsuario(): Promise<boolean> {
    try {
      this.usuario.set(await firstValueFrom(this.http.get<UsuarioSesion>(`${environment.apiUrl}/auth/yo`)));
      return true;
    } catch (err) {
      // 403: la cuenta existe en Microsoft pero no en el sistema o está inactiva (mensaje del backend).
      this.error.set(mensajesError(err as HttpErrorResponse, 'No se pudo validar tu sesión.')[0]);
      this.limpiar();
      return false;
    }
  }

  // El backend rechazó el token (vencido o inválido): se vuelve al login.
  expirar(): void {
    if (!this.usuario()) return;
    this.error.set('Tu sesión expiró. Vuelve a iniciar sesión.');
    this.limpiar();
  }

  // Cuenta de Microsoft sin acceso al sistema: permite salir de ella y elegir otra.
  usarOtraCuentaMicrosoft(): void {
    this.limpiar();
    this.msal.logoutRedirect({ postLogoutRedirectUri: environment.entra.redirectUri }).subscribe();
  }

  hayCuentaMicrosoft(): boolean {
    try { return this.msal.instance.getAllAccounts().length > 0; } catch { return false; }
  }

  cerrarSesion(): void {
    const eraEntra = this.origen === 'entra';
    this.limpiar();
    if (eraEntra) this.msal.logoutRedirect({ postLogoutRedirectUri: environment.entra.redirectUri }).subscribe();
  }

  private limpiar(): void {
    this.usuario.set(null);
    this.origen = null;
    try { sessionStorage.removeItem(CLAVE_TOKEN_DESARROLLO); } catch { /* sin almacenamiento */ }
  }
}
