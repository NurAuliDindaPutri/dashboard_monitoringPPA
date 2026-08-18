# Monitoring Performance PPA / PPA NEXUS

Aplikasi web untuk memonitor performa PPA pada seluruh site maupun per site. Data ditampilkan dalam bentuk dashboard, grafik, ringkasan KPI, dan tabel. Pengguna juga dapat menambahkan, memperbarui, menghapus, serta mengimpor data monitoring dari file Excel.

> Aplikasi saat ini tidak menggunakan login atau autentikasi.

---

## Fitur Utama

- Dashboard All Site
- Dashboard Per Site
- Monitoring Readiness
- Monitoring Availability VHS
- Monitoring Lead Time Supply
- Monitoring Physical Availability (PA)
- Monitoring Unit Availability (UA)
- Monitoring MTBF
- Monitoring MTTR
- Monitoring Productivity
- Monitoring Fuel Consumption
- Data Unit
- Pending Supply
- Detail Lead Time Supply
- Input dan edit data
- Import data dari file Excel
- Filter berdasarkan site, model unit, bulan, rentang bulan, dan tahun
- Grafik perbandingan KPI antar-site
- Grafik tren performa bulanan
- Tabel pencapaian KPI terhadap target
- Dark mode dan light mode
- REST API frontend dan backend

---

## Teknologi yang Digunakan

### Frontend

- React.js
- Vite
- JavaScript dan JSX
- Bootstrap 5
- Bootstrap Icons
- Axios
- Recharts
- React D3 Speedometer

### Backend

- Node.js
- Express.js
- MySQL2
- CORS
- Dotenv
- Multer
- XLSX
- Nodemon

### Database dan Tools

- MySQL
- Laragon
- phpMyAdmin
- Visual Studio Code
- Git
- NPM

---

## Struktur Project

```text
dashboard_monitoringPPA/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   │   └── import/
│   │   ├── utils/
│   │   ├── app.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── public/
│   │   └── templates/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── data/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── styles/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── .gitignore
└── README.md
```

Repository saat ini belum menyertakan file SQL atau migration database. Struktur database perlu disiapkan terlebih dahulu sebelum backend dijalankan.

---

## Persyaratan Sistem

Pastikan perangkat sudah memiliki:

- Node.js
- NPM
- Git
- MySQL atau Laragon
- Browser

Cek versi Node.js dan NPM:

```bash
node -v
npm -v
```

---

## Instalasi Project

Clone repository:

```bash
git clone https://github.com/NurAuliDindaPutri/dashboard_monitoringPPA.git
cd dashboard_monitoringPPA
```

### Instalasi backend

```bash
cd backend
npm install
```

Buat file `backend/.env` berdasarkan `backend/.env.example`:

```env
PORT=5000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=ppa_monitoring 
```

Jalankan backend:

```bash
npm run dev
```

Backend berjalan secara default di:

```text
http://localhost:5000
```

### Instalasi frontend

Buka terminal baru:

```bash
cd frontend
npm install
```

Buat file `frontend/.env` berdasarkan `frontend/.env.example`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Jalankan frontend:

```bash
npm run dev
```

Frontend berjalan secara default di:

```text
http://localhost:5173
```

---

## Halaman Aplikasi

### Dashboard All Site

Menampilkan ringkasan seluruh site berdasarkan satu bulan dan satu tahun yang dipilih, meliputi:

- Readiness
- Availability VHS
- Lead Time Supply
- Nilai aktual dan target
- Perbandingan KPI antar-site
- Tren KPI bulanan
- Perbandingan performa berdasarkan kategori model unit

Nilai kosong tidak dihitung sebagai `0`.

### Dashboard Per Site

Menampilkan performa berdasarkan:

- Site
- Kategori Model Unit
- Tahun
- Dari Bulan
- Sampai Bulan

Kategori model unit yang digunakan pada dashboard:

- `PC2000-8`, `PC2000-11R`, dan varian PC2000 lainnya ditampilkan sebagai `PC2000`.
- `PC1250-8R`, `PC1250SP-11R`, dan varian PC1250 lainnya ditampilkan sebagai `PC1250`.
- Varian HD785 ditampilkan sebagai `HD785`.
- PC3400 hanya ditampilkan untuk site BIB.

Data asli tetap disimpan berdasarkan model unit lengkap. Pengelompokan hanya digunakan untuk filter dan agregasi pada dashboard.

Chart performa menampilkan:

- Physical Availability
- Unit Availability
- MTBF
- MTTR
- Productivity
- Fuel Consumption

Bulan tanpa data tetap ditampilkan pada sumbu X dan nilainya menjadi `null` atau gap, bukan `0`.

### Input Data

Digunakan untuk menambah, mengubah, dan menghapus data KPI, performa unit, dan Pending Supply. Pada input performa unit, pengguna tetap memilih nama model asli seperti `PC2000-8` atau `PC2000-11R`.

### Data Unit

Menampilkan data performa unit berdasarkan site, model unit, bulan, dan tahun.

### Pending Supply

Menampilkan kebutuhan supply yang masih dalam proses, termasuk parts number, jumlah, nomor PO, ETA, dan keterangan. Pending Supply juga digunakan sebagai sumber notifikasi item operasional.

### Detail Lead Time Supply

Menampilkan detail Lead Time Supply berdasarkan data KPI bulanan pada site dan periode yang dipilih.

### Import Excel

Mengimpor data dari template Excel ke database. Sheet yang diproses oleh endpoint import saat ini:

- KPI Summary
- Unit Performance
- Pending Supply

Integrasi sheet Detail LT Supply masih perlu diselesaikan pada controller import sebelum dinyatakan aktif.

---

## Import File Excel

Format file yang didukung:

```text
.xlsx
.xls
```

Alur import:

```text
Pilih file Excel
        ↓
Klik tombol Import
        ↓
Sistem membaca workbook dan sheet yang dikenali
        ↓
Data divalidasi
        ↓
Site dan model unit dicocokkan
        ↓
Data baru ditambahkan dan data lama diperbarui
        ↓
Ringkasan hasil import ditampilkan
```

Nilai persentase disimpan dalam bentuk desimal:

```text
90% = 0.9000
93% = 0.9300
98% = 0.9800
```

Nilai kosong disimpan sebagai `null`, bukan `0`.

---

## Business Rule

### Normalisasi site

```text
WARA + ADRW                  → WARA
PTBA + BA                    → BA
AMC + AMC-LAC + AMC-MAC + LAC → AMC
```

### Kategori model unit

```text
Semua varian PC2000   → PC2000
Semua varian PC1250   → PC1250
PC1250SP              → PC1250
Semua varian HD785    → HD785
Semua varian PC3400   → PC3400, khusus BIB
```

---

## Struktur Database

Tabel utama yang digunakan oleh backend aktif:

```text
sites
unit_models
monthly_kpi_summary
monthly_unit_performance
pending_supply
```

Relasi utama:

```text
sites
├── monthly_kpi_summary
├── pending_supply
└── unit_models
    └── monthly_unit_performance
```

Dashboard tidak memiliki tabel tersendiri. Data dashboard diperoleh dari query dan agregasi tabel utama.

---

## Endpoint API Utama

```text
GET    /api/health

GET    /api/sites
POST   /api/sites
PUT    /api/sites/:id
DELETE /api/sites/:id

GET    /api/unit-models
POST   /api/unit-models
PUT    /api/unit-models/:id
DELETE /api/unit-models/:id

GET    /api/kpi-summary
POST   /api/kpi-summary
PUT    /api/kpi-summary/:id
DELETE /api/kpi-summary/:id

GET    /api/monthly-unit-performance
POST   /api/monthly-unit-performance
PUT    /api/monthly-unit-performance/:id
DELETE /api/monthly-unit-performance/:id

GET    /api/pending-supply
POST   /api/pending-supply
PUT    /api/pending-supply/:id
DELETE /api/pending-supply/:id

POST   /api/import/excel
```

### Filter KPI Summary dan Monthly Unit Performance

Mode satu bulan:

```text
period_year + period_month
```

Mode rentang bulan:

```text
period_year + start_month + end_month
```

`start_month` tidak boleh lebih besar daripada `end_month`.

---

## Catatan Penting

- Aplikasi belum menggunakan login atau autentikasi.
- MySQL harus aktif sebelum backend dijalankan.
- Backend dan frontend harus dijalankan bersamaan.
- Dashboard mengambil data dari database melalui REST API.
- Data kosong disimpan sebagai `null`, bukan `0`.
- File `.env` tidak boleh disimpan ke repository.
- Folder `node_modules` tidak perlu disimpan ke repository.
- File Excel harus mengikuti struktur template yang dikenali sistem.
- Dummy data hanya boleh digunakan untuk pengembangan dan tidak boleh dianggap sebagai data production.

---

## Status Project

Fitur yang sudah tersedia:

- Frontend React dan Vite
- Backend Node.js dan Express.js
- Koneksi MySQL
- REST API
- Dashboard All Site
- Dashboard Per Site
- Filter site, model, bulan, rentang bulan, dan tahun
- Grafik KPI dan performa unit
- Input dan edit data
- Data Unit
- Pending Supply
- Detail Lead Time Supply berbasis KPI bulanan
- Import KPI Summary, Unit Performance, dan Pending Supply
- Dark mode dan light mode

Fitur yang masih perlu diselesaikan atau diverifikasi:

- Import Detail LT Supply pada controller utama
- Pencegahan duplicate Pending Supply berdasarkan business key final
- Penyediaan schema SQL atau migration database
- Konfigurasi production dan pembatasan CORS

---

## Pengembang

Dikembangkan sebagai bagian dari kegiatan Kerja Praktik untuk kebutuhan Monitoring Performance PPA.
