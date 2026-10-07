import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TrabajadorService, TrabajadorFicha } from '../../../core/trabajador';

interface FilaHistorial {
  id: number; tipo: string; creadoPor: string; fecha: string; estado: string; estadoClase: string;
}

@Component({
  selector: 'app-ficha-trabajador',
  imports: [RouterLink],
  templateUrl: './ficha-trabajador.html',
  styleUrl: './ficha-trabajador.scss'
})
export class FichaTrabajador implements OnInit {
  ficha: TrabajadorFicha | null = null;
  iniciales = '';
  fechaIngreso = '';
  fechaSalida = '';
  historial: FilaHistorial[] = [];
  error = '';

  private clases: Record<string, string> = {
    'Pendiente': 'pendiente', 'En proceso': 'proceso', 'Completada': 'completada', 'Rechazada': 'rechazada'
  };

  constructor(
    private route: ActivatedRoute,
    private trabajadorService: TrabajadorService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.trabajadorService.getFicha(id).subscribe({
      next: (f) => {
        this.ficha = f;
        this.iniciales = f.nombreCompleto.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
        this.fechaIngreso = this.formatearFecha(f.fechaIncorporacion);
        this.fechaSalida = f.fechaSalida ? this.formatearFecha(f.fechaSalida) : '';
        this.historial = f.solicitudes.map(s => ({
          id: s.id,
          tipo: s.tipo,
          creadoPor: s.creadoPor,
          fecha: new Date(s.fechaCreacion).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' }).replace('.', ''),
          estado: s.estado,
          estadoClase: this.clases[s.estado] ?? 'pendiente'
        }));
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err.status === 403 ? 'Tu rol no tiene permiso para ver esta ficha.'
          : err.status === 404 ? 'No se encontró al trabajador.'
          : 'No se pudo cargar la ficha.';
        this.cdr.detectChanges();
      }
    });
  }

  private formatearFecha(iso: string): string {
    return new Date(iso + 'T00:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });
  }
}