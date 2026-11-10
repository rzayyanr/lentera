/** Tipe data dan pemuat yang dipakai bersama oleh aplikasi. */

export interface Wilayah {
  /** Kode BPS, kunci utama. */
  kode: string;
  /** Nama menurut BNPB, dipakai apa adanya agar bisa ditelusuri ke sumber. */
  nama: string;
  /** Kode provinsi, dua digit pertama kode BPS. */
  prov: string;
  lat: number;
  lon: number;
  /** Jumlah kejadian per tahun, urut sesuai Meta.tahun. Sumber: tabel agregat. */
  nilai: number[];
}

export interface Provinsi {
  kode: string;
  nama: string;
  /** Jumlah dari kabupaten, dipakai di aplikasi agar angka konsisten. */
  nilai: number[];
  /** Angka sebagaimana diterbitkan BNPB di tabel provinsi. */
  nilaiBnpb: number[];
}

export interface Meta {
  dibuat: string;
  tahun: number[];
  jumlahWilayah: number;
  jumlahProvinsi: number;
  sumber: { nama: string; url: string; diambil: string };
  catatan: string[];
}

/** Data dampak per kabupaten per tahun dari berkas statistik wilayah BNPB. */
export interface Dampak {
  tahun: number[];
  ukuran: string[];
  /** kode wilayah menjadi kunci, tiap tahun berisi larik angka sesuai ukuran. */
  wilayah: Record<string, number[][]>;
  catatan: string[];
}

export interface DataLentera {
  meta: Meta;
  wilayah: Wilayah[];
  provinsi: Provinsi[];
  dampak: Dampak;
  cakupan: Cakupan;
  perKode: Map<string, Wilayah>;
  perProvinsi: Map<string, Wilayah[]>;
}

/**
 * Status ketersediaan rincian per kejadian untuk satu provinsi.
 * Dicatat apa adanya, termasuk yang belum tersedia dan yang belum diperiksa.
 */
export type StatusCakupan = "rinci" | "belum" | "belum_diperiksa";

export interface CakupanProvinsi {
  status: StatusCakupan;
  /** Nama sistem atau portal sumbernya. */
  sumber?: string;
  url?: string;
  alasan?: string;
  periode?: string;
  jumlahKejadian?: number;
  /** Tanggal data diambil, bukan tanggal diperiksa. */
  diambil?: string;
  catatan?: string;
}

export interface Cakupan {
  /** Tanggal terakhir seluruh portal diperiksa. */
  diperiksa: string;
  catatan: string[];
  /** Kunci adalah kode provinsi dua digit. */
  provinsi: Record<string, CakupanProvinsi>;
}

/** Ukuran yang bisa ditampilkan di peta. */
export const UKURAN_UTAMA = [
  { id: "kejadian", label: "Kejadian", satuan: "kejadian" },
  { id: "meninggal", label: "Meninggal", satuan: "jiwa" },
  { id: "luka", label: "Luka", satuan: "jiwa" },
  { id: "menderita", label: "Terdampak", satuan: "jiwa" },
  { id: "mengungsi", label: "Mengungsi", satuan: "jiwa" },
  { id: "rumahRusakBerat", label: "Rumah rusak berat", satuan: "unit" },
] as const;

export type IdUkuran = (typeof UKURAN_UTAMA)[number]["id"];

/** Nama panjang untuk rincian di panel. */
export const LABEL_UKURAN: Record<string, string> = {
  kejadian: "Jumlah kejadian",
  meninggal: "Korban meninggal",
  hilang: "Korban hilang",
  luka: "Korban luka",
  menderita: "Korban terdampak",
  mengungsi: "Korban mengungsi",
  rumahRusakBerat: "Rumah rusak berat",
  rumahRusakSedang: "Rumah rusak sedang",
  rumahRusakRingan: "Rumah rusak ringan",
  terendam: "Rumah terendam",
  fasPendidikan: "Fasilitas pendidikan rusak",
  fasKesehatan: "Fasilitas kesehatan rusak",
  fasPeribadatan: "Fasilitas peribadatan rusak",
  fasUmum: "Fasilitas umum rusak",
};

async function ambil<T>(jalur: string): Promise<T> {
  const res = await fetch(jalur);
  if (!res.ok) throw new Error(`Gagal memuat ${jalur}: HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export async function muatData(): Promise<DataLentera> {
  // Berkas wilayah wajib ada. Berkas dampak boleh gagal, dan kalau gagal
  // aplikasi tetap jalan dengan satu ukuran saja.
  const [meta, wilayah, provinsi] = await Promise.all([
    ambil<Meta>("/data/meta.json"),
    ambil<Wilayah[]>("/data/wilayah.json"),
    ambil<Provinsi[]>("/data/provinsi.json"),
  ]);

  let dampak: Dampak;
  try {
    dampak = await ambil<Dampak>("/data/dampak.json");
  } catch {
    dampak = { tahun: [], ukuran: [], wilayah: {}, catatan: ["Data dampak belum tersedia."] };
  }

  // Berkas cakupan boleh gagal; tanpa berkas itu antarmuka menganggap
  // rincian kejadian belum tersedia untuk semua provinsi.
  let cakupan: Cakupan;
  try {
    cakupan = await ambil<Cakupan>("/data/cakupan-sumber.json");
  } catch {
    cakupan = { diperiksa: "", catatan: [], provinsi: {} };
  }

  const perKode = new Map(wilayah.map((w) => [w.kode, w]));
  const perProvinsi = new Map<string, Wilayah[]>();
  for (const w of wilayah) {
    const daftar = perProvinsi.get(w.prov) ?? [];
    daftar.push(w);
    perProvinsi.set(w.prov, daftar);
  }

  return { meta, wilayah, provinsi, dampak, cakupan, perKode, perProvinsi };
}

/** Cakupan rincian kejadian untuk satu kode provinsi. */
export function cakupanProvinsi(data: DataLentera, prov: string): CakupanProvinsi {
  return data.cakupan.provinsi[prov] ?? { status: "belum_diperiksa" };
}

/** Nama provinsi disimpan dalam huruf besar; ini merapikannya untuk kalimat. */
export function namaProvinsiRapi(nama: string): string {
  return nama
    .toLowerCase()
    .split(" ")
    .map((kata) =>
      kata.length <= 3 ? kata.toUpperCase() : kata.charAt(0).toUpperCase() + kata.slice(1),
    )
    .join(" ");
}

/** Label pendek untuk status cakupan, dipakai di tabel dan panel. */
export function labelStatusCakupan(status: StatusCakupan): string {
  if (status === "rinci") return "Rinci per kejadian";
  if (status === "belum") return "Belum tersedia";
  return "Belum diperiksa";
}

/** 2026-11-10 menjadi 10 November 2026. */
export function formatTanggal(iso: string): string {
  const bulan = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  const [tahun, urutanBulan, hari] = iso.split("-").map(Number);
  if (!tahun || !urutanBulan || !hari) return iso;
  return `${hari} ${bulan[urutanBulan - 1]} ${tahun}`;
}

/** Ringkasan jumlah provinsi menurut status cakupan. */
export function ringkasCakupan(data: DataLentera): {
  rinci: number;
  belum: number;
  belumDiperiksa: number;
  total: number;
} {
  const semua = Object.values(data.cakupan.provinsi);
  return {
    rinci: semua.filter((c) => c.status === "rinci").length,
    belum: semua.filter((c) => c.status === "belum").length,
    belumDiperiksa: semua.filter((c) => c.status === "belum_diperiksa").length,
    total: semua.length,
  };
}

/** Tahun yang tersedia untuk satu ukuran. */
export function tahunUntuk(data: DataLentera, ukuran: string): number[] {
  if (ukuran === "kejadian") return data.meta.tahun;
  return data.dampak.tahun;
}

/** Sumber angka yang sedang ditampilkan, untuk ditulis di antarmuka. */
export function sumberUntuk(ukuran: string): string {
  return ukuran === "kejadian"
    ? "Tabel agregat BNPB"
    : "Berkas statistik wilayah BNPB";
}

/**
 * Ambil satu angka untuk wilayah, tahun, dan ukuran tertentu.
 * Mengembalikan null kalau wilayah tidak tercatat pada tahun itu, yang
 * berbeda artinya dari nol.
 */
export function ambilNilai(
  data: DataLentera,
  kode: string,
  tahun: number,
  ukuran: string,
): number | null {
  if (ukuran === "kejadian") {
    const w = data.perKode.get(kode);
    const i = data.meta.tahun.indexOf(tahun);
    if (!w || i < 0) return null;
    return w.nilai[i];
  }

  const rekaman = data.dampak.wilayah[kode];
  const iTahun = data.dampak.tahun.indexOf(tahun);
  const iUkuran = data.dampak.ukuran.indexOf(ukuran);
  if (!rekaman || iTahun < 0 || iUkuran < 0) return null;
  const v = rekaman[iTahun]?.[iUkuran];
  return v === undefined || v < 0 ? null : v;
}

/** Seluruh ukuran dampak untuk satu wilayah pada satu tahun. */
export function rincianDampak(
  data: DataLentera,
  kode: string,
  tahun: number,
): Array<{ id: string; label: string; nilai: number }> {
  const rekaman = data.dampak.wilayah[kode];
  const iTahun = data.dampak.tahun.indexOf(tahun);
  if (!rekaman || iTahun < 0) return [];
  const baris = rekaman[iTahun] ?? [];
  return data.dampak.ukuran
    .map((id, i) => ({ id, label: LABEL_UKURAN[id] ?? id, nilai: baris[i] ?? -1 }))
    .filter((x) => x.nilai >= 0);
}

/**
 * Jumlah kejadian seluruh kabupaten/kota di satu provinsi, per tahun.
 * Angka ini penjumlahan kabupaten, sama seperti angka provinsi di panel.
 */
export function kejadianProvinsi(
  data: DataLentera,
  prov: string,
): Array<{ tahun: number; nilai: number }> {
  const daftar = data.perProvinsi.get(prov) ?? [];
  return data.meta.tahun.map((tahun, i) => ({
    tahun,
    nilai: daftar.reduce((jumlah, w) => jumlah + (w.nilai[i] ?? 0), 0),
  }));
}

/**
 * Dampak seluruh kabupaten/kota di satu provinsi, per tahun.
 * Bernilai null kalau tidak ada satu kabupaten pun yang melaporkan tahun itu,
 * supaya nol dan tidak tercatat tetap berbeda.
 */
export function dampakProvinsi(
  data: DataLentera,
  prov: string,
  ukuran: string,
): Array<{ tahun: number; nilai: number | null }> {
  const daftar = data.perProvinsi.get(prov) ?? [];
  const iUkuran = data.dampak.ukuran.indexOf(ukuran);
  if (iUkuran < 0) return [];
  return data.dampak.tahun.map((tahun, i) => {
    let jumlah = 0;
    let ada = false;
    for (const w of daftar) {
      const v = data.dampak.wilayah[w.kode]?.[i]?.[iUkuran];
      if (v !== undefined && v >= 0) {
        jumlah += v;
        ada = true;
      }
    }
    return { tahun, nilai: ada ? jumlah : null };
  });
}
/**
 * Ambang warna dihitung dari data yang sedang tampil, bukan ditentukan
 * sendiri, supaya legenda selalu sesuai sebaran sebenarnya.
 */
export function hitungAmbang(nilai: number[]): number[] {
  const urut = nilai.filter((n) => n > 0).sort((a, b) => a - b);
  if (urut.length === 0) return [1, 2, 3, 4, 5];
  const kuantil = (p: number) => urut[Math.min(urut.length - 1, Math.floor(p * urut.length))];
  // Banyak nilai yang sama membuat beberapa kuantil bertumpuk. Ambang yang
  // kembar dibuang supaya legenda tidak menampilkan rentang palsu.
  const mentah = [0.16, 0.33, 0.5, 0.66, 0.83].map(kuantil);
  const unik = [...new Set(mentah)].filter((n) => n > 0).sort((a, b) => a - b);
  return unik.length > 0 ? unik : [1];
}

/**
 * Skala peta dari design system. Indeks 0 adalah kelas nol kejadian,
 * indeks berikutnya adalah kelas bertingkat.
 */
export const WARNA_KELAS = [
  "#e4e1d4",
  "#dbdfd2",
  "#c9d8cb",
  "#a8c8b1",
  "#7db095",
  "#226a52",
];
/** Wilayah tanpa catatan digambar dengan pola garis miring, bukan warna. */
export const WARNA_TANPA_CATATAN = "#ede9dc";
export const KELAS_TANPA_CATATAN = "tanpa-catatan";
/** Warna negara tetangga, dibedakan agar tidak tertukar dengan Indonesia. */
export const WARNA_LUAR = "#d9d2c1";

export function warnaUntuk(nilai: number, ambang: number[]): string {
  if (nilai <= 0) return WARNA_KELAS[0];
  let kelas = 0;
  for (let i = 0; i < ambang.length; i++) {
    if (nilai > ambang[i]) kelas = i + 1;
  }
  return WARNA_KELAS[Math.min(kelas, WARNA_KELAS.length - 1)];
}

/** Format angka dengan pemisah ribuan gaya Indonesia. */
export function fmt(n: number): string {
  return n.toLocaleString("id-ID");
}
