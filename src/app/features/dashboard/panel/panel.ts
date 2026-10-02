import { Component, OnInit, ChangeDetectorRef, computed,inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { RolSimuladoService } from '../../../core/rol-simulado';

interface Resumen {
  dotacionActual: number;
  ingresosDelMes: number;
  bajasDelMes: number;
  solicitudesPendientes: number;
  solicitudesUrgentes: number;
  porTipo: { tipo: string; cantidad: number }[];
  movimientos: { mes: string; ingresos: number; bajas: number }[];
}

interface FilaSolicitud {
  nombre: string; iniciales: string; area: string; tipo: string;
  fecha: string; estadoTexto: string; estadoClase: string;
}

@Component({
  selector: 'app-panel',
  imports: [RouterLink],
  templateUrl: './panel.html',
  styleUrl: './panel.scss'
})
export class Panel implements OnInit {
  private api = 'http://localhost:5153/api';

  public rolService = inject(RolSimuladoService);

  puedeCrearSolicitud = computed(() => {
    const rol = this.rolService.rolActual();
    const rolesPermitidos = ['Super Admin', 'Admin TI', 'Jefatura'];
    return rolesPermitidos.includes(rol);
  });
  resumen: Resumen | null = null;
  subtitulo = '';
  tiposResumen: { etiqueta: string; cantidad: number; porcentaje: number }[] = [];
  meses: { etiqueta: string; ingresos: number; bajas: number; hIngresos: number; hBajas: number }[] = [];
  recientes: FilaSolicitud[] = [];

  private etiquetasTipo: Record<string, string> = {
    'Ingreso': 'Solicitudes de ingreso',
    'Modificación': 'Modificaciones de acceso',
    'Bloqueo': 'Bloqueos de cuenta',
    'VPN': 'Solicitudes VPN'
  };

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
    
  ) { }

  ngOnInit(): void {
    const hoy = new Date();
    const mes = hoy.toLocaleDateString('es-CL', { month: 'long' });
    this.subtitulo = `${mes.charAt(0).toUpperCase() + mes.slice(1)} ${hoy.getFullYear()} · Empresa completa`;

    this.http.get<Resumen>(`${this.api}/Dashboard/resumen`).subscribe(r => {
      this.resumen = r;
      const maxTipo = Math.max(1, ...r.porTipo.map(t => t.cantidad));
      this.tiposResumen = Object.keys(this.etiquetasTipo).map(clave => {
        const cantidad = r.porTipo.find(t => t.tipo === clave)?.cantidad ?? 0;
        return { etiqueta: this.etiquetasTipo[clave], cantidad, porcentaje: cantidad / maxTipo * 100 };
      });
      const maxMov = Math.max(1, ...r.movimientos.flatMap(m => [m.ingresos, m.bajas]));
      this.meses = r.movimientos.map(m => {
        const corto = new Date(m.mes + 'T00:00:00').toLocaleDateString('es-CL', { month: 'short' }).replace('.', '');
        return {
          etiqueta: corto.charAt(0).toUpperCase() + corto.slice(1),
          ingresos: m.ingresos, bajas: m.bajas,
          hIngresos: m.ingresos / maxMov * 100,
          hBajas: m.bajas / maxMov * 100
        };
      });
      this.cdr.detectChanges();
    });

    this.http.get<{ datos: any[] }>(`${this.api}/Solicitud?pagina=1&tamanoPagina=5`).subscribe(r => {
      this.recientes = r.datos.map(s => {
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
      this.cdr.detectChanges();
    });
  }

  private estado(s: any): [string, string] {
    if (s.estado === 'Pendiente') {
      return s.esUrgente ? ['Urgente', 'urgente'] : ['Pendiente', 'pendiente'];
    }
    if (s.estado === 'En proceso') return ['En proceso', 'proceso'];
    if (s.estado === 'Completada') return ['Completada', 'completada'];
    return ['Rechazada', 'rechazada'];
  }
}