# Lentera

Peta dampak bencana Indonesia yang selalu menyebut asal datanya.

Lentera menampilkan jumlah kejadian bencana per kabupaten/kota dari data resmi BNPB, tahun 2010 sampai 2024. Setiap angka yang tampil bisa ditelusuri sumbernya, dan data resmi tidak pernah dicampur dengan laporan warga.

Proyek ini dibuat untuk MIA 2026, tim **miamiudua**, tema *Designing Digital Futures: Powering Public Transparency*.

## Status

Tahap pengerjaan berjalan. Yang sudah berfungsi:

- Peta 514 bentuk wilayah, 510 di antaranya berpasangan dengan data BNPB.
- Peta bisa digeser dan diperbesar, tanpa basemap, sehingga tetap berjalan tanpa jaringan.
- Pemilih tahun 2010 sampai 2024.
- Panel wilayah: nama, provinsi, kode BPS, angka tahun terpilih, dan riwayat 15 tahun.
- Tautan langsung per wilayah, misalnya `?kode=3578` untuk Kota Surabaya.
- Legenda dengan ambang yang dihitung dari sebaran data, bukan angka karangan.

Yang belum dikerjakan:

- Riwayat kejadian Jawa Timur per tanggal.
- Formulir laporan warga dan halaman moderator.
- Halaman bantuan.
- Halaman Tentang dan sumber data.
- Tampilan final sesuai design system.

## Teknologi

- React 19 + Vite 8 + TypeScript
- Leaflet untuk peta, tanpa basemap tile
- Data statis hasil pipeline, bukan API saat pengguna membuka situs
- Supabase untuk laporan warga, direncanakan pada tahap berikutnya
- Vercel untuk hosting

## Cara menjalankan

Butuh Node.js 20 atau lebih baru.

```bash
npm install
npm run dev
```

Buka alamat yang muncul di terminal, biasanya `http://localhost:5173`.

Perintah lain:

```bash
npm run data     # menarik data BNPB dan menyusun berkas JSON
npm run build    # memeriksa tipe lalu membangun versi produksi
npm run preview  # melihat hasil build
```

`npm run data` memerlukan jaringan. Hasilnya disimpan di `public/data` dan `public/geo`, dan berkas itu ikut di-commit supaya proyek bisa dijalankan tanpa menarik data lagi.

## Struktur

```
data/                tabel pemetaan wilayah, hasil kerja manual
scripts/pipeline.ts  penarik dan penyusun data
public/data/         JSON untuk aplikasi
public/geo/          batas wilayah, sudah ditempeli kode BPS
src/lib/data.ts      tipe dan pemuat data
src/App.tsx          halaman peta
```

## Sumber data

- Data kejadian bencana: [Data Bencana Indonesia, BNPB](https://data.bnpb.go.id/dataset/data-bencana-indonesia), lisensi ODC-BY.
- Batas wilayah: [geoBoundaries](https://www.geoboundaries.org/), ADM2 Indonesia.

## Catatan data yang perlu diketahui

Hal-hal ini ditemukan saat pengolahan dan sengaja ditulis, bukan disembunyikan.

1. **Tabel kabupaten dan tabel provinsi BNPB tidak selalu cocok.** Pada 2024, jumlah kabupaten berbeda dari angka provinsi di tujuh provinsi, dengan total selisih 46 kejadian. Aplikasi memakai penjumlahan kabupaten agar angka di layar selalu konsisten.
2. **Kode 91 dan 92 mengikuti BNPB, bukan konvensi BPS.** BNPB menulis 91 sebagai Papua dan 92 sebagai Papua Barat, kebalikan dari kebiasaan BPS.
3. **Empat wilayah tidak ada di daftar kabupaten BNPB**: Kaimana, Konawe Kepulauan, Nduga, dan Yalimo. Keempatnya tampil tanpa data, tidak disembunyikan.
4. **Lima entri pada data batas bukan wilayah administratif** dan dibuang: Danau, Danau Toba, Hutan, Waduk Cirata, dan Wadung Kedungombo.
5. **Nilai nol berarti nol kejadian**, berbeda dari nilai kosong yang berarti tidak dilaporkan.

Tabel pemetaan 510 wilayah ada di `data/pemetaan-wilayah.csv`. Pencocokan nama dilakukan manual untuk 57 entri, karena pencocokan otomatis pernah salah memasangkan TOBA ke Tuban.
