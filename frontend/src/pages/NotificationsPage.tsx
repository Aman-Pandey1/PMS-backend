import { useEffect, useState } from 'react';

export default function NotificationsPage() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const data = await (await import('../services/notifications')).listNotifications();
      setItems(data);
    })();
  }, []);

  async function markRead(id: string) {
    await (await import('../services/notifications')).markNotificationRead(id);
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
              <div className="text-sm opacity-70">{n.body}</div>
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