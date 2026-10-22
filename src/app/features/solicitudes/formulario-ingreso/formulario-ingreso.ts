import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { CatalogoService, Catalogo } from '../../../core/catalogo';
import { TrabajadorService } from '../../../core/trabajador';
import { SolicitudService } from '../../../core/solicitud';
import { BuscadorCatalogo } from '../../../shared/buscador-catalogo/buscador-catalogo';
import { SelectorMultiple } from '../../../shared/selector-multiple/selector-multiple';
import { formatearNombre } from '../../../core/formato-nombre';

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

// Fecha de hoy en hora local como 'aaaa-mm-dd' (toISOString usaría UTC y puede correr el día)
function hoyLocal(): string {
  const h = new Date();
  return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, '0')}-${String(h.getDate()).padStart(2, '0')}`;
}

function fechaNoPasada(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  return control.value < hoyLocal() ? { fechaPasada: true } : null;
}

@Component({
  selector: 'app-formulario-ingreso',
  imports: [CommonModule, ReactiveFormsModule, BuscadorCatalogo, SelectorMultiple],
  templateUrl: './formulario-ingreso.html',
  styleUrl: './formulario-ingreso.scss'
})
export class FormularioIngreso implements OnInit {
  form: FormGroup;

  direcciones: Catalogo[] = [];
  areas: Catalogo[] = [];
  lugares: Catalogo[] = [];
  sistemas: Catalogo[] = [];
  carpetas: Catalogo[] = [];
  cargos: Catalogo[] = [];
  sistemasSel: number[] = [];
  carpetasSel: number[] = [];

  rutMensaje = '';
  verificandoRut = false;
  correoSugerido = '';
  correoDisponible = true;
  buscandoCorreo = false;
  enviando = false;
  errores: string[] = [];
  erroresCorreo: string[] = []; // errores del backend sobre el correo, se muestran bajo ese campo
  esReincorporacion = false;

  fechaMaxNacimiento = '';
  fechaMinNacimiento = '';
  fechaMinIncorporacion = hoyLocal();
  private snackBar = inject(MatSnackBar);


  constructor(
    private fb: FormBuilder,
    private catalogoService: CatalogoService,
    private trabajadorService: TrabajadorService,
    private solicitudService: SolicitudService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    const hoy = new Date();
    const max18 = new Date(hoy.getFullYear() - 18, hoy.getMonth(), hoy.getDate());
    const min75 = new Date(hoy.getFullYear() - 75, hoy.getMonth(), hoy.getDate());
    this.fechaMaxNacimiento = max18.toISOString().split('T')[0];
    this.fechaMinNacimiento = min75.toISOString().split('T')[0];

    this.form = this.fb.group({
      rut: ['', Validators.required],
      sexo: ['', Validators.required],
      primerNombre: ['', Validators.required],
      segundoNombre: [''],
      primerApellido: ['', Validators.required],
      segundoApellido: [''],
      fechaNacimiento: ['', [Validators.required, edadValida]],
      fechaIncorporacion: ['', [Validators.required, fechaNoPasada]],
      esCuentaGenerica: [false],
      correo: ['', Validators.required],
      direccionCorporativaId: ['', Validators.required],
      areaId: ['', Validators.required],
      cargoId: ['', Validators.required],
      lugarTrabajoId: ['', Validators.required],
      direccionDomicilio: [''],
      jefeDirecto: [''],
      homologarAccesosDesde: [''],
      tieneTelefonoCorporativo: [false],
      solicitaTelefono: [false]
    });
  }

  ngOnInit(): void {
    this.catalogoService.getPorTipo('DireccionCorporativa').subscribe(r => { this.direcciones = r.datos; this.cdr.detectChanges(); });
    this.catalogoService.getPorTipo('LugarTrabajo').subscribe(r => { this.lugares = r.datos; this.cdr.detectChanges(); });
    this.catalogoService.getPorTipo('Sistema').subscribe(r => { this.sistemas = r.datos; this.cdr.detectChanges(); });
    this.catalogoService.getPorTipo('Carpeta').subscribe(r => { this.carpetas = r.datos; this.cdr.detectChanges(); });
    this.catalogoService.getPorTipo('Cargo').subscribe(r => { this.cargos = r.datos; this.cdr.detectChanges(); });

    // Las áreas se cargan al elegir la dirección corporativa
    this.form.get('direccionCorporativaId')!.valueChanges.subscribe(id => this.cargarAreas(id));
  }

  private cargarAreas(direccionId: unknown): void {
    this.form.get('areaId')!.setValue('');
    this.areas = [];
    const id = Number(direccionId);
    if (!id) { this.cdr.detectChanges(); return; }

    this.catalogoService.getPorTipo('Area', id).subscribe(r => {
      this.areas = r.datos;
      this.cdr.detectChanges();
    });
  }
  
  
  verificarRut(): void {
  const ctrl = this.form.get('rut')!;
  const consultado = ctrl.value;
  this.rutMensaje = '';
  if (!consultado) return;

  this.rutMensaje = '';
  this.verificandoRut = true;
  this.trabajadorService.verificarRut(consultado).subscribe({
    next: (r) => {
      this.verificandoRut = false;
      if (ctrl.value !== consultado) return; // el RUT cambió mientras se consultaba
      if (!r.valido) {
        this.rutMensaje = r.mensaje ?? 'RUT no válido.';
        ctrl.setErrors({ rutInvalido: true });
        ctrl.markAsTouched();
      } else {
        this.buscarCorreoSugerido();
      }
      this.cdr.detectChanges();
    },
    error: () => { this.verificandoRut = false; this.cdr.detectChanges(); }
  });
}

  onRutInput(event: Event): void {
    this.rutMensaje = '';
    const input = event.target as HTMLInputElement;
    let limpio = input.value.replace(/[^0-9kK]/g, '').toUpperCase();
    if (limpio.length > 9) limpio = limpio.slice(0, 9);
    let formateado = limpio;
    if (limpio.length > 1) {
      const cuerpo = limpio.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      formateado = `${cuerpo}-${limpio.slice(-1)}`;
    }
    this.form.get('rut')!.setValue(formateado, { emitEvent: false });
  }
  onNombreInput(event: Event, campo: string): void {
  const input = event.target as HTMLInputElement;
  const pos = input.selectionStart;
  const formateado = formatearNombre(input.value);
  if (formateado !== input.value) {
    this.form.get(campo)!.setValue(formateado, { emitEvent: false });
    input.setSelectionRange(pos, pos);
  }
}

  buscarCorreoSugerido(): void {
    const rut = this.form.get('rut')!.value;
    const nombre = this.form.get('primerNombre')!.value;
    const apellido = this.form.get('primerApellido')!.value;
    const segundoApellido = this.form.get('segundoApellido')!.value;
    if (!nombre || !apellido || !rut) return;

    this.buscandoCorreo = true;
    this.trabajadorService.sugerirCorreo(rut, nombre, apellido, segundoApellido).subscribe({
      next: (r) => {
        this.buscandoCorreo = false;
        this.correoDisponible = r.disponible;
        this.esReincorporacion = r.esReincorporacion;
        this.correoSugerido = r.disponible && r.correo ? r.correo : '';
        this.form.get('correo')!.setValue(this.correoSugerido);
        this.cdr.detectChanges();
      },
      error: () => { this.buscandoCorreo = false; this.cdr.detectChanges(); }
    });
  }
  // Misma regla que valida el backend: inicial del nombre + apellido paterno, sin tildes ni espacios.
  private get prefijoCorreo(): string {
    const sinTildes = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const nombre = sinTildes(this.form.get('primerNombre')!.value ?? '').trim();
    const apellido = sinTildes(this.form.get('primerApellido')!.value ?? '').replace(/\s/g, '');
    return nombre && apellido ? nombre[0] + apellido : '';
  }

  // Si el correo escrito a mano cumple el formato (que no esté en uso lo confirma el backend al enviar).
  get correoManualCumple(): boolean {
    const correo = (this.form.get('correo')!.value ?? '').trim().toLowerCase();
    const dominio = '@mafchile.com';
    if (!correo.endsWith(dominio)) return false;
    const local = correo.slice(0, -dominio.length);
    return /^[a-z]+$/.test(local) && local.length <= 30 && !!this.prefijoCorreo && local.startsWith(this.prefijoCorreo);
  }

    onCorreoInput(event: Event): void {
  this.erroresCorreo = []; // al corregir el correo se quita el error anterior
  const input = event.target as HTMLInputElement;
  const partes = input.value.split('@');
  const local = partes[0].toLowerCase().replace(/[^a-z]/g, '').slice(0, 30);
  const dominio = partes.length > 1 ? ('@' + partes[1]).slice(0, 13) : '';
  this.form.get('correo')!.setValue(local + dominio, { emitEvent: false });
}



  enviar(): void {
  this.erroresCorreo = [];
  if (this.form.invalid) {
    this.errores = this.rutMensaje ? [this.rutMensaje] : ['Completa todos los campos obligatorios antes de enviar.'];
    this.form.markAllAsTouched(); // pinta en rojo los campos que faltan
    this.irA('.ng-invalid.ng-touched:not(form)'); // el primer campo que falta

    return;

  }

  this.enviando = true;
  this.errores = [];
  const v = this.form.value;

    const dto = {
      ...v,
      primerNombre: formatearNombre(v.primerNombre),
      primerApellido: formatearNombre(v.primerApellido),
      segundoNombre: v.segundoNombre ? formatearNombre(v.segundoNombre) : null,
      segundoApellido: v.segundoApellido ? formatearNombre(v.segundoApellido) : null,
      direccionDomicilio: v.direccionDomicilio || null,
      jefeDirecto: v.jefeDirecto || null,
      homologarAccesosDesde: v.homologarAccesosDesde || null,
      catalogoIds: [...this.sistemasSel, ...this.carpetasSel]
    };

    this.solicitudService.crearIngreso(dto).subscribe({
      next: () => {
        this.enviando = false;
        this.snackBar.open('Solicitud de ingreso creada con éxito', 'Cerrar', { duration: 4000 });
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.enviando = false;
        const todos: string[] = err.error?.errores ?? ['Ocurrió un error al crear la solicitud.'];
        // Los errores del correo se muestran junto a su campo; el resto, en el cuadro de arriba.
        this.erroresCorreo = todos.filter(e => /correo/i.test(e));
        this.errores = todos.filter(e => !/correo/i.test(e));
        this.cdr.detectChanges();
        this.irA(this.erroresCorreo.length ? 'input[formcontrolname=correo]' : '.alerta');
      }
    });
  }

  // Lleva la vista al error para que se vea aunque el usuario esté al final del formulario.
  private irA(selector: string): void {
    setTimeout(() => {
      const el = document.querySelector<HTMLElement>(selector);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (el instanceof HTMLInputElement) el.focus({ preventScroll: true });
    });
  }
}