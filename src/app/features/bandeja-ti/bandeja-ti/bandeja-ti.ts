import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { BandejaTiService, SolicitudBandeja } from '../../../core/bandeja-ti';
import { ESTADOS, TIPOS, etiquetaTipo, formatoFechaHora } from '../../../core/solicitud-estado';
import { mensajesError } from '../../../core/errores-api';
import { EstadoChip } from '../../../shared/estado-chip/estado-chip';
import { DescargarReporte } from '../../../shared/descargar-reporte/descargar-reporte';

const TAMANO_PAGINA = 20;

@Component({
  selector: 'app-bandeja-ti',
  imports: [EstadoChip, DescargarReporte],
  templateUrl: './bandeja-ti.html',
  styleUrl: './bandeja-ti.scss'
})
export class BandejaTi {
  private service = inject(BandejaTiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  readonly tipos = TIPOS;
  // "Por atender" = Pendiente y En proceso: ahí está todo lo que TI tiene que mover (los Bloqueos nacen En proceso).
  readonly estados = [{ valor: 'Abiertas', etiqueta: 'Por atender' }, ...ESTADOS];

  // Filtros en la URL para conservarlos al volver desde el detalle. "Por atender" por defecto; "" = todos.
  tipo = signal('');
  estado = signal('Abiertas');
  pagina = signal(1);

  filas = signal<SolicitudBandeja[]>([]);
  total = signal(0);
  cargando = signal(true);
  errores = signal<string[]>([]);

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(q => {
      this.tipo.set(q.get('tipo') ?? '');
      this.estado.set(q.get('estado') ?? 'Abiertas');
      this.pagina.set(Math.max(1, Number(q.get('pagina')) || 1));
      this.cargar();
    });
  }

  private cargar(): void {
    this.cargando.set(true);
    this.errores.set([]);
    this.service.listar({ tipo: this.tipo(), estado: this.estado() }, this.pagina(), TAMANO_PAGINA).subscribe({
      next: r => {
        this.filas.set(r.items);
        this.total.set(r.total);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.filas.set([]);
        this.total.set(0);
        this.cargando.set(false);
        this.errores.set(mensajesError(err, 'No se pudieron cargar las solicitudes.'));
      }
    });
  }

  private navegar(cambios: { tipo?: string, estado?: string, pagina?: number }): void {
    const tipo = cambios.tipo ?? this.tipo();
    const estado = cambios.estado ?? this.estado();
    const pagina = cambios.pagina ?? 1;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tipo: tipo || null, estado, pagina: pagina > 1 ? pagina : null }
    });
  }

  filtrarTipo(valor: string): void { this.navegar({ tipo: valor }); }
  filtrarEstado(valor: string): void { this.navegar({ estado: valor }); }

  totalPaginas(): number {
    return Math.max(1, Math.ceil(this.total() / TAMANO_PAGINA));
  }

  irPagina(p: number): void {
    if (p >= 1 && p <= this.totalPaginas()) this.navegar({ pagina: p });
  }

  abrir(s: SolicitudBandeja): void {
    this.router.navigate(['/bandeja-ti', s.id]);
  }

  // ---------- Formato ----------

  tipoTexto(tipo: string): string {
    return etiquetaTipo(tipo);
  }

  // En VPN no hay trabajador hasta que la jefatura completa la ficha.
  persona(s: SolicitudBandeja): string {
    return s.trabajadorNombre ?? (s.tipo.toLowerCase() === 'vpn' ? 'Proveedor por definir' : '—');
  }

  fecha(valor: string): string {
    return formatoFechaHora(valor);
  }
}
