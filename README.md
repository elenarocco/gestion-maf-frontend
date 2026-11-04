# GestiónTI — Frontend

Frontend Angular 22 del sistema de solicitudes de usuario TI de MAF Chile. La API, la base de datos y la documentación funcional están en el repositorio del backend: [gestionti-maf](https://github.com/elenarocco/gestionti-maf) (ver `README.md` y la carpeta `docs/`).

## Levantar en desarrollo

Requiere Node.js 22.22.3 o superior (o 24) y la API corriendo en `http://localhost:5153`.

```bash
npm ci
npx ng serve        # http://localhost:4200
```

En desarrollo, el login muestra un selector **"Entrar como"** con un usuario de prueba por rol (los crea la API al arrancar en Development).

## Comandos

| Comando | Qué hace |
|---|---|
| `npx ng serve` | Servidor de desarrollo con recarga automática. |
| `npx ng build` | Build de producción en `dist/` (falla si se superan los límites de tamaño de `angular.json`). |
| `npx ng test --watch=false` | Tests (Vitest). Para crear una pantalla en un test, usa `proveedoresDePrueba()` de `src/testing/proveedores-prueba.ts`. |

Cada push y Pull Request ejecuta el build y los tests en GitHub Actions (`.github/workflows/ci.yml`).

## Convenciones

- Toda la lógica y las validaciones viven en el backend; el frontend muestra lo que decide la API.
- El menú y los botones se muestran según los **permisos** que entrega `GET /api/auth/yo` (`src/app/core/permisos.ts`), no según el nombre del rol.
- Componentes standalone con signals, estilos SCSS por pantalla y colores del sistema (`var(--maf-rojo)` y los grises existentes).
