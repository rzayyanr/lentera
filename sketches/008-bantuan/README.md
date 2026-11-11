## Varian: Transparansi Bantuan

Tiga arah desain untuk halaman `?hal=bantuan`. Halaman ini sekarang terdiri dari tiga sub-halaman: ikhtisar (dua kartu), lapisan resmi (tabel), dan catatan komunitas (daftar kartu).

Berkas: `index.html` — satu berkas, tiga varian, bisa dialihkan dengan tombol di atas. Semua isi memakai contoh data yang sama dengan versi aplikasi sekarang (4 entri bantuan Surabaya, 3 catatan Probolinggo/Lumajang/Pasuruan), dan ditandai "contoh isi".

### 1. Dua kolom sejajar

**Stance:** buktikan prinsipnya dengan menunjukkan, bukan menjelaskan. Kedua lapisan berdiri di satu layar, dengan garis pemisah tegas.

- Layout: dua kolom sama lebar, masing-masing memuat entrinya sendiri; strip kuning di kaki menjelaskan kenapa tidak ada total gabungan.
- Satuan berbeda ditampilkan apa adanya: "1.240 KK", "74 unit", "12 posko" di kiri; catatan naratif di kanan.
- Kuat di: pembaca langsung paham bahwa ini dua hal berbeda; tidak perlu klik apa pun.
- Lemah di: ruang per entri lebih sempit, dan di ponsel harus ditumpuk sehingga prinsip "sejajar" hilang.

### 2. Ledger berfilter

**Stance:** satu daftar, dua total. Semua entri di satu tabel, kolom lapisan selalu terlihat, dan total dihitung per lapisan.

- Layout: dua kartu total di atas (4 entri resmi · 3 catatan), chip filter lapisan, tabel bergulir dengan kepala menempel.
- Kuat di: memeriksa banyak entri sekaligus, terasa seperti buku kas, cocok kalau nanti datanya ratusan baris.
- Lemah di: dua entri yang berbeda sifat duduk di tabel yang sama, sehingga pemisahan lapisan bergantung pada badge kecil.

### 3. Alur verifikasi

**Stance:** yang ditonjolkan bukan daftarnya, tetapi proses pemeriksaannya. Setiap kartu memperlihatkan sampai tahap mana catatan diperiksa.

- Layout: feed kartu di kiri (badge status, garis kemajuan 3 tahap, pengirim), panel aturan di kanan, tombol kirim catatan.
- Kuat di: menjawab pertanyaan "apakah laporan warga langsung tampil?" tanpa perlu dijelaskan; menonjolkan peran moderator.
- Lemah di: lapisan resmi tidak ikut tampil, jadi prinsip "dua lapisan" hanya tersirat.

## Rekomendasi

**Varian 1 untuk halaman utama Transparansi Bantuan**, karena klaim utamanya justru "dua lapisan tidak pernah dicampur" — dan klaim itu paling kuat dibuktikan dengan menaruh keduanya berdampingan di satu layar.

Susunan yang disarankan:

1. Halaman utama memakai varian 1 (dua kolom + strip "tidak dijumlahkan").
2. Klik salah satu kolom membuka detail: tabel penuh untuk lapisan resmi, feed penuh untuk catatan komunitas. Detail catatan komunitas memakai bentuk varian 3 (dengan jejak pemeriksaan).
3. Varian 2 disimpan sebagai mode alternatif kalau nanti entri bantuan sudah banyak dan butuh filter.

## Yang perlu diputuskan sebelum dipasang

- **Isi masih contoh.** Halaman ini menyebut dirinya "contoh isi" dan itu jujur, tetapi untuk penjurian sebaiknya diputuskan: cari data bantuan nyata (mis. portal Pemkot Surabaya), atau kurangi tabelnya menjadi penjelasan konsep.
- Apakah strip "tidak pernah dijumlahkan" cukup satu baris, atau perlu contoh angka yang salah kalau digabung.
- Apakah catatan komunitas perlu menampilkan penulis (sekarang "Dikirim warga" / "Dikirim relawan" saja).
