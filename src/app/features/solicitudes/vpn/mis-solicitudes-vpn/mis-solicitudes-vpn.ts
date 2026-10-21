import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { SolicitudVpnService, MiSolicitud, puedeCompletarFicha } from '../../../../core/solicitud-vpn';
import { formatoFechaHora } from '../../../../core/solicitud-estado';
import { mensajesError } from '../../../../core/errores-api';
import { EstadoChip } from '../../../../shared/estado-chip/estado-chip';

// Solicitudes VPN de la jefatura: estado, justificación del rechazo y acceso a la ficha.
@Component({
  selector: 'app-mis-solicitudes-vpn',
  imports: [RouterLink, EstadoChip],
  templateUrl: './mis-solicitudes-vpn.html',
  styleUrl: '../vpn.scss'
})
export class MisSolicitudesVpn {
  private vpnService = inject(SolicitudVpnService);

  solicitudes = signal<MiSolicitud[]>([]);
  cargando = signal(true);
  errores = signal<string[]>([]);

  constructor() {
    this.vpnService.mias('', 1, 50).subscribe({
      next: r => { this.solicitudes.set(r.items); this.cargando.set(false); },
      error: (err: HttpErrorResponse) => {
        this.cargando.set(false);
        this.errores.set(mensajesError(err, 'No se pudieron cargar tus solicitudes de VPN.'));
      }
    });
  }

  puedeCompletar(s: MiSolicitud): boolean {
    return puedeCompletarFicha(s);
  }

  // Siguiente paso de cada solicitud, visto por la jefatura.
  etapa(s: MiSolicitud): string {
    if (s.estado === 'Pendiente') return s.formularioHabilitado ? 'Aprobada por TI: completa la ficha' : 'Esperando aprobación de TI';
    if (s.estado === 'EnProceso') return 'Ficha enviada a TI para revisión';
    if (s.estado === 'Completada') return 'Enviada al proveedor';
    return 'Rechazada';
  }

  fecha(valor: string): string {
    return formatoFechaHora(valor);
  }
}
