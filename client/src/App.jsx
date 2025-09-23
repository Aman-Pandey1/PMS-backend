import { Route, Routes, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import CompaniesPage from './pages/CompaniesPage.jsx';
import EmployeesPage from './pages/EmployeesPage.jsx';
import AttendancePage from './pages/AttendancePage.jsx';
import LeavesPage from './pages/LeavesPage.jsx';
import TasksPage from './pages/TasksPage.jsx';
import TaskAssign from './pages/TaskAssign.jsx';
import DocumentsPage from './pages/DocumentsPage.jsx';
// import PayrollPage from './pages/PayrollPage.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import AttendanceCompany from './pages/AttendanceCompany.jsx';
import HomePage from './pages/HomePage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import ShopPage from './pages/ShopPage.jsx';
import PayrollPage from './pages/PayrollPage.jsx';

export default function App() {
	return (
		<Routes>
			<Route path="/login" element={<LoginPage />} />
			<Route path="/home" element={<HomePage />} />
			<Route path="/about" element={<AboutPage />} />
			<Route path="/shop" element={<ShopPage />} />
			<Route
				path="/"
				element={
					<ProtectedRoute>
						<DashboardLayout />
					</ProtectedRoute>
				}
			>
				<Route index element={<DashboardPage />} />
				<Route path="companies" element={<ProtectedRoute roles={['SUPER_ADMIN']}><CompaniesPage /></ProtectedRoute>} />
				<Route path="employees" element={<ProtectedRoute roles={['COMPANY_ADMIN','SUPER_ADMIN']}><EmployeesPage /></ProtectedRoute>} />
				        <Route path="attendance" element={<ProtectedRoute roles={["EMPLOYEE","SUPERVISOR"]}><AttendancePage /></ProtectedRoute>} />
        <Route path="attendance/company" element={<ProtectedRoute roles={["COMPANY_ADMIN","SUPER_ADMIN","SUPERVISOR"]}><AttendanceCompany /></ProtectedRoute>} />
				<Route path="leaves" element={<LeavesPage />} />
				<Route path="tasks" element={<TasksPage />} />
				<Route path="tasks/assign" element={<ProtectedRoute roles={["SUPERVISOR"]}><TaskAssign /></ProtectedRoute>} />
				<Route path="documents" element={<DocumentsPage />} />
				<Route path="payroll" element={<ProtectedRoute roles={['COMPANY_ADMIN','SUPER_ADMIN','SUPERVISOR','EMPLOYEE']}><PayrollPage /></ProtectedRoute>} />
				<Route path="notifications" element={<NotificationsPage />} />
				<Route path="settings" element={<SettingsPage />} />
			</Route>
			<Route path="*" element={<Navigate to="/" replace />} />
		</Routes>
	);
}