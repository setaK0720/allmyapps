import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";

beforeEach(() => {
  // TaskBoard がマウント時に fetch するためモックが必要
  vi.stubGlobal(
    "fetch",
    vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify([]), { status: 200 }),
    ),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("App", () => {
  it("ヘッダーにタイトルを表示する", () => {
    render(<App />);
    expect(
      screen.getByRole("heading", { name: "Task Management" }),
    ).toBeDefined();
  });
});
