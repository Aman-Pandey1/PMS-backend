import { useEffect, useState } from 'react';
import { createCompany, listCompanies, uploadCompanyLogo, updateCompany, deleteCompany, toggleCompany } from '../services/companies.js';
import { listUsers } from '../services/users.js';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function CompaniesPage() {
	const { user } = useAuth();
	const [items, setItems] = useState([]);
	const [selectedCompanyId, setSelectedCompanyId] = useState('');
	const [companyEmployees, setCompanyEmployees] = useState([]);
	const [name, setName] = useState('');
	const [code, setCode] = useState('');
	const [formStatus, setFormStatus] = useState('ACTIVE');
	const [formAddress, setFormAddress] = useState('');
	const [formDesc, setFormDesc] = useState('');
	const [formLogo, setFormLogo] = useState('');
    const [formLogoFile, setFormLogoFile] = useState(null);
	const [adminEmail, setAdminEmail] = useState('');
	const [adminPassword, setAdminPassword] = useState('');
	const [adminName, setAdminName] = useState('');
	const [formErrors, setFormErrors] = useState({});
    const [msg, setMsg] = useState('');
    const [errMsg, setErrMsg] = useState('');

	useEffect(() => {
		listCompanies().then(setItems).catch(console.error);
	}, []);

	useEffect(() => {
		(async () => {
			if (user?.role !== 'SUPER_ADMIN') return;
			if (!selectedCompanyId) { setCompanyEmployees([]); return; }
			try {
				const employees = await listUsers(selectedCompanyId);
				setCompanyEmployees(employees);
			} catch (e) { setCompanyEmployees([]); }
		})();
	}, [selectedCompanyId, user?.role]);

	async function add(e) {
		e.preventDefault();
		const errs = {};
		if (!name.trim()) errs.name = 'Name required';
		if (!code.trim()) errs.code = 'Code required';
		if (adminEmail && !adminEmail.includes('@')) errs.adminEmail = 'Valid email required';
		if (adminEmail && adminPassword.length < 4) errs.adminPassword = 'Password min 4 chars';
		setFormErrors(errs);
		if (Object.keys(errs).length) return;
		let logoUrl = formLogo;
		try {
			if (formLogoFile) logoUrl = await uploadCompanyLogo('new', formLogoFile);
		} catch {}
		const payload = { name, code, status: formStatus, address: { line1: formAddress }, description: formDesc, logo: logoUrl, adminEmail, adminPassword, adminName };
		const resp = await createCompany(payload);
		const c = resp.company || resp;
		setItems((prev) => [c, ...prev]);
		setName(''); setCode(''); setFormStatus('ACTIVE'); setFormAddress(''); setFormDesc(''); setFormLogo(''); setAdminEmail(''); setAdminPassword(''); setAdminName('');
		setFormLogoFile(null);
        setMsg('Company created successfully'); setErrMsg('');
	}

	return (
		<div>
			<h1 className="text-2xl font-bold mb-4">Companies</h1>
			<form onSubmit={add} className="grid md:grid-cols-3 gap-3 mb-6 bg-white border border-amber-300 rounded-lg p-4">
				{msg && <div className="md:col-span-3 text-green-800 bg-green-50 border border-green-200 rounded p-2">{msg}</div>}
				{errMsg && <div className="md:col-span-3 text-red-800 bg-red-50 border border-red-200 rounded p-2">{errMsg}</div>}
				<div className="md:col-span-1">
					<label className="block text-sm mb-1 text-amber-900">Name</label>
					<input className={"w-full border rounded px-3 py-2 " + (formErrors.name ? 'border-red-500' : 'border-amber-300')} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
				</div>
				<div className="md:col-span-1">
					<label className="block text-sm mb-1 text-amber-900">Code</label>
					<input className={"w-full border rounded px-3 py-2 " + (formErrors.code ? 'border-red-500' : 'border-amber-300')} placeholder="Code" value={code} onChange={(e) => setCode(e.target.value)} />
				</div>
				<div className="md:col-span-1">
					<label className="block text-sm mb-1 text-amber-900">Status</label>
					<select className="w-full border border-amber-300 rounded px-3 py-2" value={formStatus} onChange={(e)=>setFormStatus(e.target.value)}>
						<option value="ACTIVE">ACTIVE</option>
						<option value="INACTIVE">INACTIVE</option>
					</select>
				</div>
				<div className="md:col-span-3">
					<label className="block text-sm mb-1 text-amber-900">Logo</label>
					<div className="flex gap-2 items-center">
						<input className="flex-1 border border-amber-300 rounded px-3 py-2" placeholder="https://... (optional)" value={formLogo} onChange={(e)=>setFormLogo(e.target.value)} />
						<input type="file" accept="image/*" onChange={(e)=>setFormLogoFile(e.target.files?.[0]||null)} />
					</div>
				</div>
				<div className="md:col-span-3">
					<label className="block text-sm mb-1 text-amber-900">Address</label>
					<input className="w-full border border-amber-300 rounded px-3 py-2" placeholder="Line 1, City, State, ZIP" value={formAddress} onChange={(e)=>setFormAddress(e.target.value)} />
				</div>
				<div className="md:col-span-3">
					<label className="block text-sm mb-1 text-amber-900">Description</label>
					<textarea className="w-full border border-amber-300 rounded px-3 py-2" placeholder="Short description" value={formDesc} onChange={(e)=>setFormDesc(e.target.value)} />
				</div>
				<div className="md:col-span-3 grid md:grid-cols-3 gap-3">
					<div>
						<label className="block text-sm mb-1 text-amber-900">Admin Email</label>
						<input className={"w-full border rounded px-3 py-2 " + (formErrors.adminEmail ? 'border-red-500' : 'border-amber-300')} placeholder="admin@company.com" value={adminEmail} onChange={(e)=>setAdminEmail(e.target.value)} />
						{formErrors.adminEmail && <div className="text-xs text-red-600 mt-1">{formErrors.adminEmail}</div>}
					</div>
					<div>
						<label className="block text-sm mb-1 text-amber-900">Admin Password</label>
						<input type="password" className={"w-full border rounded px-3 py-2 " + (formErrors.adminPassword ? 'border-red-500' : 'border-amber-300')} placeholder="Password" value={adminPassword} onChange={(e)=>setAdminPassword(e.target.value)} />
						{formErrors.adminPassword && <div className="text-xs text-red-600 mt-1">{formErrors.adminPassword}</div>}
					</div>
					<div>
						<label className="block text-sm mb-1 text-amber-900">Admin Name</label>
						<input className="w-full border border-amber-300 rounded px-3 py-2" placeholder="Optional" value={adminName} onChange={(e)=>setAdminName(e.target.value)} />
					</div>
				</div>
				<div className="md:col-span-3 flex justify-end">
					<button className="bg-amber-700 hover:bg-amber-800 text-white rounded px-4 py-2">Create Company</button>
				</div>
			</form>
			<div className="grid gap-3">
				{items.map((c) => (
					<div key={c.id} className="border border-amber-300 rounded p-3 bg-white flex flex-wrap gap-3 items-center justify-between">
						<div>
							<div className="font-medium text-amber-900">{c.name}</div>
							<div className="opacity-70 text-sm">{c.code} · {c.status}</div>
						</div>
						<div className="flex items-center gap-2">
							<label className="text-sm">Enabled</label>
							<input type="checkbox" checked={c.status !== 'INACTIVE'} onChange={async (e)=>{ const updated = await toggleCompany(c.id, e.target.checked); setItems(prev=>prev.map(x=>x.id===c.id?updated:x)); }} />
							<button onClick={async ()=>{ const name = prompt('New name', c.name) || c.name; const updated = await updateCompany(c.id, { name }); setItems(prev=>prev.map(x=>x.id===c.id?updated:x)); }} className="border border-amber-300 rounded px-3 py-1">Edit</button>
							<button onClick={async ()=>{ if (!confirm('Delete company?')) return; await deleteCompany(c.id); setItems(prev=>prev.filter(x=>x.id!==c.id)); }} className="text-white bg-red-600 rounded px-3 py-1">Delete</button>
							{c.logo && <img alt="logo" src={c.logo} className="h-8" />}
						</div>
					</div>
				))}
			</div>

			{user?.role === 'SUPER_ADMIN' && (
				<div className="mt-6 bg-white border border-amber-300 rounded p-4">
					<div className="font-medium text-amber-900 mb-2">View employees of a company</div>
					<select value={selectedCompanyId} onChange={(e)=>setSelectedCompanyId(e.target.value)} className="border border-amber-300 rounded px-3 py-2 mb-3">
						<option value="">Select company</option>
						{items.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
					</select>
					{selectedCompanyId && (
						<div className="overflow-x-auto">
							<table className="min-w-[700px] w-full">
								<thead>
									<tr className="bg-amber-50 text-amber-900">
										<th className="text-left p-2 border-b border-amber-200">Name</th>
										<th className="text-left p-2 border-b border-amber-200">Email</th>
										<th className="text-left p-2 border-b border-amber-200">Role</th>
									</tr>
								</thead>
								<tbody>
									{companyEmployees.map(u => (
										<tr key={u.id}>
											<td className="p-2 border-t border-amber-100">{u.fullName}</td>
											<td className="p-2 border-t border-amber-100">{u.email}</td>
											<td className="p-2 border-t border-amber-100">{u.role}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			)}
		</div>
	);
}