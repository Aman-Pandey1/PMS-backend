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
			<h1 className="text-xl font-semibold">Documents</h1>
			<div className="flex gap-2 items-center">
				<select className="border rounded px-3 py-2" value={type} onChange={(e) => setType(e.target.value)}>
					<option value="AADHAAR">Aadhaar</option>
					<option value="PAN">PAN</option>
					<option value="PHOTO">Photograph</option>
					<option value="BANK">Bank</option>
				</select>
				<input ref={fileRef} type="file" className="border rounded px-3 py-2" />
				<button onClick={upload} className="bg-blue-600 text-white rounded px-3 py-2">Upload</button>
			</div>
			<div className="grid gap-2">
				{docs.map((d, i) => (
					<div key={i} className="border rounded p-3 flex justify-between">
						<div>{d.type}</div>
						<div className="opacity-70">{d.name}</div>
					</div>
				))}
			</div>
		</div>
	);
}