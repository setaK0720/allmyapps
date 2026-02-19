import { useCallback, useEffect, useState } from "react";
import { Button } from "@allmyapps/ui";
import type { Task, TaskStatus } from "@allmyapps/api-client";
import { taskClient } from "./client";
import { TaskCard } from "./TaskCard";
import { CreateTaskForm } from "./CreateTaskForm";

type StatusFilter = "all" | TaskStatus;

const FILTER_LABELS: Record<StatusFilter, string> = {
  all: "すべて",
  todo: "未着手",
  in_progress: "進行中",
  done: "完了",
};

const FILTERS: StatusFilter[] = ["all", "todo", "in_progress", "done"];

export function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await taskClient.listTasks(
        statusFilter !== "all" ? { status: statusFilter } : undefined,
      );
      setTasks(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "タスクの取得に失敗しました",
      );
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  return (
    <div>
      {/* フィルタボタン */}
      <div className="mb-6 flex gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f}
            variant={statusFilter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(f)}
          >
            {FILTER_LABELS[f]}
          </Button>
        ))}
      </div>

      {/* 新規タスク作成フォーム */}
      <CreateTaskForm onCreated={() => void loadTasks()} />

      {/* タスク一覧 */}
      {isLoading ? (
        <p className="text-muted-foreground">読み込み中...</p>
      ) : error !== null ? (
        <p className="text-destructive">{error}</p>
      ) : tasks.length === 0 ? (
        <p className="text-muted-foreground">タスクがありません</p>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onUpdated={() => void loadTasks()}
              onDeleted={() => void loadTasks()}
            />
          ))}
        </div>
      )}
    </div>
  );
}
