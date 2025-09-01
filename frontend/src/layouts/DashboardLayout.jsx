import React, { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import clsx from 'clsx';

export default function DashboardLayout() {
	const { user, logout } = useAuth();
	const [companyName, setCompanyName] = useState('');
	const [unread, setUnread] = useState([]);
	const [showPopup, setShowPopup] = useState(false);

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

	useEffect(() => {
		(async () => {
			try {
				if (!user) return;
				const { listNotifications } = await import('../services/notifications.js');
				const items = await listNotifications();
				const pending = (items || []).filter(n => !n.readAt);
				if (pending.length) {
					setUnread(pending);
					setShowPopup(true);
				}
			} catch {}
		})();
	}, [user?.id]);

	async function dismissAndMarkAllRead() {
		try {
			const { markNotificationRead } = await import('../services/notifications.js');
			await Promise.all(unread.map(n => markNotificationRead(n._id || n.id)));
		} catch {}
		setShowPopup(false);
		setUnread([]);
	}

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
					{!(user?.role === 'SUPER_ADMIN' || user?.role === 'COMPANY_ADMIN') && (
						<SidebarLink to="/attendance" label="Attendance" />
					)}
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

			{showPopup && unread.length > 0 && (
				<div className="fixed inset-0 bg-black/40 grid place-items-center p-4 z-50">
					<div className="bg-white rounded-lg border border-amber-300 max-w-lg w-full max-h-[80vh] overflow-auto">
						<div className="px-4 py-3 border-b border-amber-200 bg-amber-50 text-amber-900 flex items-center justify-between">
							<div className="font-medium">Notifications</div>
							<button onClick={dismissAndMarkAllRead} className="text-amber-900">✕</button>
						</div>
						<div className="p-3 divide-y">
							{unread.map((n) => (
								<div key={n._id || n.id} className="py-2">
									<div className="text-sm font-medium text-amber-900">{n.title || n.type}</div>
									<div className="text-sm opacity-80">{n.body}</div>
									<div className="text-xs opacity-60 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
								</div>
							))}
						</div>
						<div className="p-3 border-t border-amber-200 flex justify-end gap-2">
							<button onClick={dismissAndMarkAllRead} className="bg-amber-700 hover:bg-amber-800 text-white rounded px-4 py-2">Mark all read</button>
						</div>
					</div>
				</div>
			)}
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