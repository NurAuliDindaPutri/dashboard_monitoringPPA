import {
    useLayoutEffect,
    useState,
} from 'react';
import {
    Link,
    Navigate,
    useLocation,
    useNavigate,
} from 'react-router-dom';

import {
    useAuth,
} from '../../context/AuthContext';

import './Login.css';

const THEME_STORAGE_KEY = 'theme';

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

function Login() {
    const navigate = useNavigate();
    const location = useLocation();

    const {
        user,
        loading: authLoading,
        login,
    } = useAuth();

    const [theme, setTheme] =
        useState(getInitialTheme);
    const [email, setEmail] =
        useState('');
    const [password, setPassword] =
        useState('');
    const [showPassword, setShowPassword] =
        useState(false);
    const [submitting, setSubmitting] =
        useState(false);
    const [formError, setFormError] =
        useState('');

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

    if (!authLoading && user) {
        return (
            <Navigate
                to="/dashboard-all-site"
                replace
            />
        );
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setFormError('');
        setSubmitting(true);

        try {
            await login({
                email: email.trim(),
                password,
            });

            sessionStorage.setItem(
                'ppa:show-splash-after-login',
                'true'
            );

            const destination =
                location.state?.from
                    ?.pathname ||
                '/dashboard-all-site';

            navigate(destination, {
                replace: true,
            });
        } catch (loginError) {
            setFormError(
                loginError.response?.data
                    ?.message ||
                'Login gagal. Periksa koneksi dan coba kembali.'
            );
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main className="ppa-login-page">
            <button
                type="button"
                className="ppa-login-theme-btn"
                onClick={() =>
                    setTheme(
                        theme === 'dark'
                            ? 'light'
                            : 'dark'
                    )
                }
                aria-label={
                    theme === 'dark'
                        ? 'Aktifkan light mode'
                        : 'Aktifkan dark mode'
                }
                title={
                    theme === 'dark'
                        ? 'Light mode'
                        : 'Dark mode'
                }
            >
                <i
                    className={`bi ${theme === 'dark'
                        ? 'bi-sun'
                        : 'bi-moon-stars'
                        }`}
                />
            </button>

            <section className="ppa-login-shell">
                <div className="ppa-login-visual">
                    <div className="ppa-login-brand">
                        <div className="ppa-login-brand-icon">
                            <img
                                src="/images/wasaka_UT.png"
                                alt="United Tractors"
                                className="ppa-login-brand-logo"
                            />

                        </div>

                        <div>
                            <div className="ppa-login-company">
                                UNITED TRACTORS
                            </div>
                            <div className="ppa-login-system">
                                Monitoring PPA
                            </div>
                        </div>
                    </div>

                    <div className="ppa-login-visual-copy">
                        <span className="ppa-login-kicker">
                            PERFORMANCE MONITORING
                        </span>

                        <h1>
                            PPA NEXUS
                        </h1>
                    </div>
                </div>

                <div className="ppa-login-form-panel">
                    <div className="ppa-login-form-wrap">
                        <div className="ppa-login-mobile-brand">
                            UNITED TRACTORS · Monitoring PPA
                        </div>

                        <h2>Selamat datang</h2>

                        <p className="ppa-login-subtitle">
                            Masuk untuk membuka web.
                        </p>

                        {formError && (
                            <div
                                className="alert alert-danger ppa-login-alert"
                                role="alert"
                            >
                                <i className="bi bi-exclamation-circle me-2" />
                                {formError}
                            </div>
                        )}

                        <form
                            onSubmit={handleSubmit}
                            noValidate
                        >
                            <div className="mb-3">
                                <label
                                    className="form-label"
                                    htmlFor="login-email"
                                >
                                    Email
                                </label>

                                <div className="ppa-login-input-wrap">
                                    <i className="bi bi-envelope" />
                                    <input
                                        id="login-email"
                                        type="email"
                                        className="form-control"
                                        value={email}
                                        onChange={(event) =>
                                            setEmail(
                                                event.target.value
                                            )
                                        }
                                        placeholder="nama@perusahaan.com"
                                        autoComplete="username"
                                        required
                                        disabled={submitting}
                                    />
                                </div>
                            </div>

                            <div className="mb-4">
                                <label
                                    className="form-label"
                                    htmlFor="login-password"
                                >
                                    Password
                                </label>

                                <div className="ppa-login-input-wrap">
                                    <i className="bi bi-lock" />
                                    <input
                                        id="login-password"
                                        type={
                                            showPassword
                                                ? 'text'
                                                : 'password'
                                        }
                                        className="form-control"
                                        value={password}
                                        onChange={(event) =>
                                            setPassword(
                                                event.target.value
                                            )
                                        }
                                        placeholder="Masukkan password"
                                        autoComplete="current-password"
                                        required
                                        disabled={submitting}
                                    />

                                    <button
                                        type="button"
                                        className="ppa-login-password-toggle"
                                        onClick={() =>
                                            setShowPassword(
                                                (current) =>
                                                    !current
                                            )
                                        }
                                        aria-label={
                                            showPassword
                                                ? 'Sembunyikan password'
                                                : 'Tampilkan password'
                                        }
                                    >
                                        <i
                                            className={`bi ${showPassword
                                                ? 'bi-eye-slash'
                                                : 'bi-eye'
                                                }`}
                                        />
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="btn ppa-login-submit"
                                disabled={
                                    submitting ||
                                    !email.trim() ||
                                    !password
                                }
                            >
                                {submitting ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" />
                                        Memproses...
                                    </>
                                ) : (
                                    <>
                                        MASUK
                                        <i className="bi bi-arrow-right ms-2" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="ppa-register-action">
                            <span>
                                Belum Memiliki Akun?
                            </span>

                            <Link
                                to="/register"
                                className="btn ppa-login-submit"
                            >
                                <i className="bi bi-person-plus me-2" />
                                DAFTAR
                            </Link>
                        </div>

                        <div className="ppa-login-help">
                            <i className="bi bi-shield-check" />
                            <span>
                                Hubungi administrator jika
                                mengalami kendala akses.
                            </span>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}

export default Login;