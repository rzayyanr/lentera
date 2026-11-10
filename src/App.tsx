import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  muatData,
  hitungAmbang,
  warnaUntuk,
  tahunUntuk,
  ambilNilai,
  fmt,
  UKURAN_UTAMA,
  type DataLentera,
  type Wilayah,
} from "./lib/data";
import BilahAtas, { type HalamanTipe } from "./components/BilahAtas";
import KendaliKiri from "./components/KendaliKiri";
import LegendaPeta from "./components/LegendaPeta";
import PanelRingkasan from "./components/PanelRingkasan";
import PanelDetail from "./components/PanelDetail";
import PonselRingkasan from "./components/PonselRingkasan";
import PonselDetail from "./components/PonselDetail";
import DaftarWilayah from "./components/DaftarWilayah";
import RiwayatJatim from "./components/RiwayatJatim";
import DetailKejadian from "./components/DetailKejadian";
import LaporanWarga from "./components/LaporanWarga";
import TransparansiBantuan from "./components/TransparansiBantuan";
import Tentang from "./components/Tentang";
import Moderator from "./components/Moderator";
import BandingkanWilayah from "./components/BandingkanWilayah";
import PenggeserTahun from "./components/PenggeserTahun";
import "./App.css";

interface FiturPeta {
  type: "Feature";
  properties: { kode: string | null; nama: string };
  geometry: GeoJSON.Geometry;
}

const JEDA_PUTAR_MS = 650;

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
  const inputCariRef = useRef<HTMLInputElement | null>(null);
  // Lapisan per kode wilayah, dipakai untuk mengambil batas wilayah saat
  // kamera peta harus mengikuti pilihan.
  const lapisPerKode = useRef(new Map<string, L.Polygon>());
  // Salinan penangan kamera terbaru, supaya penangan klik pada lapisan
  // GeoJSON tidak perlu dipasang ulang setiap kali panel dibuka atau ditutup.
  const terbangRef = useRef<((w: Wilayah) => void) | null>(null);
  // Wilayah yang dipilih dari halaman lain. Peta baru ada setelah halaman
  // peta dipasang, jadi penerbangan kamera ditunda sampai lapisan siap.
  const terbangTertunda = useRef<Wilayah | null>(null);

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
  const [lapisanTampak, setLapisanTampak] = useState(true);
  const [panelRingkasanTutup, setPanelRingkasanTutup] = useState(false);

  const [halaman, setHalaman] = useState<HalamanTipe>(() => {
    const hal = new URLSearchParams(window.location.search).get("hal") as HalamanTipe | null;
    const daftarValid: HalamanTipe[] = [
      "peta",
      "daftar",
      "riwayat",
      "kejadian",
      "lapor",
      "masuk",
      "bantuan",
      "tentang",
      "moderator",
      "bandingkan",
    ];
    if (hal && daftarValid.includes(hal)) return hal;
    return "peta";
  });

  const [idKejadian, setIdKejadian] = useState<string>(() => {
    return new URLSearchParams(window.location.search).get("kejadian") || "37410";
  });

  const [lebarLayar, setLebarLayar] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 1200
  );

  const kodeAwal = useRef(new URLSearchParams(window.location.search).get("kode"));
  const ukuranAwal = useRef(new URLSearchParams(window.location.search).get("ukuran"));
  const tahunAwal = useRef(new URLSearchParams(window.location.search).get("tahun"));

  useEffect(() => {
    function onResize() {
      setLebarLayar(window.innerWidth);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const adalahPonsel = lebarLayar <= 768;

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

  // Sinkronisasi state ke parameter URL
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

  const { ambang, maxNilai } = useMemo(() => {
    if (!siap || tahun === null) return { ambang: [1, 2, 3, 4, 5], maxNilai: 128 };
    const nilai: number[] = [];
    let max = 0;
    for (const w of siap.wilayah) {
      const v = ambilNilai(siap, w.kode, tahun, ukuran);
      if (v !== null) {
        nilai.push(v);
        if (v > max) max = v;
      }
    }
    return { ambang: hitungAmbang(nilai), maxNilai: max };
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

  const perbaruiWarna = useCallback(() => {
    const l = lapisan.current;
    if (!l) return;
    l.eachLayer((lapis) => {
      const jalur = lapis as L.Path & { feature?: FiturPeta };
      const kode = jalur.feature?.properties.kode ?? null;
      const { warna } = hitung(kode);
      jalur.setStyle({
        fillColor: warna,
        fillOpacity: 1,
        color: "#fbfaf7",
        weight: 0.7,
      });
      const el = jalur.getElement() as SVGPathElement | undefined;
      if (el) {
        el.setAttribute(
          "fill",
          kode && hitung(kode).nilai !== null ? warna : "url(#lentera-garis)"
        );
      }
    });
  }, [hitung]);

  // Siapkan Leaflet Map saat masuk halaman peta
  useEffect(() => {
    if (halaman !== "peta" || !wadahPeta.current || peta.current) return;

    const m = L.map(wadahPeta.current, {
      zoomControl: false,
      minZoom: 3,
      maxZoom: 9,
      zoomSnap: 0.25,
    }).setView([-2.5, 118], 4.75);

    m.attributionControl.setPrefix(false);
    m.attributionControl.addAttribution(
      'Batas: <a href="https://www.geoboundaries.org/">geoBoundaries</a> | Data: <a href="https://data.bnpb.go.id/">BNPB</a>',
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

  // Gambar GeoJSON sekali
  useEffect(() => {
    if (halaman !== "peta" || !peta.current || !siap) return;

    let basi = false;
    if (lapisan.current) {
      lapisan.current.remove();
      lapisan.current = null;
    }
    lapisPerKode.current.clear();

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
            if (wilayah) {
              lapisPerKode.current.set(wilayah.kode, ly as L.Polygon);
              ly.on("click", () => {
                setDipilih(wilayah);
                setPanelRingkasanTutup(false);
                terbangRef.current?.(wilayah);
              });
            }
          },
        });

        l.addTo(peta.current);
        lapisan.current = l;
        perbaruiWarna();

        const tertunda = terbangTertunda.current;
        if (tertunda) {
          terbangTertunda.current = null;
          terbangRef.current?.(tertunda);
        }
      })
      .catch((e: unknown) => {
        if (!basi) setGalat(e instanceof Error ? e.message : "Peta gagal dimuat");
      });

    return () => {
      basi = true;
    };
  }, [halaman, siap, isiTooltip, perbaruiWarna]);

  useEffect(() => {
    if (halaman !== "peta") return;
    perbaruiWarna();
  }, [halaman, tahun, ukuran, ambang, perbaruiWarna]);

  // Putaran tahun otomatis
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
    if (tahun === daftarTahun[daftarTahun.length - 1]) setTahun(daftarTahun[0]);
    setSedangMain(true);
  }, [sedangMain, daftarTahun, tahun]);

  const pilihTahun = useCallback((t: number) => {
    setSedangMain(false);
    setTahun(t);
  }, []);

  /* Kamera peta mengikuti wilayah yang dipilih.

     Tiap wilayah berbeda ukuran, jadi zoom dihitung dari batas wilayah, bukan
     dipaku di satu angka: kabupaten kecil dan provinsi besar dapat jarak
     kamera yang berbeda.

     flyToBounds saja tidak cukup, karena ia memusatkan wilayah di tengah
     layar penuh, padahal separuh kanan layar tertutup panel 420px. Karena itu
     titik tujuan dihitung sendiri: wilayah dipusatkan pada kotak yang tidak
     tertutup kartu mengapung, lalu flyTo menganimasikan geser dan zoom
     sekaligus sepanjang busur. */
  const terbangKeWilayah = useCallback(
    (w: Wilayah) => {
      const m = peta.current;
      const lapis = lapisPerKode.current.get(w.kode);
      if (!m || !lapis) return;

      const batas = lapis.getBounds();
      if (!batas.isValid()) return;

      const kurangiGerak = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const panelTerbuka = !adalahPonsel && !panelRingkasanTutup;

      const tepiKiri = adalahPonsel ? L.point(16, 76) : L.point(40, 104);
      const tepiKanan = adalahPonsel
        ? L.point(16, 300)
        : L.point(panelTerbuka ? 460 : 40, 200);
      const maxZoom = 7.25;

      const zoom = Math.min(m.getBoundsZoom(batas, false, tepiKiri.add(tepiKanan)), maxZoom);

      // Wilayah yang sudah terlihat utuh pada jarak kamera yang sama tidak
      // perlu dianimasikan: menggeser kamera tanpa mengubah apa pun hanya
      // membuat pembaca kehilangan jangkar.
      const sudahPas =
        Math.abs(zoom - m.getZoom()) < 0.5 && m.getBounds().pad(-0.1).contains(batas);
      if (sudahPas) return;

      const ukuran = m.getSize();
      const pusatKotakBebas = L.point(
        (tepiKiri.x + (ukuran.x - tepiKanan.x)) / 2,
        (tepiKiri.y + (ukuran.y - tepiKanan.y)) / 2,
      );
      const geser = L.point(
        ukuran.x / 2 - pusatKotakBebas.x,
        ukuran.y / 2 - pusatKotakBebas.y,
      );
      const tujuan = m.unproject(m.project(batas.getCenter(), zoom).add(geser), zoom);

      if (kurangiGerak) m.setView(tujuan, zoom, { animate: false });
      else m.flyTo(tujuan, zoom, { duration: 0.9, easeLinearity: 0.22 });
    },
    [adalahPonsel, panelRingkasanTutup],
  );

  useEffect(() => {
    terbangRef.current = terbangKeWilayah;
  }, [terbangKeWilayah]);

  const tanganiPilihWilayah = useCallback((w: Wilayah) => {
    setDipilih(w);
    setPanelRingkasanTutup(false);
    if (halaman !== "peta") {
      // Peta belum terpasang; kamera menyusul setelah lapisan wilayah siap.
      terbangTertunda.current = w;
      setHalaman("peta");
      return;
    }
    terbangRef.current?.(w);
  }, [halaman]);

  return (
    <div className={`aplikasi ${dipilih && !adalahPonsel ? "panel-terbuka" : ""}`}>
      {/* 1. Bilah Atas Global (Desktop & Mobile) */}
      <BilahAtas
        halaman={halaman}
        onGantiHalaman={(h) => {
          setHalaman(h);
        }}
        onBukaPencarian={() => {
          if (halaman !== "peta") setHalaman("peta");
          setTimeout(() => inputCariRef.current?.focus(), 100);
        }}
      />

      {/* 2. Peta & Layar Utama (01 & 02) */}
      {halaman === "peta" && (
        <main className="panggung-peta-wadah">
          <div className="peta" ref={wadahPeta} />

          {/* Kendali Kiri: Pencarian autocomplete, layer toggle, zoom */}
          {siap && (
            <KendaliKiri
              daftarWilayah={siap.wilayah}
              onPilihWilayah={tanganiPilihWilayah}
              onZoomIn={() => peta.current?.zoomIn()}
              onZoomOut={() => peta.current?.zoomOut()}
              lapisanTampak={lapisanTampak}
              onToggleLapisan={() => {
                if (lapisan.current && peta.current) {
                  if (lapisanTampak) lapisan.current.remove();
                  else lapisan.current.addTo(peta.current);
                  setLapisanTampak(!lapisanTampak);
                }
              }}
              onToggleLabel={() => {
                perbaruiWarna();
              }}
              fokusPencarianRef={inputCariRef}
            />
          )}

          {/* Legenda Tingkat Kejadian (Kiri Bawah) */}
          {siap && (
            <LegendaPeta
              labelUkuran={labelUkuran}
              tahun={tahun ?? daftarTahun[0] ?? 2024}
              ambang={ambang}
              maxNilai={maxNilai}
            />
          )}

          {/* Penggeser Waktu (Tengah Bawah) */}
          <PenggeserTahun
            tahun={tahun ?? daftarTahun[0] ?? 0}
            daftarTahun={daftarTahun}
            onPilih={pilihTahun}
            sedangMain={sedangMain}
            onPutar={putar}
          />

          {/* DESKTOP PANELS: 01 Ringkasan Nasional ATAU 02 Detail Wilayah */}
          {!adalahPonsel && siap && (
            <>
              {!dipilih && !panelRingkasanTutup && (
                <PanelRingkasan
                  siap={siap}
                  tahun={tahun ?? 2024}
                  ukuran={ukuran}
                  onPilihWilayah={tanganiPilihWilayah}
                  onTutup={() => setPanelRingkasanTutup(true)}
                />
              )}

              {dipilih && (
                <PanelDetail
                  wilayah={dipilih}
                  siap={siap}
                  tahun={tahun ?? 2024}
                  ukuran={ukuran}
                  onPilihTahun={pilihTahun}
                  onKembali={() => setDipilih(null)}
                  onTutup={() => setDipilih(null)}
                  onBukaRiwayatJatim={() => setHalaman("riwayat")}
                  onBukaTransparansi={() => setHalaman("bantuan")}
                />
              )}

              {panelRingkasanTutup && !dipilih && (
                <button
                  type="button"
                  className="tombol-buka-panel-ringkasan"
                  onClick={() => setPanelRingkasanTutup(false)}
                >
                  Buka Ringkasan Nasional
                </button>
              )}
            </>
          )}

          {/* MOBILE BOTTOM SHEETS: 03 Ponsel Ringkasan ATAU 04 Ponsel Detail */}
          {adalahPonsel && siap && (
            <>
              {!dipilih && (
                <PonselRingkasan
                  siap={siap}
                  tahun={tahun ?? 2024}
                  onPilihWilayah={tanganiPilihWilayah}
                />
              )}

              {dipilih && (
                <PonselDetail
                  wilayah={dipilih}
                  siap={siap}
                  tahun={tahun ?? 2024}
                  ukuran={ukuran}
                  onPilihUkuran={(uk) => setUkuran(uk)}
                  onPilihTahun={pilihTahun}
                  onTutup={() => setDipilih(null)}
                />
              )}
            </>
          )}

          {galat && <p className="pesan-galat-peta">{galat}</p>}
        </main>
      )}

      {/* 3. Screen 03: Daftar Wilayah */}
      {halaman === "daftar" && siap && (
        <DaftarWilayah
          siap={siap}
          tahun={tahun ?? 2024}
          onPilihWilayah={tanganiPilihWilayah}
        />
      )}

      {/* 4. Screen 04: Riwayat Kejadian Jawa Timur */}
      {halaman === "riwayat" && (
        <RiwayatJatim
          onPilihKejadian={(id) => {
            setIdKejadian(id);
            setHalaman("kejadian");
          }}
        />
      )}

      {/* 5. Screen 05: Detail Kejadian */}
      {halaman === "kejadian" && (
        <DetailKejadian
          idKejadian={idKejadian}
          onKembali={() => setHalaman("riwayat")}
        />
      )}

      {/* 6. Screens 06, 06a, 07, 08: Laporan Warga & Autentikasi Pelapor */}
      {(halaman === "lapor" || halaman === "masuk") && (
        <LaporanWarga
          subHalamanAwal={halaman === "masuk" ? "masuk" : "beranda"}
          onKembaliKePeta={() => setHalaman("peta")}
        />
      )}

      {/* 7. Screens 09, 10, 11: Transparansi Bantuan */}
      {halaman === "bantuan" && (
        <TransparansiBantuan onBukaLapor={() => setHalaman("lapor")} />
      )}

      {/* 8. Screens 12, 13, 14, 15: Tentang dan Sumber Data */}
      {halaman === "tentang" && <Tentang />}

      {/* 9. Screens 16, 17: Moderator (Internal) */}
      {halaman === "moderator" && <Moderator />}

      {/* 10. Screen 18: Bandingkan Wilayah dan Tahun */}
      {halaman === "bandingkan" && <BandingkanWilayah siap={siap} />}
    </div>
  );
}
