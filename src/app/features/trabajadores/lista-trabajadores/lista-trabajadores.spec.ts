import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ListaTrabajadores } from './lista-trabajadores';

describe('ListaTrabajadores', () => {
  let component: ListaTrabajadores;
  let fixture: ComponentFixture<ListaTrabajadores>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaTrabajadores],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ListaTrabajadores);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
