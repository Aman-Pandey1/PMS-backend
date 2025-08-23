import { useEffect, useState } from 'react';

export default function TasksPage() {
	const [tasks, setTasks] = useState([]);

	useEffect(() => {
		(async () => {
			const items = await (await import('../services/tasks.js')).tasksAssignedToMe();
			setTasks(items.map((i) => ({ id: i._id || i.id, description: i.description, status: i.status })));
		})();
	}, []);

	async function advance(id) {
		const t = tasks.find((x) => x.id === id);
		if (!t) return;
		const next = t.status === 'OPEN' ? 'IN_PROGRESS' : 'DONE';
		await (await import('../services/tasks.js')).updateTask(id, { status: next });
		setTasks((ts) => ts.map((row) => row.id === id ? { ...row, status: next } : row));
	}

	return (
		<div className="space-y-4">
			<h1 className="text-2xl font-bold">Tasks</h1>
			<div className="grid gap-2">
				{tasks.map(t => (
					<div key={t.id} className="border border-amber-300 rounded p-3 bg-white flex items-center justify-between">
						<div>
							<div className="font-medium text-amber-900">{t.description}</div>
							<div className="text-sm opacity-70">{t.status}</div>
						</div>
						{t.status !== 'DONE' && (
							<button className="bg-amber-700 hover:bg-amber-800 text-white px-3 py-2 rounded" onClick={() => advance(t.id)}>Advance</button>
						)}
					</div>
				))}
			</div>
		</div>
	);
}