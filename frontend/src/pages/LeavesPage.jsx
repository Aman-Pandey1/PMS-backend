import { useState } from 'react';

export default function LeavesPage() {
	const [start, setStart] = useState('');
	const [end, setEnd] = useState('');
	const [reason, setReason] = useState('');

	async function submit(e) {
		e.preventDefault();
		await (await import('../services/leaves.js')).requestLeave({ startDate: start, endDate: end, reason });
		setStart(''); setEnd(''); setReason('');
	}

	return (
		<div className="space-y-4">
			<h1 className="text-2xl font-bold">Leaves</h1>
			<form onSubmit={submit} className="grid gap-2 max-w-lg bg-white border border-amber-300 rounded p-4">
				<label className="text-sm text-amber-900">Start date</label>
				<input type="date" className="border border-amber-300 rounded px-3 py-2" value={start} onChange={(e) => setStart(e.target.value)} />
				<label className="text-sm text-amber-900">End date</label>
				<input type="date" className="border border-amber-300 rounded px-3 py-2" value={end} onChange={(e) => setEnd(e.target.value)} />
				<label className="text-sm text-amber-900">Reason</label>
				<input className="border border-amber-300 rounded px-3 py-2" placeholder="Reason" value={reason} onChange={(e) => setReason(e.target.value)} />
				<button className="bg-amber-700 hover:bg-amber-800 text-white rounded px-3 py-2">Submit</button>
			</form>
		</div>
	);
}