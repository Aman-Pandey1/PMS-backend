import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { reverseGeocode, geocodeCache } from '../lib/geocode.js';

export default function AttendanceCompany() {
	const { user } = useAuth();
	const today = new Date().toISOString().slice(0,10);
	const [start, setStart] = useState(today);
	const [end, setEnd] = useState(today);
	const [items, setItems] = useState([]);
    const [cities, setCities] = useState({});
    const [errMsg, setErrMsg] = useState('');
    const [companies, setCompanies] = useState([]);
    const [companyId, setCompanyId] = useState('');
    const [employees, setEmployees] = useState([]);
    const [userId, setUserId] = useState('');
    const [employeeQuery, setEmployeeQuery] = useState('');
    const tableRef = useRef(null);
    const [page, setPage] = useState(1);
    const pageSize = 10;

	async function load() {
		try {
			setErrMsg('');
			const { getCompanyAttendance } = await import('../services/attendance.js');
			const params = {};
			if (start) params.start = start;
			if (end) params.end = end;
            if (user?.role === 'SUPER_ADMIN' && companyId) params.companyId = companyId;
            if (userId) params.userId = userId;
            if (user?.role === 'SUPER_ADMIN' && !companyId) { setItems([]); setErrMsg('Select a company'); return; }
			const data = await getCompanyAttendance(params);
			setItems(data);
            setPage(1);
		} catch (e) {
			setErrMsg(e?.response?.data?.error || 'Failed to load attendance');
		}
	}

	useEffect(() => { load().catch(()=>{}); }, [companyId]);
    useEffect(() => { (async ()=>{ if (user?.role === 'SUPER_ADMIN') { try { const { listCompanies } = await import('../services/companies.js'); setCompanies(await listCompanies()); } catch {} } })(); }, [user?.role]);

    // Load employees list for filters
    useEffect(() => {
        (async () => {
            try {
                if (user?.role === 'COMPANY_ADMIN') {
                    const { listUsers } = await import('../services/users.js');
                    setEmployees(await listUsers());
                } else if (user?.role === 'SUPER_ADMIN' && companyId) {
                    const { listUsers } = await import('../services/users.js');
                    setEmployees(await listUsers(companyId));
                } else if (user?.role === 'SUPERVISOR') {
                    // derive from current items (unique users seen)
                    const seen = new Map();
                    for (const r of items) {
                        const id = r.user?._id || r.user?.id || r.userId;
                        const name = r.user?.fullName || String(r.userId).slice(-6);
                        if (id && !seen.has(id)) seen.set(id, { id, fullName: name });
                    }
                    setEmployees(Array.from(seen.values()));
                }
            } catch {}
        })();
    }, [user?.role, companyId, items]);

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

    useEffect(() => {
        (async () => {
            const map = {};
            for (const r of items) {
                const inC = r.checkInLocation?.coordinates;
                if (inC && typeof inC[0] === 'number' && typeof inC[1] === 'number') {
                    const key = coordKey(inC);
                    if (key) map[key] = geocodeCache.get(key) || await reverseGeocode(inC[1], inC[0]);
                }
                const outC = r.checkOutLocation?.coordinates;
                if (outC && typeof outC[0] === 'number' && typeof outC[1] === 'number') {
                    const key = coordKey(outC);
                    if (key) map[key] = geocodeCache.get(key) || await reverseGeocode(outC[1], outC[0]);
                }
            }
            setCities(map);
        })();
    }, [items]);

    const filteredItems = items.filter(r => {
        if (employeeQuery && !(r.user?.fullName || '').toLowerCase().includes(employeeQuery.toLowerCase())) return false;
        return true;
    });
    const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
    const paged = filteredItems.slice((page-1)*pageSize, (page-1)*pageSize + pageSize);

    function downloadPdf() {
        try {
            const w = window.open('', '_blank');
            if (!w) return;
            const html = `<!doctype html><html><head><title>Attendance ${start}${end && start!==end ? ' - '+end : ''}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 16px; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; }
                    th { background: #f7e7ce; }
                    h1 { font-size: 16px; }
                </style></head><body>
                <h1>Company Attendance</h1>
                <div>Date: ${start}${end && start!==end ? ' - '+end : ''}</div>
                ${tableRef.current ? tableRef.current.outerHTML : ''}
                <script>window.onload = () => { window.print(); setTimeout(()=>window.close(), 300); };</script>
            </body></html>`;
            w.document.open();
            w.document.write(html);
            w.document.close();
        } catch {}
    }

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
                {(user?.role === 'COMPANY_ADMIN' || (user?.role === 'SUPER_ADMIN' && companyId) || user?.role === 'SUPERVISOR') && (
                    <div>
                        <label className="block text-sm text-amber-900">Employee</label>
                        <select value={userId} onChange={(e)=>setUserId(e.target.value)} className="border border-amber-300 rounded px-3 py-2">
                            <option value="">All employees</option>
                            {employees.map(u => <option key={u.id} value={u.id}>{u.fullName || u.email || u.id}</option>)}
                        </select>
                    </div>
                )}
                <div>
                    <label className="block text-sm text-amber-900">Employee name</label>
                    <input value={employeeQuery} onChange={(e)=>setEmployeeQuery(e.target.value)} className="border border-amber-300 rounded px-3 py-2" placeholder="Search name" />
                </div>
                <div>
                    <label className="block text-sm text-amber-900">Start</label>
                    <input type="date" className="border border-amber-300 rounded px-3 py-2" value={start} onChange={(e)=>setStart(e.target.value)} />
                </div>
                <div>
                    <label className="block text-sm text-amber-900">End</label>
                    <input type="date" className="border border-amber-300 rounded px-3 py-2" value={end} onChange={(e)=>setEnd(e.target.value)} />
                </div>
                <button onClick={load} className="bg-amber-700 hover:bg-amber-800 text-white rounded px-4 py-2">Filter</button>
                <button onClick={downloadPdf} className="border border-amber-300 text-amber-900 rounded px-4 py-2">Download PDF</button>
			</div>
			<div className="overflow-x-auto bg-white border border-amber-300 rounded">
				<table ref={tableRef} className="min-w-[900px] w-full">
					<thead>
						<tr className="bg-amber-50 text-amber-900">
							<th className="text-left p-2 border-b border-amber-200">User</th>
							<th className="text-left p-2 border-b border-amber-200">Date</th>
							<th className="text-left p-2 border-b border-amber-200">Check-in</th>
							<th className="text-left p-2 border-b border-amber-200">Check-out</th>
							<th className="text-left p-2 border-b border-amber-200">Check-in Location</th>
							<th className="text-left p-2 border-b border-amber-200">Check-out Location</th>
							<th className="text-left p-2 border-b border-amber-200">Report</th>
							<th className="text-left p-2 border-b border-amber-200">Status</th>
						</tr>
					</thead>
					<tbody>
                        {filteredItems.length === 0 && (
                            <tr>
                                <td colSpan={8} className="p-4 text-center text-sm opacity-70">No attendance records for the selected period.</td>
                            </tr>
                        )}
                        {paged.map((r) => (
                            <tr key={r._id} className={r.status==='FLAGGED' ? 'bg-red-50' : ''}>
                                <td className="p-2 border-t border-amber-100">{r.user?.fullName || r.userId}</td>
                                <td className="p-2 border-t border-amber-100">{r.date}</td>
                                <td className="p-2 border-t border-amber-100">{r.checkInAt ? new Date(r.checkInAt).toLocaleString() : '-'}</td>
                                <td className="p-2 border-t border-amber-100">{r.checkOutAt ? new Date(r.checkOutAt).toLocaleString() : '-'}</td>
                                <td className="p-2 border-t border-amber-100">{coordKey(r.checkInLocation?.coordinates) ? (
                                    <a className="text-amber-800 underline" target="_blank" href={`https://maps.google.com/?q=${r.checkInLocation.coordinates[1]},${r.checkInLocation.coordinates[0]}`}>
                                        {coordDisplay(r.checkInLocation.coordinates)}{cities[coordKey(r.checkInLocation.coordinates)] ? ` · ${cities[coordKey(r.checkInLocation.coordinates)]}` : ''}
                                    </a>
                                ) : '-'}</td>
                                <td className="p-2 border-t border-amber-100">{coordKey(r.checkOutLocation?.coordinates) ? (
                                    <a className="text-amber-800 underline" target="_blank" href={`https://maps.google.com/?q=${r.checkOutLocation.coordinates[1]},${r.checkOutLocation.coordinates[0]}`}>
                                        {coordDisplay(r.checkOutLocation.coordinates)}{cities[coordKey(r.checkOutLocation.coordinates)] ? ` · ${cities[coordKey(r.checkOutLocation.coordinates)]}` : ''}
                                    </a>
                                ) : '-'}</td>
                                <td className="p-2 border-t border-amber-100">{r.dailyReport?.text || '-'}</td>
                                <td className="p-2 border-t border-amber-100">
                                    {r.status === 'FLAGGED' ? <span className="text-xs bg-red-100 text-red-900 rounded px-2 py-1">OUTSIDE</span> : <span className="text-xs bg-green-100 text-green-900 rounded px-2 py-1">OK</span>}
                                </td>
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