## Varian: Gaya Peta dan Tombol Lapisan

Tiga opsi untuk pertanyaan "apakah bisa ganti visualisasi peta, misalnya satelit?".

Berkas: `index.html` — satu berkas, tiga varian, peta memakai bentuk asli 514 kabupaten dari `public/geo/wilayah.geojson` dan angka 2024 dari `public/data/wilayah.json`. Jadi perubahan gaya terlihat pada data nyata, bukan gambar tempelan.

Catatan kejujuran di dalam pratinjau:

- **Relief** memakai pola kontur CSS, bukan aset topografi asli. Aset OpenTopoMap yang ada di repo baru mencakup Jawa Timur (`docs/hifi-assets/topo`).
- **Satelit** memakai gradien CSS, bukan ubin asli dari penyedia.

### A · Pemilih gaya offline

**Stance:** tiga cara melihat data yang sama, semuanya jalan tanpa internet.

- Gaya **Padat**: choropleth solid, seperti sekarang.
- Gaya **Relief**: latar kontur + poligon `fill-opacity: 0.58`, jadi bentuk wilayah dan data tetap terbaca di atas latar.
- Gaya **Garis**: `fill: none`, hanya batas wilayah. Legenda warna diredupkan dan diberi keterangan bahwa warna data tidak ditampilkan.
- Tombol lapisan tetap ada untuk menyembunyikan seluruh wilayah.

Kuat: tidak menambah ketergantungan jaringan, tidak menambah lisensi baru.
Lemah: relief yang benar butuh aset per wilayah; yang tersedia sekarang baru Jawa Timur.

### B · Tambah satelit

**Stance:** sama seperti A, ditambah satu gaya yang bergantung internet.

- Opsi **Satelit** diberi label ONLINE di dalam pemilih.
- Panel kanan menyebut "Sumber dasar: Esri (butuh internet)" saat gaya itu aktif.
- Poligon dinaikkan ke `fill-opacity: 0.45` supaya warna data masih terbaca di atas latar gelap.

Kuat: tampilan paling meyakinkan kalau jaringan tersedia.
Lemah: mati saat demo tanpa wifi; butuh atribusi penyedia ubin; warna data tetap lebih sulit dibaca dibanding latar terang.

### C · Perbaiki tombol saja

**Stance:** tidak mengubah gaya peta; hanya membereskan dua tombol yang salah fungsi.

- Tombol lapisan benar-benar menyembunyikan dan menampilkan wilayah, teks judulnya ikut berubah.
- Tombol mata dihapus karena hanya memanggil pewarnaan ulang, tanpa efek yang terlihat.

Kuat: paling murah dan paling aman.
Lemah: **hasil menekan tombolnya adalah kanvas kosong** — dan itu justru membuktikan perlunya peta dasar.

## Rekomendasi

**A + perbaikan tombol dari C**, tanpa B.

Alasannya:

1. Klaim aplikasi adalah berjalan tanpa jaringan; tiga gaya A semuanya memenuhi itu.
2. Satelit tidak menambah informasi apa pun — ia menambah latar, dan justru menurunkan keterbacaan warna data. Untuk lomba yang dinilai dari kejelasan data, itu pertukaran yang merugikan.
3. Gaya **Garis** berguna untuk presentasi: saat berbicara soal sebaran, garis bersih lebih mudah dibaca dari proyektor.
4. Relif bisa menyusul per wilayah ketika asetnya tersedia, tanpa mengubah antarmuka.

## Yang belum diputuskan

- Apakah pemilih gaya ditaruh di kartu kendali kiri (seperti pratinjau) atau di bilah atas.
- Apakah pilihan gaya disimpan di URL (`?gaya=garis`) supaya bisa dibagikan.
- Aset relief: dibuat per provinsi dari OpenTopoMap (CC-BY-SA), atau cukup satu relief nasional resolusi rendah.
