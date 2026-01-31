import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useAuth } from '../../contexts/AuthContext';
import { useState, useEffect } from 'react';

export function AppLayout() {
    const { isAuthenticated, isLoading } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();

    // Close sidebar on route change (for mobile)
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsSidebarOpen(false);
    }, [location.pathname]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-dark-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                    <p className="text-dark-400">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="min-h-screen bg-dark-900">
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />
            <TopBar
                onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
            />
            <main className="md:ml-64 pt-16 min-h-screen transition-all duration-200">
                <div className="p-4 md:p-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
