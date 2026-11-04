import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { BuscadorCatalogo } from './buscador-catalogo';

describe('BuscadorCatalogo', () => {
  let component: BuscadorCatalogo;
  let fixture: ComponentFixture<BuscadorCatalogo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BuscadorCatalogo],
    }).compileComponents();

    fixture = TestBed.createComponent(BuscadorCatalogo);
    component = fixture.componentInstance;
    // "control" es un input obligatorio: el formulario que usa el buscador.
    fixture.componentRef.setInput('control', new FormControl(''));
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
