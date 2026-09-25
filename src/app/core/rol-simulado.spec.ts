import { TestBed } from '@angular/core/testing';
import { RolSimulado } from './rol-simulado';

describe('RolSimulado', () => {
  let service: RolSimulado;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RolSimulado);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
