import { useRef, useState } from 'react';

export default function DocumentsPage() {
	const [docs, setDocs] = useState([]);
	const fileRef = useRef(null);
	const [type, setType] = useState('AADHAAR');

	async function upload() {
		const f = fileRef.current?.files?.[0];
		if (!f) return;
		await (await import('../services/documents.js')).uploadUserDocument('me', { type, name: f.name });
		setDocs((d) => [...d, { type, name: f.name }]);
		if (fileRef.current) fileRef.current.value = '';
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
			<div className="grid gap-2">
				{docs.map((d, i) => (
					<div key={i} className="border border-amber-300 rounded p-3 bg-white flex justify-between">
						<div className="text-amber-900">{d.type}</div>
						<div className="opacity-70">{d.name}</div>
					</div>
				))}
			</div>
		</div>
	);
}