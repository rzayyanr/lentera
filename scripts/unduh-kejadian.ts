/**
 * Mengunduh riwayat kejadian Jawa Timur dari portal BPBD Jawa Timur.
 *
 * Sumbernya halaman cetak aplikasi SMARTPB. Dengan parameter all=1, halaman itu
 * memuat seluruh catatan sesuai filter, sehingga tidak perlu mengambil halaman
 * satu per satu.
 *
 * Jalankan: npm run kejadian:unduh
 *
 * Berkas mentahnya besar, sekitar 50 MB per tahun, dan disimpan di
 * .cache/kejadian sehingga tidak ikut di-commit.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const AKAR = process.cwd();
const CACHE = join(AKAR, ".cache", "kejadian");

const TAHUN_AWAL = 2020;
const TAHUN_AKHIR = 2025;
const UA = "Lentera-pipeline/1.0 (proyek MIA 2026)";

const DASAR = "https://smartpb.bpbd.jatimprov.go.id/public/v_disasterlogs_print.php";

/** Rentang tanggal yang dipakai portal, sesuai contoh dari dataset BNPB. */
function filterTahun(th: number): string {
  return `q=(eventdate~between~${th}-1-1~date13~${th + 1}-1-1)`;
}

async function sudahAda(jalur: string): Promise<boolean> {
  try {
    const isi = await readFile(jalur);
    return isi.length > 1_000_000;
  } catch {
    return false;
  }
}

async function utama() {
  console.log("Unduh riwayat kejadian Jawa Timur\n");
  await mkdir(CACHE, { recursive: true });

  for (let th = TAHUN_AWAL; th <= TAHUN_AKHIR; th++) {
    const jalur = join(CACHE, `${th}.html`);
    if (await sudahAda(jalur)) {
      console.log(`${th}: sudah ada, dilewati`);
      continue;
    }

    const url = `${DASAR}?${filterTahun(th)}&all=1`;
    const mulai = Date.now();
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const teks = await res.text();
      if (teks.length < 100_000) throw new Error(`balasan terlalu pendek: ${teks.length} byte`);
      await writeFile(jalur, teks, "utf8");
      const detik = ((Date.now() - mulai) / 1000).toFixed(1);
      console.log(`${th}: ${(teks.length / 1048576).toFixed(1)} MB dalam ${detik} detik`);
    } catch (e) {
      console.error(`${th}: gagal, ${(e as Error).message}`);
      process.exitCode = 1;
    }
  }

  console.log("\nSelesai.");
}

utama().catch((e) => {
  console.error("Unduhan gagal:", e instanceof Error ? e.message : e);
  process.exit(1);
});
