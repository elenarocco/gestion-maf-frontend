import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { debounceTime, distinctUntilChanged, Observable, Subscription, switchMap, of } from 'rxjs';
import { UsuarioService, UsuarioSistema, CandidatoAcceso, Rol, Permiso, CambioUsuario, FiltrosUsuarios } from '../../../core/usuarios';
import { CatalogoService, Catalogo } from '../../../core/catalogo';
import { BuscadorCatalogo } from '../../../shared/buscador-catalogo/buscador-catalogo';
import { mensajesError } from '../../../core/errores-api';

type Pestana = 'usuarios' | 'roles';

// Dar acceso, cambiar rol y área, desactivar y ver el historial de cada usuario; y la tabla (solo lectura)
// de qué permisos tiene cada rol. Las reglas (un acceso por persona, no bloquearse, área de Jefatura…)
// las aplica el backend: aquí solo se muestran sus mensajes.
@Component({
  selector: 'app-administrar-usuarios',
  imports: [ReactiveFormsModule, BuscadorCatalogo, DatePipe],
  templateUrl: './administrar-usuarios.html',
  styleUrl: './administrar-usuarios.scss'
})
export class AdministrarUsuarios implements OnInit, OnDestroy {
  private service = inject(UsuarioService);
  private catalogos = inject(CatalogoService);
  private cdr = inject(ChangeDetectorRef);

  pestana: Pestana = 'usuarios';

  // Lista
  buscar = new FormControl('', { nonNullable: true });
  filtroRol = '';
  filtroEstado = 'Activos';
  filas: UsuarioSistema[] = [];
  total = 0;
  pagina = 1;
  tamano = 20;
  totalPaginas = 1;
  desde = 0;
  hasta = 0;
  cargando = true;
  error = '';
  alerta: { texto: string; error: boolean } | null = null;

  roles: Rol[] = [];
  permisos: Permiso[] = [];
  areas: Catalogo[] = [];

  // Panel: dar acceso (editando = null) o cambiar rol/área (editando = usuario)
  panelAbierto = false;
  editando: UsuarioSistema | null = null;
  buscarCandidato = new FormControl('', { nonNullable: true });
  candidatos: CandidatoAcceso[] = [];
  candidato: CandidatoAcceso | null = null;
  rol = new FormControl<number | ''>('', { nonNullable: true });
  area = new FormControl<number | ''>('', { nonNullable: true });
  guardando = false;
  erroresForm: string[] = [];

  // Historial desplegado de un usuario
  historialDe: number | null = null;
  historial: CambioUsuario[] = [];

  private peticion = 0;
  private subs = new Subscription();

  get esJefatura(): boolean {
    return this.roles.find(r => r.id === Number(this.rol.value))?.nombre === 'Jefatura';
  }

  ngOnInit(): void {
    this.service.roles().subscribe(r => { this.roles = r; this.cdr.detectChanges(); });
    this.service.permisos().subscribe(p => { this.permisos = p; this.cdr.detectChanges(); });
    this.catalogos.getPorTipo('Area').subscribe(r => { this.areas = r.datos; this.cdr.detectChanges(); });

    this.subs.add(this.buscar.valueChanges.pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => { this.pagina = 1; this.cargar(); }));
    this.subs.add(this.buscarCandidato.valueChanges.pipe(
      debounceTime(300), distinctUntilChanged(),
      switchMap(q => q.trim().length >= 2 ? this.service.candidatos(q.trim()) : of([]))
    ).subscribe(c => { this.candidatos = c; this.cdr.detectChanges(); }));

    this.cargar();
  }

  ngOnDestroy(): void { this.subs.unsubscribe(); }

  filtrarRol(v: string): void { this.filtroRol = v; this.pagina = 1; this.cargar(); }
  filtrarEstado(v: string): void { this.filtroEstado = v; this.pagina = 1; this.cargar(); }
  irA(p: number): void { this.pagina = p; this.cargar(); }

  // ---------- Panel ----------

  abrirDarAcceso(): void {
    this.cerrarPanel();
    this.panelAbierto = true;
  }

  abrirCambiar(u: UsuarioSistema): void {
    this.cerrarPanel();
    this.editando = u;
    this.rol.setValue(u.rolId);
    this.area.setValue(u.areaId ?? '');
    this.panelAbierto = true;
  }

  elegirCandidato(c: CandidatoAcceso): void {
    this.candidato = c;
    this.candidatos = [];
    // Se propone el área del trabajador; se puede cambiar (un jefe puede supervisar otra área).
    if (this.area.value === '') this.area.setValue(c.areaId);
  }

  quitarCandidato(): void {
    this.candidato = null;
    this.buscarCandidato.setValue('');
  }

  cancelar(): void { this.cerrarPanel(); }

  guardar(): void {
    this.erroresForm = [];
    if (!this.editando && !this.candidato) this.erroresForm.push('Elige al trabajador.');
    if (this.rol.value === '') this.erroresForm.push('Elige el rol.');
    if (this.erroresForm.length) return;

    const rolId = Number(this.rol.value);
    const areaId = this.area.value === '' ? null : Number(this.area.value);
    const llamada: Observable<unknown> = this.editando
      ? this.service.cambiar(this.editando.id, rolId, areaId)
      : this.service.darAcceso(this.candidato!.trabajadorId, rolId, areaId);

    this.guardando = true;
    llamada.subscribe({
      next: () => {
        const nombre = this.editando?.trabajadorNombre ?? this.candidato!.nombre;
        this.alerta = { texto: this.editando ? `Acceso de ${nombre} actualizado.` : `${nombre} ya tiene acceso.`, error: false };
        this.guardando = false;
        this.cerrarPanel();
        this.recargarTodo();
      },
      error: (err: HttpErrorResponse) => {
        this.guardando = false;
        this.erroresForm = mensajesError(err, 'No se pudo guardar.');
        this.cdr.detectChanges();
      }
    });
  }

  // ---------- Acciones de la tabla ----------

  alternarActivo(u: UsuarioSistema): void {
    if (u.activo && !confirm(`¿Quitar el acceso de ${u.trabajadorNombre}? Ya no podrá entrar a la plataforma; si tiene la sesión abierta, se le corta en su próxima acción. Su historial se conserva y se puede reactivar.`)) return;

    (u.activo ? this.service.desactivar(u.id) : this.service.reactivar(u.id)).subscribe({
      next: () => {
        this.alerta = { texto: u.activo ? `Se quitó el acceso de ${u.trabajadorNombre}.` : `Se reactivó el acceso de ${u.trabajadorNombre}.`, error: false };
        this.recargarTodo();
      },
      error: (err: HttpErrorResponse) => {
        this.alerta = { texto: mensajesError(err, 'No se pudo cambiar el acceso.')[0], error: true };
        this.cdr.detectChanges();
      }
    });
  }

  verHistorial(u: UsuarioSistema): void {
    if (this.historialDe === u.id) { this.historialDe = null; return; }
    this.historialDe = u.id;
    this.historial = [];
    this.service.historial(u.id).subscribe(h => { this.historial = h; this.cdr.detectChanges(); });
  }

  // ---------- Roles y permisos (solo lectura) ----------

  tiene(r: Rol, p: Permiso): boolean { return r.permisos.includes(p.codigo); }

  private recargarTodo(): void {
    this.cargar();
    this.service.roles().subscribe(r => { this.roles = r; this.cdr.detectChanges(); });
  }

  private cerrarPanel(): void {
    this.panelAbierto = false;
    this.editando = null;
    this.candidato = null;
    this.candidatos = [];
    this.buscarCandidato.setValue('', { emitEvent: false });
    this.rol.setValue('');
    this.area.setValue('');
    this.erroresForm = [];
  }

  private cargar(): void {
    const mia = ++this.peticion;
    this.cargando = true;
    this.error = '';

    const filtros: FiltrosUsuarios = {};
    const q = this.buscar.value.trim();
    if (q) filtros.q = q;
    if (this.filtroRol) filtros.rolId = Number(this.filtroRol);
    if (this.filtroEstado === 'Activos') filtros.activo = true;
    if (this.filtroEstado === 'Inactivos') filtros.activo = false;

    this.service.listar(filtros, this.pagina, this.tamano).subscribe({
      next: r => {
        if (mia !== this.peticion) return;
        this.filas = r.datos;
        this.total = r.total;
        this.totalPaginas = Math.max(1, Math.ceil(r.total / this.tamano));
        this.desde = r.total === 0 ? 0 : (this.pagina - 1) * this.tamano + 1;
        this.hasta = Math.min(this.pagina * this.tamano, r.total);
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        if (mia !== this.peticion) return;
        this.error = mensajesError(err, 'No se pudieron cargar los usuarios.')[0];
        this.filas = [];
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }
}
