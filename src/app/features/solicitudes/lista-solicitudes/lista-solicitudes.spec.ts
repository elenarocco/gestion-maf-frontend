import { ComponentFixture, TestBed } from '@angular/core/testing';
import { proveedoresDePrueba } from '../../../../testing/proveedores-prueba';
import { ListaSolicitudes } from './lista-solicitudes';

describe('ListaSolicitudes', () => {
  let component: ListaSolicitudes;
  let fixture: ComponentFixture<ListaSolicitudes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaSolicitudes],
      providers: proveedoresDePrueba(),
    }).compileComponents();

    fixture = TestBed.createComponent(ListaSolicitudes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
