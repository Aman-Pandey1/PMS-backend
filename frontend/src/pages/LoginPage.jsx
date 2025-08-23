import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function LoginPage() {
	const { loginWithPassword } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();
	const [email, setEmail] = useState('admin@example.com');
	const [password, setPassword] = useState('admin');

	async function handleSubmit(e) {
		e.preventDefault();
		await loginWithPassword(email, password);
		const redirectTo = location.state?.from?.pathname || '/';
		navigate(redirectTo, { replace: true });
	}

	return (
		<div className="min-h-screen grid place-items-center p-6">
			<form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
				<h1 className="text-2xl font-bold">Sign in</h1>
				<input className="w-full border rounded px-3 py-2" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
				<input className="w-full border rounded px-3 py-2" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
				<button className="w-full bg-blue-600 text-white rounded px-3 py-2">Continue</button>
			</form>
		</div>
	);
}