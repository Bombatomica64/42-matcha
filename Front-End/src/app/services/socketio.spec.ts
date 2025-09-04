import { TestBed } from '@angular/core/testing';

import { Socketio } from './socketio';

describe('Socketio', () => {
  let service: Socketio;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Socketio);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
