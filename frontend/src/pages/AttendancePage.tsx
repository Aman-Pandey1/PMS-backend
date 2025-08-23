import { useState } from 'react';

export default function AttendancePage() {
  const [checkedIn, setCheckedIn] = useState(false);
  const [report, setReport] = useState('');

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Attendance</h1>
      <div className="flex gap-2">
        <button className="bg-green-600 text-white px-3 py-2 rounded" onClick={() => setCheckedIn(true)} disabled={checkedIn}>Check in</button>
        <button className="bg-red-600 text-white px-3 py-2 rounded" onClick={() => setCheckedIn(false)} disabled={!checkedIn || !report}>Check out</button>
      </div>
      <textarea className="w-full border rounded p-2" placeholder="Daily report (required to check out)" value={report} onChange={(e) => setReport(e.target.value)} />
      <div className="text-sm opacity-70">Status: {checkedIn ? 'Checked in' : 'Not checked in'}</div>
    </div>
  );
}