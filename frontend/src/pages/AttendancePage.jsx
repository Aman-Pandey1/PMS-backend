import { useEffect, useRef, useState } from 'react';

export default function AttendancePage() {
	const [checkedIn, setCheckedIn] = useState(false);
	const [report, setReport] = useState('');
	const [recent, setRecent] = useState([]);
	const [elapsed, setElapsed] = useState(0);
	const [coords, setCoords] = useState(null);
	const timerRef = useRef(null);
	const startRef = useRef(null);

	useEffect(() => {
		(async () => {
			try {
				const { getMyAttendance } = await import('../services/attendance.js');
				const list = await getMyAttendance();
				setRecent(list);
				const today = list.find(r => r.status === 'OPEN');
				if (today) {
					setCheckedIn(true);
					startRef.current = new Date(today.checkInAt).getTime();
					startTimer();
				}
			} catch {}
		})();
		return () => stopTimer();
	}, []);

	function startTimer() {
		stopTimer();
		timerRef.current = setInterval(() => {
			const base = startRef.current || Date.now();
			setElapsed(Math.floor((Date.now() - base) / 1000));
		}, 1000);
	}
	function stopTimer() {
		if (timerRef.current) clearInterval(timerRef.current);
	}

	async function toggle() {
		try {
			const pos = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject));
			const { longitude, latitude } = pos.coords;
			setCoords({ longitude, latitude });
			if (!checkedIn) {
				await (await import('../services/attendance.js')).checkIn(longitude, latitude);
				setCheckedIn(true);
				startRef.current = Date.now();
				startTimer();
			} else {
				await (await import('../services/attendance.js')).checkOut(report, longitude, latitude);
				setCheckedIn(false);
				setReport('');
				stopTimer();
			}
			const { getMyAttendance } = await import('../services/attendance.js');
			setRecent(await getMyAttendance());
		} catch (e) {
			alert('Action failed');
		}
	}

	function format(sec) {
		const h = String(Math.floor(sec/3600)).padStart(2,'0');
		const m = String(Math.floor((sec%3600)/60)).padStart(2,'0');
		const s = String(sec%60).padStart(2,'0');
		return `${h}:${m}:${s}`;
	}

	return (
		<div className="space-y-4">
			<h1 className="text-2xl font-bold">Attendance</h1>
			<div className="flex items-center gap-4">
				<button className="bg-amber-700 hover:bg-amber-800 text-white px-3 py-2 rounded" onClick={toggle} disabled={checkedIn && !report && elapsed>0 && false}>{checkedIn ? 'Check out' : 'Check in'}</button>
				{checkedIn && <div className="text-amber-900 font-mono">Timer: {format(elapsed)}</div>}
				{coords && <div className="text-sm opacity-70">Location: {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}</div>}
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