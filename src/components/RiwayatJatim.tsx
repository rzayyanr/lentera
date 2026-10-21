/**
 * Halaman riwayat kejadian Jawa Timur.
 *
 * Sumbernya SMARTPB milik BPBD Provinsi Jawa Timur, satu-satunya portal
 * provinsi yang datanya bisa diambil otomatis dan memuat jenis bencana per
 * kejadian. Berkasnya dimuat hanya saat halaman ini dibuka, karena ukurannya
 * jauh lebih besar daripada data peta.
 */

import { useEffect, useMemo, useState } from "react";

interface DataKejadian {
  kolom: string[];
  jenis: string[];
  kabupaten: string[];
  status: string[];
  tingkat: string[];
  kejadian: Array<Array<string | number>>;
  catatan: string[];
}

const PER_HALAMAN = 40;

const BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function tanggalPanjang(iso: string): string {
  const [y, m, d] = iso.split("-");
  const bulan = BULAN[Number(m) - 1] ?? m;
  return `${Number(d)} ${bulan} ${y}`;
}

function angka(n: string | number): string {
  return Number(n).toLocaleString("id-ID");
}

export default function RiwayatJatim() {
  const [data, setData] = useState<DataKejadian | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [tahun, setTahun] = useState<string>("semua");
  const [jenis, setJenis] = useState<string>("semua");
  const [halaman, setHalaman] = useState(0);
  const [terbuka, setTerbuka] = useState<string | null>(null);

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
  const iStatus = kol.indexOf("status");
  const iTingkat = kol.indexOf("tingkat");

  const daftarTahun = useMemo(() => {
    if (!data) return [];
    const set = new Set<string>();
    for (const k of data.kejadian) set.add(String(k[iTanggal]).slice(0, 4));
    return [...set].sort().reverse();
  }, [data, iTanggal]);

  const tersaring = useMemo(() => {
    if (!data) return [];
    return data.kejadian.filter((k) => {
      if (tahun !== "semua" && !String(k[iTanggal]).startsWith(tahun)) return false;
      if (jenis !== "semua" && data.jenis[Number(k[iJenis])] !== jenis) return false;
      return true;
    });
  }, [data, tahun, jenis, iTanggal, iJenis]);

  useEffect(() => {
    setHalaman(0);
  }, [tahun, jenis]);

  const jumlahHalaman = Math.max(1, Math.ceil(tersaring.length / PER_HALAMAN));
  const potongan = tersaring.slice(halaman * PER_HALAMAN, (halaman + 1) * PER_HALAMAN);

  const totalKorban = useMemo(() => {
    let meninggal = 0;
    let luka = 0;
    for (const k of tersaring) {
      meninggal += Number(k[iMeninggal]) || 0;
      luka += (Number(k[iLukaBerat]) || 0) + (Number(k[iLukaRingan]) || 0);
    }
    return { meninggal, luka };
  }, [tersaring, iMeninggal, iLukaBerat, iLukaRingan]);

  return (
    <div className="halaman">
      <div className="kolom kolom-lebar">
        <p className="remah">Riwayat kejadian</p>
        <h1>Kejadian bencana di Jawa Timur, satu per satu</h1>
        <p className="pembuka">
          Daftar kejadian menurut tanggal, jenis, dan wilayah, dari data resmi
          BPBD Provinsi Jawa Timur. Jawa Timur dipakai karena hanya provinsi ini
          yang menerbitkan jenis bencana per kejadian secara terbuka.
        </p>

        {galat && <p className="galat">Gagal memuat riwayat: {galat}</p>}
        {!galat && !data && <p className="tenang">Memuat riwayat kejadian...</p>}

        {data && (
          <>
            <p className="label-lapisan resmi" style={{ marginBottom: 14 }}>
              Data resmi BPBD Jawa Timur
            </p>

            <div className="saring">
              <label>
                <span>Tahun</span>
                <select value={tahun} onChange={(e) => setTahun(e.target.value)}>
                  <option value="semua">Semua tahun</option>
                  {daftarTahun.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Jenis bencana</span>
                <select value={jenis} onChange={(e) => setJenis(e.target.value)}>
                  <option value="semua">Semua jenis</option>
                  {data.jenis.map((j) => (
                    <option key={j} value={j}>
                      {j}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <dl className="ringkas ringkas-baris">
              <div>
                <dt>Kejadian</dt>
                <dd>{angka(tersaring.length)}</dd>
              </div>
              <div>
                <dt>Korban meninggal</dt>
                <dd>{angka(totalKorban.meninggal)}</dd>
              </div>
              <div>
                <dt>Korban luka</dt>
                <dd>{angka(totalKorban.luka)}</dd>
              </div>
            </dl>

            <table className="tabel-kejadian">
              <caption className="sr">
                Daftar kejadian, urut dari yang terbaru
              </caption>
              <thead>
                <tr>
                  <th scope="col">Tanggal</th>
                  <th scope="col">Jenis</th>
                  <th scope="col">Wilayah</th>
                  <th scope="col">Korban</th>
                </tr>
              </thead>
              <tbody>
                {potongan.map((k) => {
                  const id = String(k[0]);
                  const buka = terbuka === id;
                  const korban = [
                    Number(k[iMeninggal]) > 0 ? `${angka(k[iMeninggal])} meninggal` : "",
                    Number(k[iHilang]) > 0 ? `${angka(k[iHilang])} hilang` : "",
                    Number(k[iLukaBerat]) > 0 ? `${angka(k[iLukaBerat])} luka berat` : "",
                    Number(k[iLukaRingan]) > 0 ? `${angka(k[iLukaRingan])} luka ringan` : "",
                  ].filter(Boolean);

                  return (
                    <tr key={id} className={buka ? "terbuka" : undefined}>
                      <td data-label="Tanggal">{tanggalPanjang(String(k[iTanggal]))}</td>
                      <td data-label="Jenis">{data.jenis[Number(k[iJenis])]}</td>
                      <td data-label="Wilayah">
                        <button
                          className="tautan-baris"
                          aria-expanded={buka}
                          onClick={() => setTerbuka(buka ? null : id)}
                        >
                          {data.kabupaten[Number(k[iKab])]}
                          {k[iWilayah] ? `, ${k[iWilayah]}` : ""}
                        </button>
                        {buka && (
                          <div className="rincian-baris">
                            <dl className="ringkas">
                              <div>
                                <dt>Tingkat</dt>
                                <dd>{data.tingkat[Number(k[iTingkat])] || "tidak dicatat"}</dd>
                              </div>
                              <div>
                                <dt>Status</dt>
                                <dd>{data.status[Number(k[iStatus])] || "tidak dicatat"}</dd>
                              </div>
                              <div>
                                <dt>Korban</dt>
                                <dd>{korban.length ? korban.join(", ") : "tidak ada"}</dd>
                              </div>
                              <div>
                                <dt>Nomor catatan</dt>
                                <dd>{id}</dd>
                              </div>
                            </dl>
                            <p className="catatan-kecil">
                              Kronologi, kerusakan, dan kerugian tidak disalin ke
                              sini karena besar.{" "}
                              <a
                                href={`https://smartpb.bpbd.jatimprov.go.id/public/v_disasterlogs_view.php?editid1=${id}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Baca catatan lengkapnya di sumber
                              </a>
                              .
                            </p>
                          </div>
                        )}
                      </td>
                      <td data-label="Korban">
                        {korban.length ? korban.join(", ") : "tidak ada"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {tersaring.length === 0 && (
              <p className="tenang">Tidak ada kejadian yang cocok dengan saringan ini.</p>
            )}

            {jumlahHalaman > 1 && (
              <div className="penomoran">
                <button
                  onClick={() => setHalaman((h) => Math.max(0, h - 1))}
                  disabled={halaman === 0}
                >
                  Sebelumnya
                </button>
                <span>
                  Halaman {halaman + 1} dari {jumlahHalaman}
                </span>
                <button
                  onClick={() => setHalaman((h) => Math.min(jumlahHalaman - 1, h + 1))}
                  disabled={halaman >= jumlahHalaman - 1}
                >
                  Berikutnya
                </button>
              </div>
            )}

            <h2>Hal yang perlu diketahui</h2>
            <p className="catatan-kecil">{data.catatan.join(" ")}</p>
          </>
        )}
      </div>
    </div>
  );
}
