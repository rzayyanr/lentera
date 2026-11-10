/**
 * Daftar kejadian per tanggal untuk Jawa Timur.
 *
 * Sumbernya SMARTPB milik BPBD Provinsi Jawa Timur. Komponen ini hanya
 * menampilkan daftarnya; judul halaman dan pemilih provinsi ada di Riwayat.tsx.
 */

import { useEffect, useMemo, useState } from "react";
import searchInputSvg from "../assets/icons/search-input.svg";

interface DataKejadian {
  kolom: string[];
  jenis: string[];
  kabupaten: string[];
  status: string[];
  tingkat: string[];
  kejadian: Array<Array<string | number>>;
  catatan: string[];
}

const PER_HALAMAN = 25;

const BULAN_PENDEK = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

function tanggalFormat(iso: string): string {
  const parts = iso.split("-");
  if (parts.length < 3) return iso;
  const y = parts[0];
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  const bulan = BULAN_PENDEK[m - 1] ?? parts[1];
  return `${d} ${bulan} ${y}`;
}

interface Props {
  onPilihKejadian?: (id: string) => void;
}

export default function DaftarKejadianJatim({ onPilihKejadian }: Props) {
  const [data, setData] = useState<DataKejadian | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [tahun, setTahun] = useState<string>("semua");
  const [jenis, setJenis] = useState<string>("semua");
  const [kabupaten, setKabupaten] = useState<string>("semua");
  const [kataKunci, setKataKunci] = useState<string>("");
  const [halaman, setHalaman] = useState(0);

  useEffect(() => {
    let batal = false;
    fetch("/data/kejadian-jatim.json")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: DataKejadian) => {
        if (!batal) setData(d);
      })
      .catch((e: unknown) => {
        if (!batal) setGalat(e instanceof Error ? e.message : "Data gagal dimuat");
      });
    return () => {
      batal = true;
    };
  }, []);

  const kol = data?.kolom ?? [];
  const iTanggal = kol.indexOf("tanggal");
  const iJenis = kol.indexOf("jenis");
  const iKab = kol.indexOf("kabupaten");
  const iWilayah = kol.indexOf("wilayah");
  const iMeninggal = kol.indexOf("meninggal");
  const iHilang = kol.indexOf("hilang");
  const iLukaBerat = kol.indexOf("lukaBerat");
  const iLukaRingan = kol.indexOf("lukaRingan");
  const iTingkat = kol.indexOf("tingkat");

  const daftarTahun = useMemo(() => {
    if (!data) return [];
    const set = new Set<string>();
    for (const k of data.kejadian) set.add(String(k[iTanggal]).slice(0, 4));
    return [...set].sort().reverse();
  }, [data, iTanggal]);

  const tersaring = useMemo(() => {
    if (!data) return [];
    const q = kataKunci.trim().toLowerCase();

    return data.kejadian.filter((k) => {
      if (tahun !== "semua" && !String(k[iTanggal]).startsWith(tahun)) return false;
      if (jenis !== "semua" && data.jenis[Number(k[iJenis])] !== jenis) return false;
      if (kabupaten !== "semua" && data.kabupaten[Number(k[iKab])] !== kabupaten) return false;
      if (q) {
        const textWilayah = String(k[iWilayah] ?? "").toLowerCase();
        const textKab = (data.kabupaten[Number(k[iKab])] ?? "").toLowerCase();
        if (!textWilayah.includes(q) && !textKab.includes(q)) return false;
      }
      return true;
    });
  }, [data, tahun, jenis, kabupaten, kataKunci, iTanggal, iJenis, iKab, iWilayah]);

  const jumlahHalaman = Math.max(1, Math.ceil(tersaring.length / PER_HALAMAN));
  const potongan = tersaring.slice(halaman * PER_HALAMAN, (halaman + 1) * PER_HALAMAN);

  return (
    <div className="daftar-kejadian-jatim">
      {galat && <p className="pesan-galat">Gagal memuat riwayat: {galat}</p>}
      {!galat && !data && <p className="pesan-memuat">Memuat 24.190 data kejadian Jawa Timur...</p>}

        {data && (
          <>
            {/* 4 Kolom Toolbar Penyaring */}
            <div className="grid-penyaring-riwayat">
              {/* Filter Tahun */}
              <div className="penyaring-grup">
                <label className="penyaring-label">TAHUN</label>
                <div className="select-wadah-riwayat">
                  <select
                    value={tahun}
                    onChange={(e) => {
                      setTahun(e.target.value);
                      setHalaman(0);
                    }}
                    className="select-riwayat"
                    aria-label="Pilih tahun"
                  >
                    <option value="semua">Semua tahun</option>
                    {daftarTahun.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <span className="panah-select" aria-hidden="true">▾</span>
                </div>
              </div>

              {/* Filter Jenis Bencana */}
              <div className="penyaring-grup">
                <label className="penyaring-label">JENIS BENCANA</label>
                <div className="select-wadah-riwayat">
                  <select
                    value={jenis}
                    onChange={(e) => {
                      setJenis(e.target.value);
                      setHalaman(0);
                    }}
                    className="select-riwayat"
                    aria-label="Pilih jenis bencana"
                  >
                    <option value="semua">Semua jenis</option>
                    {data.jenis.map((j) => (
                      <option key={j} value={j}>
                        {j}
                      </option>
                    ))}
                  </select>
                  <span className="panah-select" aria-hidden="true">▾</span>
                </div>
              </div>

              {/* Filter Kabupaten/Kota */}
              <div className="penyaring-grup">
                <label className="penyaring-label">KABUPATEN / KOTA</label>
                <div className="select-wadah-riwayat">
                  <select
                    value={kabupaten}
                    onChange={(e) => {
                      setKabupaten(e.target.value);
                      setHalaman(0);
                    }}
                    className="select-riwayat"
                    aria-label="Pilih kabupaten atau kota"
                  >
                    <option value="semua">Semua wilayah</option>
                    {data.kabupaten.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                  <span className="panah-select" aria-hidden="true">▾</span>
                </div>
              </div>

              {/* Input Cari */}
              <div className="penyaring-grup">
                <label className="penyaring-label">CARI</label>
                <div className="input-cari-riwayat-wadah">
                  <input
                    type="text"
                    placeholder="Nama kecamatan / desa"
                    value={kataKunci}
                    onChange={(e) => {
                      setKataKunci(e.target.value);
                      setHalaman(0);
                    }}
                    className="input-cari-riwayat"
                    aria-label="Cari nama wilayah"
                  />
                  <img src={searchInputSvg} alt="" width="14" height="14" className="ikon-input-cari" />
                </div>
              </div>
            </div>

            {/* Kartu Tabel Kejadian */}
            <div className="kartu-tabel-riwayat" data-node-id="10:767" data-name="Tabel">
              <div className="wadah-gulir-tabel">
                <table className="tabel-riwayat-entri">
                  <thead>
                    <tr>
                      <th scope="col" style={{ width: "13%" }}>TANGGAL</th>
                      <th scope="col" style={{ width: "17%" }}>JENIS</th>
                      <th scope="col" style={{ width: "24%" }}>KABUPATEN / KOTA</th>
                      <th scope="col" style={{ width: "28%" }}>WILAYAH</th>
                      <th scope="col" style={{ width: "8%", textAlign: "center" }}>KORBAN</th>
                      <th scope="col" style={{ width: "10%", textAlign: "center" }}>TINGKAT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {potongan.map((k) => {
                      const id = String(k[0]);
                      const tglIso = String(k[iTanggal]);
                      const namaJenis = data.jenis[Number(k[iJenis])] ?? "Bencana";
                      const namaKab = data.kabupaten[Number(k[iKab])] ?? "Jawa Timur";
                      const namaWilayah = String(k[iWilayah] ?? "—") || "—";
                      const totalKorbanJiwa =
                        (Number(k[iMeninggal]) || 0) +
                        (Number(k[iHilang]) || 0) +
                        (Number(k[iLukaBerat]) || 0) +
                        (Number(k[iLukaRingan]) || 0);

                      const tingkatStr =
                        data.tingkat[Number(k[iTingkat])] ??
                        (totalKorbanJiwa > 3 ? "SEDANG" : "RENDAH");

                      return (
                        <tr
                          key={id}
                          className="baris-riwayat-tabel baris-dapat-diklik"
                          onClick={() => onPilihKejadian?.(id)}
                          title="Klik untuk melihat detail kejadian"
                        >
                          <td className="kolom-tgl">{tanggalFormat(tglIso)}</td>
                          <td className="kolom-jenis">{namaJenis}</td>
                          <td className="kolom-kab">{namaKab}</td>
                          <td className="kolom-wilayah">{namaWilayah}</td>
                          <td className="kolom-korban-angka">{totalKorbanJiwa}</td>
                          <td className="kolom-tingkat">
                            <span className={`pill-tingkat ${tingkatStr.toLowerCase()}`}>
                              {tingkatStr.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {potongan.length === 0 && (
                      <tr>
                        <td colSpan={6} className="tabel-kosong">
                          Tidak ada kejadian yang cocok dengan saringan yang dipilih.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Baris Paginasi */}
              {jumlahHalaman > 1 && (
                <div className="baris-paginasi-daftar">
                  <button
                    type="button"
                    className="tombol-paginasi"
                    disabled={halaman === 0}
                    onClick={() => setHalaman((h) => Math.max(0, h - 1))}
                  >
                    ← Sebelumnya
                  </button>

                  <span className="teks-halaman-saat-ini">
                    Halaman {halaman + 1} dari {jumlahHalaman} ({tersaring.length.toLocaleString("id-ID")} kejadian)
                  </span>

                  <button
                    type="button"
                    className="tombol-paginasi"
                    disabled={halaman >= jumlahHalaman - 1}
                    onClick={() => setHalaman((h) => Math.min(jumlahHalaman - 1, h + 1))}
                  >
                    Berikutnya →
                  </button>
                </div>
              )}
            </div>

            <p className="keterangan-bawah-riwayat">
              Menampilkan {potongan.length} dari {tersaring.length.toLocaleString("id-ID")} kejadian. Alamat lengkap tidak ditampilkan demi privasi. Sumber: SMARTPB BPBD Provinsi Jawa Timur.
            </p>
          </>
        )}
    </div>
  );
}
