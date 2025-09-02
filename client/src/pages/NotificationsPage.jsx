import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function NotificationsPage() {
	const [items, setItems] = useState([]);
	const { user } = useAuth();
	const [selected, setSelected] = useState(null);

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
							<button onClick={async()=>{ const { getNotification } = await import('../services/notifications.js'); const d = await getNotification(n._id); setSelected(d); }} className="font-medium text-left underline">
								{n.title}
							</button>
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

			{selected && (
				<div className="fixed inset-0 bg-black/40 grid place-items-center p-4 z-50">
					<div className="bg-white rounded-lg border border-amber-300 max-w-lg w-full">
						<div className="px-4 py-3 border-b border-amber-200 bg-amber-50 text-amber-900 flex items-center justify-between">
							<div className="font-medium">{selected.title || selected.type}</div>
							<button onClick={()=>setSelected(null)} className="text-amber-900">✕</button>
						</div>
						<div className="p-4 space-y-2">
							<div className="text-sm"><span className="opacity-70">Type:</span> {selected.type}</div>
							<div className="text-sm"><span className="opacity-70">Body:</span> {selected.body || '-'}</div>
							<div className="text-xs opacity-60">{new Date(selected.createdAt).toLocaleString()}</div>
							{selected.data ? (
								<pre className="text-xs bg-amber-50 border border-amber-200 rounded p-2 overflow-auto">{JSON.stringify(selected.data, null, 2)}</pre>
							) : null}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}