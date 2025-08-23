import { useState } from 'react';

export default function LeavesPage() {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [reason, setReason] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await (await import('../services/leaves')).requestLeave({ startDate: start, endDate: end, reason });
    setStart(''); setEnd(''); setReason('');
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Leave Requests</h1>
      <form onSubmit={submit} className="grid gap-2 max-w-lg">
        <input type="date" className="border rounded px-3 py-2" value={start} onChange={(e) => setStart(e.target.value)} />
        <input type="date" className="border rounded px-3 py-2" value={end} onChange={(e) => setEnd(e.target.value)} />
        <input className="border rounded px-3 py-2" placeholder="Reason" value={reason} onChange={(e) => setReason(e.target.value)} />
        <button className="bg-blue-600 text-white rounded px-3 py-2">Submit</button>
      </form>
    </div>
  );
}