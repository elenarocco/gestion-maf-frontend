import { Component, ChangeDetectorRef, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of, forkJoin, map, catchError } from 'rxjs';
import { CatalogoService, Catalogo } from '../../../core/catalogo';
import { TrabajadorService, Trabajador, TrabajadorDetalle, TrabajadorAcceso } from '../../../core/trabajador';
import { SolicitudService, SolicitudModificacionCreate } from '../../../core/solicitud';
import { BuscadorCatalogo } from '../../../shared/buscador-catalogo/buscador-catalogo';
import { SelectorMultiple } from '../../../shared/selector-multiple/selector-multiple';
import { formatearNombre } from '../../../core/formato-nombre';

const JUSTIFICACION_PERMITIDA = /^[\p{L}\s,.]+$/u;
const CARACTERES_NO_PERMITIDOS = /[^\p{L}\s,.]/gu;

function edadValida(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const hoy = new Date();
  const nacimiento = new Date(control.value);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const aunNoCumple = hoy < new Date(hoy.getFullYear(), nacimiento.getMonth(), nacimiento.getDate());
  if (aunNoCumple) edad--;
  if (edad < 18 || edad > 75) return { edadInvalida: true };
  return null;
}

function noSoloEspacios(control: AbstractControl): ValidationErrors | null {
  const v = control.value as string | null;
  return v && !v.trim() ? { soloEspacios: true } : null;
}

// Campos editables del trabajador (todos menos el RUT).
type CampoEditable =
  'primerNombre' | 'segundoNombre' | 'primerApellido' | 'segundoApellido' | 'fechaNacimiento' | 'sexo' |
  'correo' | 'direccionCorporativaId' | 'areaId' | 'cargoId' | 'lugarTrabajoId' | 'fechaIncorporacion' |
  'direccionDomicilio' | 'jefeDirecto' | 'homologarAccesosDesde' | 'tieneTelefonoCorporativo' | 'solicitaTelefono';

const CAMPOS: CampoEditable[] = [
  'primerNombre', 'segundoNombre', 'primerApellido', 'segundoApellido', 'fechaNacimiento', 'sexo',
  'correo', 'direccionCorporativaId', 'areaId', 'cargoId', 'lugarTrabajoId', 'fechaIncorporacion',
  'direccionDomicilio', 'jefeDirecto', 'homologarAccesosDesde', 'tieneTelefonoCorporativo', 'solicitaTelefono'
];

@Component({
  selector: 'app-formulario-modificacion',
  imports: [ReactiveFormsModule, BuscadorCatalogo, SelectorMultiple],
  templateUrl: './formulario-modificacion.html',
  styleUrl: './formulario-modificacion.scss'
})
export class FormularioModificacion implements OnInit {
  private fb = inject(FormBuilder);
  private catalogoService = inject(CatalogoService);
  private trabajadorService = inject(TrabajadorService);
  private solicitudService = inject(SolicitudService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  // TEMPORAL: hasta tener login real, mismo valor fijo que usa formulario-ingreso.
  private creadoPorId = 1;

  readonly maxJustificacion = 200;

  // Catálogos
  direcciones: Catalogo[] = [];
  areas: Catalogo[] = [];
  lugares: Catalogo[] = [];
  cargos: Catalogo[] = [];
  private sistemas: Catalogo[] = [];
  private carpetas: Catalogo[] = [];

  // Buscador de trabajador
  textoBusqueda = signal('');
  resultados = signal<Trabajador[]>([]);
  buscando = signal(false);
  abierto = signal(false);
  resaltada = signal(0);
  private busqueda$ = new Subject<string>();

  // Trabajador seleccionado
  trabajador = signal<TrabajadorDetalle | null>(null);
  cargandoTrabajador = signal(false);
  private original: Record<CampoEditable, unknown> | null = null;

  // Accesos
  accesosActuales = signal<TrabajadorAcceso[]>([]);
  quitar = signal<number[]>([]);
  sistemasAgregar: number[] = [];
  carpetasAgregar: number[] = [];
  sistemasDisponibles: Catalogo[] = [];
  carpetasDisponibles: Catalogo[] = [];

  // Correo
  buscandoCorreo = signal(false);
  avisoCorreo = signal('');

  enviando = signal(false);
  errores = signal<string[]>([]);

  fechaMaxNacimiento = '';
  fechaMinNacimiento = '';

  form = this.fb.group({
    sexo: ['', Validators.required],
    primerNombre: ['', Validators.required],
    segundoNombre: [''],
    primerApellido: ['', Validators.required],
    segundoApellido: [''],
    fechaNacimiento: ['', [Validators.required, edadValida]],
    fechaIncorporacion: ['', Validators.required],
    correo: ['', Validators.required],
    direccionCorporativaId: ['' as string | number, Validators.required],
    areaId: ['' as string | number, Validators.required],
    cargoId: ['' as string | number, Validators.required],
    lugarTrabajoId: ['' as string | number, Validators.required],
    direccionDomicilio: [''],
    jefeDirecto: [''],
    homologarAccesosDesde: [''],
    tieneTelefonoCorporativo: [false],
    solicitaTelefono: [false],
    justificacion: ['', [
      Validators.required,
      Validators.maxLength(this.maxJustificacion),
      Validators.pattern(JUSTIFICACION_PERMITIDA),
      noSoloEspacios
    ]]
  });

  constructor() {
    const hoy = new Date();
    const max18 = new Date(hoy.getFullYear() - 18, hoy.getMonth(), hoy.getDate());
    const min75 = new Date(hoy.getFullYear() - 75, hoy.getMonth(), hoy.getDate());
    this.fechaMaxNacimiento = max18.toISOString().split('T')[0];
    this.fechaMinNacimiento = min75.toISOString().split('T')[0];

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
  }

  ngOnInit(): void {
    this.catalogoService.getPorTipo('DireccionCorporativa').subscribe(r => { this.direcciones = r.datos; this.cdr.detectChanges(); });
    this.catalogoService.getPorTipo('LugarTrabajo').subscribe(r => { this.lugares = r.datos; this.cdr.detectChanges(); });
    this.catalogoService.getPorTipo('Cargo').subscribe(r => { this.cargos = r.datos; this.cdr.detectChanges(); });
    this.catalogoService.getPorTipo('Sistema').subscribe(r => { this.sistemas = r.datos; this.actualizarDisponibles(); this.cdr.detectChanges(); });
    this.catalogoService.getPorTipo('Carpeta').subscribe(r => { this.carpetas = r.datos; this.actualizarDisponibles(); this.cdr.detectChanges(); });

    // Las áreas se recargan al cambiar la dirección corporativa (igual que en Ingreso)
    this.form.controls.direccionCorporativaId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(id => this.cargarAreas(id));
  }

  private cargarAreas(direccionId: unknown, areaIdAMantener: number | null = null): void {
    this.form.controls.areaId.setValue(areaIdAMantener ?? '');
    this.areas = [];
    const id = Number(direccionId);
    if (!id) { this.cdr.detectChanges(); return; }

    this.catalogoService.getPorTipo('Area', id).subscribe(r => {
      this.areas = r.datos;
      this.cdr.detectChanges();
    });
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
    this.errores.set([]);
    this.avisoCorreo.set('');
    this.cargandoTrabajador.set(true);

    forkJoin({
      detalle: this.trabajadorService.getById(t.id),
      accesos: this.trabajadorService.getAccesos(t.id)
    }).subscribe({
      next: ({ detalle, accesos }) => {
        this.cargandoTrabajador.set(false);
        this.precargar(detalle, accesos);
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.cargandoTrabajador.set(false);
        this.errores.set(this.mensajesError(err, 'No se pudieron cargar los datos del trabajador.'));
        this.cdr.detectChanges();
      }
    });
  }

  private precargar(t: TrabajadorDetalle, accesos: TrabajadorAcceso[]): void {
    const valores: Record<CampoEditable, unknown> = {
      primerNombre: t.primerNombre,
      segundoNombre: t.segundoNombre ?? '',
      primerApellido: t.primerApellido,
      segundoApellido: t.segundoApellido ?? '',
      fechaNacimiento: t.fechaNacimiento,
      sexo: t.sexo,
      correo: t.correo,
      direccionCorporativaId: t.direccionCorporativaId,
      areaId: t.areaId,
      cargoId: t.cargoId,
      lugarTrabajoId: t.lugarTrabajoId,
      fechaIncorporacion: t.fechaIncorporacion,
      direccionDomicilio: t.direccionDomicilio ?? '',
      jefeDirecto: t.jefeDirecto ?? '',
      homologarAccesosDesde: t.homologarAccesosDesde ?? '',
      tieneTelefonoCorporativo: t.tieneTelefonoCorporativo,
      solicitaTelefono: t.solicitaTelefono
    };
    this.original = valores;

    // emitEvent: false para que la dirección no limpie el área; las áreas se cargan aparte conservando la original
    this.form.patchValue({ ...valores, justificacion: '' } as Partial<typeof this.form.value>, { emitEvent: false });
    this.form.markAsPristine();
    this.form.markAsUntouched();
    this.cargarAreas(t.direccionCorporativaId, t.areaId);

    this.accesosActuales.set(accesos);
    this.quitar.set([]);
    this.sistemasAgregar = [];
    this.carpetasAgregar = [];
    this.actualizarDisponibles();

    this.trabajador.set(t);
  }

  // ---------- Cambios respecto del original (solo visual) ----------

  cambiado(campo: CampoEditable): boolean {
    if (!this.original) return false;
    const actual = this.form.controls[campo].value;
    return String(actual ?? '').trim() !== String(this.original[campo] ?? '').trim();
  }

  hayCambios(): boolean {
    return CAMPOS.some(c => this.cambiado(c))
      || this.quitar().length > 0 || this.sistemasAgregar.length > 0 || this.carpetasAgregar.length > 0;
  }

  // ---------- Formateo de campos (igual que Ingreso) ----------

  onNombreInput(event: Event, campo: 'primerNombre' | 'segundoNombre' | 'primerApellido' | 'segundoApellido'): void {
    const input = event.target as HTMLInputElement;
    const pos = input.selectionStart;
    const formateado = formatearNombre(input.value);
    if (formateado !== input.value) {
      this.form.controls[campo].setValue(formateado, { emitEvent: false });
      input.setSelectionRange(pos, pos);
    }
  }

  onCorreoInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const partes = input.value.split('@');
    const local = partes[0].toLowerCase().replace(/[^a-z]/g, '').slice(0, 30);
    const dominio = partes.length > 1 ? ('@' + partes[1]).slice(0, 13) : '';
    this.form.controls.correo.setValue(local + dominio, { emitEvent: false });
  }

  // Si cambia el nombre o el apellido, se pide al backend un correo sugerido (mismo servicio que Ingreso).
  revisarCorreo(): void {
    const t = this.trabajador();
    if (!t || !this.original) return;
    const cambioNombre = this.cambiado('primerNombre') || this.cambiado('primerApellido');
    if (!cambioNombre) {
      if (this.avisoCorreo()) {
        this.form.controls.correo.setValue(String(this.original.correo));
        this.avisoCorreo.set('');
      }
      return;
    }

    const v = this.form.getRawValue();
    if (!v.primerNombre || !v.primerApellido) return;
    this.buscandoCorreo.set(true);
    this.trabajadorService.sugerirCorreo('', v.primerNombre, v.primerApellido, v.segundoApellido ?? '').subscribe({
      next: (r) => {
        this.buscandoCorreo.set(false);
        if (r.disponible && r.correo) {
          this.form.controls.correo.setValue(r.correo);
          this.avisoCorreo.set(`Por el cambio de nombre se sugiere: ${r.correo}`);
        } else {
          this.avisoCorreo.set('No hay un correo disponible automáticamente; ingrésalo manualmente.');
        }
        this.cdr.detectChanges();
      },
      error: () => { this.buscandoCorreo.set(false); this.cdr.detectChanges(); }
    });
  }

  // ---------- Accesos ----------

  marcarQuitar(catalogoId: number): void {
    this.quitar.update(l => l.includes(catalogoId) ? l.filter(x => x !== catalogoId) : [...l, catalogoId]);
  }

  seQuita(catalogoId: number): boolean {
    return this.quitar().includes(catalogoId);
  }

  accesosDeTipo(tipo: string): TrabajadorAcceso[] {
    return this.accesosActuales().filter(a => a.tipo === tipo);
  }

  private actualizarDisponibles(): void {
    const actuales = new Set(this.accesosActuales().map(a => a.catalogoId));
    this.sistemasDisponibles = this.sistemas.filter(s => !actuales.has(s.id));
    this.carpetasDisponibles = this.carpetas.filter(c => !actuales.has(c.id));
  }

  // ---------- Justificación (igual que Bloqueo) ----------

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

  // ---------- Envío ----------

  puedeEnviar(): boolean {
    return !!this.trabajador() && this.form.valid && !this.enviando();
  }

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
    const dto: SolicitudModificacionCreate = {
      trabajadorId: t.id,
      creadoPorId: this.creadoPorId,
      primerNombre: formatearNombre(v.primerNombre ?? ''),
      segundoNombre: v.segundoNombre ? formatearNombre(v.segundoNombre) : null,
      primerApellido: formatearNombre(v.primerApellido ?? ''),
      segundoApellido: v.segundoApellido ? formatearNombre(v.segundoApellido) : null,
      fechaNacimiento: v.fechaNacimiento ?? '',
      sexo: v.sexo ?? '',
      correo: v.correo ?? '',
      direccionCorporativaId: Number(v.direccionCorporativaId),
      areaId: Number(v.areaId),
      cargoId: Number(v.cargoId),
      lugarTrabajoId: Number(v.lugarTrabajoId),
      fechaIncorporacion: v.fechaIncorporacion ?? '',
      direccionDomicilio: v.direccionDomicilio || null,
      jefeDirecto: v.jefeDirecto || null,
      homologarAccesosDesde: v.homologarAccesosDesde || null,
      tieneTelefonoCorporativo: !!v.tieneTelefonoCorporativo,
      solicitaTelefono: !!v.solicitaTelefono,
      justificacion: v.justificacion ?? '',
      catalogoIdsAgregar: [...this.sistemasAgregar, ...this.carpetasAgregar],
      catalogoIdsQuitar: this.quitar()
    };

    this.enviando.set(true);
    this.errores.set([]);

    this.solicitudService.crearModificacion(dto).subscribe({
      next: () => {
        this.enviando.set(false);
        this.snackBar.open('Solicitud de modificación creada', 'Cerrar', { duration: 4000 });
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
