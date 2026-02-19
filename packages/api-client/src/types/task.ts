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
  description?: string;
  status?: TaskStatus;
}
