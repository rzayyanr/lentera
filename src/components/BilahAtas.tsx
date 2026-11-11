import { useState } from "react";
import logoSvg from "../assets/icons/logo.svg";
import searchHeaderSvg from "../assets/icons/search-header.svg";
import { inisial, type PenggunaPelapor } from "../lib/layananLaporan";

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
  pengguna?: PenggunaPelapor | null;
  onKeluar?: () => void;
}

export default function BilahAtas({
  halaman,
  onGantiHalaman,
  onBukaPencarian,
  pengguna,
  onKeluar,
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
            const aktif =
              halaman === item.id ||
              (item.id === "lapor" && halaman === "moderator");
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

          {/* Chip Akun (Mockup Variasi 1) */}
          {pengguna && (
            <div className="akun-baris topbar-akun" id="chipAkun">
              <span className="avatar kecil" id="chipInisial">
                {inisial(pengguna.nama)}
              </span>
              <div className="topbar-akun-teks">
                <p className="nama" id="chipNama">{pengguna.nama}</p>
                <p className="email" id="chipEmail">{pengguna.email}</p>
              </div>
              <button
                className="btn btn-ghost btn-small"
                type="button"
                onClick={onKeluar}
                title="Keluar dari akun"
              >
                Keluar
              </button>
            </div>
          )}

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
          {pengguna && (
            <div className="menu-ponsel-akun-baris">
              <div className="akun-baris">
                <span className="avatar kecil">{inisial(pengguna.nama)}</span>
                <div>
                  <p className="nama" style={{ margin: 0, fontWeight: 700, fontSize: "13px" }}>{pengguna.nama}</p>
                  <p className="email" style={{ margin: 0, color: "var(--warna-redup)", fontSize: "11px" }}>{pengguna.email}</p>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-small"
                style={{ marginTop: "8px", paddingLeft: 0, justifyContent: "flex-start" }}
                onClick={() => {
                  onKeluar?.();
                  setMenuPonselTerbuka(false);
                }}
              >
                Keluar dari akun
              </button>
              <hr className="menu-ponsel-garis" />
            </div>
          )}

          {navigasi.map((item) => {
            const aktif =
              halaman === item.id ||
              (item.id === "lapor" && halaman === "moderator");
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
