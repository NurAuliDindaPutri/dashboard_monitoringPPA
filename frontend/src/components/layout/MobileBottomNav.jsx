const mainMenus = [
    {
        path: '/dashboard-all-site',
        label: 'Dashboard All Site',
        shortLabel: 'All Site',
        icon: 'bi-grid',
    },
    {
        path: '/dashboard-per-site',
        label: 'Dashboard Per Site',
        shortLabel: 'Per Site',
        icon: 'bi-person',
    },
    {
        path: '/input-data',
        label: 'Input Data',
        shortLabel: 'Input',
        icon: 'bi-pencil-square',
    },
    {
        path: '/import-master-data',
        label: 'Import Excel Bulanan',
        shortLabel: 'Import',
        icon: 'bi-file-earmark-arrow-up',
    },
];

function MobileBottomNav({ activePage = '', onNavigate }) {
    const isActive = (path) => {
        if (!activePage) return false;
        return activePage === path || activePage.startsWith(`${path}/`);
    };

    const handleNavigate = (path) => {
        if (typeof onNavigate === 'function') {
            onNavigate(path);
        }
    };

    return (
        <nav className="mobile-bottom-navigation" aria-label="Navigasi mobile">
            {mainMenus.map((menu) => {
                const active = isActive(menu.path);

                return (
                    <button
                        key={menu.path}
                        type="button"
                        className={[
                            'mobile-bottom-navigation-item',
                            active ? 'active' : '',
                        ]
                            .filter(Boolean)
                            .join(' ')}
                        onClick={() => handleNavigate(menu.path)}
                        aria-label={menu.label}
                        aria-current={active ? 'page' : undefined}
                    >
                        <span className="mobile-bottom-navigation-icon" aria-hidden="true">
                            <i className={`bi ${menu.icon}`} />
                        </span>
                        <span className="mobile-bottom-navigation-label">
                            {menu.shortLabel}
                        </span>
                    </button>
                );
            })}
        </nav>
    );
}

export default MobileBottomNav;