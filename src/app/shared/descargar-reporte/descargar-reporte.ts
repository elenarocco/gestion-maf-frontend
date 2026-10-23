import { Component, ElementRef, HostListener, computed, inject, input, signal } from '@angular/core';
import { DescargaService, FiltrosReporte, FormatoReporte } from '../../core/descargas';
import { SesionService } from '../../core/sesion';
import { PERMISOS } from '../../core/permisos';

// Botón "Descargar" con Excel o PDF. Descarga lo mismo que muestra la lista: recibe la ruta del reporte
// y los filtros que están aplicados. Solo aparece si el rol tiene el permiso de exportar reportes.
@Component({
  selector: 'app-descargar-reporte',
  templateUrl: './descargar-reporte.html',
  styleUrl: './descargar-reporte.scss'
})
export class DescargarReporte {
  ruta = input.required<string>();
  filtros = input<FiltrosReporte>({});

  private descargas = inject(DescargaService);
  private sesion = inject(SesionService);
  private elemento = inject(ElementRef);

  visible = computed(() => this.sesion.tienePermiso(PERMISOS.exportarReportes));
  abierto = signal(false);
  generando = signal<FormatoReporte | null>(null);
  error = signal('');

  async descargar(formato: FormatoReporte): Promise<void> {
    this.abierto.set(false);
    this.error.set('');
    this.generando.set(formato);
    try {
      await this.descargas.descargar(this.ruta(), formato, this.filtros());
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.generando.set(null);
    }
  }

  // Cierra el menú al hacer clic fuera.
  @HostListener('document:click', ['$event.target'])
  clicFuera(destino: EventTarget | null): void {
    if (this.abierto() && !this.elemento.nativeElement.contains(destino)) this.abierto.set(false);
  }
}
