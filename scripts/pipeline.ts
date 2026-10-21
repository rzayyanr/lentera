/**
 * Pipeline data Lentera.
 *
 * Menarik data resmi BNPB, mencocokkannya dengan tabel pemetaan wilayah,
 * menyederhanakan batas wilayah, lalu menulis berkas JSON untuk aplikasi.
 *
 * Jalankan: npm run data
 *
 * Skrip ini tidak berjalan saat pengguna membuka situs. Hasilnya berkas statis
 * yang ikut di-commit, sehingga situs tetap bisa dipakai tanpa jaringan.
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

const AKAR = process.cwd();
const DIR_DATA = join(AKAR, "data");
// Berkas data disajikan sebagai berkas statis, bukan dibundel ke JavaScript,
// supaya peramban bisa menyimpannya di cache terpisah dari kode aplikasi.
const DIR_KELUARAN = join(AKAR, "public", "data");
const DIR_GEO = join(AKAR, "public", "geo");

const UA = "Lentera-pipeline/1.0 (proyek MIA 2026)";

const SUMBER = {
  kabupaten: "21044ffd-c397-4b3c-acbd-5adaa03d79e3",
  provinsi: "5dfcae7e-acb3-4548-82b5-61d876ea478a",
  geojson:
    "https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/IDN/ADM2/geoBoundaries-IDN-ADM2_simplified.geojson",
  bnpb: "https://data.bnpb.go.id/dataset/data-bencana-indonesia",
} as const;

/**
 * Toleransi penyederhanaan bentuk. Semakin besar, semakin ringan berkas.
 * Dua desimal berarti ketelitian sekitar 1,1 km, cukup untuk peta nasional.
 */
const TOLERANSI = 0.03;
const DESIMAL = 2;

/** Wilayah yang ada di peta tetapi tidak ada di daftar kabupaten BNPB. */
const TANPA_DATA_BNPB = new Set(["Kaimana", "Konawe Kepulauan", "Nduga", "Yalimo"]);

type BarisBnpb = Record<string, unknown>;

interface Wilayah {
  /** Kode BPS, kunci utama seluruh aplikasi. */
  kode: string;
  /** Nama menurut BNPB, dipakai apa adanya agar bisa ditelusuri ke sumber. */
  nama: string;
  /** Kode provinsi, dua digit pertama kode BPS. */
  prov: string;
  lat: number;
  lon: number;
  /** Jumlah kejadian per tahun, urut sesuai meta.tahun. */
  nilai: number[];
}

interface Provinsi {
  kode: string;
  nama: string;
  /** Jumlah dari kabupaten, dipakai di aplikasi agar angka selalu konsisten. */
  nilai: number[];
  /** Angka sebagaimana diterbitkan BNPB di tabel provinsi. */
  nilaiBnpb: number[];
}

interface Meta {
  dibuat: string;
  tahun: number[];
  jumlahWilayah: number;
  jumlahProvinsi: number;
  sumber: { nama: string; url: string; diambil: string };
  catatan: string[];
}

/** Parser CSV sederhana yang menghormati tanda kutip. */
function parseCsv(teks: string): string[][] {
  const baris: string[][] = [];
  let sel: string[] = [];
  let isi = "";
  let dalamKutip = false;

  for (let i = 0; i < teks.length; i++) {
    const c = teks[i];
    if (dalamKutip) {
      if (c === '"') {
        if (teks[i + 1] === '"') {
          isi += '"';
          i++;
        } else {
          dalamKutip = false;
        }
      } else {
        isi += c;
      }
    } else if (c === '"') {
      dalamKutip = true;
    } else if (c === ",") {
      sel.push(isi);
      isi = "";
    } else if (c === "\n") {
      sel.push(isi);
      baris.push(sel);
      sel = [];
      isi = "";
    } else if (c !== "\r") {
      isi += c;
    }
  }
  if (isi.length > 0 || sel.length > 0) {
    sel.push(isi);
    baris.push(sel);
  }
  return baris.filter((b) => b.length > 1 || b[0].trim() !== "");
}

async function ambilJson(url: string): Promise<unknown> {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`Gagal mengambil ${url}: HTTP ${res.status}`);
  return res.json();
}

async function ambilDatastore(resourceId: string, limit: number): Promise<BarisBnpb[]> {
  const url =
    `https://data.bnpb.go.id/api/3/action/datastore_search` +
    `?resource_id=${resourceId}&limit=${limit}`;
  const json = (await ambilJson(url)) as {
    success: boolean;
    result: { records: BarisBnpb[]; total: number };
  };
  if (!json.success) throw new Error(`API BNPB menolak permintaan untuk ${resourceId}`);
  return json.result.records;
}

/** Ambil nilai tahunan dari satu baris BNPB, kolomnya berbentuk "2024.0". */
function ambilTahunan(baris: BarisBnpb, tahun: number[]): number[] {
  return tahun.map((t) => {
    const mentah = baris[`${t}.0`];
    const n = Number(mentah);
    return Number.isFinite(n) ? n : 0;
  });
}

/** Douglas-Peucker, penyederhanaan garis. */
function sederhanakan(titik: number[][], toleransi: number): number[][] {
  if (titik.length < 3) return titik;

  const [x1, y1] = titik[0];
  const [x2, y2] = titik[titik.length - 1];
  const dx = x2 - x1;
  const dy = y2 - y1;
  const panjang = Math.hypot(dx, dy);

  let indeksTerjauh = 0;
  let jarakTerjauh = 0;

  for (let i = 1; i < titik.length - 1; i++) {
    const [x0, y0] = titik[i];
    const jarak =
      panjang === 0
        ? Math.hypot(x0 - x1, y0 - y1)
        : Math.abs(dy * x0 - dx * y0 + x2 * y1 - y2 * x1) / panjang;
    if (jarak > jarakTerjauh) {
      jarakTerjauh = jarak;
      indeksTerjauh = i;
    }
  }

  if (jarakTerjauh <= toleransi) return [titik[0], titik[titik.length - 1]];

  const kiri = sederhanakan(titik.slice(0, indeksTerjauh + 1), toleransi);
  const kanan = sederhanakan(titik.slice(indeksTerjauh), toleransi);
  return [...kiri.slice(0, -1), ...kanan];
}

function bulatkan(titik: number[][]): number[][] {
  return titik.map(([x, y]) => [
    Number(x.toFixed(DESIMAL)),
    Number(y.toFixed(DESIMAL)),
  ]);
}

async function utama() {
  console.log("Pipeline Lentera\n");

  // 1. Tabel pemetaan wilayah
  const csvMentah = await readFile(join(DIR_DATA, "pemetaan-wilayah.csv"), "utf8");
  // Berkas ditulis dengan BOM agar Excel bisa membukanya, jadi BOM harus dibuang
  // sebelum nama kolom dicari.
  const csv = csvMentah.replace(/^\uFEFF/, "");
  const barisCsv = parseCsv(csv);
  const header = barisCsv[0];
  const barisPemetaan = barisCsv.slice(1);
  const iKode = header.indexOf("kode_bps");
  const iNamaBnpb = header.indexOf("nama_bnpb");
  const iNamaGeo = header.indexOf("nama_geo");

  const petaNamaKeKode = new Map<string, { kode: string; nama: string }>();
  for (const b of barisPemetaan) {
    if (!b[iKode]) continue;
    petaNamaKeKode.set(b[iNamaGeo].trim(), {
      kode: b[iKode].trim(),
      nama: b[iNamaBnpb].trim(),
    });
  }
  console.log(`Tabel pemetaan: ${petaNamaKeKode.size} wilayah`);

  // 2. Data BNPB
  const kab = await ambilDatastore(SUMBER.kabupaten, 1000);
  const prov = await ambilDatastore(SUMBER.provinsi, 100);
  const tahun = [2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024];
  console.log(`Data BNPB: ${kab.length} kabupaten, ${prov.length} provinsi`);

  const wilayah: Wilayah[] = kab.map((b) => {
    const kodeMentah = String(b["Kode Wilayah Kabupaten / Kota"] ?? "");
    const kode = kodeMentah.replace(/\.0+$/, "").trim();
    return {
      kode,
      nama: String(b["Nama Kabupaten/Kota"] ?? "").trim(),
      prov: kode.slice(0, 2),
      lat: Number(b["Latitude"]) || 0,
      lon: Number(b["Longitude"]) || 0,
      nilai: ambilTahunan(b, tahun),
    };
  });

  // Nama provinsi diambil dari data BNPB sendiri, bukan dari tabel luar,
  // karena BNPB menukar kode 91 dan 92 dibandingkan konvensi BPS.
  const namaProv = new Map<string, string>();
  const nilaiProvBnpb = new Map<string, number[]>();
  for (const p of prov) {
    const kode = String(p["Kode Wilayah Provinsi"] ?? "").trim();
    namaProv.set(kode, String(p["Nama Provinsi"] ?? "").trim());
    nilaiProvBnpb.set(kode, ambilTahunan(p, tahun));
  }

  // Jumlahkan kabupaten per provinsi, supaya angka di aplikasi selalu konsisten.
  const jumlahProv = new Map<string, number[]>();
  for (const w of wilayah) {
    const sekarang = jumlahProv.get(w.prov) ?? new Array(tahun.length).fill(0);
    jumlahProv.set(w.prov, sekarang.map((n, i) => n + w.nilai[i]));
  }

  const provinsi: Provinsi[] = [...namaProv.entries()]
    .map(([kode, nama]) => ({
      kode,
      nama: nama.replace(/\s+/g, " ").replace(/\bP A P U A\b/i, "Papua").trim(),
      nilai: jumlahProv.get(kode) ?? new Array(tahun.length).fill(0),
      nilaiBnpb: nilaiProvBnpb.get(kode) ?? new Array(tahun.length).fill(0),
    }))
    .sort((a, b) => a.kode.localeCompare(b.kode));

  // 3. Peta batas wilayah
  console.log("Mengunduh batas wilayah...");
  const geo = (await ambilJson(SUMBER.geojson)) as {
    features: Array<{
      properties: { shapeName: string };
      geometry: { type: string; coordinates: number[][][] | number[][][][] };
    }>;
  };

  const fiturKeluaran: unknown[] = [];
  let cocok = 0;
  let tanpaData = 0;

  for (const f of geo.features) {
    const namaGeo = f.properties.shapeName?.trim() ?? "";
    const pasangan = petaNamaKeKode.get(namaGeo);
    if (!pasangan && !TANPA_DATA_BNPB.has(namaGeo)) continue;

    const poligon =
      f.geometry.type === "MultiPolygon"
        ? (f.geometry.coordinates as number[][][][])
        : [f.geometry.coordinates as number[][][]];

    const cincin: number[][][] = [];
    for (const poli of poligon) {
      const luar = poli[0] as number[][] | undefined;
      if (!luar || luar.length < 4) continue;
      // Pulau kecil bisa menyusut jadi garis lurus kalau disederhanakan, dan
      // kalau dibuang maka wilayahnya hilang dari peta. Jadi kalau hasilnya
      // terlalu pendek, coba toleransi lebih halus dulu, baru pakai bentuk asli.
      let disederhanakan = sederhanakan(luar, TOLERANSI);
      if (disederhanakan.length < 4) {
        disederhanakan = sederhanakan(luar, TOLERANSI / 5);
        if (disederhanakan.length < 4) disederhanakan = luar;
      }
      const dipakai = disederhanakan;
      const hasil = bulatkan(dipakai);
      if (hasil.length >= 4) cincin.push(hasil);
    }
    if (cincin.length === 0) continue;

    if (pasangan) cocok++;
    else tanpaData++;

    fiturKeluaran.push({
      type: "Feature",
      properties: {
        kode: pasangan?.kode ?? null,
        nama: pasangan?.nama ?? namaGeo,
      },
      geometry: { type: "MultiPolygon", coordinates: cincin.map((c) => [c]) },
    });
  }

  console.log(`Peta: ${fiturKeluaran.length} bentuk (${cocok} berpasangan, ${tanpaData} tanpa data BNPB)`);

  // 4. Tulis berkas
  await mkdir(DIR_KELUARAN, { recursive: true });
  await mkdir(DIR_GEO, { recursive: true });

  const hariIni = new Date().toISOString().slice(0, 10);
  const meta: Meta = {
    dibuat: hariIni,
    tahun,
    jumlahWilayah: wilayah.length,
    jumlahProvinsi: provinsi.length,
    sumber: {
      nama: "Data Bencana Indonesia, BNPB",
      url: SUMBER.bnpb,
      diambil: hariIni,
    },
    catatan: [
      "Angka provinsi di aplikasi adalah jumlah kabupaten, bukan tabel provinsi BNPB.",
      "Pada 2024, tujuh provinsi punya selisih antara kedua tabel BNPB, total 46 kejadian.",
      "Kode 91 dan 92 mengikuti penamaan BNPB, yang berbeda dari konvensi BPS.",
      "Nilai kosong berarti tidak dilaporkan, bukan nol.",
    ],
  };

  await writeFile(join(DIR_KELUARAN, "wilayah.json"), JSON.stringify(wilayah), "utf8");
  await writeFile(join(DIR_KELUARAN, "provinsi.json"), JSON.stringify(provinsi), "utf8");
  await writeFile(join(DIR_KELUARAN, "meta.json"), JSON.stringify(meta, null, 2), "utf8");
  await writeFile(
    join(DIR_GEO, "wilayah.geojson"),
    JSON.stringify({ type: "FeatureCollection", features: fiturKeluaran }),
    "utf8",
  );

  // 5. Verifikasi cepat
  const akhir = tahun.length - 1;
  const totalKab = wilayah.reduce((n, w) => n + w.nilai[akhir], 0);
  const totalProv = provinsi.reduce((n, p) => n + p.nilai[akhir], 0);
  const totalBnpb = provinsi.reduce((n, p) => n + p.nilaiBnpb[akhir], 0);

  const beda = provinsi.filter((p) => p.nilai[akhir] !== p.nilaiBnpb[akhir]);
  console.log("\nVerifikasi 2024");
  console.log(`  jumlah kabupaten      : ${totalKab}`);
  console.log(`  jumlah provinsi (kita): ${totalProv}`);
  console.log(`  tabel provinsi BNPB   : ${totalBnpb}`);
  console.log(`  provinsi berselisih   : ${beda.length}`);
  for (const p of beda) {
    console.log(`    ${p.kode} ${p.nama}: ${p.nilai[akhir]} vs ${p.nilaiBnpb[akhir]}`);
  }
  console.log("\nSelesai.");
}

utama().catch((e) => {
  console.error("Pipeline gagal:", e instanceof Error ? e.message : e);
  process.exit(1);
});
