/**
 * Mengolah riwayat kejadian Jawa Timur menjadi satu berkas JSON ringkas.
 *
 * Masukan: .cache/kejadian/<tahun>.html dari halaman cetak SMARTPB.
 * Keluaran: public/data/kejadian-jatim.json
 *
 * Jalankan: npm run kejadian:olah
 *
 * Catatan privasi: kolom lokasi pada sumber memuat alamat jalan lengkap.
 * Aturan produk melarang menampilkan alamat lengkap, jadi yang diambil hanya
 * nama kecamatan dan kelurahan atau desa. Sisanya dibuang sebelum disimpan.
 */

import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const AKAR = process.cwd();
const CACHE = join(AKAR, ".cache", "kejadian");
const KELUARAN = join(AKAR, "public", "data", "kejadian-jatim.json");

const PANJANG_AREA = 60;

/** Urutan kolom pada larik kejadian. */
const KOLOM = [
  "id",
  "tanggal",
  "jenis",
  "kabupaten",
  "wilayah", // kecamatan dan kelurahan saja, tanpa alamat jalan
  "meninggal",
  "hilang",
  "lukaBerat",
  "lukaRingan",
  "status",
  "tingkat",
] as const;

function bersih(teks: string): string {
  return teks
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function angka(teks: string): number {
  const n = Number(String(teks).replace(/[^0-9-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/** "31/12/2024 22.00.00" menjadi "2024-12-31". */
function tanggal(teks: string): string {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(teks.trim());
  return m ? `${m[3]}-${m[2]}-${m[1]}` : "";
}

/**
 * Ambil hanya kecamatan dan kelurahan atau desa dari kolom lokasi.
 *
 * Kolom lokasi pada sumber sering memuat alamat jalan lengkap, keterangan
 * patokan, nomor rumah, dan penanda rukun tetangga. Aturan produk melarang
 * menampilkan alamat lengkap, jadi setiap potongan dipotong pada penanda
 * pertama yang ditemukan, lalu hanya potongan yang benar-benar berupa nama
 * kecamatan atau kelurahan yang diambil. Nama juga dibatasi empat kata supaya
 * keterangan panjang tidak ikut terbawa.
 */
function wilayah(area: string): string {
  if (!area) return "";

  const dasar = area
    .replace(/&nbsp;?/gi, " ")
    .replace(/&[a-z]{0,6}\.{0,3}$/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  const potongan = dasar.split(/\s*[|,;]\s*|\s+-\s+|-(?=\S)/);
  const bagian: string[] = [];
  // Penanda dicari di mana saja, karena pada sumber sering menempel tanpa
  // spasi, misalnya "PurworejoJl. Perum" atau "selopanggung RT04".
  const penanda =
    /(?:RT|RW|Jl\.?|Jalan|Gg\.?|Gang|No\.?|Blok|Dsn\.?|Dusun|Km\.?|Depan|Belakang|Samping|Kantor|Gedung|Pasar|Jembatan|Sekitar|Area|Lokasi|Patok|Perum|Perumahan|Griya|Vila|Cluster)(?![A-Za-z])/i;

  for (const mentah of potongan) {
    let s = mentah.trim();
    s = s.split(penanda)[0];
    s = s.split(/\s+\d/)[0];
    s = s.split("(")[0];
    s = s.split(")")[0];
    // Buang sisa tanda dan simbol yang bukan huruf atau angka.
    s = s.replace(/[^\p{L}\p{N}\s.'/-]/gu, " ").replace(/[-\s:.]+$/, "").trim();
    if (!s) continue;

    const m = /^(Kec(?:amatan)?\.?|Kel(?:urahan)?\.?|Ds\.?|Desa)\s+(.+)$/i.exec(s);
    if (!m) continue;

    const nama = m[2].trim().split(/\s+/).slice(0, 4).join(" ").replace(/[-\s:.]+$/, "");
    if (!nama) continue;

    const label = /^Kec/i.test(m[1]) ? "Kec." : "Kel./Ds.";
    bagian.push(`${label} ${nama}`);
  }

  const unik = [...new Set(bagian)];
  if (unik.length === 0) return "";

  // Potong pada batas koma, bukan di tengah nama.
  let hasil = unik.join(", ");
  if (hasil.length > PANJANG_AREA) {
    const koma = hasil.lastIndexOf(",", PANJANG_AREA);
    hasil = koma > 0 ? hasil.slice(0, koma) : hasil.slice(0, PANJANG_AREA);
  }
  return hasil;
}

async function utama() {
  console.log("Olah riwayat kejadian Jawa Timur\n");

  let berkas: string[];
  try {
    berkas = (await readdir(CACHE)).filter((f) => f.endsWith(".html")).sort();
  } catch {
    console.error("Belum ada data di .cache/kejadian. Jalankan npm run kejadian:unduh dahulu.");
    process.exit(1);
  }
  if (berkas.length === 0) {
    console.error("Folder .cache/kejadian kosong.");
    process.exit(1);
  }

  const pola = /<td[^>]*data-record-id="(\d+)"[^>]*data-field="([a-z_]+)"[^>]*>\s*<span[^>]*>(.*?)<\/span>\s*<\/td>/gs;

  const jenisDaftar: string[] = [];
  const kabDaftar: string[] = [];
  const statusDaftar: string[] = [];
  const tingkatDaftar: string[] = [];
  const kejadian: Array<Array<string | number>> = [];
  const laporan: Array<{ tahun: number; jumlah: number }> = [];

  const indeks = (daftar: string[], nilai: string) => {
    let i = daftar.indexOf(nilai);
    if (i === -1) {
      daftar.push(nilai);
      i = daftar.length - 1;
    }
    return i;
  };

  for (const nama of berkas) {
    const th = Number(nama.replace(".html", ""));
    const html = await readFile(join(CACHE, nama), "utf8");

    const kumpulan = new Map<string, Record<string, string>>();
    for (const m of html.matchAll(pola)) {
      const rid = m[1];
      const field = m[2];
      const isi = bersih(m[3]);
      const rec = kumpulan.get(rid) ?? {};
      rec[field] = isi;
      kumpulan.set(rid, rec);
    }

    let jumlah = 0;
    for (const rec of kumpulan.values()) {
      const tgl = tanggal(rec.eventdate ?? "");
      const jenis = rec.disastertype ?? "";
      const kab = rec.regency_city ?? "";
      if (!tgl || !jenis) continue;

      kejadian.push([
        rec.id_logs ?? "",
        tgl,
        indeks(jenisDaftar, jenis),
        indeks(kabDaftar, kab),
        wilayah(rec.area ?? ""),
        angka(rec.dead ?? "0"),
        angka(rec.missing ?? "0"),
        angka(rec.serious_wound ?? "0"),
        angka(rec.minor_injuries ?? "0"),
        indeks(statusDaftar, rec.status ?? ""),
        indeks(tingkatDaftar, rec.level ?? ""),
      ]);
      jumlah++;
    }
    laporan.push({ tahun: th, jumlah });
    console.log(`  ${th}: ${kumpulan.size} catatan dibaca, ${jumlah} dipakai`);
  }

  // Urutkan dari yang terbaru, supaya tampilan daftar tidak perlu mengurutkan.
  kejadian.sort((a, b) => String(b[1]).localeCompare(String(a[1])));

  const keluaran = {
    kolom: [...KOLOM],
    jenis: jenisDaftar,
    kabupaten: kabDaftar,
    status: statusDaftar,
    tingkat: tingkatDaftar,
    kejadian,
    catatan: [
      "Sumber: SMARTPB, BPBD Provinsi Jawa Timur.",
      "Kolom lokasi hanya memuat kecamatan dan kelurahan atau desa. Alamat jalan dibuang sesuai aturan privasi.",
      "Kronologi, respon, kerusakan, dan kerugian tidak disertakan karena besar. Tautan ke catatan aslinya disediakan.",
    ],
  };

  await writeFile(KELUARAN, JSON.stringify(keluaran), "utf8");

  const total = kejadian.length;
  const bytes = JSON.stringify(keluaran).length;
  console.log(`\nTotal kejadian: ${total}`);
  console.log(`Jenis bencana: ${jenisDaftar.length} | Kabupaten/kota: ${kabDaftar.length}`);
  console.log(`Ukuran berkas: ${(bytes / 1024).toFixed(0)} KB`);
  console.log(`Rentang: ${kejadian.at(-1)?.[1]} sampai ${kejadian[0]?.[1]}`);
}

utama().catch((e) => {
  console.error("Gagal mengolah:", e instanceof Error ? e.message : e);
  process.exit(1);
});
