import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SimpleChatTest } from './simple-chat-test';

describe('SimpleChatTest', () => {
  let component: SimpleChatTest;
  let fixture: ComponentFixture<SimpleChatTest>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SimpleChatTest]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SimpleChatTest);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
