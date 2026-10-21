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
  perKode: Map<string, Wilayah>;
  perProvinsi: Map<string, Wilayah[]>;
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

  const perKode = new Map(wilayah.map((w) => [w.kode, w]));
  const perProvinsi = new Map<string, Wilayah[]>();
  for (const w of wilayah) {
    const daftar = perProvinsi.get(w.prov) ?? [];
    daftar.push(w);
    perProvinsi.set(w.prov, daftar);
  }

  return { meta, wilayah, provinsi, dampak, perKode, perProvinsi };
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
 * Ambang warna dihitung dari data yang sedang tampil, bukan ditentukan
 * sendiri, supaya legenda selalu sesuai sebaran sebenarnya.
 */
export function hitungAmbang(nilai: number[]): number[] {
  const urut = nilai.filter((n) => n > 0).sort((a, b) => a - b);
  if (urut.length === 0) return [1, 2, 3, 4];
  const kuantil = (p: number) => urut[Math.min(urut.length - 1, Math.floor(p * urut.length))];
  // Banyak nilai yang sama membuat beberapa kuantil bertumpuk. Ambang yang
  // kembar dibuang supaya legenda tidak menampilkan rentang palsu.
  const mentah = [kuantil(0.2), kuantil(0.4), kuantil(0.6), kuantil(0.8)];
  const unik = [...new Set(mentah)].filter((n) => n > 0).sort((a, b) => a - b);
  return unik.length > 0 ? unik : [1];
}

export const WARNA_KELAS = ["#e8f4f8", "#b8e2ec", "#7fc9dc", "#3fa5c4", "#1b7a9c"];
export const WARNA_NOL = "#f1f5f9";
export const WARNA_TANPA_CATATAN = "#cbd5e1";

export function warnaUntuk(nilai: number, ambang: number[]): string {
  if (nilai <= 0) return WARNA_NOL;
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
