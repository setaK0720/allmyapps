import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CreateTaskForm } from "./CreateTaskForm";
import type { Task } from "@allmyapps/api-client";

const mockTask: Task = {
  id: "1",
  title: "新タスク",
  description: null,
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

describe("CreateTaskForm", () => {
  it("タイトルが空のとき送信ボタンが無効", () => {
    render(<CreateTaskForm onCreated={vi.fn()} />);
    expect(screen.getByRole("button", { name: "タスクを追加" })).toBeDisabled();
  });

  it("タイトルを入力すると送信ボタンが有効になる", () => {
    render(<CreateTaskForm onCreated={vi.fn()} />);
    const input = screen.getByPlaceholderText("タイトル（必須）");
    fireEvent.change(input, { target: { value: "新タスク" } });
    expect(
      screen.getByRole("button", { name: "タスクを追加" }),
    ).not.toBeDisabled();
  });

  it("送信に成功すると onCreated が呼ばれフォームがリセットされる", async () => {
    const onCreated = vi.fn();
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(mockTask), { status: 201 }),
    );

    render(<CreateTaskForm onCreated={onCreated} />);

    const input = screen.getByPlaceholderText("タイトル（必須）");
    fireEvent.change(input, { target: { value: "新タスク" } });
    fireEvent.click(screen.getByRole("button", { name: "タスクを追加" }));

    await waitFor(() => {
      expect(onCreated).toHaveBeenCalledOnce();
    });

    // フォームがリセットされている
    expect((input as HTMLInputElement).value).toBe("");
  });

  it("送信失敗時にエラーメッセージを表示する", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response("Validation failed", { status: 422 }),
    );

    render(<CreateTaskForm onCreated={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText("タイトル（必須）"), {
      target: { value: "新タスク" },
    });
    fireEvent.click(screen.getByRole("button", { name: "タスクを追加" }));

    await waitFor(() => {
      expect(screen.getByText("Validation failed")).toBeDefined();
    });
  });
});
