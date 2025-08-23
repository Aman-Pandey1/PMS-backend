import { useState } from 'react';

type Task = { id: string; description: string; status: 'OPEN'|'IN_PROGRESS'|'DONE'; };

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    (async () => {
      const items = await (await import('../services/tasks')).tasksAssignedToMe();
      setTasks(items.map((i: any) => ({ id: i._id || i.id, description: i.description, status: i.status })));
    })();
  }, []);

  async function advance(id: string) {
    const t = tasks.find((x) => x.id === id);
    if (!t) return;
    const next = t.status === 'OPEN' ? 'IN_PROGRESS' : 'DONE';
    await (await import('../services/tasks')).updateTask(id, { status: next });
    setTasks((ts) => ts.map((row) => row.id === id ? { ...row, status: next } : row));
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Tasks</h1>
      <div className="grid gap-2">
        {tasks.map(t => (
          <div key={t.id} className="border rounded p-3 flex items-center justify-between">
            <div>
              <div className="font-medium">{t.description}</div>
              <div className="text-sm opacity-70">{t.status}</div>
            </div>
            {t.status !== 'DONE' && (
              <button className="bg-gray-900 text-white px-3 py-2 rounded" onClick={() => advance(t.id)}>Advance</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}