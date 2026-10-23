import { Component, OnInit, ChangeDetectorRef, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { BandejaTiService, SolicitudBandeja, AccionTi } from '../../../core/bandeja-ti';
import { SesionService } from '../../../core/sesion';
import { PERMISOS, PERMISOS_CREAR_SOLICITUD } from '../../../core/permisos';
import { ESTADOS, TIPOS, etiquetaTipo, normalizarEstado } from '../../../core/solicitud-estado';
import { mensajesError } from '../../../core/errores-api';
import { DescargarReporte } from '../../../shared/descargar-reporte/descargar-reporte';

interface Enlace { ruta: string | (string | number)[]; queryParams?: Record<string, number | null>; texto: string; }

interface Fila {
  id: number;
  nombre: string; iniciales: string; area: string; tipo: string; creadoPor: string;
  fecha: string; estadoTexto: string; estadoClase: string;
  motivoRechazo: string | null;
  acciones: Enlace[];   // del creador, según lo que permite el backend (corregir, completar ficha)
}

// Formulario que corrige cada tipo de solicitud (valores de tipo de la API).
const RUTA_CORREGIR: Record<string, string> = {
  'Ingreso': '/solicitudes/nueva/ingreso',
  'Bloqueo': '/solicitudes/bloqueo',
  'Modificacion': '/solicitudes/modificacion'
};

// Única lista de solicitudes. El backend decide qué se ve: quien puede ver todas las ve todas
// ("Solicitudes"); el resto ve solo las que creó ("Mis solicitudes"), incluidas las VPN.
@Component({
  selector: 'app-lista-solicitudes',
  imports: [CommonModule, RouterLink, DescargarReporte],
  templateUrl: './lista-solicitudes.html',
  styleUrl: './lista-solicitudes.scss'
})
export class ListaSolicitudes implements OnInit {
  private service = inject(BandejaTiService);
  private sesion = inject(SesionService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  readonly tipos = TIPOS;
  readonly estados = ESTADOS;

  veTodas = computed(() => this.sesion.tienePermiso(PERMISOS.consultarTodasLasSolicitudes) || this.sesion.tienePermiso(PERMISOS.bandejaTi));
  puedeCrear = computed(() => this.sesion.tieneAlguno(PERMISOS_CREAR_SOLICITUD));

  tipoActivo = '';
  estadoActivo = '';

  filas: Fila[] = [];
  cargando = true;
  errores: string[] = [];
  total = 0;

  // Paginación (igual que en la lista de trabajadores)
  pagina = 1;
  private tamano = 20;
  totalPaginas = 1;
  desde = 0;
  hasta = 0;

  ngOnInit(): void {
    this.cargar();
  }

  // Al cambiar un filtro se vuelve a la primera página.
  filtrarTipo(t: string): void { this.tipoActivo = t; this.pagina = 1; this.cargar(); }
  filtrarEstado(e: string): void { this.estadoActivo = e; this.pagina = 1; this.cargar(); }
  irA(p: number): void { this.pagina = p; this.cargar(); }

  abrir(f: Fila): void {
    this.router.navigate(['/solicitudes', f.id]);
  }

  private cargar(): void {
    this.cargando = true;
    this.errores = [];
    this.service.listar({ tipo: this.tipoActivo, estado: this.estadoActivo }, this.pagina, this.tamano).subscribe({
      next: r => {
        this.total = r.total;
        this.totalPaginas = Math.max(1, Math.ceil(r.total / this.tamano));
        this.desde = r.total === 0 ? 0 : (this.pagina - 1) * this.tamano + 1;
        this.hasta = Math.min(this.pagina * this.tamano, r.total);
        this.filas = r.items.map(s => this.aFila(s));
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.cargando = false;
        this.errores = mensajesError(err, 'No se pudieron cargar las solicitudes.');
        this.cdr.detectChanges();
      }
    });
  }

  private aFila(s: SolicitudBandeja): Fila {
    const esVpn = s.tipo.toLowerCase() === 'vpn';
    const nombre = s.trabajadorNombre ?? (esVpn ? 'Proveedor por definir' : '—');
    const [estadoTexto, estadoClase] = this.estado(s);
    return {
      id: s.id,
      nombre,
      iniciales: nombre.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase(),
      area: s.areaNombre ?? '—',
      tipo: esVpn && s.motivoVpn ? `VPN · ${s.motivoVpn}` : etiquetaTipo(s.tipo),
      creadoPor: s.creadoPorNombre,
      fecha: new Date(s.fechaCreacion).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' }).replace('.', ''),
      estadoTexto, estadoClase,
      motivoRechazo: s.motivoRechazo,
      acciones: s.accionesPermitidas.map(a => this.enlace(a, s)).filter((e): e is Enlace => e !== null)
    };
  }

  private enlace(accion: AccionTi, s: SolicitudBandeja): Enlace | null {
    if (accion === 'corregir' && RUTA_CORREGIR[s.tipo])
      return { ruta: RUTA_CORREGIR[s.tipo], queryParams: { origen: s.id, trabajador: s.trabajadorId }, texto: 'Corregir →' };
    if (accion === 'completarFicha')
      return { ruta: ['/solicitudes/vpn', s.id, 'ficha'], texto: 'Completar ficha →' };
    return null;
  }

  private estado(s: SolicitudBandeja): [string, string] {
    const e = normalizarEstado(s.estado);
    if (e === 'Pendiente') return s.vencida ? ['Urgente', 'urgente'] : ['Pendiente', 'pendiente'];
    if (e === 'EnProceso') return ['En proceso', 'proceso'];
    if (e === 'Completada') return ['Completada', 'completada'];
    return ['Rechazada', 'rechazada'];
  }
}
