import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreatePdfModalComponent } from './create-pdf-modal.component';

describe('CreatePdfModalComponent', () => {
  let component: CreatePdfModalComponent;
  let fixture: ComponentFixture<CreatePdfModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreatePdfModalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreatePdfModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
