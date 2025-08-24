import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { reverseGeocode, geocodeCache } from '../lib/geocode.js';

export default function AttendanceCompany() {
	const { user } = useAuth();
	const [start, setStart] = useState('');
	const [end, setEnd] = useState('');
	const [items, setItems] = useState([]);
    const [cities, setCities] = useState({});
    const [errMsg, setErrMsg] = useState('');
    const [companies, setCompanies] = useState([]);
    const [companyId, setCompanyId] = useState('');

	async function load() {
		try {
			setErrMsg('');
			const { getCompanyAttendance } = await import('../services/attendance.js');
			const params = {};
			if (start) params.start = start;
			if (end) params.end = end;
            if (user?.role === 'SUPER_ADMIN' && companyId) params.companyId = companyId;
			setItems(await getCompanyAttendance(params));
		} catch (e) {
			setErrMsg(e?.response?.data?.error || 'Failed to load attendance');
		}
	}

	useEffect(() => { load().catch(()=>{}); }, []);
    useEffect(() => { (async ()=>{ if (user?.role === 'SUPER_ADMIN') { try { const { listCompanies } = await import('../services/companies.js'); setCompanies(await listCompanies()); } catch {} } })(); }, [user?.role]);

    useEffect(() => {
        (async () => {
            const map = {};
            for (const r of items) {
                const inC = r.checkInLocation?.coordinates;
                if (inC) {
                    const [lon, lat] = inC;
                    const key = `${lat.toFixed(4)},${lon.toFixed(4)}`;
                    map[key] = geocodeCache.get(key) || await reverseGeocode(lat, lon);
                }
                const outC = r.checkOutLocation?.coordinates;
                if (outC) {
                    const [lon, lat] = outC;
                    const key = `${lat.toFixed(4)},${lon.toFixed(4)}`;
                    map[key] = geocodeCache.get(key) || await reverseGeocode(lat, lon);
                }
            }
            setCities(map);
        })();
    }, [items]);

	return (
		<div className="space-y-4">
			<h1 className="text-2xl font-bold">Company Attendance</h1>
			{errMsg && <div className="text-red-800 bg-red-50 border border-red-200 rounded p-2">{errMsg}</div>}
			<div className="flex gap-2 items-end flex-wrap">
                {user?.role === 'SUPER_ADMIN' && (
                    <div>
                        <label className="block text-sm text-amber-900">Company</label>
                        <select value={companyId} onChange={(e)=>setCompanyId(e.target.value)} className="border border-amber-300 rounded px-3 py-2">
                            <option value="">Select company</option>
                            {companies.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
                        </select>
                    </div>
                )}
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
                        {items.length === 0 && (
                            <tr>
                                <td colSpan={7} className="p-4 text-center text-sm opacity-70">No attendance records for the selected period.</td>
                            </tr>
                        )}
						{items.map((r) => (
							<tr key={r._id}>
								<td className="p-2 border-t border-amber-100">{r.user?.fullName || r.userId}</td>
								<td className="p-2 border-t border-amber-100">{r.date}</td>
								<td className="p-2 border-t border-amber-100">{r.checkInAt ? new Date(r.checkInAt).toLocaleString() : '-'}</td>
								<td className="p-2 border-t border-amber-100">{r.checkOutAt ? new Date(r.checkOutAt).toLocaleString() : '-'}</td>
								<td className="p-2 border-t border-amber-100">{r.checkInLocation?.coordinates ? (
									<a className="text-amber-800 underline" target="_blank" href={`https://maps.google.com/?q=${r.checkInLocation.coordinates[1]},${r.checkInLocation.coordinates[0]}`}>
										{(() => { const [lon, lat] = r.checkInLocation.coordinates; const key = `${lat.toFixed(4)},${lon.toFixed(4)}`; return `${lat.toFixed(4)}, ${lon.toFixed(4)}${cities[key]?` · ${cities[key]}`:''}`; })()}
									</a>
								) : '-'}</td>
								<td className="p-2 border-t border-amber-100">{r.checkOutLocation?.coordinates ? (
									<a className="text-amber-800 underline" target="_blank" href={`https://maps.google.com/?q=${r.checkOutLocation.coordinates[1]},${r.checkOutLocation.coordinates[0]}`}>
										{(() => { const [lon, lat] = r.checkOutLocation.coordinates; const key = `${lat.toFixed(4)},${lon.toFixed(4)}`; return `${lat.toFixed(4)}, ${lon.toFixed(4)}${cities[key]?` · ${cities[key]}`:''}`; })()}
									</a>
								) : '-'}</td>
								<td className="p-2 border-t border-amber-100">{r.dailyReport?.text || '-'}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}