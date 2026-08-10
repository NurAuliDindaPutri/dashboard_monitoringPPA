function ConfirmModal({
    show,
    title = 'Konfirmasi',
    message,
    confirmText = 'Hapus',
    cancelText = 'Batal',
    icon = 'bi-exclamation-triangle',
    confirmVariant = 'danger',
    onConfirm,
    onCancel,
    loading = false,
}) {
    if (!show) {
        return null;
    }

    return (
        <div
            className="confirm-modal-backdrop"
            role="presentation"
            onMouseDown={(event) => {
                if (
                    event.target ===
                    event.currentTarget &&
                    !loading
                ) {
                    onCancel();
                }
            }}
        >
            <div
                className="confirm-modal-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirm-modal-title"
            >
                <button
                    type="button"
                    className="confirm-modal-close"
                    onClick={onCancel}
                    disabled={loading}
                    aria-label="Tutup"
                >
                    <i className="bi bi-x-lg" />
                </button>

                <div
                    className={`confirm-modal-icon confirm-modal-icon-${confirmVariant}`}
                >
                    <i className={`bi ${icon}`} />
                </div>

                <div className="confirm-modal-content">
                    <h5
                        id="confirm-modal-title"
                        className="confirm-modal-title"
                    >
                        {title}
                    </h5>

                    <p className="confirm-modal-message">
                        {message}
                    </p>
                </div>

                <div className="confirm-modal-actions">
                    <button
                        type="button"
                        className="btn btn-light confirm-modal-btn"
                        onClick={onCancel}
                        disabled={loading}
                    >
                        {cancelText}
                    </button>

                    <button
                        type="button"
                        className={`btn btn-${confirmVariant} confirm-modal-btn`}
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span
                                    className="spinner-border spinner-border-sm me-2"
                                    aria-hidden="true"
                                />
                                Memproses...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-trash3 me-2" />
                                {confirmText}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmModal;