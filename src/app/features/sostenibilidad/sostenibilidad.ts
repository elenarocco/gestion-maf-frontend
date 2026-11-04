import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ParametrosSostenibilidad, ResumenSostenibilidad, SostenibilidadService } from '../../core/sostenibilidad';
import { SesionService } from '../../core/sesion';
import { PERMISOS } from '../../core/permisos';
import { etiquetaTipo } from '../../core/solicitud-estado';
import { leerError, mensajesError } from '../../core/errores-api';

type CampoParametro = keyof ParametrosSostenibilidad;

const gramos = new Intl.NumberFormat('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const entero = new Intl.NumberFormat('es-CL');
const decimal = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 3 });

// Sostenibilidad (computación verde): el backend calcula todo; aquí solo se muestra.
@Component({
  selector: 'app-sostenibilidad',
  imports: [ReactiveFormsModule],
  templateUrl: './sostenibilidad.html',
  styleUrl: './sostenibilidad.scss'
})
export class Sostenibilidad {
  private service = inject(SostenibilidadService);
  private sesion = inject(SesionService);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  // Editar supuestos y ver datos de ejemplo: solo Gestión General (el backend lo vuelve a validar).
  readonly puedeEditar = computed(() => this.sesion.tienePermiso(PERMISOS.editarSostenibilidad));

  desde = signal<string | null>(null);   // null = el backend usa el mes en curso
  hasta = signal<string | null>(null);
  ejemplo = signal(false);

  resumen = signal<ResumenSostenibilidad | null>(null);
  cargando = signal(true);
  errores = signal<string[]>([]);

  guardando = signal(false);
  erroresParametros = signal<string[]>([]);
  erroresCampo = signal<Partial<Record<CampoParametro, string>>>({});

  readonly camposParametros: { campo: CampoParametro; etiqueta: string; unidad: string; paso: string }[] = [
    { campo: 'hojasIngreso', etiqueta: 'Hojas por formulario de Ingreso', unidad: 'hojas', paso: '1' },
    { campo: 'hojasModificacion', etiqueta: 'Hojas por formulario de Modificación', unidad: 'hojas', paso: '1' },
    { campo: 'hojasBloqueo', etiqueta: 'Hojas por formulario de Bloqueo', unidad: 'hojas', paso: '1' },
    { campo: 'hojasVpn', etiqueta: 'Hojas por formulario de VPN', unidad: 'hojas', paso: '1' },
    { campo: 'copiasImpresas', etiqueta: 'Copias impresas', unidad: 'copias', paso: '1' },
    { campo: 'gramosCO2PorHoja', etiqueta: 'CO2e por hoja', unidad: 'g CO2e', paso: '0.1' },
    { campo: 'kbTransferidosPorSolicitud', etiqueta: 'Datos transferidos por solicitud', unidad: 'KB', paso: '1' },
    { campo: 'gramosCO2PorMB', etiqueta: 'CO2e por MB transferido', unidad: 'g CO2e', paso: '0.01' }
  ];

  form = this.fb.nonNullable.group({
    hojasIngreso: [0, Validators.required],
    hojasModificacion: [0, Validators.required],
    hojasBloqueo: [0, Validators.required],
    hojasVpn: [0, Validators.required],
    copiasImpresas: [1, Validators.required],
    gramosCO2PorHoja: [0, Validators.required],
    kbTransferidosPorSolicitud: [0, Validators.required],
    gramosCO2PorMB: [0, Validators.required]
  });

  // Altura de cada barra respecto del tipo con más solicitudes.
  barras = computed(() => {
    const tipos = this.resumen()?.cantidadPorTipo ?? [];
    const max = Math.max(1, ...tipos.map(t => t.cantidad));
    return tipos.map(t => ({ ...t, etiqueta: etiquetaTipo(t.tipo), alto: Math.round(t.cantidad / max * 100) }));
  });

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.errores.set([]);
    this.service.resumen(this.desde(), this.hasta(), this.ejemplo()).subscribe({
      next: r => {
        this.resumen.set(r);
        this.desde.set(r.desde);
        this.hasta.set(r.hasta);
        if (!this.form.dirty) this.form.reset(r.supuestos.parametros);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.resumen.set(null);
        this.cargando.set(false);
        this.errores.set(mensajesError(err, 'No se pudo calcular el resumen de sostenibilidad.'));
      }
    });
  }

  cambiarFecha(campo: 'desde' | 'hasta', valor: string): void {
    (campo === 'desde' ? this.desde : this.hasta).set(valor || null);
  }

  mesEnCurso(): void {
    this.desde.set(null);
    this.hasta.set(null);
    this.cargar();
  }

  cambiarEjemplo(activo: boolean): void {
    this.ejemplo.set(activo);
    this.cargar();
  }

  guardarParametros(): void {
    if (this.form.invalid) {
      this.erroresParametros.set(['Completa todos los supuestos antes de guardar.']);
      return;
    }
    this.guardando.set(true);
    this.erroresParametros.set([]);
    this.erroresCampo.set({});
    this.service.actualizarParametros(this.form.getRawValue()).subscribe({
      next: p => {
        this.guardando.set(false);
        this.form.reset(p);
        this.snackBar.open('Supuestos actualizados', 'Cerrar', { duration: 4000 });
        this.cargar();
      },
      error: (err: HttpErrorResponse) => {
        this.guardando.set(false);
        const e = leerError(err, 'No se pudieron guardar los supuestos.');
        const porCampo = Object.fromEntries(Object.entries(e.porCampo)
          .map(([k, m]) => [k.charAt(0).toLowerCase() + k.slice(1), m])) as Partial<Record<CampoParametro, string>>;
        this.erroresCampo.set(porCampo);
        this.erroresParametros.set(Object.keys(porCampo).length ? ['Revisa los campos marcados.'] : e.mensajes);
      }
    });
  }

  descartarCambios(): void {
    const r = this.resumen();
    if (r) this.form.reset(r.supuestos.parametros);
    this.erroresParametros.set([]);
    this.erroresCampo.set({});
  }

  // ---------- Formato (solo presentación) ----------

  g(valor: number): string { return `${gramos.format(valor)} g`; }
  n(valor: number): string { return entero.format(valor); }
  d(valor: number): string { return decimal.format(valor); }

  // "2026-11-01" → "01-11-2026", sin pasar por Date (evita desfases de zona horaria).
  fecha(valor: string): string {
    const [a, m, d] = valor.slice(0, 10).split('-');
    return `${d}-${m}-${a}`;
  }

  fechaHora(valor: string): string {
    return new Date(valor).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' });
  }
}
