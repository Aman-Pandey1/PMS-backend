import { useEffect, useState } from 'react';

export default function DashboardPage() {
	const [summary, setSummary] = useState(null);
	useEffect(() => {
		(async () => {
			try { const data = await (await import('../services/dashboard.js')).getSummary(); setSummary(data); } catch (e) { console.error(e); }
		})();
	}, []);
	return (
		<div className="space-y-4">
			<h1 className="text-2xl font-bold">Dashboard</h1>
			{!summary ? (
				<div>Loading...</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<Card title="Scope" value={summary.scope} />
					{'companies' in summary && <Card title="Companies" value={summary.companies} />}
					{'users' in summary && <Card title="Users" value={summary.users} />}
					{'employees' in summary && <Card title="Employees" value={summary.employees} />}
					{'tasksOpen' in summary && <Card title="Open Tasks" value={summary.tasksOpen} />}
					{'todayPresent' in summary && <Card title="Today Present" value={summary.todayPresent} />}
					{'totalPayable' in summary && <Card title="Total Payable" value={`₹${Number(summary.totalPayable).toLocaleString()}`} />}
					{'myTasksOpen' in summary && <Card title="My Open Tasks" value={summary.myTasksOpen} />}
				</div>
			)}
		</div>
	);
}

function Card({ title, value }) {
	return (
		<div className="rounded-lg border border-amber-300 bg-white">
			<div className="px-4 py-3 border-b border-amber-200 bg-amber-50 text-amber-900 font-medium">{title}</div>
			<div className="px-4 py-6 text-2xl font-bold text-amber-800">{value}</div>
		</div>
	);
}