import type { HttpInterceptorFn } from "@angular/common/http";
import { TestBed } from "@angular/core/testing";

import { getTokenInterceptor } from "./get-token-interceptor";

describe("getTokenInterceptor", () => {
	const interceptor: HttpInterceptorFn = (req, next) =>
		TestBed.runInInjectionContext(() => getTokenInterceptor(req, next));

	beforeEach(() => {
		TestBed.configureTestingModule({});
	});

	it("should be created", () => {
		expect(interceptor).toBeTruthy();
	});
});
