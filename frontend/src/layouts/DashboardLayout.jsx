import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import clsx from 'clsx';

export default function DashboardLayout() {
	const { user, logout } = useAuth();
	return (
		<div className="min-h-screen grid grid-cols-[240px_1fr]">
			<aside className="bg-gray-900 text-white p-4">
				<div className="font-bold mb-6">EMS</div>
				<nav className="flex flex-col gap-2">
					<NavLink className={({ isActive }) => clsx('rounded px-3 py-2 hover:bg-gray-800', isActive && 'bg-gray-800')} to="/">Dashboard</NavLink>
					{user?.role === 'SUPER_ADMIN' && (
						<NavLink className={({ isActive }) => clsx('rounded px-3 py-2 hover:bg-gray-800', isActive && 'bg-gray-800')} to="/companies">Companies</NavLink>
					)}
					<NavLink className={({ isActive }) => clsx('rounded px-3 py-2 hover:bg-gray-800', isActive && 'bg-gray-800')} to="/employees">Employees</NavLink>
					<NavLink className={({ isActive }) => clsx('rounded px-3 py-2 hover:bg-gray-800', isActive && 'bg-gray-800')} to="/attendance">Attendance</NavLink>
					<NavLink className={({ isActive }) => clsx('rounded px-3 py-2 hover:bg-gray-800', isActive && 'bg-gray-800')} to="/leaves">Leaves</NavLink>
					<NavLink className={({ isActive }) => clsx('rounded px-3 py-2 hover:bg-gray-800', isActive && 'bg-gray-800')} to="/tasks">Tasks</NavLink>
					<NavLink className={({ isActive }) => clsx('rounded px-3 py-2 hover:bg-gray-800', isActive && 'bg-gray-800')} to="/documents">Documents</NavLink>
					<NavLink className={({ isActive }) => clsx('rounded px-3 py-2 hover:bg-gray-800', isActive && 'bg-gray-800')} to="/payroll">Payroll</NavLink>
					<NavLink className={({ isActive }) => clsx('rounded px-3 py-2 hover:bg-gray-800', isActive && 'bg-gray-800')} to="/notifications">Notifications</NavLink>
					<NavLink className={({ isActive }) => clsx('rounded px-3 py-2 hover:bg-gray-800', isActive && 'bg-gray-800')} to="/settings">Settings</NavLink>
				</nav>
				<div className="mt-10 text-sm opacity-75">{user?.name} — {user?.role}</div>
				<button onClick={logout} className="mt-2 text-sm underline">Logout</button>
			</aside>
			<main className="p-6">
				<Outlet />
			</main>
		</div>
	);
}