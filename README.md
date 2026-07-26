# Monitoring Performance PPA

Aplikasi web untuk memonitor performa PPA pada seluruh site maupun per site.

Aplikasi menampilkan data monitoring dalam bentuk dashboard, grafik, tabel, serta mendukung input data dan import data dari file Excel.

---

## Fitur Utama

- Dashboard All Site
- Dashboard Per Site
- Monitoring Readiness
- Monitoring Availability
- Monitoring Lead Time Supply
- Monitoring Physical Availability
- Monitoring Unit Availability
- Monitoring MTBF
- Monitoring MTTR
- Monitoring Productivity
- Monitoring Fuel Consumption
- Data Unit
- Pending Supply
- Detail LT Supply
- Input Data
- Import Excel Bulanan
- Filter berdasarkan site, bulan, dan tahun
- Visualisasi data dalam bentuk grafik dan tabel

---

## Teknologi yang Digunakan

### Frontend

- React.js
- Vite
- JavaScript
- Bootstrap 5
- Axios
- Recharts
- React D3 Speedometer

### Backend

- Node.js
- Express.js
- MySQL2
- CORS
- Dotenv
- Nodemon

### Database dan Tools

- MySQL
- Laragon
- phpMyAdmin
- Visual Studio Code

---

## Bahasa Pemrograman

Bahasa utama yang digunakan dalam project ini:

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
- Visual Studio Code atau editor lainnya

Cek versi Node.js dan NPM:

```bash
node -v
npm -v
```

---

## Konfigurasi Database

### 1. Jalankan Laragon

Buka Laragon, lalu klik:

```text
Start All
```

Pastikan MySQL sudah berjalan.

### 2. Buka phpMyAdmin

Buka melalui browser:

```text
http://localhost/phpmyadmin
```

### 3. Siapkan Database

Pastikan database berikut tersedia:

```text
ppa_monitoring
```

Database digunakan untuk menyimpan data:

- Site
- Model unit
- KPI bulanan
- Performa unit bulanan
- Pending supply
- Critical item
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

Buat file `.env` pada folder backend.

Contoh isi file `.env`:

```env
PORT=5000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=monitoring_performance_ppa
```

Keterangan:

- `PORT` adalah port backend.
- `DB_HOST` adalah alamat server database.
- `DB_PORT` adalah port MySQL.
- `DB_USER` adalah username MySQL.
- `DB_PASSWORD` adalah password MySQL.
- `DB_NAME` adalah nama database.

File `.env` tidak disimpan ke repository.

---

## Menjalankan Backend

Masuk ke folder backend:

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

Buka terminal baru, lalu masuk ke folder frontend:

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

Setelah backend dan frontend berjalan, buka:

```text
http://localhost:5173
```

---

## Halaman Aplikasi

### Dashboard All Site

Menampilkan ringkasan performa seluruh site, seperti:

- Readiness
- Availability
- Lead Time Supply
- Perbandingan KPI antar-site
- Tren performa bulanan
- Status pencapaian target

### Dashboard Per Site

Menampilkan detail performa berdasarkan site yang dipilih, seperti:

- Readiness site
- Availability site
- Lead Time Supply site
- Physical Availability
- Unit Availability
- MTBF
- MTTR
- Productivity
- Fuel Consumption
- Model unit pada site

### Input Data

Digunakan untuk menambahkan dan memperbarui data monitoring.

### Data Unit

Menampilkan data unit berdasarkan site dan model unit.

### Pending Supply

Menampilkan daftar kebutuhan supply yang masih pending.

### Detail LT Supply

Menampilkan detail data Lead Time Supply.

### Import Excel Bulanan

Digunakan untuk mengimpor data monitoring dari file Excel.

---

## Import File Excel

Aplikasi mendukung import beberapa jenis data, yaitu:

- Data All Site
- Data Per Site
- Data KPI
- Data Unit
- Data Pending Supply
- Data Critical Item
- Data Detail Lead Time Supply

Alur proses import:

```text
Pilih file Excel
        ↓
Sistem membaca workbook
        ↓
Sistem mendeteksi site dan periode
        ↓
Data divalidasi
        ↓
Data disimpan ke database
        ↓
Dashboard diperbarui
```

Format file Excel harus memiliki header dan data yang dapat dikenali oleh sistem.

---

## Endpoint API Utama

```text
GET    /api/sites
GET    /api/unit-models
GET    /api/monthly-kpi-summary
GET    /api/monthly-unit-performance
GET    /api/pending-supply
GET    /api/critical-items
POST   /api/import/excel
```

Endpoint dapat berubah sesuai perkembangan backend.

---

## Catatan Penting

- Aplikasi tidak menggunakan login atau autentikasi.
- Aplikasi dijalankan secara lokal.
- MySQL harus aktif sebelum backend dijalankan.
- Backend dan frontend harus dijalankan bersamaan.
- Dashboard mengambil data dari database melalui REST API.
- Dashboard bukan tabel terpisah di database.
- File `.env` tidak boleh disimpan ke repository.
- Folder `node_modules` tidak perlu disimpan ke repository.

---

## Status Project

Project masih dalam tahap pengembangan dan dapat diperbarui sesuai kebutuhan Monitoring Performance PPA.

---

## Pengembang

Dikembangkan sebagai bagian dari kegiatan kerja praktik.