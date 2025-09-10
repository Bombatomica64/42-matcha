import { Component, input } from "@angular/core";
import { NG_VALUE_ACCESSOR } from "@angular/forms";

@Component({
	selector: "app-primary-input",
	imports: [],
	providers: [
		{
			//non mi sembra il caso
			provide: NG_VALUE_ACCESSOR,
			useExisting: PrimaryInput,
			multi: true,
		},
	],
	template: `
    <p>
      primary-input works!
    </p>
  `,
	styles: ``,
})
export class PrimaryInput {
	type = input("text"); // Default type is 'text'
	placeholder = input("");
}
