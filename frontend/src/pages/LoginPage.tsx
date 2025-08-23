import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Role, useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as any;
  const [email, setEmail] = useState('admin@example.com');
  const [role, setRole] = useState<Role>('SUPER_ADMIN');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    login({ id: 'demo', name: email.split('@')[0], role, token: 'dev', companyId: role === 'SUPER_ADMIN' ? undefined : 'c1' });
    const redirectTo = location.state?.from?.pathname || '/';
    navigate(redirectTo, { replace: true });
  }

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold">Sign in</h1>
        <input className="w-full border rounded px-3 py-2" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <select className="w-full border rounded px-3 py-2" value={role} onChange={(e) => setRole(e.target.value as Role)}>
          <option value="SUPER_ADMIN">Super Admin</option>
          <option value="COMPANY_ADMIN">Company Admin</option>
          <option value="SUPERVISOR">Supervisor</option>
          <option value="EMPLOYEE">Employee</option>
        </select>
        <button className="w-full bg-blue-600 text-white rounded px-3 py-2">Continue</button>
      </form>
    </div>
  );
}