import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

const DEFAULT_TASK_LABELS = [
	'Total No. of Calls',
	'No. of Follow-up',
	'Total Target of This month',
	'No. of Meeting Scheduled Tomorrow (brief in detail)',
	'Target Achieved',
	'Target Pending',
	'Planned tasks',
];

function productiveHours(checkInAt, checkOutAt) {
	if (!checkInAt || !checkOutAt) return { hrs: 0, min: 0 };
	const a = new Date(checkInAt).getTime();
	const b = new Date(checkOutAt).getTime();
	const sec = Math.max(0, Math.floor((b - a) / 1000));
	return { hrs: Math.floor(sec / 3600), min: Math.floor((sec % 3600) / 60) };
}

export default function WorkReportsPage() {
	const { user } = useAuth();
	const today = new Date().toISOString().slice(0, 10);
	const [start, setStart] = useState(today);
	const [end, setEnd] = useState(today);
	const [items, setItems] = useState([]);
	const [errMsg, setErrMsg] = useState('');
	const [companies, setCompanies] = useState([]);
	const [companyId, setCompanyId] = useState('');
	const [employees, setEmployees] = useState([]);
	const [userId, setUserId] = useState('');
	const [employeeQuery, setEmployeeQuery] = useState('');
	const [page, setPage] = useState(1);
	const pageSize = 5;

	async function load() {
		try {
			setErrMsg('');
			const { getCompanyAttendance } = await import('../services/attendance.js');
			const params = {};
			if (start) params.start = start;
			if (end) params.end = end;
			if (user?.role === 'SUPER_ADMIN' && companyId) params.companyId = companyId;
			if (userId) params.userId = userId;
			if (user?.role === 'SUPER_ADMIN' && !companyId) {
				setItems([]);
				setErrMsg('Select a company');
				return;
			}
			const data = await getCompanyAttendance(params);
			setItems(data);
			setPage(1);
		} catch (e) {
			setErrMsg(e?.response?.data?.error || 'Failed to load work reports');
		}
	}

	useEffect(() => {
		load().catch(() => {});
	}, [companyId]);

	useEffect(() => {
		(async () => {
			if (user?.role === 'SUPER_ADMIN') {
				try {
					const { listCompanies } = await import('../services/companies.js');
					setCompanies(await listCompanies());
				} catch {}
			}
		})();
	}, [user?.role]);

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
					const { getCompanyAttendance } = await import('../services/attendance.js');
					const data = await getCompanyAttendance({ start, end });
					const seen = new Map();
					for (const r of data || []) {
						const uid = r.user?._id || r.user?.id || r.userId;
						const id = typeof uid === 'string' ? uid : uid?.toString?.();
						const name = r.user?.fullName || String(r.userId).slice(-6);
						if (id && !seen.has(id)) seen.set(id, { id, fullName: name });
					}
					setEmployees(Array.from(seen.values()));
				}
			} catch {}
		})();
	}, [user?.role, companyId, start, end]);

	const filtered = items.filter((r) => {
		if (employeeQuery && !(r.user?.fullName || '').toLowerCase().includes(employeeQuery.toLowerCase())) return false;
		return true;
	});
	const withReport = filtered.filter((r) => r.dailyReport?.submitted || r.dailyReport?.text || (Array.isArray(r.dailyReport?.tasks) && r.dailyReport.tasks.length));
	const totalPages = Math.max(1, Math.ceil(withReport.length / pageSize));
	const paged = withReport.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);

	return (
		<div className="space-y-4">
			<h1 className="text-2xl font-bold">Work Reports</h1>
			<p className="text-sm text-amber-900/80">HR, Company Admin aur Supervisor yahan employees ke daily work reports dekh sakte hain.</p>
			{errMsg && <div className="text-red-800 bg-red-50 border border-red-200 rounded p-2">{errMsg}</div>}
			<div className="flex gap-2 items-end flex-wrap">
				{user?.role === 'SUPER_ADMIN' && (
					<div>
						<label className="block text-sm text-amber-900">Company</label>
						<select value={companyId} onChange={(e) => setCompanyId(e.target.value)} className="border border-amber-300 rounded px-3 py-2">
							<option value="">Select company</option>
							{companies.map((c) => (
								<option key={c.id} value={c.id}>{c.name} ({c.code})</option>
							))}
						</select>
					</div>
				)}
				{(user?.role === 'COMPANY_ADMIN' || (user?.role === 'SUPER_ADMIN' && companyId) || user?.role === 'SUPERVISOR') && (
					<div>
						<label className="block text-sm text-amber-900">Employee</label>
						<select value={userId} onChange={(e) => setUserId(e.target.value)} className="border border-amber-300 rounded px-3 py-2">
							<option value="">All employees</option>
							{employees.map((u) => (
								<option key={u.id} value={u.id}>{u.fullName || u.email || u.id}</option>
							))}
						</select>
					</div>
				)}
				<div>
					<label className="block text-sm text-amber-900">Employee name</label>
					<input value={employeeQuery} onChange={(e) => setEmployeeQuery(e.target.value)} className="border border-amber-300 rounded px-3 py-2" placeholder="Search name" />
				</div>
				<div>
					<label className="block text-sm text-amber-900">Start</label>
					<input type="date" className="border border-amber-300 rounded px-3 py-2" value={start} onChange={(e) => setStart(e.target.value)} />
				</div>
				<div>
					<label className="block text-sm text-amber-900">End</label>
					<input type="date" className="border border-amber-300 rounded px-3 py-2" value={end} onChange={(e) => setEnd(e.target.value)} />
				</div>
				<button onClick={load} className="bg-amber-700 hover:bg-amber-800 text-white rounded px-4 py-2">Filter</button>
			</div>

			<div className="space-y-6">
				{withReport.length === 0 && (
					<div className="text-amber-700 bg-amber-50 border border-amber-200 rounded p-4">Selected period mein koi submitted work report nahi mila.</div>
				)}
				{paged.map((r) => {
					const ph = productiveHours(r.checkInAt, r.checkOutAt);
					const tasks = Array.isArray(r.dailyReport?.tasks) && r.dailyReport.tasks.length
						? r.dailyReport.tasks
						: DEFAULT_TASK_LABELS.map((task) => ({ task, note: '' }));
					return (
						<div key={r._id} className="border border-amber-300 rounded overflow-hidden bg-white">
							<div className="bg-green-100 text-green-900 font-medium px-3 py-2 border-b border-green-200">Work Report</div>
							<table className="w-full border-collapse text-sm">
								<tbody>
									<tr className="border-b border-amber-100">
										<td className="p-2 border-r border-amber-100 bg-amber-50/50 w-48">Employee Name</td>
										<td className="p-2">{r.user?.fullName || r.userId || '—'}</td>
										<td className="p-2 border-r border-amber-100 bg-amber-50/50 w-48">Check In</td>
										<td className="p-2">{r.checkInAt ? new Date(r.checkInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
									</tr>
									<tr className="border-b border-amber-100">
										<td className="p-2 border-r border-amber-100 bg-amber-50/50">Employee Designation</td>
										<td className="p-2">{r.user?.jobPosition || '—'}</td>
										<td className="p-2 border-r border-amber-100 bg-amber-50/50">Check Out</td>
										<td className="p-2">{r.checkOutAt ? new Date(r.checkOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
									</tr>
									<tr className="border-b border-amber-100">
										<td className="p-2 border-r border-amber-100 bg-amber-50/50">Date of Report</td>
										<td className="p-2">{r.date ? new Date(r.date + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase() : '—'}</td>
										<td className="p-2 border-r border-amber-100 bg-amber-50/50">Total Productive Hours</td>
										<td className="p-2">{ph.hrs} hrs {ph.min} min</td>
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
									{tasks.map((row, i) => (
										<tr key={i} className="border-b border-amber-100">
											<td className="p-2 align-top">{i + 1}</td>
											<td className="p-2 align-top">{row.task || DEFAULT_TASK_LABELS[i] || '—'}</td>
											<td className="p-2">{row.note || '—'}</td>
										</tr>
									))}
								</tbody>
							</table>
							<div className="px-3 py-2 border-t border-amber-200 bg-amber-50/30">
								<label className="block text-sm font-medium text-amber-900 mb-1">Additional Note</label>
								<div className="text-sm text-amber-900">{r.dailyReport?.additionalNote || '—'}</div>
							</div>
						</div>
					);
				})}
			</div>

			{withReport.length > 0 && (
				<div className="flex justify-between items-center mt-3">
					<div className="text-sm opacity-70">Page {page} of {totalPages} ({withReport.length} reports)</div>
					<div className="flex gap-2">
						<button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="border border-amber-300 rounded px-3 py-1 disabled:opacity-50">Prev</button>
						<button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="border border-amber-300 rounded px-3 py-1 disabled:opacity-50">Next</button>
					</div>
				</div>
			)}
		</div>
	);
}
