import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SolicitudService } from '../../../core/solicitud';

interface Fila {
  nombre: string; iniciales: string; area: string; tipo: string;
  fecha: string; estadoTexto: string; estadoClase: string;
  motivoRechazo: string | null;
  // "Corregir" abre el formulario del mismo tipo enlazado a la rechazada; solo si el backend lo permite.
  corregir: { ruta: string, queryParams: { origen: number, trabajador: number | null } } | null;
}

// Formulario que corrige cada tipo de solicitud.
const RUTA_CORREGIR: Record<string, string> = {
  'Ingreso': '/solicitudes/nueva/ingreso',
  'Bloqueo': '/solicitudes/bloqueo',
  'Modificación': '/solicitudes/modificacion'
};

@Component({
  selector: 'app-lista-solicitudes',
  imports: [CommonModule, RouterLink],
  templateUrl: './lista-solicitudes.html',
  styleUrl: './lista-solicitudes.scss'
})
export class ListaSolicitudes implements OnInit {
  tipos = ['Todas', 'Ingreso', 'Modificación', 'Bloqueo', 'VPN'];
  estados = ['Todas', 'Pendiente', 'Urgentes', 'En proceso', 'Completada', 'Rechazada'];

  tipoActivo = 'Todas';
  estadoActivo = 'Todas';

  filas: Fila[] = [];
  cargando = true;
  total = 0;

  // Paginación (igual que en la lista de trabajadores)
  pagina = 1;
  private tamano = 20;
  totalPaginas = 1;
  desde = 0;
  hasta = 0;

  constructor(private solicitudService: SolicitudService, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.cargar();
  }

  // Al cambiar un filtro se vuelve a la primera página.
  filtrarTipo(t: string): void { this.tipoActivo = t; this.pagina = 1; this.cargar(); }
  filtrarEstado(e: string): void { this.estadoActivo = e; this.pagina = 1; this.cargar(); }
  irA(p: number): void { this.pagina = p; this.cargar(); }

  private cargar(): void {
    this.cargando = true;

    const filtros: { tipo?: string, estado?: string, urgente?: boolean } = {};
    if (this.tipoActivo !== 'Todas') filtros.tipo = this.tipoActivo;
    if (this.estadoActivo === 'Urgentes') filtros.urgente = true;
    else if (this.estadoActivo !== 'Todas') filtros.estado = this.estadoActivo;

    this.solicitudService.getAll(filtros, this.pagina, this.tamano).subscribe({
      next: (r) => {
        this.total = r.total;
        this.totalPaginas = Math.max(1, Math.ceil(r.total / this.tamano));
        this.desde = r.total === 0 ? 0 : (this.pagina - 1) * this.tamano + 1;
        this.hasta = Math.min(this.pagina * this.tamano, r.total);
        this.filas = r.datos.map((s: any) => {
          const [estadoTexto, estadoClase] = this.estado(s);
          return {
            nombre: s.trabajadorNombre,
            iniciales: s.trabajadorNombre.split(' ').filter(Boolean).slice(0, 2).map((p: string) => p[0]).join('').toUpperCase(),
            area: s.areaNombre,
            tipo: s.tipo,
            fecha: new Date(s.fechaCreacion).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' }).replace('.', ''),
            estadoTexto, estadoClase,
            motivoRechazo: s.motivoRechazo ?? null,
            corregir: s.puedeCorregir && RUTA_CORREGIR[s.tipo]
              ? { ruta: RUTA_CORREGIR[s.tipo], queryParams: { origen: s.id, trabajador: s.trabajadorId } }
              : null
          };
        });
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => { this.cargando = false; this.cdr.detectChanges(); }
    });
  }

  private estado(s: any): [string, string] {
    if (s.estado === 'Pendiente') return s.esUrgente ? ['Urgente', 'urgente'] : ['Pendiente', 'pendiente'];
    if (s.estado === 'En proceso' || s.estado === 'EnProceso') return ['En proceso', 'proceso'];
    if (s.estado === 'Completada') return ['Completada', 'completada'];
    return ['Rechazada', 'rechazada'];
  }
}