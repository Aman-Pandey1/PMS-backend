import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { BRAND } from '../branding.js';

export default function LoginPage() {
	const { loginWithPassword } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	async function handleSubmit(e) {
		e.preventDefault();
		setError('');
		setLoading(true);
		try {
			await loginWithPassword(email, password);
			const redirectTo = location.state?.from?.pathname || '/';
			navigate(redirectTo, { replace: true });
		} catch (err) {
			const msg = err?.response?.data?.error || 'Login failed';
			setError(msg);
			console.error('Login failed', err);
		} finally {
			setLoading(false);
		}
	}

    return (
        <div className="min-h-screen grid place-items-center bg-amber-900 p-6">
            <div className="w-full max-w-md">
                <div className="flex items-center gap-3 justify-center mb-6 text-white">
                    <img src={BRAND.logoUrl} alt="Logo" className="h-10 w-auto rounded" />
                    <div>
                        <div className="text-2xl font-bold leading-tight">{BRAND.name}</div>
                        <div className="text-xs uppercase tracking-widest opacity-80">{BRAND.tagline}</div>
                    </div>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4 bg-white/95 backdrop-blur border border-amber-300 rounded-lg p-6 shadow-md">
                    <h1 className="text-xl font-semibold text-amber-900">Sign in</h1>
                    {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">{error}</div>}
                    <div>
                        <label className="block text-sm mb-1 text-amber-900">Email</label>
                        <input className="w-full border border-amber-300 rounded px-3 py-2" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm mb-1 text-amber-900">Password</label>
                        <input className="w-full border border-amber-300 rounded px-3 py-2" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    <button disabled={loading} className="w-full bg-amber-700 hover:bg-amber-800 disabled:opacity-60 text-white rounded px-3 py-2">{loading ? 'Signing in...' : 'Continue'}</button>
                    <div className="text-xs opacity-70">Tip: First login can bootstrap a Super Admin if no users exist.</div>
                </form>
            </div>
        </div>
    );
}