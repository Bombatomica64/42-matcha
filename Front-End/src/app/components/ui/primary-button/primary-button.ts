import { Component, input, output } from "@angular/core";

@Component({
	selector: "app-primary-button",
	imports: [],
	template: `
    <button class="primary-button" [attr.type]="type()" [disabled]="disabled()" (click)="handleButtonClick()"> <!-- buttonClicked.emit() -->
      {{ label() }}
    </button>
  `,
	styles: [
		`
    .primary-button {
      background-color: blue;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 4px;
      cursor: pointer;
    }

    .primary-button:hover {
      background-color: darkblue;
    }
  `,
	],
})
export class PrimaryButton {
	label = input("");
	type = input("button");
	disabled = input(false);

	buttonClicked = output();
	handleButtonClick() {
		console.log("Button clicked:", this.label());
		this.buttonClicked.emit();
	}
}
