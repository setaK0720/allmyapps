import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TaskBoard } from "./TaskBoard";
import type { Task } from "@allmyapps/api-client";

const mockTask: Task = {
  id: "1",
  title: "テストタスク",
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

describe("TaskBoard", () => {
  it("タスク一覧を表示する", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify([mockTask]), { status: 200 }),
    );

    render(<TaskBoard />);

    await waitFor(() => {
      expect(screen.getByText("テストタスク")).toBeDefined();
    });
  });

  it("タスクが0件の場合メッセージを表示する", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify([]), { status: 200 }),
    );

    render(<TaskBoard />);

    await waitFor(() => {
      expect(screen.getByText("タスクがありません")).toBeDefined();
    });
  });

  it("取得エラー時にエラーメッセージを表示する", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response("Internal Server Error", { status: 500 }),
    );

    render(<TaskBoard />);

    await waitFor(() => {
      expect(screen.getByText(/失敗/)).toBeDefined();
    });
  });
});
