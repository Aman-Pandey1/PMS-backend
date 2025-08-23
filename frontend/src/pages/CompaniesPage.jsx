import { useEffect, useState } from 'react';
import { createCompany, listCompanies } from '../services/companies.js';

export default function CompaniesPage() {
	const [items, setItems] = useState([]);
	const [name, setName] = useState('');
	const [code, setCode] = useState('');
	const [formStatus, setFormStatus] = useState('ACTIVE');
	const [formAddress, setFormAddress] = useState('');
	const [formDesc, setFormDesc] = useState('');
	const [formErrors, setFormErrors] = useState({});

	useEffect(() => {
		listCompanies().then(setItems).catch(console.error);
	}, []);

	async function add(e) {
		e.preventDefault();
		const errs = {};
		if (!name.trim()) errs.name = 'Name required';
		if (!code.trim()) errs.code = 'Code required';
		setFormErrors(errs);
		if (Object.keys(errs).length) return;
		const payload = { name, code, status: formStatus, address: { line1: formAddress }, description: formDesc };
		const c = await createCompany(payload);
		setItems((prev) => [c, ...prev]);
		setName('');
		setCode('');
		setFormStatus('ACTIVE');
		setFormAddress('');
		setFormDesc('');
	}

	return (
		<div>
			<h1 className="text-2xl font-bold mb-4">Companies</h1>
			<form onSubmit={add} className="grid md:grid-cols-3 gap-3 mb-6 bg-white border border-amber-300 rounded-lg p-4">
				<div className="md:col-span-1">
					<label className="block text-sm mb-1 text-amber-900">Name</label>
					<input className="w-full border border-amber-300 rounded px-3 py-2" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
				</div>
				<div className="md:col-span-1">
					<label className="block text-sm mb-1 text-amber-900">Code</label>
					<input className="w-full border border-amber-300 rounded px-3 py-2" placeholder="Code" value={code} onChange={(e) => setCode(e.target.value)} />
				</div>
				<div className="md:col-span-1">
					<label className="block text-sm mb-1 text-amber-900">Status</label>
					<select className="w-full border border-amber-300 rounded px-3 py-2" value={formStatus} onChange={(e)=>setFormStatus(e.target.value)}>
						<option value="ACTIVE">ACTIVE</option>
						<option value="INACTIVE">INACTIVE</option>
					</select>
				</div>
				<div className="md:col-span-3">
					<label className="block text-sm mb-1 text-amber-900">Address</label>
					<input className="w-full border border-amber-300 rounded px-3 py-2" placeholder="Line 1, City, State, ZIP" value={formAddress} onChange={(e)=>setFormAddress(e.target.value)} />
				</div>
				<div className="md:col-span-3">
					<label className="block text-sm mb-1 text-amber-900">Description</label>
					<textarea className="w-full border border-amber-300 rounded px-3 py-2" placeholder="Short description" value={formDesc} onChange={(e)=>setFormDesc(e.target.value)} />
				</div>
				<div className="md:col-span-3 flex justify-end">
					<button className="bg-amber-700 hover:bg-amber-800 text-white rounded px-4 py-2">Create Company</button>
				</div>
			</form>
			<div className="grid gap-3">
				{items.map((c) => (
					<div key={c.id} className="border border-amber-300 rounded p-3 bg-white flex justify-between">
						<div className="font-medium text-amber-900">{c.name}</div>
						<div className="opacity-70">{c.code}</div>
					</div>
				))}
			</div>
		</div>
	);
}