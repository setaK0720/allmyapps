import { useState } from "react";
import { Trash2 } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
} from "@allmyapps/ui";
import type { Task } from "@allmyapps/api-client";
import { taskClient } from "./client";

type TaskStatus = Task["status"];

const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "未着手",
  in_progress: "進行中",
  done: "完了",
};

// クリックで次のステータスへ循環させる
const NEXT_STATUS: Record<TaskStatus, TaskStatus> = {
  todo: "in_progress",
  in_progress: "done",
  done: "todo",
};

type StatusBadgeVariant = "secondary" | "outline" | "default";
const STATUS_VARIANT: Record<TaskStatus, StatusBadgeVariant> = {
  todo: "secondary",
  in_progress: "outline",
  done: "default",
};

type TaskCardProps = {
  task: Task;
  onUpdated: () => void;
  onDeleted: () => void;
};

export function TaskCard({ task, onUpdated, onDeleted }: TaskCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleStatusClick = async () => {
    setIsUpdating(true);
    try {
      await taskClient.updateTask(task.id, {
        status: NEXT_STATUS[task.status],
      });
      onUpdated();
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await taskClient.deleteTask(task.id);
      onDeleted();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4 p-4">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{task.title}</p>
          {task.description !== null && (
            <p className="mt-1 text-sm text-muted-foreground">
              {task.description}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {/* バッジをクリックしてステータスを循環 */}
          <button
            onClick={() => void handleStatusClick()}
            disabled={isUpdating}
            aria-label={`ステータスを変更: ${STATUS_LABEL[task.status]}`}
            className="cursor-pointer disabled:opacity-50"
          >
            <Badge variant={STATUS_VARIANT[task.status]}>
              {STATUS_LABEL[task.status]}
            </Badge>
          </button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => void handleDelete()}
            disabled={isDeleting}
            aria-label="タスクを削除"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
