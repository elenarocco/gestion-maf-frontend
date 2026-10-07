import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FichaTrabajador } from './ficha-trabajador';

describe('FichaTrabajador', () => {
  let component: FichaTrabajador;
  let fixture: ComponentFixture<FichaTrabajador>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FichaTrabajador],
    }).compileComponents();

    fixture = TestBed.createComponent(FichaTrabajador);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
