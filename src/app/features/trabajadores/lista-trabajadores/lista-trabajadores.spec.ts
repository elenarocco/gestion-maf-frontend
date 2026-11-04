import { ComponentFixture, TestBed } from '@angular/core/testing';
import { proveedoresDePrueba } from '../../../../testing/proveedores-prueba';
import { ListaTrabajadores } from './lista-trabajadores';

describe('ListaTrabajadores', () => {
  let component: ListaTrabajadores;
  let fixture: ComponentFixture<ListaTrabajadores>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaTrabajadores],
      providers: proveedoresDePrueba(),
    }).compileComponents();

    fixture = TestBed.createComponent(ListaTrabajadores);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
