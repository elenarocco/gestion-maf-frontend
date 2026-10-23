import { ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, SimpleChanges, inject } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Catalogo } from '../../core/catalogo';

const normalizar = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

@Component({
  selector: 'app-buscador-catalogo',
  templateUrl: './buscador-catalogo.html',
  styleUrl: './buscador-catalogo.scss'
})
export class BuscadorCatalogo implements OnChanges, OnDestroy {
  @Input() opciones: Catalogo[] = [];
  @Input({ required: true }) control!: AbstractControl;
  @Input() placeholder = 'Escribe para buscar...';

  texto = '';
  abierto = false;
  filtradas: Catalogo[] = [];
  resaltada = 0;

  private cdr = inject(ChangeDetectorRef);
  private sub?: Subscription;
  private cambioPropio = false;   // el valor lo cambió este componente (al escribir o elegir), no el formulario

  ngOnChanges(cambios: SimpleChanges): void {
    // Si el formulario cambia el valor desde afuera (proponer un área, reiniciar el formulario), se muestra.
    if (cambios['control']) {
      this.sub?.unsubscribe();
      this.sub = this.control.valueChanges.subscribe(() => {
        if (this.cambioPropio) return;
        this.mostrarValor();
        this.cdr.markForCheck();   // sin zone.js, un cambio que no viene de un evento propio no se redibuja solo
      });
    }
    this.filtrar();
    this.mostrarValor();
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  abrir(): void { this.filtrar(); this.abierto = true; }

  onInput(event: Event): void {
    this.texto = (event.target as HTMLInputElement).value;
    this.fijar('');      // hasta elegir una opción, el campo no es válido
    this.filtrar();
    this.resaltada = 0;
    this.abierto = true;
  }

  onBlur(): void {
    // si escribió el nombre exacto sin hacer clic, lo toma igual
    const exacta = this.opciones.find(o => normalizar(o.nombre) === normalizar(this.texto));
    if (exacta) this.seleccionar(exacta);
    this.abierto = false;
    this.control.markAsTouched();
  }

  seleccionar(o: Catalogo): void {
    this.texto = o.nombre;
    this.fijar(o.id);
    this.control.markAsDirty();
    this.abierto = false;
  }

  onKey(e: KeyboardEvent): void {
    if (e.key === 'ArrowDown') { this.resaltada = Math.min(this.resaltada + 1, this.filtradas.length - 1); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { this.resaltada = Math.max(this.resaltada - 1, 0); e.preventDefault(); }
    else if (e.key === 'Enter' && this.abierto && this.filtradas[this.resaltada]) { this.seleccionar(this.filtradas[this.resaltada]); e.preventDefault(); }
    else if (e.key === 'Escape') { this.abierto = false; }
  }

  private fijar(valor: number | ''): void {
    this.cambioPropio = true;
    this.control.setValue(valor);
    this.cambioPropio = false;
  }

  private mostrarValor(): void {
    const v = this.control.value;
    if (v === '' || v === null || v === undefined) { this.texto = ''; return; }
    const elegida = this.opciones.find(o => o.id === Number(v));
    if (elegida) this.texto = elegida.nombre;
  }

  private filtrar(): void {
    const t = normalizar(this.texto);
    this.filtradas = t ? this.opciones.filter(o => normalizar(o.nombre).includes(t)) : [...this.opciones];
  }
}