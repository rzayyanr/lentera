/**
 * Memeriksa hasil olah data dampak sebelum dipakai di aplikasi.
 *
 * Jalankan: npm run dampak:verifikasi
 *
 * Skrip ini tidak mengubah apa pun. Tujuannya menolak data yang belum layak
 * tampil, misalnya tahun yang kosong atau angka yang tidak masuk akal.
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";

const AKAR = process.cwd();
const JALUR = join(AKAR, "public", "data", "dampak.json");

interface Dampak {
  tahun: number[];
  ukuran: string[];
  wilayah: Record<string, number[][]>;
  catatan: string[];
}

const gagal: string[] = [];
const periksa = (syarat: boolean, pesan: string) => {
  if (!syarat) gagal.push(pesan);
};

async function utama() {
  const data = JSON.parse(await readFile(JALUR, "utf8")) as Dampak;

  console.log("Verifikasi data dampak\n");
  console.log(`  tahun          : ${data.tahun[0]} sampai ${data.tahun.at(-1)} (${data.tahun.length} tahun)`);
  console.log(`  ukuran         : ${data.ukuran.length}`);
  console.log(`  wilayah        : ${Object.keys(data.wilayah).length}`);

  periksa(data.tahun.length === 22, `jumlah tahun ${data.tahun.length}, seharusnya 22`);
  periksa(data.ukuran.length === 14, `jumlah ukuran ${data.ukuran.length}, seharusnya 14`);
  periksa(
    Object.keys(data.wilayah).length >= 450,
    `wilayah hanya ${Object.keys(data.wilayah).length}, terlalu sedikit`,
  );

  // Tiap tahun harus punya jumlah kejadian yang wajar.
  const iKejadian = data.ukuran.indexOf("kejadian");
  console.log("\n  kejadian per tahun:");
  for (let i = 0; i < data.tahun.length; i++) {
    let total = 0;
    let kab = 0;
    for (const rekaman of Object.values(data.wilayah)) {
      const v = rekaman[i]?.[iKejadian];
      if (v !== undefined && v >= 0) {
        total += v;
        kab++;
      }
    }
    const tandai = total === 0 ? "  <-- KOSONG" : "";
    console.log(`    ${data.tahun[i]}: ${String(total).padStart(6)} kejadian, ${String(kab).padStart(3)} wilayah${tandai}`);
    periksa(total > 0, `tahun ${data.tahun[i]} tidak punya kejadian sama sekali`);
  }

  // Angka pembanding yang sudah dihitung manual dari berkas mentah.
  const i2023 = data.tahun.indexOf(2023);
  if (i2023 >= 0) {
    const total2023 = Object.values(data.wilayah).reduce((n, rekaman) => {
      const v = rekaman[i2023]?.[iKejadian];
      return n + (v !== undefined && v >= 0 ? v : 0);
    }, 0);
    console.log(`\n  2023 hasil olah: ${total2023}, pembanding manual: 5388`);
    periksa(total2023 === 5388, `total 2023 ${total2023}, seharusnya 5388`);
  }

  // Tidak boleh ada angka negatif selain -1, dan tidak boleh ada nilai ekstrem.
  let negatifAneh = 0;
  let ekstrem = 0;
  for (const [kode, rekaman] of Object.entries(data.wilayah)) {
    periksa(rekaman.length === data.tahun.length, `${kode}: jumlah tahun tidak sesuai`);
    for (const baris of rekaman) {
      periksa(baris.length === data.ukuran.length, `${kode}: jumlah ukuran tidak sesuai`);
      for (const v of baris) {
        if (v < -1) negatifAneh++;
        if (v > 5_000_000) ekstrem++;
      }
    }
  }
  periksa(negatifAneh === 0, `ada ${negatifAneh} angka di bawah -1`);
  periksa(ekstrem === 0, `ada ${ekstrem} angka di atas 5 juta`);

  console.log("");
  if (gagal.length === 0) {
    console.log("Semua pemeriksaan lolos.");
  } else {
    console.log(`GAGAL, ${gagal.length} masalah:`);
    for (const g of gagal.slice(0, 20)) console.log("  -", g);
    process.exitCode = 1;
  }
}

utama().catch((e) => {
  console.error("Tidak bisa memeriksa:", e instanceof Error ? e.message : e);
  process.exit(1);
});
