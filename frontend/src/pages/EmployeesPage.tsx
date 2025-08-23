export default function EmployeesPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold mb-3">Employees</h1>
      <div className="overflow-x-auto">
        <table className="min-w-[600px] w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left p-2 border">Name</th>
              <th className="text-left p-2 border">Role</th>
              <th className="text-left p-2 border">Manager</th>
            </tr>
          </thead>
          <tbody>
            {['Alice','Bob','Charlie'].map((n, idx) => (
              <tr key={n}>
                <td className="p-2 border">{n}</td>
                <td className="p-2 border">{idx === 0 ? 'SUPERVISOR' : 'EMPLOYEE'}</td>
                <td className="p-2 border">{idx === 0 ? '-' : 'Alice'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}