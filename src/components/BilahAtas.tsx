import { useState } from "react";
import logoSvg from "../assets/icons/logo.svg";
import searchHeaderSvg from "../assets/icons/search-header.svg";

export type HalamanTipe =
  | "peta"
  | "daftar"
  | "riwayat"
  | "kejadian"
  | "lapor"
  | "masuk"
  | "bantuan"
  | "tentang"
  | "moderator"
  | "bandingkan";

interface Props {
  halaman: HalamanTipe;
  onGantiHalaman: (h: HalamanTipe) => void;
  onBukaPencarian?: () => void;
}

export default function BilahAtas({
  halaman,
  onGantiHalaman,
  onBukaPencarian,
}: Props) {
  const [menuPonselTerbuka, setMenuPonselTerbuka] = useState(false);

  const navigasi: Array<{ id: HalamanTipe; label: string; internal?: boolean }> = [
    { id: "peta", label: "Peta" },
    { id: "daftar", label: "Daftar" },
    { id: "riwayat", label: "Riwayat" },
    { id: "lapor", label: "Lapor" },
    { id: "bantuan", label: "Transparansi" },
    { id: "bandingkan", label: "Bandingkan" },
    { id: "tentang", label: "Tentang" },
  ];

  return (
    <header className="bilah-atas">
      {/* Desktop Bar */}
      <div className="bilah-atas-kontainer">
        <div className="bilah-atas-kiri" onClick={() => onGantiHalaman("peta")} role="button" tabIndex={0}>
          <img src={logoSvg} alt="Logo Lentera" className="bilah-atas-logo" width="28" height="28" />
          <span className="bilah-atas-merek">Lentera</span>
          <span className="bilah-atas-pemisah" aria-hidden="true" />
          <span className="bilah-atas-subjudul">Peta Dampak Bencana</span>
        </div>

        <nav className="bilah-atas-nav" aria-label="Navigasi Utama">
          {navigasi.map((item) => {
            if ("nonaktif" in item && item.nonaktif) {
              return (
                <span
                  key={item.id}
                  className="bilah-atas-item nonaktif"
                  title="Fitur dalam tahap pengembangan"
                >
                  {item.label}
                </span>
              );
            }
            const aktif = halaman === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`bilah-atas-item ${aktif ? "aktif" : ""}`}
                aria-current={aktif ? "page" : undefined}
                onClick={() => {
                  onGantiHalaman(item.id);
                  setMenuPonselTerbuka(false);
                }}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="bilah-atas-kanan">
          <button
            type="button"
            className="tombol-lingkar"
            onClick={onBukaPencarian}
            title="Cari wilayah"
            aria-label="Cari wilayah"
          >
            <img src={searchHeaderSvg} alt="" width="18" height="18" />
          </button>

          {/* Hamburger toggle for mobile */}
          <button
            type="button"
            className="tombol-menu-ponsel"
            onClick={() => setMenuPonselTerbuka((prev) => !prev)}
            aria-label="Buka menu navigasi"
            aria-expanded={menuPonselTerbuka}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {/* Menu dropdown ponsel */}
      {menuPonselTerbuka && (
        <div className="menu-ponsel-dropdown">
          {navigasi.map((item) => {
            const aktif = halaman === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`menu-ponsel-item ${aktif ? "aktif" : ""}`}
                onClick={() => {
                  onGantiHalaman(item.id);
                  setMenuPonselTerbuka(false);
                }}
              >
                {item.label}
              </button>
            );
          })}
          <hr className="menu-ponsel-garis" />
          <button
            type="button"
            className={`menu-ponsel-item ${halaman === "moderator" ? "aktif" : ""}`}
            onClick={() => {
              onGantiHalaman("moderator");
              setMenuPonselTerbuka(false);
            }}
          >
            Moderator (Internal)
          </button>
        </div>
      )}
    </header>
  );
}
