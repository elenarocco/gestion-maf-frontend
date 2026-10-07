import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subscription } from 'rxjs';
import { TrabajadorService, FiltrosTrabajador } from '../../../core/trabajador';
import { CatalogoService, Catalogo } from '../../../core/catalogo';
import { BuscadorCatalogo } from '../../../shared/buscador-catalogo/buscador-catalogo';

interface Fila {
  id: number; nombre: string; iniciales: string; correo: string;
  rut: string; area: string; cargo: string; activo: boolean;
}

@Component({
  selector: 'app-lista-trabajadores',
  imports: [ReactiveFormsModule, BuscadorCatalogo],
  templateUrl: './lista-trabajadores.html',
  styleUrl: './lista-trabajadores.scss',
})
export class ListaTrabajadores implements OnInit, OnDestroy {
  buscar = new FormControl('', { nonNullable: true });
  area = new FormControl<number | ''>('', { nonNullable: true });
  areas: Catalogo[] = [];
  estado = 'Todos';

  filas: Fila[] = [];
  total = 0;
  pagina = 1;
  tamano = 20;
  totalPaginas = 1;
  desde = 0;
  hasta = 0;
  cargando = true;
  error = '';

  private peticion = 0;
  private subs = new Subscription();

  constructor(
    private trabajadorService: TrabajadorService,
    private catalogoService: CatalogoService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.catalogoService.getPorTipo('Area').subscribe(r => { this.areas = r.datos; this.cdr.detectChanges(); });
    this.subs.add(this.buscar.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => this.reiniciar()));
    this.subs.add(this.area.valueChanges.pipe(distinctUntilChanged()).subscribe(() => this.reiniciar()));
    this.cargar();
  }

  ngOnDestroy(): void { this.subs.unsubscribe(); }

  cambiarEstado(valor: string): void { this.estado = valor; this.reiniciar(); }
  irA(p: number): void { this.pagina = p; this.cargar(); }
  abrir(id: number): void { this.router.navigate(['/trabajadores', id]); }

  private reiniciar(): void { this.pagina = 1; this.cargar(); }

  private cargar(): void {
    const mia = ++this.peticion;
    this.cargando = true;
    this.error = '';

    const filtros: FiltrosTrabajador = {};
    const q = this.buscar.value.trim();
    if (q) filtros.q = q;
    const areaId = Number(this.area.value);
    if (areaId) filtros.areaId = areaId;
    if (this.estado === 'Activos') filtros.activo = true;
    if (this.estado === 'Inactivos') filtros.activo = false;

    this.trabajadorService.getAll(filtros, this.pagina, this.tamano).subscribe({
      next: (r) => {
        if (mia !== this.peticion) return;
        this.total = r.total;
        this.totalPaginas = Math.max(1, Math.ceil(r.total / this.tamano));
        this.desde = r.total === 0 ? 0 : (this.pagina - 1) * this.tamano + 1;
        this.hasta = Math.min(this.pagina * this.tamano, r.total);
        this.filas = r.datos.map(t => ({
          id: t.id,
          nombre: `${t.primerNombre} ${t.primerApellido}`,
          iniciales: `${t.primerNombre[0] ?? ''}${t.primerApellido[0] ?? ''}`.toUpperCase(),
          correo: t.correo,
          rut: t.rut,
          area: t.areaNombre,
          cargo: t.cargo,
          activo: t.activo
        }));
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (mia !== this.peticion) return;
        this.error = err.status === 403
          ? 'Tu rol no tiene permiso para ver los trabajadores.'
          : 'No se pudieron cargar los trabajadores.';
        this.filas = [];
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }
}