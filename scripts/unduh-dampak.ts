/**
 * Mengunduh data dampak bencana per kabupaten dari folder Google Drive BNPB.
 *
 * Sumbernya dataset "Jumlah kejadian dan Dampak Bencana Tahun <tahun>" di
 * portal data.bnpb.go.id. Tiap dataset menautkan satu folder Google Drive
 * berisi 38 berkas Excel, satu per provinsi.
 *
 * Jalankan: npm run dampak:unduh
 *
 * Berkas disimpan di .cache/dampak/<tahun>/ dan tidak ikut di-commit.
 * Hasil olahannya yang di-commit, ada di public/data.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const AKAR = process.cwd();
const CACHE = join(AKAR, ".cache", "dampak");
const PETA_FOLDER = join(AKAR, "data", "folder-dampak.json");

const TAHUN_AWAL = 2002;
const TAHUN_AKHIR = 2023;
const JEDA_MS = 250;
const UA = "Lentera-pipeline/1.0 (proyek MIA 2026)";

interface PetaFolder {
  [tahun: string]: { folderId: string; url: string };
}

const tidur = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function ada(jalur: string): Promise<boolean> {
  try {
    const isi = await readFile(jalur);
    return isi.length > 5000 && isi[0] === 0x50 && isi[1] === 0x4b; // "PK" tanda xlsx
  } catch {
    return false;
  }
}

async function ambilTeks(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} untuk ${url}`);
  return res.text();
}

/** Susun peta tahun ke folder Google Drive, sekali saja lalu disimpan. */
async function siapkanPetaFolder(): Promise<PetaFolder> {
  try {
    return JSON.parse(await readFile(PETA_FOLDER, "utf8")) as PetaFolder;
  } catch {
    // belum ada, dibuat di bawah
  }

  const peta: PetaFolder = {};
  for (let th = TAHUN_AWAL; th <= TAHUN_AKHIR; th++) {
    const url =
      "https://data.bnpb.go.id/api/3/action/package_show" +
      `?id=jumlah-kejadian-dan-dampak-bencana-tahun-${th}`;
    try {
      const json = JSON.parse(await ambilTeks(url)) as {
        success: boolean;
        result: { resources: Array<{ url?: string }> };
      };
      if (!json.success) continue;
      for (const r of json.result.resources) {
        const m = /\/folders\/([A-Za-z0-9_-]+)/.exec(r.url ?? "");
        if (m) {
          peta[String(th)] = { folderId: m[1], url: r.url ?? "" };
          break;
        }
      }
    } catch (e) {
      console.warn(`  ${th}: gagal membaca dataset (${(e as Error).message})`);
    }
    await tidur(JEDA_MS);
  }

  await writeFile(PETA_FOLDER, JSON.stringify(peta, null, 2), "utf8");
  console.log(`Peta folder disimpan: ${Object.keys(peta).length} tahun`);
  return peta;
}

/** Daftar berkas dalam satu folder publik Google Drive. */
async function daftarBerkas(folderId: string): Promise<Map<string, string>> {
  const html = await ambilTeks(
    `https://drive.google.com/embeddedfolderview?id=${folderId}`,
  );
  const hasil = new Map<string, string>();
  const pola =
    /file\/d\/([A-Za-z0-9_-]+)\/view[^"]*"[\s\S]{0,900}?flip-entry-title">([^<]+)<\/div>/g;
  let m: RegExpExecArray | null;
  while ((m = pola.exec(html)) !== null) {
    hasil.set(m[2].trim(), m[1]);
  }
  return hasil;
}

async function unduh(fid: string, jalur: string): Promise<boolean> {
  if (await ada(jalur)) return true;
  for (let coba = 0; coba < 3; coba++) {
    try {
      const res = await fetch(
        `https://drive.usercontent.google.com/download?id=${fid}&export=download&confirm=t`,
        { headers: { "User-Agent": UA } },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 5000 || buf[0] !== 0x50) throw new Error("bukan berkas xlsx");
      await writeFile(jalur, buf);
      return true;
    } catch (e) {
      if (coba === 2) {
        console.warn(`    gagal: ${(e as Error).message}`);
        return false;
      }
      await tidur(1500 * (coba + 1));
    }
  }
  return false;
}

async function utama() {
  console.log("Unduh data dampak BNPB\n");

  const peta = await siapkanPetaFolder();
  const tahunTersedia = Object.keys(peta).map(Number).sort((a, b) => a - b);
  console.log(`Tahun tersedia: ${tahunTersedia[0]} sampai ${tahunTersedia.at(-1)}`);
  await mkdir(CACHE, { recursive: true });

  let total = 0;
  let sukses = 0;
  const gagal: string[] = [];

  for (const th of tahunTersedia) {
    const dir = join(CACHE, String(th));
    await mkdir(dir, { recursive: true });

    let berkas: Map<string, string>;
    try {
      berkas = await daftarBerkas(peta[String(th)].folderId);
    } catch (e) {
      console.warn(`${th}: daftar berkas gagal (${(e as Error).message})`);
      continue;
    }

    let n = 0;
    for (const [nama, fid] of berkas) {
      total++;
      if (await unduh(fid, join(dir, nama))) sukses++;
      else gagal.push(`${th}/${nama}`);
      n++;
      if (n % 10 === 0) process.stdout.write(`  ${th}: ${n}/${berkas.size}\r`);
      await tidur(JEDA_MS);
    }
    console.log(`${th}: ${n} berkas, total sampai sekarang ${sukses}/${total}`);
  }

  console.log(`\nSelesai. ${sukses} dari ${total} berkas berhasil.`);
  if (gagal.length) {
    console.log(`Gagal (${gagal.length}):`);
    for (const g of gagal.slice(0, 20)) console.log("  ", g);
    process.exitCode = 1;
  }
}

utama().catch((e) => {
  console.error("Unduhan gagal:", e instanceof Error ? e.message : e);
  process.exit(1);
});
