import { useEffect, useRef, useState } from 'react';
import { reverseGeocode } from '../lib/geocode.js';

export default function AttendancePage() {
	const [checkedIn, setCheckedIn] = useState(false);
	const [report, setReport] = useState('');
	const [recent, setRecent] = useState([]);
	const [openRecord, setOpenRecord] = useState(null); // current OPEN attendance for work report header
	const [elapsed, setElapsed] = useState(0);
	const [coords, setCoords] = useState(null);
    const [city, setCity] = useState('');
	const [msg, setMsg] = useState('');
	const [errMsg, setErrMsg] = useState('');
    const [page, setPage] = useState(1);
    const pageSize = 10;
	const [cities, setCities] = useState({});
	const [userRole, setUserRole] = useState(null);
	const [userName, setUserName] = useState('');
	const [userDesignation, setUserDesignation] = useState('');
	const [taskNotes, setTaskNotes] = useState([]); // note per row for work report
	const [additionalNote, setAdditionalNote] = useState('');
	const [loading, setLoading] = useState(false); // check-in/check-out in progress
	const timerRef = useRef(null);
	const startRef = useRef(null);

	const WORK_REPORT_TASKS = [
		'Total No. of Calls',
		'No. of Follow-up',
		'Total Target of This month',
		'No. of Meeting Scheduled Tomorrow (brief in detail)',
		'Target Achieved',
		'Target Pending',
		'Planned tasks',
	];

	// Get user role and name from auth
	useEffect(() => {
		try {
			const raw = localStorage.getItem('auth:user');
			if (raw) {
				const user = JSON.parse(raw);
				setUserRole(user?.role || null);
				setUserName(user?.fullName || user?.name || '');
				setUserDesignation(user?.jobPosition || user?.designation || '');
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
					setOpenRecord(today);
					setErrMsg(''); // clear stale "No open attendance" so banner doesn't conflict with Check out
					startRef.current = new Date(today.checkInAt).getTime();
					startTimer();
					// init task notes if not already correct length
					setTaskNotes(prev => {
						const len = WORK_REPORT_TASKS.length;
						if (prev.length !== len) return Array(len).fill('');
						return prev;
					});
				} else {
					setOpenRecord(null);
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

	function getLocationErrorMessage(apiError, forGeolocation) {
		if (forGeolocation) {
			if (apiError?.code === 1) return 'Location permission denied. Browser mein location allow karein.';
			if (apiError?.code === 2) return 'Location unavailable. Network/GPS check karein.';
			if (apiError?.code === 3) return 'Location request timeout. Dubara try karein.';
		}
		if (!apiError) return 'Action failed. Dubara try karein.';
		const lower = String(apiError).toLowerCase();
		if (lower.includes('company location not configured') || lower.includes('not configured')) return 'Company ki location abhi set nahi hai. Administrator se contact karein.';
		if (lower.includes('outside') || lower.includes('allowed location')) return 'Aap office ki allowed location se bahar hain. Check-in/check-out ke liye office aayein.';
		if (lower.includes('lon') && lower.includes('lat') || lower.includes('location')) return 'Location required. Location enable karke dubara try karein.';
		if (lower.includes('already checked in')) return 'Aap pehle se checked in hain. Check out karne ke liye neeche Check out use karein.';
		return apiError;
	}

	async function toggle() {
		setMsg(''); setErrMsg('');
		setLoading(true);
		try {
			const pos = await new Promise((resolve, reject) => {
				navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 20000, maximumAge: 60000 });
			});
			const { longitude, latitude } = pos.coords;
			setCoords({ longitude, latitude });
			reverseGeocode(latitude, longitude).then(setCity).catch(() => {});
			if (!checkedIn) {
				await (await import('../services/attendance.js')).checkIn(longitude, latitude);
				setCheckedIn(true);
				startRef.current = Date.now();
				startTimer();
				setMsg('Checked in successfully. Ab work report likh kar Check out karein.');
				try {
					const { getMyAttendance } = await import('../services/attendance.js');
					const data = await getMyAttendance();
					setRecent(data);
					setOpenRecord(data?.find(r => r.status === 'OPEN') || null);
					setPage(1);
				} catch (_) {}
			} else {
				const hasReport = (additionalNote && additionalNote.trim().length > 0) ||
					(taskNotes && taskNotes.some(n => n && String(n).trim().length > 0));
				if (!hasReport) {
					setErrMsg('Daily report required. Work report mein koi note ya Additional note likhein, phir Check out karein.');
					setLoading(false);
					return;
				}
				const workReport = {
					tasks: WORK_REPORT_TASKS.map((task, i) => ({ task, note: (taskNotes[i] || '').trim() })),
					additionalNote: (additionalNote || '').trim(),
				};
				const reportText = (additionalNote || '').trim() || 'Work report submitted';
				await (await import('../services/attendance.js')).checkOut(reportText, longitude, latitude, workReport);
				setCheckedIn(false);
				setOpenRecord(null);
				setReport('');
				setTaskNotes(Array(WORK_REPORT_TASKS.length).fill(''));
				setAdditionalNote('');
				stopTimer();
				setMsg('Checked out successfully.');
				try {
					const { getMyAttendance } = await import('../services/attendance.js');
					const data = await getMyAttendance();
					setRecent(data);
					setPage(1);
				} catch (_) {}
			}
		} catch (e) {
			// Server not running / connection refused
			if (!e?.response && (e?.message === 'Network Error' || e?.code === 'ERR_NETWORK')) {
				setErrMsg('Server connect nahi ho raha. Backend start karein: project root se "npm run dev" ya "cd server && npm run dev".');
				setLoading(false);
				return;
			}
			const apiError = e?.response?.data?.error;
			// 409 = Already checked in today → sync UI, show friendly message (no error banner)
			if (e?.response?.status === 409 && String(apiError || '').toLowerCase().includes('already checked in')) {
				setErrMsg('');
				try {
					const { getMyAttendance } = await import('../services/attendance.js');
					const data = await getMyAttendance();
					setRecent(data);
					const open = data?.find(r => r.status === 'OPEN');
					if (open) {
						setCheckedIn(true);
						setOpenRecord(open);
						startRef.current = new Date(open.checkInAt).getTime();
						startTimer();
						setTaskNotes(prev => (prev.length !== WORK_REPORT_TASKS.length ? Array(WORK_REPORT_TASKS.length).fill('') : prev));
						setMsg('Aap pehle se checked in hain. Neeche work report bhar kar Check out karein.');
					}
				} catch (_) {}
				setLoading(false);
				return;
			}
			// 404 = No open attendance → sync UI
			if (e?.response?.status === 404 && String(apiError || '').toLowerCase().includes('no open')) {
				setCheckedIn(false);
				setOpenRecord(null);
				stopTimer();
				try {
					const { getMyAttendance } = await import('../services/attendance.js');
					setRecent(await getMyAttendance());
				} catch (_) {}
			}
			const isGeolocation = e?.code !== undefined && !e?.response;
			const err = getLocationErrorMessage(apiError || (isGeolocation ? e : null), isGeolocation);
			setErrMsg(err);
		} finally {
			setLoading(false);
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
					<div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm text-amber-900">
						<strong>Location rule:</strong> Agar company ki location admin ne set ki hai (Settings → Company Location), to check-in/check-out sirf usi office location se hi hoga. Agar location set nahi hai to aap kahi se bhi check-in/check-out kar sakte hain.
					</div>
					<div className="flex items-center gap-4 flex-wrap">
						<button 
							className="px-3 py-2 rounded bg-amber-700 hover:bg-amber-800 text-white disabled:opacity-70 disabled:cursor-not-allowed"
							onClick={toggle}
							type="button"
							disabled={loading}
						>
							{loading ? 'Please wait...' : (checkedIn ? 'Check out' : 'Check in')}
						</button>
						{checkedIn && <div className="text-amber-900 font-mono">Timer: {format(elapsed)}</div>}
						{coords && typeof coords.longitude === 'number' && typeof coords.latitude === 'number' && (
							<div className="text-sm opacity-70">Location: {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}{city ? ` · ${city}` : ''}</div>
						)}
					</div>
					{checkedIn && (
						<div className="border border-amber-300 rounded overflow-hidden bg-white">
							<div className="bg-green-100 text-green-900 font-medium px-3 py-2 border-b border-green-200">Work Report Format</div>
							<table className="w-full border-collapse text-sm">
								<tbody>
									<tr className="border-b border-amber-100">
										<td className="p-2 border-r border-amber-100 bg-amber-50/50 w-48">Employee Name</td>
										<td className="p-2">{userName || '—'}</td>
										<td className="p-2 border-r border-amber-100 bg-amber-50/50 w-48">Check In</td>
										<td className="p-2">{openRecord?.checkInAt ? new Date(openRecord.checkInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
									</tr>
									<tr className="border-b border-amber-100">
										<td className="p-2 border-r border-amber-100 bg-amber-50/50">Employee Designation</td>
										<td className="p-2">{userDesignation || '—'}</td>
										<td className="p-2 border-r border-amber-100 bg-amber-50/50">Check Out</td>
										<td className="p-2">—</td>
									</tr>
									<tr className="border-b border-amber-100">
										<td className="p-2 border-r border-amber-100 bg-amber-50/50">Date of Report</td>
										<td className="p-2">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()}</td>
										<td className="p-2 border-r border-amber-100 bg-amber-50/50">Total Productive Hours</td>
										<td className="p-2">{Math.floor(elapsed / 3600)} hrs {Math.floor((elapsed % 3600) / 60)} min</td>
									</tr>
								</tbody>
							</table>
							<div className="bg-green-100 text-green-900 font-medium px-3 py-2 border-y border-green-200">Work Report</div>
							<table className="w-full border-collapse text-sm">
								<thead>
									<tr className="bg-amber-50 text-amber-900">
										<th className="p-2 border-b border-amber-200 w-12 text-left">Sno.</th>
										<th className="p-2 border-b border-amber-200 text-left">Tasks</th>
										<th className="p-2 border-b border-amber-200 text-left">Note</th>
									</tr>
								</thead>
								<tbody>
									{WORK_REPORT_TASKS.map((task, i) => (
										<tr key={i} className="border-b border-amber-100">
											<td className="p-2 align-top">{i + 1}</td>
											<td className="p-2 align-top">{task}</td>
											<td className="p-2">
												<input
													type="text"
													className="w-full border border-amber-200 rounded px-2 py-1 text-sm"
													placeholder="Note"
													value={taskNotes[i] || ''}
													onChange={(e) => setTaskNotes(prev => {
														const next = [...prev];
														while (next.length <= i) next.push('');
														next[i] = e.target.value;
														return next;
													})}
												/>
											</td>
										</tr>
									))}
								</tbody>
							</table>
							<div className="px-3 py-2 border-t border-amber-200 bg-amber-50/30">
								<label className="block text-sm font-medium text-amber-900 mb-1">Additional Note</label>
								<textarea
									className="w-full border border-amber-200 rounded p-2 text-sm min-h-[80px]"
									placeholder="Additional remarks..."
									value={additionalNote}
									onChange={(e) => setAdditionalNote(e.target.value)}
								/>
							</div>
							{(!additionalNote || !additionalNote.trim()) && (!taskNotes || !taskNotes.some(n => n && String(n).trim())) && (
								<div className="text-red-600 text-sm px-3 py-2 bg-red-50 border-t border-red-100">⚠️ Koi bhi task note ya Additional note likhein, phir Check out karein.</div>
							)}
						</div>
					)}
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