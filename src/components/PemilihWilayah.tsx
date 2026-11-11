/**
 * Pemilih wilayah dengan pencarian dan daftar bergulir.
 *
 * Menggantikan <select> bawaan pada dua tempat yang daftarnya terlalu panjang
 * untuk digulir tanpa pencarian: pemilih provinsi di halaman Riwayat, dan
 * pemilih wilayah A/B di halaman Bandingkan.
 *
 * Bentuknya mengikuti varian 1 pada sketches/005-dropdown-search: pemicu
 * berupa kartu, panel mengapung di bawahnya, daftar bergulir di dalam panel.
 *
 * Syarat aksesibilitas: fokus papan ketik berpindah ke kolom cari saat panel
 * dibuka, ↑ ↓ memindahkan pilihan, ↵ memilih, Esc menutup, dan klik di luar
 * panel juga menutupnya.
 */

import { useEffect, useMemo, useRef, useState } from "react";

export interface ButirWilayah {
  kode: string;
  nama: string;
  /** Keterangan baris kedua, mis. nama provinsi. */
  sub: string;
}

interface Props {
  butir: ButirWilayah[];
  nilai: string;
  onPilih: (kode: string) => void;
  placeholder: string;
  /** Dipakai untuk aria-label pemicu dan kolom cari. */
  label: string;
  /** Awalan id unik kalau satu halaman memakai lebih dari satu pemilih. */
  idAwalan: string;
}

function Sorot({ teks, kata }: { teks: string; kata: string }) {
  const q = kata.trim();
  if (!q) return <>{teks}</>;
  const i = teks.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return <>{teks}</>;
  return (
    <>
      {teks.slice(0, i)}
      <mark className="pemilih-sorot">{teks.slice(i, i + q.length)}</mark>
      {teks.slice(i + q.length)}
    </>
  );
}

export default function PemilihWilayah({
  butir,
  nilai,
  onPilih,
  placeholder,
  label,
  idAwalan,
}: Props) {
  const [buka, setBuka] = useState(false);
  // Panel dibuka ke atas kalau ruang di bawah pemicu tidak cukup, dan tinggi
  // daftar dipangkas mengikuti ruang yang tersedia.
  const [arah, setArah] = useState<"bawah" | "atas">("bawah");
  const [tinggiDaftar, setTinggiDaftar] = useState<number>(264);
  const [kata, setKata] = useState("");
  const [aktif, setAktif] = useState(0);
  const wadahRef = useRef<HTMLDivElement | null>(null);
  const pemicuRef = useRef<HTMLButtonElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const daftarRef = useRef<HTMLDivElement | null>(null);

  const terpilih = butir.find((b) => b.kode === nilai) ?? null;

  const tersaring = useMemo(() => {
    const q = kata.trim().toLowerCase();
    if (!q) return butir;
    return butir.filter((b) =>
      `${b.nama} ${b.sub} ${b.kode}`.toLowerCase().includes(q),
    );
  }, [butir, kata]);

  // Tutup saat klik di luar panel.
  useEffect(() => {
    if (!buka) return;
    function diLuar(e: MouseEvent) {
      if (wadahRef.current && !wadahRef.current.contains(e.target as Node)) {
        setBuka(false);
      }
    }
    document.addEventListener("mousedown", diLuar);
    return () => document.removeEventListener("mousedown", diLuar);
  }, [buka]);

  // Fokus ke kolom cari dan sorot butir terpilih setiap kali panel dibuka.
  useEffect(() => {
    if (!buka) return;
    const i = tersaring.findIndex((b) => b.kode === nilai);
    setAktif(i >= 0 ? i : 0);
    // Panel setinggi kolom cari (48) + daftar + kaki (34) + jarak 8.
    // Pilih sisi yang menyisakan daftar paling panjang, dan pangkas daftarnya
    // supaya panel selalu muat di layar.
    const kotak = pemicuRef.current?.getBoundingClientRect();
    if (kotak) {
      const bawah = Math.min(264, window.innerHeight - kotak.bottom - 90);
      const atas = Math.min(264, kotak.top - 76 - 90);
      const keAtas = atas > bawah;
      setArah(keAtas ? "atas" : "bawah");
      setTinggiDaftar(Math.max(140, keAtas ? atas : bawah));
    }
    inputRef.current?.focus();
    // Hanya saat dibuka, bukan setiap kali penyaringan berubah.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buka]);

  // Jaga butir aktif tetap terlihat saat digerakkan dengan panah.
  useEffect(() => {
    if (!buka || !daftarRef.current) return;
    const el = daftarRef.current.querySelector<HTMLElement>(`[data-indeks="${aktif}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [aktif, buka]);

  function pilih(kode: string) {
    onPilih(kode);
    setBuka(false);
    setKata("");
  }

  function tanganiTombol(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setAktif((i) => Math.min(i + 1, tersaring.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setAktif((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const tujuan = tersaring[aktif];
      if (tujuan) pilih(tujuan.kode);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setBuka(false);
      setKata("");
    }
  }

  return (
    <div className="pemilih" ref={wadahRef}>
      <button
        type="button"
        ref={pemicuRef}
        id={`${idAwalan}-pemicu`}
        className="pemilih-pemicu"
        aria-expanded={buka}
        aria-controls={`${idAwalan}-panel`}
        aria-label={label}
        onClick={() => {
          setBuka((b) => !b);
          setKata("");
        }}
      >
        <span className={`pemilih-nilai ${terpilih ? "" : "kosong"}`}>
          {terpilih ? terpilih.nama : placeholder}
        </span>
        <svg
          className="pemilih-panah"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {buka && (
        <div className={`pemilih-panel ${arah === "atas" ? "atas" : ""}`} id={`${idAwalan}-panel`}>
          <div className="pemilih-cari">
            <svg
              className="pemilih-cari-ikon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              className="pemilih-input"
              placeholder={`Cari ${label.toLowerCase()}`}
              value={kata}
              onChange={(e) => {
                setKata(e.target.value);
                setAktif(0);
              }}
              onKeyDown={tanganiTombol}
              aria-label={`Cari ${label.toLowerCase()}`}
              autoComplete="off"
            />
          </div>

          <div className="pemilih-daftar" role="listbox" ref={daftarRef} style={{ maxHeight: tinggiDaftar }}>
            {tersaring.length === 0 && (
              <p className="pemilih-kosong">Tidak ada wilayah yang cocok.</p>
            )}
            {tersaring.map((b, i) => (
              <button
                key={b.kode}
                type="button"
                data-indeks={i}
                role="option"
                aria-selected={b.kode === nilai}
                className={`pemilih-butir ${i === aktif ? "aktif" : ""}`}
                onMouseEnter={() => setAktif(i)}
                onClick={() => pilih(b.kode)}
              >
                <span className="pemilih-butir-isi">
                  <span className="pemilih-butir-nama">
                    <Sorot teks={b.nama} kata={kata} />
                  </span>
                  <span className="pemilih-butir-sub">
                    {b.sub} · {b.kode}
                  </span>
                </span>
                <svg
                  className="pemilih-centang"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </button>
            ))}
          </div>

          <div className="pemilih-kaki">
            <span>{tersaring.length} hasil</span>
            <span>↑ ↓ lalu ↵</span>
          </div>
        </div>
      )}
    </div>
  );
}
