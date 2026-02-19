import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "@/db/client";
import { tasks } from "@/db/schema";
import { eq } from "drizzle-orm";

export const taskRoutes = new Hono();

const taskStatusSchema = z.enum(["todo", "in_progress", "done"]);

const listTasksQuerySchema = z.object({
  status: taskStatusSchema.optional(),
});

const createTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
});

// minProperties: 1 を表現するため refine で最低1フィールドを要求する
const updateTaskSchema = z
  .object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().nullable().optional(),
    status: taskStatusSchema.optional(),
  })
  .refine(
    (v) =>
      v.title !== undefined ||
      v.description !== undefined ||
      v.status !== undefined,
    { message: "At least one field must be provided" },
  );

taskRoutes.get("/", zValidator("query", listTasksQuerySchema), async (c) => {
  const { status } = c.req.valid("query");
  const result = await (status
    ? db.select().from(tasks).where(eq(tasks.status, status))
    : db.select().from(tasks));
  return c.json(result);
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
