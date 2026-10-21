import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { MSAL_INSTANCE, MsalBroadcastService, MsalService } from '@azure/msal-angular';
import { BrowserCacheLocation, IPublicClientApplication, PublicClientApplication } from '@azure/msal-browser';
import { routes } from './app.routes';
import { authInterceptor } from './core/auth-interceptor';
import { SesionService } from './core/sesion';
import { environment } from '../environments/environment';

function crearInstanciaMsal(): IPublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId: environment.entra.clientId,
      authority: `https://login.microsoftonline.com/${environment.entra.tenantId}`,
      redirectUri: environment.entra.redirectUri,
      postLogoutRedirectUri: environment.entra.redirectUri
    },
    cache: { cacheLocation: BrowserCacheLocation.SessionStorage }
  });
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: MSAL_INSTANCE, useFactory: crearInstanciaMsal },
    MsalService,
    MsalBroadcastService,
    // Antes de mostrar pantallas: completa el regreso desde Microsoft y recupera la sesión.
    provideAppInitializer(() => inject(SesionService).inicializar())
  ],
};
