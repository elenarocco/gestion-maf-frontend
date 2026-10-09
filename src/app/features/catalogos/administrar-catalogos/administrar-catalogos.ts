import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subscription } from 'rxjs';
import { CatalogoService, Catalogo } from '../../../core/catalogo';

interface TipoCatalogo {
  clave: string; etiqueta: string; singular: string; nuevo: string; placeholder: string;
}

@Component({
  selector: 'app-administrar-catalogos',
  imports: [ReactiveFormsModule],
  templateUrl: './administrar-catalogos.html',
  styleUrl: './administrar-catalogos.scss'
})
export class AdministrarCatalogos implements OnInit, OnDestroy {
  tipos: TipoCatalogo[] = [
    { clave: 'Sistema', etiqueta: 'Sistemas', singular: 'sistema', nuevo: 'Nuevo sistema', placeholder: 'Ej. OMNIA' },
    { clave: 'Carpeta', etiqueta: 'Carpetas de red', singular: 'carpeta', nuevo: 'Nueva carpeta', placeholder: '\\\\servidor\\carpeta' }
  ];
  tipoActivo = this.tipos[0];

  buscar = new FormControl('', { nonNullable: true });
  nombre = new FormControl('', { nonNullable: true });

  filas: Catalogo[] = [];
  total = 0;
  pagina = 1;
  tamano = 20;
  totalPaginas = 1;
  desde = 0;
  hasta = 0;
  cargando = true;
  error = '';

  panelAbierto = false;
  editando: Catalogo | null = null;
  guardando = false;
  erroresForm: string[] = [];
  alerta: { texto: string; error: boolean } | null = null;

  private peticion = 0;
  private subs = new Subscription();

  constructor(private catalogoService: CatalogoService, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.subs.add(this.buscar.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => {
      this.pagina = 1;
      this.cargar();
    }));
    this.cargar();
  }

  ngOnDestroy(): void { this.subs.unsubscribe(); }

  cambiarTipo(t: TipoCatalogo): void {
    this.tipoActivo = t;
    this.buscar.setValue('', { emitEvent: false });
    this.pagina = 1;
    this.alerta = null;
    this.cerrarPanel();
    this.cargar();
  }

  irA(p: number): void { this.pagina = p; this.cargar(); }

  abrirNuevo(): void {
    this.editando = null;
    this.nombre.setValue('');
    this.erroresForm = [];
    this.panelAbierto = true;
  }

  abrirEditar(c: Catalogo): void {
    this.editando = c;
    this.nombre.setValue(c.nombre);
    this.erroresForm = [];
    this.panelAbierto = true;
  }

  cancelar(): void { this.cerrarPanel(); }

  guardar(): void {
    this.guardando = true;
    this.erroresForm = [];
    const texto = this.nombre.value;
    const accion = this.editando
      ? this.catalogoService.editar(this.editando.id, texto)
      : this.catalogoService.crear(this.tipoActivo.clave, texto);

    accion.subscribe({
      next: () => {
        this.guardando = false;
        this.alerta = { texto: 'Guardado correctamente.', error: false };
        this.cerrarPanel();
        this.cargar();
      },
      error: (err) => {
        this.guardando = false;
        this.erroresForm = err.status === 403
          ? ['Tu rol no tiene permiso para administrar catálogos.']
          : (err.error?.errores ?? ['No se pudo guardar.']);
        this.cdr.detectChanges();
      }
    });
  }

  alternarActivo(c: Catalogo): void {
    if (c.activo && !confirm(`¿Desactivar "${c.nombre}"? Dejará de aparecer en los formularios. Lo que ya tienen asignado los trabajadores no cambia.`)) return;

    this.catalogoService.cambiarActivo(c.id, !c.activo).subscribe({
      next: () => {
        this.alerta = { texto: c.activo ? 'Elemento desactivado.' : 'Elemento reactivado.', error: false };
        this.cargar();
      },
      error: (err) => {
        this.alerta = {
          texto: err.status === 403 ? 'Tu rol no tiene permiso para administrar catálogos.' : 'No se pudo cambiar el estado.',
          error: true
        };
        this.cdr.detectChanges();
      }
    });
  }

  private cerrarPanel(): void {
    this.panelAbierto = false;
    this.editando = null;
    this.nombre.setValue('');
    this.erroresForm = [];
  }

  private cargar(): void {
    const mia = ++this.peticion;
    this.cargando = true;
    this.error = '';

    this.catalogoService.administrar(this.tipoActivo.clave, this.buscar.value.trim(), this.pagina, this.tamano).subscribe({
      next: (r) => {
        if (mia !== this.peticion) return;
        this.filas = r.datos;
        this.total = r.total;
        this.totalPaginas = Math.max(1, Math.ceil(r.total / this.tamano));
        this.desde = r.total === 0 ? 0 : (this.pagina - 1) * this.tamano + 1;
        this.hasta = Math.min(this.pagina * this.tamano, r.total);
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        if (mia !== this.peticion) return;
        this.error = 'No se pudo cargar el catálogo.';
        this.filas = [];
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }
}