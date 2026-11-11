/**
 * Pemilih tanggal bergaya kartu, pengganti `<input type="date">`.
 *
 * Kontrol bawaan browser memakai tampilan sistem: ikon, format, dan kalender
 * popup tidak bisa diseragamkan dengan sisa formulir. Komponen ini memakai
 * pemicu yang sama dengan PemilihWilayah (kelas `pemilih-pemicu`) dan panel
 * kalender sendiri, jadi warnanya ikut token Lentera.
 *
 * Aturan:
 * - Minggu dimulai hari Senin; tanggal setelah `maks` tidak bisa dipilih.
 * - Panah memindahkan sorotan, ↵ memilih, Esc menutup, klik di luar menutup.
 * - Fokus kembali ke pemicu setiap panel ditutup dari papan ketik.
 */

import { useEffect, useRef, useState } from "react";
import { isoLokal } from "../lib/tanggal";

interface Props {
  id: string;
  nilai: string;
  onPilih: (iso: string) => void;
  /** Batas atas, format YYYY-MM-DD. Tanggal sesudahnya dinonaktifkan. */
  maks?: string;
  label: string;
}

const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const NAMA_HARI = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

/** Lama animasi tutup, harus sama dengan durasi di App.css. */
const LAMA_TUTUP_MS = 130;

function dariIso(iso: string): Date | null {
  const cocok = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!cocok) return null;
  const d = new Date(Number(cocok[1]), Number(cocok[2]) - 1, Number(cocok[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

function tulisPanjang(iso: string): string {
  const d = dariIso(iso);
  if (!d) return "";
  return `${d.getDate()} ${NAMA_BULAN[d.getMonth()]} ${d.getFullYear()}`;
}

interface Sel {
  iso: string;
  tanggal: number;
  /** Bulan ini, bukan bulan sebelum/sesudah yang ikut tampil sebagai pengisi. */
  bulanIni: boolean;
  nonaktif: boolean;
}

export default function PemilihTanggal({
  id,
  nilai,
  onPilih,
  maks,
  label,
}: Props) {
  const batas = maks ?? isoLokal(new Date());
  const terpilih = dariIso(nilai);

  const [terpasang, setTerpasang] = useState(false);
  const [menutup, setMenutup] = useState(false);
  const [keAtas, setKeAtas] = useState(false);
  /** Bulan yang sedang ditampilkan, tanggal 1. */
  const [bulan, setBulan] = useState<Date>(() => {
    const dasar = terpilih ?? dariIso(batas) ?? new Date();
    return new Date(dasar.getFullYear(), dasar.getMonth(), 1);
  });

  const wadahRef = useRef<HTMLDivElement | null>(null);
  const pemicuRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const pewaktuRef = useRef<number | null>(null);

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
    const dasar = terpilih ?? dariIso(batas) ?? new Date();
    setBulan(new Date(dasar.getFullYear(), dasar.getMonth(), 1));
    const kotak = pemicuRef.current?.getBoundingClientRect();
    if (kotak) setKeAtas(kotak.bottom + 340 > window.innerHeight && kotak.top > 340);
    setMenutup(false);
    setTerpasang(true);
  }

  function tutupPanel(kembalikanFokus = false) {
    if (!terpasang || menutup) return;
    setMenutup(true);
    pewaktuRef.current = window.setTimeout(() => {
      setTerpasang(false);
      setMenutup(false);
      pewaktuRef.current = null;
      if (kembalikanFokus) pemicuRef.current?.focus();
    }, LAMA_TUTUP_MS);
  }

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

  // Fokus pindah ke tanggal terpilih (atau hari ini) saat panel terbuka,
  // supaya tombol panah langsung bekerja.
  useEffect(() => {
    if (!terpasang || menutup) return;
    panelRef.current?.focus();
  }, [terpasang, menutup]);

  const sel: Sel[] = [];
  {
    const awalBulan = new Date(bulan.getFullYear(), bulan.getMonth(), 1);
    const geser = (awalBulan.getDay() + 6) % 7; // Senin = 0
    const mulai = new Date(awalBulan);
    mulai.setDate(1 - geser);
    for (let i = 0; i < 42; i++) {
      const d = new Date(mulai);
      d.setDate(mulai.getDate() + i);
      const iso = isoLokal(d);
      sel.push({
        iso,
        tanggal: d.getDate(),
        bulanIni: d.getMonth() === bulan.getMonth(),
        nonaktif: iso > batas,
      });
    }
  }

  function geserBulan(langkah: number) {
    setBulan((b) => new Date(b.getFullYear(), b.getMonth() + langkah, 1));
  }

  function pilih(iso: string) {
    onPilih(iso);
    tutupPanel(true);
  }

  function tanganiTombol(e: React.KeyboardEvent) {
    const dasar = dariIso(nilai) ?? dariIso(batas) ?? new Date();
    if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const langkah =
        e.key === "ArrowLeft" ? -1 : e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" ? -7 : 7;
      const tujuan = new Date(dasar);
      tujuan.setDate(dasar.getDate() + langkah);
      const iso = isoLokal(tujuan);
      if (iso > batas) return;
      setBulan(new Date(tujuan.getFullYear(), tujuan.getMonth(), 1));
      onPilih(iso);
    } else if (e.key === "PageUp" || e.key === "PageDown") {
      e.preventDefault();
      geserBulan(e.key === "PageUp" ? -1 : 1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      pilih(nilai && nilai <= batas ? nilai : batas);
    } else if (e.key === "Escape") {
      e.preventDefault();
      tutupPanel(true);
    }
  }

  return (
    <div className="pemilih pemilih-tanggal" ref={wadahRef}>
      <button
        type="button"
        ref={pemicuRef}
        id={id}
        className="pemilih-pemicu"
        aria-haspopup="dialog"
        aria-expanded={terpasang && !menutup}
        aria-controls={`${id}-panel`}
        aria-label={label}
        onClick={() => (terpasang && !menutup ? tutupPanel() : bukaPanel())}
      >
        <span className="pemilih-ikon-tanggal" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <rect x="3" y="5" width="18" height="16" rx="2.5" />
            <path d="M3 10h18M8 3v3M16 3v3" />
          </svg>
        </span>
        <span className={"pemilih-nilai" + (nilai ? "" : " kosong")}>
          {nilai ? tulisPanjang(nilai) : "Pilih tanggal kejadian"}
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
          className={`pemilih-panel panel-kalender ${keAtas ? "atas" : ""} ${menutup ? "menutup" : ""}`}
          id={`${id}-panel`}
          ref={panelRef}
          tabIndex={-1}
          role="dialog"
          aria-label={label}
          onKeyDown={tanganiTombol}
        >
          <div className="kalender-kepala">
            <button
              type="button"
              className="kalender-navigasi"
              onClick={() => geserBulan(-1)}
              aria-label="Bulan sebelumnya"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <span className="kalender-judul" aria-live="polite">
              {NAMA_BULAN[bulan.getMonth()]} {bulan.getFullYear()}
            </span>
            <button
              type="button"
              className="kalender-navigasi"
              onClick={() => geserBulan(1)}
              aria-label="Bulan berikutnya"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>

          <div className="kalender-hari">
            {NAMA_HARI.map((h) => (
              <span key={h}>{h}</span>
            ))}
          </div>

          <div className="kalender-kisi" role="grid">
            {sel.map((s) => {
              const terpilihIni = s.iso === nilai;
              const hariIni = s.iso === isoLokal(new Date());
              return (
                <button
                  key={s.iso}
                  type="button"
                  role="gridcell"
                  className={[
                    "kalender-sel",
                    s.bulanIni ? "" : "luar",
                    terpilihIni ? "terpilih" : "",
                    hariIni ? "hari-ini" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  disabled={s.nonaktif}
                  aria-selected={terpilihIni}
                  aria-label={`${s.tanggal} ${NAMA_BULAN[bulan.getMonth()]} ${bulan.getFullYear()}`}
                  tabIndex={terpilihIni || (!nilai && hariIni) ? 0 : -1}
                  onClick={() => pilih(s.iso)}
                >
                  {s.tanggal}
                </button>
              );
            })}
          </div>

          <div className="kalender-kaki">
            <button
              type="button"
              className="kalender-pintasan"
              onClick={() => pilih(isoLokal(new Date()) <= batas ? isoLokal(new Date()) : batas)}
            >
              Hari ini
            </button>
            <span>Paling lambat {tulisPanjang(batas)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
