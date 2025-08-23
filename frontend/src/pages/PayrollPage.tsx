import { useState } from 'react';

type Row = { name: string; designation: string; salary: number };

export default function PayrollPage() {
  const [summary, setSummary] = useState<{ total: number; count: number } | null>(null);

  useEffect(() => {
    (async () => {
      const u = JSON.parse(localStorage.getItem('auth:user') || '{}');
      if (u?.companyId) {
        const data = await (await import('../services/payroll')).companySummary(u.companyId);
        setSummary(data);
      }
    })();
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Payroll</h1>
      {summary ? (
        <div className="text-lg">Company total payable: ₹{summary.total.toLocaleString()} (records: {summary.count})</div>
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
}