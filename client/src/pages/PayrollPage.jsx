import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function PayrollPage() {
	const { user } = useAuth();
	const [tab, setTab] = useState('setup');
	const [companies, setCompanies] = useState([]);
	const [selectedCompany, setSelectedCompany] = useState('');
	const [employees, setEmployees] = useState([]);
	const [selectedEmployee, setSelectedEmployee] = useState('');
	const [designation, setDesignation] = useState('');
	const [baseSalary, setBaseSalary] = useState('');
	const [paidLeave, setPaidLeave] = useState('0');
	const [paidLeaveTypes, setPaidLeaveTypes] = useState([{ type: 'emergency', days: 0 }, { type: 'sick', days: 0 }, { type: 'vacation', days: 0 }]);
	const [effectiveFrom, setEffectiveFrom] = useState('');
	const [salaryHistory, setSalaryHistory] = useState([]);
	const [year, setYear] = useState(new Date().getFullYear());
	const [month, setMonth] = useState(new Date().getMonth()+1);
	const [monthly, setMonthly] = useState(null);
	const [msg, setMsg] = useState('');
	const [errMsg, setErrMsg] = useState('');
	const [overviewRows, setOverviewRows] = useState([]);
	const [overviewLoading, setOverviewLoading] = useState(false);

	useEffect(() => {
		(async () => {
			try {
				if (user?.role === 'SUPER_ADMIN') {
					const { listCompanies } = await import('../services/companies.js');
					setCompanies(await listCompanies());
				}
			} catch {}
		})();
	}, [user?.role]);

	useEffect(() => {
		(async () => {
			try {
				setEmployees([]);
				setSelectedEmployee('');
				if (!user?.role) return;
				const { listUsers } = await import('../services/users.js');
				if (user.role === 'COMPANY_ADMIN') {
					setEmployees(await listUsers());
				} else if (user.role === 'SUPER_ADMIN' && selectedCompany) {
					setEmployees(await listUsers(selectedCompany));
				}
			} catch {}
		})();
	}, [user?.role, selectedCompany]);

	async function loadSalaryHistory(uid) {
		try {
			const { getUserSalary } = await import('../services/payroll.js');
			setSalaryHistory(await getUserSalary(uid));
		} catch {}
	}

	useEffect(() => {
		if (selectedEmployee) loadSalaryHistory(selectedEmployee);
	}, [selectedEmployee]);

	async function saveSalary(e) {
		e.preventDefault(); setMsg(''); setErrMsg('');
		if (!selectedEmployee) { setErrMsg('Select employee'); return; }
		try {
			const { setUserSalary } = await import('../services/payroll.js');
			await setUserSalary(selectedEmployee, {
				designation,
				baseSalary: Number(baseSalary),
				paidLeavePerMonth: Number(paidLeave),
				paidLeaveTypes: paidLeaveTypes.map(p=>({ type: p.type, days: Number(p.days)||0 })),
				effectiveFrom: effectiveFrom || new Date().toISOString(),
			});
			setMsg('Salary saved');
			setDesignation(''); setBaseSalary(''); setPaidLeave('0'); setPaidLeaveTypes([{ type: 'emergency', days: 0 }, { type: 'sick', days: 0 }, { type: 'vacation', days: 0 }]); setEffectiveFrom('');
			loadSalaryHistory(selectedEmployee);
		} catch (e) { setErrMsg(e?.response?.data?.error || 'Failed to save salary'); }
	}

	async function compute() {
		setMsg(''); setErrMsg(''); setMonthly(null);
		if (!selectedEmployee) { setErrMsg('Select employee'); return; }
		try {
			const { computeMonthly } = await import('../services/payroll.js');
			setMonthly(await computeMonthly(selectedEmployee, year, month));
		} catch (e) { setErrMsg(e?.response?.data?.error || 'Failed to compute'); }
	}

	const employeePicker = (
		<div className="flex gap-2 items-center">
			{user?.role === 'SUPER_ADMIN' && (
				<select value={selectedCompany} onChange={(e)=>{ setSelectedCompany(e.target.value); setSelectedEmployee(''); }} className="border border-amber-300 rounded px-2 py-1">
					<option value="">Select company</option>
					{companies.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
				</select>
			)}
			<select value={selectedEmployee} onChange={(e)=>setSelectedEmployee(e.target.value)} className="border border-amber-300 rounded px-2 py-1">
				<option value="">Select employee</option>
				{employees.map(u => <option key={u.id} value={u.id}>{u.fullName || u.email || u.id}</option>)}
			</select>
		</div>
	);

	return (
		<div className="space-y-4">
			<h1 className="text-2xl font-bold">Payroll</h1>
			{msg && <div className="text-green-800 bg-green-50 border border-green-200 rounded p-2">{msg}</div>}
			{errMsg && <div className="text-red-800 bg-red-50 border border-red-200 rounded p-2">{errMsg}</div>}

			<div className="flex gap-2">
				<button onClick={()=>setTab('setup')} className={(tab==='setup'?'bg-amber-700 text-white':'border text-amber-900')+" rounded px-3 py-1 border-amber-300"}>Setup</button>
				<button onClick={()=>setTab('monthly')} className={(tab==='monthly'?'bg-amber-700 text-white':'border text-amber-900')+" rounded px-3 py-1 border-amber-300"}>Monthly Salary</button>
				<button onClick={()=>setTab('overview')} className={(tab==='overview'?'bg-amber-700 text-white':'border text-amber-900')+" rounded px-3 py-1 border-amber-300"}>Overview</button>
			</div>

			{tab==='setup' && (
				<div className="bg-white border border-amber-300 rounded p-4 grid gap-3">
					<div className="text-amber-900 font-medium">Set Base Salary and Paid Leave</div>
					{employeePicker}
					<form onSubmit={saveSalary} className="grid md:grid-cols-4 gap-3">
						<div>
							<label className="block text-sm mb-1 text-amber-900">Designation</label>
							<input className="w-full border border-amber-300 rounded px-3 py-2" value={designation} onChange={(e)=>setDesignation(e.target.value)} />
						</div>
						<div>
							<label className="block text-sm mb-1 text-amber-900">Base Salary (per month)</label>
							<input type="number" className="w-full border border-amber-300 rounded px-3 py-2" value={baseSalary} onChange={(e)=>setBaseSalary(e.target.value)} />
						</div>
						<div>
							<label className="block text-sm mb-1 text-amber-900">Paid Leave / Month</label>
							<input type="number" className="w-full border border-amber-300 rounded px-3 py-2" value={paidLeave} onChange={(e)=>setPaidLeave(e.target.value)} />
						</div>
						<div className="md:col-span-4 grid md:grid-cols-3 gap-3">
							{paidLeaveTypes.map((p,idx)=>(
								<div key={idx}>
									<label className="block text-sm mb-1 text-amber-900">{p.type.charAt(0).toUpperCase()+p.type.slice(1)} Leave (days)</label>
									<input type="number" className="w-full border border-amber-300 rounded px-3 py-2" value={p.days} onChange={(e)=>{
										setPaidLeaveTypes(prev=>prev.map((x,i)=> i===idx ? { ...x, days: Number(e.target.value)||0 } : x));
									}} />
								</div>
							))}
						</div>
						<div>
							<label className="block text-sm mb-1 text-amber-900">Effective From</label>
							<input type="date" className="w-full border border-amber-300 rounded px-3 py-2" value={effectiveFrom} onChange={(e)=>setEffectiveFrom(e.target.value)} />
						</div>
						<div className="md:col-span-4 flex justify-end">
							<button className="bg-amber-700 hover:bg-amber-800 text-white rounded px-4 py-2">Save</button>
						</div>
					</form>
					<div className="overflow-x-auto">
						<div className="text-amber-900 font-medium mt-2">Salary History</div>
						<table className="min-w-[700px] w-full">
							<thead>
								<tr className="bg-amber-50 text-amber-900">
									<th className="text-left p-2 border-b border-amber-200">Effective From</th>
									<th className="text-left p-2 border-b border-amber-200">Designation</th>
									<th className="text-left p-2 border-b border-amber-200">Base Salary</th>
									<th className="text-left p-2 border-b border-amber-200">Paid Leave/Month</th>
								</tr>
							</thead>
							<tbody>
								{salaryHistory.map(s => (
									<tr key={s._id}>
										<td className="p-2 border-t border-amber-100">{new Date(s.effectiveFrom).toLocaleDateString()}</td>
										<td className="p-2 border-t border-amber-100">{s.designation}</td>
										<td className="p-2 border-t border-amber-100">{s.baseSalary}</td>
										<td className="p-2 border-t border-amber-100">{s.paidLeavePerMonth ?? 0}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{tab==='monthly' && (
				<div className="bg-white border border-amber-300 rounded p-4 grid gap-3">
					<div className="text-amber-900 font-medium">Monthly Salary</div>
					{employeePicker}
					<div className="flex gap-2 items-center">
						<input type="number" className="border border-amber-300 rounded px-2 py-1 w-28" value={year} onChange={(e)=>setYear(Number(e.target.value))} />
						<select className="border border-amber-300 rounded px-2 py-1" value={month} onChange={(e)=>setMonth(Number(e.target.value))}>
							{Array.from({length:12}).map((_,i)=>(<option key={i+1} value={i+1}>{i+1}</option>))}
						</select>
						<button onClick={compute} className="bg-amber-700 hover:bg-amber-800 text-white rounded px-3 py-1">Compute</button>
					</div>
					{monthly && (
						<div className="grid md:grid-cols-3 gap-3">
							<div className="p-3 border border-amber-200 rounded">
								<div className="text-sm opacity-70">Base Salary</div>
								<div className="text-xl font-semibold">{monthly.baseSalary}</div>
							</div>
							<div className="p-3 border border-amber-200 rounded">
								<div className="text-sm opacity-70">Working Days</div>
								<div className="text-xl font-semibold">{monthly.workingDays}</div>
							</div>
							<div className="p-3 border border-amber-200 rounded">
								<div className="text-sm opacity-70">Paid Leave Allowed</div>
								<div className="text-xl font-semibold">{monthly.paidLeaveAllowed}</div>
							</div>
							<div className="p-3 border border-amber-200 rounded">
								<div className="text-sm opacity-70">Leave Days</div>
								<div className="text-xl font-semibold">{monthly.leaveDays}</div>
							</div>
							<div className="p-3 border border-amber-200 rounded">
								<div className="text-sm opacity-70">Unpaid Leave Days</div>
								<div className="text-xl font-semibold">{monthly.unpaidLeaveDays}</div>
							</div>
							<div className="p-3 border border-amber-200 rounded">
								<div className="text-sm opacity-70">Deduction</div>
								<div className="text-xl font-semibold">{monthly.deduction.toFixed(2)}</div>
							</div>
							<div className="p-3 border border-amber-200 rounded md:col-span-3">
								<div className="text-sm opacity-70">Payable</div>
								<div className="text-2xl font-bold">{monthly.payable.toFixed(2)}</div>
							</div>
							{(monthly.allowedPerType?.length || monthly.usedPerType?.length) ? (
								<div className="md:col-span-3">
									<div className="text-amber-900 font-medium mb-2">Paid Leave Breakdown</div>
									<table className="min-w-[500px] w-full">
										<thead>
											<tr className="bg-amber-50 text-amber-900">
												<th className="text-left p-2 border-b border-amber-200">Type</th>
												<th className="text-left p-2 border-b border-amber-200">Allowed</th>
												<th className="text-left p-2 border-b border-amber-200">Used</th>
											</tr>
										</thead>
										<tbody>
											{Array.from(new Set([...(monthly.allowedPerType||[]).map(x=>x.type), ...(monthly.usedPerType||[]).map(x=>x.type)])).map(t=>{
												const a=(monthly.allowedPerType||[]).find(x=>x.type===t)?.days ?? 0;
												const u=(monthly.usedPerType||[]).find(x=>x.type===t)?.days ?? 0;
												return (
												<tr key={t}>
													<td className="p-2 border-t border-amber-100">{t}</td>
													<td className="p-2 border-t border-amber-100">{a}</td>
													<td className="p-2 border-t border-amber-100">{u}</td>
												</tr>
											);
											})}
										</tbody>
									</table>
								</div>
							) : null}
						</div>
					)}
				</div>
			)}

			{tab==='overview' && (
				<div className="bg-white border border-amber-300 rounded p-4 grid gap-3">
					<div className="text-amber-900 font-medium">Overview (Monthly)</div>
					<div className="flex flex-wrap gap-2 items-center">
						{user?.role === 'SUPER_ADMIN' && (
							<select value={selectedCompany} onChange={(e)=>{ setSelectedCompany(e.target.value); setOverviewRows([]); }} className="border border-amber-300 rounded px-2 py-1">
								<option value="">Select company</option>
								{companies.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
							</select>
						)}
						<input type="number" className="border border-amber-300 rounded px-2 py-1 w-28" value={year} onChange={(e)=>setYear(Number(e.target.value))} />
						<select className="border border-amber-300 rounded px-2 py-1" value={month} onChange={(e)=>setMonth(Number(e.target.value))}>
							{Array.from({length:12}).map((_,i)=>(<option key={i+1} value={i+1}>{i+1}</option>))}
						</select>
						<button onClick={async()=>{
							setErrMsg(''); setMsg(''); setOverviewLoading(true); setOverviewRows([]);
							try {
								let list = employees;
								if (user?.role === 'SUPER_ADMIN') {
									if (!selectedCompany) { setErrMsg('Select company'); setOverviewLoading(false); return; }
									const { listUsers } = await import('../services/users.js');
									list = await listUsers(selectedCompany);
								}
								const { computeMonthly } = await import('../services/payroll.js');
								const rows = [];
								for (const u of list) {
									try {
										const r = await computeMonthly(u.id, year, month);
										const remaining = Math.max(0, Number(r.paidLeaveAllowed||0) - Math.min(Number(r.leaveDays||0), Number(r.paidLeaveAllowed||0)));
										rows.push({ id: u.id, name: u.fullName || u.email || u.id, baseSalary: r.baseSalary, paidLeaveAllowed: r.paidLeaveAllowed, leaveDays: r.leaveDays, unpaidLeaveDays: r.unpaidLeaveDays, deduction: r.deduction, payable: r.payable, remainingPaidLeave: remaining });
									} catch (e) {
										rows.push({ id: u.id, name: u.fullName || u.email || u.id, error: (e?.response?.data?.error || 'No salary set') });
									}
								}
								setOverviewRows(rows);
							} finally {
								setOverviewLoading(false);
							}
						}} className="bg-amber-700 hover:bg-amber-800 text-white rounded px-3 py-1">Compute Overview</button>
					</div>
					<div className="overflow-x-auto">
						<table className="min-w-[900px] w-full">
							<thead>
								<tr className="bg-amber-50 text-amber-900">
									<th className="text-left p-2 border-b border-amber-200">Employee</th>
									<th className="text-left p-2 border-b border-amber-200">Base Salary</th>
									<th className="text-left p-2 border-b border-amber-200">Allowed Paid</th>
									<th className="text-left p-2 border-b border-amber-200">Used</th>
									<th className="text-left p-2 border-b border-amber-200">Remaining</th>
									<th className="text-left p-2 border-b border-amber-200">Unpaid Days</th>
									<th className="text-left p-2 border-b border-amber-200">Deduction</th>
									<th className="text-left p-2 border-b border-amber-200">Payable</th>
									<th className="text-left p-2 border-b border-amber-200">Status</th>
								</tr>
							</thead>
							<tbody>
								{overviewLoading ? (
									<tr><td className="p-2" colSpan={9}>Calculating...</td></tr>
								) : (
									overviewRows.map(r => (
										<tr key={r.id}>
											<td className="p-2 border-t border-amber-100">{r.name}</td>
											<td className="p-2 border-t border-amber-100">{r.baseSalary ?? '-'}</td>
											<td className="p-2 border-t border-amber-100">{r.paidLeaveAllowed ?? '-'}</td>
											<td className="p-2 border-t border-amber-100">{r.leaveDays ?? '-'}</td>
											<td className="p-2 border-t border-amber-100">{r.remainingPaidLeave ?? '-'}</td>
											<td className="p-2 border-t border-amber-100">{r.unpaidLeaveDays ?? '-'}</td>
											<td className="p-2 border-t border-amber-100">{typeof r.deduction === 'number' ? r.deduction.toFixed(2) : '-'}</td>
											<td className="p-2 border-t border-amber-100">{typeof r.payable === 'number' ? r.payable.toFixed(2) : '-'}</td>
											<td className="p-2 border-t border-amber-100">{r.error ? r.error : 'OK'}</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				</div>
			)}
		</div>
	);
}

