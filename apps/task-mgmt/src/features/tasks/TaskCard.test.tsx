import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TaskCard } from "./TaskCard";
import type { Task } from "@allmyapps/api-client";

const mockTask: Task = {
  id: "abc",
  title: "テストタスク",
  description: "テストの説明",
  status: "todo",
  createdAt: "2026-02-19T00:00:00.000Z",
  updatedAt: "2026-02-19T00:00:00.000Z",
};

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn<typeof fetch>());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("TaskCard", () => {
  it("タイトルと説明を表示する", () => {
    render(
      <TaskCard task={mockTask} onUpdated={vi.fn()} onDeleted={vi.fn()} />,
    );
    expect(screen.getByText("テストタスク")).toBeDefined();
    expect(screen.getByText("テストの説明")).toBeDefined();
  });

  it("description が null の場合は説明を表示しない", () => {
    const task: Task = { ...mockTask, description: null };
    render(<TaskCard task={task} onUpdated={vi.fn()} onDeleted={vi.fn()} />);
    expect(screen.queryByText("テストの説明")).toBeNull();
  });

  it("削除ボタンをクリックすると onDeleted が呼ばれる", async () => {
    const onDeleted = vi.fn();
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true }), { status: 200 }),
    );

    render(
      <TaskCard task={mockTask} onUpdated={vi.fn()} onDeleted={onDeleted} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "タスクを削除" }));

    await waitFor(() => {
      expect(onDeleted).toHaveBeenCalledOnce();
    });
  });

  it("ステータスバッジをクリックすると onUpdated が呼ばれる", async () => {
    const onUpdated = vi.fn();
    const updatedTask: Task = { ...mockTask, status: "in_progress" };
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(updatedTask), { status: 200 }),
    );

    render(
      <TaskCard task={mockTask} onUpdated={onUpdated} onDeleted={vi.fn()} />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /ステータスを変更/ }),
    );

    await waitFor(() => {
      expect(onUpdated).toHaveBeenCalledOnce();
    });
  });
});
