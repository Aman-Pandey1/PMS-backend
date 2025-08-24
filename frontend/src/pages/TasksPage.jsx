import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function TasksPage() {
	const { user } = useAuth();
	const [tab, setTab] = useState('assigned'); // 'assigned' | 'created'
	const [tasksAssigned, setTasksAssigned] = useState([]);
	const [tasksCreated, setTasksCreated] = useState([]);
	const [subordinates, setSubordinates] = useState([]);
	const [loading, setLoading] = useState(false);
	const [selectedTask, setSelectedTask] = useState(null);
	const [updateText, setUpdateText] = useState('');
	const [updateAction, setUpdateAction] = useState('');
	const [updateNote, setUpdateNote] = useState('');
	const [updateStatus, setUpdateStatus] = useState('');
	const [updateProgress, setUpdateProgress] = useState('');
	const [filterStatus, setFilterStatus] = useState('');

	// Create form state
	const [assigneeId, setAssigneeId] = useState('');
	const [projectName, setProjectName] = useState('');
	const [description, setDescription] = useState('');
	const [startDate, setStartDate] = useState('');
	const [deadline, setDeadline] = useState('');
	const [priority, setPriority] = useState('MEDIUM');
	const [remarks, setRemarks] = useState('');
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
					if (user?.role !== 'EMPLOYEE') {
						const { listUsers } = await import('../services/users.js');
						setSubordinates(await listUsers());
					}
				} catch {}
			} catch (e) {
				console.error(e);
			} finally {
				setLoading(false);
			}
		})();
	}, [user?.role]);

	async function createTask(e) {
		e.preventDefault();
		const errs = {};
		if (!assigneeId) errs.assigneeId = 'Assignee required';
		if (!projectName || projectName.length < 2) errs.projectName = 'Project name required';
		if (!description || description.length < 5) errs.description = 'Description min 5 chars';
		if (deadline && isNaN(Date.parse(deadline))) errs.deadline = 'Invalid deadline';
		if (startDate && isNaN(Date.parse(startDate))) errs.startDate = 'Invalid start date';
		setErrors(errs);
		if (Object.keys(errs).length) return;
		try {
			const { createTask } = await import('../services/tasks.js');
			const created = await createTask({ assigneeId, projectName, description, startDate: startDate || undefined, deadline: deadline || undefined, priority, remarks });
			setTasksCreated((prev) => [created, ...prev]);
			setAssigneeId(''); setProjectName(''); setDescription(''); setStartDate(''); setDeadline(''); setPriority('MEDIUM'); setRemarks(''); setErrors({});
			alert('Task created');
		} catch (e) {
			alert('Failed to create task');
			console.error(e);
		}
	}

	const currentTasks = useMemo(() => {
		let base = tab === 'assigned' ? tasksAssigned : tasksCreated;
		if (filterStatus) base = base.filter(t => t.status === filterStatus);
		return base;
	}, [tab, tasksAssigned, tasksCreated, filterStatus]);

	async function openTask(task) {
		try {
			const { getTask } = await import('../services/tasks.js');
			const full = await getTask(task._id || task.id);
			setSelectedTask(full);
			setUpdateText(''); setUpdateAction(''); setUpdateNote(''); setUpdateStatus(''); setUpdateProgress('');
		} catch (e) { console.error(e); }
	}

	async function postUpdate() {
		if (!selectedTask) return;
		const payload = {};
		if (updateText.trim()) payload.text = updateText.trim();
		if (updateAction.trim()) payload.action = updateAction.trim();
		if (updateNote.trim()) payload.note = updateNote.trim();
		if (updateStatus) payload.status = updateStatus;
		if (updateProgress !== '' && !isNaN(Number(updateProgress))) payload.progress = Number(updateProgress);
		if (Object.keys(payload).length === 0) return;
		try {
			const { addTaskUpdate } = await import('../services/tasks.js');
			const updated = await addTaskUpdate(selectedTask._id || selectedTask.id, payload);
			setSelectedTask(updated);
			setUpdateText(''); setUpdateAction(''); setUpdateNote(''); setUpdateStatus(''); setUpdateProgress('');
		} catch (e) {
			alert('Failed to post update');
			console.error(e);
		}
	}

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold">Tasks</h1>

			{/* Create (hidden for employees) */}
			{user?.role !== 'EMPLOYEE' && (
				<div className="bg-white border border-amber-300 rounded p-4">
					<div className="text-amber-900 font-medium mb-3">Create Task</div>
					<form onSubmit={createTask} className="grid md:grid-cols-4 gap-3">
						<div className="md:col-span-2">
							<label className="block text-sm mb-1 text-amber-900">Employee</label>
							<select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className={"w-full border rounded px-3 py-2 " + (errors.assigneeId ? 'border-red-500' : 'border-amber-300')}>
								<option value="">Select employee</option>
								{subordinates.filter(s => s.role === 'EMPLOYEE').map((s) => <option key={s.id} value={s.id}>{s.fullName} ({s.email})</option>)}
							</select>
							{errors.assigneeId && <div className="text-xs text-red-600 mt-1">{errors.assigneeId}</div>}
						</div>
						<div>
							<label className="block text-sm mb-1 text-amber-900">Project</label>
							<input value={projectName} onChange={(e) => setProjectName(e.target.value)} className={"w-full border rounded px-3 py-2 " + (errors.projectName ? 'border-red-500' : 'border-amber-300')} placeholder="Project name" />
							{errors.projectName && <div className="text-xs text-red-600 mt-1">{errors.projectName}</div>}
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
						<div>
							<label className="block text-sm mb-1 text-amber-900">Start Date</label>
							<input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={"w-full border rounded px-3 py-2 " + (errors.startDate ? 'border-red-500' : 'border-amber-300')} />
							{errors.startDate && <div className="text-xs text-red-600 mt-1">{errors.startDate}</div>}
						</div>
						<div>
							<label className="block text-sm mb-1 text-amber-900">Deadline</label>
							<input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={"w-full border rounded px-3 py-2 " + (errors.deadline ? 'border-red-500' : 'border-amber-300')} />
							{errors.deadline && <div className="text-xs text-red-600 mt-1">{errors.deadline}</div>}
						</div>
						<div className="md:col-span-2">
							<label className="block text-sm mb-1 text-amber-900">Description</label>
							<textarea value={description} onChange={(e) => setDescription(e.target.value)} className={"w-full border rounded px-3 py-2 " + (errors.description ? 'border-red-500' : 'border-amber-300')} rows={2} />
							{errors.description && <div className="text-xs text-red-600 mt-1">{errors.description}</div>}
						</div>
						<div className="md:col-span-2">
							<label className="block text-sm mb-1 text-amber-900">Remarks</label>
							<textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} className="w-full border border-amber-300 rounded px-3 py-2" rows={2} />
						</div>
						<div className="md:col-span-4 flex justify-end">
							<button className="bg-amber-700 hover:bg-amber-800 text-white rounded px-4 py-2">Create</button>
						</div>
					</form>
				</div>
			)}

			{/* Filters */}
			<div className="flex gap-2 items-center">
				<div className="opacity-70 text-sm">Filter:</div>
				<select value={filterStatus} onChange={(e)=>setFilterStatus(e.target.value)} className="border border-amber-300 rounded px-2 py-1">
					<option value="">All</option>
					<option value="OPEN">OPEN</option>
					<option value="IN_PROGRESS">IN_PROGRESS</option>
					<option value="BLOCKED">BLOCKED</option>
					<option value="DONE">DONE</option>
				</select>
			</div>

			{/* Table */}
			<div className="overflow-x-auto bg-white border border-amber-300 rounded">
				<table className="min-w-[900px] w-full">
					<thead>
						<tr className="bg-amber-50 text-amber-900">
							<th className="text-left p-2 border-b border-amber-200">Project</th>
							<th className="text-left p-2 border-b border-amber-200">Description</th>
							<th className="text-left p-2 border-b border-amber-200">Status</th>
							<th className="text-left p-2 border-b border-amber-200">Priority</th>
							<th className="text-left p-2 border-b border-amber-200">Deadline</th>
							<th className="text-left p-2 border-b border-amber-200">Progress</th>
							<th className="text-left p-2 border-b border-amber-200">Actions</th>
						</tr>
					</thead>
					<tbody>
						{currentTasks.map((t) => (
							<tr key={t._id || t.id}>
								<td className="p-2 border-t border-amber-100">{t.projectName || '-'}</td>
								<td className="p-2 border-t border-amber-100">{t.description}</td>
								<td className="p-2 border-t border-amber-100">{t.status}</td>
								<td className="p-2 border-t border-amber-100">{t.priority}</td>
								<td className="p-2 border-t border-amber-100">{t.deadline ? new Date(t.deadline).toLocaleDateString() : '-'}</td>
								<td className="p-2 border-t border-amber-100">{t.progress ?? 0}%</td>
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
							<div className="grid grid-cols-2 gap-2">
								<div><span className="font-medium">Project: </span>{selectedTask.projectName || '-'}</div>
								<div><span className="font-medium">Status: </span>{selectedTask.status}</div>
								<div><span className="font-medium">Priority: </span>{selectedTask.priority}</div>
								<div><span className="font-medium">Start: </span>{selectedTask.startDate ? new Date(selectedTask.startDate).toLocaleDateString() : '-'}</div>
								<div><span className="font-medium">Deadline: </span>{selectedTask.deadline ? new Date(selectedTask.deadline).toLocaleDateString() : '-'}</div>
							</div>
							<div>
								<div className="font-medium mb-1">Daily updates</div>
								<div className="border border-amber-200 rounded divide-y">
									{(selectedTask.updates || []).length === 0 && <div className="p-3 text-sm opacity-70">No updates yet</div>}
									{(selectedTask.updates || []).map((u, idx) => (
										<div key={idx} className="p-3 text-sm">
											<div className="opacity-70">{new Date(u.at).toLocaleString()}</div>
											<div className="font-medium">{u.action || '-'}</div>
											<div>{u.note || u.text || ''}</div>
											<div className="opacity-70">{u.status || ''}{typeof u.progress === 'number' ? ` · ${u.progress}%` : ''}</div>
										</div>
									))}
								</div>
								{user?.role === 'EMPLOYEE' || user?.role === 'SUPERVISOR' || user?.role === 'COMPANY_ADMIN' ? (
									<div className="mt-2 grid md:grid-cols-5 gap-2">
										<input className="md:col-span-2 border border-amber-300 rounded px-3 py-2" placeholder="Action taken" value={updateAction} onChange={(e)=>setUpdateAction(e.target.value)} />
										<input className="md:col-span-3 border border-amber-300 rounded px-3 py-2" placeholder="Remarks / details" value={updateNote} onChange={(e)=>setUpdateNote(e.target.value)} />
										<select className="border border-amber-300 rounded px-3 py-2" value={updateStatus} onChange={(e)=>setUpdateStatus(e.target.value)}>
											<option value="">Status</option>
											<option value="OPEN">OPEN</option>
											<option value="IN_PROGRESS">IN_PROGRESS</option>
											<option value="BLOCKED">BLOCKED</option>
											<option value="DONE">DONE</option>
										</select>
										<input className="border border-amber-300 rounded px-3 py-2" placeholder="Progress %" value={updateProgress} onChange={(e)=>setUpdateProgress(e.target.value)} />
										<input className="md:col-span-5 border border-amber-300 rounded px-3 py-2" placeholder="Optional: free text" value={updateText} onChange={(e)=>setUpdateText(e.target.value)} />
										<div className="md:col-span-5 flex justify-end">
											<button onClick={postUpdate} className="bg-amber-700 hover:bg-amber-800 text-white rounded px-4 py-2">Post update</button>
										</div>
									</div>
								) : null}
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}