import { Component, input } from '@angular/core';
import { FichaVpn } from '../../../../core/solicitud-vpn';
import { formatoFecha } from '../../../../core/solicitud-estado';
import { formatearRut } from '../../../../core/rut';

// Ficha VPN en solo lectura. La usan la Bandeja de TI (revisión) y la Jefatura (ficha ya enviada).
@Component({
  selector: 'app-ficha-vpn-lectura',
  templateUrl: './ficha-vpn-lectura.html',
  styleUrl: '../vpn.scss'
})
export class FichaVpnLectura {
  ficha = input.required<FichaVpn>();

  texto(valor: string | null | undefined): string {
    return valor?.trim() ? valor : '—';
  }

  siNo(valor: boolean | null | undefined): string {
    return valor == null ? '—' : valor ? 'Sí' : 'No';
  }

  fecha(valor: string | null | undefined): string {
    return formatoFecha(valor);
  }

  rut(valor: string | null | undefined): string {
    return valor ? formatearRut(valor) : '—';
  }
}
