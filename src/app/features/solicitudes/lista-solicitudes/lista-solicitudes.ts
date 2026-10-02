import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SolicitudService } from '../../../core/solicitud';

interface Fila {
  nombre: string; iniciales: string; area: string; tipo: string;
  fecha: string; estadoTexto: string; estadoClase: string;
}

@Component({
  selector: 'app-lista-solicitudes',
  imports: [CommonModule],
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

  constructor(private solicitudService: SolicitudService, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.cargar();
  }

  filtrarTipo(t: string): void { this.tipoActivo = t; this.cargar(); }
  filtrarEstado(e: string): void { this.estadoActivo = e; this.cargar(); }

  private cargar(): void {
    this.cargando = true;

    const filtros: { tipo?: string, estado?: string, urgente?: boolean } = {};
    if (this.tipoActivo !== 'Todas') filtros.tipo = this.tipoActivo;
    if (this.estadoActivo === 'Urgentes') filtros.urgente = true;
    else if (this.estadoActivo !== 'Todas') filtros.estado = this.estadoActivo;

    this.solicitudService.getAll(filtros).subscribe({
      next: (r) => {
        this.total = r.total;
        this.filas = r.datos.map((s: any) => {
          const [estadoTexto, estadoClase] = this.estado(s);
          return {
            nombre: s.trabajadorNombre,
            iniciales: s.trabajadorNombre.split(' ').filter(Boolean).slice(0, 2).map((p: string) => p[0]).join('').toUpperCase(),
            area: s.areaNombre,
            tipo: s.tipo,
            fecha: new Date(s.fechaCreacion).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' }).replace('.', ''),
            estadoTexto, estadoClase
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
    if (s.estado === 'En proceso') return ['En proceso', 'proceso'];
    if (s.estado === 'Completada') return ['Completada', 'completada'];
    return ['Rechazada', 'rechazada'];
  }
}