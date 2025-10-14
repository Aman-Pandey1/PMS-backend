import React, { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import clsx from 'clsx';
import { BRAND } from '../branding.js';
import Footer from '../components/Footer.jsx';

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
		let timer;
		(async () => {
			try {
				if (!user) return;
				// Request OS notification permission (non-blocking)
				try { if ('Notification' in window) await Notification.requestPermission(); } catch {}
				const fetchAndNotify = async () => {
					const { listNotifications } = await import('../services/notifications.js');
					const items = await listNotifications();
					const pending = (items || []).filter(n => !n.readAt);
					setUnread(pending);
					if (user?.role !== 'SUPER_ADMIN' && pending.length) setShowPopup(true);
					// Cross-tab dedup using last timestamp
					try {
						const lastKey = 'notif:lastTs';
						const lastTs = Number(localStorage.getItem(lastKey) || '0');
						const newestTs = items.length ? new Date(items[0].createdAt).getTime() : lastTs;
						if (document.hidden && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
							const newly = items.filter(n => !n.readAt && new Date(n.createdAt).getTime() > lastTs).slice(0, 3);
							newly.forEach(n => { try { new Notification(n.title || n.type, { body: n.body || '', tag: n._id || n.id }); } catch {} });
						}
						if (newestTs > lastTs) localStorage.setItem(lastKey, String(newestTs));
						// Title badge
                        document.title = pending.length ? `(${pending.length}) ${BRAND.shortName}` : BRAND.shortName;
						// Favicon badge + App icon badge
						try {
							// App icon badge (installed/ supported browsers)
							if (navigator.setAppBadge) {
								if (pending.length) await navigator.setAppBadge(pending.length);
								else await navigator.clearAppBadge();
							}
						} catch {}
					} catch {}
				};
				await fetchAndNotify();
				timer = setInterval(fetchAndNotify, 30000);
			} catch {}
		})();
        return () => { if (timer) clearInterval(timer); try { document.title = BRAND.shortName; } catch {} };
	}, [user?.id, user?.role]);

	// Dynamic favicon badge using canvas
	useEffect(() => {
		function updateFavicon(count) {
			try {
				const link = document.querySelector("link[rel='icon']") || document.createElement('link');
				link.rel = 'icon';
				const size = 64;
				const canvas = document.createElement('canvas');
				canvas.width = size; canvas.height = size;
				const ctx = canvas.getContext('2d');
                // Base circle in brand accent
                ctx.fillStyle = '#C89A6A';
				ctx.beginPath(); ctx.arc(size/2, size/2, size/2, 0, Math.PI*2); ctx.fill();
                // Letter K
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 34px sans-serif';
				ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText('K', size/2 - (count ? 8 : 0), size/2);
				if (count) {
					const badge = Math.min(99, count);
					ctx.fillStyle = '#ef4444';
					ctx.beginPath(); ctx.arc(size-14, 14, 12, 0, Math.PI*2); ctx.fill();
					ctx.fillStyle = '#ffffff';
					ctx.font = 'bold 14px sans-serif';
					ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
					ctx.fillText(String(badge), size-14, 14);
				}
				link.href = canvas.toDataURL('image/png');
				document.head.appendChild(link);
			} catch {}
		}
        try { document.title = unread.length ? `(${unread.length}) ${BRAND.shortName}` : BRAND.shortName; } catch {}
		try { if (navigator.setAppBadge) { if (unread.length) navigator.setAppBadge(unread.length); else navigator.clearAppBadge(); } } catch {}
		updateFavicon(unread.length || 0);
	}, [unread.length]);

	// React to notification read events to update UI immediately
	useEffect(() => {
		function onNotifRead(e) {
			const id = e?.detail?.id;
			if (!id) return;
			setUnread(prev => {
				const next = prev.filter(n => (n._id || n.id) !== id);
				if (next.length === 0) setShowPopup(false);
				return next;
			});
		}
		window.addEventListener('notification:read', onNotifRead);
		return () => window.removeEventListener('notification:read', onNotifRead);
	}, []);

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
                <div className="flex items-center gap-3 mb-6">
                    <img src={BRAND.logoUrl} alt="Logo" className="h-8 w-auto rounded-sm"/>
                    <div className="font-bold text-xl tracking-wide">{BRAND.shortName}</div>
                </div>
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
					{(user?.role === 'EMPLOYEE' || user?.role === 'SUPERVISOR') && (
						<>
							<SidebarLink to="/attendance" label="Attendance" />
							<SidebarLink to="/payroll" label="Payroll" />
						</>
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
                <div className="mt-10">
                    <Footer />
                </div>
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
									<div className="text-sm opacity-80">
										{user?.role === 'SUPER_ADMIN' && (n.company?.name || n.company?.code || n.user?.companyId) ? (
											<span className="mr-1">{n.company?.name || n.company?.code}</span>
										) : null}
										{user?.role === 'SUPER_ADMIN' && (n.user?.fullName || n.user?.email) ? (
											<span> - {n.user?.fullName || n.user?.email}</span>
										) : null}
										{(user?.role !== 'SUPER_ADMIN') ? n.body : (n.body ? ` · ${n.body}` : '')}
									</div>
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