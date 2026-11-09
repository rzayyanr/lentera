import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  muatData,
  hitungAmbang,
  warnaUntuk,
  WARNA_KELAS,
  tahunUntuk,
  ambilNilai,
  rincianDampak,
  sumberUntuk,
  fmt,
  UKURAN_UTAMA,
  type DataLentera,
  type Wilayah,
} from "./lib/data";
import PenggeserTahun from "./components/PenggeserTahun";
import Tentang from "./components/Tentang";
import RiwayatJatim from "./components/RiwayatJatim";
import "./App.css";

interface FiturPeta {
  type: "Feature";
  properties: { kode: string | null; nama: string };
  geometry: GeoJSON.Geometry;
}

/** Jeda antar tahun saat tombol putar ditekan. */
const JEDA_PUTAR_MS = 650;

/** Pola garis miring untuk wilayah tanpa catatan, sesuai design system. */
const POLA_SVG = `
<svg width="0" height="0" aria-hidden="true" style="position:absolute">
  <defs>
    <pattern id="lentera-garis" width="7" height="7" patternUnits="userSpaceOnUse"
             patternTransform="rotate(45)">
      <rect width="7" height="7" fill="#ede9dc"></rect>
      <line x1="0" y1="0" x2="0" y2="7" stroke="#b9b2a0" stroke-width="1.7"></line>
    </pattern>
  </defs>
</svg>`;

export default function App() {
  const wadahPeta = useRef<HTMLDivElement | null>(null);
  const peta = useRef<L.Map | null>(null);
  const lapisan = useRef<L.GeoJSON | null>(null);

  // Nilai terkini disimpan di ref juga, supaya penggambaran ulang peta saat
  // penggeser ditarik tidak perlu membangun ulang seluruh lapisan.
  const siapRef = useRef<DataLentera | null>(null);
  const tahunRef = useRef<number | null>(null);
  const ukuranRef = useRef<string>("kejadian");
  const ambangRef = useRef<number[]>([1, 2, 3, 4, 5]);

  const [siap, setSiap] = useState<DataLentera | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [ukuran, setUkuran] = useState<string>("kejadian");
  const [tahun, setTahun] = useState<number | null>(null);
  const [dipilih, setDipilih] = useState<Wilayah | null>(null);
  const [sedangMain, setSedangMain] = useState(false);
  const [halaman, setHalaman] = useState<"peta" | "riwayat" | "tentang">(() => {
    const hal = new URLSearchParams(window.location.search).get("hal");
    return hal === "tentang" || hal === "riwayat" ? hal : "peta";
  });

  const kodeAwal = useRef(new URLSearchParams(window.location.search).get("kode"));
  const ukuranAwal = useRef(new URLSearchParams(window.location.search).get("ukuran"));
  const tahunAwal = useRef(new URLSearchParams(window.location.search).get("tahun"));

  useEffect(() => {
    let batal = false;
    muatData()
      .then((d) => {
        if (batal) return;
        setSiap(d);
        siapRef.current = d;
        const minta = ukuranAwal.current;
        if (minta && UKURAN_UTAMA.some((u) => u.id === minta)) setUkuran(minta);
        const th = Number(tahunAwal.current);
        const daftar = minta && minta !== "kejadian" ? d.dampak.tahun : d.meta.tahun;
        setTahun(daftar.includes(th) ? th : d.meta.tahun[d.meta.tahun.length - 1]);
      })
      .catch((e: unknown) => {
        if (!batal) setGalat(e instanceof Error ? e.message : "Data gagal dimuat");
      });
    return () => {
      batal = true;
    };
  }, []);

  const daftarTahun = useMemo(
    () => (siap ? tahunUntuk(siap, ukuran) : []),
    [siap, ukuran],
  );

  useEffect(() => {
    if (daftarTahun.length === 0) return;
    if (tahun === null || !daftarTahun.includes(tahun)) {
      setTahun(daftarTahun[daftarTahun.length - 1]);
    }
  }, [daftarTahun, tahun]);

  useEffect(() => {
    if (!siap) return;
    const kode = kodeAwal.current;
    if (kode && siap.perKode.has(kode)) setDipilih(siap.perKode.get(kode) ?? null);
  }, [siap]);

  // Simpan keadaan di alamat halaman supaya bisa dibagikan.
  useEffect(() => {
    if (!siap) return;
    const url = new URL(window.location.href);
    if (dipilih) url.searchParams.set("kode", dipilih.kode);
    else url.searchParams.delete("kode");
    if (ukuran !== "kejadian") url.searchParams.set("ukuran", ukuran);
    else url.searchParams.delete("ukuran");
    if (halaman !== "peta") url.searchParams.set("hal", halaman);
    else url.searchParams.delete("hal");
    if (tahun !== null) url.searchParams.set("tahun", String(tahun));
    window.history.replaceState({}, "", url);
  }, [dipilih, siap, ukuran, halaman, tahun]);

  const ambang = useMemo(() => {
    if (!siap || tahun === null) return [1, 2, 3, 4, 5];
    const nilai: number[] = [];
    for (const w of siap.wilayah) {
      const v = ambilNilai(siap, w.kode, tahun, ukuran);
      if (v !== null) nilai.push(v);
    }
    return hitungAmbang(nilai);
  }, [siap, tahun, ukuran]);

  useEffect(() => {
    tahunRef.current = tahun;
  }, [tahun]);
  useEffect(() => {
    ukuranRef.current = ukuran;
  }, [ukuran]);
  useEffect(() => {
    ambangRef.current = ambang;
  }, [ambang]);

  const labelUkuran = UKURAN_UTAMA.find((u) => u.id === ukuran)?.label ?? "Kejadian";
  const satuan = UKURAN_UTAMA.find((u) => u.id === ukuran)?.satuan ?? "";

  /** Hitung nilai dan warna untuk satu kode wilayah, memakai keadaan terkini. */
  const hitung = useCallback((kode: string | null) => {
    const d = siapRef.current;
    const th = tahunRef.current;
    const uk = ukuranRef.current;
    if (!d || th === null || !kode) return { nilai: null as number | null, warna: "#ede9dc" };
    const nilai = ambilNilai(d, kode, th, uk);
    return {
      nilai,
      warna: nilai === null ? "#ede9dc" : warnaUntuk(nilai, ambangRef.current),
    };
  }, []);

  const isiTooltip = useCallback(
    (kode: string | null, nama: string) => {
      const { nilai } = hitung(kode);
      const sat = UKURAN_UTAMA.find((u) => u.id === ukuranRef.current)?.satuan ?? "";
      const th = tahunRef.current;
      return `<strong>${nama}</strong><br/>${
        nilai === null ? "Tidak ada catatan" : `${fmt(nilai)} ${sat} (${th})`
      }`;
    },
    [hitung],
  );

  /** Warnai ulang seluruh wilayah tanpa menggambar ulang lapisannya. */
  const perbaruiWarna = useCallback(() => {
    const l = lapisan.current;
    if (!l) return;
    l.eachLayer((lapis) => {
      const jalur = lapis as L.Path & { feature?: FiturPeta };
      const kode = jalur.feature?.properties.kode ?? null;
      const { warna } = hitung(kode);
      jalur.setStyle({ fillColor: warna, fillOpacity: 1, color: "#fbfaf7", weight: 0.7 });
      const el = jalur.getElement() as SVGPathElement | undefined;
      // Wilayah tanpa catatan memakai pola, bukan warna, dan atribut ini harus
      // ditulis setelah setStyle karena setStyle menimpanya.
      if (el) el.setAttribute("fill", kode && hitung(kode).nilai !== null ? warna : "url(#lentera-garis)");
    });
  }, [hitung]);

  // Siapkan peta. Bergantung pada halaman, karena wadah peta dilepas saat
  // pengguna membuka halaman Tentang dan harus dibuat ulang saat kembali.
  useEffect(() => {
    if (halaman !== "peta" || !wadahPeta.current || peta.current) return;

    const m = L.map(wadahPeta.current, {
      zoomControl: false,
      minZoom: 3,
      maxZoom: 9,
      zoomSnap: 0.25,
      // Tanpa basemap tile, jadi latar ditentukan sendiri dan peta tetap
      // bisa dipakai tanpa jaringan.
    }).setView([-2.5, 118], 4);

    L.control.zoom({ position: "bottomleft" }).addTo(m);
    m.attributionControl.setPrefix(false);
    m.attributionControl.addAttribution(
      'Batas wilayah: <a href="https://www.geoboundaries.org/">geoBoundaries</a> | Data: <a href="https://data.bnpb.go.id/">BNPB</a>',
    );

    const pola = document.createElement("div");
    pola.innerHTML = POLA_SVG;
    document.body.appendChild(pola.firstElementChild as Element);

    peta.current = m;
    return () => {
      m.remove();
      peta.current = null;
      lapisan.current = null;
    };
  }, [halaman]);

  // Gambar lapisan sekali. Perubahan tahun dan ukuran hanya mewarnai ulang,
  // supaya penggeser tetap mulus saat ditarik.
  useEffect(() => {
    if (halaman !== "peta" || !peta.current || !siap) return;

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
          style: () => ({
            fillColor: "#ede9dc",
            fillOpacity: 1,
            color: "#fbfaf7",
            weight: 0.7,
          }),
          onEachFeature: (fitur, ly) => {
            const p = fitur.properties as { kode: string | null; nama: string };
            const wilayah = p.kode ? siap.perKode.get(p.kode) : undefined;

            ly.on("mouseover", () => {
              (ly as L.Path).setStyle({ weight: 2.4, color: "#16181c" });
              ly.setTooltipContent(isiTooltip(p.kode, p.nama));
              ly.openTooltip();
            });
            ly.on("mouseout", () => {
              (ly as L.Path).setStyle({ weight: 0.7, color: "#fbfaf7" });
              ly.closeTooltip();
            });
            if (wilayah) ly.on("click", () => setDipilih(wilayah));
          },
        });

        l.addTo(peta.current);
        lapisan.current = l;
        perbaruiWarna();
      })
      .catch((e: unknown) => {
        if (!basi) setGalat(e instanceof Error ? e.message : "Peta gagal dimuat");
      });

    return () => {
      basi = true;
    };
  }, [halaman, siap, isiTooltip, perbaruiWarna]);

  // Warnai ulang setiap tahun atau ukuran berubah.
  useEffect(() => {
    if (halaman !== "peta") return;
    perbaruiWarna();
  }, [halaman, tahun, ukuran, ambang, perbaruiWarna]);

  // Putaran tahun otomatis.
  useEffect(() => {
    if (!sedangMain || tahun === null || daftarTahun.length === 0) return;
    const i = daftarTahun.indexOf(tahun);
    if (i < 0 || i >= daftarTahun.length - 1) {
      setSedangMain(false);
      return;
    }
    const id = window.setTimeout(() => setTahun(daftarTahun[i + 1]), JEDA_PUTAR_MS);
    return () => window.clearTimeout(id);
  }, [sedangMain, tahun, daftarTahun]);

  const putar = useCallback(() => {
    if (sedangMain) {
      setSedangMain(false);
      return;
    }
    if (daftarTahun.length === 0) return;
    // Kalau sudah di tahun terakhir, mulai lagi dari awal.
    if (tahun === daftarTahun[daftarTahun.length - 1]) setTahun(daftarTahun[0]);
    setSedangMain(true);
  }, [sedangMain, daftarTahun, tahun]);

  const pilihTahun = useCallback((t: number) => {
    setSedangMain(false);
    setTahun(t);
  }, []);

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
    <div
      className={
        dipilih && halaman === "peta" ? "aplikasi panel-terbuka" : "aplikasi"
      }
    >
      {halaman === "peta" && <div className="peta" ref={wadahPeta} />}

      {/* Merek dan pemilih ukuran ditumpuk dalam satu kolom supaya kartu
          tidak saling menimpa ketika baris navigasi halaman ikut tampil. */}
      <div className="kartu-kiri">
        <div className="merek">
          <h1>Lentera</h1>
          <p>Dampak bencana Indonesia, dengan asal data yang bisa ditelusuri</p>
          <nav className="nav-halaman" aria-label="Halaman">
            <button
              aria-current={halaman === "peta" ? "page" : undefined}
              onClick={() => setHalaman("peta")}
            >
              Peta
            </button>
            <button
              aria-current={halaman === "riwayat" ? "page" : undefined}
              onClick={() => setHalaman("riwayat")}
            >
              Riwayat
            </button>
            <button disabled title="Belum dikerjakan">
              Lapor
            </button>
            <button disabled title="Belum dikerjakan">
              Bantuan
            </button>
            <button
              aria-current={halaman === "tentang" ? "page" : undefined}
              onClick={() => setHalaman("tentang")}
            >
              Tentang
            </button>
          </nav>
        </div>

        {halaman === "peta" && (
          <nav className="ukuran" aria-label="Ukuran yang ditampilkan">
            {UKURAN_UTAMA.map((u) => (
              <button
                key={u.id}
                className={u.id === ukuran ? "aktif" : undefined}
                aria-pressed={u.id === ukuran}
                onClick={() => setUkuran(u.id)}
                disabled={!siap}
              >
                {u.label}
              </button>
            ))}
          </nav>
        )}
      </div>

      {halaman === "riwayat" && <RiwayatJatim />}
      {halaman === "tentang" && <Tentang />}

      {halaman === "peta" && (
        <>
          <PenggeserTahun
            tahun={tahun ?? daftarTahun[0] ?? 0}
            daftarTahun={daftarTahun}
            onPilih={pilihTahun}
            sedangMain={sedangMain}
            onPutar={putar}
          />

          <aside className="panel">
            {galat && <p className="galat">{galat}</p>}

            {!galat && !siap && <p className="tenang">Memuat data...</p>}

            {siap && !dipilih && (
              <>
                <p className="tenang">
                  Pilih satu wilayah di peta untuk melihat angkanya. Peta bisa
                  digeser dan diperbesar.
                </p>
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

                {nilaiDipilih === null ? (
                  <p className="angka-besar kosong">
                    Tidak ada catatan untuk {tahun}
                  </p>
                ) : (
                  <p className="angka-besar">
                    {fmt(nilaiDipilih)}
                    <span>
                      {satuan} pada {tahun}
                    </span>
                  </p>
                )}

                <p className="label-lapisan resmi">Data resmi BNPB</p>

                {rincian.length > 0 && (
                  <table className="riwayat">
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
                      <tr
                        key={r.tahun}
                        className={r.tahun === tahun ? "aktif" : undefined}
                      >
                        <th scope="row">{r.tahun}</th>
                        <td>
                          {r.nilai === null ? "tidak ada catatan" : fmt(r.nilai)}
                        </td>
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
                    <span className="contoh bergaris" />
                    data tidak tersedia
                  </span>
                  <span className="butir">
                    <span className="contoh" style={{ background: WARNA_KELAS[0] }} />0
                  </span>
                  {ambang.map((a, i) => (
                    <span className="butir" key={`${a}-${i}`}>
                      <span
                        className="contoh"
                        style={{ background: WARNA_KELAS[i + 1] }}
                      />
                      {i === 0
                        ? `1 sampai ${fmt(a)}`
                        : `${fmt(ambang[i - 1] + 1)} sampai ${fmt(a)}`}
                    </span>
                  ))}
                  <span className="butir">
                    <span
                      className="contoh"
                      style={{
                        background:
                          WARNA_KELAS[
                            Math.min(ambang.length + 1, WARNA_KELAS.length - 1)
                          ],
                      }}
                    />
                    {fmt(ambang[ambang.length - 1] + 1)} atau lebih
                  </span>
                </div>
              </div>
            )}
          </aside>

          {siap && (
            <footer className="kaki">
              <p>
                Sumber: {siap.meta.sumber.nama}, diambil {siap.meta.sumber.diambil}.
                Angka kejadian dari tabel agregat, angka korban dan kerusakan dari
                berkas statistik wilayah. Kedua tabel BNPB bisa berbeda.
              </p>
            </footer>
          )}
        </>
      )}
    </div>
  );
}
