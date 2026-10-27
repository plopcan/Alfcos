import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TallerFormComponent } from './taller-form.component';

describe('TallerFormComponent', () => {
  let component: TallerFormComponent;
  let fixture: ComponentFixture<TallerFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TallerFormComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TallerFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
