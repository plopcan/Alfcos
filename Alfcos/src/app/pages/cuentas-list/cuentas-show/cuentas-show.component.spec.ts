import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CuentasShowComponent } from './cuentas-show.component';

describe('CuentasShowComponent', () => {
  let component: CuentasShowComponent;
  let fixture: ComponentFixture<CuentasShowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CuentasShowComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CuentasShowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
