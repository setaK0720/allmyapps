import type { Task, NewTask, TaskStatus, UpdateTask } from "./types/task";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

export type TaskClient = {
  listTasks(options?: { status?: TaskStatus }): Promise<Task[]>;
  createTask(data: NewTask): Promise<Task>;
  getTask(id: string): Promise<Task>;
  updateTask(id: string, data: UpdateTask): Promise<Task>;
  deleteTask(id: string): Promise<void>;
};

/**
 * タスク API クライアントを生成する。
 * @param baseUrl - API サーバーのベース URL（デフォルト: ""）。
 *                  Vite dev proxy を使う場合は "" のまま /api に proxy させる。
 */
export function createTaskClient(baseUrl = ""): TaskClient {
  const base = `${baseUrl}/api/tasks`;

  return {
    async listTasks(options) {
      const params = new URLSearchParams();
      if (options?.status !== undefined) {
        params.set("status", options.status);
      }
      const query = params.size > 0 ? `?${params.toString()}` : "";
      const res = await fetch(`${base}${query}`);
      return handleResponse<Task[]>(res);
    },

    async createTask(data) {
      const res = await fetch(base, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return handleResponse<Task>(res);
    },

    async getTask(id) {
      const res = await fetch(`${base}/${id}`);
      return handleResponse<Task>(res);
    },

    async updateTask(id, data) {
      const res = await fetch(`${base}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return handleResponse<Task>(res);
    },

    async deleteTask(id) {
      const res = await fetch(`${base}/${id}`, { method: "DELETE" });
      await handleResponse<unknown>(res);
    },
  };
}
