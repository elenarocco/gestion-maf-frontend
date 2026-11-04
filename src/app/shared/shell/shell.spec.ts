import { ComponentFixture, TestBed } from '@angular/core/testing';
import { proveedoresDePrueba } from '../../../testing/proveedores-prueba';
import { SesionService, UsuarioSesion } from '../../core/sesion';
import { PERMISOS } from '../../core/permisos';
import { Shell } from './shell';

function usuario(rol: string, permisos: string[]): UsuarioSesion {
  return { userId: 1, correo: 'prueba@mafchile.com', nombre: 'Antonia Rocco', rol, areaId: null, areaNombre: null, alcance: 'empresa', permisos };
}

describe('Shell', () => {
  let component: Shell;
  let fixture: ComponentFixture<Shell>;
  let sesion: SesionService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Shell],
      providers: proveedoresDePrueba(),
    }).compileComponents();

    fixture = TestBed.createComponent(Shell);
    component = fixture.componentInstance;
    sesion = TestBed.inject(SesionService);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('muestra solo las secciones con opciones para los permisos del usuario', () => {
    sesion.usuario.set(usuario('RRHH', [PERMISOS.consultarTrabajadores, PERMISOS.consultarSolicitudesPropias, PERMISOS.crearIngreso]));

    const grupos = component.grupos().map(g => ({ nombre: g.nombre, items: g.items.map(i => i.nombre) }));

    expect(grupos).toEqual([
      { nombre: 'General', items: ['Dashboard'] },
      { nombre: 'Gestión', items: ['Mis solicitudes', 'Trabajadores'] }
    ]);
  });

  it('agrupa Sostenibilidad en General y la administración al final', () => {
    sesion.usuario.set(usuario('Gestión General', Object.values(PERMISOS)));

    expect(component.grupos().map(g => g.nombre)).toEqual(['General', 'Gestión', 'Administración']);
    expect(component.grupos()[0].items.map(i => i.nombre)).toEqual(['Dashboard', 'Sostenibilidad']);
  });

  it('arma las iniciales del avatar con el primer nombre y el último apellido', () => {
    sesion.usuario.set(usuario('Admin TI', []));
    expect(component.iniciales()).toBe('AR');
  });
});
