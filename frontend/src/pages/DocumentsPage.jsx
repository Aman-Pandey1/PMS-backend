import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function DocumentsPage() {
	const { user } = useAuth();
	const [docs, setDocs] = useState([]);
	const fileRef = useRef(null);
	const [type, setType] = useState('AADHAAR');
	const [companies, setCompanies] = useState([]);
	const [selectedCompany, setSelectedCompany] = useState('');
	const [employees, setEmployees] = useState([]);
	const [selectedEmployee, setSelectedEmployee] = useState('');
	const [msg, setMsg] = useState('');
	const [errMsg, setErrMsg] = useState('');

	async function upload() {
		const f = fileRef.current?.files?.[0];
		if (!f) return;
		await (await import('../services/documents.js')).uploadUserDocument('me', { type, name: f.name });
		setDocs((d) => [...d, { type, name: f.name }]);
		if (fileRef.current) fileRef.current.value = '';
	}

	async function loadMy() {
		try {
			const { listUserDocuments } = await import('../services/documents.js');
			setDocs(await listUserDocuments('me'));
		} catch {}
	}

	async function loadCompany() {
		try {
			const { listCompanyDocuments } = await import('../services/documents.js');
			const params = {};
			if (user?.role === 'SUPER_ADMIN' && selectedCompany) params.companyId = selectedCompany;
			if (selectedEmployee) params.userId = selectedEmployee;
			const items = await listCompanyDocuments(params);
			setDocs(items);
		} catch (e) { console.error(e); }
	}

	useEffect(() => {
		if (user?.role === 'SUPER_ADMIN') {
			(async () => {
				try {
					const { listCompanies } = await import('../services/companies.js');
					setCompanies(await listCompanies());
				} catch {}
			})();
		}
		if (user?.role === 'COMPANY_ADMIN') {
			(async () => {
				try {
					const { listUsers } = await import('../services/users.js');
					setEmployees(await listUsers());
				} catch {}
			})();
		}
		// load my docs by default
		loadMy();
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user?.role]);

	useEffect(() => {
		(async () => {
			try {
				if (user?.role === 'SUPER_ADMIN' && selectedCompany) {
					const { listUsers } = await import('../services/users.js');
					setEmployees(await listUsers(selectedCompany));
				} else {
					setEmployees([]);
					setSelectedEmployee('');
				}
			} catch {}
		})();
	}, [user?.role, selectedCompany]);

	async function onDownload(doc) {
		try {
			setMsg(''); setErrMsg('');
			const { downloadDocument } = await import('../services/documents.js');
			const data = await downloadDocument(doc._id || doc.id);
			const blob = new Blob([data]);
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = doc.storage?.key || 'document';
			a.click();
			window.URL.revokeObjectURL(url);
			setMsg('Download started');
		} catch (e) { setErrMsg('Failed to download'); }
	}

	return (
		<div className="space-y-4">
			<h1 className="text-2xl font-bold">Documents</h1>
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
			{(user?.role === 'SUPER_ADMIN' || user?.role === 'COMPANY_ADMIN') && (
				<div className="bg-white border border-amber-300 rounded p-4 flex flex-wrap gap-2 items-center">
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
					<button onClick={loadCompany} className="bg-amber-700 hover:bg-amber-800 text-white rounded px-3 py-1">Load</button>
				</div>
			)}
			{msg && <div className="text-green-800 bg-green-50 border border-green-200 rounded p-2">{msg}</div>}
			{errMsg && <div className="text-red-800 bg-red-50 border border-red-200 rounded p-2">{errMsg}</div>}
			<div className="grid gap-2">
				{docs.map((d, i) => (
					<div key={d._id || d.id || i} className="border border-amber-300 rounded p-3 bg-white flex justify-between items-center">
						<div className="text-amber-900">{d.type}</div>
						<div className="opacity-70">{d.name || d.storage?.key}</div>
						{(user?.role === 'SUPER_ADMIN' || user?.role === 'COMPANY_ADMIN' || (d.userId && String(d.userId) === String(user?.id))) && (
							<button onClick={()=>onDownload(d)} className="border border-amber-300 rounded px-3 py-1">Download</button>
						)}
					</div>
				))}
			</div>
		</div>
	);
}