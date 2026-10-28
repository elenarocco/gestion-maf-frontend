import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';
import { mensajesError } from '../../core/errores-api';

interface AccesoVpn {
  id: number; solicitudId: number; rut: string; nombre: string; cargo: string | null; companiaExterna: string | null;
  departamento: string | null; cuentaCorreo: string | null; motivo: string;
  fechaDesde: string | null; fechaHasta: string | null; vigente: boolean; fechaRegistro: string;
}

// Registro de accesos VPN de proveedores: se llena solo, cuando TI confirma el envío de una solicitud VPN.
// Muestra quién tiene VPN y cuándo vence.
@Component({
  selector: 'app-accesos-vpn',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './accesos-vpn.html',
  styleUrl: './accesos-vpn.scss'
})
export class AccesosVpn implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  buscar = new FormControl('', { nonNullable: true });
  estado = 'Vigentes';
  filas: AccesoVpn[] = [];
  total = 0;
  pagina = 1;
  tamano = 20;
  totalPaginas = 1;
  cargando = true;
  error = '';

  private peticion = 0;
  private subs = new Subscription();

  ngOnInit(): void {
    this.subs.add(this.buscar.valueChanges.pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => { this.pagina = 1; this.cargar(); }));
    this.cargar();
  }

  ngOnDestroy(): void { this.subs.unsubscribe(); }

  cambiarEstado(e: string): void { this.estado = e; this.pagina = 1; this.cargar(); }
  irA(p: number): void { this.pagina = p; this.cargar(); }

  // Días que faltan para que venza (null si no tiene fecha de término).
  diasRestantes(a: AccesoVpn): number | null {
    if (!a.fechaHasta) return null;
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const [y, m, d] = a.fechaHasta.split('-').map(Number);
    return Math.round((new Date(y, m - 1, d).getTime() - hoy.getTime()) / 86_400_000);
  }

  fecha(f: string | null): string {
    if (!f) return '—';
    const [y, m, d] = f.split('-');
    return `${d}-${m}-${y}`;
  }

  private cargar(): void {
    const mia = ++this.peticion;
    this.cargando = true;
    this.error = '';
    let params = new HttpParams().set('estado', this.estado).set('pagina', this.pagina).set('tamanoPagina', this.tamano);
    const q = this.buscar.value.trim();
    if (q) params = params.set('q', q);

    this.http.get<{ total: number; datos: AccesoVpn[] }>(`${environment.apiUrl}/accesos-vpn`, { params }).subscribe({
      next: r => {
        if (mia !== this.peticion) return;
        this.filas = r.datos;
        this.total = r.total;
        this.totalPaginas = Math.max(1, Math.ceil(r.total / this.tamano));
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        if (mia !== this.peticion) return;
        this.error = mensajesError(err, 'No se pudieron cargar los accesos VPN.')[0];
        this.filas = [];
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }
}
