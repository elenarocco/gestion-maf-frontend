import { ComponentFixture, TestBed } from '@angular/core/testing';
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
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
