export type MailPayload = {
	to: string | string[];
	subject: string;
} & ({ type: "text"; body: string } | { type: "html"; body: string });
