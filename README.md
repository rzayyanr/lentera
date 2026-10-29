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
- Riwayat 24.190 kejadian Jawa Timur tahun 2020 sampai 2025, dengan saringan tahun dan jenis bencana, serta tautan ke catatan aslinya.
- Halaman Tentang dan sumber data, termasuk daftar selisih angka yang ditemukan saat pengolahan.
- Tampilan mengikuti design system, dengan font Newsreader dan Public Sans yang disimpan sendiri.

Yang belum dikerjakan:

- Formulir laporan warga beserta halaman status laporan.
- Halaman transparansi bantuan.
- Halaman moderator untuk memeriksa laporan masuk.
- Halaman bantuan.

## Teknologi

- React 19 + Vite 8 + TypeScript
- Leaflet untuk peta, tanpa basemap tile
- Data statis hasil pipeline, bukan API saat pengguna membuka situs
- Penyimpanan laporan warga akan memakai layanan basis data terkelola. Pilihannya belum final.
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
public/geo/               batas wilayah, sudah ditempeli kode BPS
public/fonts/             Newsreader dan Public Sans, disimpan sendiri
src/lib/data.ts           tipe, pemuat, dan skala warna
src/App.tsx               halaman peta
src/components/RiwayatJatim.tsx  halaman riwayat kejadian
src/components/Tentang.tsx       halaman tentang dan sumber data
```

## Sumber data

- Jumlah kejadian per kabupaten 2010 sampai 2024: [Data Bencana Indonesia, BNPB](https://data.bnpb.go.id/dataset/data-bencana-indonesia), lisensi ODC-BY.
- Dampak per kabupaten 2002 sampai 2023: dataset "Jumlah kejadian dan Dampak Bencana Tahun &lt;tahun&gt;" di portal yang sama, berupa folder Google Drive berisi 38 berkas Excel per tahun.
- Batas wilayah: [geoBoundaries](https://www.geoboundaries.org/), ADM2 Indonesia.
- DIBI **tidak dipakai**, karena dasbor publiknya sudah diacak-acak pihak lain.

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
