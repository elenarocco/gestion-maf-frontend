import { Component, ChangeDetectorRef, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of, forkJoin, map, catchError } from 'rxjs';
import { TrabajadorService, Trabajador, TrabajadorDetalle, TrabajadorFicha } from '../../../core/trabajador';
import { SolicitudService, SolicitudBloqueoCreate } from '../../../core/solicitud';

const JUSTIFICACION_PERMITIDA = /^[\p{L}\s,.]+$/u;
const CARACTERES_NO_PERMITIDOS = /[^\p{L}\s,.]/gu;

function noSoloEspacios(control: AbstractControl): ValidationErrors | null {
  const v = control.value as string | null;
  return v && !v.trim() ? { soloEspacios: true } : null;
}

// Fecha local en el formato que espera <input type="datetime-local"> (YYYY-MM-DDTHH:mm).
function aDatetimeLocal(fecha: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${fecha.getFullYear()}-${p(fecha.getMonth() + 1)}-${p(fecha.getDate())}T${p(fecha.getHours())}:${p(fecha.getMinutes())}`;
}

@Component({
  selector: 'app-formulario-bloqueo',
  imports: [ReactiveFormsModule],
  templateUrl: './formulario-bloqueo.html',
  styleUrl: './formulario-bloqueo.scss'
})
export class FormularioBloqueo {
  private fb = inject(FormBuilder);
  private trabajadorService = inject(TrabajadorService);
  private solicitudService = inject(SolicitudService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  // TEMPORAL: hasta tener login real, mismo valor fijo que usa formulario-ingreso.
  private creadoPorId = 1;

  readonly maxJustificacion = 200;

  textoBusqueda = signal('');
  resultados = signal<Trabajador[]>([]);
  buscando = signal(false);
  abierto = signal(false);
  resaltada = signal(0);

  trabajador = signal<TrabajadorDetalle | null>(null);
  ficha = signal<TrabajadorFicha | null>(null);
  cargandoTrabajador = signal(false);

  enviando = signal(false);
  errores = signal<string[]>([]);

  private busqueda$ = new Subject<string>();

  form = this.fb.group({
    esTemporal: [false],
    desde: [''],
    hasta: [''],
    tienePc: [null as boolean | null],
    casillaOpera: [null as boolean | null],
    justificacion: ['', [
      Validators.required,
      Validators.maxLength(this.maxJustificacion),
      Validators.pattern(JUSTIFICACION_PERMITIDA),
      noSoloEspacios
    ]]
  });

  constructor() {
    this.busqueda$.pipe(
      map(t => t.trim()),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(q => {
        if (!q) return of([] as Trabajador[]);
        this.buscando.set(true);
        return this.trabajadorService.getAll({ q, activo: true }, 1, 10).pipe(
          map(r => r.datos),
          catchError(() => of([] as Trabajador[]))
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(datos => {
      this.buscando.set(false);
      this.resultados.set(datos);
      this.resaltada.set(0);
      this.cdr.detectChanges();
    });

    this.form.controls.esTemporal.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(esTemporal => this.actualizarFechas(!!esTemporal));
  }

  // ---------- Buscador de trabajador ----------

  onBusquedaInput(event: Event): void {
    const texto = (event.target as HTMLInputElement).value;
    this.textoBusqueda.set(texto);
    this.abierto.set(true);
    this.busqueda$.next(texto);
  }

  onBusquedaKey(e: KeyboardEvent): void {
    const lista = this.resultados();
    if (e.key === 'ArrowDown') { this.resaltada.set(Math.min(this.resaltada() + 1, lista.length - 1)); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { this.resaltada.set(Math.max(this.resaltada() - 1, 0)); e.preventDefault(); }
    else if (e.key === 'Enter' && this.abierto() && lista[this.resaltada()]) { this.seleccionar(lista[this.resaltada()]); e.preventDefault(); }
    else if (e.key === 'Escape') { this.abierto.set(false); }
  }

  seleccionar(t: Trabajador): void {
    this.textoBusqueda.set(`${t.primerNombre} ${t.primerApellido} — ${t.rut}`);
    this.abierto.set(false);
    this.trabajador.set(null);
    this.ficha.set(null);
    this.errores.set([]);
    this.cargandoTrabajador.set(true);

    forkJoin({
      detalle: this.trabajadorService.getById(t.id),
      ficha: this.trabajadorService.getFicha(t.id)
    }).subscribe({
      next: ({ detalle, ficha }) => {
        this.cargandoTrabajador.set(false);
        this.trabajador.set(detalle);
        this.ficha.set(ficha);
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.cargandoTrabajador.set(false);
        this.errores.set(this.mensajesError(err, 'No se pudieron cargar los datos del trabajador.'));
        this.cdr.detectChanges();
      }
    });
  }

  // ---------- Datos del bloqueo ----------

  private actualizarFechas(esTemporal: boolean): void {
    const { desde, hasta } = this.form.controls;
    if (esTemporal) {
      desde.setValidators(Validators.required);
      hasta.setValidators(Validators.required);
    } else {
      desde.clearValidators();
      hasta.clearValidators();
      desde.setValue('');
      hasta.setValue('');
    }
    desde.updateValueAndValidity();
    hasta.updateValueAndValidity();
  }

  minDesde(): string {
    return aDatetimeLocal(new Date());
  }

  minHasta(): string {
    return this.form.controls.desde.value || this.minDesde();
  }

  onJustificacionInput(event: Event): void {
    const input = event.target as HTMLTextAreaElement;
    const limpio = input.value.replace(CARACTERES_NO_PERMITIDOS, '').slice(0, this.maxJustificacion);
    if (limpio !== input.value) {
      const pos = Math.max(0, (input.selectionStart ?? limpio.length) - (input.value.length - limpio.length));
      this.form.controls.justificacion.setValue(limpio);
      input.setSelectionRange(pos, pos);
    }
  }

  largoJustificacion(): number {
    return this.form.controls.justificacion.value?.length ?? 0;
  }

  puedeEnviar(): boolean {
    return !!this.trabajador() && this.form.valid && !this.enviando();
  }

  // ---------- Formato de solo lectura ----------

  texto(valor: string | null | undefined): string {
    return valor?.trim() ? valor : '—';
  }

  siNo(valor: boolean): string {
    return valor ? 'Sí' : 'No';
  }

  // Las fechas DateOnly llegan como "YYYY-MM-DD"; se muestran como DD-MM-YYYY sin pasar por Date (evita desfase de zona).
  fecha(valor: string | null | undefined): string {
    if (!valor) return '—';
    const [a, m, d] = valor.slice(0, 10).split('-');
    return `${d}-${m}-${a}`;
  }

  // ---------- Envío ----------

  cancelar(): void {
    this.router.navigate(['/solicitudes']);
  }

  enviar(): void {
    const t = this.trabajador();
    if (!t || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const esTemporal = !!v.esTemporal;
    const dto: SolicitudBloqueoCreate = {
      trabajadorId: t.id,
      creadoPorId: this.creadoPorId,
      esTemporal,
      desde: esTemporal && v.desde ? new Date(v.desde).toISOString() : null,
      hasta: esTemporal && v.hasta ? new Date(v.hasta).toISOString() : null,
      justificacion: v.justificacion ?? '',
      tienePc: v.tienePc ?? null,
      casillaOpera: v.casillaOpera ?? null
    };

    this.enviando.set(true);
    this.errores.set([]);

    this.solicitudService.crearBloqueo(dto).subscribe({
      next: () => {
        this.enviando.set(false);
        this.snackBar.open('Solicitud de bloqueo creada', 'Cerrar', { duration: 4000 });
        this.router.navigate(['/solicitudes']);
      },
      error: (err: HttpErrorResponse) => {
        this.enviando.set(false);
        this.errores.set(this.mensajesError(err, 'Ocurrió un error al crear la solicitud.'));
        this.cdr.detectChanges();
      }
    });
  }

  private mensajesError(err: HttpErrorResponse, porDefecto: string): string[] {
    const cuerpo = err.error as { errores?: string[]; error?: string } | null;
    if (cuerpo?.errores?.length) return cuerpo.errores;
    if (cuerpo?.error) return [cuerpo.error];
    return [porDefecto];
  }
}
