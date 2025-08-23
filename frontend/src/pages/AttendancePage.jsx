import { useState } from 'react';

export default function AttendancePage() {
	const [checkedIn, setCheckedIn] = useState(false);
	const [report, setReport] = useState('');

	async function doCheckIn() {
		const pos = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject));
		const { longitude, latitude } = pos.coords;
		await (await import('../services/attendance.js')).checkIn(longitude, latitude);
		setCheckedIn(true);
	}

	async function doCheckOut() {
		const pos = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject));
		const { longitude, latitude } = pos.coords;
		await (await import('../services/attendance.js')).checkOut(report, longitude, latitude);
		setCheckedIn(false);
		setReport('');
	}

	return (
		<div className="space-y-4">
			<h1 className="text-2xl font-bold">Attendance</h1>
			<div className="flex gap-2">
				<button className="bg-amber-700 hover:bg-amber-800 text-white px-3 py-2 rounded" onClick={doCheckIn} disabled={checkedIn}>Check in</button>
				<button className="bg-amber-700 hover:bg-amber-800 text-white px-3 py-2 rounded" onClick={doCheckOut} disabled={!checkedIn || !report}>Check out</button>
			</div>
			<textarea className="w-full border border-amber-300 rounded p-2" placeholder="Daily report (required to check out)" value={report} onChange={(e) => setReport(e.target.value)} />
			<div className="text-sm opacity-70">Status: {checkedIn ? 'Checked in' : 'Not checked in'}</div>
		</div>
	);
}