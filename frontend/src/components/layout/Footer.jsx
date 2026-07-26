function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer
            className="d-flex align-items-center justify-content-center border-top"
            style={{
                height: 'var(--footer-height)',
                backgroundColor: 'var(--color-white)',
                borderColor: 'var(--color-border)',
            }}
        >
            <small style={{ color: 'var(--color-text-muted)' }}>
                &copy; {year} Monitoring Performance PPA. All rights reserved.
            </small>
        </footer>
    );
}

export default Footer;