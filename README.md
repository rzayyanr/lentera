# Lentera

Peta dampak bencana Indonesia yang selalu menyebut asal datanya.

Lentera menampilkan jumlah kejadian bencana per kabupaten/kota dari data resmi BNPB, tahun 2010 sampai 2024. Setiap angka yang tampil bisa ditelusuri sumbernya, dan data resmi tidak pernah dicampur dengan laporan warga.

Proyek ini dibuat untuk MIA 2026, tim **miamiudua**, tema *Designing Digital Futures: Powering Public Transparency*.

## Status

Tahap pengerjaan berjalan. Yang sudah berfungsi:

- Peta 514 bentuk wilayah, 510 di antaranya berpasangan dengan data BNPB.
- Peta bisa digeser dan diperbesar, tanpa basemap, sehingga tetap berjalan tanpa jaringan.
- Enam ukuran yang bisa dipilih: kejadian, meninggal, luka, terdampak, mengungsi, rumah rusak berat.
- Data dampak 22 tahun, 2002 sampai 2023, dari berkas statistik wilayah BNPB.
- Penggeser tahun dengan tombol putar, dan tahun aktif selalu tertulis besar sebagai angka.
- Panel wilayah: nama, provinsi, kode BPS, angka tahun terpilih, rincian 14 ukuran, dan riwayat seluruh tahun.
- Tautan langsung per wilayah dan ukuran, misalnya `?kode=3507&ukuran=menderita`.
- Legenda dengan ambang yang dihitung dari sebaran data, bukan angka karangan.
- Wilayah yang tidak punya catatan digambar dengan pola garis miring, bukan dianggap nol.
- Halaman Riwayat dengan pemilih 38 provinsi: ringkasan tahunan dari tabel agregat BNPB untuk semua provinsi, daftar kejadian per tanggal untuk provinsi yang menerbitkannya (sekarang Jawa Timur, 24.190 kejadian 2020-2025), dan sebaran jenis bencana provinsi kalau tersedia.
- Tabel cakupan 38 provinsi di halaman Tentang: mana yang punya rincian per kejadian, mana yang belum, dan apa alasannya.
- Panel ringkasan nasional memuat sebaran 9 jenis bencana (banjir, cuaca ekstrem, kebakaran hutan dan lahan, tanah longsor, kekeringan, gelombang pasang, gempa, erupsi, tsunami) untuk tahun yang sedang dipilih.
- Halaman Tentang dan sumber data, termasuk daftar selisih angka yang ditemukan saat pengolahan.
- Halaman Daftar wilayah, Detail kejadian, Bandingkan wilayah, Transparansi bantuan, dan Catatan komunitas.
- Laporan warga: masuk atau daftar akun pelapor, formulir laporan, dan pelacakan status lewat kode rujukan.
- Halaman moderator untuk memeriksa dan memverifikasi laporan yang masuk. Untuk akun moderator/admin, menu Lapor langsung membuka pusat moderasi (cek laporan lewat kode dan antrean pengajuan); formulir laporan warga tidak ditampilkan.
- Bilah atas mengapung dan ikon Lucide, mengikuti berkas High Fidelity di Figma.
- Tampilan memakai satu keluarga huruf, DM Sans, yang disimpan sendiri.

## Teknologi

- React 19 + Vite 8 + TypeScript
- Leaflet untuk peta, tanpa basemap tile
- Data statis hasil pipeline, bukan API saat pengguna membuka situs
- Akun pelapor dan laporan warga memakai Supabase (Auth, tabel `laporan_warga`, dan Storage untuk foto bukti). Halaman moderator memerlukan akun dengan role `moderator`/`admin`; lihat `supabase/perbaikan-moderator.sql` untuk menaikkan role akun.
- Vercel untuk hosting

## Cara menjalankan

Butuh Node.js 20 atau lebih baru.

```bash
npm install
npm run dev
```

Buka alamat yang muncul di terminal, biasanya `http://localhost:5173`.

Kalau muncul galat bahwa `tsc` atau `vite` tidak ditemukan, kemungkinan lingkunganmu disetel ke mode produksi sehingga paket pengembangan ikut dilewati. Jalankan `npm install --include=dev` sebagai gantinya, lalu ulangi.

Perintah lain:

```bash
npm run data              # menarik data agregat BNPB dan menyusun JSON
npm run dampak:unduh      # mengunduh 836 berkas dampak dari folder BNPB, lama
npm run dampak:olah       # mengolah unduhan menjadi public/data/dampak.json
npm run dampak:verifikasi # memeriksa hasil olahan sebelum dipakai
npm run jenis:unduh      # mengambil jumlah kejadian per jenis bencana 2010-2024
npm run jenis:provinsi   # menghitung sebaran jenis per provinsi dari log kejadian
npm run build             # memeriksa tipe lalu membangun versi produksi
npm run preview           # melihat hasil build
```

`npm run dampak:unduh` menyimpan berkas mentah di `.cache/dampak`, yang tidak ikut di-commit. Unduhan bisa dijalankan ulang kapan saja, dan berkas yang sudah ada akan dilewati.

`npm run data` memerlukan jaringan. Hasilnya disimpan di `public/data` dan `public/geo`, dan berkas itu ikut di-commit supaya proyek bisa dijalankan tanpa menarik data lagi.

## Struktur

```
data/                     tabel pemetaan wilayah dan peta folder dampak
scripts/pipeline.ts       penarik data agregat BNPB
scripts/unduh-dampak.ts   pengunduh berkas dampak per provinsi
scripts/olah-dampak.ts    pengolah berkas dampak menjadi JSON
scripts/unduh-kejadian.ts pengunduh riwayat kejadian Jawa Timur
scripts/olah-kejadian.ts  pengolah riwayat kejadian, sekaligus pemotong alamat
scripts/verifikasi-dampak.ts  pemeriksa hasil olahan
public/data/              JSON untuk aplikasi
public/data/cakupan-sumber.json  status rincian per kejadian tiap provinsi
public/data/jenis-bencana.json   jumlah kejadian per jenis bencana, nasional
public/data/jenis-provinsi.json  sebaran jenis per provinsi, dari log kejadian
public/geo/               batas wilayah, sudah ditempeli kode BPS
public/fonts/             DM Sans, satu variable font, disimpan sendiri
src/lib/data.ts           tipe, pemuat, dan skala warna
src/App.css               token warna, jarak, bayangan, dan gaya komponen
src/App.tsx               kerangka halaman dan peralihan antarhalaman
src/components/           satu berkas per halaman: BilahAtas, KendaliKiri,
                          PanelRingkasan, PanelDetail, DaftarWilayah,
                          Riwayat, DaftarKejadianJatim, DetailKejadian, LaporanWarga,
                          TransparansiBantuan, Tentang, Moderator,
                          BandingkanWilayah, PonselRingkasan, PonselDetail
src/assets/icons/         ikon Lucide yang dipakai antarmuka
```

## Sumber data

- Jumlah kejadian per kabupaten 2010 sampai 2024: [Data Bencana Indonesia, BNPB](https://data.bnpb.go.id/dataset/data-bencana-indonesia), lisensi ODC-BY.
- Dampak per kabupaten 2002 sampai 2023: dataset "Jumlah kejadian dan Dampak Bencana Tahun &lt;tahun&gt;" di portal yang sama, berupa folder Google Drive berisi 38 berkas Excel per tahun.
- Jumlah kejadian per jenis bencana, nasional 2010-2024: dataset "Jumlah Kejadian Bencana Menurut Jenis Bencana" di [portal data BNPB](https://data.bnpb.go.id/dataset/data-bencana-indonesia), dibaca lewat datastore CKAN.
- Batas wilayah: [geoBoundaries](https://www.geoboundaries.org/), ADM2 Indonesia.
- Riwayat kejadian per tanggal: hanya dari [SMARTPB BPBD Jawa Timur](https://smartpb.bpbd.jatimprov.go.id/). Provinsi lain tidak menerbitkan log kejadian, jadi tabel cakupan di halaman Tentang mencatat status tiap provinsi apa adanya.

### Kenapa rincian per kejadian hanya satu provinsi

Seluruh 38 provinsi diperiksa portal datanya pada 10 November 2026. Hasilnya:

| Hasil | Jumlah provinsi |
|---|---|
| Log kejadian per tanggal | **1** (Jawa Timur, `smartpb.bpbd.jatimprov.go.id`) |
| Portal terbuka, isinya hanya agregat per kecamatan atau per jenis | **7** (Aceh, Sumatera Barat, Bengkulu, Banten, Kalimantan Barat, Kalimantan Timur, Papua Barat) |
| Portal terbuka, tanpa API data | 5 (NTB, Kalimantan Selatan, Kalimantan Utara, Sulawesi Barat, Maluku) |
| Portal menolak akses | 2 (Lampung, Sulawesi Selatan) |
| Portal ada, API bermasalah | 4 (DKI Jakarta, Jawa Barat, Jawa Tengah, DI Yogyakarta) |
| Tidak ada portal yang menjawab | 15 |
| Provinsi baru tanpa portal | 4 (Papua Selatan, Papua Tengah, Papua Pegunungan, Papua Barat Daya) |

Contoh isi yang diperiksa untuk memastikan bukan log kejadian: dataset "Data Kejadian Bencana Tahun 2019" di Kalimantan Barat berisi 24 baris, satu baris per kecamatan, dengan kolom jumlah per jenis bencana. Dataset Balikpapan 2022 di Kalimantan Timur berisi 10 baris rekap bulanan. Tidak ada yang memuat tanggal dan desa per kejadian seperti SMARTPB.

Sumber nasional untuk ini, DIBI BNPB, sudah tidak dapat dipakai: situsnya kini dasbor Apache Superset yang hanya memuat satu dataset, `gempa_ntt_2026.v_posko_pengungsian_4superset`, dengan 8 dari 14 grafiknya sudah diganti nama menjadi `HACKED BY UNKNOWN1337 FT D3D0x`. Grafik lama yang dirujuk dasbor (id 6–51) membalas `{"message":"Not found"}`.

Status per provinsi disimpan di `public/data/cakupan-sumber.json` dan dipakai halaman Tentang serta tab Riwayat di panel wilayah. Menambah provinsi nanti cukup menambah satu berkas kejadian dan satu entri cakupan.

## Catatan data yang perlu diketahui

Hal-hal ini ditemukan saat pengolahan dan sengaja ditulis, bukan disembunyikan.

1. **Tabel kabupaten dan tabel provinsi BNPB tidak selalu cocok.** Pada 2024, jumlah kabupaten berbeda dari angka provinsi di tujuh provinsi, dengan total selisih 46 kejadian. Aplikasi memakai penjumlahan kabupaten agar angka di layar selalu konsisten.
2. **Kode 91 dan 92 mengikuti BNPB, bukan konvensi BPS.** BNPB menulis 91 sebagai Papua dan 92 sebagai Papua Barat, kebalikan dari kebiasaan BPS.
3. **Empat wilayah tidak ada di daftar kabupaten BNPB**: Kaimana, Konawe Kepulauan, Nduga, dan Yalimo. Keempatnya tampil tanpa data, tidak disembunyikan.
4. **Lima entri pada data batas bukan wilayah administratif** dan dibuang: Danau, Danau Toba, Hutan, Waduk Cirata, dan Wadung Kedungombo.
5. **Nilai nol berarti nol kejadian**, berbeda dari nilai kosong yang berarti tidak dilaporkan.

6. **Angka dampak dan angka agregat berbeda sumbernya.** Pada 2023, berkas dampak mencatat 5.388 kejadian, sedangkan tabel agregat mencatat 5.519. Penyebabnya berkas per wilayah tidak memuat seluruh kabupaten.
7. **Cakupan dampak tumbuh dari tahun ke tahun.** Tahun 2002 hanya memuat 98 kabupaten, tahun 2023 memuat 451. Wilayah yang tidak muncul bukan berarti nol kejadian, melainkan tidak tercatat.
8. **Sebagian kode wilayah tidak bisa digambar.** 31 kode pada berkas dampak adalah wilayah Papua sebelum pemekaran, dengan 411 kejadian sepanjang 22 tahun, dan tidak punya bentuk di peta. Sebaliknya, 16 kabupaten di provinsi Papua yang baru punya angka agregat tetapi tidak punya data dampak.

Tabel pemetaan 510 wilayah ada di `data/pemetaan-wilayah.csv`. Pencocokan nama dilakukan manual untuk 57 entri, karena pencocokan otomatis pernah salah memasangkan TOBA ke Tuban.
