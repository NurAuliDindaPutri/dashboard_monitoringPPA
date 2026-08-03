import { useState } from 'react';

const mainMenus = [
    {
        path: '/dashboard-all-site',
        label: 'All Site',
        shortLabel: 'All Site',
        icon: 'bi-grid',
    },
    {
        path: '/dashboard-per-site',
        label: 'Per Site',
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
        path: '/data-unit',
        label: 'Data Unit',
        shortLabel: 'Unit',
        icon: 'bi-truck',
    },
];

const moreMenus = [
    {
        path: '/detail-lt-supply',
        label: 'Detail LT Supply',
        icon: 'bi-clock',
    },
    {
        path: '/pending-supply',
        label: 'Pending Supply',
        icon: 'bi-box',
    },
    {
        path: '/critical-item',
        label: 'Critical Item',
        icon: 'bi-exclamation-diamond',
    },
    {
        path: '/import-excel',
        label: 'Import Excel Bulanan',
        icon: 'bi-file-earmark-arrow-up',
    },
];

function MobileBottomNav({
    activePage,
    onNavigate,
}) {
    const [showMore, setShowMore] =
        useState(false);

    const isActive = (path) => {
        return (
            activePage === path ||
            activePage.startsWith(
                `${path}/`
            )
        );
    };

    const isMoreActive =
        moreMenus.some((menu) =>
            isActive(menu.path)
        );

    const handleNavigate = (path) => {
        onNavigate(path);
        setShowMore(false);
    };

    return (
        <>
            {showMore && (
                <div
                    className="mobile-nav-overlay"
                    onClick={() =>
                        setShowMore(false)
                    }
                >
                    <section
                        className="mobile-nav-sheet"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >
                        <div className="mobile-nav-handle" />

                        <div className="mobile-nav-sheet-header">
                            <div>
                                <h6>
                                    Menu lainnya
                                </h6>

                                <small>
                                    Pilih halaman yang
                                    ingin dibuka
                                </small>
                            </div>

                            <button
                                type="button"
                                className="mobile-nav-close"
                                onClick={() =>
                                    setShowMore(
                                        false
                                    )
                                }
                                aria-label="Tutup menu"
                            >
                                <i className="bi bi-x-lg" />
                            </button>
                        </div>

                        <div className="mobile-nav-more-grid">
                            {moreMenus.map(
                                (menu) => (
                                    <button
                                        key={
                                            menu.path
                                        }
                                        type="button"
                                        className={`mobile-nav-more-item ${isActive(
                                            menu.path
                                        )
                                                ? 'active'
                                                : ''
                                            }`}
                                        onClick={() =>
                                            handleNavigate(
                                                menu.path
                                            )
                                        }
                                    >
                                        <span className="mobile-nav-more-icon">
                                            <i
                                                className={`bi ${menu.icon}`}
                                            />
                                        </span>

                                        <span>
                                            {
                                                menu.label
                                            }
                                        </span>
                                    </button>
                                )
                            )}
                        </div>
                    </section>
                </div>
            )}

            <nav
                className="mobile-bottom-navigation"
                aria-label="Navigasi mobile"
            >
                {mainMenus.map((menu) => (
                    <button
                        key={menu.path}
                        type="button"
                        className={`mobile-bottom-navigation-item ${isActive(
                            menu.path
                        )
                                ? 'active'
                                : ''
                            }`}
                        onClick={() =>
                            handleNavigate(
                                menu.path
                            )
                        }
                    >
                        <span className="mobile-bottom-navigation-icon">
                            <i
                                className={`bi ${menu.icon}`}
                            />
                        </span>

                        <span className="mobile-bottom-navigation-label">
                            {menu.shortLabel}
                        </span>
                    </button>
                ))}

                <button
                    type="button"
                    className={`mobile-bottom-navigation-item ${isMoreActive ||
                            showMore
                            ? 'active'
                            : ''
                        }`}
                    onClick={() =>
                        setShowMore(
                            (previous) =>
                                !previous
                        )
                    }
                >
                    <span className="mobile-bottom-navigation-icon">
                        <i className="bi bi-grid-3x3-gap" />
                    </span>

                    <span className="mobile-bottom-navigation-label">
                        Lainnya
                    </span>
                </button>
            </nav>
        </>
    );
}

export default MobileBottomNav;