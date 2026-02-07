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
	const [cities, setCities] = useState({});
	const [userRole, setUserRole] = useState(null);
	const timerRef = useRef(null);
	const startRef = useRef(null);

	// Get user role safely
	useEffect(() => {
		try {
			const raw = localStorage.getItem('auth:user');
			if (raw) {
				const user = JSON.parse(raw);
				setUserRole(user?.role || null);
			}
		} catch (e) {
			console.error('Failed to parse user from localStorage', e);
		}
	}, []);

	useEffect(() => {
		(async () => {
			// Only fetch attendance for EMPLOYEE and SUPERVISOR roles
			if (!['EMPLOYEE', 'SUPERVISOR'].includes(userRole)) {
				return;
			}
			try {
				const { getMyAttendance } = await import('../services/attendance.js');
				const list = await getMyAttendance();
				setRecent(list || []);
				const today = list?.find(r => r.status === 'OPEN');
				if (today) {
					setCheckedIn(true);
					startRef.current = new Date(today.checkInAt).getTime();
					startTimer();
				}
			} catch (e) {
				console.error('Failed to load attendance', e);
				setRecent([]);
			}
		})();
		return () => stopTimer();
	}, [userRole]);

	// Safe coord key/display (guard against undefined/malformed coordinates)
	const coordKey = (coords) => {
		if (!Array.isArray(coords) || coords.length < 2) return null;
		const lon = coords[0], lat = coords[1];
		if (typeof lon !== 'number' || typeof lat !== 'number') return null;
		return `${lat.toFixed(4)},${lon.toFixed(4)}`;
	};
	const coordDisplay = (coords) => {
		if (!Array.isArray(coords) || coords.length < 2) return '-';
		const lon = coords[0], lat = coords[1];
		if (typeof lon !== 'number' || typeof lat !== 'number') return '-';
		return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
	};

	// Load location names for attendance records
	useEffect(() => {
		(async () => {
			const map = {};
			for (const r of recent) {
				const inC = r.checkInLocation?.coordinates;
				if (inC && typeof inC[0] === 'number' && typeof inC[1] === 'number') {
					const key = coordKey(inC);
					if (key && !map[key]) map[key] = await reverseGeocode(inC[1], inC[0]).catch(() => '');
				}
				const outC = r.checkOutLocation?.coordinates;
				if (outC && typeof outC[0] === 'number' && typeof outC[1] === 'number') {
					const key = coordKey(outC);
					if (key && !map[key]) map[key] = await reverseGeocode(outC[1], outC[0]).catch(() => '');
				}
			}
			setCities(map);
		})();
	}, [recent]);

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
				const res = await (await import('../services/attendance.js')).checkIn(longitude, latitude);
				setCheckedIn(true);
				startRef.current = Date.now();
				startTimer();
				setMsg(res?.alert ? `Checked in (Alert: ${res.alert})` : 'Checked in');
			} else {
				// Validate report before attempting check-out
				if (!report || report.trim().length === 0) {
					setErrMsg('Daily report is required to check out. Please provide a report.');
					return;
				}
				const res = await (await import('../services/attendance.js')).checkOut(report, longitude, latitude);
				setCheckedIn(false);
				setReport('');
				stopTimer();
				setMsg(res?.status === 'FLAGGED' ? 'Checked out (Alert: outside allowed location)' : 'Checked out');
			}
			const { getMyAttendance } = await import('../services/attendance.js');
			const data = await getMyAttendance();
			setRecent(data);
            setPage(1);
		} catch (e) {
			const err = e?.response?.data?.error || 'Action failed';
			setErrMsg(err);
			if (String(err).toLowerCase().includes('outside allowed')) {
				alert('You are outside the allowed location for check-in/out.');
			}
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
			{(['EMPLOYEE','SUPERVISOR'].includes(userRole)) ? (
				<>
					<div className="flex items-center gap-4">
						<button 
							className={`px-3 py-2 rounded ${checkedIn && (!report || report.trim().length === 0) 
								? 'bg-gray-400 cursor-not-allowed text-white' 
								: 'bg-amber-700 hover:bg-amber-800 text-white'}`} 
							onClick={toggle} 
							disabled={checkedIn && (!report || report.trim().length === 0)}
						>
							{checkedIn ? 'Check out' : 'Check in'}
						</button>
						{checkedIn && <div className="text-amber-900 font-mono">Timer: {format(elapsed)}</div>}
						{coords && <div className="text-sm opacity-70">Location: {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}{city?` · ${city}`:''}</div>}
					</div>
					<div>
						<textarea 
							className="w-full border border-amber-300 rounded p-2" 
							placeholder="Daily report (required to check out)" 
							value={report} 
							onChange={(e) => setReport(e.target.value)}
							required
							minLength={1}
						/>
						{checkedIn && (!report || report.trim().length === 0) && (
							<div className="text-red-600 text-sm mt-1">⚠️ Daily report is required to check out</div>
						)}
					</div>
					<div className="text-sm opacity-70">Status: {checkedIn ? 'Checked in' : 'Not checked in'}</div>
				</>
			) : (
				<div className="text-sm opacity-70">Admins can view company attendance under Work → Company Attendance.</div>
			)}

			<div className="bg-white border border-amber-300 rounded p-4 overflow-x-auto">
				<div className="text-amber-900 font-medium mb-3">Recent</div>
				<table className="min-w-[900px] w-full">
					<thead>
						<tr className="bg-amber-50 text-amber-900">
							<th className="text-left p-2 border-b border-amber-200">Date</th>
							<th className="text-left p-2 border-b border-amber-200">Check-in</th>
							<th className="text-left p-2 border-b border-amber-200">Check-out</th>
							<th className="text-left p-2 border-b border-amber-200">Check-in Location</th>
							<th className="text-left p-2 border-b border-amber-200">Check-out Location</th>
							<th className="text-left p-2 border-b border-amber-200">Report</th>
						</tr>
					</thead>
					<tbody>
						{paged.length === 0 ? (
							<tr>
								<td colSpan="6" className="p-4 text-center text-amber-700 opacity-70">
									No attendance records found
								</td>
							</tr>
						) : (
							paged.map((r) => {
								const inCoords = r.checkInLocation?.coordinates;
								const outCoords = r.checkOutLocation?.coordinates;
								const inKey = coordKey(inCoords);
								const outKey = coordKey(outCoords);
								const inDisplay = coordDisplay(inCoords);
								const outDisplay = coordDisplay(outCoords);
								return (
									<tr key={r._id}>
										<td className="p-2 border-t border-amber-100">{r.date}</td>
										<td className="p-2 border-t border-amber-100">{r.checkInAt ? new Date(r.checkInAt).toLocaleTimeString() : '-'}</td>
										<td className="p-2 border-t border-amber-100">{r.checkOutAt ? new Date(r.checkOutAt).toLocaleTimeString() : '-'}</td>
										<td className="p-2 border-t border-amber-100">{inKey ? (
											<a className="text-amber-800 underline" target="_blank" rel="noreferrer" href={`https://maps.google.com/?q=${inCoords[1]},${inCoords[0]}`}>
												{inDisplay}{cities[inKey] ? ` · ${cities[inKey]}` : ''}
											</a>
										) : '-'}</td>
										<td className="p-2 border-t border-amber-100">{outKey ? (
											<a className="text-amber-800 underline" target="_blank" rel="noreferrer" href={`https://maps.google.com/?q=${outCoords[1]},${outCoords[0]}`}>
												{outDisplay}{cities[outKey] ? ` · ${cities[outKey]}` : ''}
											</a>
										) : '-'}</td>
										<td className="p-2 border-t border-amber-100">{r.dailyReport?.text || '-'}</td>
									</tr>
								);
							})
						)}
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