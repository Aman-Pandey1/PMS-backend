import React, { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import clsx from 'clsx';

export default function DashboardLayout() {
	const { user, logout } = useAuth();
	const [companyName, setCompanyName] = useState('');
	useEffect(() => {
		(async () => {
			try {
				if (user?.companyId && user?.role !== 'SUPER_ADMIN') {
					const { getMyCompany } = await import('../services/companies.js');
					const c = await getMyCompany();
					setCompanyName(c.name || '');
				}
			} catch {}
		})();
	}, [user?.companyId, user?.role]);
	return (
		<div className="min-h-screen grid grid-cols-[260px_1fr] bg-zinc-50">
			<aside className="bg-amber-700 text-white p-4">
				<div className="font-bold mb-6 text-2xl tracking-wide">EMS</div>
				<nav className="flex flex-col gap-1">
					<Section title="General" />
					<SidebarLink to="/" label="Dashboard" />
					{user?.role === 'SUPER_ADMIN' && (
						<>
							<Section title="Super Admin" />
							<SidebarLink to="/companies" label="Companies" />
						</>
					)}
					{(user?.role === 'COMPANY_ADMIN' || user?.role === 'SUPER_ADMIN') && (
						<>
							<Section title="Company" />
							<SidebarLink to="/employees" label={user?.role === 'SUPER_ADMIN' ? 'All Employees' : 'Employees'} />
							<SidebarLink to="/payroll" label="Payroll" />
						</>
					)}
					<Section title="Work" />
					<SidebarLink to="/attendance" label="Attendance" />
					{(user?.role === 'COMPANY_ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'SUPERVISOR') && (
						<SidebarLink to="/attendance/company" label="Company Attendance" />
					)}
					<SidebarLink to="/leaves" label="Leaves" />
					<SidebarLink to="/tasks" label="Tasks" />
					<SidebarLink to="/documents" label="Documents" />
					<SidebarLink to="/notifications" label="Notifications" />
					<SidebarLink to="/settings" label="Settings" />
				</nav>
				<div className="mt-10 text-sm opacity-90 bg-amber-800/50 rounded p-3">
					<div className="font-medium">{user?.name}</div>
					<div className="opacity-80">{user?.role}{user?.companyId ? ` · ${companyName || user.companyId}` : ''}</div>
					<button onClick={logout} className="mt-2 text-sm underline">Logout</button>
				</div>
			</aside>
			<main className="p-6">
				<Outlet />
			</main>
		</div>
	);
}

function Section({ title }) {
	return <div className="uppercase text-xs tracking-widest opacity-80 mt-4 mb-1">{title}</div>;
}

function SidebarLink({ to, label }) {
	return (
		<NavLink
			className={({ isActive }) => clsx(
				'rounded px-3 py-2 hover:bg-amber-800/60 transition-colors',
				isActive && 'bg-amber-900/60'
			)}
			to={to}
		>
			{label}
		</NavLink>
	);
}