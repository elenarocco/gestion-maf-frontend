import { Component, ChangeDetectorRef, effect, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SolicitudService, SolicitudDetalle, AccionSolicitud } from '../../../core/solicitud';
import { RolSimuladoService } from '../../../core/rol-simulado';

@Component({
  selector: 'app-detalle-solicitud',
  imports: [RouterLink],
  templateUrl: './detalle-solicitud.html',
  styleUrl: './detalle-solicitud.scss'
})
export class DetalleSolicitud {
  private route = inject(ActivatedRoute);
  private solicitudService = inject(SolicitudService);
  private rolService = inject(RolSimuladoService);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);

  readonly maxMotivo = 200;
  private id = Number(this.route.snapshot.paramMap.get('id'));

  s: SolicitudDetalle | null = null;
  error = '';
  errorAccion = '';
  enviando = false;
  rechazando = false;   // muestra el cuadro para escribir el motivo
  motivo = '';

  private clases: Record<string, string> = {
    'Pendiente': 'pendiente', 'En proceso': 'proceso', 'Completada': 'completada', 'Rechazada': 'rechazada'
  };

  private etiquetas: Record<AccionSolicitud, string> = {
    aprobar: 'Aprobar', iniciar: 'Iniciar', rechazar: 'Rechazar', completar: 'Marcar como completada'
  };

  private mensajes: Record<AccionSolicitud, string> = {
    aprobar: 'Solicitud aprobada', iniciar: 'Solicitud en proceso', rechazar: 'Solicitud rechazada', completar: 'Solicitud completada'
  };

  constructor() {
    // Las acciones disponibles dependen del rol: se recarga al cambiarlo.
    effect(() => { this.rolService.rolActual(); this.cargar(); });
  }

  get claseEstado(): string { return this.clases[this.s?.estado ?? ''] ?? 'pendiente'; }
  get vencida(): boolean {
    return !!this.s && this.s.estado === 'Pendiente' && new Date(this.s.fechaVencimientoSLA) < new Date();
  }
  get agregar() { return this.s?.accesosSolicitados.filter(a => a.accion === 'Agregar') ?? []; }
  get quitar() { return this.s?.accesosSolicitados.filter(a => a.accion === 'Quitar') ?? []; }

  etiqueta(a: AccionSolicitud): string { return this.etiquetas[a]; }

  fechaHora(iso: string): string {
    return new Date(iso).toLocaleString('es-CL', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace('.', '');
  }

  siNo(v: boolean | null): string { return v === null ? '—' : v ? 'Sí' : 'No'; }

  accion(a: AccionSolicitud): void {
    if (a === 'rechazar') { this.rechazando = true; this.errorAccion = ''; return; }
    this.ejecutar(a);
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
