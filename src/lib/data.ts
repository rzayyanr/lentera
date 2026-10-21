/** Tipe data yang dipakai bersama oleh aplikasi. */

export interface Wilayah {
  /** Kode BPS, kunci utama. */
  kode: string;
  /** Nama menurut BNPB, dipakai apa adanya agar bisa ditelusuri ke sumber. */
  nama: string;
  /** Kode provinsi, dua digit pertama kode BPS. */
  prov: string;
  lat: number;
  lon: number;
  /** Jumlah kejadian per tahun, urut sesuai Meta.tahun. */
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

export interface DataLentera {
  meta: Meta;
  wilayah: Wilayah[];
  provinsi: Provinsi[];
  /** Indeks wilayah per kode, untuk pencarian cepat. */
  perKode: Map<string, Wilayah>;
  /** Daftar kabupaten/kota per kode provinsi. */
  perProvinsi: Map<string, Wilayah[]>;
}

/** Ambil berkas JSON dengan pesan galat yang jelas kalau gagal. */
async function ambil<T>(jalur: string): Promise<T> {
  const res = await fetch(jalur);
  if (!res.ok) throw new Error(`Gagal memuat ${jalur}: HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export async function muatData(): Promise<DataLentera> {
  const [meta, wilayah, provinsi] = await Promise.all([
    ambil<Meta>("/data/meta.json"),
    ambil<Wilayah[]>("/data/wilayah.json"),
    ambil<Provinsi[]>("/data/provinsi.json"),
  ]);

  const perKode = new Map(wilayah.map((w) => [w.kode, w]));
  const perProvinsi = new Map<string, Wilayah[]>();
  for (const w of wilayah) {
    const daftar = perProvinsi.get(w.prov) ?? [];
    daftar.push(w);
    perProvinsi.set(w.prov, daftar);
  }

  return {
    meta,
    wilayah,
    provinsi,
    perKode,
    perProvinsi,
  };
}

/**
 * Ambang warna dihitung dari data, bukan ditentukan sendiri, supaya legenda
 * selalu sesuai sebaran yang sebenarnya.
 */
export function hitungAmbang(nilai: number[]): number[] {
  const urut = [...nilai].filter((n) => n > 0).sort((a, b) => a - b);
  if (urut.length === 0) return [1, 2, 3, 4];
  const kuantil = (p: number) => urut[Math.min(urut.length - 1, Math.floor(p * urut.length))];
  return [kuantil(0.2), kuantil(0.4), kuantil(0.6), kuantil(0.8)];
}

/** Warna per kelas, dari paling terang ke paling gelap. */
export const WARNA_KELAS = ["#e8f4f8", "#b8e2ec", "#7fc9dc", "#3fa5c4", "#1b7a9c"];

export function warnaUntuk(nilai: number, ambang: number[]): string {
  if (nilai <= 0) return "#f1f5f9";
  let kelas = 0;
  for (let i = 0; i < ambang.length; i++) {
    if (nilai > ambang[i]) kelas = i + 1;
  }
  return WARNA_KELAS[Math.min(kelas, WARNA_KELAS.length - 1)];
}
