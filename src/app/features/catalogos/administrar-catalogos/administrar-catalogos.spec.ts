import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdministrarCatalogos } from './administrar-catalogos';

describe('AdministrarCatalogos', () => {
  let component: AdministrarCatalogos;
  let fixture: ComponentFixture<AdministrarCatalogos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdministrarCatalogos],
    }).compileComponents();

    fixture = TestBed.createComponent(AdministrarCatalogos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
