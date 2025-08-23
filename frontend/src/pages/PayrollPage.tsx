import { useState } from 'react';

type Row = { name: string; designation: string; salary: number };

export default function PayrollPage() {
  const [rows] = useState<Row[]>([
    { name: 'Alice', designation: 'Supervisor', salary: 80000 },
    { name: 'Bob', designation: 'Engineer', salary: 60000 },
  ]);

  const total = rows.reduce((s, r) => s + r.salary, 0);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Payroll</h1>
      <div className="overflow-x-auto">
        <table className="min-w-[600px] w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left p-2 border">Name</th>
              <th className="text-left p-2 border">Designation</th>
              <th className="text-left p-2 border">Salary</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name}>
                <td className="p-2 border">{r.name}</td>
                <td className="p-2 border">{r.designation}</td>
                <td className="p-2 border">₹{r.salary.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="font-medium">Company total: ₹{total.toLocaleString()}</div>
    </div>
  );
}