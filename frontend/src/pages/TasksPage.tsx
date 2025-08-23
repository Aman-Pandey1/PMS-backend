import { useState } from 'react';

type Task = { id: string; description: string; status: 'OPEN'|'IN_PROGRESS'|'DONE'; };

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', description: 'Prepare report', status: 'OPEN' },
    { id: '2', description: 'Client meeting', status: 'IN_PROGRESS' },
  ]);

  function advance(id: string) {
    setTasks((ts) => ts.map(t => t.id === id ? { ...t, status: t.status === 'OPEN' ? 'IN_PROGRESS' : 'DONE' } : t));
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