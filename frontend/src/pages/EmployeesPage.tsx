import { useEffect, useState } from 'react';
import { listUsers, type User } from '../services/users';

export default function EmployeesPage() {
  const [items, setItems] = useState<User[]>([]);

  useEffect(() => {
    listUsers().then(setItems).catch(console.error);
  }, []);

  return (
    <div>
      <h1 className="text-xl font-semibold mb-3">Employees</h1>
      <div className="overflow-x-auto">
        <table className="min-w-[600px] w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left p-2 border">Name</th>
              <th className="text-left p-2 border">Email</th>
              <th className="text-left p-2 border">Role</th>
            </tr>
          </thead>
          <tbody>
            {items.map((u) => (
              <tr key={u.id}>
                <td className="p-2 border">{u.fullName}</td>
                <td className="p-2 border">{u.email}</td>
                <td className="p-2 border">{u.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}