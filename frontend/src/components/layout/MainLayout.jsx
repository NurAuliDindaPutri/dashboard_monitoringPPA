import {
    useEffect,
    useLayoutEffect,
    useState,
} from 'react';

import {
    Outlet,
    useLocation,
    useNavigate,
} from 'react-router-dom';

import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';
import MobileBottomNav from './MobileBottomNav';

const THEME_STORAGE_KEY = 'theme';
const SIDEBAR_STORAGE_KEY = 'sidebarCollapsed';

function getInitialTheme() {
    const savedTheme =
        localStorage.getItem(
            THEME_STORAGE_KEY
        );

    return savedTheme === 'light' ||
        savedTheme === 'dark'
        ? savedTheme
        : 'dark';
}

function MainLayout() {
    const location = useLocation();
    const navigate = useNavigate();

    const [
        isSidebarOpen,
        setIsSidebarOpen,
    ] = useState(false);

    const [
        isCollapsed,
        setIsCollapsed,
    ] = useState(() => {
        return (
            localStorage.getItem(
                SIDEBAR_STORAGE_KEY
            ) === 'true'
        );
    });

    const [theme, setTheme] =
        useState(getInitialTheme);

    const activePage =
        location.pathname;

    useEffect(() => {
        localStorage.setItem(
            SIDEBAR_STORAGE_KEY,
            String(isCollapsed)
        );
    }, [isCollapsed]);

    useLayoutEffect(() => {
        document.documentElement.setAttribute(
            'data-theme',
            theme
        );

        localStorage.setItem(
            THEME_STORAGE_KEY,
            theme
        );
    }, [theme]);

    useEffect(() => {
        setIsSidebarOpen(false);
    }, [location.pathname]);

    const handleNavigate = (path) => {
        navigate(path);
    };

    const toggleMobileSidebar = () => {
        setIsSidebarOpen(
            (previousValue) =>
                !previousValue
        );
    };

    const closeMobileSidebar = () => {
        setIsSidebarOpen(false);
    };

    const toggleSidebarCollapse = () => {
        setIsCollapsed(
            (previousValue) =>
                !previousValue
        );
    };

    const toggleTheme = () => {
        setTheme(
            (previousTheme) =>
                previousTheme === 'dark'
                    ? 'light'
                    : 'dark'
        );
    };

    return (
        <div
            className="app-shell"
            style={{
                minHeight: '100vh',
                backgroundColor:
                    'var(--app-shell-bg)',
            }}
        >
            <Sidebar
                isMobileOpen={
                    isSidebarOpen
                }
                onCloseMobile={
                    closeMobileSidebar
                }
                isCollapsed={
                    isCollapsed
                }
                onToggleCollapse={
                    toggleSidebarCollapse
                }
            />

            <div
                className={`app-main-content d-flex flex-column ${isCollapsed
                        ? 'is-collapsed'
                        : ''
                    }`}
                style={{
                    minHeight: '100vh',
                }}
            >
                <Navbar
                    onToggleMobileSidebar={
                        toggleMobileSidebar
                    }
                    theme={theme}
                    onToggleTheme={
                        toggleTheme
                    }
                />

                <main className="app-page-content flex-grow-1">
                    <Outlet />
                </main>

                <Footer />
            </div>

            <MobileBottomNav
                activePage={activePage}
                onNavigate={handleNavigate}
            />
        </div>
    );
}

export default MainLayout;