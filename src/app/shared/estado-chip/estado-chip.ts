import { Component, computed, input } from '@angular/core';
import { etiquetaEstado, normalizarEstado } from '../../core/solicitud-estado';

// Chip de estado de una solicitud. Mismos colores que el listado de solicitudes.
@Component({
  selector: 'app-estado-chip',
  template: `<span class="chip" [class]="clase()">{{ etiqueta() }}</span>`,
  styleUrl: './estado-chip.scss'
})
export class EstadoChip {
  estado = input.required<string>();

  clase = computed(() => {
    switch (normalizarEstado(this.estado())) {
      case 'Pendiente': return 'chip pendiente';
      case 'EnProceso': return 'chip proceso';
      case 'Completada': return 'chip completada';
      default: return 'chip rechazada';
    }
  });

  etiqueta = computed(() => etiquetaEstado(this.estado()));
}
