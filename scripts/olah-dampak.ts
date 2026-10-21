/**
 * Mengolah berkas Excel dampak bencana menjadi satu berkas JSON.
 *
 * Masukan: .cache/dampak/<tahun>/stat_by_wil_<kode provinsi>_<tahun>.xlsx
 * Keluaran: public/data/dampak.json
 *
 * Jalankan: npm run dampak:olah
 */

import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { unzipSync } from "fflate";
import { XMLParser } from "fast-xml-parser";

const AKAR = process.cwd();
const CACHE = join(AKAR, ".cache", "dampak");
const KELUARAN = join(AKAR, "public", "data", "dampak.json");

/**
 * Urutan ukuran sesuai kolom di berkas BNPB.
 * Nilai -1 berarti wilayah tidak tercatat pada tahun itu, berbeda dari 0
 * yang berarti tercatat dan memang nol.
 */
const UKURAN = [
  "kejadian",
  "meninggal",
  "hilang",
  "luka",
  "menderita",
  "mengungsi",
  "rumahRusakBerat",
  "rumahRusakSedang",
  "rumahRusakRingan",
  "terendam",
  "fasPendidikan",
  "fasKesehatan",
  "fasPeribadatan",
  "fasUmum",
] as const;

const KOLOM = ["C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P"];

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  isArray: (nama) => ["row", "c", "si", "r", "t"].includes(nama),
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: true,
});

type Simpul = string | number | Record<string, unknown> | Simpul[] | null | undefined;

/** Ambil teks dari simpul XML hasil parse, termasuk teks berjalan. */
function teks(simpul: Simpul): string {
  if (simpul === null || simpul === undefined) return "";
  if (typeof simpul === "string") return simpul;
  if (typeof simpul === "number") return String(simpul);
  if (Array.isArray(simpul)) return simpul.map(teks).join("");
  const obj = simpul as Record<string, unknown>;
  if ("#text" in obj) return String(obj["#text"]);
  return Object.entries(obj)
    .filter(([k]) => !k.startsWith("@_"))
    .map(([, v]) => teks(v as Simpul))
    .join("");
}

/** Baca satu berkas xlsx menjadi daftar baris berisi peta kolom ke nilai. */
async function bacaXlsx(jalur: string): Promise<Array<Record<string, string>>> {
  const buf = await readFile(jalur);
  const isi = unzipSync(new Uint8Array(buf));

  let daftarTeks: string[] = [];
  const berkasTeks = isi["xl/sharedStrings.xml"];
  if (berkasTeks) {
    const akar = parser.parse(Buffer.from(berkasTeks).toString("utf8")) as Record<string, unknown>;
    const sst = akar["sst"] as Record<string, unknown> | undefined;
    const si = (sst?.["si"] ?? []) as Simpul[];
    daftarTeks = si.map((s) => teks(s));
  }

  const berkasSheet = isi["xl/worksheets/sheet1.xml"];
  if (!berkasSheet) throw new Error(`Tidak ada sheet1 di ${jalur}`);
  const akarSheet = parser.parse(Buffer.from(berkasSheet).toString("utf8")) as Record<string, unknown>;
  const worksheet = akarSheet["worksheet"] as Record<string, unknown> | undefined;
  const sheetData = worksheet?.["sheetData"] as Record<string, unknown> | undefined;
  const baris = (sheetData?.["row"] ?? []) as Simpul[];

  const keluaran: Array<Record<string, string>> = [];

  for (const r of baris) {
    const barisObj = r as Record<string, unknown>;
    const sel = (barisObj["c"] ?? []) as Simpul[];
    const nilai: Record<string, string> = {};
    for (const s of sel) {
      const c = s as Record<string, unknown>;
      const ref = String(c["@_r"] ?? "");
      const tipe = String(c["@_t"] ?? "");
      const kol = /^[A-Z]+/.exec(ref)?.[0];
      if (!kol) continue;
      const v = c["v"];
      if (tipe === "s" && v !== undefined) {
        nilai[kol] = daftarTeks[Number(teks(v as Simpul))] ?? "";
      } else if (tipe === "inlineStr") {
        nilai[kol] = teks(c["is"] as Simpul);
      } else if (v !== undefined) {
        nilai[kol] = teks(v as Simpul);
      }
    }
    keluaran.push(nilai);
  }
  return keluaran;
}

/** "22,756" menjadi 22756. Koma dan titik dipakai sebagai pemisah ribuan. */
function angka(mentah: string | undefined): number {
  if (!mentah) return -1;
  const bersih = mentah.trim().replace(/[,.]/g, "");
  if (bersih === "" || bersih === "-") return -1;
  const n = Number(bersih);
  return Number.isFinite(n) ? n : -1;
}

async function subfolder(dir: string): Promise<string[]> {
  try {
    const isi = await readdir(dir, { withFileTypes: true });
    return isi.filter((e) => e.isDirectory()).map((e) => e.name).sort();
  } catch {
    return [];
  }
}

async function utama() {
  console.log("Olah data dampak\n");

  const tahunDaftar = (await subfolder(CACHE)).filter((t) => /^\d{4}$/.test(t));
  if (tahunDaftar.length === 0) {
    console.error("Belum ada data di .cache/dampak. Jalankan npm run dampak:unduh dahulu.");
    process.exit(1);
  }
  const tahun = tahunDaftar.map(Number);

  // wilayah[kode] = larik per tahun, tiap tahun berisi 14 angka
  const wilayah = new Map<string, number[][]>();
  const laporan: Array<{ tahun: number; kabupaten: number; kejadian: number; berkas: number }> = [];

  for (const th of tahunDaftar) {
    const dir = join(CACHE, th);
    const berkas = (await readdir(dir)).filter((f) => f.endsWith(".xlsx")).sort();
    let kab = 0;
    let total = 0;

    for (const nama of berkas) {
      let baris: Array<Record<string, string>>;
      try {
        baris = await bacaXlsx(join(dir, nama));
      } catch (e) {
        console.warn(`  lewati ${th}/${nama}: ${(e as Error).message}`);
        continue;
      }

      for (const r of baris) {
        const wil = (r["B"] ?? "").trim();
        const cocok = /^(\d{4})\./.exec(wil);
        if (!cocok) continue;
        const kode = cocok[1];
        const nilai = KOLOM.map((k) => angka(r[k]));

        let perTahun = wilayah.get(kode);
        if (!perTahun) {
          perTahun = tahun.map(() => new Array(UKURAN.length).fill(-1));
          wilayah.set(kode, perTahun);
        }
        perTahun[tahun.indexOf(Number(th))] = nilai;
        kab++;
        total += Math.max(0, nilai[0]);
      }
    }
    laporan.push({ tahun: Number(th), kabupaten: kab, kejadian: total, berkas: berkas.length });
    console.log(`  ${th}: ${berkas.length} berkas, ${kab} baris, ${total} kejadian`);
  }

  const keluaran = {
    tahun,
    ukuran: [...UKURAN],
    /** kode BPS menjadi kunci, nilai -1 berarti tidak tercatat. */
    wilayah: Object.fromEntries(
      [...wilayah.entries()].sort((a, b) => a[0].localeCompare(b[0])),
    ),
    catatan: [
      "Nilai -1 berarti wilayah tidak tercatat pada tahun itu, bukan nol.",
      "Berkas per wilayah tidak selalu memuat seluruh kabupaten, jadi cakupan tiap tahun berbeda.",
      "Angka pada tabel ini bisa berbeda dari tabel agregat BNPB untuk tahun yang sama.",
    ],
  };

  await writeFile(KELUARAN, JSON.stringify(keluaran), "utf8");

  const contoh = laporan.find((l) => l.tahun === 2023);
  console.log(`\nWilayah terkumpul: ${wilayah.size}`);
  console.log(`Tahun: ${tahun[0]} sampai ${tahun.at(-1)}`);
  if (contoh) console.log(`Pembanding 2023: ${contoh.kejadian} kejadian (uji manual sebelumnya 5388)`);
  console.log(`Ditulis: ${KELUARAN}`);
}

utama().catch((e) => {
  console.error("Gagal mengolah:", e instanceof Error ? e.message : e);
  process.exit(1);
});
