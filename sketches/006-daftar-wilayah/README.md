## Varian: Halaman Daftar Wilayah

Tiga arah desain untuk halaman `?hal=daftar`: 510 kabupaten/kota pada satu tahun, dengan pencarian, saringan provinsi, dan urutan.

Berkas: `index.html` — satu berkas, tanpa build step, data asli 510 wilayah dengan 15 tahun nilai tertanam. Ketiga varian bisa dicari, disaring per provinsi, dan diurutkan.

### 1. Tabel padat

**Stance:** 510 baris dalam satu daftar yang bisa digulir tanpa paginasi, dengan bilah sebaran sebagai pembanding visual.

- Layout: tabel selebar panel, kepala tabel menempel (`sticky`), area gulir 560px.
- Kolom: `#`, kode BPS, kabupaten/kota, provinsi, bilah sebaran, angka rata kanan.
- Tipografi: nama 12,5px, kolom sekunder 11–11,5px, angka tabular.
- Interaksi: klik atau Enter pada baris membuka wilayah; pencarian mencocokkan nama, provinsi, dan kode.
- Ponsel: kolom provinsi dan bilah disembunyikan, sehingga tabel muat tanpa gulir menyamping.
- Kuat di: memindai ratusan wilayah, membandingkan angka, meja kerja.
- Lemah di: tidak memperlihatkan pola antarwilayah.

### 2. Kartu wilayah

**Stance:** setiap wilayah satu kartu dengan angka besar dan grafik 15 tahun, dimuat bertahap 24 kartu.

- Layout: grid 4/3/2/1 kolom mengikuti lebar layar, tombol "muat 24 berikutnya".
- Tipografi: nama 13px, angka 22px, satuan 10px.
- Warna: garis kartu jadi aksen saat dipilih.
- Interaksi: pencarian, saringan provinsi, urutan; kartu terpilih ditandai.
- Kuat di: ponsel dan tablet, memperlihatkan naik-turun tiap wilayah.
- Lemah di: 510 kartu butuh 21 kali "muat lagi", tidak cocok untuk membandingkan banyak baris sekaligus.

### 3. Daftar + detail

**Stance:** daftar ringkas di kiri, riwayat 15 tahun wilayah terpilih di kanan. Tidak perlu pindah halaman untuk melihat riwayat.

- Layout: dua kolom `1fr / 380px`, daftar bergulir 470px, panel detail memuat angka besar, grafik batang, dan tabel tahunan.
- Tipografi: nama 12,5px di daftar, 21px di panel detail, angka detail 40px.
- Interaksi: klik baris mengganti panel kanan; baris terpilih ditandai garis aksen di tepi kiri.
- Ponsel: tumpuk satu kolom, detail di bawah daftar.
- Kuat di: alur "pilih lalu telusuri", presentasi demo.
- Lemah di: setengah lebar layar dipakai panel detail.

## Rekomendasi

**Varian 1** untuk halaman Daftar yang sekarang, karena tugas utamanya memang memindai dan membandingkan angka, dan halaman ini bersebelahan dengan peta yang sudah padat.

**Varian 3** kalau ingin halaman ini juga berfungsi sebagai pintu masuk ke riwayat wilayah, sehingga halaman Riwayat tidak perlu dibuka untuk pertanyaan cepat.

**Varian 2** sebaiknya dipakai untuk tampilan ponsel saja (mis. `PonselRingkasan`), bukan untuk halaman desktop.

## Yang belum diputuskan

- Paginasi: varian 1 memakai gulir penuh, versi sekarang memakai 10 baris per halaman. Mana yang dipakai saat dipasang?
- Apakah kolom "sebaran" perlu memakai 15 tahun (bukan hanya tahun terpilih).
- Apakah baris perlu tombol "bandingkan" cepat menuju halaman Bandingkan.
