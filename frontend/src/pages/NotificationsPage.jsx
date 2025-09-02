import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function NotificationsPage() {
	const [items, setItems] = useState([]);
	const { user } = useAuth();

	useEffect(() => {
		(async () => {
			const data = await (await import('../services/notifications.js')).listNotifications();
			setItems(data);
		})();
	}, []);

	async function markRead(id) {
		await (await import('../services/notifications.js')).markNotificationRead(id);
		setItems((xs) => xs.map((x) => x._id === id ? { ...x, readAt: new Date().toISOString() } : x));
	}

	return (
		<div className="space-y-4">
			<h1 className="text-xl font-semibold">Notifications</h1>
			<div className="grid gap-2">
				{items.map((n) => (
					<div key={n._id} className="border rounded p-3 flex justify-between items-center">
						<div>
							<div className="font-medium">{n.title}</div>
							<div className="text-sm opacity-70">
								{user?.role === 'SUPER_ADMIN' && (n.company?.name || n.company?.code || n.user?.companyId) ? (
									<span className="mr-1">{n.company?.name || n.company?.code}</span>
								) : null}
								{user?.role === 'SUPER_ADMIN' && (n.user?.fullName || n.user?.email) ? (
									<span> - {n.user?.fullName || n.user?.email}</span>
								) : null}
								{(user?.role !== 'SUPER_ADMIN') ? n.body : (n.body ? ` · ${n.body}` : '')}
							</div>
						</div>
						{!n.readAt && (
							<button className="text-sm underline" onClick={() => markRead(n._id)}>Mark read</button>
						)}
					</div>
				))}
			</div>
		</div>
	);
}