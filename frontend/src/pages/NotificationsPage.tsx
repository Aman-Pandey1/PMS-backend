export default function NotificationsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Notifications</h1>
      <div className="grid gap-2">
        {[1,2,3].map((i) => (
          <div key={i} className="border rounded p-3">
            Notification {i}
          </div>
        ))}
      </div>
    </div>
  );
}