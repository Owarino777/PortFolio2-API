import cors from "cors";
import express, { type ErrorRequestHandler, type Express } from "express";
import { contactSchema, ContactRateLimitError, ContactUnavailableError, FormspreeContactSender, type ContactSender } from "./contact.js";
import { findProject, profile, projectCatalog } from "./data.js";

interface AppOptions {
  contactSender?: ContactSender;
  allowedOrigins?: string[];
}

export function createApp(options: AppOptions = {}): Express {
  const app = express();
  const allowedOrigins = options.allowedOrigins ?? [
    "http://localhost:4321",
    "http://127.0.0.1:4321",
    ...(process.env.FRONTEND_ORIGIN ? [process.env.FRONTEND_ORIGIN.replace(/\/$/, "")] : []),
  ];
  const contactSender = options.contactSender ?? new FormspreeContactSender(process.env.FORMSPREE_FORM_ID);

  app.disable("x-powered-by");
  app.use("/api", cors({ origin: (origin, callback) => callback(null, !origin || allowedOrigins.includes(origin)) }));
  app.use(express.json({ limit: "12kb" }));

  app.get("/api/projects", (_request, response) => {
    response.json({ projects: projectCatalog });
  });

  app.get("/api/projects/:slug", (request, response) => {
    const project = findProject(request.params.slug);
    if (!project) {
      response.status(404).json({ error: { code: "PROJECT_NOT_FOUND", message: "Projet introuvable." } });
      return;
    }
    response.json({ project });
  });

  app.get("/api/profile", (_request, response) => {
    response.json({ profile });
  });

  app.post("/api/contact", async (request, response) => {
    const parsed = contactSchema.safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json({ error: { code: "INVALID_CONTACT", message: "Vérifie les champs du formulaire." } });
      return;
    }

    // Quietly accept bot submissions caught by the hidden field.
    if (parsed.data.website) {
      response.status(202).json({ status: "accepted" });
      return;
    }

    try {
      const { name, email, message } = parsed.data;
      await contactSender.send({ name, email, message });
      response.status(202).json({ status: "accepted" });
    } catch (error) {
      if (error instanceof ContactRateLimitError) {
        response.status(429).json({ error: { code: "RATE_LIMITED", message: "Trop de demandes. Réessaie plus tard." } });
        return;
      }
      console.error("Contact delivery failed", error instanceof Error ? error.message : "Unknown error");
      response.status(503).json({ error: { code: "CONTACT_UNAVAILABLE", message: "Le formulaire est indisponible. Utilise le lien email." } });
    }
  });

  // Vercel serves public/ directly. This middleware makes the same docs available locally.
  app.use(express.static("public"));

  const handleError: ErrorRequestHandler = (error, _request, response, _next) => {
    if (error && typeof error === "object" && "status" in error && error.status === 413) {
      response.status(413).json({ error: { code: "PAYLOAD_TOO_LARGE", message: "Message trop volumineux." } });
      return;
    }
    if (error instanceof SyntaxError && "body" in error) {
      response.status(400).json({ error: { code: "INVALID_JSON", message: "Corps JSON invalide." } });
      return;
    }
    console.error("Unexpected API error", error instanceof Error ? error.message : "Unknown error");
    response.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Une erreur est survenue." } });
  };
  app.use(handleError);

  return app;
}

export default createApp();
