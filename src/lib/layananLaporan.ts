import { supabase, apakahSupabaseAktif } from "./supabase";

export interface PenggunaPelapor {
  id?: string;
  nama: string;
  email: string;
  telepon: string;
  instansi?: string;
  role?: "warga" | "relawan" | "moderator" | "admin";
  peran?: "warga" | "moderator";
}

export interface ItemLaporan {
  id?: string;
  kode: string;
  dikirim: string;
  wilayah: string;
  desa: string;
  jenis: string;
  status: "Menunggu" | "Butuh verifikasi" | "Diterbitkan" | "Ditolak";
  moderator: string;
  deskripsi: string;
  catatanModerator: string;
  tanggalKejadian: string;
  pelapor: string;
  kontak: string;
  email: string;
  fotoUrl?: string;
  dampak?: string;
  createdAt?: string;
  userId?: string;
}

export const DATA_AWAL_LAPORAN: ItemLaporan[] = [
  {
    kode: "LNT-8F2K-4Q9D",
    dikirim: "12 Nov 2025, 09.14",
    wilayah: "Probolinggo Kabupaten",
    desa: "Kel./Ds. Kedasih, Kec. Sukapura",
    jenis: "Tanah longsor",
    status: "Butuh verifikasi",
    moderator: "Belum ditinjau",
    deskripsi:
      "Tanah menutup jalan desa sepanjang sekitar 30 meter. Tidak ada korban jiwa, satu rumah terdampak. Akses dari arah utara tidak bisa dilewati.",
    catatanModerator:
      "Foto belum menunjukkan titik lokasi yang jelas. Minta pelapor mengunggah foto dengan penanda jalan.",
    tanggalKejadian: "31 Desember 2025",
    pelapor: "Muhammad Bagas Farshaldy",
    kontak: "0812-3456-7890",
    email: "farshaldybagas@gmail.com",
  },
  {
    kode: "LNT-3M7P-1XCV",
    dikirim: "12 Nov 2025, 08.02",
    wilayah: "Lumajang Kabupaten",
    desa: "Kec. Pronojiwo",
    jenis: "Banjir",
    status: "Diterbitkan",
    moderator: "Raka",
    deskripsi: "Genangan air setinggi 40 cm di permukiman RT 02.",
    catatanModerator: "Laporan terverifikasi lewat kontak posko.",
    tanggalKejadian: "12 November 2025",
    pelapor: "Ahmad Fauzi",
    kontak: "0813-8821-4455",
    email: "fauzi.relawan@gmail.com",
  },
  {
    kode: "LNT-9Q4T-6BNM",
    dikirim: "11 Nov 2025, 21.40",
    wilayah: "Pasuruan Kabupaten",
    desa: "Kec. Grati",
    jenis: "Angin kencang",
    status: "Menunggu",
    moderator: "—",
    deskripsi: "Atap beberapa kios pasar terbawa angin saat hujan deras.",
    catatanModerator: "Menunggu pemeriksaan berkas foto.",
    tanggalKejadian: "11 November 2025",
    pelapor: "Dewi Lestari",
    kontak: "0857-1902-8831",
    email: "dewilestari@yahoo.com",
  },
  {
    kode: "LNT-2W8K-5JHD",
    dikirim: "11 Nov 2025, 17.11",
    wilayah: "Malang Kota",
    desa: "Kec. Klojen",
    jenis: "Gempa",
    status: "Menunggu",
    moderator: "—",
    deskripsi: "Getaran terasa kuat sekitar 5 detik, tidak ada retakan bangunan.",
    catatanModerator: "Menunggu data konfirmasi BMKG.",
    tanggalKejadian: "11 November 2025",
    pelapor: "Budi Santoso",
    kontak: "0821-7765-1290",
    email: "budi.malang@gmail.com",
  },
  {
    kode: "LNT-7C1V-3RTY",
    dikirim: "11 Nov 2025, 11.25",
    wilayah: "Sidoarjo Kabupaten",
    desa: "Kec. Porong",
    jenis: "Banjir",
    status: "Ditolak",
    moderator: "Nadia",
    deskripsi: "Foto yang dilampirkan adalah dokumentasi banjir tahun 2021.",
    catatanModerator: "Foto tidak sesuai waktu kejadian (duplikasi lama).",
    tanggalKejadian: "10 November 2025",
    pelapor: "Rian Hidayat",
    kontak: "0896-4432-8811",
    email: "rian.hid@outlook.com",
  },
  {
    kode: "LNT-5B6N-8KLP",
    dikirim: "10 Nov 2025, 19.03",
    wilayah: "Gresik Kabupaten",
    desa: "Kec. Manyar",
    jenis: "Kebakaran",
    status: "Diterbitkan",
    moderator: "Raka",
    deskripsi: "Kebakaran ilalang dekat kawasan industri, sudah ditangani damkar.",
    catatanModerator: "Terverifikasi dengan rilis damkar setempat.",
    tanggalKejadian: "10 November 2025",
    pelapor: "Siti Rahmawati",
    kontak: "0812-9988-7766",
    email: "siti.rahma@gmail.com",
  },
  {
    kode: "LNT-4H2S-9WQE",
    dikirim: "10 Nov 2025, 15.48",
    wilayah: "Jember Kabupaten",
    desa: "Kec. Silo",
    jenis: "Tanah longsor",
    status: "Butuh verifikasi",
    moderator: "Nadia",
    deskripsi: "Tebing jalan raya longsor menutup separuh lajur kendaraan.",
    catatanModerator: "Perlu konfirmasi status pembukaan jalan.",
    tanggalKejadian: "10 November 2025",
    pelapor: "Hendra Kusuma",
    kontak: "0878-1122-3344",
    email: "hendra.ksm@gmail.com",
  },
];

const KUNCI_PELAPOR_STORAGE = "lentera_pelapor";
const KUNCI_LAPORAN_TAMBAHAN = "lentera_laporan_tambahan";

function ambilDariStorage(): ItemLaporan[] {
  try {
    const raw = localStorage.getItem(KUNCI_LAPORAN_TAMBAHAN);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function simpanKeStorage(list: ItemLaporan[]) {
  try {
    localStorage.setItem(KUNCI_LAPORAN_TAMBAHAN, JSON.stringify(list));
  } catch {
    // abaikan jika storage penuh
  }
}

export function buatKodeRujukan(): string {
  const c1 = Math.random().toString(36).substring(2, 6).toUpperCase();
  const c2 = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `LNT-${c1}-${c2}`;
}

// Konversi baris database Supabase ke ItemLaporan
interface BarisLaporanDB {
  id?: string;
  kode: string;
  user_id?: string;
  jenis: string;
  wilayah: string;
  desa: string;
  tanggal_kejadian: string;
  dampak?: string;
  deskripsi: string;
  foto_url?: string;
  status: "Menunggu" | "Butuh verifikasi" | "Diterbitkan" | "Ditolak";
  moderator?: string;
  catatan_moderator?: string;
  pelapor: string;
  kontak: string;
  email: string;
  created_at?: string;
}

function konversiDariDB(row: BarisLaporanDB): ItemLaporan {
  const d = row.created_at ? new Date(row.created_at) : new Date();
  const formatTgl = d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return {
    id: row.id,
    kode: row.kode,
    dikirim: formatTgl,
    wilayah: row.wilayah,
    desa: row.desa,
    jenis: row.jenis,
    status: row.status || "Butuh verifikasi",
    moderator: row.moderator || "Belum ditinjau",
    deskripsi: row.deskripsi,
    catatanModerator:
      row.catatan_moderator ||
      "Laporan baru masuk, menunggu verifikasi awal dari moderator.",
    tanggalKejadian: row.tanggal_kejadian,
    pelapor: row.pelapor,
    kontak: row.kontak,
    email: row.email,
    fotoUrl: row.foto_url,
    dampak: row.dampak,
    createdAt: row.created_at,
    userId: row.user_id,
  };
}

// ============================================================================
// FUNGSI AUTENTIKASI DENGAN TABEL PROFIL PENGGUNA
// ============================================================================

export async function ambilSesiPelapor(): Promise<PenggunaPelapor | null> {
  if (apakahSupabaseAktif && supabase) {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user) {
        const u = data.user;
        const meta = u.user_metadata || {};

        // Ambil profil dari public.profil_pengguna
        const { data: prof } = await supabase
          .from("profil_pengguna")
          .select("nama_lengkap, no_telepon, role")
          .eq("id", u.id)
          .maybeSingle();

        const role = (prof?.role as PenggunaPelapor["role"]) || (meta.role as PenggunaPelapor["role"]) || peranDariEmail(u.email || "");
        return {
          id: u.id,
          nama: prof?.nama_lengkap || meta.nama || u.email?.split("@")[0] || "Warga",
          email: u.email || "",
          telepon: prof?.no_telepon || meta.telepon || "",
          instansi: role === "moderator" ? "Moderator Resmi" : "Warga Terverifikasi",
          role,
          peran: role === "moderator" ? "moderator" : "warga",
        };
      }
    } catch {
      // abaikan
    }
  }

  try {
    const saved = localStorage.getItem(KUNCI_PELAPOR_STORAGE);
    if (saved) {
      const parsed = JSON.parse(saved) as PenggunaPelapor;
      const peran = parsed.peran || (parsed.role === "moderator" ? "moderator" : peranDariEmail(parsed.email));
      return {
        ...parsed,
        peran,
        role: (parsed.role || peran) as PenggunaPelapor["role"],
      };
    }
  } catch {
    // abaikan
  }
  return null;
}

export function namaDariEmail(email: string): string {
  const bersih = String(email).trim().toLowerCase();
  if (bersih === "admin@gmail.com") return "Admin Lentera";
  const dasar = bersih.split("@")[0].replace(/[._-]/g, " ").trim();
  if (!dasar) return "Warga Lentera";
  return dasar
    .split(" ")
    .filter(Boolean)
    .map((k) => k.charAt(0).toUpperCase() + k.slice(1))
    .join(" ");
}

export function inisial(nama: string): string {
  return String(nama)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((k) => k.charAt(0).toUpperCase())
    .join("");
}

export function peranDariEmail(email: string): "moderator" | "warga" {
  return String(email).trim().toLowerCase() === "admin@gmail.com" ? "moderator" : "warga";
}

export async function masukPelapor(
  email: string,
  sandi: string
): Promise<PenggunaPelapor> {
  const emailBersih = email.trim().toLowerCase();
  const adalahAdminDemo = emailBersih === "admin@gmail.com";

  if (apakahSupabaseAktif && supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailBersih,
        password: sandi,
      });
      if (!error && data?.user) {
        const u = data.user;
        const { data: prof } = await supabase
          .from("profil_pengguna")
          .select("nama_lengkap, no_telepon, role")
          .eq("id", u.id)
          .maybeSingle();

        const meta = u.user_metadata || {};
        const role =
          adalahAdminDemo
            ? "moderator"
            : ((prof?.role as PenggunaPelapor["role"]) ||
              (meta.role as PenggunaPelapor["role"]) ||
              "warga");

        const profil: PenggunaPelapor = {
          id: u.id,
          nama: prof?.nama_lengkap || meta.nama || (adalahAdminDemo ? "Admin Lentera" : namaDariEmail(emailBersih)),
          email: u.email || emailBersih,
          telepon: prof?.no_telepon || meta.telepon || "",
          instansi: role === "moderator" ? "Moderator Resmi" : "Warga Terverifikasi",
          role,
          peran: role === "moderator" ? "moderator" : "warga",
        };

        try {
          localStorage.setItem(KUNCI_PELAPOR_STORAGE, JSON.stringify(profil));
        } catch {
          // abaikan
        }
        return profil;
      }
      if (error && !adalahAdminDemo) {
        throw new Error(error.message);
      }
    } catch (err) {
      if (!adalahAdminDemo) throw err;
    }
  }
  // Fallback lokal jika koneksi Supabase belum aktif (mode demo / offline)
  const role = adalahAdminDemo ? "moderator" : peranDariEmail(emailBersih);
  const nama = adalahAdminDemo ? "Admin Lentera" : namaDariEmail(emailBersih);
  const profil: PenggunaPelapor = {
    id: adalahAdminDemo ? "demo-admin-id" : `warga-lokal-${Date.now()}`,
    nama,
    email: emailBersih,
    telepon: "08123456789",
    instansi: role === "moderator" ? "Moderator Resmi" : "Warga Terverifikasi (Mode Demo)",
    role,
    peran: role === "moderator" ? "moderator" : "warga",
  };
  try {
    localStorage.setItem(KUNCI_PELAPOR_STORAGE, JSON.stringify(profil));
  } catch {
    // abaikan
  }
  return profil;
}

export async function daftarPelapor(
  nama: string,
  email: string,
  sandi: string,
  telepon: string
): Promise<PenggunaPelapor> {
  const emailBersih = email.trim().toLowerCase();
  const adalahAdminDemo = emailBersih === "admin@gmail.com";
  const role = adalahAdminDemo ? "moderator" : "warga";

  if (apakahSupabaseAktif && supabase) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: emailBersih,
        password: sandi,
        options: {
          data: {
            nama: nama.trim(),
            telepon: telepon.trim(),
            role,
          },
        },
      });
      if (error) {
        throw new Error(error.message);
      }
      const u = data.user;
      if (!u) throw new Error("Gagal membuat akun");

      const profil: PenggunaPelapor = {
        id: u.id,
        nama: nama.trim(),
        email: emailBersih,
        telepon: telepon.trim(),
        instansi: role === "moderator" ? "Moderator Resmi" : "Warga Terverifikasi",
        role,
      };

      try {
        localStorage.setItem(KUNCI_PELAPOR_STORAGE, JSON.stringify(profil));
      } catch {
        // abaikan
      }
      return profil;
    } catch (err) {
      if (!apakahSupabaseAktif) {
        // lanjut fallback
      } else {
        throw err;
      }
    }
  }
  // Fallback lokal jika koneksi Supabase belum aktif (mode demo / offline)
  const profil: PenggunaPelapor = {
    id: `warga-lokal-${Date.now()}`,
    nama: nama.trim() || namaDariEmail(emailBersih),
    email: emailBersih,
    telepon: telepon.trim() || "08123456789",
    instansi: role === "moderator" ? "Moderator Resmi" : "Warga Terverifikasi (Mode Demo)",
    role,
    peran: role === "moderator" ? "moderator" : "warga",
  };
  try {
    localStorage.setItem(KUNCI_PELAPOR_STORAGE, JSON.stringify(profil));
  } catch {
    // abaikan
  }
  return profil;
}

export async function keluarPelapor(): Promise<void> {
  if (apakahSupabaseAktif && supabase) {
    try {
      await supabase.auth.signOut();
    } catch {
      // abaikan
    }
  }
  try {
    localStorage.removeItem(KUNCI_PELAPOR_STORAGE);
  } catch {
    // abaikan
  }
}

// ============================================================================
// FUNGSI UNGGAH FOTO BUKTI
// ============================================================================

export async function unggahFotoBukti(file: File, kode: string): Promise<string | undefined> {
  if (!apakahSupabaseAktif || !supabase) return undefined;

  const ekstensi = file.name.split(".").pop() || "jpg";
  const namaBerkas = `${kode}-${Date.now()}.${ekstensi}`;
  const { data, error } = await supabase.storage
    .from("bukti-laporan")
    .upload(namaBerkas, file, { cacheControl: "3600", upsert: true });

  if (error) {
    console.warn("Gagal unggah foto ke Supabase Storage:", error.message);
    throw new Error(`Gagal mengunggah foto bukti: ${error.message}`);
  }

  const { data: pubUrl } = supabase.storage
    .from("bukti-laporan")
    .getPublicUrl(data.path);

  return pubUrl?.publicUrl;
}

// ============================================================================
// FUNGSI LAPORAN (KIRIM, CEK STATUS, RIWAYAT SAYA, MODERASI)
// ============================================================================

export async function kirimLaporanKeServer(
  input: {
    userId?: string;
    jenis: string;
    wilayah: string;
    desa: string;
    tanggalKejadian: string;
    dampak?: string;
    deskripsi: string;
    pelapor: string;
    kontak: string;
    email: string;
    kodeKustom?: string;
  },
  fileFoto?: File
): Promise<ItemLaporan> {
  const kode = input.kodeKustom?.trim() || buatKodeRujukan();

  let fotoUrl: string | undefined = undefined;
  if (fileFoto) {
    try {
      fotoUrl = await unggahFotoBukti(fileFoto, kode);
    } catch (err) {
      console.warn("Gagal unggah foto:", err);
    }
  }

  if (apakahSupabaseAktif && supabase) {
    let targetUid = input.userId;
    if (!targetUid) {
      const { data } = await supabase.auth.getUser();
      targetUid = data?.user?.id;
    }

    if (!targetUid) {
      throw new Error("Wajib masuk akun terlebih dahulu untuk mengirim laporan.");
    }

    const payload: BarisLaporanDB = {
      kode,
      user_id: targetUid,
      jenis: input.jenis,
      wilayah: input.wilayah,
      desa: input.desa,
      tanggal_kejadian: input.tanggalKejadian,
      dampak: input.dampak,
      deskripsi: input.deskripsi,
      foto_url: fotoUrl,
      status: "Butuh verifikasi",
      moderator: "Belum ditinjau",
      catatan_moderator:
        "Laporan baru masuk, menunggu verifikasi awal dari moderator.",
      pelapor: input.pelapor,
      kontak: input.kontak,
      email: input.email,
    };

    const { data, error } = await supabase
      .from("laporan_warga")
      .insert([payload])
      .select()
      .single();

    if (error) {
      throw new Error(`Gagal menyimpan laporan ke server: ${error.message}`);
    }

    if (data) {
      return konversiDariDB(data);
    }
  }

  // Fallback lokal jika supabase tidak aktif
  const itemBaru: ItemLaporan = {
    kode,
    dikirim: "Baru saja",
    wilayah: input.wilayah,
    desa: input.desa,
    jenis: input.jenis,
    status: "Butuh verifikasi",
    moderator: "Belum ditinjau",
    deskripsi: input.deskripsi,
    catatanModerator: "Laporan baru masuk, menunggu verifikasi awal dari moderator.",
    tanggalKejadian: input.tanggalKejadian,
    pelapor: input.pelapor,
    kontak: input.kontak,
    email: input.email,
    fotoUrl,
    dampak: input.dampak,
  };

  const list = ambilDariStorage();
  list.unshift(itemBaru);
  simpanKeStorage(list);

  return itemBaru;
}

export async function periksaStatusLaporan(kode: string): Promise<ItemLaporan | null> {
  const bersih = kode.trim().toUpperCase();
  if (!bersih) return null;

  if (apakahSupabaseAktif && supabase) {
    try {
      // 1. Coba lewat RPC public cek_status_laporan
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        "cek_status_laporan",
        { p_kode: bersih }
      );
      if (!rpcError && rpcData && rpcData.length > 0) {
        return konversiDariDB(rpcData[0]);
      }

      // 2. Coba lewat SELECT langsung
      const { data, error } = await supabase
        .from("laporan_warga")
        .select("*")
        .eq("kode", bersih)
        .maybeSingle();

      if (!error && data) {
        return konversiDariDB(data);
      }
    } catch (err) {
      console.warn("Supabase lookup error:", err);
    }
  }

  // Cek antrean lokal
  const localList = ambilDariStorage();
  const ketemuLokal = localList.find((it) => it.kode === bersih);
  if (ketemuLokal) return ketemuLokal;

  const ketemuBawaan = DATA_AWAL_LAPORAN.find((it) => it.kode === bersih);
  return ketemuBawaan || null;
}

export async function ambilRiwayatLaporanSaya(userId?: string): Promise<ItemLaporan[]> {
  if (apakahSupabaseAktif && supabase) {
    try {
      let uid = userId;
      if (!uid) {
        const { data } = await supabase.auth.getUser();
        uid = data?.user?.id;
      }

      if (uid) {
        const { data, error } = await supabase
          .from("laporan_warga")
          .select("*")
          .eq("user_id", uid)
          .order("created_at", { ascending: false });

        if (!error && data) {
          return data.map(konversiDariDB);
        }
      }
    } catch (err) {
      console.warn("Gagal mengambil riwayat laporan saya:", err);
    }
  }

  // Fallback lokal
  const localList = ambilDariStorage();
  return localList;
}

export async function ambilDaftarModerator(): Promise<ItemLaporan[]> {
  if (apakahSupabaseAktif && supabase) {
    const { data, error } = await supabase
      .from("laporan_warga")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Gagal memuat antrean dari Supabase: ${error.message}`);
    }

    return (data || []).map(konversiDariDB);
  }

  // Fallback lokal (hanya saat Supabase belum dikonfigurasi)
  return ambilDariStorage();
}

export async function perbaruiStatusLaporan(
  kode: string,
  statusBaru: ItemLaporan["status"],
  catatanModerator: string,
  namaModerator: string = "Nadia"
): Promise<void> {
  if (apakahSupabaseAktif && supabase) {
    // .select() dipakai supaya kita tahu berapa baris yang benar-benar
    // berubah. Tanpa ini, RLS yang menolak UPDATE hanya mengembalikan
    // 0 baris tanpa error, lalu UI seolah-olah berhasil padahal basis
    // data tidak berubah.
    const { data, error } = await supabase
      .from("laporan_warga")
      .update({
        status: statusBaru,
        catatan_moderator: catatanModerator,
        moderator: namaModerator,
        updated_at: new Date().toISOString(),
      })
      .eq("kode", kode)
      .select("id, kode");

    if (error) {
      throw new Error(`Gagal menyimpan keputusan ke Supabase: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error(
        "Keputusan tidak tersimpan di server. Pastikan akun ini punya role moderator/admin dan kode laporan masih ada."
      );
    }

    return;
  }

  // Fallback lokal (hanya saat Supabase belum dikonfigurasi)
  const extra = ambilDariStorage();
  const listBaru = extra.map((it) => {
    if (it.kode === kode) {
      return {
        ...it,
        status: statusBaru,
        catatanModerator,
        moderator: namaModerator,
      };
    }
    return it;
  });

  simpanKeStorage(listBaru);
}
