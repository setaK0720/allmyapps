import { createTaskClient } from "@allmyapps/api-client";

// Vite のプロキシ設定により /api → task-service にルーティングされる。
// VITE_API_BASE_URL を設定すると別ホストのサービスを参照できる。
export const taskClient = createTaskClient(
  import.meta.env.VITE_API_BASE_URL ?? "",
);
