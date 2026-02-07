import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function SettingsPage() {
	const { user } = useAuth();
	const [company, setCompany] = useState(null);
	const [profileEmail, setProfileEmail] = useState('');
	const [profileName, setProfileName] = useState('');
	const [profilePassword, setProfilePassword] = useState('');
	const [centerLat, setCenterLat] = useState('');
	const [centerLon, setCenterLon] = useState('');
	const [radius, setRadius] = useState('');
	const [msg, setMsg] = useState('');
	const [errMsg, setErrMsg] = useState('');
	const [weeklyOffDays, setWeeklyOffDays] = useState([0]);
	const [holidayInputDate, setHolidayInputDate] = useState('');
	const [holidayInputLabel, setHolidayInputLabel] = useState('');
	const [holidays, setHolidays] = useState([]);
	const [policy, setPolicy] = useState([{ type: 'emergency', days: 0 }, { type: 'sick', days: 0 }, { type: 'vacation', days: 0 }]);

	useEffect(() => {
		(async () => {
			try {
				const [{ getMyCompany }, { meRequest }] = await Promise.all([
					import('../services/companies.js'),
					import('../services/auth.js'),
				]);
				const c = await getMyCompany().catch(()=>null);
				setCompany(c);
				const me = await meRequest();
				setProfileEmail(me.email || '');
				setProfileName(me.fullName || '');
				if (c?.allowedGeoCenter?.coordinates) {
					setCenterLon(String(c.allowedGeoCenter.coordinates[0] ?? ''));
					setCenterLat(String(c.allowedGeoCenter.coordinates[1] ?? ''));
				}
				if (c?.allowedGeoRadiusMeters) setRadius(String(c.allowedGeoRadiusMeters));
				if (c?.weeklyOffDays) setWeeklyOffDays(c.weeklyOffDays);
				if (c?.holidayDates) setHolidays(c.holidayDates);
				if (Array.isArray(c?.paidLeavePolicy) && c.paidLeavePolicy.length) setPolicy(c.paidLeavePolicy);
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
			<form onSubmit={async(e)=>{
				e.preventDefault();
				setMsg(''); setErrMsg('');
				try {
					const { updateMe } = await import('../services/auth.js');
					await updateMe({ email: profileEmail, fullName: profileName, ...(profilePassword ? { password: profilePassword } : {}) });
					setProfilePassword('');
					setMsg('Profile updated');
				} catch (e) { setErrMsg(e?.response?.data?.error || 'Failed to update profile'); }
			}} className="bg-white border border-amber-300 rounded p-4 grid md:grid-cols-3 gap-3">
				<div className="md:col-span-3 text-amber-900 font-medium">My Profile</div>
				<div>
					<label className="block text-sm mb-1 text-amber-900">Full Name</label>
					<input className="w-full border border-amber-300 rounded px-3 py-2" value={profileName} onChange={(e)=>setProfileName(e.target.value)} placeholder="Your name" />
				</div>
				<div>
					<label className="block text-sm mb-1 text-amber-900">Email</label>
					<input className="w-full border border-amber-300 rounded px-3 py-2" value={profileEmail} onChange={(e)=>setProfileEmail(e.target.value)} placeholder="you@example.com" />
				</div>
				<div>
					<label className="block text-sm mb-1 text-amber-900">New Password</label>
					<input type="password" className="w-full border border-amber-300 rounded px-3 py-2" autoComplete="new-password" value={profilePassword} onChange={(e)=>setProfilePassword(e.target.value)} placeholder="Leave blank to keep same" />
				</div>
				<div className="md:col-span-3 flex justify-end">
					<button type="submit" className="bg-amber-700 hover:bg-amber-800 text-white rounded px-4 py-2">Save Profile</button>
				</div>
			</form>
			{user?.role === 'COMPANY_ADMIN' ? (
				<div className="bg-white border border-amber-300 rounded p-4 grid md:grid-cols-3 gap-3">
					<div className="md:col-span-3 text-amber-900 font-medium">Company Location Settings</div>
					<div className="md:col-span-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
						<strong>Note:</strong> Set the company location center and radius. Employees can only check-in/check-out when they are within this radius from the center point.
					</div>
					<div>
						<label className="block text-sm mb-1 text-amber-900">Center Latitude</label>
						<input type="number" step="any" className="w-full border border-amber-300 rounded px-3 py-2" value={centerLat} onChange={(e)=>setCenterLat(e.target.value)} placeholder="e.g. 12.9716" />
					</div>
					<div>
						<label className="block text-sm mb-1 text-amber-900">Center Longitude</label>
						<input type="number" step="any" className="w-full border border-amber-300 rounded px-3 py-2" value={centerLon} onChange={(e)=>setCenterLon(e.target.value)} placeholder="e.g. 77.5946" />
					</div>
					<div>
						<label className="block text-sm mb-1 text-amber-900">Radius (meters)</label>
						<input type="number" step="any" className="w-full border border-amber-300 rounded px-3 py-2" value={radius} onChange={(e)=>setRadius(e.target.value)} placeholder="e.g. 300" />
					</div>
					<div className="md:col-span-3 flex gap-2">
						<button type="button" onClick={() => {
							if (navigator.geolocation) {
								navigator.geolocation.getCurrentPosition((pos) => {
									setCenterLat(pos.coords.latitude.toFixed(6));
									setCenterLon(pos.coords.longitude.toFixed(6));
									setMsg('Current location captured');
								}, (err) => {
									setErrMsg('Failed to get location: ' + err.message);
								});
							} else {
								setErrMsg('Geolocation is not supported by your browser');
							}
						}} className="border border-amber-300 text-amber-900 rounded px-4 py-2 hover:bg-amber-50">
							📍 Get Current Location
						</button>
						<div className="flex-1"></div>
						<button onClick={saveGeo} className="bg-amber-700 hover:bg-amber-800 text-white rounded px-4 py-2">Save Location</button>
					</div>
					<div className="md:col-span-3 border-t my-2"></div>
					<div className="md:col-span-3 text-amber-900 font-medium">Leave Calendar</div>
					<div className="md:col-span-3">
						<label className="block text-sm mb-1 text-amber-900">Weekly Off Days</label>
						<div className="flex flex-wrap gap-2">
							{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d,idx)=>(
								<label key={idx} className="inline-flex items-center gap-1 border border-amber-300 rounded px-2 py-1">
									<input type="checkbox" checked={weeklyOffDays.includes(idx)} onChange={(e)=>{
										setWeeklyOffDays(prev=> e.target.checked ? Array.from(new Set([...prev, idx])) : prev.filter(x=>x!==idx));
									}} />
									<span>{d}</span>
								</label>
							))}
						</div>
					</div>
					<div className="md:col-span-3 grid md:grid-cols-3 gap-3 items-end">
						<div>
							<label className="block text-sm mb-1 text-amber-900">Holiday Date</label>
							<input type="date" className="w-full border border-amber-300 rounded px-3 py-2" value={holidayInputDate} onChange={(e)=>setHolidayInputDate(e.target.value)} />
						</div>
						<div>
							<label className="block text-sm mb-1 text-amber-900">Label</label>
							<input className="w-full border border-amber-300 rounded px-3 py-2" value={holidayInputLabel} onChange={(e)=>setHolidayInputLabel(e.target.value)} placeholder="Holiday name" />
						</div>
						<div>
							<button onClick={()=>{ if (!holidayInputDate) return; setHolidays(prev=> Array.from(new Map([...prev, {date: holidayInputDate, label: holidayInputLabel||''}].map(h=>[h.date, h]))).map(([,v])=>v)); setHolidayInputDate(''); setHolidayInputLabel(''); }} className="bg-amber-700 hover:bg-amber-800 text-white rounded px-4 py-2">Add Holiday</button>
						</div>
					</div>
					<div className="md:col-span-3 overflow-x-auto">
						<table className="min-w-[600px] w-full">
							<thead>
								<tr className="bg-amber-50 text-amber-900">
									<th className="text-left p-2 border-b border-amber-200">Date</th>
									<th className="text-left p-2 border-b border-amber-200">Label</th>
									<th className="text-left p-2 border-b border-amber-200">Actions</th>
								</tr>
							</thead>
							<tbody>
								{holidays.map(h => (
									<tr key={h.date}>
										<td className="p-2 border-t border-amber-100">{h.date}</td>
										<td className="p-2 border-t border-amber-100">{h.label || '-'}</td>
										<td className="p-2 border-t border-amber-100">
											<button onClick={()=>setHolidays(prev=>prev.filter(x=>x.date!==h.date))} className="border border-amber-300 rounded px-3 py-1">Remove</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					<div className="md:col-span-3 flex justify-end">
						<button onClick={async()=>{ setMsg(''); setErrMsg(''); try { const { updateMyCompanyLeaveCalendar } = await import('../services/companies.js'); await updateMyCompanyLeaveCalendar({ weeklyOffDays, holidayDates: holidays }); setMsg('Leave calendar saved'); } catch (e) { setErrMsg(e?.response?.data?.error || 'Failed to save leave calendar'); } }} className="bg-amber-700 hover:bg-amber-800 text-white rounded px-4 py-2">Save Leave Calendar</button>
					</div>

					<div className="md:col-span-3 border-t my-2"></div>
					<div className="md:col-span-3 text-amber-900 font-medium">Paid Leave Policy</div>
					<div className="md:col-span-3 grid md:grid-cols-3 gap-3">
						{policy.map((p, idx) => (
							<div key={idx}>
								<label className="block text-sm mb-1 text-amber-900">{p.type.charAt(0).toUpperCase()+p.type.slice(1)} (days/month)</label>
								<input type="number" className="w-full border border-amber-300 rounded px-3 py-2" value={p.days} onChange={(e)=>{
									const v = Number(e.target.value)||0; setPolicy(prev=>prev.map((x,i)=> i===idx?{...x, days:v}:x));
								}} />
							</div>
						))}
					</div>
					<div className="md:col-span-3 flex justify-end">
						<button onClick={async()=>{ setMsg(''); setErrMsg(''); try { const { updateMyCompanyPaidLeavePolicy } = await import('../services/companies.js'); await updateMyCompanyPaidLeavePolicy(policy); setMsg('Paid leave policy saved'); } catch (e) { setErrMsg(e?.response?.data?.error || 'Failed to save paid leave policy'); } }} className="bg-amber-700 hover:bg-amber-800 text-white rounded px-4 py-2">Save Paid Leave Policy</button>
					</div>
				</div>
			) : (
				<p>Profile, preferences and security settings will be here.</p>
			)}
		</div>
	);
}