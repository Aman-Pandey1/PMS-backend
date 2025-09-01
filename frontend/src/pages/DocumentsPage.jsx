import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function DocumentsPage() {
	const { user } = useAuth();
	const [docs, setDocs] = useState([]);
	const fileRef = useRef(null);
	const [type, setType] = useState('AADHAAR');
	const [msg, setMsg] = useState('');
	const [errMsg, setErrMsg] = useState('');
	const [companies, setCompanies] = useState([]);
	const [selectedCompany, setSelectedCompany] = useState('');
	const [employees, setEmployees] = useState([]);
	const [selectedEmployee, setSelectedEmployee] = useState('');

	async function loadDocs() {
		try {
			setErrMsg('');
			const svc = await import('../services/documents.js');
			if (user?.role === 'EMPLOYEE' || user?.role === 'SUPERVISOR') {
				setDocs(await svc.listUserDocuments('me'));
			} else if (user?.role === 'COMPANY_ADMIN') {
				if (!selectedEmployee) { setDocs([]); setErrMsg('Select an employee'); return; }
				setDocs(await svc.listUserDocuments(selectedEmployee));
			} else if (user?.role === 'SUPER_ADMIN') {
				if (!selectedCompany) { setDocs([]); setErrMsg('Select a company'); return; }
				if (!selectedEmployee) { setDocs([]); setErrMsg('Select an employee'); return; }
				setDocs(await svc.listUserDocuments(selectedEmployee));
			}
		} catch (e) { setErrMsg(e?.response?.data?.error || 'Failed to load documents'); }
	}

	useEffect(() => { loadDocs().catch(()=>{}); }, [user?.role, selectedCompany, selectedEmployee]);

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
					setSelectedEmployee('');
				}
			} catch {}
		})();
	}, [user?.role, selectedCompany]);

	async function upload() {
		const f = fileRef.current?.files?.[0];
		if (!f) return;
		try {
			const svc = await import('../services/documents.js');
			await svc.uploadUserDocument('me', { type, name: f.name });
			setMsg('Uploaded');
			if (fileRef.current) fileRef.current.value = '';
			await loadDocs();
		} catch (e) { setErrMsg(e?.response?.data?.error || 'Failed to upload'); }
	}

	return (
		<div className="space-y-4">
			<h1 className="text-2xl font-bold">Documents</h1>
			{msg && <div className="text-green-800 bg-green-50 border border-green-200 rounded p-2">{msg}</div>}
			{errMsg && <div className="text-red-800 bg-red-50 border border-red-200 rounded p-2">{errMsg}</div>}

			{user?.role === 'SUPER_ADMIN' && (
				<div className="flex gap-2 items-center bg-white border border-amber-300 rounded p-4">
					<select className="border border-amber-300 rounded px-3 py-2" value={selectedCompany} onChange={(e) => { setSelectedCompany(e.target.value); setSelectedEmployee(''); }}>
						<option value="">Select company</option>
						{companies.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
					</select>
					{selectedCompany && (
						<select className="border border-amber-300 rounded px-3 py-2" value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)}>
							<option value="">Select employee</option>
							{employees.map(u => <option key={u.id} value={u.id}>{u.fullName || u.email || u.id}</option>)}
						</select>
					)}
				</div>
			)}

			{user?.role === 'COMPANY_ADMIN' && (
				<div className="flex gap-2 items-center bg-white border border-amber-300 rounded p-4">
					<select className="border border-amber-300 rounded px-3 py-2" value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)}>
						<option value="">Select employee</option>
						{employees.map(u => <option key={u.id} value={u.id}>{u.fullName || u.email || u.id}</option>)}
					</select>
				</div>
			)}

			{(user?.role === 'EMPLOYEE' || user?.role === 'SUPERVISOR') && (
				<div className="flex gap-2 items-center bg-white border border-amber-300 rounded p-4">
					<select className="border border-amber-300 rounded px-3 py-2" value={type} onChange={(e) => setType(e.target.value)}>
						<option value="AADHAAR">Aadhaar</option>
						<option value="PAN">PAN</option>
						<option value="PHOTO">Photograph</option>
						<option value="BANK">Bank</option>
					</select>
					<input ref={fileRef} type="file" className="border border-amber-300 rounded px-3 py-2" />
					<button onClick={upload} className="bg-amber-700 hover:bg-amber-800 text-white rounded px-3 py-2">Upload</button>
				</div>
			)}

			<div className="grid gap-2">
				{docs.map((d, i) => (
					<div key={d._id || i} className="border border-amber-300 rounded p-3 bg-white flex justify-between">
						<div className="text-amber-900">{d.type}</div>
						<div className="opacity-70">{d.storage?.key || d.name}</div>
					</div>
				))}
			</div>
		</div>
	);
}