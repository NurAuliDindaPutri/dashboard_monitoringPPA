import { useEffect, useLayoutEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';

const THEME_STORAGE_KEY = 'theme';

function getInitialTheme() {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return saved === 'light' || saved === 'dark' ? saved : 'dark';
}

function MainLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const [isCollapsed, setIsCollapsed] = useState(() => {
        return localStorage.getItem('sidebarCollapsed') === 'true';
    });

    const [theme, setTheme] = useState(getInitialTheme);

    useEffect(() => {
        localStorage.setItem('sidebarCollapsed', String(isCollapsed));
    }, [isCollapsed]);

    // useLayoutEffect (bukan useEffect) supaya attribute data-theme diset
    // sebelum browser sempat paint - menghindari kedipan warna theme yang salah.
    useLayoutEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(THEME_STORAGE_KEY, theme);
    }, [theme]);

    const toggleMobileSidebar = () => {
        setIsSidebarOpen((prev) => !prev);
    };

    const closeMobileSidebar = () => {
        setIsSidebarOpen(false);
    };

    const toggleSidebarCollapse = () => {
        setIsCollapsed((prev) => !prev);
    };

    const toggleTheme = () => {
        setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
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
                <Navbar
                    onToggleMobileSidebar={toggleMobileSidebar}
                    theme={theme}
                    onToggleTheme={toggleTheme}
                />

                <main className="app-page-content flex-grow-1">
                    <Outlet />
                </main>

                <Footer />
            </div>
        </div>
    );
}

export default MainLayout;