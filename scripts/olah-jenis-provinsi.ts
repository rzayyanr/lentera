/**
 * Menyusun sebaran jenis bencana per provinsi dari data kejadian per tanggal.
 *
 * Sumbernya hanya `public/data/kejadian-jatim.json`, karena baru Jawa Timur
 * yang menerbitkan log kejadian per tanggal. Provinsi lain tidak muncul di
 * berkas keluaran, dan antarmuka menampilkan alasannya.
 *
 * Jalankan: npm run jenis:provinsi
 */

import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const AKAR = process.cwd();
const MASUK = join(AKAR, "public", "data", "kejadian-jatim.json");
const KELUAR = join(AKAR, "public", "data", "jenis-provinsi.json");

const KODE_JATIM = "35";

interface DataKejadian {
  kolom: string[];
  jenis: string[];
  kabupaten: string[];
  kejadian: Array<Array<string | number>>;
}

interface KeluaranJenis {
  jenis: string;
  total: number;
  perTahun: Record<string, number>;
  perKabupaten: Record<string, number>;
}

async function main() {
  const data = (await JSON.parse(await readFile(MASUK, "utf8"))) as DataKejadian;

  const iTanggal = data.kolom.indexOf("tanggal");
  const iJenis = data.kolom.indexOf("jenis");
  const iKab = data.kolom.indexOf("kabupaten");
  if (iTanggal < 0 || iJenis < 0 || iKab < 0) {
    throw new Error("Kolom tanggal, jenis, atau kabupaten tidak ditemukan");
  }

  const perJenis = new Map<string, KeluaranJenis>();
  const tahun = new Set<number>();

  for (const baris of data.kejadian) {
    const namaJenis = data.jenis[Number(baris[iJenis])];
    if (!namaJenis) continue;
    const th = Number(String(baris[iTanggal]).slice(0, 4));
    const namaKab = data.kabupaten[Number(baris[iKab])] ?? "Tidak diketahui";

    tahun.add(th);
    let catatan = perJenis.get(namaJenis);
    if (!catatan) {
      catatan = { jenis: namaJenis, total: 0, perTahun: {}, perKabupaten: {} };
      perJenis.set(namaJenis, catatan);
    }
    catatan.total += 1;
    catatan.perTahun[th] = (catatan.perTahun[th] ?? 0) + 1;
    catatan.perKabupaten[namaKab] = (catatan.perKabupaten[namaKab] ?? 0) + 1;
  }

  const daftarJenis = [...perJenis.values()].sort((a, b) => b.total - a.total);
  const daftarTahun = [...tahun].sort((a, b) => a - b);

  const keluaran = {
    provinsi: {
      [KODE_JATIM]: {
        sumber: "SMARTPB BPBD Provinsi Jawa Timur",
        url: "https://smartpb.bpbd.jatimprov.go.id/public/v_disasterlogs_print.php",
        periode: [daftarTahun[0], daftarTahun[daftarTahun.length - 1]],
        jumlahKejadian: data.kejadian.length,
        tahun: daftarTahun,
        jenis: daftarJenis,
      },
    },
    catatan: [
      "Hanya provinsi yang menerbitkan log kejadian per tanggal yang bisa dihitung per jenis. Sekarang baru Jawa Timur.",
      "BNPB menerbitkan sebaran jenis tingkat nasional, bukan per provinsi. Angka nasional itu ada di public/data/jenis-bencana.json.",
      "Angka per jenis di sini menghitung laporan per desa, jadi lebih besar dari jumlah kejadian versi BNPB.",
    ],
  };

  await writeFile(KELUAR, `${JSON.stringify(keluaran, null, 2)}\n`, "utf8");

  const jatim = keluaran.provinsi[KODE_JATIM];
  console.log(`Tersimpan: ${KELUAR}`);
  console.log(`Jenis: ${daftarJenis.length}, tahun: ${daftarTahun.join(", ")}`);
  console.log(`Total: ${jatim.jumlahKejadian.toLocaleString("id-ID")} kejadian`);
  console.log("Tiga teratas:", daftarJenis.slice(0, 3).map((j) => `${j.jenis} ${j.total}`).join(", "));
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
