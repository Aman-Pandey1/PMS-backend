import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function TaskAssign() {
	const { user } = useAuth();
	const [query, setQuery] = useState('');
	const [options, setOptions] = useState([]);
	const [assigneeId, setAssigneeId] = useState('');
	const [projectName, setProjectName] = useState('');
	const [description, setDescription] = useState('');
	const [startDate, setStartDate] = useState('');
	const [deadline, setDeadline] = useState('');
	const [priority, setPriority] = useState('MEDIUM');
	const [remarks, setRemarks] = useState('');
	const [errors, setErrors] = useState({});

	useEffect(() => {
		const id = setTimeout(async () => {
			if (query.trim().length < 2) { setOptions([]); return; }
			try {
				if (user?.role === 'SUPERVISOR') {
					const { mySubordinates } = await import('../services/users.js');
					const all = await mySubordinates();
					const filtered = all
						.filter(u => (u.fullName?.toLowerCase().includes(query.toLowerCase()) || u.email?.toLowerCase().includes(query.toLowerCase())))
						.map(u => ({ ...u, role: 'EMPLOYEE' }));
					setOptions(filtered);
				} else {
					const { searchUsers } = await import('../services/users.js');
					const found = await searchUsers(query);
					// company admin and above: list only employees
					setOptions(found.filter(u => u.role ? u.role === 'EMPLOYEE' : true));
				}
			} catch {}
		}, 250);
		return () => clearTimeout(id);
	}, [query, user?.role]);

	async function submit(e) {
		e.preventDefault();
		const errs = {};
		if (!assigneeId) errs.assigneeId = 'Select employee';
		if (projectName.trim().length < 2) errs.projectName = 'Project name required';
		if (description.trim().length < 5) errs.description = 'Description min 5 chars';
		if (deadline && startDate && new Date(deadline) < new Date(startDate)) errs.deadline = 'Deadline after start';
		setErrors(errs);
		if (Object.keys(errs).length) return;
		try {
			const { createTask } = await import('../services/tasks.js');
			await createTask({ assigneeId, projectName, description, startDate: startDate || undefined, deadline: deadline || undefined, priority, remarks });
			alert('Task assigned');
			setAssigneeId(''); setProjectName(''); setDescription(''); setStartDate(''); setDeadline(''); setPriority('MEDIUM'); setRemarks(''); setQuery(''); setOptions([]);
		} catch (e) { alert('Failed to assign task'); }
	}

	return (
		<div className="space-y-4">
			<h1 className="text-2xl font-bold">Assign Task</h1>
			<form onSubmit={submit} className="grid md:grid-cols-2 gap-3 bg-white border border-amber-300 rounded p-4">
				<div className="md:col-span-2">
					<label className="block text-sm mb-1 text-amber-900">Employee</label>
					<input className={"w-full border rounded px-3 py-2 " + (errors.assigneeId ? 'border-red-500' : 'border-amber-300')} placeholder="Type name or email" value={query} onChange={(e)=>setQuery(e.target.value)} />
					{options.length > 0 && (
						<div className="mt-1 border border-amber-300 rounded bg-white max-h-48 overflow-auto">
							{options.map(o => (
								<div key={o.id} onClick={()=>{ setAssigneeId(o.id); setQuery(`${o.fullName} (${o.email})`); setOptions([]); }} className="px-3 py-2 hover:bg-amber-50 cursor-pointer">{o.fullName} <span className="opacity-70">({o.email})</span></div>
							))}
						</div>
					)}
					{errors.assigneeId && <div className="text-xs text-red-600 mt-1">{errors.assigneeId}</div>}
				</div>
				<div>
					<label className="block text-sm mb-1 text-amber-900">Project Name</label>
					<input className={"w-full border rounded px-3 py-2 " + (errors.projectName ? 'border-red-500' : 'border-amber-300')} value={projectName} onChange={(e)=>setProjectName(e.target.value)} />
					{errors.projectName && <div className="text-xs text-red-600 mt-1">{errors.projectName}</div>}
				</div>
				<div>
					<label className="block text-sm mb-1 text-amber-900">Priority</label>
					<select value={priority} onChange={(e)=>setPriority(e.target.value)} className="w-full border border-amber-300 rounded px-3 py-2">
						<option value="LOW">LOW</option>
						<option value="MEDIUM">MEDIUM</option>
						<option value="HIGH">HIGH</option>
						<option value="CRITICAL">CRITICAL</option>
					</select>
				</div>
				<div>
					<label className="block text-sm mb-1 text-amber-900">Start Date</label>
					<input type="date" className="w-full border border-amber-300 rounded px-3 py-2" value={startDate} onChange={(e)=>setStartDate(e.target.value)} />
				</div>
				<div>
					<label className="block text-sm mb-1 text-amber-900">Deadline</label>
					<input type="date" className={"w-full border rounded px-3 py-2 " + (errors.deadline ? 'border-red-500' : 'border-amber-300')} value={deadline} onChange={(e)=>setDeadline(e.target.value)} />
					{errors.deadline && <div className="text-xs text-red-600 mt-1">{errors.deadline}</div>}
				</div>
				<div className="md:col-span-2">
					<label className="block text-sm mb-1 text-amber-900">Description</label>
					<textarea className={"w-full border rounded px-3 py-2 " + (errors.description ? 'border-red-500' : 'border-amber-300')} rows={3} value={description} onChange={(e)=>setDescription(e.target.value)} />
					{errors.description && <div className="text-xs text-red-600 mt-1">{errors.description}</div>}
				</div>
				<div className="md:col-span-2">
					<label className="block text-sm mb-1 text-amber-900">Remarks</label>
					<textarea className="w-full border border-amber-300 rounded px-3 py-2" rows={2} value={remarks} onChange={(e)=>setRemarks(e.target.value)} />
				</div>
				<div className="md:col-span-2 flex justify-end">
					<button className="bg-amber-700 hover:bg-amber-800 text-white rounded px-4 py-2">Assign</button>
				</div>
			</form>
		</div>
	);
}