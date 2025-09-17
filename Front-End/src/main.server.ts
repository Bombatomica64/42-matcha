import { bootstrapApplication } from "@angular/platform-browser";
import { App } from "./app/app";
import { config } from "./app/app.config.server";

export default function bootstrap(context: unknown) {
	// Angular SSR in v17+ accepts a BootstrapContext as third parameter.
	// We don't import its type (not exported) and just forward the context.
	/* biome-ignore lint/suspicious/noExplicitAny: Angular SSR BootstrapContext type not exported */
	return bootstrapApplication(App, config, context as any);
}
