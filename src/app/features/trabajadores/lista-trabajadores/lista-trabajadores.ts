import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TrabajadorService, Trabajador } from '../../../core/trabajador';
import { CatalogoService } from '../../../core/catalogo';

@Component({
  selector: 'app-lista-trabajadores',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './lista-trabajadores.html',
  styleUrl: './lista-trabajadores.scss',
})
export class ListaTrabajadores implements OnInit {
  trabajadores: Trabajador[] = [];
  trabajadoresFiltrados: Trabajador[] = [];
  cargando = true;
  busqueda = '';
  areaSeleccionada = '';
  areasDisponibles: string[] = [];

  constructor(
    private trabajadorService: TrabajadorService,
    private catalogoService: CatalogoService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando = true;

    // Cargar áreas del catálogo para poblar las opciones del filtro
    this.catalogoService.getPorTipo('Area').subscribe({
      next: (resp) => {
        const areasCat = resp?.datos ? resp.datos.map((a) => a.nombre).filter(Boolean) : [];
        this.actualizarAreasDisponibles(areasCat);
      },
      error: () => {
        this.actualizarAreasDisponibles([]);
      },
    });

    // Cargar trabajadores existentes desde el backend
    this.trabajadorService.getAll(1, 100).subscribe({
      next: (respuesta) => {
        this.trabajadores = respuesta.datos || [];
        this.actualizarAreasDisponibles();
        this.filtrar();
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar trabajadores:', err);
        this.trabajadores = [];
        this.trabajadoresFiltrados = [];
        this.cargando = false;
        this.cdr.detectChanges();
      },
    });
  }

  actualizarAreasDisponibles(areasCatalogo: string[] = []): void {
    const areasDeTrabajadores = this.trabajadores
      .map((t) => this.obtenerArea(t))
      .filter((a) => a && a !== '—');

    const conjunto = new Set([...this.areasDisponibles, ...areasCatalogo, ...areasDeTrabajadores]);
    this.areasDisponibles = Array.from(conjunto).sort();
    this.cdr.detectChanges();
  }

  obtenerNombreCompleto(t: Trabajador): string {
    const partes = [
      t.primerNombre,
      t.segundoNombre,
      t.primerApellido,
      t.segundoApellido,
    ].filter(Boolean);

    if (partes.length > 0) {
      return partes.join(' ');
    }
    return `${t.primerNombre || ''} ${t.primerApellido || ''}`.trim() || '—';
  }

  obtenerIniciales(t: Trabajador): string {
    const p1 = (t.primerNombre || '').trim();
    const p2 = (t.primerApellido || '').trim();
    if (p1 && p2) {
      return (p1[0] + p2[0]).toUpperCase();
    }
    const nombre = this.obtenerNombreCompleto(t).trim();
    const palabras = nombre.split(/\s+/).filter(Boolean);
    if (palabras.length >= 2) {
      return (palabras[0][0] + palabras[1][0]).toUpperCase();
    }
    return (palabras[0]?.slice(0, 2) || '').toUpperCase();
  }

  obtenerArea(t: Trabajador): string {
    // Se utiliza el área si estuviera disponible, o de lo contrario el cargo provisto por el backend
    return t.area || t.areaNombre || t.cargo || '—';
  }

  filtrar(): void {
    const termino = this.busqueda.trim().toLowerCase();
    const areaFiltro = this.areaSeleccionada.trim().toLowerCase();

    this.trabajadoresFiltrados = this.trabajadores.filter((t) => {
      const nombreCompleto = this.obtenerNombreCompleto(t).toLowerCase();
      const rut = (t.rut || '').toLowerCase();
      const correo = (t.correo || '').toLowerCase();
      const area = this.obtenerArea(t).toLowerCase();

      const coincideBusqueda =
        !termino ||
        nombreCompleto.includes(termino) ||
        rut.includes(termino) ||
        correo.includes(termino);

      const coincideArea = !areaFiltro || area === areaFiltro;

      return coincideBusqueda && coincideArea;
    });
  }
}