import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "@/db/client";
import { tasks } from "@/db/schema";
import { eq } from "drizzle-orm";

export const taskRoutes = new Hono();

const createTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: z.enum(["todo", "in_progress", "done"]).optional(),
});

taskRoutes.get("/", async (c) => {
  const allTasks = await db.select().from(tasks);
  return c.json(allTasks);
});

taskRoutes.post("/", zValidator("json", createTaskSchema), async (c) => {
  const body = c.req.valid("json");
  const [task] = await db.insert(tasks).values(body).returning();
  if (!task) {
    return c.json({ error: "Failed to create task" }, 500);
  }
  return c.json(task, 201);
});

taskRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");
  const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
  if (!task) {
    return c.json({ error: "Task not found" }, 404);
  }
  return c.json(task);
});

taskRoutes.patch("/:id", zValidator("json", updateTaskSchema), async (c) => {
  const id = c.req.param("id");
  const body = c.req.valid("json");
  const [task] = await db
    .update(tasks)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(tasks.id, id))
    .returning();
  if (!task) {
    return c.json({ error: "Task not found" }, 404);
  }
  return c.json(task);
});

taskRoutes.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const [task] = await db
    .delete(tasks)
    .where(eq(tasks.id, id))
    .returning();
  if (!task) {
    return c.json({ error: "Task not found" }, 404);
  }
  return c.json({ success: true });
});
