const STORAGE_KEY = 'ppa-operational-notifications';
const NOTIFICATION_EVENT = 'notifications-updated';

export function getNotifications() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        const parsed = saved ? JSON.parse(saved) : [];

        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error('Gagal membaca notifikasi:', error);
        return [];
    }
}

function notifyChange() {
    window.dispatchEvent(
        new CustomEvent(NOTIFICATION_EVENT)
    );
}

export function addNotification({
    title,
    message,
    type = 'info',
    link = null,
}) {
    const current = getNotifications();

    const newNotification = {
        id: `${Date.now()}-${Math.random()}`,
        title,
        message,
        type,
        link,
        createdAt: new Date().toISOString(),
        isRead: false,
    };

    const updated = [
        newNotification,
        ...current,
    ].slice(0, 20);

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updated)
    );

    notifyChange();

    return newNotification;
}

export function markAllNotificationsAsRead() {
    const updated = getNotifications().map((item) => ({
        ...item,
        isRead: true,
    }));

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updated)
    );

    notifyChange();
}

export function clearNotifications() {
    localStorage.removeItem(STORAGE_KEY);
    notifyChange();
}

export { NOTIFICATION_EVENT };