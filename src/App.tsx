import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  muatData,
  hitungAmbang,
  warnaUntuk,
  WARNA_KELAS,
  WARNA_NOL,
  WARNA_TANPA_CATATAN,
  tahunUntuk,
  ambilNilai,
  rincianDampak,
  sumberUntuk,
  fmt,
  UKURAN_UTAMA,
  type DataLentera,
  type Wilayah,
} from "./lib/data";
import "./App.css";

interface FiturPeta {
  type: "Feature";
  properties: { kode: string | null; nama: string };
  geometry: GeoJSON.Geometry;
}

export default function App() {
  const wadahPeta = useRef<HTMLDivElement | null>(null);
  const peta = useRef<L.Map | null>(null);
  const lapisan = useRef<L.GeoJSON | null>(null);
  const data = useRef<DataLentera | null>(null);

  const [siap, setSiap] = useState<DataLentera | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [ukuran, setUkuran] = useState<string>("kejadian");
  const [tahun, setTahun] = useState<number | null>(null);
  const [dipilih, setDipilih] = useState<Wilayah | null>(null);

  // Dibaca sekali sebelum efek lain berjalan, karena efek berikutnya menulis
  // ulang alamat halaman.
  const kodeAwal = useRef(new URLSearchParams(window.location.search).get("kode"));
  const ukuranAwal = useRef(new URLSearchParams(window.location.search).get("ukuran"));

  useEffect(() => {
    let batal = false;
    muatData()
      .then((d) => {
        if (batal) return;
        data.current = d;
        setSiap(d);
        const minta = ukuranAwal.current;
        if (minta && UKURAN_UTAMA.some((u) => u.id === minta)) setUkuran(minta);
        setTahun(d.meta.tahun[d.meta.tahun.length - 1]);
      })
      .catch((e: unknown) => {
        if (!batal) setGalat(e instanceof Error ? e.message : "Data gagal dimuat");
      });
    return () => {
      batal = true;
    };
  }, []);

  // Daftar tahun bergantung pada ukuran yang dipilih, karena sumbernya berbeda.
  const daftarTahun = useMemo(
    () => (siap ? tahunUntuk(siap, ukuran) : []),
    [siap, ukuran],
  );

  // Kalau tahun terpilih tidak ada di daftar baru, pindah ke tahun terakhir.
  useEffect(() => {
    if (daftarTahun.length === 0) return;
    if (tahun === null || !daftarTahun.includes(tahun)) {
      setTahun(daftarTahun[daftarTahun.length - 1]);
    }
  }, [daftarTahun, tahun]);

  // Tautan langsung, misalnya ?kode=3578 membuka Kota Surabaya.
  useEffect(() => {
    if (!siap) return;
    const kode = kodeAwal.current;
    if (kode && siap.perKode.has(kode)) setDipilih(siap.perKode.get(kode) ?? null);
  }, [siap]);

  // Simpan wilayah terpilih di alamat halaman.
  useEffect(() => {
    if (!siap) return;
    const url = new URL(window.location.href);
    if (dipilih) url.searchParams.set("kode", dipilih.kode);
    else url.searchParams.delete("kode");
    if (ukuran !== "kejadian") url.searchParams.set("ukuran", ukuran);
    else url.searchParams.delete("ukuran");
    window.history.replaceState({}, "", url);
  }, [dipilih, siap, ukuran]);

  const ambang = useMemo(() => {
    if (!siap || tahun === null) return [1, 2, 3, 4];
    const nilai: number[] = [];
    for (const w of siap.wilayah) {
      const v = ambilNilai(siap, w.kode, tahun, ukuran);
      if (v !== null) nilai.push(v);
    }
    return hitungAmbang(nilai);
  }, [siap, tahun, ukuran]);

  const labelUkuran =
    UKURAN_UTAMA.find((u) => u.id === ukuran)?.label ?? "Kejadian";
  const satuan = UKURAN_UTAMA.find((u) => u.id === ukuran)?.satuan ?? "";

  // Siapkan peta sekali.
  useEffect(() => {
    if (!wadahPeta.current || peta.current) return;
    const m = L.map(wadahPeta.current, {
      zoomControl: true,
      minZoom: 3,
      maxZoom: 9,
      zoomSnap: 0.25,
      // Tanpa basemap tile, jadi latar ditentukan sendiri dan peta tetap
      // bisa dipakai tanpa jaringan.
    }).setView([-2.5, 118], 4);

    m.attributionControl.setPrefix(false);
    m.attributionControl.addAttribution(
      'Batas wilayah: <a href="https://www.geoboundaries.org/">geoBoundaries</a> | Data: <a href="https://data.bnpb.go.id/">BNPB</a>',
    );

    peta.current = m;
    return () => {
      m.remove();
      peta.current = null;
      lapisan.current = null;
    };
  }, []);

  const warnai = useCallback(
    (nilai: number | null) => {
      if (nilai === null) return WARNA_TANPA_CATATAN;
      return warnaUntuk(nilai, ambang);
    },
    [ambang],
  );

  // Gambar ulang lapisan setiap data, ukuran, atau tahun berubah.
  useEffect(() => {
    if (!peta.current || !siap || tahun === null) return;

    // Kalau efek berjalan dua kali sebelum unduhan selesai, lapisan bisa
    // tergambar dobel. Penanda ini menghentikan hasil yang sudah basi.
    let basi = false;

    if (lapisan.current) {
      lapisan.current.remove();
      lapisan.current = null;
    }

    fetch("/geo/wilayah.geojson")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((geo: { features: FiturPeta[] }) => {
        if (basi || !peta.current) return;

        const l = L.geoJSON(geo as unknown as GeoJSON.GeoJsonObject, {
          style: (fitur) => {
            const kode = (fitur?.properties as { kode: string | null } | null)?.kode;
            const nilai = kode ? ambilNilai(siap, kode, tahun, ukuran) : null;
            return {
              fillColor: warnai(nilai),
              fillOpacity: 0.95,
              color: "#94a3b8",
              weight: 0.4,
            };
          },
          onEachFeature: (fitur, ly) => {
            const p = fitur.properties as { kode: string | null; nama: string };
            const wilayah = p.kode ? siap.perKode.get(p.kode) : undefined;
            const nilai = p.kode ? ambilNilai(siap, p.kode, tahun, ukuran) : null;

            const isiNilai =
              nilai === null
                ? "Tidak ada catatan"
                : `${fmt(nilai)} ${satuan} (${tahun})`;

            ly.bindTooltip(`<strong>${p.nama}</strong><br/>${isiNilai}`, {
              sticky: true,
            });

            if (wilayah) {
              ly.on("click", () => setDipilih(wilayah));
              ly.on("mouseover", () => {
                (ly as L.Path).setStyle({ weight: 2, color: "#0f172a" });
              });
              ly.on("mouseout", () => {
                (ly as L.Path).setStyle({ weight: 0.4, color: "#94a3b8" });
              });
            }
          },
        });

        l.addTo(peta.current);
        lapisan.current = l;
      })
      .catch((e: unknown) => {
        if (!basi) setGalat(e instanceof Error ? e.message : "Peta gagal dimuat");
      });

    return () => {
      basi = true;
    };
  }, [siap, tahun, ukuran, warnai, satuan]);

  const provinsiDipilih =
    dipilih && siap ? siap.provinsi.find((p) => p.kode === dipilih.prov) : undefined;

  const nilaiDipilih =
    dipilih && siap && tahun !== null
      ? ambilNilai(siap, dipilih.kode, tahun, ukuran)
      : null;

  const rincian =
    dipilih && siap && tahun !== null ? rincianDampak(siap, dipilih.kode, tahun) : [];

  const riwayat = useMemo(() => {
    if (!dipilih || !siap) return [];
    return daftarTahun.map((t) => ({
      tahun: t,
      nilai: ambilNilai(siap, dipilih.kode, t, ukuran),
    }));
  }, [dipilih, siap, daftarTahun, ukuran]);

  return (
    <div className="aplikasi">
      <header className="kepala">
        <div>
          <h1>Lentera</h1>
          <p className="tagline">
            Dampak bencana Indonesia, dengan asal data yang bisa ditelusuri
          </p>
        </div>

        <label className="pemilih">
          <span>Tahun</span>
          <select
            value={tahun ?? ""}
            onChange={(e) => setTahun(Number(e.target.value))}
            disabled={!siap}
          >
            {daftarTahun.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
      </header>

      <nav className="ukuran">
        {UKURAN_UTAMA.map((u) => (
          <button
            key={u.id}
            className={u.id === ukuran ? "aktif" : undefined}
            onClick={() => setUkuran(u.id)}
            disabled={!siap}
          >
            {u.label}
          </button>
        ))}
      </nav>

      <main className="isi">
        <div className="peta" ref={wadahPeta} />

        <aside className="panel">
          {galat && <p className="galat">{galat}</p>}

          {!galat && !siap && <p className="tenang">Memuat data...</p>}

          {siap && !dipilih && (
            <>
              <p className="tenang">Klik satu wilayah untuk melihat angkanya.</p>
              <dl className="ringkas">
                <div>
                  <dt>Wilayah</dt>
                  <dd>{siap.meta.jumlahWilayah} kabupaten/kota</dd>
                </div>
                <div>
                  <dt>Provinsi</dt>
                  <dd>{siap.meta.jumlahProvinsi}</dd>
                </div>
                <div>
                  <dt>Tahun tersedia</dt>
                  <dd>
                    {daftarTahun[0]} sampai {daftarTahun[daftarTahun.length - 1]}
                  </dd>
                </div>
                <div>
                  <dt>Sumber angka</dt>
                  <dd>{sumberUntuk(ukuran)}</dd>
                </div>
              </dl>
            </>
          )}

          {dipilih && siap && (
            <>
              <button className="tutup" onClick={() => setDipilih(null)}>
                Tutup
              </button>
              <h2>{dipilih.nama}</h2>
              <p className="meta">
                {provinsiDipilih?.nama ?? "Provinsi tidak diketahui"} | Kode BPS{" "}
                {dipilih.kode}
              </p>

              <p className="angka-besar">
                {nilaiDipilih === null ? "Tidak ada catatan" : fmt(nilaiDipilih)}
                {nilaiDipilih !== null && <span> {satuan} pada {tahun}</span>}
              </p>

              <p className="label-data">{labelUkuran} | {sumberUntuk(ukuran)}</p>

              {rincian.length > 0 && (
                <table className="riwayat rinci">
                  <caption>Rincian dampak {tahun}</caption>
                  <tbody>
                    {rincian.map((r) => (
                      <tr key={r.id}>
                        <th scope="row">{r.label}</th>
                        <td>{fmt(r.nilai)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <table className="riwayat">
                <caption>Riwayat {labelUkuran.toLowerCase()}</caption>
                <tbody>
                  {riwayat.map((r) => (
                    <tr key={r.tahun} className={r.tahun === tahun ? "aktif" : undefined}>
                      <th scope="row">{r.tahun}</th>
                      <td>{r.nilai === null ? "tidak ada catatan" : fmt(r.nilai)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {siap && (
            <div className="legenda">
              <p className="legenda-judul">{labelUkuran} per tahun</p>
              <div className="legenda-baris">
                <span className="butir">
                  <span className="contoh" style={{ background: WARNA_NOL }} />0
                </span>
                {ambang.map((a, i) => (
                  <span className="butir" key={`${a}-${i}`}>
                    <span className="contoh" style={{ background: WARNA_KELAS[i] }} />
                    {i === 0 ? `1-${fmt(ambang[0])}` : `${fmt(ambang[i - 1] + 1)}-${fmt(a)}`}
                  </span>
                ))}
                <span className="butir">
                  <span
                    className="contoh"
                    style={{
                      background:
                        WARNA_KELAS[Math.min(ambang.length, WARNA_KELAS.length - 1)],
                    }}
                  />
                  {fmt(ambang[ambang.length - 1] + 1)}+
                </span>
                <span className="butir">
                  <span
                    className="contoh"
                    style={{ background: WARNA_TANPA_CATATAN }}
                  />
                  tanpa catatan
                </span>
              </div>
            </div>
          )}
        </aside>
      </main>

      {siap && (
        <footer className="kaki">
          <p>
            Sumber: {siap.meta.sumber.nama}, diambil {siap.meta.sumber.diambil}.
            Angka kejadian dari tabel agregat, angka korban dan kerusakan dari
            berkas statistik wilayah. Kedua tabel BNPB bisa berbeda.
          </p>
        </footer>
      )}
    </div>
  );
}
