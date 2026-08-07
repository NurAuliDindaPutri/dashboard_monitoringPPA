/**
 * unitFilter.js
 * Helper khusus untuk logika dropdown, filter, & grouping Unit di
 * Dashboard Per Site.
 *
 * Aturan (per revisi client):
 * - SEMUA site hanya menampilkan 3 kelompok unit: PC2000, PC1250, HD785.
 * - Khusus site BIB, ditambah 1 kelompok: PC3400 (total 4 kelompok).
 * - Semua VARIASI nama untuk model yang sama dianggap 1 kelompok/unit yang
 *   sama. Contoh nyata dari data:
 *     "PC1250-8", "PC1250-8R", "PC1250SP-8", "PC1250SP-11R"  -> grup "PC1250"
 *     "PC2000-8", "PC2000-11R", dan variasi lain               -> grup "PC2000"
 *   Pencocokan pakai PREFIX match terhadap nama grup ("PC1250"/"PC2000"),
 *   jadi akhiran apapun (-8, -8R, SP-8, SP-11R, dst.) tetap masuk grup yang
 *   sama. Ini SENGAJA lebih longgar dari aturan sebelumnya (yang mensyaratkan
 *   akhiran "-8" persis) karena client mengonfirmasi varian "SP" juga harus
 *   digabung sebagai unit yang sama.
 * - HD785 & PC3400 tetap pakai prefix match apa adanya (boleh ada akhiran
 *   apapun setelahnya, mis. "HD785-7", "PC3400-11M0").
 * - Unit yang model_name-nya tidak cocok grup manapun (mis. "D85ESS-2",
 *   "SKT105S") TIDAK ditampilkan di dropdown/chart, dan namanya TIDAK diubah
 *   di tempat lain.
 *
 * PENTING soal id vs nama tampilan:
 * - Setiap varian (mis. "PC1250-8" dan "PC1250SP-11R") tetap punya row &
 *   `unit_model_id` sendiri-sendiri di database — grouping ini HANYA
 *   dilakukan di frontend, untuk tampilan (dropdown) dan untuk agregasi
 *   angka pada chart. Data mentah / cara membaca ke database TIDAK berubah.
 * - Backend hanya bisa memfilter berdasarkan SATU `unit_model_id` (integer),
 *   jadi filter per-grup (yang mewakili banyak id sekaligus) tidak boleh
 *   dikirim ke backend sebagai `unit_model_id`. Ambil semua data performa
 *   unit untuk site tsb (tanpa filter unit di backend), lalu lakukan
 *   grouping & filter grup di frontend memakai fungsi-fungsi di bawah ini.
 */

// Kode site BIB (dicocokkan case-insensitive)
export const BIB_SITE_CODE = 'BIB';

// Grup unit yang SELALU ditampilkan, untuk semua site.
// `match`: prefix grup yang dicocokkan di awal model_name (case-insensitive).
// `label`: nama grup yang ditampilkan (dropdown & chart).
export const BASE_UNIT_GROUPS = [
    { match: 'PC2000', label: 'PC2000' },
    { match: 'PC1250', label: 'PC1250' },
    { match: 'HD785', label: 'HD785' },
];

// Grup unit tambahan yang HANYA ditampilkan untuk site BIB.
export const BIB_EXTRA_UNIT_GROUPS = [
    { match: 'PC3400', label: 'PC3400' },
];

function normalizeCode(value) {
    return String(value || '').trim().toUpperCase();
}

/**
 * Cek apakah site_code yang diberikan adalah site BIB.
 * @param {string} siteCode
 * @returns {boolean}
 */
export function isBibSiteCode(siteCode) {
    return normalizeCode(siteCode) === BIB_SITE_CODE;
}

/**
 * Daftar grup unit yang diizinkan untuk sebuah site.
 * @param {string} siteCode
 * @returns {{match:string, label:string}[]}
 */
function getAllowedGroups(siteCode) {
    return isBibSiteCode(siteCode)
        ? [...BASE_UNIT_GROUPS, ...BIB_EXTRA_UNIT_GROUPS]
        : BASE_UNIT_GROUPS;
}

/**
 * Cari grup yang cocok untuk sebuah model_name pada site tertentu.
 * Semua varian akhiran (mis. "-8", "-8R", "SP-8", "SP-11R", "-11M0", dst.)
 * dianggap satu grup yang sama selama prefix model-nya cocok.
 *
 * @param {string} modelName
 * @param {string} siteCode
 * @returns {{match:string, label:string}|null}
 */
function matchUnitGroup(modelName, siteCode) {
    const norm = normalizeCode(modelName);

    return (
        getAllowedGroups(siteCode).find((group) =>
            norm.startsWith(normalizeCode(group.match))
        ) || null
    );
}

/**
 * Ambil KEY grup (nama grup, dipakai sebagai value dropdown & kunci
 * grouping data chart) untuk sebuah model_name. `null` jika unit tidak
 * termasuk grup manapun yang diizinkan untuk site ini.
 *
 * @param {string} modelName
 * @param {string} siteCode
 * @returns {string|null}
 */
export function getUnitGroupKey(modelName, siteCode) {
    const group = matchUnitGroup(modelName, siteCode);
    return group ? group.label : null;
}

/**
 * Filter daftar unit model sesuai aturan site (buang unit yang bukan
 * bagian dari grup PC2000/PC1250/HD785[/PC3400 khusus BIB]).
 *
 * @param {Array<{model_name:string}>} units
 * @param {string} siteCode
 * @returns {Array<{model_name:string}>}
 */
export function filterUnitsForSite(units = [], siteCode) {
    return units.filter((unit) => Boolean(matchUnitGroup(unit.model_name, siteCode)));
}

/**
 * Ambil label tampilan (nama grup) untuk sebuah unit.
 * Semua varian nama disamakan jadi nama grupnya (mis. "PC1250-8",
 * "PC1250-8R", "PC1250SP-11R" -> "PC1250"). Hanya mengubah tampilan — data
 * tetap dibaca dari database memakai model_name/id aslinya.
 *
 * @param {string} modelName
 * @param {string} siteCode
 * @returns {string}
 */
export function getUnitDisplayLabel(modelName, siteCode) {
    return getUnitGroupKey(modelName, siteCode) || modelName;
}

/**
 * Bentuk opsi dropdown { id, label } — SATU opsi per grup unit (bukan per
 * varian/per id), sudah difilter sesuai site.
 * `id` di sini adalah KEY grup (string, mis. "PC1250"), dipakai untuk
 * memfilter data di frontend — BUKAN unit_model_id asli, jangan dikirim
 * sebagai `unit_model_id` ke backend.
 *
 * @param {Array<{id:number, model_name:string}>} units
 * @param {string} siteCode
 * @returns {Array<{id:string, label:string}>}
 */
export function buildUnitOptions(units = [], siteCode) {
    const seen = new Map();

    for (const unit of filterUnitsForSite(units, siteCode)) {
        const key = getUnitGroupKey(unit.model_name, siteCode);
        if (key && !seen.has(key)) {
            seen.set(key, { id: key, label: key });
        }
    }

    // Urutkan sesuai urutan grup yang didefinisikan (PC2000, PC1250, HD785, PC3400)
    const order = getAllowedGroups(siteCode).map((g) => g.label);
    return order.filter((label) => seen.has(label)).map((label) => seen.get(label));
}

/**
 * Kelompokkan baris data (apapun bentuknya, asal punya `model_name`) sesuai
 * grup unit site ini. Baris yang unitnya tidak termasuk grup manapun akan
 * dibuang. Dipakai sebelum melakukan agregasi/average, supaya semua varian
 * (mis. "PC2000-8" dan "PC2000-11R") dihitung sebagai satu kelompok "PC2000"
 * dari data MENTAH-nya (bukan rata-rata dari rata-rata).
 *
 * @param {Array<Object>} rows Baris data, masing-masing punya field model_name
 * @param {string} siteCode
 * @returns {Map<string, Array<Object>>} key = nama grup, value = baris-baris mentah anggotanya
 */
export function groupRowsByUnit(rows = [], siteCode) {
    const groups = new Map();

    for (const row of rows) {
        const key = getUnitGroupKey(row.model_name, siteCode);
        if (!key) continue; // unit di luar grup yang diizinkan, dibuang

        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(row);
    }

    return groups;
}

/**
 * Urutan tampilan grup unit yang konsisten untuk sebuah site
 * (dipakai supaya urutan bar chart & dropdown selalu sama).
 *
 * @param {string} siteCode
 * @returns {string[]}
 */
export function getUnitGroupOrder(siteCode) {
    return getAllowedGroups(siteCode).map((g) => g.label);
}

/**
 * Filter baris data supaya hanya menyisakan anggota dari satu grup unit
 * tertentu (dipakai saat user memilih 1 unit di dropdown).
 *
 * @param {Array<Object>} rows Baris data, masing-masing punya field model_name
 * @param {string} siteCode
 * @param {string} groupKey Nama grup terpilih (mis. "PC1250"), '' = semua
 * @returns {Array<Object>}
 */
export function filterRowsByUnitGroup(rows = [], siteCode, groupKey) {
    if (!groupKey) return rows.filter((row) => Boolean(getUnitGroupKey(row.model_name, siteCode)));
    return rows.filter((row) => getUnitGroupKey(row.model_name, siteCode) === groupKey);
}