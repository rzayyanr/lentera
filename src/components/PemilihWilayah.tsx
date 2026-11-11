/**
 * Pemilih dengan pencarian, daftar bergulir, dan animasi buka-tutup.
 *
 * Dipakai tiga tempat di halaman Bandingkan dan Riwayat: dua pemilih wilayah
 * berisi 510 kabupaten/kota, satu pemilih provinsi berisi 38 provinsi, dan
 * satu pemilih tahun berisi 15 pilihan tanpa kolom cari.
 *
 * Bentuknya mengikuti varian 1 pada sketches/005-dropdown-search: pemicu
 * berupa kartu, panel mengapung di bawahnya, daftar bergulir di dalam panel.
 *
 * Syarat aksesibilitas: fokus papan ketik berpindah ke kolom cari saat panel
 * dibuka, ↑ ↓ memindahkan pilihan, ↵ memilih, Esc menutup, dan klik di luar
 * panel juga menutupnya. Saat panel ditutup dengan animasi, fokus dikembalikan
 * ke pemicu.
 */

import { useEffect, useMemo, useRef, useState } from "react";

export interface ButirWilayah {
  kode: string;
  nama: string;
  /** Keterangan baris kedua. Boleh kosong, mis. untuk pilihan tahun. */
  sub?: string;
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
  /** Pilihan pendek tidak perlu kolom cari. */
  tanpaCari?: boolean;
  /** Teks kolom cari, kalau label pemicu tidak enak dipakai apa adanya. */
  petunjukCari?: string;
}

/** Lama animasi tutup, harus sama dengan durasi di App.css. */
const LAMA_TUTUP_MS = 130;

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
  tanpaCari = false,
  petunjukCari,
}: Props) {
  /** Panel terpasang di DOM selama animasi tutup berjalan. */
  const [terpasang, setTerpasang] = useState(false);
  const [menutup, setMenutup] = useState(false);
  const [kata, setKata] = useState("");
  const [aktif, setAktif] = useState(0);
  // Panel dibuka ke atas kalau ruang di bawah pemicu tidak cukup, dan tinggi
  // daftar dipangkas mengikuti ruang yang tersedia.
  const [arah, setArah] = useState<"bawah" | "atas">("bawah");
  const [tinggiDaftar, setTinggiDaftar] = useState<number>(264);

  const wadahRef = useRef<HTMLDivElement | null>(null);
  const pemicuRef = useRef<HTMLButtonElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const daftarRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const pewaktuRef = useRef<number | null>(null);
  // Dinaikkan hanya saat pilihan digerakkan dengan panah, supaya daftar
  // tidak langsung melompat ke pilihan aktif ketika panel baru dibuka.
  const [sinyalGulir, setSinyalGulir] = useState(0);

  const terpilih = butir.find((b) => b.kode === nilai) ?? null;

  const tersaring = useMemo(() => {
    const q = kata.trim().toLowerCase();
    if (!q) return butir;
    return butir.filter((b) =>
      `${b.nama} ${b.sub ?? ""} ${b.kode}`.toLowerCase().includes(q),
    );
  }, [butir, kata]);

  useEffect(() => {
    return () => {
      if (pewaktuRef.current !== null) window.clearTimeout(pewaktuRef.current);
    };
  }, []);

  function bukaPanel() {
    if (pewaktuRef.current !== null) {
      window.clearTimeout(pewaktuRef.current);
      pewaktuRef.current = null;
    }
    setMenutup(false);
    setTerpasang(true);
  }

  function tutupPanel(kembalikanFokus = false) {
    if (!terpasang || menutup) return;
    setMenutup(true);
    pewaktuRef.current = window.setTimeout(() => {
      setTerpasang(false);
      setMenutup(false);
      setKata("");
      pewaktuRef.current = null;
      if (kembalikanFokus) pemicuRef.current?.focus();
    }, LAMA_TUTUP_MS);
  }

  // Klik di luar menutup panel.
  useEffect(() => {
    if (!terpasang) return;
    function diLuar(e: MouseEvent) {
      if (wadahRef.current && !wadahRef.current.contains(e.target as Node)) {
        tutupPanel();
      }
    }
    document.addEventListener("mousedown", diLuar);
    return () => document.removeEventListener("mousedown", diLuar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [terpasang, menutup]);

  // Setiap kali panel dibuka: hitung arah dan tinggi, sorot pilihan aktif,
  // lalu pindahkan fokus ke kolom cari.
  useEffect(() => {
    if (!terpasang || menutup) return;
    const i = tersaring.findIndex((b) => b.kode === nilai);
    setAktif(i >= 0 ? i : 0);

    const kotak = pemicuRef.current?.getBoundingClientRect();
    if (kotak) {
      // Tinggi panel = kolom cari (48) + daftar + kaki (34) + jarak 8.
      // Pilih sisi yang menyisakan daftar paling panjang.
      const bawah = Math.min(264, window.innerHeight - kotak.bottom - 90);
      const atas = Math.min(264, kotak.top - 76 - 90);
      const keAtas = atas > bawah;
      setArah(keAtas ? "atas" : "bawah");
      setTinggiDaftar(Math.max(140, keAtas ? atas : bawah));
    }
    // Pemilih tanpa kolom cari (mis. tahun) memindahkan fokus ke panelnya
    // sendiri supaya panah atas/bawah tetap bekerja.
    if (tanpaCari) panelRef.current?.focus();
    else inputRef.current?.focus();
    // Hanya saat dibuka, bukan setiap kali penyaringan berubah.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [terpasang]);

  // Gulir hanya saat pengguna menggerakkan pilihan dengan panah.
  useEffect(() => {
    if (!sinyalGulir || !daftarRef.current) return;
    const el = daftarRef.current.querySelector<HTMLElement>(`[data-indeks="${aktif}"]`);
    el?.scrollIntoView({ block: "nearest" });
    // aktif dibaca dari render yang sama dengan sinyal, jadi tidak perlu jadi dependensi.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sinyalGulir]);

  function pilih(kode: string) {
    onPilih(kode);
    tutupPanel(true);
  }

  function tanganiTombol(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setAktif((i) => Math.min(i + 1, tersaring.length - 1));
      setSinyalGulir((v) => v + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setAktif((i) => Math.max(i - 1, 0));
      setSinyalGulir((v) => v + 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const tujuan = tersaring[aktif];
      if (tujuan) pilih(tujuan.kode);
    } else if (e.key === "Escape") {
      e.preventDefault();
      tutupPanel(true);
    }
  }

  return (
    <div className="pemilih" ref={wadahRef}>
      <button
        type="button"
        ref={pemicuRef}
        id={`${idAwalan}-pemicu`}
        className="pemilih-pemicu"
        aria-expanded={terpasang && !menutup}
        aria-controls={`${idAwalan}-panel`}
        aria-label={label}
        onClick={() => {
          if (terpasang && !menutup) tutupPanel();
          else bukaPanel();
          setKata("");
        }}
      >
        <span className={`pemilih-nilai ${terpilih ? "" : "kosong"}`}>
          {terpilih ? terpilih.nama : placeholder}
        </span>
        <svg
          className={`pemilih-panah ${terpasang && !menutup ? "terbuka" : ""}`}
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

      {terpasang && (
        <div
          className={`pemilih-panel ${arah === "atas" ? "atas" : ""} ${menutup ? "menutup" : ""}`}
          id={`${idAwalan}-panel`}
          ref={panelRef}
          tabIndex={-1}
          onKeyDown={tanganiTombol}
        >
          {!tanpaCari && (
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
                placeholder={petunjukCari ?? `Cari ${label.toLowerCase()}`}
                value={kata}
                onChange={(e) => {
                  setKata(e.target.value);
                  setAktif(0);
                }}
                aria-label={petunjukCari ?? `Cari ${label.toLowerCase()}`}
                autoComplete="off"
              />
            </div>
          )}

          <div className="pemilih-daftar" role="listbox" ref={daftarRef} style={{ maxHeight: tinggiDaftar }}>
            {tersaring.length === 0 && (
              <p className="pemilih-kosong">Tidak ada pilihan yang cocok.</p>
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
                  {b.sub && (
                    <span className="pemilih-butir-sub">
                      {b.sub} · {b.kode}
                    </span>
                  )}
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
            <span>{tanpaCari ? "↑ ↓ lalu ↵" : "↑ ↓ lalu ↵"}</span>
          </div>
        </div>
      )}
    </div>
  );
}
