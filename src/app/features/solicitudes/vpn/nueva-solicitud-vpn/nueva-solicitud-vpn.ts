import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { SolicitudVpnService, MotivoVpn } from '../../../../core/solicitud-vpn';
import { mensajesError } from '../../../../core/errores-api';

@Component({
  selector: 'app-nueva-solicitud-vpn',
  imports: [ReactiveFormsModule],
  templateUrl: './nueva-solicitud-vpn.html',
  styleUrl: '../vpn.scss'
})
export class NuevaSolicitudVpn {
  private fb = inject(FormBuilder);
  private vpnService = inject(SolicitudVpnService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  motivos = signal<MotivoVpn[]>([]);
  cargandoMotivos = signal(true);
  enviando = signal(false);
  errores = signal<string[]>([]);

  form = this.fb.group({
    motivoId: [null as number | null, Validators.required]
  });

  constructor() {
    this.vpnService.motivos().subscribe({
      next: motivos => { this.motivos.set(motivos); this.cargandoMotivos.set(false); },
      error: (err: HttpErrorResponse) => {
        this.cargandoMotivos.set(false);
        this.errores.set(mensajesError(err, 'No se pudieron cargar los motivos de VPN.'));
      }
    });
  }

  puedeEnviar(): boolean {
    return this.form.valid && !this.enviando();
  }

  cancelar(): void {
    this.router.navigate(['/solicitudes/vpn']);
  }

  enviar(): void {
    const motivoId = this.form.controls.motivoId.value;
    if (this.form.invalid || motivoId == null) {
      this.form.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.errores.set([]);

    this.vpnService.crear(Number(motivoId)).subscribe({
      next: () => {
        this.enviando.set(false);
        this.snackBar.open('Solicitud de VPN enviada a TI', 'Cerrar', { duration: 4000 });
        this.router.navigate(['/solicitudes/vpn']);
      },
      error: (err: HttpErrorResponse) => {
        this.enviando.set(false);
        this.errores.set(mensajesError(err, 'Ocurrió un error al crear la solicitud.'));
      }
    });
  }
}
