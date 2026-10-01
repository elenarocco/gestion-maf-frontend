import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CatalogoService, Catalogo } from '../../../core/catalogo';
import { TrabajadorService } from '../../../core/trabajador';
import { SolicitudService } from '../../../core/solicitud';

@Component({
  selector: 'app-formulario-ingreso',
  imports: [CommonModule, ReactiveFormsModule],
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
  accesosSeleccionados = new Set<number>();

  correoSugerido = '';
  correoDisponible = true;
  buscandoCorreo = false;
  enviando = false;
  errores: string[] = [];

  // TEMPORAL: hasta tener login real, se usa tu propio UsuarioSistema. Confirma que tu Id sea este.
  private creadoPorId = 1;

  constructor(
    private fb: FormBuilder,
    private catalogoService: CatalogoService,
    private trabajadorService: TrabajadorService,
    private solicitudService: SolicitudService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      rut: [''], sexo: [''], primerNombre: [''], segundoNombre: [''],
      primerApellido: [''], segundoApellido: [''],
      fechaNacimiento: [''], fechaIncorporacion: [''], esCuentaGenerica: [false],
      correo: [''], direccionCorporativaId: [''], areaId: [''], cargo: [''], lugarTrabajoId: [''],
      direccionDomicilio: [''], jefeDirecto: [''], homologarAccesosDesde: [''],
      tieneTelefonoCorporativo: [false], solicitaTelefono: [false]
    });
  }

  ngOnInit(): void {
    this.catalogoService.getPorTipo('DireccionCorporativa').subscribe(r => { this.direcciones = r.datos; this.cdr.detectChanges(); });
    this.catalogoService.getPorTipo('Area').subscribe(r => { this.areas = r.datos; this.cdr.detectChanges(); });
    this.catalogoService.getPorTipo('LugarTrabajo').subscribe(r => { this.lugares = r.datos; this.cdr.detectChanges(); });
    this.catalogoService.getPorTipo('Sistema').subscribe(r => { this.sistemas = r.datos; this.cdr.detectChanges(); });
    this.catalogoService.getPorTipo('Carpeta').subscribe(r => { this.carpetas = r.datos; this.cdr.detectChanges(); });
  }

  onRutInput(event: Event): void {
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

  buscarCorreoSugerido(): void {
    const nombre = this.form.get('primerNombre')!.value;
    const apellido = this.form.get('primerApellido')!.value;
    if (!nombre || !apellido) return;

    this.buscandoCorreo = true;
    this.trabajadorService.sugerirCorreo(nombre, apellido).subscribe({
      next: (r) => {
        this.buscandoCorreo = false;
        this.correoDisponible = r.disponible;
        this.correoSugerido = r.disponible && r.correo ? r.correo : '';
        this.form.get('correo')!.setValue(this.correoSugerido);
        this.cdr.detectChanges();
      },
      error: () => { this.buscandoCorreo = false; this.cdr.detectChanges(); }
    });
  }

  toggleAcceso(id: number): void {
    this.accesosSeleccionados.has(id) ? this.accesosSeleccionados.delete(id) : this.accesosSeleccionados.add(id);
  }

  enviar(): void {
    this.enviando = true;
    this.errores = [];
    const v = this.form.value;

    const dto = {
      ...v,
      segundoNombre: v.segundoNombre || null,
      segundoApellido: v.segundoApellido || null,
      direccionDomicilio: v.direccionDomicilio || null,
      jefeDirecto: v.jefeDirecto || null,
      homologarAccesosDesde: v.homologarAccesosDesde || null,
      creadoPorId: this.creadoPorId,
      catalogoIds: Array.from(this.accesosSeleccionados)
    };

    this.solicitudService.crearIngreso(dto).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.enviando = false;
        this.errores = err.error?.errores ?? ['Ocurrió un error al crear la solicitud.'];
        this.cdr.detectChanges();
      }
    });
  }
}