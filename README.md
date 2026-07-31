# Monitoring Performance PPA

Aplikasi web untuk memonitor performa PPA pada seluruh site maupun per site.

Aplikasi menampilkan data monitoring dalam bentuk dashboard, grafik, dan tabel. Pengguna juga dapat menambahkan, memperbarui, serta mengimpor data monitoring dari file Excel.

---

## Fitur Utama

- Dashboard All Site
- Dashboard Per Site
- Monitoring Readiness
- Monitoring Availability VHS
- Monitoring Lead Time Supply
- Monitoring Physical Availability
- Monitoring Unit Availability
- Monitoring MTBF
- Monitoring MTTR
- Monitoring Productivity
- Monitoring Fuel Consumption
- Data Unit
- Pending Supply
- Critical Items
- Detail Lead Time Supply
- Input dan edit data
- Import data dari file Excel
- Filter berdasarkan site, bulan, dan tahun
- Grafik perbandingan KPI antar-site
- Grafik tren performa bulanan
- Tabel pencapaian KPI terhadap target
- REST API frontend dan backend

Aplikasi tidak menggunakan login atau autentikasi.

---

## Teknologi yang Digunakan

### Frontend

- React.js
- Vite
- JavaScript
- JSX
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

## Bahasa Pemrograman

- JavaScript
- JSX
- SQL
- HTML
- CSS

---

## Struktur Project

```text
dashboard_monitoringPPA/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   │   └── import/
│   │   └── utils/
│   │
│   ├── uploads/
│   ├── .env
│   ├── .env.example
│   ├── app.js
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── styles/
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── ppa_monitoring.sql
├── .gitignore
└── README.md
```

Struktur folder dapat berubah sesuai perkembangan project.

---

## Persyaratan Sistem

Sebelum menjalankan aplikasi, pastikan perangkat sudah memiliki:

- Node.js
- NPM
- Git
- Laragon
- MySQL
- phpMyAdmin
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
git clone <URL_REPOSITORY>
```

Masuk ke folder project:

```bash
cd dashboard_monitoringPPA
```

---

## Konfigurasi Database

### 1. Jalankan Laragon

Buka Laragon, kemudian klik:

```text
Start All
```

Pastikan MySQL sudah berjalan.

### 2. Buka phpMyAdmin

Buka alamat berikut melalui browser:

```text
http://localhost/phpmyadmin
```

### 3. Buat Database

Buat database dengan nama:

```sql
CREATE DATABASE ppa_monitoring;
```

Setelah database dibuat, import file:

```text
ppa_monitoring.sql
```

Database digunakan untuk menyimpan:

- Site
- Model unit
- KPI bulanan
- Performa unit bulanan
- Pending supply
- Critical items
- Detail lead time supply

---

## Konfigurasi Backend

Masuk ke folder backend:

```bash
cd backend
```

Install dependency:

```bash
npm install
```

Buat file `.env` di dalam folder `backend`.

Contoh isi file `.env`:

```env
PORT=5000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=ppa_monitoring
```

File `.env` tidak disimpan ke repository.

---

## Menjalankan Backend

Pastikan terminal berada di folder backend:

```bash
cd backend
```

Jalankan backend:

```bash
npm run dev
```

Backend berjalan di:

```text
http://localhost:5000
```

---

## Menjalankan Frontend

Buka terminal baru, kemudian masuk ke folder frontend:

```bash
cd frontend
```

Install dependency:

```bash
npm install
```

Jalankan frontend:

```bash
npm run dev
```

Frontend berjalan di:

```text
http://localhost:5173
```

---

## Menjalankan Aplikasi

Gunakan dua terminal berbeda.

### Terminal Backend

```bash
cd backend
npm run dev
```

### Terminal Frontend

```bash
cd frontend
npm run dev
```

Pastikan MySQL di Laragon sudah aktif.

Setelah backend dan frontend berjalan, buka:

```text
http://localhost:5173
```

---

## Halaman Aplikasi

### Dashboard All Site

Menampilkan ringkasan performa seluruh site berdasarkan bulan dan tahun yang dipilih.

Data yang ditampilkan:

- Readiness
- Availability VHS
- Lead Time Supply
- Nilai actual dan target
- Perbandingan KPI antar-site
- Tren performa bulanan
- Status pencapaian target

Data kosong tidak dihitung sebagai nilai `0`.

### Dashboard Per Site

Menampilkan detail performa berdasarkan site yang dipilih.

Data yang ditampilkan:

- Readiness
- Availability VHS
- Lead Time Supply
- Physical Availability
- Unit Availability
- MTBF
- MTTR
- Productivity
- Fuel Consumption
- Model unit pada site

### Input Data

Digunakan untuk menambahkan dan memperbarui data monitoring secara langsung melalui aplikasi.

### Data Unit

Menampilkan performa unit berdasarkan:

- Site
- Model unit
- Bulan
- Tahun

### Pending Supply

Menampilkan daftar kebutuhan supply yang masih dalam proses.

### Critical Items

Menampilkan daftar item atau spare part dengan tingkat prioritas tinggi.

### Detail Lead Time Supply

Menampilkan detail data Lead Time Supply berdasarkan site dan periode.

### Import Excel

Digunakan untuk mengimpor data monitoring dari file Excel ke database.

---

## Import File Excel

Format file yang didukung:

```text
.xlsx
.xls
```

Pada proses import, pengguna memilih:

- File Excel
- Bulan data
- Tahun data

Alur proses import:

```text
Pilih file Excel
        ↓
Pilih bulan dan tahun
        ↓
Klik tombol Import
        ↓
Sistem membaca workbook
        ↓
Sistem membaca sheet yang dikenali
        ↓
Data divalidasi
        ↓
Site dan model unit dicocokkan
        ↓
Data disimpan atau diperbarui
        ↓
Dashboard menampilkan data terbaru
```

Data dengan kombinasi site dan periode yang sama akan diperbarui sehingga tidak menghasilkan duplikasi.

Nilai persentase disimpan dalam bentuk desimal:

```text
90% = 0.9000
93% = 0.9300
98% = 0.9800
```

Nilai yang kosong akan disimpan sebagai `null`, bukan `0`.

---

## Struktur Database

Tabel utama yang digunakan:

```text
sites
unit_models
monthly_kpi_summary
monthly_unit_performance
pending_supply
critical_items
detail_lt_supply
```

Relasi utama database:

```text
sites
├── monthly_kpi_summary
├── pending_supply
├── critical_items
├── detail_lt_supply
└── unit_models
    └── monthly_unit_performance
```

Dashboard tidak memiliki tabel tersendiri. Data dashboard diperoleh dari query dan agregasi tabel utama.

---

## Endpoint API Utama

```text
GET    /api/sites
GET    /api/unit-models
GET    /api/monthly-kpi-summary
GET    /api/monthly-unit-performance
GET    /api/pending-supply
GET    /api/critical-items
GET    /api/detail-lt-supply

POST   /api/sites
POST   /api/unit-models
POST   /api/monthly-kpi-summary
POST   /api/monthly-unit-performance
POST   /api/pending-supply
POST   /api/critical-items
POST   /api/import/excel

PUT    /api/sites/:id
PUT    /api/unit-models/:id
PUT    /api/monthly-kpi-summary/:id
PUT    /api/monthly-unit-performance/:id
PUT    /api/pending-supply/:id
PUT    /api/critical-items/:id

DELETE /api/sites/:id
DELETE /api/unit-models/:id
DELETE /api/monthly-kpi-summary/:id
DELETE /api/monthly-unit-performance/:id
DELETE /api/pending-supply/:id
DELETE /api/critical-items/:id
```

Endpoint dapat berubah sesuai perkembangan project.

---

## Catatan Penting

- Aplikasi tidak menggunakan login atau autentikasi.
- Aplikasi dijalankan secara lokal.
- MySQL harus aktif sebelum backend dijalankan.
- Backend dan frontend harus dijalankan bersamaan.
- Dashboard mengambil data dari database melalui REST API.
- Dashboard bukan tabel terpisah di database.
- Data kosong disimpan sebagai `null`, bukan `0`.
- File `.env` tidak boleh disimpan ke repository.
- Folder `node_modules` tidak perlu disimpan ke repository.
- File Excel harus menggunakan struktur yang dikenali oleh sistem.
- Jangan mengimpor data satu periode ke bulan yang berbeda.

---

## Status Project

Fitur yang sudah tersedia:

- Frontend React dan Vite
- Backend Node.js dan Express.js
- Koneksi database MySQL
- REST API
- Dashboard All Site
- Dashboard Per Site
- Filter site, bulan, dan tahun
- Grafik KPI
- Grafik tren bulanan
- Tabel monitoring
- Input dan edit data
- Data Unit
- Pending Supply
- Critical Items
- Detail Lead Time Supply
- Import file Excel
- Proses insert dan update data

Project masih dapat dikembangkan sesuai kebutuhan Monitoring Performance PPA.

---

## Pengembang

Dikembangkan sebagai bagian dari kegiatan Kerja Praktik untuk kebutuhan Monitoring Performance PPA.