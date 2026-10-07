import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SelectorMultiple } from './selector-multiple';

describe('SelectorMultiple', () => {
  let component: SelectorMultiple;
  let fixture: ComponentFixture<SelectorMultiple>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectorMultiple],
    }).compileComponents();

    fixture = TestBed.createComponent(SelectorMultiple);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
