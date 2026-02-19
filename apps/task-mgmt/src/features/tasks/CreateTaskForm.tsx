import { useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Textarea,
} from "@allmyapps/ui";
import { taskClient } from "./client";

type CreateTaskFormProps = {
  onCreated: () => void;
};

export function CreateTaskForm({ onCreated }: CreateTaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const trimmedDesc = description.trim();
      await taskClient.createTask({
        title: trimmedTitle,
        ...(trimmedDesc !== "" ? { description: trimmedDesc } : {}),
      });
      setTitle("");
      setDescription("");
      onCreated();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "タスクの作成に失敗しました",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>新しいタスク</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
          <Input
            placeholder="タイトル（必須）"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <Textarea
            placeholder="説明（任意）"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
          {error !== null && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting || title.trim() === ""}
            >
              {isSubmitting ? "追加中..." : "タスクを追加"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
