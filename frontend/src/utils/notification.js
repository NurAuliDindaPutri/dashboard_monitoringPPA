const STORAGE_KEY = 'ppa-operational-notifications';
const NOTIFICATION_EVENT = 'notifications-updated';

function isBrowser() {
    return (
        typeof window !== 'undefined' &&
        typeof window.localStorage !== 'undefined'
    );
}

function dispatchNotificationEvent() {
    if (!isBrowser()) {
        return;
    }

    window.dispatchEvent(
        new CustomEvent(NOTIFICATION_EVENT)
    );
}

function saveNotifications(notifications) {
    if (!isBrowser()) {
        return;
    }

    try {
        window.localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(
                Array.isArray(notifications)
                    ? notifications
                    : []
            )
        );
    } catch (error) {
        console.error(
            'Gagal menyimpan notifikasi:',
            error
        );
    }
}

export function getNotifications() {
    if (!isBrowser()) {
        return [];
    }

    try {
        const saved =
            window.localStorage.getItem(STORAGE_KEY);

        if (!saved) {
            return [];
        }

        const parsed = JSON.parse(saved);

        return Array.isArray(parsed)
            ? parsed
            : [];
    } catch (error) {
        console.error(
            'Gagal membaca notifikasi:',
            error
        );

        return [];
    }
}

export function addNotification({
    title,
    message,
    type = 'info',
    link = null,
}) {
    const currentNotifications =
        getNotifications();

    const newNotification = {
        id: `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}`,

        title: title || 'Notifikasi',
        message: message || '',
        type,
        link,

        createdAt: new Date().toISOString(),
        isRead: false,
    };

    const updatedNotifications = [
        newNotification,
        ...currentNotifications,
    ].slice(0, 50);

    saveNotifications(updatedNotifications);
    dispatchNotificationEvent();

    return newNotification;
}

export function markNotificationAsRead(
    notificationId
) {
    const updatedNotifications =
        getNotifications().map((notification) => {
            if (
                notification.id === notificationId
            ) {
                return {
                    ...notification,
                    isRead: true,
                };
            }

            return notification;
        });

    saveNotifications(updatedNotifications);
    dispatchNotificationEvent();
}

export function markAllNotificationsAsRead() {
    const updatedNotifications =
        getNotifications().map((notification) => ({
            ...notification,
            isRead: true,
        }));

    saveNotifications(updatedNotifications);
    dispatchNotificationEvent();
}

export function removeNotification(
    notificationId
) {
    const updatedNotifications =
        getNotifications().filter(
            (notification) =>
                notification.id !== notificationId
        );

    saveNotifications(updatedNotifications);
    dispatchNotificationEvent();
}

export function clearAllNotifications() {
    if (!isBrowser()) {
        return;
    }

    try {
        window.localStorage.removeItem(
            STORAGE_KEY
        );

        dispatchNotificationEvent();
    } catch (error) {
        console.error(
            'Gagal menghapus semua notifikasi:',
            error
        );
    }
}

/*
 * Alias untuk kode lama.
 * Jadi file lain yang masih memanggil
 * clearNotifications() tidak akan error.
 */
export function clearNotifications() {
    clearAllNotifications();
}

export { NOTIFICATION_EVENT };