import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function SettingsPage() {
	const { user } = useAuth();
	const [address, setAddress] = useState({ line1: '', line2: '', city: '', state: '', country: '', zip: '' });
	const [lat, setLat] = useState('');
	const [lon, setLon] = useState('');
	const [radius, setRadius] = useState('');
	const [msg, setMsg] = useState('');
	const [errMsg, setErrMsg] = useState('');
	// profile state
	const [fullName, setFullName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');

	useEffect(() => {
		(async () => {
			try {
				// Load profile details
				const { meRequest } = await import('../services/auth.js');
				const me = await meRequest();
				setFullName(me.fullName || '');
				setEmail(me.email || '');
				// Load company config for company admins
				if (user?.companyId) {
					const { api } = await import('../lib/api.js');
					const { data } = await api.get(`/companies/${user.companyId}`);
					setAddress(data.address || { line1: '', line2: '', city: '', state: '', country: '', zip: '' });
					const coords = data?.geofenceCenter?.coordinates || [];
					setLon(coords[0] ?? '');
					setLat(coords[1] ?? '');
					setRadius(data?.geofenceRadiusMeters ?? '');
				}
			} catch {}
		})();
	}, [user?.companyId]);

	async function saveCompany() {
		setMsg(''); setErrMsg('');
		try {
			const { updateCompany } = await import('../services/companies.js');
			const patch = { address };
			if (lat !== '' && lon !== '') patch.geofenceCenter = { type: 'Point', coordinates: [Number(lon), Number(lat)] };
			if (radius !== '') patch.geofenceRadiusMeters = Number(radius);
			await updateCompany(user.companyId, patch);
			setMsg('Company settings saved');
		} catch (e) { setErrMsg(e?.response?.data?.error || 'Failed to save'); }
	}

	async function saveProfile() {
		setMsg(''); setErrMsg('');
		try {
			const payload = { fullName, email };
			if (password.trim()) payload.password = password.trim();
			const { updateMe } = await import('../services/auth.js');
			const updated = await updateMe(payload);
			setMsg('Profile updated');
			setPassword('');
			// Optionally update local storage
			try {
				const raw = localStorage.getItem('auth:user');
				if (raw) {
					const cur = JSON.parse(raw);
					localStorage.setItem('auth:user', JSON.stringify({ ...cur, name: updated.fullName, role: cur.role, companyId: cur.companyId, id: cur.id, token: cur.token, email: updated.email }));
				}
			} catch {}
		} catch (e) { setErrMsg(e?.response?.data?.error || 'Failed to update profile'); }
	}

	return (
		<div className="space-y-4">
			<h1 className="text-xl font-semibold">Settings</h1>
			{msg && <div className="text-green-800 bg-green-50 border border-green-200 rounded p-2">{msg}</div>}
			{errMsg && <div className="text-red-800 bg-red-50 border border-red-200 rounded p-2">{errMsg}</div>}

			<div className="bg-white border border-amber-300 rounded p-4 grid gap-3">
				<div className="font-medium text-amber-900 mb-2">My Profile</div>
				<div className="grid md:grid-cols-2 gap-3">
					<div>
						<label className="block text-sm text-amber-900 mb-1">Full name</label>
						<input className="border border-amber-300 rounded px-3 py-2 w-full" value={fullName} onChange={(e)=>setFullName(e.target.value)} />
					</div>
					<div>
						<label className="block text-sm text-amber-900 mb-1">Email</label>
						<input className="border border-amber-300 rounded px-3 py-2 w-full" value={email} onChange={(e)=>setEmail(e.target.value)} />
					</div>
				</div>
				<div>
					<label className="block text-sm text-amber-900 mb-1">New Password (optional)</label>
					<input type="password" className="border border-amber-300 rounded px-3 py-2 w-full" value={password} onChange={(e)=>setPassword(e.target.value)} />
				</div>
				<div className="flex justify-end">
					<button onClick={saveProfile} className="bg-amber-700 hover:bg-amber-800 text-white rounded px-4 py-2">Save Profile</button>
				</div>
			</div>

			{user?.role === 'COMPANY_ADMIN' ? (
				<div className="bg-white border border-amber-300 rounded p-4 grid gap-3">
					<div className="font-medium text-amber-900 mb-2">Company Address</div>
					<input className="border border-amber-300 rounded px-3 py-2" placeholder="Address line 1" value={address.line1} onChange={(e)=>setAddress({ ...address, line1: e.target.value })} />
					<input className="border border-amber-300 rounded px-3 py-2" placeholder="Address line 2" value={address.line2} onChange={(e)=>setAddress({ ...address, line2: e.target.value })} />
					<div className="grid md:grid-cols-3 gap-3">
						<input className="border border-amber-300 rounded px-3 py-2" placeholder="City" value={address.city} onChange={(e)=>setAddress({ ...address, city: e.target.value })} />
						<input className="border border-amber-300 rounded px-3 py-2" placeholder="State" value={address.state} onChange={(e)=>setAddress({ ...address, state: e.target.value })} />
						<input className="border border-amber-300 rounded px-3 py-2" placeholder="Country" value={address.country} onChange={(e)=>setAddress({ ...address, country: e.target.value })} />
					</div>
					<input className="border border-amber-300 rounded px-3 py-2" placeholder="ZIP" value={address.zip} onChange={(e)=>setAddress({ ...address, zip: e.target.value })} />
					<div className="font-medium text-amber-900 mt-4">Geofence (optional)</div>
					<div className="grid md:grid-cols-3 gap-3">
						<input className="border border-amber-300 rounded px-3 py-2" placeholder="Latitude" value={lat} onChange={(e)=>setLat(e.target.value)} />
						<input className="border border-amber-300 rounded px-3 py-2" placeholder="Longitude" value={lon} onChange={(e)=>setLon(e.target.value)} />
						<input className="border border-amber-300 rounded px-3 py-2" placeholder="Radius (meters)" value={radius} onChange={(e)=>setRadius(e.target.value)} />
					</div>
					<div className="flex justify-end">
						<button onClick={saveCompany} className="bg-amber-700 hover:bg-amber-800 text-white rounded px-4 py-2">Save</button>
					</div>
				</div>
			) : null}
		</div>
	);
}