# Isi Cepat Akun Demo — Lima Varian

Tambahan untuk `GerbangLogin`: container di bawah formulir berisi **dua tombol** yang mengisi
email dan sandi otomatis — satu untuk akun warga, satu untuk akun moderator. Setiap varian
memakai isi dan perilaku yang sama; yang berbeda hanya cara container disorot dan ditempatkan.

Berkas: `index.html` — satu berkas, lima varian, bisa dialihkan dengan tombol di atas
atau lewat hash (`#1` sampai `#5`). Tidak perlu server.

## Kredensial pratinjau

| Peran | Email | Sandi |
|---|---|---|
| Warga | `warga.demo@gmail.com` | `warga12345` |
| Moderator | `admin@gmail.com` | `admin123` |

Sandi moderator diambil dari `supabase/perbaikan-moderator.sql` (akun master).
**Kredensial warga masih placeholder.** Karena `.env.local` mengaktifkan Supabase, akun warga
tersebut harus benar-benar ada di `auth.users` sebelum dipakai di aplikasi; kalau tidak,
login akan menampilkan "Email atau sandi tidak cocok". Ganti dua nilai itu di konstanta
`AKUN` pada `index.html` setelah akun uji warga dibuat.

## Varian

### 1. Panel lembut

**Stance:** container sebagai catatan pendukung form, bukan elemen baru yang mencolok.

- Kotak hijau pucat `#eef6f3`, garis aksen kiri 3px, radius 10px.
- Isi: ikon labu, "Akun demo", satu baris penjelasan, dua tombol putih sejajar.
- Posisi: setelah tombol Masuk, sebelum tautan daftar.
- Kuat: paling menyatu dengan form, tinggi tambahan paling kecil di antara varian non-strip.
- Lemah: sorotan halus, bisa terlewat.

### 2. Kartu peran

**Stance:** container sebagai pemilih peran, dengan informasi yang cukup untuk memutuskan.

- Kartu krem `#fdf7e8`, pita "AKSES CEPAT", dua kartu bertumpuk berisi avatar, email, dan tujuan.
- Posisi: setelah form, sebelum tautan daftar.
- Kuat: paling jelas untuk penguji/juri; email terbaca sebelum diklik.
- Lemah: paling banyak memakai ruang vertikal dan paling berat secara visual.

### 3. Strip gelap

**Stance:** pintasan kecil yang menempel pada aksi utama.

- Strip `#16181c`, label "Isi cepat · akun demo", dua tombol outline di kanan, tinggi ±36px.
- Posisi: di dalam form, langsung di bawah tombol Masuk.
- Kuat: paling dekat dengan tombol Masuk, tidak menggeser tautan daftar.
- Lemah: tema gelap bisa terasa berasal dari sistem visual lain.

### 4. Tiket demo

**Stance:** alat bantu pengujian yang jujur, bukan bagian alur warga.

- Bingkai krem bergaris putus-putus, stempel "DEMO", dua pilihan dengan titik warna.
- Posisi: setelah form, sebelum tautan daftar.
- Kuat: menandai jelas bahwa ini hanya untuk demo.
- Lemah: bisa terasa dekoratif atau sementara.

### 5. Sorotan gradien

**Stance:** container sebagai kontrol, paling menonjol tanpa keluar dari palet.

- Bingkai gradien hijau–emas, panel putih, dua segmen peran, badge "AKUN DEMO".
- Posisi: setelah form, sebelum tautan daftar.
- Kuat: paling "ter-highlight" sesuai permintaan; segmen aktif terasa seperti state kontrol.
- Lemah: menambah satu bahasa visual baru (gradien) yang sebaiknya tidak dipakai di banyak tempat.

## Perilaku yang sudah disimulasikan

- Klik tombol warga/moderator mengisi `EMAIL` dan `SANDI`, memberi cincin hijau + label "terisi"
  pada kedua kolom, menandai tombol aktif, dan menampilkan status di dalam container.
- Tombol mata pada kolom sandi tetap berfungsi.
- Tombol Masuk tidak mengirim kredensial; hanya menampilkan toast mode pratinjau.
- Tautan "Lupa sandi?", "Daftar akun warga", dan "Kembali ke Peta" hanya menampilkan toast.

## Catatan implementasi (setelah satu varian disetujui)

1. Tambahkan konstanta kredensial demo di dekat atas `GerbangLogin.tsx`, misalnya:

   ```tsx
   const AKUN_DEMO = {
     warga: { email: "warga.demo@gmail.com", sandi: "warga12345" },
     moderator: { email: "admin@gmail.com", sandi: "admin123" },
   } as const;
   ```

2. Pasang container versi terpilih di `section.gate-form`, setelah `<form id="formMasuk">`
   (atau setelah tombol Masuk untuk varian 3). Tombol cukup memanggil:

   ```tsx
   onClick={() => {
     setEmail(AKUN_DEMO.warga.email);
     setSandi(AKUN_DEMO.warga.sandi);
     setGalat(null);
   }}
   ```

3. Jangan menambahkan auto-submit: pengguna tetap menekan Masuk, sesuai permintaan.
4. Tambahkan kelas CSS-nya ke `src/App.css` mengikuti token warna yang sudah ada
   (`--warna-aksen`, `--warna-garis`, dan seterusnya).
5. Pertimbangkan menghapus blok ini sebelum rilis publik, atau membatasinya dengan flag demo,
   karena kredensial moderator ikut tertulis di antarmuka.
