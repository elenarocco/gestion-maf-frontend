import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Catalogo } from '../../core/catalogo';

const normalizar = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

@Component({
  selector: 'app-selector-multiple',
  templateUrl: './selector-multiple.html',
  styleUrl: './selector-multiple.scss'
})
export class SelectorMultiple {
  @Input() opciones: Catalogo[] = [];
  @Input() seleccionados: number[] = [];
  @Input() placeholder = 'Escribe para buscar...';
  @Input() vacio = 'Aún no has agregado ninguno.';
  @Output() seleccionadosChange = new EventEmitter<number[]>();

  texto = '';
  abierto = false;
  resaltada = 0;
  pendiente: Catalogo | null = null;

  get filtradas(): Catalogo[] {
    const t = normalizar(this.texto);
    return this.opciones.filter(o =>
      !this.seleccionados.includes(o.id) && (!t || normalizar(o.nombre).includes(t)));
  }

  get elegidos(): Catalogo[] {
    return this.seleccionados
      .map(id => this.opciones.find(o => o.id === id))
      .filter((o): o is Catalogo => !!o);
  }

  abrir(): void { this.abierto = true; }

  onInput(event: Event): void {
    this.texto = (event.target as HTMLInputElement).value;
    this.pendiente = null;
    this.resaltada = 0;
    this.abierto = true;
  }

  onBlur(): void {
    const exacta = this.filtradas.find(o => normalizar(o.nombre) === normalizar(this.texto));
    if (exacta) this.elegir(exacta);
    this.abierto = false;
  }

  elegir(o: Catalogo): void {
    this.pendiente = o;
    this.texto = o.nombre;
    this.abierto = false;
  }

  agregar(): void {
    if (!this.pendiente) return;
    this.seleccionadosChange.emit([...this.seleccionados, this.pendiente.id]);
    this.pendiente = null;
    this.texto = '';
  }

  quitar(id: number): void {
    this.seleccionadosChange.emit(this.seleccionados.filter(x => x !== id));
  }

  onKey(e: KeyboardEvent): void {
    const lista = this.filtradas;
    if (e.key === 'ArrowDown') { this.abierto = true; this.resaltada = Math.min(this.resaltada + 1, lista.length - 1); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { this.resaltada = Math.max(this.resaltada - 1, 0); e.preventDefault(); }
    else if (e.key === 'Enter') {
      if (this.abierto && lista[this.resaltada]) this.elegir(lista[this.resaltada]);
      else if (this.pendiente) this.agregar();
      e.preventDefault();
    }
    else if (e.key === 'Escape') { this.abierto = false; }
  }
}