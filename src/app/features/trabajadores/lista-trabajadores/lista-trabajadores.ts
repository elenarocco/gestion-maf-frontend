import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrabajadorService, Trabajador } from '../../../core/trabajador';

@Component({
  imports: [CommonModule],
  selector: 'app-lista-trabajadores',
  styleUrl: './lista-trabajadores.scss',
  templateUrl: './lista-trabajadores.html',
})
export class ListaTrabajadores implements OnInit {
  trabajadores: Trabajador[] = [];
  cargando = true;

  constructor(
    private trabajadorService: TrabajadorService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.trabajadorService.getAll().subscribe({
      next: (respuesta) => {
        this.trabajadores = respuesta.datos;
        this.cargando = false;
        this.cdr.detectChanges(); // fuerza a Angular a redibujar la pantalla ahora
      },
      error: (err) => {
        console.error('Error al cargar trabajadores:', err);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }
}