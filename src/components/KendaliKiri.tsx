import { useState, useRef, useEffect } from "react";
import searchInputSvg from "../assets/icons/search-input.svg";
import layersSvg from "../assets/icons/layers.svg";
import zoomInSvg from "../assets/icons/zoom-in.svg";
import zoomOutSvg from "../assets/icons/zoom-out.svg";
import type { Wilayah } from "../lib/data";

export type GayaPeta = "padat" | "relief" | "garis" | "satelit";

/** Pilihan gaya peta, urut dari yang paling ringan. */
const PILIHAN_GAYA: Array<{
  id: GayaPeta;
  nama: string;
  online?: boolean;
}> = [
  { id: "padat", nama: "Padat" },
  { id: "relief", nama: "Relief" },
  { id: "garis", nama: "Garis" },
  { id: "satelit", nama: "Satelit", online: true },
];

interface Props {
  daftarWilayah: Wilayah[];
  onPilihWilayah: (w: Wilayah) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  lapisanTampak: boolean;
  onToggleLapisan: () => void;
  gaya: GayaPeta;
  onGantiGaya: (g: GayaPeta) => void;
  /** Satelit gagal dimuat, mis. sedang tanpa jaringan. */
  satelitGagal?: boolean;
  fokusPencarianRef?: React.RefObject<HTMLInputElement | null>;
}

export default function KendaliKiri({
  daftarWilayah,
  onPilihWilayah,
  onZoomIn,
  onZoomOut,
  lapisanTampak,
  onToggleLapisan,
  gaya,
  onGantiGaya,
  satelitGagal = false,
  fokusPencarianRef,
}: Props) {
  const [kataKunci, setKataKunci] = useState("");
  const [bukaHasil, setBukaHasil] = useState(false);
  const wadahRef = useRef<HTMLDivElement | null>(null);

  const hasilSaring = kataKunci.trim().length >= 2
    ? daftarWilayah
        .filter((w) =>
          w.nama.toLowerCase().includes(kataKunci.toLowerCase()) ||
          w.kode.includes(kataKunci)
        )
        .slice(0, 8)
    : [];

  useEffect(() => {
    function klikLuar(e: MouseEvent) {
      if (wadahRef.current && !wadahRef.current.contains(e.target as Node)) {
        setBukaHasil(false);
      }
    }
    document.addEventListener("mousedown", klikLuar);
    return () => document.removeEventListener("mousedown", klikLuar);
  }, []);

  return (
    <div className="kendali-kiri" ref={wadahRef}>
      {/* Kotak Pencarian */}
      <div className="kotak-pencarian-peta">
        <div className="baris-input-pencarian">
          <img src={searchInputSvg} alt="" width="16" height="16" className="ikon-cari" />
          <input
            ref={fokusPencarianRef}
            type="text"
            className="input-cari-peta"
            placeholder="Cari kabupaten atau kota"
            value={kataKunci}
            onChange={(e) => {
              setKataKunci(e.target.value);
              setBukaHasil(true);
            }}
            onFocus={() => setBukaHasil(true)}
            aria-label="Cari kabupaten atau kota"
          />
          {kataKunci && (
            <button
              type="button"
              className="tombol-hapus-cari"
              onClick={() => {
                setKataKunci("");
                setBukaHasil(false);
              }}
              aria-label="Hapus pencarian"
            >
              ×
            </button>
          )}
        </div>

        {/* Dropdown hasil pencarian */}
        {bukaHasil && hasilSaring.length > 0 && (
          <ul className="dropdown-hasil-pencarian" role="listbox">
            {hasilSaring.map((w) => (
              <li
                key={w.kode}
                role="option"
                tabIndex={0}
                aria-selected={false}
                className="butir-hasil-pencarian"
                onClick={() => {
                  onPilihWilayah(w);
                  setKataKunci("");
                  setBukaHasil(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    onPilihWilayah(w);
                    setKataKunci("");
                    setBukaHasil(false);
                  }
                }}
              >
                <span className="hasil-nama">{w.nama}</span>
                <span className="hasil-meta">Kode BPS {w.kode}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Pemilih gaya peta */}
      <div className="kartu-gaya-peta" role="group" aria-label="Gaya peta">
        <span className="gaya-peta-label">Gaya peta</span>
        {PILIHAN_GAYA.map((g) => (
          <button
            key={g.id}
            type="button"
            className="gaya-peta-opsi"
            aria-pressed={gaya === g.id}
            onClick={() => onGantiGaya(g.id)}
            title={
              g.id === "satelit"
                ? satelitGagal
                  ? "Satelit tidak tersedia tanpa jaringan"
                  : "Satelit membutuhkan internet"
                : "Gaya " + g.nama.toLowerCase()
            }
          >
            <span className={"contoh-gaya-peta " + g.id} aria-hidden="true" />
            <span className="gaya-peta-nama">{g.nama}</span>
            {g.online && <span className="gaya-peta-tanda">online</span>}
          </button>
        ))}
        {satelitGagal && (
          <p className="gaya-peta-galat">
            Satelit butuh internet. Gaya kembali ke Padat.
          </p>
        )}
      </div>

      {/* Tombol lapisan wilayah */}
      <div className="baris-tombol-utilitas">
        <button
          type="button"
          className="tombol-ikon-peta"
          onClick={onToggleLapisan}
          title={lapisanTampak ? "Sembunyikan batas wilayah" : "Tampilkan batas wilayah"}
          aria-label="Alihkan lapisan wilayah"
        >
          <img src={layersSvg} alt="" width="18" height="18" />
        </button>
      </div>

      {/* Kontrol Zoom vertikal */}
      <div className="grup-zoom-peta">
        <button
          type="button"
          className="tombol-zoom"
          onClick={onZoomIn}
          title="Perbesar peta"
          aria-label="Perbesar peta"
        >
          <img src={zoomInSvg} alt="" width="16" height="16" />
        </button>
        <div className="garis-pemisah-zoom" aria-hidden="true" />
        <button
          type="button"
          className="tombol-zoom"
          onClick={onZoomOut}
          title="Perkecil peta"
          aria-label="Perkecil peta"
        >
          <img src={zoomOutSvg} alt="" width="16" height="16" />
        </button>
      </div>
    </div>
  );
}
