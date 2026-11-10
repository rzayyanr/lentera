/**
 * Mengunduh jumlah kejadian menurut jenis bencana, nasional 2010 sampai 2024.
 *
 * Sumbernya dataset "Jumlah Kejadian Bencana Menurut Jenis Bencana Tahun
 * 2010-2024" di portal data BNPB, dibaca lewat API datastore CKAN. Sembilan
 * jenis bencana, satu baris per jenis, satu kolom per tahun.
 *
 * Jalankan: npm run jenis:unduh
 */

import { writeFile } from "node:fs/promises";
import { join } from "node:path";

const AKAR = process.cwd();
const UA = "Lentera-pipeline/1.0 (proyek MIA 2026)";

const RESOURCE = "9b41007e-c998-456b-8cbc-385b17986e46";
const DASAR = "https://data.bnpb.go.id/api/3/action/datastore_search";

interface HasilDatastore {
  success: boolean;
  result: {
    total: number;
    fields: Array<{ id: string }>;
    records: Array<Record<string, string | number>>;
  };
}

/** Kolom tahun datang sebagai "2010.0", bukan "2010". */
function tahunDariKolom(kolom: string): number | null {
  const cocok = /^(\d{4})\.0$/.exec(kolom);
  return cocok ? Number(cocok[1]) : null;
}

async function main() {
  const url = `${DASAR}?resource_id=${RESOURCE}&limit=100`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`Gagal mengambil datastore: HTTP ${res.status}`);

  const isi = (await res.json()) as HasilDatastore;
  if (!isi.success) throw new Error("Datastore menolak permintaan");

  const tahun = [
    ...new Set(
      isi.result.fields
        .map((f) => tahunDariKolom(f.id))
        .filter((t): t is number => t !== null),
    ),
  ].sort((a, b) => a - b);

  const baris = isi.result.records.map((r) => ({
    jenis: String(r["JENIS BENCANA"]).trim(),
    nilai: tahun.map((t) => Number(r[`${t}.0`] ?? 0)),
  }));

  const keluaran = {
    tahun,
    jenis: baris,
    sumber: {
      nama: "Jumlah Kejadian Bencana Menurut Jenis Bencana, BNPB",
      url: "https://data.bnpb.go.id/dataset/data-bencana-indonesia",
      resourceId: RESOURCE,
      diambil: new Date().toISOString().slice(0, 10),
    },
    catatan: [
      "Satu baris per jenis bencana, satu kolom per tahun, seluruh Indonesia.",
      "Angka ini tidak dipecah per kabupaten. Rincian per kabupaten hanya tersedia untuk total semua jenis.",
    ],
  };

  const tujuan = join(AKAR, "public", "data", "jenis-bencana.json");
  await writeFile(tujuan, `${JSON.stringify(keluaran, null, 2)}\n`, "utf8");

  const total2024 = baris.reduce((j, b) => j + (b.nilai[tahun.indexOf(2024)] ?? 0), 0);
  console.log(`Tersimpan: ${tujuan}`);
  console.log(`${baris.length} jenis, ${tahun.length} tahun (${tahun[0]}-${tahun[tahun.length - 1]})`);
  console.log(`Total kejadian 2024 menurut tabel jenis: ${total2024.toLocaleString("id-ID")}`);
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
