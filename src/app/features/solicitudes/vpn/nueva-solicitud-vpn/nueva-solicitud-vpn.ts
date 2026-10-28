import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { formatearRut, rutValido } from '../../../../core/rut';
import { SolicitudVpnService, MotivoVpn, FichaVpn as Ficha } from '../../../../core/solicitud-vpn';
import { leerError, mensajesError } from '../../../../core/errores-api';
import { AvisoPlazo } from '../../../../shared/aviso-plazo/aviso-plazo';

// Misma regla de texto que la justificación de Bloqueo y Modificación.
const MOTIVO_PERMITIDO = /^[\p{L}\s,.]+$/u;
const CARACTERES_NO_PERMITIDOS = /[^\p{L}\s,.]/gu;
const CORREO = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function noSoloEspacios(control: AbstractControl): ValidationErrors | null {
  const v = control.value as string | null;
  return v && !v.trim() ? { soloEspacios: true } : null;
}

function caducidadPosterior(grupo: AbstractControl): ValidationErrors | null {
  const inicio = grupo.get('fechaIncorporacion')?.value as string | null;
  const fin = grupo.get('fechaCaducidad')?.value as string | null;
  return inicio && fin && fin <= inicio ? { caducidadAnterior: true } : null;
}

// Admin TI crea la VPN en un solo paso: motivo + ficha del proveedor. El backend la deja aprobada al crearla;
// queda pendiente solo confirmar el envío al proveedor, que la completa y la pasa al registro de accesos VPN.
@Component({
  selector: 'app-nueva-solicitud-vpn',
  imports: [ReactiveFormsModule, AvisoPlazo],
  templateUrl: './nueva-solicitud-vpn.html',
  styleUrl: '../vpn.scss'
})
export class NuevaSolicitudVpn {
  private fb = inject(FormBuilder);
  private vpnService = inject(SolicitudVpnService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  readonly maxMotivo = 200;
  motivos = signal<MotivoVpn[]>([]);
  cargandoMotivos = signal(true);
  enviando = signal(false);
  errores = signal<string[]>([]);
  erroresServidor = signal<Record<string, string>>({});

  form = this.fb.group({
    motivoId: [null as number | null, Validators.required],
    fechaIncorporacion: ['', Validators.required],
    fechaCaducidad: ['', Validators.required],
    rut: ['', [Validators.required, rutValido]],
    cargo: ['', [Validators.required, Validators.maxLength(100), noSoloEspacios]],
    nombres: ['', [Validators.required, Validators.maxLength(100), noSoloEspacios]],
    apellidos: ['', [Validators.required, Validators.maxLength(100), noSoloEspacios]],
    departamento: ['', [Validators.required, Validators.maxLength(100), noSoloEspacios]],
    ubicacionFisica: ['', [Validators.required, Validators.maxLength(150), noSoloEspacios]],
    equipoCorporativo: [null as boolean | null, Validators.required],
    companiaExterna: [''],
    cuentaCorreo: ['', [Validators.required, Validators.maxLength(150), Validators.pattern(CORREO)]],
    motivo: ['', [Validators.required, Validators.maxLength(this.maxMotivo), Validators.pattern(MOTIVO_PERMITIDO), noSoloEspacios]]
  }, { validators: caducidadPosterior });

  constructor() {
    this.vpnService.motivos().subscribe({
      next: motivos => { this.motivos.set(motivos); this.cargandoMotivos.set(false); },
      error: (err: HttpErrorResponse) => {
        this.cargandoMotivos.set(false);
        this.errores.set(mensajesError(err, 'No se pudieron cargar los motivos de VPN.'));
      }
    });
    this.form.controls.equipoCorporativo.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(v => this.actualizarCompania(v));
    // Al editar un campo se limpia el error que había devuelto el backend para él.
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (Object.keys(this.erroresServidor()).length) this.erroresServidor.set({});
    });
  }

  // "Compañía externa" solo aplica (y es obligatoria) si el equipo NO pertenece a la compañía.
  private actualizarCompania(equipoCorporativo: boolean | null): void {
    const c = this.form.controls.companiaExterna;
    if (equipoCorporativo === false) {
      c.setValidators([Validators.required, Validators.maxLength(150), noSoloEspacios]);
    } else {
      c.clearValidators();
      c.setValue('', { emitEvent: false });
    }
    c.updateValueAndValidity({ emitEvent: false });
  }

  onRutInput(event: Event): void {
    this.form.controls.rut.setValue(formatearRut((event.target as HTMLInputElement).value));
  }

  onMotivoInput(event: Event): void {
    const input = event.target as HTMLTextAreaElement;
    const limpio = input.value.replace(CARACTERES_NO_PERMITIDOS, '').slice(0, this.maxMotivo);
    if (limpio !== input.value) {
      const pos = Math.max(0, (input.selectionStart ?? limpio.length) - (input.value.length - limpio.length));
      this.form.controls.motivo.setValue(limpio);
      input.setSelectionRange(pos, pos);
    }
  }

  largoMotivo(): number { return this.form.controls.motivo.value?.length ?? 0; }

  invalido(campo: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[campo];
    return c.touched && c.invalid;
  }

  errorServidor(campo: string): string | null { return this.erroresServidor()[campo] ?? null; }

  fechasInvalidas(): boolean {
    return this.form.hasError('caducidadAnterior') && this.form.controls.fechaCaducidad.touched;
  }

  puedeEnviar(): boolean { return this.form.valid && !this.enviando(); }

  cancelar(): void { this.router.navigate(['/solicitudes']); }

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const ficha: Ficha = {
      fechaIncorporacion: v.fechaIncorporacion!,
      fechaCaducidad: v.fechaCaducidad!,
      rut: v.rut!,
      cargo: v.cargo!.trim(),
      nombres: v.nombres!.trim(),
      apellidos: v.apellidos!.trim(),
      departamento: v.departamento!.trim(),
      ubicacionFisica: v.ubicacionFisica!.trim(),
      equipoCorporativo: v.equipoCorporativo!,
      companiaExterna: v.equipoCorporativo === false ? v.companiaExterna!.trim() : null,
      cuentaCorreo: v.cuentaCorreo!.trim(),
      motivo: v.motivo!.trim()
    };

    this.enviando.set(true);
    this.errores.set([]);
    this.erroresServidor.set({});

    this.vpnService.crear(Number(v.motivoId), ficha).subscribe({
      next: () => {
        this.enviando.set(false);
        this.snackBar.open('Solicitud de VPN creada y aprobada. Falta confirmar el envío al proveedor.', 'Cerrar', { duration: 5000 });
        this.router.navigate(['/solicitudes']);
      },
      error: (err: HttpErrorResponse) => {
        this.enviando.set(false);
        const e = leerError(err, 'Ocurrió un error al crear la solicitud.');
        // Las claves pueden venir en PascalCase ("FechaCaducidad"); se pasan a camelCase como los controles.
        const porCampo = Object.fromEntries(Object.entries(e.porCampo).map(([k, m]) => [k.charAt(0).toLowerCase() + k.slice(1), m]));
        const campos = Object.keys(this.form.controls);
        this.erroresServidor.set(porCampo);
        this.errores.set(Object.keys(porCampo).length
          ? ['Revisa los campos marcados.', ...Object.entries(porCampo).filter(([k]) => !campos.includes(k)).map(([, m]) => m)]
          : e.mensajes);
      }
    });
  }
}
