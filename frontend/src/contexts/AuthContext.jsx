import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);

	useEffect(() => {
		const raw = localStorage.getItem('auth:user');
		if (raw) {
			try {
				setUser(JSON.parse(raw));
			} catch {}
		}
	}, []);

	const loginWithPassword = async (email, password) => {
		const { loginRequest } = await import('../services/auth.js');
		const { user: u, token } = await loginRequest(email, password);
		const authUser = { id: u.id, name: u.fullName, role: u.role, companyId: u.companyId, token };
		setUser(authUser);
		localStorage.setItem('auth:user', JSON.stringify(authUser));
	};

	const logout = () => {
		setUser(null);
		localStorage.removeItem('auth:user');
	};

	const value = useMemo(() => ({ user, loginWithPassword, logout }), [user]);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error('useAuth must be used within AuthProvider');
	return ctx;
}