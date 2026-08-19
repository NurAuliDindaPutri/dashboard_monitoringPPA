import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';

import {
    getCurrentUser,
    loginUser,
    logoutUser,
} from '../api/auth.api';

const AuthContext =
    createContext(null);

export function AuthProvider({
    children,
}) {
    const [user, setUser] =
        useState(null);
    const [loading, setLoading] =
        useState(true);

    const refreshSession =
        useCallback(async () => {
            try {
                const currentUser =
                    await getCurrentUser();

                setUser(currentUser);
            } catch {
                setUser(null);
            } finally {
                setLoading(false);
            }
        }, []);

    useEffect(() => {
        refreshSession();
    }, [refreshSession]);

    useEffect(() => {
        function handleUnauthorized() {
            setUser(null);
            setLoading(false);
        }

        window.addEventListener(
            'ppa:unauthorized',
            handleUnauthorized
        );

        return () => {
            window.removeEventListener(
                'ppa:unauthorized',
                handleUnauthorized
            );
        };
    }, []);

    const login = useCallback(
        async (credentials) => {
            const nextUser =
                await loginUser(
                    credentials
                );

            setUser(nextUser);
            return nextUser;
        },
        []
    );

    const logout = useCallback(
        async () => {
            try {
                await logoutUser();
            } finally {
                setUser(null);
            }
        },
        []
    );

    const value = useMemo(
        () => ({
            user,
            loading,
            login,
            logout,
            refreshSession,
        }),
        [
            user,
            loading,
            login,
            logout,
            refreshSession,
        ]
    );

    return (
        <AuthContext.Provider
            value={value}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context =
        useContext(AuthContext);

    if (!context) {
        throw new Error(
            'useAuth harus dipakai di dalam AuthProvider.'
        );
    }

    return context;
}