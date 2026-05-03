import { Hono } from "hono";
import { prompts } from "../prompts";

export const promptsRoutes = new Hono();

/**
 * Get all prompts
 */
promptsRoutes.get("/prompts", (c) => {
  return c.json(prompts);
});

/**
 * Update a specific prompt
 */
promptsRoutes.put("/prompts/:key", async (c) => {
  const key = c.req.param("key") as keyof typeof prompts;

  if (!(key in prompts)) {
    return c.json({ error: `Unknown prompt key: ${key}` }, 400);
  }

  const { value } = await c.req.json<{ value: string }>();

  if (typeof value !== "string") {
    return c.json({ error: "value must be a string" }, 400);
  }

  prompts[key] = value;

  return c.json({ ok: true, key, length: value.length });
});
