import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { AccionTi, BandejaTiService, SolicitudDetalleTi } from '../../../core/bandeja-ti';
import { etiquetaTipo, formatoFecha, formatoFechaHora } from '../../../core/solicitud-estado';
import { mensajesError } from '../../../core/errores-api';
import { EstadoChip } from '../../../shared/estado-chip/estado-chip';
import { HistorialSolicitud } from '../../../shared/historial-solicitud/historial-solicitud';
import { DialogoRechazo, DatosDialogoRechazo } from '../../../shared/dialogo-rechazo/dialogo-rechazo';
import { FichaVpnLectura } from '../../solicitudes/vpn/ficha-vpn-lectura/ficha-vpn-lectura';

interface Boton {
  accion: AccionTi;
  texto: string;
  primario: boolean;
}

const FECHA_ISO = /^\d{4}-\d{2}-\d{2}(T|$)/;

// Formulario que corrige cada tipo de solicitud (valores de tipo de la API).
const RUTA_CORREGIR: Record<string, string> = {
  'Ingreso': '/solicitudes/nueva/ingreso',
  'Bloqueo': '/solicitudes/bloqueo',
  'Modificacion': '/solicitudes/modificacion'
};

// Los nombres de campo llegan sin tildes; se corrigen al mostrarlos.
const PALABRAS: Record<string, string> = {
  rut: 'RUT', telefono: 'teléfono', direccion: 'dirección', ubicacion: 'ubicación', area: 'área',
  justificacion: 'justificación', incorporacion: 'incorporación', caducidad: 'caducidad', fisica: 'física',
  compania: 'compañía', pc: 'PC', sla: 'SLA'
};

@Component({
  selector: 'app-detalle-solicitud',
  imports: [EstadoChip, HistorialSolicitud, FichaVpnLectura],
  templateUrl: './detalle-solicitud.html',
  styleUrl: '../../solicitudes/vpn/vpn.scss'
})
export class DetalleSolicitud {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private service = inject(BandejaTiService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  private id = Number(this.route.snapshot.paramMap.get('id'));

  solicitud = signal<SolicitudDetalleTi | null>(null);
  cargando = signal(true);
  procesando = signal<AccionTi | null>(null);
  errores = signal<string[]>([]);

  esVpn = computed(() => this.solicitud()?.tipo.toLowerCase() === 'vpn');

  // El backend decide qué acciones aplican (tipo, estado y rol); aquí solo se pintan.
  botones = computed<Boton[]>(() => {
    const s = this.solicitud();
    if (!s) return [];
    const textos: Record<AccionTi, string> = {
      tomar: this.esVpn() ? 'Aprobar acceso' : 'Aprobar',
      completar: 'Marcar completada',
      confirmarEnvio: 'Confirmar y enviar al proveedor',
      rechazar: 'Rechazar',
      rechazarFicha: 'Rechazar ficha',
      corregir: 'Corregir solicitud',
      completarFicha: 'Completar ficha'
    };
    const orden: AccionTi[] = ['rechazar', 'rechazarFicha', 'tomar', 'completar', 'confirmarEnvio', 'corregir', 'completarFicha'];
    return orden
      .filter(a => s.accionesPermitidas.includes(a))
      .map(a => ({ accion: a, texto: textos[a], primario: a !== 'rechazar' && a !== 'rechazarFicha' }));
  });

  // Modificación: "Campo: antes → después", una línea por dato (lo calcula el backend).
  cambios = computed(() => {
    const c = this.solicitud()?.detalle?.['cambios'];
    return Array.isArray(c) ? c.map(String) : [];
  });

  // Campos propios del tipo (Ingreso, Modificación, Bloqueo), tal como los envía el backend.
  camposDetalle = computed(() => {
    const d = this.solicitud()?.detalle;
    if (!d) return [];
    return Object.entries(d)
      .filter(([k]) => k !== 'cambios')
      .filter(([, v]) => v !== null && v !== undefined && !(typeof v === 'object' && !Array.isArray(v)))
      .map(([k, v]) => ({ etiqueta: this.etiqueta(k), valor: this.valor(v), largo: typeof v === 'string' && v.length > 60 || Array.isArray(v) }));
  });

  constructor() {
    this.cargar();
  }

  private cargar(): void {
    this.cargando.set(true);
    this.service.detalle(this.id).subscribe({
      next: s => { this.solicitud.set(s); this.cargando.set(false); },
      error: (err: HttpErrorResponse) => {
        this.cargando.set(false);
        this.errores.set(mensajesError(err, 'No se pudo cargar la solicitud.'));
      }
    });
  }

  ejecutar(b: Boton): void {
    // Acciones del creador: llevan al formulario que corresponde.
    if (b.accion === 'corregir') {
      const s = this.solicitud()!;
      this.router.navigate([RUTA_CORREGIR[s.tipo]], { queryParams: { origen: s.id, trabajador: s.trabajadorId } });
      return;
    }
    if (b.accion === 'completarFicha') {
      this.router.navigate(['/solicitudes/vpn', this.id, 'ficha']);
      return;
    }
    if (b.accion === 'rechazar' || b.accion === 'rechazarFicha') {
      this.pedirRechazo(b.accion);
      return;
    }
    const llamadas: Record<'tomar' | 'completar' | 'confirmarEnvio', () => Observable<void>> = {
      tomar: () => this.service.tomar(this.id),
      completar: () => this.service.completar(this.id),
      confirmarEnvio: () => this.service.confirmarEnvio(this.id)
    };
    const exitos = {
      tomar: this.esVpn() ? 'Acceso aprobado: la ficha quedó habilitada para la jefatura.' : 'Solicitud aprobada y en proceso.',
      completar: 'Solicitud marcada como completada.',
      confirmarEnvio: 'Ficha confirmada y marcada como enviada al proveedor.'
    };
    const accion = b.accion as 'tomar' | 'completar' | 'confirmarEnvio';
    if (!(accion in llamadas)) return;
    this.correr(accion, llamadas[accion](), exitos[accion]);
  }

  private pedirRechazo(accion: 'rechazar' | 'rechazarFicha'): void {
    const datos: DatosDialogoRechazo = accion === 'rechazarFicha'
      ? { titulo: 'Rechazar ficha VPN', descripcion: 'La solicitud quedará Rechazada y la jefatura verá esta justificación.' }
      : { titulo: `Rechazar solicitud #${this.id}`, descripcion: 'La solicitud quedará Rechazada y quien la creó verá esta justificación.' };

    this.dialog.open<DialogoRechazo, DatosDialogoRechazo, string>(DialogoRechazo, { data: datos, autoFocus: 'textarea' })
      .afterClosed()
      .subscribe(justificacion => {
        if (!justificacion) return;
        const llamada = accion === 'rechazarFicha'
          ? this.service.rechazarFicha(this.id, justificacion)
          : this.service.rechazar(this.id, justificacion);
        this.correr(accion, llamada, accion === 'rechazarFicha' ? 'Ficha VPN rechazada.' : 'Solicitud rechazada.');
      });
  }

  private correr(accion: AccionTi, llamada: Observable<void>, exito: string): void {
    this.procesando.set(accion);
    this.errores.set([]);
    llamada.subscribe({
      next: () => {
        this.procesando.set(null);
        this.snackBar.open(exito, 'Cerrar', { duration: 4000 });
        this.cargar();
      },
      error: (err: HttpErrorResponse) => {
        this.procesando.set(null);
        this.errores.set(mensajesError(err, 'No se pudo completar la acción.'));
        if (err.status === 409) this.cargar();   // el estado cambió: se muestran las acciones vigentes
      }
    });
  }

  // Se abre desde la Bandeja de TI (/bandeja-ti/:id) o desde la lista de solicitudes (/solicitudes/:id).
  desdeBandeja = this.router.url.startsWith('/bandeja-ti');

  volver(): void {
    // Vuelve a la lista con los filtros que tenía; si se entró directo, a la lista por defecto.
    if (window.history.length > 1) this.location.back();
    else this.router.navigate([this.desdeBandeja ? '/bandeja-ti' : '/solicitudes']);
  }

  // ---------- Formato ----------

  tipoTexto(tipo: string): string {
    return etiquetaTipo(tipo);
  }

  persona(s: SolicitudDetalleTi): string {
    return s.trabajadorNombre ?? (this.esVpn() ? 'Proveedor por definir' : '—');
  }

  fecha(valor: string | null): string {
    return formatoFechaHora(valor);
  }

  // "tieneTelefonoCorporativo" → "Tiene teléfono corporativo"
  private etiqueta(clave: string): string {
    const t = clave.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/Id$/, '').toLowerCase().trim()
      .split(' ').map(p => PALABRAS[p] ?? p).join(' ');
    return t.charAt(0).toUpperCase() + t.slice(1);
  }

  private valor(v: unknown): string {
    if (typeof v === 'boolean') return v ? 'Sí' : 'No';
    if (Array.isArray(v)) {
      if (!v.length) return '—';
      return v.map(x => typeof x === 'object' && x ? ((x as { nombre?: string }).nombre ?? JSON.stringify(x)) : String(x)).join(', ');
    }
    if (typeof v === 'string') {
      if (!v.trim()) return '—';
      if (FECHA_ISO.test(v)) return v.length > 10 ? formatoFechaHora(v) : formatoFecha(v);
      return v;
    }
    return String(v);
  }
}
