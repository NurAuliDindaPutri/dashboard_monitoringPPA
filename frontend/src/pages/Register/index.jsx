import {
    useLayoutEffect,
    useState,
} from 'react';
import {
    Link,
    Navigate,
    useNavigate,
} from 'react-router-dom';

import { registerUser } from '../../api/auth.api';

import {
    useAuth,
} from '../../context/AuthContext';

import '../login/Login.css';

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

function Register() {
    const navigate = useNavigate();
    const {
        user,
        loading: authLoading,
        login,
    } = useAuth();

    const [theme, setTheme] =
        useState(getInitialTheme);
    const [fullName, setFullName] =
        useState('');
    const [email, setEmail] =
        useState('');
    const [password, setPassword] =
        useState('');
    const [confirmPassword, setConfirmPassword] =
        useState('');
    const [showPassword, setShowPassword] =
        useState(false);
    const [
        showConfirmPassword,
        setShowConfirmPassword,
    ] = useState(false);
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

        if (password !== confirmPassword) {
            setFormError(
                'Konfirmasi password tidak sama.'
            );
            return;
        }

        if (password.length < 8) {
            setFormError(
                'Password minimal 8 karakter.'
            );
            return;
        }

        setSubmitting(true);

        try {
            // 1. Buat akun
            await registerUser({
                full_name: fullName.trim(),
                email: email.trim(),
                password,
            });

            // 2. Login otomatis menggunakan akun baru
            await login({
                email: email.trim(),
                password,
            });

            // 3. Munculkan splash satu kali
            sessionStorage.setItem(
                'ppa:show-splash-after-login',
                'true'
            );

            // 4. Langsung menuju dashboard
            navigate(
                '/dashboard-all-site',
                {
                    replace: true,
                }
            );
        } catch (registerError) {
            setFormError(
                registerError.response?.data
                    ?.message ||
                'Registrasi atau login otomatis gagal. Silakan coba kembali.'
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
                aria-label="Ganti tema"
            >
                <i
                    className={`bi ${theme === 'dark'
                        ? 'bi-sun'
                        : 'bi-moon-stars'
                        }`}
                />
            </button>

            <section className="ppa-login-shell ppa-register-shell">
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

                <div className="ppa-login-form-panel ppa-register-panel">
                    <div className="ppa-login-form-wrap">
                        <h2>Buat akun</h2>
                        <p className="ppa-login-subtitle">
                            Lengkapi data berikut untuk
                            membuat akun PPA NEXUS
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

                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label" htmlFor="register-name">
                                    Nama lengkap
                                </label>
                                <div className="ppa-login-input-wrap">
                                    <i className="bi bi-person" />
                                    <input
                                        id="register-name"
                                        type="text"
                                        className="form-control"
                                        placeholder='dinda putri'
                                        value={fullName}
                                        onChange={(event) =>
                                            setFullName(event.target.value)
                                        }
                                        autoComplete="name"
                                        required
                                        disabled={submitting}
                                    />
                                </div>
                            </div>

                            <div className="mb-3">
                                <label className="form-label" htmlFor="register-email">
                                    Email
                                </label>
                                <div className="ppa-login-input-wrap">
                                    <i className="bi bi-envelope" />
                                    <input
                                        id="register-email"
                                        type="email"
                                        className="form-control"
                                        placeholder='nama@namaperusahaan.com'
                                        value={email}
                                        onChange={(event) =>
                                            setEmail(event.target.value)
                                        }
                                        autoComplete="email"
                                        required
                                        disabled={submitting}
                                    />
                                </div>
                            </div>

                            <div className="mb-3">
                                <label className="form-label" htmlFor="register-password">
                                    Password
                                </label>
                                <div className="ppa-login-input-wrap">
                                    <i className="bi bi-lock" />
                                    <input
                                        id="register-password"
                                        type={showPassword ? 'text' : 'password'}
                                        className="form-control"
                                        placeholder='Masukkan password'
                                        value={password}
                                        onChange={(event) =>
                                            setPassword(event.target.value)
                                        }
                                        autoComplete="new-password"
                                        minLength={8}
                                        required
                                        disabled={submitting}
                                    />
                                    <button
                                        type="button"
                                        className="ppa-login-password-toggle"
                                        onClick={() =>
                                            setShowPassword((current) => !current)
                                        }
                                        aria-label="Tampilkan atau sembunyikan password"
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

                            <div className="mb-3">
                                <label className="form-label" htmlFor="register-confirm-password">
                                    Konfirmasi password
                                </label>
                                <div className="ppa-login-input-wrap">
                                    <i className="bi bi-shield-lock" />
                                    <input
                                        id="register-confirm-password"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        className="form-control"
                                        placeholder='Masukkan kembali password'
                                        value={confirmPassword}
                                        onChange={(event) =>
                                            setConfirmPassword(event.target.value)
                                        }
                                        autoComplete="new-password"
                                        minLength={8}
                                        required
                                        disabled={submitting}
                                    />
                                    <button
                                        type="button"
                                        className="ppa-login-password-toggle"
                                        onClick={() =>
                                            setShowConfirmPassword(
                                                (current) => !current
                                            )
                                        }
                                        aria-label={
                                            showConfirmPassword
                                                ? 'Sembunyikan konfirmasi password'
                                                : 'Tampilkan konfirmasi password'
                                        }
                                    >
                                        <i
                                            className={`bi ${showConfirmPassword
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
                                disabled={submitting}
                            >
                                {submitting
                                    ? 'Mendaftarkan...'
                                    : 'DAFTAR'}
                            </button>
                        </form>

                        <div className="ppa-auth-switch">
                            Sudah memiliki akun?{' '}
                            <Link to="/login">
                                Masuk
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}

export default Register;
