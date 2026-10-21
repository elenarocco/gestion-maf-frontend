export const environment = {
  apiUrl: 'http://localhost:5153/api',
  //   apiUrl: 'https://api.gestionti-maf.cl/api'

  // Microsoft Entra ID (una sola app registration: SPA + API con el scope access_as_user).
  entra: {
    tenantId: '04e057b1-ca2d-4bca-abce-785313a23d18',
    clientId: 'e985ba87-07ee-4f0c-9712-e7aa9bf2ad78',
    redirectUri: 'http://localhost:4200',
    apiScope: 'api://e985ba87-07ee-4f0c-9712-e7aa9bf2ad78/access_as_user'
  },

  // Solo en `ng serve` (configuración development). El backend además solo expone /api/auth/dev en Development.
  loginDesarrollo: true
};
