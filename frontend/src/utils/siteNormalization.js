/**
 * Satu sumber aturan normalisasi site untuk seluruh frontend.
 *
 * Catatan:
 * - Helper ini hanya mengatur nama tampilan dan pilihan record site.
 * - site_code dan site_id asli di database tidak diubah.
 */

export const DASHBOARD_SITE_ORDER = [
    'AMC',
    'BA',
    'BGE',
    'BIB',
    'DMP',
    'IPT',
    'MHU',
    'MIFA',
    'MIP',
    'MLP',
    'PIK',
    'SBS',
    'SKS',
    'VALE',
    'WARA',
];

const SITE_ALIASES = {
    AMC: 'AMC',
    'AMC-LAC': 'AMC',
    'AMC-MAC': 'AMC',
    LAC: 'AMC',
    BA: 'BA',
    PTBA: 'BA',
    WARA: 'WARA',
    ADRW: 'WARA',
};

const SITE_PRIORITY = {
    'AMC-LAC': 1,
    LAC: 1,
    'AMC-MAC': 2,
    AMC: 3,
    BA: 1,
    PTBA: 2,
    WARA: 1,
    ADRW: 2,
};

export function normalizeRawSiteCode(siteCode) {
    return String(siteCode ?? '')
        .trim()
        .toUpperCase();
}

export function normalizeSiteCode(siteCode) {
    const code =
        normalizeRawSiteCode(siteCode);

    return SITE_ALIASES[code] || code;
}

export function getSitePriority(siteCode) {
    const code =
        normalizeRawSiteCode(siteCode);

    return SITE_PRIORITY[code] ?? 1;
}

/**
 * Membentuk satu opsi dropdown untuk setiap site normalisasi.
 * Record terpilih tetap menyimpan id dan site_code asli melalui
 * original_site_code agar request API tetap memakai site_id yang valid.
 */
export function normalizeDashboardSites(
    rawSites = []
) {
    const groupedSites = new Map();

    rawSites.forEach((site) => {
        const normalizedCode =
            normalizeSiteCode(
                site.site_code
            );

        if (
            !DASHBOARD_SITE_ORDER.includes(
                normalizedCode
            )
        ) {
            return;
        }

        const candidate = {
            ...site,
            site_code: normalizedCode,
            original_site_code:
                site.site_code,
        };

        const existing =
            groupedSites.get(
                normalizedCode
            );

        if (
            !existing ||
            getSitePriority(
                candidate.original_site_code
            ) <
            getSitePriority(
                existing.original_site_code
            )
        ) {
            groupedSites.set(
                normalizedCode,
                candidate
            );
        }
    });

    return DASHBOARD_SITE_ORDER
        .map((code) =>
            groupedSites.get(code)
        )
        .filter(Boolean);
}