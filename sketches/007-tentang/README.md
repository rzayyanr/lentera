## Varian: Halaman Tentang

Tiga arah desain untuk halaman Tentang, dengan isi yang sama dan susunan yang berbeda.

Isi yang sekarang belum ada di aplikasi, tetapi ditambahkan di ketiga varian:

- Apa itu Lentera dan visinya.
- Masalah yang dijawab.
- Cara kerja tiga lapisan data.
- Sumber data dan cakupan.
- Aturan integritas.
- Keterbatasan.
- Tim (tiga nama lengkap dan perannya).
- Teknologi yang dipakai.
- Lisensi dan kredit.

Berkas: `index.html` — satu berkas, tiga varian, bisa dialihkan dengan tombol di atas.

### 1. Editorial naratif

**Stance:** dibaca dari atas ke bawah seperti esai pendek. Satu kalimat besar di atas, empat angka kunci, lalu empat bagian bernomor.

- Layout: setiap bagian satu baris grid `200px / 1fr`, label dan isi sejajar.
- Tipografi: judul 38px, isi 13px, angka 27px.
- Kuat di: menjelaskan "kenapa" kepada pembaca baru, dan membuat kesan serius.
- Lemah di: tidak bisa dijadikan pintu masuk cepat; semua isi terbuka sekaligus.

### 2. Hub kartu

**Stance:** halaman Tentang sebagai peta isi. Ringkasan singkat di atas, lalu sembilan kartu menuju bagian.

- Layout: empat angka kunci, grid kartu 3/2/1 kolom, lalu "cara membaca aplikasi" tiga langkah.
- Tipografi: judul 30px, kartu 11,5px.
- Interaksi: kartu bisa diklik (di aplikasi nanti membuka bagian yang sesuai).
- Kuat di: pembaca yang ingin cepat tahu isi situs lalu memilih sendiri kedalamannya.
- Lemah di: tidak ada isi mendalam tanpa membuka bagian lain.

### 3. Dokumen bernav

**Stance:** halaman Tentang sebagai dokumen rujukan, dengan daftar isi menempel di kiri.

- Layout: nav 230px `position: sticky` + kolom isi 640px, delapan bagian, empat tabel.
- Tipografi: isi 13px, judul bagian 19px.
- Interaksi: daftar isi menyorot bagian yang sedang terlihat; klik menggulir halus.
- Kuat di: juri yang ingin memeriksa klaim satu per satu.
- Lemah di: terasa seperti dokumentasi, bukan halaman produk.

## Rekomendasi

**Varian 2 (hub kartu) untuk halaman utama Tentang**, dengan isi tambahan dibagi begini:

- Halaman utama memuat: apa itu Lentera, visi, empat angka kunci, dan kartu menuju bagian.
- "Masalah yang dijawab" dan "Cara kerja tiga lapisan" masuk halaman utama sebagai dua blok pendek, karena itu yang paling sering dicari pertama.
- "Sumber data", "Aturan integritas", dan "Keterbatasan" tetap jadi sub-halaman yang sudah ada sekarang.
- "Tim" dan "Teknologi" jadi satu sub-halaman baru, ringkas.

Alasannya: struktur sub-halaman sekarang sudah benar, yang kurang hanya bagian pembuka (apa ini, untuk siapa, siapa yang membuat). Varian 1 bagus untuk PDF proposal, varian 3 bagus untuk dokumentasi teknis, bukan untuk halaman Tentang sebuah produk lomba.

## Yang belum diputuskan

- Apakah "Tim" perlu foto atau cukup nama dan peran (sekarang belum ada foto).
- Apakah lisensi ditulis di kaki halaman atau jadi bagian sendiri.
- Apakah perlu tautan kontak/email tim, atau cukup repo GitHub.
