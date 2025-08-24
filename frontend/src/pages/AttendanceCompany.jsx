import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function AttendanceCompany() {
	const { user } = useAuth();
	const [start, setStart] = useState('');
	const [end, setEnd] = useState('');
	const [items, setItems] = useState([]);

	async function load() {
		const { getCompanyAttendance } = await import('../services/attendance.js');
		const params = {};
		if (start) params.start = start;
		if (end) params.end = end;
		setItems(await getCompanyAttendance(params));
	}

	useEffect(() => { load().catch(console.error); }, []);

	return (
		<div className="space-y-4">
			<h1 className="text-2xl font-bold">Company Attendance</h1>
			<div className="flex gap-2 items-end">
				<div>
					<label className="block text-sm text-amber-900">Start</label>
					<input type="date" className="border border-amber-300 rounded px-3 py-2" value={start} onChange={(e)=>setStart(e.target.value)} />
				</div>
				<div>
					<label className="block text-sm text-amber-900">End</label>
					<input type="date" className="border border-amber-300 rounded px-3 py-2" value={end} onChange={(e)=>setEnd(e.target.value)} />
				</div>
				<button onClick={load} className="bg-amber-700 hover:bg-amber-800 text-white rounded px-4 py-2">Filter</button>
			</div>
			<div className="overflow-x-auto bg-white border border-amber-300 rounded">
				<table className="min-w-[900px] w-full">
					<thead>
						<tr className="bg-amber-50 text-amber-900">
							<th className="text-left p-2 border-b border-amber-200">User</th>
							<th className="text-left p-2 border-b border-amber-200">Date</th>
							<th className="text-left p-2 border-b border-amber-200">Check-in</th>
							<th className="text-left p-2 border-b border-amber-200">Check-out</th>
							<th className="text-left p-2 border-b border-amber-200">Check-in Location</th>
							<th className="text-left p-2 border-b border-amber-200">Check-out Location</th>
							<th className="text-left p-2 border-b border-amber-200">Report</th>
						</tr>
					</thead>
					<tbody>
						{items.map((r) => (
							<tr key={r._id}>
								<td className="p-2 border-t border-amber-100">{r.user?.fullName || r.userId}</td>
								<td className="p-2 border-t border-amber-100">{r.date}</td>
								<td className="p-2 border-t border-amber-100">{r.checkInAt ? new Date(r.checkInAt).toLocaleString() : '-'}</td>
								<td className="p-2 border-t border-amber-100">{r.checkOutAt ? new Date(r.checkOutAt).toLocaleString() : '-'}</td>
								<td className="p-2 border-t border-amber-100">{r.checkInLocation?.coordinates ? (<a className="text-amber-800 underline" target="_blank" href={`https://maps.google.com/?q=${r.checkInLocation.coordinates[1]},${r.checkInLocation.coordinates[0]}`}>{r.checkInLocation.coordinates.join(', ')}</a>) : '-'}</td>
								<td className="p-2 border-t border-amber-100">{r.checkOutLocation?.coordinates ? (<a className="text-amber-800 underline" target="_blank" href={`https://maps.google.com/?q=${r.checkOutLocation.coordinates[1]},${r.checkOutLocation.coordinates[0]}`}>{r.checkOutLocation.coordinates.join(', ')}</a>) : '-'}</td>
								<td className="p-2 border-t border-amber-100">{r.dailyReport?.text || '-'}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}