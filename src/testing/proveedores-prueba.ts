import { EnvironmentProviders, Provider } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { MsalService } from '@azure/msal-angular';

// Lo mínimo para crear una pantalla en una prueba: HTTP simulado (ninguna llamada sale a la red),
// rutas vacías y MSAL simulado (SesionService lo inyecta, pero al crearse no lo usa).
// La sesión queda sin usuario, como antes de iniciar sesión.
export function proveedoresDePrueba(): (Provider | EnvironmentProviders)[] {
  return [
    provideHttpClient(),
    provideHttpClientTesting(),
    provideRouter([]),
    { provide: MsalService, useValue: {} }
  ];
}
