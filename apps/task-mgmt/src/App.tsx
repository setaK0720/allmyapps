import { TaskBoard } from "@/features/tasks/TaskBoard";

export function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="container mx-auto px-8 py-4">
          <h1 className="text-2xl font-bold">Task Management</h1>
          <p className="text-sm text-muted-foreground">
            セルフホスト型タスク管理アプリ
          </p>
        </div>
      </header>
      <main className="container mx-auto px-8 py-6">
        <TaskBoard />
      </main>
    </div>
  );
}
