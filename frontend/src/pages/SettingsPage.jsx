import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function SettingsPage() {
	const { user } = useAuth();
	const [company, setCompany] = useState(null);
	const [centerLat, setCenterLat] = useState('');
	const [centerLon, setCenterLon] = useState('');
	const [radius, setRadius] = useState('');
	const [msg, setMsg] = useState('');
	const [errMsg, setErrMsg] = useState('');

	useEffect(() => {
		(async () => {
			try {
				const { getMyCompany } = await import('../services/companies.js');
				const c = await getMyCompany();
				setCompany(c);
				if (c?.allowedGeoCenter?.coordinates) {
					setCenterLon(String(c.allowedGeoCenter.coordinates[0] ?? ''));
					setCenterLat(String(c.allowedGeoCenter.coordinates[1] ?? ''));
				}
				if (c?.allowedGeoRadiusMeters) setRadius(String(c.allowedGeoRadiusMeters));
			} catch {}
		})();
	}, []);

	async function saveGeo(e) {
		e.preventDefault();
		setMsg(''); setErrMsg('');
		try {
			const payload = {};
			if (centerLat && centerLon) payload.allowedGeoCenter = { type: 'Point', coordinates: [Number(centerLon), Number(centerLat)] };
			if (radius) payload.allowedGeoRadiusMeters = Number(radius);
			const { updateMyCompanyGeo } = await import('../services/companies.js');
			await updateMyCompanyGeo(payload);
			setMsg('Location settings saved');
		} catch (e) { setErrMsg(e?.response?.data?.error || 'Failed to save'); }
	}

	return (
		<div className="space-y-4">
			<h1 className="text-xl font-semibold">Settings</h1>
			{msg && <div className="text-green-800 bg-green-50 border border-green-200 rounded p-2">{msg}</div>}
			{errMsg && <div className="text-red-800 bg-red-50 border border-red-200 rounded p-2">{errMsg}</div>}
			{user?.role === 'COMPANY_ADMIN' ? (
				<div className="bg-white border border-amber-300 rounded p-4 grid md:grid-cols-3 gap-3">
					<div className="md:col-span-3 text-amber-900 font-medium">Company Location Settings</div>
					<div>
						<label className="block text-sm mb-1 text-amber-900">Center Latitude</label>
						<input className="w-full border border-amber-300 rounded px-3 py-2" value={centerLat} onChange={(e)=>setCenterLat(e.target.value)} placeholder="e.g. 12.9716" />
					</div>
					<div>
						<label className="block text-sm mb-1 text-amber-900">Center Longitude</label>
						<input className="w-full border border-amber-300 rounded px-3 py-2" value={centerLon} onChange={(e)=>setCenterLon(e.target.value)} placeholder="e.g. 77.5946" />
					</div>
					<div>
						<label className="block text-sm mb-1 text-amber-900">Radius (meters)</label>
						<input className="w-full border border-amber-300 rounded px-3 py-2" value={radius} onChange={(e)=>setRadius(e.target.value)} placeholder="e.g. 300" />
					</div>
					<div className="md:col-span-3 flex justify-end">
						<button onClick={saveGeo} className="bg-amber-700 hover:bg-amber-800 text-white rounded px-4 py-2">Save</button>
					</div>
				</div>
			) : (
				<p>Profile, preferences and security settings will be here.</p>
			)}
		</div>
	);
}