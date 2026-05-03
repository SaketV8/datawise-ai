import "dotenv/config";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";

import { chatRoutes } from "./routes/chat.routes";
import { promptsRoutes } from "./routes/prompts.routes";

const app = new Hono();

// CORS
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

// Health check
app.get("/api", (c) => c.json({ ok: true, service: "datawise-server" }));

// Mount routes
app.route("/api", chatRoutes);
app.route("/api", promptsRoutes);

const port = Number(process.env.PORT ?? 8787);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`🚀 datawise-server listening on http://localhost:${info.port}`);
});

export default app;
