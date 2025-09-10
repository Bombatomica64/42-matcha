import { ChangeDetectorRef, Component, inject, signal } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { ButtonModule } from "primeng/button";
import { HttpRequestService } from "../../services/http-request";

@Component({
	selector: "app-verify-email",
	imports: [ButtonModule],
	template: `
    <p>
      verify-email works!
    </p>
    <p-button label="Verify Email" (click)="verifyEmail()"></p-button>

    @if (responded()) {
      <p> {{ message() }} </p>
    }
  `,
	styles: ``,
})
export class VerifyEmail {
	private route = inject(ActivatedRoute);
	private router = inject(Router);
	private cdr = inject(ChangeDetectorRef);
	responded = signal(false);
	message = signal("");

	verifyEmail() {
		console.log("Verifying email...");
		this.route.queryParams.subscribe((params) => {
			const token = params["token"];
			if (token) {
				this.auth
					.requestParams({ token: token }, "/auth/verifyEmail", "GET")
					.subscribe({
						next: (response) => {
							console.log("Email verified successfully:", response);
							this.message.set("Email verified successfully!");
							this.responded.set(true);
						},
						error: (error) => {
							console.error("Error verifying email:", error);
							this.message.set("Error verifying email.");
							this.responded.set(true);
						},
					});
			} else {
				console.error("No token found");
				this.message.set("No token found.");
				this.responded.set(true);
			}
		});
	}

	auth = inject(HttpRequestService);
}
