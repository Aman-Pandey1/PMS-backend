import { useEffect, useState } from 'react';

export default function DashboardPage() {
	const [summary, setSummary] = useState(null);
	useEffect(() => {
		(async () => {
			try { const data = await (await import('../services/dashboard.js')).getSummary(); setSummary(data); } catch (e) { console.error(e); }
		})();
	}, []);
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-amber-900">Dashboard</h1>
            {!summary ? (
                <div className="h-24 rounded-xl bg-gradient-to-r from-amber-100 to-amber-200 animate-pulse" />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <Card title="Scope" value={summary.scope} accent="from-amber-200 to-amber-100" />
                    {'companies' in summary && <Card title="Companies" value={summary.companies} accent="from-amber-300/60 to-amber-100" />}
                    {'users' in summary && <Card title="Users" value={summary.users} accent="from-amber-200 to-amber-50" />}
                    {'employees' in summary && <Card title="Employees" value={summary.employees} accent="from-amber-300/50 to-amber-100" />}
                    {'tasksOpen' in summary && <Card title="Open Tasks" value={summary.tasksOpen} accent="from-amber-200 to-amber-100" />}
                    {'todayPresent' in summary && <Card title="Today Present" value={summary.todayPresent} accent="from-amber-200 to-amber-50" />}
                    {'totalPayable' in summary && <Card title="Total Payable" value={`₹${Number(summary.totalPayable).toLocaleString()}`} accent="from-amber-300/60 to-amber-100" />}
                    {'myTasksOpen' in summary && <Card title="My Open Tasks" value={summary.myTasksOpen} accent="from-amber-200 to-amber-100" />}
                </div>
            )}
        </div>
    );
}

function Card({ title, value, accent = 'from-amber-200 to-amber-100' }) {
    return (
        <div className="group relative rounded-xl border border-amber-300/70 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className={`absolute inset-0 bg-gradient-to-br ${accent} opacity-0 group-hover:opacity-100 transition-opacity`} />
            <div className="relative">
                <div className="px-4 py-3 border-b border-amber-200 bg-amber-50/70 backdrop-blur text-amber-900 font-medium flex items-center justify-between">
                    <span>{title}</span>
                    <span className="text-xs px-2 py-1 rounded-full border border-amber-200 text-amber-800 bg-white/70">Live</span>
                </div>
                <div className="px-4 py-6 text-3xl font-extrabold text-amber-800 tracking-tight">
                    {value}
                </div>
            </div>
        </div>
    );
}