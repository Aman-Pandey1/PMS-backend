import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function LeavesPage() {
	const { user } = useAuth();
	const [start, setStart] = useState('');
	const [end, setEnd] = useState('');
	const [reason, setReason] = useState('');
	const [errors, setErrors] = useState({});
	const [myList, setMyList] = useState([]);
	const [companyList, setCompanyList] = useState([]);
	const [msg, setMsg] = useState('');
	const [errMsg, setErrMsg] = useState('');
    const [myPage, setMyPage] = useState(1);
    const [coPage, setCoPage] = useState(1);
    const pageSize = 10;
	// Super admin/company admin filters
	const [companies, setCompanies] = useState([]);
	const [selectedCompany, setSelectedCompany] = useState('');
	const [employees, setEmployees] = useState([]);
	const [selectedEmployee, setSelectedEmployee] = useState('');

	async function load() {
		try {
			setErrMsg('');
			const leavesSvc = await import('../services/leaves.js');
			if (user?.role === 'EMPLOYEE' || user?.role === 'SUPERVISOR') {
				setMyList(await leavesSvc.myLeaves());
			} else {
				setMyList([]);
			}
			if (user?.role === 'SUPER_ADMIN') {
				if (!selectedCompany) {
					setCompanyList([]);
					setErrMsg('Select a company');
				} else {
					const params = { companyId: selectedCompany };
					if (selectedEmployee) params.userId = selectedEmployee;
					setCompanyList(await leavesSvc.companyLeaves(params));
				}
			} else if (user?.role === 'COMPANY_ADMIN' || user?.role === 'SUPERVISOR') {
				const params = {};
				if (selectedEmployee) params.userId = selectedEmployee;
				setCompanyList(await leavesSvc.companyLeaves(params));
			}
		} catch (e) { setErrMsg(e?.response?.data?.error || 'Failed to load leaves'); }
	}

	useEffect(() => {
		load();
		const onFocus = () => load();
		window.addEventListener('focus', onFocus);
		const id = setInterval(load, 30000);
		return () => {
			window.removeEventListener('focus', onFocus);
			clearInterval(id);
		};
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user?.role]);

	useEffect(() => {
		(async () => {
			try {
				if (user?.role === 'SUPER_ADMIN' && selectedCompany) {
					const leavesSvc = await import('../services/leaves.js');
					const params = { companyId: selectedCompany };
					if (selectedEmployee) params.userId = selectedEmployee;
					setCompanyList(await leavesSvc.companyLeaves(params));
					setCoPage(1);
				}
			} catch {}
		})();
	}, [user?.role, selectedCompany, selectedEmployee]);

	async function submit(e) {
		e.preventDefault();
		setMsg(''); setErrMsg('');
		const errs = {};
		if (!start) errs.start = 'Start date required';
		if (!end) errs.end = 'End date required';
		if (start && end && new Date(start) > new Date(end)) errs.end = 'End must be after start';
		if (reason.trim().length < 4) errs.reason = 'Reason min 4 chars';
		setErrors(errs);
		if (Object.keys(errs).length) return;
		try {
			const leavesSvc = await import('../services/leaves.js');
			await leavesSvc.requestLeave({ startDate: start, endDate: end, reason });
			setStart(''); setEnd(''); setReason('');
			setMsg('Leave applied successfully');
			load();
		} catch (e) { setErrMsg(e?.response?.data?.error || 'Failed to request'); }
	}

	async function act(id, type) {
		setMsg(''); setErrMsg('');
		try {
			const leavesSvc = await import('../services/leaves.js');
			if (type === 'approve') await leavesSvc.approveLeave(id);
			if (type === 'reject') await leavesSvc.rejectLeave(id);
			setMsg(type === 'approve' ? 'Approved' : 'Rejected');
			load();
		} catch (e) { setErrMsg(e?.response?.data?.error || 'Action failed'); }
	}

    const myTotal = Math.max(1, Math.ceil(myList.length / pageSize));
    const myPaged = myList.slice((myPage-1)*pageSize, (myPage-1)*pageSize + pageSize);
    const coTotal = Math.max(1, Math.ceil(companyList.length / pageSize));
    const coPaged = companyList.slice((coPage-1)*pageSize, (coPage-1)*pageSize + pageSize);

	useEffect(() => {
		(async () => {
			try {
				if (user?.role === 'SUPER_ADMIN') {
					const { listCompanies } = await import('../services/companies.js');
					setCompanies(await listCompanies());
				}
				if (user?.role === 'COMPANY_ADMIN') {
					const { listUsers } = await import('../services/users.js');
					setEmployees(await listUsers());
				} else if (user?.role === 'SUPER_ADMIN' && selectedCompany) {
					const { listUsers } = await import('../services/users.js');
					setEmployees(await listUsers(selectedCompany));
				} else {
					setEmployees([]);
				}
			} catch {}
		})();
	}, [user?.role, selectedCompany]);

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold">Leaves</h1>
			{msg && <div className="text-green-800 bg-green-50 border border-green-200 rounded p-2">{msg}</div>}
			{errMsg && <div className="text-red-800 bg-red-50 border border-red-200 rounded p-2">{errMsg}</div>}
			<div className="grid md:grid-cols-2 gap-6">
				{(user?.role === 'EMPLOYEE' || user?.role === 'SUPERVISOR') && (
				<div className="bg-white border border-amber-300 rounded p-4">
					<div className="text-amber-900 font-medium mb-3">Apply Leave</div>
					<form onSubmit={submit} className="grid gap-2">
						<label className="text-sm text-amber-900">Start date</label>
						<input type="date" className={"border rounded px-3 py-2 " + (errors.start ? 'border-red-500' : 'border-amber-300')} value={start} onChange={(e) => setStart(e.target.value)} />
						{errors.start && <div className="text-xs text-red-600">{errors.start}</div>}
						<label className="text-sm text-amber-900">End date</label>
						<input type="date" className={"border rounded px-3 py-2 " + (errors.end ? 'border-red-500' : 'border-amber-300')} value={end} onChange={(e) => setEnd(e.target.value)} />
						{errors.end && <div className="text-xs text-red-600">{errors.end}</div>}
						<label className="text-sm text-amber-900">Reason</label>
						<input className={"border rounded px-3 py-2 " + (errors.reason ? 'border-red-500' : 'border-amber-300')} placeholder="Reason" value={reason} onChange={(e) => setReason(e.target.value)} />
						{errors.reason && <div className="text-xs text-red-600">{errors.reason}</div>}
						<button className="bg-amber-700 hover:bg-amber-800 text-white rounded px-3 py-2 mt-2">Submit</button>
					</form>
				</div>
				)}

				{(user?.role === 'EMPLOYEE' || user?.role === 'SUPERVISOR') && (
				<div className="bg-white border border-amber-300 rounded p-4 overflow-x-auto">
					<div className="text-amber-900 font-medium mb-3">My Leaves</div>
					<table className="min-w-[600px] w-full">
						<thead>
							<tr className="bg-amber-50 text-amber-900">
								<th className="text-left p-2 border-b border-amber-200">Period</th>
								<th className="text-left p-2 border-b border-amber-200">Reason</th>
								<th className="text-left p-2 border-b border-amber-200">Status</th>
							</tr>
						</thead>
						<tbody>
							{myPaged.map(l => (
								<tr key={l._id}>
									<td className="p-2 border-t border-amber-100">{l.startDate} → {l.endDate}</td>
									<td className="p-2 border-t border-amber-100">{l.reason}</td>
									<td className="p-2 border-t border-amber-100">{l.status}</td>
								</tr>
							))}
						</tbody>
					</table>
                    <div className="flex justify-between items-center mt-3">
                        <div className="text-sm opacity-70">Page {myPage} of {myTotal}</div>
                        <div className="flex gap-2">
                            <button onClick={()=>setMyPage(p=>Math.max(1,p-1))} disabled={myPage<=1} className="border border-amber-300 rounded px-3 py-1 disabled:opacity-50">Prev</button>
                            <button onClick={()=>setMyPage(p=>Math.min(myTotal,p+1))} disabled={myPage>=myTotal} className="border border-amber-300 rounded px-3 py-1 disabled:opacity-50">Next</button>
                        </div>
                    </div>
				</div>
				)}
			</div>

			{(user?.role === 'SUPER_ADMIN' || user?.role === 'COMPANY_ADMIN' || user?.role === 'SUPERVISOR') && (
				<div className="bg-white border border-amber-300 rounded p-4 overflow-x-auto">
					<div className="text-amber-900 font-medium mb-3">Company Leaves</div>
					<div className="flex gap-2 items-center mb-3">
						{user?.role === 'SUPER_ADMIN' && (
							<select value={selectedCompany} onChange={(e)=>{ setSelectedCompany(e.target.value); setSelectedEmployee(''); }} className="border border-amber-300 rounded px-2 py-1">
								<option value="">Select company</option>
								{companies.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
							</select>
						)}
						{(user?.role === 'COMPANY_ADMIN' || (user?.role === 'SUPER_ADMIN' && selectedCompany)) && (
							<select value={selectedEmployee} onChange={(e)=>setSelectedEmployee(e.target.value)} className="border border-amber-300 rounded px-2 py-1">
								<option value="">All employees</option>
								{employees.map(u => <option key={u.id} value={u.id}>{u.fullName || u.email || u.id}</option>)}
							</select>
						)}
						<button onClick={load} className="bg-amber-700 hover:bg-amber-800 text-white rounded px-3 py-1">Filter</button>
					</div>
					<table className="min-w-[800px] w-full">
						<thead>
							<tr className="bg-amber-50 text-amber-900">
								<th className="text-left p-2 border-b border-amber-200">Employee</th>
								<th className="text-left p-2 border-b border-amber-200">Period</th>
								<th className="text-left p-2 border-b border-amber-200">Reason</th>
								<th className="text-left p-2 border-b border-amber-200">Status</th>
								<th className="text-left p-2 border-b border-amber-200">Actions</th>
							</tr>
						</thead>
						<tbody>
							{coPaged.map(l => (
								<tr key={l._id}>
									<td className="p-2 border-t border-amber-100">{l.user?.fullName || l.userId}</td>
									<td className="p-2 border-t border-amber-100">{l.startDate} → {l.endDate}</td>
									<td className="p-2 border-t border-amber-100">{l.reason}</td>
									<td className="p-2 border-t border-amber-100">{l.status}</td>
									<td className="p-2 border-t border-amber-100 space-x-2">
										<button onClick={()=>act(l._id,'approve')} className="bg-amber-700 hover:bg-amber-800 text-white rounded px-3 py-1">Approve</button>
										<button onClick={()=>act(l._id,'reject')} className="border border-amber-300 text-amber-900 rounded px-3 py-1">Reject</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
                    <div className="flex justify-between items-center mt-3">
                        <div className="text-sm opacity-70">Page {coPage} of {coTotal}</div>
                        <div className="flex gap-2">
                            <button onClick={()=>setCoPage(p=>Math.max(1,p-1))} disabled={coPage<=1} className="border border-amber-300 rounded px-3 py-1 disabled:opacity-50">Prev</button>
                            <button onClick={()=>setCoPage(p=>Math.min(coTotal,p+1))} disabled={coPage>=coTotal} className="border border-amber-300 rounded px-3 py-1 disabled:opacity-50">Next</button>
                        </div>
                    </div>
				</div>
			)}
		</div>
	);
}