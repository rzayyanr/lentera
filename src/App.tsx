import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  muatData,
  hitungAmbang,
  warnaUntuk,
  WARNA_KELAS,
  type DataLentera,
  type Wilayah,
} from "./lib/data";
import "./App.css";

/** Bentuk minimal fitur peta yang kita pakai. */
interface FiturPeta {
  type: "Feature";
  properties: { kode: string | null; nama: string };
  geometry: GeoJSON.Geometry;
}

export default function App() {
  const wadahPeta = useRef<HTMLDivElement | null>(null);
  const peta = useRef<L.Map | null>(null);
  const lapisan = useRef<L.GeoJSON | null>(null);

  const [data, setData] = useState<DataLentera | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [tahun, setTahun] = useState<number | null>(null);
  const [dipilih, setDipilih] = useState<Wilayah | null>(null);
  // Dibaca sekali sebelum efek apa pun berjalan, karena efek berikutnya
  // menulis ulang alamat halaman.
  const kodeAwal = useRef(new URLSearchParams(window.location.search).get("kode"));

  // Muat data sekali.
  useEffect(() => {
    let batal = false;
    muatData()
      .then((d) => {
        if (batal) return;
        setData(d);
        setTahun(d.meta.tahun[d.meta.tahun.length - 1]);
      })
      .catch((e: unknown) => {
        if (!batal) setGalat(e instanceof Error ? e.message : "Data gagal dimuat");
      });
    return () => {
      batal = true;
    };
  }, []);

  // Dukungan tautan langsung, misalnya ?kode=3578 membuka Kota Surabaya,
  // supaya alamat halaman bisa dibagikan.
  useEffect(() => {
    if (!data) return;
    const kode = kodeAwal.current;
    if (kode && data.perKode.has(kode)) {
      setDipilih(data.perKode.get(kode) ?? null);
    }
  }, [data]);

  // Simpan wilayah terpilih di alamat halaman.
  useEffect(() => {
    if (!data) return;
    const url = new URL(window.location.href);
    if (dipilih) url.searchParams.set("kode", dipilih.kode);
    else url.searchParams.delete("kode");
    window.history.replaceState({}, "", url);
  }, [dipilih, data]);

  const indeksTahun = useMemo(() => {
    if (!data || tahun === null) return 0;
    return data.meta.tahun.indexOf(tahun);
  }, [data, tahun]);

  const ambang = useMemo(() => {
    if (!data) return [1, 2, 3, 4];
    return hitungAmbang(data.wilayah.map((w) => w.nilai[indeksTahun]));
  }, [data, indeksTahun]);

  // Siapkan peta sekali saja.
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

  // Gambar ulang lapisan setiap data atau tahun berubah.
  useEffect(() => {
    if (!peta.current || !data || tahun === null) return;

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
        if (!peta.current) return;

        const l = L.geoJSON(geo as unknown as GeoJSON.GeoJsonObject, {
          style: (fitur) => {
            const kode = (fitur?.properties as { kode: string | null } | null)?.kode;
            const w = kode ? data.perKode.get(kode) : undefined;
            const nilai = w ? w.nilai[indeksTahun] : -1;
            return {
              fillColor: nilai < 0 ? "#e2e8f0" : warnaUntuk(nilai, ambang),
              fillOpacity: 0.95,
              color: "#94a3b8",
              weight: 0.4,
            };
          },
          onEachFeature: (fitur, ly) => {
            const p = fitur.properties as { kode: string | null; nama: string };
            const w = p.kode ? data.perKode.get(p.kode) : undefined;
            const nilai = w ? w.nilai[indeksTahun] : null;

            ly.bindTooltip(
              `<strong>${p.nama}</strong><br/>${
                nilai === null ? "Tidak ada data BNPB" : `${nilai} kejadian (${tahun})`
              }`,
              { sticky: true },
            );

            if (w) {
              ly.on("click", () => setDipilih(w));
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
        setGalat(e instanceof Error ? e.message : "Peta gagal dimuat");
      });
  }, [data, tahun, indeksTahun, ambang]);

  const provinsiDipilih =
    dipilih && data ? data.provinsi.find((p) => p.kode === dipilih.prov) : undefined;

  return (
    <div className="aplikasi">
      <header className="kepala">
        <div>
          <h1>Lentera</h1>
          <p className="tagline">
            Peta dampak bencana Indonesia, dengan asal data yang bisa ditelusuri
          </p>
        </div>

        <label className="pemilih">
          <span>Tahun</span>
          <select
            value={tahun ?? ""}
            onChange={(e) => setTahun(Number(e.target.value))}
            disabled={!data}
          >
            {data?.meta.tahun.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
      </header>

      <main className="isi">
        <div className="peta" ref={wadahPeta} />

        <aside className="panel">
          {galat && <p className="galat">{galat}</p>}

          {!galat && !data && <p className="tenang">Memuat data...</p>}

          {data && !dipilih && (
            <>
              <p className="tenang">Klik satu wilayah untuk melihat angkanya.</p>
              <dl className="ringkas">
                <div>
                  <dt>Wilayah</dt>
                  <dd>{data.meta.jumlahWilayah} kabupaten/kota</dd>
                </div>
                <div>
                  <dt>Provinsi</dt>
                  <dd>{data.meta.jumlahProvinsi}</dd>
                </div>
                <div>
                  <dt>Periode</dt>
                  <dd>
                    {data.meta.tahun[0]} sampai {data.meta.tahun.at(-1)}
                  </dd>
                </div>
              </dl>
            </>
          )}

          {dipilih && data && (
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
                {dipilih.nilai[indeksTahun]}
                <span> kejadian pada {tahun}</span>
              </p>

              <p className="label-data">Data resmi BNPB</p>

              <table className="riwayat">
                <tbody>
                  {data.meta.tahun.map((t, i) => (
                    <tr key={t} className={t === tahun ? "aktif" : undefined}>
                      <th scope="row">{t}</th>
                      <td>{dipilih.nilai[i]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {data && (
            <div className="legenda">
              <p className="legenda-judul">Kejadian per tahun</p>
              <div className="legenda-baris">
                <span className="butir">
                  <span className="contoh" style={{ background: "#f1f5f9" }} />0
                </span>
                {ambang.map((a, i) => (
                  <span className="butir" key={a}>
                    <span
                      className="contoh"
                      style={{ background: WARNA_KELAS[i] }}
                    />
                    {i === 0 ? `1-${ambang[0]}` : `${ambang[i - 1] + 1}-${a}`}
                  </span>
                ))}
                <span className="butir">
                  <span
                    className="contoh"
                    style={{ background: WARNA_KELAS[WARNA_KELAS.length - 1] }}
                  />
                  {ambang[ambang.length - 1] + 1}+
                </span>
              </div>
            </div>
          )}
        </aside>
      </main>

      {data && (
        <footer className="kaki">
          <p>
            Sumber: {data.meta.sumber.nama}, diambil {data.meta.sumber.diambil}.
            Angka provinsi di aplikasi ini adalah jumlah kabupaten.
          </p>
        </footer>
      )}
    </div>
  );
}
