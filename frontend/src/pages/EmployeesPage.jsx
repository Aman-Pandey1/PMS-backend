import { useEffect, useState } from 'react';
import { listUsers, mySubordinates, createUser, setUserActive, adminSetPassword } from '../services/users.js';
import { listCompanies } from '../services/companies.js';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function EmployeesPage() {
    const { user } = useAuth();
	const [items, setItems] = useState([]);
	const [managers, setManagers] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState('');

	const [email, setEmail] = useState('');
	const [fullName, setFullName] = useState('');
	const [password, setPassword] = useState('');
	const [role, setRole] = useState('EMPLOYEE');
	const [managerId, setManagerId] = useState('');
	const [errors, setErrors] = useState({});
    const [msg, setMsg] = useState('');
    const [errMsg, setErrMsg] = useState('');
    const [pwdModalUser, setPwdModalUser] = useState(null);
    const [pwdModalValue, setPwdModalValue] = useState('');

	useEffect(() => {
		(async () => {
            setMsg(''); setErrMsg('');
			if (user?.role === 'SUPER_ADMIN') {
                listCompanies().then(setCompanies).catch(()=>{});
            }
			const load = async () => {
                if (user?.role === 'SUPER_ADMIN' && selectedCompanyId) {
                    const data = await listUsers(selectedCompanyId);
                    setItems(data);
                } else {
                    const data = await listUsers();
                    setItems(data);
                }
            };
            load().catch(console.error);
			// For simplicity, use mySubordinates as potential managers (or extend with listUsers by role SUPERVISOR)
			mySubordinates().then((subs) => setManagers(subs)).catch(()=>{});
		})();
	}, [user?.role, selectedCompanyId]);

	async function onCreate(e) {
		e.preventDefault();
        setMsg(''); setErrMsg('');
		const errs = {};
		if (!email.includes('@')) errs.email = 'Valid email required';
		if (fullName.trim().length < 3) errs.fullName = 'Full name min 3 chars';
		if (password.length < 4) errs.password = 'Password min 4 chars';
		setErrors(errs);
		if (Object.keys(errs).length) return;
		try {
			const created = await createUser({ email, fullName, password, role, managerId: managerId || undefined });
			setItems((prev) => [created, ...prev]);
			setEmail(''); setFullName(''); setPassword(''); setRole('EMPLOYEE'); setManagerId(''); setErrors({});
            setMsg('User created');
		} catch (e) {
			setErrMsg(e?.response?.data?.error || 'Failed to create');
		}
	}

    async function onToggleActive(u) {
        setMsg(''); setErrMsg('');
        try {
            const updated = await setUserActive(u.id, !u.isActive);
            setItems(prev => prev.map(x => x.id === u.id ? { ...x, isActive: updated.isActive } : x));
            setMsg(updated.isActive ? 'User activated' : 'User deactivated');
        } catch (e) { setErrMsg(e?.response?.data?.error || 'Failed to update'); }
    }

    async function confirmSetPassword() {
        if (!pwdModalUser) return;
        if (!pwdModalValue || pwdModalValue.length < 4) { setErrMsg('Password min 4 chars'); return; }
        setMsg(''); setErrMsg('');
        try {
            await adminSetPassword(pwdModalUser.id, pwdModalValue);
            setMsg('Password updated');
            setPwdModalUser(null); setPwdModalValue('');
        } catch (e) { setErrMsg(e?.response?.data?.error || 'Failed to update password'); }
    }

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold">Employees</h1>
            {msg && <div className="text-green-800 bg-green-50 border border-green-200 rounded p-2">{msg}</div>}
            {errMsg && <div className="text-red-800 bg-red-50 border border-red-200 rounded p-2">{errMsg}</div>}
            {user?.role === 'SUPER_ADMIN' && (
                <div className="bg-white border border-amber-300 rounded p-4">
                    <div className="text-amber-900 font-medium mb-2">Filter by company</div>
                    <select value={selectedCompanyId} onChange={(e)=>setSelectedCompanyId(e.target.value)} className="border border-amber-300 rounded px-3 py-2">
                        <option value="">All (select a company)</option>
                        {companies.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
                    </select>
                </div>
            )}
			{user?.role !== 'SUPER_ADMIN' && (
			<div className="bg-white border border-amber-300 rounded p-4">
				<div className="text-amber-900 font-medium mb-3">Create Employee</div>
				<form onSubmit={onCreate} className="grid md:grid-cols-5 gap-3">
					<div className="md:col-span-2">
						<label className="block text-sm mb-1 text-amber-900">Email</label>
						<input value={email} onChange={(e)=>setEmail(e.target.value)} className={"w-full border rounded px-3 py-2 " + (errors.email ? 'border-red-500' : 'border-amber-300')} placeholder="email@example.com" />
						{errors.email && <div className="text-xs text-red-600 mt-1">{errors.email}</div>}
					</div>
					<div className="md:col-span-2">
						<label className="block text-sm mb-1 text-amber-900">Full name</label>
						<input value={fullName} onChange={(e)=>setFullName(e.target.value)} className={"w-full border rounded px-3 py-2 " + (errors.fullName ? 'border-red-500' : 'border-amber-300')} placeholder="Full name" />
						{errors.fullName && <div className="text-xs text-red-600 mt-1">{errors.fullName}</div>}
					</div>
					<div>
						<label className="block text-sm mb-1 text-amber-900">Password</label>
						<input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} className={"w-full border rounded px-3 py-2 " + (errors.password ? 'border-red-500' : 'border-amber-300')} placeholder="Password" />
						{errors.password && <div className="text-xs text-red-600 mt-1">{errors.password}</div>}
					</div>
					<div>
						<label className="block text-sm mb-1 text-amber-900">Role</label>
						<select value={role} onChange={(e)=>setRole(e.target.value)} className="w-full border border-amber-300 rounded px-3 py-2">
							<option value="EMPLOYEE">EMPLOYEE</option>
							<option value="SUPERVISOR">SUPERVISOR</option>
							<option value="COMPANY_ADMIN">COMPANY_ADMIN</option>
						</select>
					</div>
					<div className="md:col-span-2">
						<label className="block text-sm mb-1 text-amber-900">Manager</label>
						<select value={managerId} onChange={(e)=>setManagerId(e.target.value)} className="w-full border border-amber-300 rounded px-3 py-2">
							<option value="">None</option>
							{managers.map((m) => <option key={m.id} value={m.id}>{m.fullName}</option>)}
						</select>
					</div>
					<div className="md:col-span-5 flex justify-end">
						<button className="bg-amber-700 hover:bg-amber-800 text-white rounded px-4 py-2">Create</button>
					</div>
				</form>
			</div>
			)}

			<div className="overflow-x-auto bg-white border border-amber-300 rounded">
				<table className="min-w-[900px] w-full">
					<thead>
						<tr className="bg-amber-50 text-amber-900">
							<th className="text-left p-2 border-b border-amber-200">Name</th>
							<th className="text-left p-2 border-b border-amber-200">Email</th>
							<th className="text-left p-2 border-b border-amber-200">Role</th>
							<th className="text-left p-2 border-b border-amber-200">Active</th>
							<th className="text-left p-2 border-b border-amber-200">Actions</th>
						</tr>
					</thead>
					<tbody>
						{items.map((u) => (
							<tr key={u.id}>
								<td className="p-2 border-t border-amber-100">{u.fullName}</td>
								<td className="p-2 border-t border-amber-100">{u.email}</td>
								<td className="p-2 border-t border-amber-100">{u.role}</td>
								<td className="p-2 border-t border-amber-100">
									<input type="checkbox" checked={u.isActive !== false} onChange={()=>onToggleActive(u)} />
								</td>
								<td className="p-2 border-t border-amber-100 space-x-2">
									<button onClick={()=>{ setPwdModalUser(u); setPwdModalValue(''); }} className="border border-amber-300 rounded px-3 py-1">Set Password</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

            {pwdModalUser && (
                <div className="fixed inset-0 bg-black/40 grid place-items-center p-4">
                    <div className="bg-white rounded-lg border border-amber-300 max-w-sm w-full p-4">
                        <div className="font-medium text-amber-900 mb-2">Set password for {pwdModalUser.fullName}</div>
                        <input type="password" className="w-full border border-amber-300 rounded px-3 py-2" placeholder="New password" value={pwdModalValue} onChange={(e)=>setPwdModalValue(e.target.value)} />
                        <div className="mt-3 flex justify-end gap-2">
                            <button onClick={()=>setPwdModalUser(null)} className="border border-amber-300 rounded px-3 py-1">Cancel</button>
                            <button onClick={confirmSetPassword} className="bg-amber-700 hover:bg-amber-800 text-white rounded px-3 py-1">Save</button>
                        </div>
                    </div>
                </div>
            )}
		</div>
	);
}