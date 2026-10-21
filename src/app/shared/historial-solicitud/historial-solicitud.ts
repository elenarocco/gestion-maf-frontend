import { Component, input } from '@angular/core';
import { HistorialItem } from '../../core/solicitud-vpn';
import { formatoFechaHora } from '../../core/solicitud-estado';

@Component({
  selector: 'app-historial-solicitud',
  templateUrl: './historial-solicitud.html',
  styleUrl: './historial-solicitud.scss'
})
export class HistorialSolicitud {
  historial = input.required<HistorialItem[]>();

  fecha(valor: string): string {
    return formatoFechaHora(valor);
  }
}
