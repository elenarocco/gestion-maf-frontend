import { Component, DestroyRef, OnInit, inject, input, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { startWith, switchMap, timer } from 'rxjs';
import { environment } from '../../../environments/environment';

export type TipoSolicitud = 'Ingreso' | 'Modificacion' | 'Bloqueo' | 'Vpn';

interface PlazoSla { regla: string; inicio: string; vence: string; mensaje: string; }

// Aviso del plazo (SLA) que tendría la solicitud si se enviara ahora: cuánto tarda, desde cuándo cuenta y
// cuándo vence. El backend hace el cálculo (días hábiles, feriados, corte de las 12:00); aquí solo se muestra.
// Se actualiza cada minuto, por si el formulario queda abierto y cambia el día o pasa el corte.
@Component({
  selector: 'app-aviso-plazo',
  template: `@if (mensaje()) { <p class="aviso" role="note">{{ mensaje() }}</p> }`,
  styles: [`.aviso { margin: 0 0 14px; padding: 10px 14px; border-radius: 6px; background: #f3f4f6; color: #374151; font-size: 13px; line-height: 1.45; }`]
})
export class AvisoPlazo implements OnInit {
  tipo = input.required<TipoSolicitud>();

  private http = inject(HttpClient);
  private destroyRef = inject(DestroyRef);
  mensaje = signal('');

  ngOnInit(): void {
    timer(60_000, 60_000).pipe(
      startWith(0),
      switchMap(() => this.http.get<PlazoSla>(`${environment.apiUrl}/solicitudes/plazo`, { params: { tipo: this.tipo() } })),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: p => this.mensaje.set(p.mensaje),
      error: () => this.mensaje.set('')   // si no se puede calcular, no se muestra: el plazo igual lo fija el backend al crear
    });
  }
}
