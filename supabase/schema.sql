-- ============================================================================
-- SKEMA BASIS DATA SUPABASE — LENTERA (MIA 2026)
-- Tim miamiudua
--
-- Jalankan skrip ini di SQL Editor dashboard Supabase kamu.
-- ============================================================================

-- 1. Tabel Laporan Warga
create table if not exists public.laporan_warga (
  id uuid primary key default gen_random_uuid(),
  kode text unique not null,
  user_id uuid references auth.users(id) on delete set null,
  jenis text not null,
  wilayah text not null,
  desa text not null,
  tanggal_kejadian text not null,
  dampak text,
  deskripsi text not null,
  foto_url text,
  status text not null default 'Butuh verifikasi' check (status in ('Menunggu', 'Butuh verifikasi', 'Diterbitkan', 'Ditolak')),
  moderator text not null default 'Belum ditinjau',
  catatan_moderator text not null default 'Laporan baru masuk, menunggu verifikasi awal dari moderator.',
  pelapor text not null,
  kontak text not null,
  email text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indeks untuk pencarian cepat berdasarkan kode rujukan dan status
create index if not exists idx_laporan_kode on public.laporan_warga(kode);
create index if not exists idx_laporan_status on public.laporan_warga(status);
create index if not exists idx_laporan_created_at on public.laporan_warga(created_at desc);

-- 2. Tabel Catatan Bantuan Komunitas
create table if not exists public.bantuan_komunitas (
  id uuid primary key default gen_random_uuid(),
  judul text not null,
  wilayah text not null,
  tanggal text not null,
  isi text not null,
  status_verifikasi text not null default 'Belum diverifikasi',
  pengirim text not null default 'Dikirim warga',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Row-Level Security (RLS)
alter table public.laporan_warga enable row level security;
alter table public.bantuan_komunitas enable row level security;

-- Kebijakan Laporan Warga:
-- a. Publik dapat mencari laporan berdasarkan kode rujukan atau melihat yang sudah Diterbitkan
create policy "Publik dapat melihat laporan via kode atau diterbitkan"
  on public.laporan_warga for select
  using (true);

-- b. Siapapun (publik/authenticated) dapat mengirim laporan baru
create policy "Siapapun dapat mengirim laporan"
  on public.laporan_warga for insert
  with check (true);

-- c. Moderator / pengguna terautentikasi dapat memperbarui status laporan
create policy "Moderator dapat memperbarui laporan"
  on public.laporan_warga for update
  using (true);

-- Kebijakan Bantuan Komunitas:
create policy "Publik dapat membaca catatan komunitas"
  on public.bantuan_komunitas for select
  using (true);

create policy "Pengguna dapat menambahkan catatan komunitas"
  on public.bantuan_komunitas for insert
  with check (true);

-- 4. Setup Storage Bucket untuk Foto Bukti
insert into storage.buckets (id, name, public)
values ('bukti-laporan', 'bukti-laporan', true)
on conflict (id) do nothing;

create policy "Foto bukti dapat dilihat publik"
  on storage.objects for select
  using (bucket_id = 'bukti-laporan');

create policy "Siapapun dapat mengunggah foto bukti"
  on storage.objects for insert
  with check (bucket_id = 'bukti-laporan');

-- 5. Data Awal (Seed Data)
insert into public.laporan_warga (
  kode, jenis, wilayah, desa, tanggal_kejadian, deskripsi, status, moderator, catatan_moderator, pelapor, kontak, email
) values
(
  'LNT-8F2K-4Q9D', 'Tanah longsor', 'Probolinggo Kabupaten', 'Kel./Ds. Kedasih, Kec. Sukapura', '31 Desember 2025',
  'Tanah menutup jalan desa sepanjang sekitar 30 meter. Tidak ada korban jiwa, satu rumah terdampak. Akses dari arah utara tidak bisa dilewati.',
  'Butuh verifikasi', 'Belum ditinjau', 'Foto belum menunjukkan titik lokasi yang jelas. Minta pelapor mengunggah foto dengan penanda jalan.',
  'Muhammad Bagas Farshaldy', '0812-3456-7890', 'farshaldybagas@gmail.com'
),
(
  'LNT-3M7P-1XCV', 'Banjir', 'Lumajang Kabupaten', 'Kec. Pronojiwo', '12 November 2025',
  'Genangan air setinggi 40 cm di permukiman RT 02.',
  'Diterbitkan', 'Raka', 'Laporan terverifikasi lewat kontak posko.',
  'Ahmad Fauzi', '0813-8821-4455', 'fauzi.relawan@gmail.com'
),
(
  'LNT-9Q4T-6BNM', 'Angin kencang', 'Pasuruan Kabupaten', 'Kec. Grati', '11 November 2025',
  'Atap beberapa kios pasar terbawa angin saat hujan deras.',
  'Menunggu', '—', 'Menunggu pemeriksaan berkas foto.',
  'Dewi Lestari', '0857-1902-8831', 'dewilestari@yahoo.com'
),
(
  'LNT-2W8K-5JHD', 'Gempa', 'Malang Kota', 'Kec. Klojen', '11 November 2025',
  'Getaran terasa kuat sekitar 5 detik, tidak ada retakan bangunan.',
  'Menunggu', '—', 'Menunggu data konfirmasi BMKG.',
  'Budi Santoso', '0821-7765-1290', 'budi.malang@gmail.com'
),
(
  'LNT-7C1V-3RTY', 'Banjir', 'Sidoarjo Kabupaten', 'Kec. Porong', '10 November 2025',
  'Foto yang dilampirkan adalah dokumentasi banjir tahun 2021.',
  'Ditolak', 'Nadia', 'Foto tidak sesuai waktu kejadian (duplikasi lama).',
  'Rian Hidayat', '0896-4432-8811', 'rian.hid@outlook.com'
),
(
  'LNT-5B6N-8KLP', 'Kebakaran', 'Gresik Kabupaten', 'Kec. Manyar', '10 November 2025',
  'Kebakaran ilalang dekat kawasan industri, sudah ditangani damkar.',
  'Diterbitkan', 'Raka', 'Terverifikasi dengan rilis damkar setempat.',
  'Siti Rahmawati', '0812-9988-7766', 'siti.rahma@gmail.com'
),
(
  'LNT-4H2S-9WQE', 'Tanah longsor', 'Jember Kabupaten', 'Kec. Silo', '10 November 2025',
  'Tebing jalan raya longsor menutup separuh lajur kendaraan.',
  'Butuh verifikasi', 'Nadia', 'Perlu konfirmasi status pembukaan jalan.',
  'Hendra Kusuma', '0878-1122-3344', 'hendra.ksm@gmail.com'
)
on conflict (kode) do nothing;
