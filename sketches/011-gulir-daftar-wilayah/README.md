# 011 — Gulir daftar wilayah & panel detail

Tiga variasi untuk dua area bergulir di halaman Daftar wilayah:

- daftar 510 kabupaten/kota di kolom kiri (`div.dw-gulir`),
- panel riwayat 15 tahun di kanan (`aside.dw-detail`).

Semua variasi memakai token warna dan radius yang sama dengan `src/App.css`. Datanya contoh, bukan data BNPB asli.

## Buka

Klik dua kali `index.html`, tidak perlu server. Data wilayah tidak dibutuhkan karena daftar memakai nama contoh.

## Bagian 1 — daftar wilayah

| Variasi | Pendekatan | Kelebihan | Risiko |
|---|---|---|---|
| 1 | Batang gulir tipis 8px, thumb membulat dengan jarak 2px dari tepi, plus penanda posisi "1–8 dari 510" di baris atas | satu-satunya variasi yang tetap memakai batang gulir asli, jadi seret dan roda tetikus berjalan seperti biasa | penanda posisi perlu pembacaan `scrollTop` saat digulir |
| 2 | Tanpa batang gulir; tepi atas dan bawah dilunakkan gradien; batang 4px muncul saat kursor di atas daftar | tampilan paling bersih, daftar terasa seperti kertas | pengguna yang biasa menyeret batang harus mengarahkan kursor lebih dulu |
| 3 | Kepala provinsi menempel saat digulir, batang gulir tipis | konteks geografis tidak hilang di tengah 510 baris | hanya cocok untuk urutan nama/kode; urutan "kejadian tertinggi" bercampur provinsi |

## Bagian 2 — panel detail

| Variasi | Pendekatan | Kelebihan | Risiko |
|---|---|---|---|
| 1 | Kepala panel (nama, kode BPS, angka tahun, satuan) menempel; tabel tahun bergulir di bawahnya | perubahan paling kecil dari kode sekarang: `position: sticky` pada kepala | tinggi panel tetap sama |
| 2 | Panel tidak bergulir; tabel 15 tahun dilipat di balik tombol "Rincian 15 tahun" | seluruh isi terbaca tanpa gulir, panel pendek | satu klik tambahan untuk data yang sekarang langsung terlihat |
| 3 | Kepala dan tombol tetap; tabel menjadi rel bergulir 190px dengan kepala kolom menempel, tahun aktif otomatis di tengah | angka utama selalu terlihat dan tabel bisa ditelusuri tanpa kehilangan kolom | ruang tabel lebih sempit; pada layar pendek hanya 5 baris terlihat |

## Catatan teknis

- Batang gulir WebKit butuh `::-webkit-scrollbar` dan `-thumb`; Firefox memakai `scrollbar-width: thin` + `scrollbar-color`. Keduanya dipasang agar hasilnya sama.
- Gradien tepi memakai pseudo-element `::before`/`::after` pada wadah berposisi, bukan `mask-image`, supaya tidak memotong bayangan kartu.
- Batang gulir buatan pada variasi 2 dihitung dari `scrollTop`, `clientHeight`, dan `scrollHeight`; lebarnya 4px dengan `pointer-events: none`.
- Tahun aktif pada panel detail variasi 3 digulir ke tengah lewat `scrollTop` saat halaman dimuat.

## Kalau dipilih

Pindahkan keputusan ke `02-ux-design/04-design-system.md` lalu terapkan di `src/App.css` pada `.dw-gulir` dan `.dw-detail`. Untuk variasi 1 cukup menambah aturan scrollbar dan penanda posisi; variasi 3 daftar butuh pengelompokan ulang di `DaftarWilayah.tsx`.
