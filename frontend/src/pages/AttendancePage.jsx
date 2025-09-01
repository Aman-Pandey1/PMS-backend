import { useEffect, useRef, useState } from 'react';
import { reverseGeocode } from '../lib/geocode.js';

export default function AttendancePage() {
	const [checkedIn, setCheckedIn] = useState(false);
	const [report, setReport] = useState('');
	const [recent, setRecent] = useState([]);
	const [elapsed, setElapsed] = useState(0);
	const [coords, setCoords] = useState(null);
    const [city, setCity] = useState('');
	const [msg, setMsg] = useState('');
	const [errMsg, setErrMsg] = useState('');
    const [page, setPage] = useState(1);
    const pageSize = 10;
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
		setMsg(''); setErrMsg('');
		try {
			const pos = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject));
			const { longitude, latitude } = pos.coords;
			setCoords({ longitude, latitude });
            reverseGeocode(latitude, longitude).then(setCity).catch(()=>{});
			if (!checkedIn) {
				await (await import('../services/attendance.js')).checkIn(longitude, latitude);
				setCheckedIn(true);
				startRef.current = Date.now();
				startTimer();
				setMsg('Checked in');
			} else {
				await (await import('../services/attendance.js')).checkOut(report, longitude, latitude);
				setCheckedIn(false);
				setReport('');
				stopTimer();
				setMsg('Checked out');
			}
			const { getMyAttendance } = await import('../services/attendance.js');
			const data = await getMyAttendance();
			setRecent(data);
            setPage(1);
		} catch (e) {
			setErrMsg(e?.response?.data?.error || 'Action failed');
		}
	}

	function format(sec) {
		const h = String(Math.floor(sec/3600)).padStart(2,'0');
		const m = String(Math.floor((sec%3600)/60)).padStart(2,'0');
		const s = String(sec%60).padStart(2,'0');
		return `${h}:${m}:${s}`;
	}

    const totalPages = Math.max(1, Math.ceil(recent.length / pageSize));
    const paged = recent.slice((page-1)*pageSize, (page-1)*pageSize + pageSize);

	// Super/Company admins should not see self check-in/out controls
	const isSelfAttendanceVisible = true; // keep page but we'll hide actions below

	return (
		<div className="space-y-4">
			<h1 className="text-2xl font-bold">Attendance</h1>
			{msg && <div className="text-green-800 bg-green-50 border border-green-200 rounded p-2">{msg}</div>}
			{errMsg && <div className="text-red-800 bg-red-50 border border-red-200 rounded p-2">{errMsg}</div>}
			{(window.localStorage.getItem('auth:user') ? (JSON.parse(window.localStorage.getItem('auth:user'))?.role) : '') === 'EMPLOYEE' ? (
				<>
					<div className="flex items-center gap-4">
						<button className="bg-amber-700 hover:bg-amber-800 text-white px-3 py-2 rounded" onClick={toggle} disabled={checkedIn && !report && elapsed>0 && false}>{checkedIn ? 'Check out' : 'Check in'}</button>
						{checkedIn && <div className="text-amber-900 font-mono">Timer: {format(elapsed)}</div>}
						{coords && <div className="text-sm opacity-70">Location: {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}{city?` · ${city}`:''}</div>}
					</div>
					<textarea className="w-full border border-amber-300 rounded p-2" placeholder="Daily report (required to check out)" value={report} onChange={(e) => setReport(e.target.value)} />
					<div className="text-sm opacity-70">Status: {checkedIn ? 'Checked in' : 'Not checked in'}</div>
				</>
			) : (
				<div className="text-sm opacity-70">Admins can view company attendance under Work → Company Attendance.</div>
			)}

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
						{paged.map((r) => (
							<tr key={r._id}>
								<td className="p-2 border-t border-amber-100">{r.date}</td>
								<td className="p-2 border-t border-amber-100">{r.checkInAt ? new Date(r.checkInAt).toLocaleTimeString() : '-'}</td>
								<td className="p-2 border-t border-amber-100">{r.checkOutAt ? new Date(r.checkOutAt).toLocaleTimeString() : '-'}</td>
								<td className="p-2 border-t border-amber-100">{r.dailyReport?.text || '-'}</td>
							</tr>
						))}
					</tbody>
				</table>
                <div className="flex justify-between items-center mt-3">
                    <div className="text-sm opacity-70">Page {page} of {totalPages}</div>
                    <div className="flex gap-2">
                        <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page<=1} className="border border-amber-300 rounded px-3 py-1 disabled:opacity-50">Prev</button>
                        <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page>=totalPages} className="border border-amber-300 rounded px-3 py-1 disabled:opacity-50">Next</button>
                    </div>
                </div>
			</div>
		</div>
	);
}