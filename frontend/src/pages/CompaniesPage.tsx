import { useEffect, useState } from 'react';
import { createCompany, listCompanies, type Company } from '../services/companies';

export default function CompaniesPage() {
  const [items, setItems] = useState<Company[]>([]);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  useEffect(() => {
    listCompanies().then(setItems).catch(console.error);
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const c = await createCompany({ name, code });
    setItems((prev) => [c, ...prev]);
    setName('');
    setCode('');
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-3">Companies</h1>
      <form onSubmit={add} className="flex gap-2 mb-4">
        <input className="border rounded px-3 py-2" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="border rounded px-3 py-2" placeholder="Code" value={code} onChange={(e) => setCode(e.target.value)} />
        <button className="bg-blue-600 text-white rounded px-3 py-2">Add</button>
      </form>
      <div className="grid gap-3">
        {items.map((c) => (
          <div key={c.id} className="border rounded p-3 flex justify-between">
            <div className="font-medium">{c.name}</div>
            <div className="opacity-70">{c.code}</div>
          </div>
        ))}
      </div>
    </div>
  );
}