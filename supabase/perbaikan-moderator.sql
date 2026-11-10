-- ============================================================================
-- PERBAIKAN: KEPUTUSAN MODERATOR TIDAK TERSIMPAN
-- Jalankan seluruh berkas ini di Supabase Dashboard -> SQL Editor.
--
-- Penyebab: policy RLS "Hanya moderator yang dapat memperbarui laporan"
-- hanya mengizinkan akun dengan role moderator/admin. Halaman moderator
-- dipakai dengan akun warga, sehingga UPDATE mengenai 0 baris. Supabase
-- tidak mengembalikan error untuk kasus itu, jadi UI sempat menampilkan
-- status baru lalu kembali setelah halaman dimuat ulang.
-- ============================================================================

-- 1. Pastikan kolom updated_at tersedia (dipakai saat menyimpan keputusan).
alter table public.laporan_warga
  add column if not exists updated_at timestamp with time zone
  default timezone('utc'::text, now()) not null;

-- 2. Pastikan policy UPDATE hanya untuk moderator/admin tetap terpasang.
drop policy if exists "Hanya moderator yang dapat memperbarui laporan" on public.laporan_warga;
create policy "Hanya moderator yang dapat memperbarui laporan"
  on public.laporan_warga for update
  to authenticated
  using (
    exists (
      select 1 from public.profil_pengguna
      where id = auth.uid() and role in ('moderator', 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.profil_pengguna
      where id = auth.uid() and role in ('moderator', 'admin')
    )
  );

-- 3. Naikkan role akun moderator bawaan.
--    Akun admin@gmail.com sudah dibuat dengan role admin lewat Supabase Auth.
--    Jalankan blok ini kalau role-nya perlu dipulihkan (mis. setelah reset).
update public.profil_pengguna
set role = 'admin'
where id = (
  select id from auth.users where email = 'admin@gmail.com'
);

-- 4. Periksa hasilnya. Akun yang dipakai harus muncul dengan role moderator.
select u.email, p.nama_lengkap, p.role
from public.profil_pengguna p
join auth.users u on u.id = p.id
order by p.role, u.email;

-- Catatan:
-- - Akun master: admin@gmail.com / admin123 (role admin, email sudah terkonfirmasi).
--   Ganti sandi ini sebelum situs dipublikasikan.
-- - Jika baru mengubah role lewat SQL, keluar lalu masuk lagi di aplikasi
--   (atau muat ulang halaman) supaya role terbaru terbaca.
-- - Sebaiknya buat akun moderator terpisah untuk operasional harian,
--   jangan memakai akun master untuk semua orang.
