## Varian: Dropdown dengan pencarian dan gulir

Tiga arah desain untuk satu masalah: memilih 1 dari 38 provinsi dan 1 dari 510 kabupaten/kota, pada dua tempat di aplikasi (halaman Riwayat, dan Bandingkan wilayah A/B).

Berkas: `index.html` — satu berkas, tanpa build step, data asli tertanam (38 provinsi + 510 kabupaten dari `public/data`).

### 1. Popover kartu — ringan

**Stance:** panel mengapung di bawah pemicu, daftar bergulir di dalam kartu. Paling dekat dengan gaya panel Lentera yang sekarang, jadi tidak terasa seperti komponen baru.

- Layout: pemicu berupa kotak bergaris, panel 100% lebar pemicu, daftar `max-height: 264px`.
- Tipografi: nama 12,5px, sub-baris 10,5px (provinsi · kode BPS).
- Warna: token Lentera apa adanya, sorot `#f1ece0`, pilihan aktif `#e8f1ee`.
- Interaksi: ketik untuk menyaring, ↑ ↓ untuk navigasi, ↵ pilih, Esc tutup, klik luar tutup, centang pada pilihan aktif.
- Kuat di: panel 420px, meja, dipakai bersama panel detail wilayah.
- Lemah di: di ponsel panel mengapung menutupi peta.

### 2. Command palette — padat

**Stance:** panel selalu terbuka, kolom cari di paling atas, hasil dikelompokkan per pulau dengan judul lengket. Dibuat untuk pengguna papan ketik.

- Layout: kartu penuh, daftar `max-height: 280px`, kepala kelompok `position: sticky`.
- Tipografi: 12,5px, kode BPS rata kanan sebagai kolom angka tabular.
- Warna: sama; teks yang cocok ditandai `mark` kuning lembut.
- Interaksi: fokus langsung di kolom cari, ↑ ↓ ↵, Esc mengosongkan pencarian, enam kelompok pulau.
- Kuat di: 510 baris, pengguna cepat, tidak butuh klik dua kali.
- Lemah di: selalu terbuka memakan ruang vertikal.

### 3. Lembar sentuh — ponsel

**Stance:** daftar terbuka di dalam aliran halaman, bukan mengapung. Baris 56px, chip pulau untuk mempersempit sebelum mengetik.

- Layout: pemicu selebar kartu, panel di bawahnya, daftar `max-height: 300px`, baris 56px.
- Tipografi: 13,5px nama, 11px sub-baris.
- Warna: chip aktif memakai tinta penuh (kontras tinggi untuk layar terang).
- Interaksi: chip pulau (Semua, Sumatera, Jawa, Bali & Nusa Tenggara, Kalimantan, Sulawesi, Maluku & Papua), ketik, ketuk pilih, klik luar tutup.
- Kuat di: 390px, jempol, latar terang.
- Lemah di: menggeser konten di bawahnya saat dibuka.

## Rekomendasi

- **Riwayat** (pemilih provinsi, 38 baris): varian 1. Daftarnya pendek, popover cukup.
- **Bandingkan wilayah A/B** (510 baris, dua pemilih berdampingan): varian 2. Pengelompokan per pulau membuat 510 baris bisa dipindai, dan kolom cari di atas menghemat satu klik.
- **Ponsel**: varian 3 untuk semua pemilih.

Ketiganya memakai mesin pencarian yang sama: cocok pada nama, provinsi, dan kode BPS.

## Yang belum diputuskan

- Apakah pemilih provinsi di Riwayat perlu dikelompokkan per pulau juga, mengikuti varian 2.
- Apakah hasil pencarian perlu diurutkan menurut jumlah kejadian, bukan abjad.
- Perilaku saat data kosong: sekarang satu baris "Tidak ada wilayah yang cocok."
