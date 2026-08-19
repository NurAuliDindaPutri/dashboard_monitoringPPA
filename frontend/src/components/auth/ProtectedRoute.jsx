import {
    useEffect,
    useState,
} from 'react';

import {
    Navigate,
    Outlet,
    useLocation,
} from 'react-router-dom';

import {
    useAuth,
} from '../../context/AuthContext';

import SplashScreen from '../common/SplashScreen';

function ProtectedRoute() {
    const location = useLocation();

    const {
        user,
        loading,
    } = useAuth();

    const [showSplash, setShowSplash] =
        useState(() => {
            return (
                sessionStorage.getItem(
                    'ppa:show-splash-after-login'
                ) === 'true'
            );
        });

    const [isExiting, setIsExiting] =
        useState(false);

    useEffect(() => {
        if (!showSplash) {
            return undefined;
        }

        const exitTimer = setTimeout(
            () => {
                setIsExiting(true);
            },
            1600
        );

        const removeTimer = setTimeout(
            () => {
                sessionStorage.removeItem(
                    'ppa:show-splash-after-login'
                );

                setShowSplash(false);
            },
            1950
        );

        return () => {
            clearTimeout(exitTimer);
            clearTimeout(removeTimer);
        };
    }, [showSplash]);

    if (loading) {
        return (
            <div
                className="d-flex min-vh-100 align-items-center justify-content-center"
                style={{
                    background:
                        'var(--app-shell-bg)',
                    color:
                        'var(--text-primary)',
                }}
            >
                <div className="text-center">
                    <div
                        className="spinner-border"
                        role="status"
                    />

                    <div className="small mt-3">
                        Memeriksa sesi...
                    </div>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <Navigate
                to="/login"
                replace
                state={{
                    from: location,
                }}
            />
        );
    }

    if (showSplash) {
        return (
            <SplashScreen
                exiting={isExiting}
            />
        );
    }

    return <Outlet />;
}

export default ProtectedRoute;