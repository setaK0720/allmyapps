// Task domain types
// NOTE: When specs/openapi/task-service.yaml exists, regenerate with:
//   pnpm --filter api-client generate

export type TaskStatus = "todo" | "in_progress" | "done";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

export interface NewTask {
  title: string;
  description?: string;
}

export interface UpdateTask {
  title?: string;
  // null を渡すと説明を削除する（OpenAPI スキーマ準拠）
  description?: string | null;
  status?: TaskStatus;
}
