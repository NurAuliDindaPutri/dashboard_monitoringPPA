import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';

function MainLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const [isCollapsed, setIsCollapsed] = useState(() => {
        return localStorage.getItem('sidebarCollapsed') === 'true';
    });

    useEffect(() => {
        localStorage.setItem('sidebarCollapsed', String(isCollapsed));
    }, [isCollapsed]);

    const toggleMobileSidebar = () => {
        setIsSidebarOpen((prev) => !prev);
    };

    const closeMobileSidebar = () => {
        setIsSidebarOpen(false);
    };

    const toggleSidebarCollapse = () => {
        setIsCollapsed((prev) => !prev);
    };

    return (
        <div
            className="app-shell"
            style={{
                minHeight: '100vh',
                backgroundColor: 'var(--app-shell-bg)',
            }}
        >
            <Sidebar
                isMobileOpen={isSidebarOpen}
                onCloseMobile={closeMobileSidebar}
                isCollapsed={isCollapsed}
                onToggleCollapse={toggleSidebarCollapse}
            />

            <div
                className={`app-main-content d-flex flex-column ${isCollapsed ? 'is-collapsed' : ''
                    }`}
                style={{ minHeight: '100vh' }}
            >
                <Navbar onToggleSidebar={toggleMobileSidebar} />

                <main className="app-page-content flex-grow-1">
                    <Outlet />
                </main>

                <Footer />
            </div>
        </div>
    );
}

export default MainLayout;