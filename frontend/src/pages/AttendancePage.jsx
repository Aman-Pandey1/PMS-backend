import { useEffect, useState } from 'react';

export default function AttendancePage() {
	const [checkedIn, setCheckedIn] = useState(false);
	const [report, setReport] = useState('');
	const [recent, setRecent] = useState([]);

	useEffect(() => {
		(async () => {
			try {
				const { getMyAttendance } = await import('../services/attendance.js');
				setRecent(await getMyAttendance());
			} catch {}
		})();
	}, []);

	async function doCheckIn() {
		const pos = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject));
		const { longitude, latitude } = pos.coords;
		await (await import('../services/attendance.js')).checkIn(longitude, latitude);
		setCheckedIn(true);
		const { getMyAttendance } = await import('../services/attendance.js');
		setRecent(await getMyAttendance());
	}

	async function doCheckOut() {
		const pos = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject));
		const { longitude, latitude } = pos.coords;
		await (await import('../services/attendance.js')).checkOut(report, longitude, latitude);
		setCheckedIn(false);
		setReport('');
		const { getMyAttendance } = await import('../services/attendance.js');
		setRecent(await getMyAttendance());
	}

	return (
		<div className="space-y-4">
			<h1 className="text-2xl font-bold">Attendance</h1>
			<div className="flex gap-2">
				<button className="bg-amber-700 hover:bg-amber-800 text-white px-3 py-2 rounded" onClick={doCheckIn} disabled={checkedIn}>Check in</button>
				<button className="bg-amber-700 hover:bg-amber-800 text-white px-3 py-2 rounded" onClick={doCheckOut} disabled={!checkedIn || !report}>Check out</button>
			</div>
			<textarea className="w-full border border-amber-300 rounded p-2" placeholder="Daily report (required to check out)" value={report} onChange={(e) => setReport(e.target.value)} />
			<div className="text-sm opacity-70">Status: {checkedIn ? 'Checked in' : 'Not checked in'}</div>

			<div className="bg-white border border-amber-300 rounded p-4 overflow-x-auto">
				<div className="text-amber-900 font-medium mb-3">Recent</div>
				<table className="min-w-[700px] w-full">
					<thead>
						<tr className="bg-amber-50 text-amber-900">
							<th className="text-left p-2 border-b border-amber-200">Date</th>
							<th className="text-left p-2 border-b border-amber-200">Check-in</th>
							<th className="text-left p-2 border-b border-amber-200">Check-out</th>
							<th className="text-left p-2 border-b border-amber-200">Report</th>
						</tr>
					</thead>
					<tbody>
						{recent.map((r) => (
							<tr key={r._id}>
								<td className="p-2 border-t border-amber-100">{r.date}</td>
								<td className="p-2 border-t border-amber-100">{r.checkInAt ? new Date(r.checkInAt).toLocaleTimeString() : '-'}</td>
								<td className="p-2 border-t border-amber-100">{r.checkOutAt ? new Date(r.checkOutAt).toLocaleTimeString() : '-'}</td>
								<td className="p-2 border-t border-amber-100">{r.dailyReport?.text || '-'}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}