import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';

function MainLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
    const closeSidebar = () => setIsSidebarOpen(false);

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg)' }}>
            <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

            <div className="app-main-content d-flex flex-column" style={{ minHeight: '100vh' }}>
                <Navbar onToggleSidebar={toggleSidebar} />

                <main className="flex-grow-1 p-3 p-lg-4">
                    <Outlet />
                </main>

                <Footer />
            </div>
        </div>
    );
}

export default MainLayout;