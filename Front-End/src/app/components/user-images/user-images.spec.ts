import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserImages } from './user-images';

describe('UserImages', () => {
  let component: UserImages;
  let fixture: ComponentFixture<UserImages>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserImages]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserImages);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
