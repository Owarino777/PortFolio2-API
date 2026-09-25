import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import request from "supertest";
import { ContactRateLimitError, ContactUnavailableError, FormspreeContactSender, type ContactMessage } from "../src/contact.js";
import { createApp } from "../src/index.js";

test("the catalog and detail routes expose the existing projects", async () => {
  const app = createApp();
  const list = await request(app).get("/api/projects").expect(200);
  assert.equal(list.body.projects.length, 5);
  assert.equal(list.body.projects[0].title, "Projet WordPress mon site");
  assert.deepEqual(list.body.projects.map((project: { publishDate: string }) => project.publishDate),
    [...list.body.projects.map((project: { publishDate: string }) => project.publishDate)].sort().reverse());

  const nested = await request(app).get("/api/projects/nested%2Fduvet-genius").expect(200);
  assert.equal(nested.body.project.pagePath, "/work/nested/duvet-genius/");
  const accentedSlug = encodeURIComponent("projet-wordpress-création-site-calvados");
  const wordpress = await request(app).get(`/api/projects/${accentedSlug}`).expect(200);
  assert.equal(wordpress.body.project.title, "Projet WordPress mon site");
  const missing = await request(app).get("/api/projects/unknown").expect(404);
  assert.equal(missing.body.error.code, "PROJECT_NOT_FOUND");
});

test("the profile route exposes public profile data", async () => {
  const response = await request(createApp()).get("/api/profile").expect(200);
  assert.equal(response.body.profile.name, "Cheikh Malik");
  assert.ok(response.body.profile.technologies.includes("React.js"));
});

test("contact validates data before handing it to the delivery adapter", async () => {
  const sent: ContactMessage[] = [];
  const app = createApp({ contactSender: { async send(message) { sent.push(message); } } });
  const valid = { name: "Ada Lovelace", email: "ada@example.com", message: "Bonjour, parlons de votre travail." };

  await request(app).post("/api/contact").send({ ...valid, name: "A" }).expect(400);
  await request(app).post("/api/contact").send({ ...valid, unexpected: true }).expect(400);
  await request(app).post("/api/contact").set("Content-Type", "application/json").send("{").expect(400);
  const oversized = await request(app).post("/api/contact").set("Content-Type", "application/json")
    .send(JSON.stringify({ ...valid, message: "x".repeat(13000) })).expect(413);
  assert.equal(oversized.body.error.code, "PAYLOAD_TOO_LARGE");
  assert.equal(sent.length, 0);

  await request(app).post("/api/contact").send({ ...valid, website: "bot.example" }).expect(202);
  assert.equal(sent.length, 0);
  await request(app).post("/api/contact").send({ ...valid, website: "" }).expect(202);
  assert.deepEqual(sent, [valid]);
});

test("contact does not claim delivery when the provider fails", async () => {
  const app = createApp({ contactSender: { async send() { throw new ContactUnavailableError("unavailable"); } } });
  const response = await request(app).post("/api/contact").send({
    name: "Ada Lovelace", email: "ada@example.com", message: "Bonjour, parlons de votre travail.",
  }).expect(503);
  assert.equal(response.body.error.code, "CONTACT_UNAVAILABLE");
});

test("the Formspree adapter forwards only validated contact fields", async () => {
  let target = "";
  let posted: unknown;
  const sender = new FormspreeContactSender("abc123", async (url, init) => {
    target = String(url);
    posted = JSON.parse(String(init?.body));
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  });
  await sender.send({ name: "Ada", email: "ada@example.com", message: "Bonjour depuis le portfolio." });
  assert.equal(target, "https://formspree.io/f/abc123");
  assert.deepEqual(posted, {
    name: "Ada", email: "ada@example.com", message: "Bonjour depuis le portfolio.",
    _subject: "Contact portfolio de Ada",
  });

  const limited = new FormspreeContactSender("abc123", async () => new Response(null, { status: 429 }));
  await assert.rejects(limited.send({ name: "Ada", email: "ada@example.com", message: "Bonjour depuis le portfolio." }), ContactRateLimitError);
});

test("CORS grants only configured browser origins", async () => {
  const app = createApp({ allowedOrigins: ["https://demo.example"] });
  const allowed = await request(app).get("/api/profile").set("Origin", "https://demo.example").expect(200);
  assert.equal(allowed.headers["access-control-allow-origin"], "https://demo.example");
  const denied = await request(app).get("/api/profile").set("Origin", "https://other.example").expect(200);
  assert.equal(denied.headers["access-control-allow-origin"], undefined);
});

test("the published OpenAPI document describes exactly four business operations", () => {
  const spec = JSON.parse(readFileSync(new URL("../public/openapi.json", import.meta.url), "utf8"));
  assert.equal(spec.openapi, "3.0.3");
  assert.deepEqual(Object.keys(spec.paths).sort(),
    ["/api/contact", "/api/profile", "/api/projects", "/api/projects/{slug}"]);
});
