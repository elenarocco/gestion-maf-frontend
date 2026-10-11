import { Component, ChangeDetectorRef, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { map } from 'rxjs';
import { SolicitudService, SolicitudDetalle, AccionSolicitud, AccionDisponible } from '../../../core/solicitud';
import { RolSimuladoService } from '../../../core/rol-simulado';

@Component({
  selector: 'app-detalle-solicitud',
  imports: [RouterLink],
  templateUrl: './detalle-solicitud.html',
  styleUrl: './detalle-solicitud.scss'
})
export class DetalleSolicitud {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private solicitudService = inject(SolicitudService);
  private rolService = inject(RolSimuladoService);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);

  readonly maxMotivo = 200;
  // Signal: al navegar entre una solicitud y su corrección se reutiliza el componente.
  private idRuta = toSignal(this.route.paramMap.pipe(map(p => Number(p.get('id')))), { initialValue: 0 });
  private get id(): number { return this.idRuta(); }

  // Formulario de creación de cada tipo, para corregir una solicitud rechazada.
  private rutaFormulario: Record<string, string> = {
    'Ingreso': '/solicitudes/nueva/ingreso', 'Modificación': '/solicitudes/modificacion', 'Bloqueo': '/solicitudes/bloqueo'
  };

  s: SolicitudDetalle | null = null;
  error = '';
  errorAccion = '';
  enviando = false;
  rechazando = false;   // muestra el cuadro para escribir el motivo
  motivo = '';

  private clases: Record<string, string> = {
    'Pendiente': 'pendiente', 'En proceso': 'proceso', 'Completada': 'completada', 'Rechazada': 'rechazada'
  };

  private etiquetas: Record<AccionDisponible, string> = {
    aprobar: 'Aprobar', iniciar: 'Iniciar', rechazar: 'Rechazar', completar: 'Marcar como completada', corregir: 'Corregir'
  };

  private mensajes: Record<AccionSolicitud, string> = {
    aprobar: 'Solicitud aprobada', iniciar: 'Solicitud en proceso', rechazar: 'Solicitud rechazada', completar: 'Solicitud completada'
  };

  constructor() {
    // Se recarga al cambiar de solicitud o de rol (las acciones disponibles dependen del rol).
    effect(() => { this.rolService.rolActual(); if (this.idRuta()) this.cargar(); });
  }

  get claseEstado(): string { return this.clases[this.s?.estado ?? ''] ?? 'pendiente'; }
  get vencida(): boolean {
    return !!this.s && this.s.estado === 'Pendiente' && new Date(this.s.fechaVencimientoSLA) < new Date();
  }
  get agregar() { return this.s?.accesosSolicitados.filter(a => a.accion === 'Agregar') ?? []; }
  get quitar() { return this.s?.accesosSolicitados.filter(a => a.accion === 'Quitar') ?? []; }

  etiqueta(a: AccionDisponible): string { return this.etiquetas[a]; }

  fechaHora(iso: string): string {
    return new Date(iso).toLocaleString('es-CL', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace('.', '');
  }

  siNo(v: boolean | null): string { return v === null ? '—' : v ? 'Sí' : 'No'; }

  accion(a: AccionDisponible): void {
    if (a === 'corregir') { this.corregir(); return; }
    if (a === 'rechazar') { this.rechazando = true; this.errorAccion = ''; return; }
    this.ejecutar(a);
  }

  // La corrección es una solicitud nueva: se abre el formulario del mismo tipo con el trabajador precargado.
  private corregir(): void {
    if (!this.s) return;
    this.router.navigate([this.rutaFormulario[this.s.tipo]], {
      queryParams: { origen: this.s.id, trabajador: this.s.trabajadorId }
    });
  }

  confirmarRechazo(): void {
    if (!this.motivo.trim()) { this.errorAccion = 'Escribe el motivo del rechazo.'; return; }
    this.ejecutar('rechazar', this.motivo.trim());
  }

  cancelarRechazo(): void { this.rechazando = false; this.motivo = ''; this.errorAccion = ''; }

  private ejecutar(a: AccionSolicitud, motivo?: string): void {
    this.enviando = true;
    this.errorAccion = '';
    this.solicitudService.cambiarEstado(this.id, a, motivo).subscribe({
      next: () => {
        this.enviando = false;
        this.cancelarRechazo();
        this.snackBar.open(this.mensajes[a], 'Cerrar', { duration: 4000 });
        this.cargar();
      },
      error: (err: HttpErrorResponse) => {
        this.enviando = false;
        this.errorAccion = err.error?.errores?.join(' ') ?? err.error?.error ?? 'No se pudo completar la acción.';
        this.cdr.detectChanges();
      }
    });
  }

  private cargar(): void {
    this.solicitudService.getDetalle(this.id).subscribe({
      next: (d) => { this.s = d; this.error = ''; this.cdr.detectChanges(); },
      error: (err: HttpErrorResponse) => {
        this.s = null;
        this.error = err.status === 403 ? 'Tu rol no tiene permiso para ver esta solicitud.'
          : err.status === 404 ? 'No se encontró la solicitud.'
          : 'No se pudo cargar la solicitud.';
        this.cdr.detectChanges();
      }
    });
  }
}
