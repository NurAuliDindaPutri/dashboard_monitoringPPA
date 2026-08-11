import './SplashScreen.css';

function SplashScreen({ exiting = false }) {
    return (
        <div
            className={`splash-screen ${exiting ? 'splash-exit' : ''
                }`}
        >
            <div className="splash-content">
                <div className="splash-logo-wrapper">
                    <i className="bi bi-speedometer2 splash-logo-icon" />
                </div>

                <h1 className="splash-title">
                    PPA NEXUS
                </h1>

                <p className="splash-subtitle">
                    Performance Monitoring Dashboard
                </p>

                <div className="splash-loader">
                    <span />
                    <span />
                    <span />
                </div>

                <small className="splash-version">
                    Memuat aplikasi...
                </small>
            </div>
        </div>
    );
}

export default SplashScreen;