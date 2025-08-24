import { useEffect, useMemo, useState } from 'react';

export default function TasksPage() {
	const [tab, setTab] = useState('assigned'); // 'assigned' | 'created'
	const [tasksAssigned, setTasksAssigned] = useState([]);
	const [tasksCreated, setTasksCreated] = useState([]);
	const [subordinates, setSubordinates] = useState([]);
	const [loading, setLoading] = useState(false);
	const [selectedTask, setSelectedTask] = useState(null);
	const [updateText, setUpdateText] = useState('');

	// Create form state
	const [assigneeId, setAssigneeId] = useState('');
	const [description, setDescription] = useState('');
	const [deadline, setDeadline] = useState('');
	const [priority, setPriority] = useState('MEDIUM');
	const [errors, setErrors] = useState({});

	useEffect(() => {
		(async () => {
			setLoading(true);
			try {
				const svc = await import('../services/tasks.js');
				const [a, c] = await Promise.all([
					svc.tasksAssignedToMe(),
					svc.tasksCreatedByMe(),
				]);
				setTasksAssigned(a);
				setTasksCreated(c);
				try {
					const { mySubordinates } = await import('../services/users.js');
					setSubordinates(await mySubordinates());
				} catch {}
			} catch (e) {
				console.error(e);
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	async function createTask(e) {
		e.preventDefault();
		const errs = {};
		if (!assigneeId) errs.assigneeId = 'Assignee required';
		if (!description || description.length < 5) errs.description = 'Description min 5 chars';
		if (deadline && isNaN(Date.parse(deadline))) errs.deadline = 'Invalid date';
		setErrors(errs);
		if (Object.keys(errs).length) return;
		try {
			const { createTask } = await import('../services/tasks.js');
			const created = await createTask({ assigneeId, description, deadline: deadline || undefined, priority });
			setTasksCreated((prev) => [created, ...prev]);
			setAssigneeId(''); setDescription(''); setDeadline(''); setPriority('MEDIUM'); setErrors({});
			alert('Task created');
		} catch (e) {
			alert('Failed to create task');
			console.error(e);
		}
	}

	const currentTasks = useMemo(() => tab === 'assigned' ? tasksAssigned : tasksCreated, [tab, tasksAssigned, tasksCreated]);

	async function openTask(task) {
		try {
			const { getTask } = await import('../services/tasks.js');
			const full = await getTask(task._id || task.id);
			setSelectedTask(full);
			setUpdateText('');
		} catch (e) { console.error(e); }
	}

	async function postUpdate() {
		if (!selectedTask) return;
		if (!updateText.trim()) return;
		try {
			const { addTaskUpdate } = await import('../services/tasks.js');
			const updated = await addTaskUpdate(selectedTask._id || selectedTask.id, updateText.trim());
			setSelectedTask(updated);
			setUpdateText('');
		} catch (e) {
			alert('Failed to post update');
			console.error(e);
		}
	}

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold">Tasks</h1>

			{/* Create */}
			<div className="bg-white border border-amber-300 rounded p-4">
				<div className="text-amber-900 font-medium mb-3">Create Task</div>
				<form onSubmit={createTask} className="grid md:grid-cols-4 gap-3">
					<div>
						<label className="block text-sm mb-1 text-amber-900">Assignee</label>
						<select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className={"w-full border rounded px-3 py-2 " + (errors.assigneeId ? 'border-red-500' : 'border-amber-300')}>
							<option value="">Select subordinate</option>
							{subordinates.map((s) => <option key={s.id} value={s.id}>{s.fullName} ({s.email})</option>)}
						</select>
						{errors.assigneeId && <div className="text-xs text-red-600 mt-1">{errors.assigneeId}</div>}
					</div>
					<div className="md:col-span-2">
						<label className="block text-sm mb-1 text-amber-900">Description</label>
						<input value={description} onChange={(e) => setDescription(e.target.value)} className={"w-full border rounded px-3 py-2 " + (errors.description ? 'border-red-500' : 'border-amber-300')} placeholder="Describe the task" />
						{errors.description && <div className="text-xs text-red-600 mt-1">{errors.description}</div>}
					</div>
					<div>
						<label className="block text-sm mb-1 text-amber-900">Deadline</label>
						<input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={"w-full border rounded px-3 py-2 " + (errors.deadline ? 'border-red-500' : 'border-amber-300')} />
						{errors.deadline && <div className="text-xs text-red-600 mt-1">{errors.deadline}</div>}
					</div>
					<div>
						<label className="block text-sm mb-1 text-amber-900">Priority</label>
						<select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full border border-amber-300 rounded px-3 py-2">
							<option value="LOW">LOW</option>
							<option value="MEDIUM">MEDIUM</option>
							<option value="HIGH">HIGH</option>
							<option value="CRITICAL">CRITICAL</option>
						</select>
					</div>
					<div className="md:col-span-4 flex justify-end">
						<button className="bg-amber-700 hover:bg-amber-800 text-white rounded px-4 py-2">Create</button>
					</div>
				</form>
			</div>

			{/* Tabs */}
			<div className="flex gap-2">
				<button onClick={() => setTab('assigned')} className={(tab==='assigned'?'bg-amber-700 text-white':'bg-white text-amber-900') + ' border border-amber-300 rounded px-3 py-2'}>Assigned to me</button>
				<button onClick={() => setTab('created')} className={(tab==='created'?'bg-amber-700 text-white':'bg-white text-amber-900') + ' border border-amber-300 rounded px-3 py-2'}>Created by me</button>
			</div>

			{/* Table */}
			<div className="overflow-x-auto bg-white border border-amber-300 rounded">
				<table className="min-w-[700px] w-full">
					<thead>
						<tr className="bg-amber-50 text-amber-900">
							<th className="text-left p-2 border-b border-amber-200">Description</th>
							<th className="text-left p-2 border-b border-amber-200">Status</th>
							<th className="text-left p-2 border-b border-amber-200">Priority</th>
							<th className="text-left p-2 border-b border-amber-200">Deadline</th>
							<th className="text-left p-2 border-b border-amber-200">Actions</th>
						</tr>
					</thead>
					<tbody>
						{currentTasks.map((t) => (
							<tr key={t._id || t.id}>
								<td className="p-2 border-t border-amber-100">{t.description}</td>
								<td className="p-2 border-t border-amber-100">{t.status}</td>
								<td className="p-2 border-t border-amber-100">{t.priority}</td>
								<td className="p-2 border-t border-amber-100">{t.deadline ? new Date(t.deadline).toLocaleDateString() : '-'}</td>
								<td className="p-2 border-t border-amber-100">
									<button onClick={() => openTask(t)} className="text-amber-800 underline">Open</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{/* Modal */}
			{selectedTask && (
				<div className="fixed inset-0 bg-black/40 grid place-items-center p-4">
					<div className="bg-white rounded-lg border border-amber-300 max-w-2xl w-full">
						<div className="px-4 py-3 border-b border-amber-200 flex justify-between items-center bg-amber-50 text-amber-900">
							<div className="font-medium">Task</div>
							<button onClick={() => setSelectedTask(null)} className="text-amber-900">✕</button>
						</div>
						<div className="p-4 space-y-3">
							<div><span className="font-medium">Description: </span>{selectedTask.description}</div>
							<div className="grid grid-cols-2 gap-2">
								<div><span className="font-medium">Status: </span>{selectedTask.status}</div>
								<div><span className="font-medium">Priority: </span>{selectedTask.priority}</div>
								<div><span className="font-medium">Deadline: </span>{selectedTask.deadline ? new Date(selectedTask.deadline).toLocaleDateString() : '-'}</div>
							</div>
							<div>
								<div className="font-medium mb-1">Daily updates</div>
								<div className="border border-amber-200 rounded divide-y">
									{(selectedTask.updates || []).length === 0 && <div className="p-3 text-sm opacity-70">No updates yet</div>}
									{(selectedTask.updates || []).map((u, idx) => (
										<div key={idx} className="p-3 text-sm">
											<div className="opacity-70">{new Date(u.at).toLocaleString()}</div>
											<div>{u.text}</div>
										</div>
									))}
								</div>
								<div className="mt-2 flex gap-2">
									<input className="flex-1 border border-amber-300 rounded px-3 py-2" placeholder="Write update" value={updateText} onChange={(e)=>setUpdateText(e.target.value)} />
									<button onClick={postUpdate} className="bg-amber-700 hover:bg-amber-800 text-white rounded px-4 py-2">Post</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}