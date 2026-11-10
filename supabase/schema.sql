-- ============================================================================
-- SKEMA BASIS DATA SUPABASE — LENTERA (MIA 2026)
-- Tim miamiudua
--
-- Arsitektur Wajib Auth & Profil Pengguna Terverifikasi
-- ============================================================================

-- 1. Tabel Profil Pengguna
create table if not exists public.profil_pengguna (
  id uuid primary key references auth.users(id) on delete cascade,
  nama_lengkap text not null,
  no_telepon text not null,
  role text not null default 'warga' check (role in ('warga', 'relawan', 'moderator', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Profil Pengguna
alter table public.profil_pengguna enable row level security;

drop policy if exists "Pengguna dapat melihat profil sendiri" on public.profil_pengguna;
create policy "Pengguna dapat melihat profil sendiri"
  on public.profil_pengguna for select
  using (auth.uid() = id);

drop policy if exists "Moderator dan admin dapat melihat semua profil" on public.profil_pengguna;
create policy "Moderator dan admin dapat melihat semua profil"
  on public.profil_pengguna for select
  using (
    exists (
      select 1 from public.profil_pengguna
      where id = auth.uid() and role in ('moderator', 'admin')
    )
  );

drop policy if exists "Pengguna dapat memperbarui profil sendiri" on public.profil_pengguna;
create policy "Pengguna dapat memperbarui profil sendiri"
  on public.profil_pengguna for update
  using (auth.uid() = id);

-- 2. Trigger Otomatis: Buat Profil saat User Daftar di auth.users
create or replace function public.tangani_pengguna_baru()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_nama text;
  v_telepon text;
  v_role text;
begin
  v_nama := coalesce(new.raw_user_meta_data->>'nama', new.email, 'Warga');
  v_telepon := coalesce(new.raw_user_meta_data->>'telepon', '-');
  v_role := coalesce(new.raw_user_meta_data->>'role', 'warga');

  insert into public.profil_pengguna (id, nama_lengkap, no_telepon, role)
  values (new.id, v_nama, v_telepon, v_role)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.tangani_pengguna_baru();

-- 3. Sinkronkan Tabel Laporan Warga dengan Profil Pengguna
delete from public.laporan_warga where user_id is null;

alter table public.laporan_warga
  alter column user_id set not null;

alter table public.laporan_warga
  drop constraint if exists fk_laporan_profil;

alter table public.laporan_warga
  drop constraint if exists laporan_warga_user_id_fkey;

alter table public.laporan_warga
  add constraint fk_laporan_profil
  foreign key (user_id)
  references public.profil_pengguna(id)
  on delete restrict;

-- 4. RLS Baru untuk Laporan Warga
drop policy if exists "Publik dapat melihat laporan via kode atau diterbitkan" on public.laporan_warga;
drop policy if exists "Siapapun dapat mengirim laporan" on public.laporan_warga;
drop policy if exists "Moderator dapat memperbarui laporan" on public.laporan_warga;
drop policy if exists "Hanya pengguna login yang dapat mengirim laporan" on public.laporan_warga;
drop policy if exists "Membaca laporan warga" on public.laporan_warga;
drop policy if exists "Hanya moderator yang dapat memperbarui laporan" on public.laporan_warga;

-- a. INSERT: Wajib authenticated dan user_id sesuai uid
create policy "Hanya pengguna login yang dapat mengirim laporan"
  on public.laporan_warga for insert
  to authenticated
  with check (auth.uid() = user_id);

-- b. SELECT: Pelapor bisa lihat miliknya, publik bisa lihat yang diterbitkan, moderator lihat semua
create policy "Membaca laporan warga"
  on public.laporan_warga for select
  using (
    auth.uid() = user_id
    or status = 'Diterbitkan'
    or exists (
      select 1 from public.profil_pengguna
      where id = auth.uid() and role in ('moderator', 'admin')
    )
  );

-- c. UPDATE: Khusus moderator dan admin
create policy "Hanya moderator yang dapat memperbarui laporan"
  on public.laporan_warga for update
  to authenticated
  using (
    exists (
      select 1 from public.profil_pengguna
      where id = auth.uid() and role in ('moderator', 'admin')
    )
  );

-- d. Fungsi RPC Pencarian Status Publik (via Kode Rujukan tanpa login)
create or replace function public.cek_status_laporan(p_kode text)
returns setof public.laporan_warga
language sql
security definer set search_path = public
as $$
  select * from public.laporan_warga where upper(kode) = upper(p_kode) limit 1;
$$;

-- 5. Storage Bukti Foto: Hanya Authenticated yang Boleh Upload
drop policy if exists "Siapapun dapat mengunggah foto bukti" on storage.objects;
drop policy if exists "Hanya pengguna login yang dapat mengunggah foto" on storage.objects;

create policy "Hanya pengguna login yang dapat mengunggah foto"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'bukti-laporan');
