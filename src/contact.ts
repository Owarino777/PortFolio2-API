import { z } from "zod";

export const contactSchema = z.strictObject({
  name: z.string().trim().min(2).max(100),
  email: z.email().trim().max(254),
  message: z.string().trim().min(10).max(3000),
  website: z.string().max(200).optional(),
});

export type ContactMessage = Pick<z.infer<typeof contactSchema>, "name" | "email" | "message">;

export interface ContactSender {
  send(message: ContactMessage): Promise<void>;
}

export class ContactUnavailableError extends Error {}
export class ContactRateLimitError extends Error {}

export class FormspreeContactSender implements ContactSender {
  constructor(
    private readonly formId: string | undefined,
    private readonly request: typeof fetch = fetch,
  ) {}

  async send(message: ContactMessage): Promise<void> {
    if (!this.formId || !/^[a-zA-Z0-9]+$/.test(this.formId)) {
      throw new ContactUnavailableError("Contact form is not configured");
    }

    let response: Response;
    try {
      response = await this.request(`https://formspree.io/f/${this.formId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ ...message, _subject: `Contact portfolio de ${message.name}` }),
        signal: AbortSignal.timeout(8000),
      });
    } catch {
      throw new ContactUnavailableError("Contact provider could not be reached");
    }

    if (response.status === 429) {
      throw new ContactRateLimitError("Contact provider rate limit exceeded");
    }
    if (!response.ok) {
      throw new ContactUnavailableError(`Contact provider returned ${response.status}`);
    }
  }
}
