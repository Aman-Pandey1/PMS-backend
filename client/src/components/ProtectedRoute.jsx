import { Navigate, useLocation } from 'react-router-dom';
import React from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

export function ProtectedRoute({ children, roles }) {
	const { user } = useAuth();
	const location = useLocation();
	if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
	if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
	return <>{children}</>;
}