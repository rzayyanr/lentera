/**
 * Halaman Daftar wilayah, bentuk daftar + detail.
 *
 * Daftar 510 kabupaten/kota di kiri, riwayat 15 tahun wilayah terpilih di
 * kanan. Bentuknya mengikuti varian 3 pada
 * sketches/006-daftar-wilayah/index.html.
 *
 * Penyaring provinsi dan urutan memakai PemilihWilayah yang sama dengan
 * halaman Bandingkan, jadi gaya dan animasinya konsisten.
 */

import { useMemo, useRef, useState } from "react";
import searchInputSvg from "../assets/icons/search-input.svg";
import PemilihWilayah from "./PemilihWilayah";
import {
  fmt,
  namaProvinsiRapi,
  namaWilayahRapi,
  type DataLentera,
  type Wilayah,
} from "../lib/data";

interface Props {
  siap: DataLentera;
  tahun: number;
  onPilihWilayah: (w: Wilayah) => void;
}

type Urutan = "tinggi" | "rendah" | "nama" | "kode";

const PILIHAN_URUTAN: Array<{ kode: Urutan; nama: string }> = [
  { kode: "tinggi", nama: "Kejadian tertinggi" },
  { kode: "rendah", nama: "Kejadian terendah" },
  { kode: "nama", nama: "Nama (A–Z)" },
  { kode: "kode", nama: "Kode BPS" },
];

export default function DaftarWilayah({ siap, tahun, onPilihWilayah }: Props) {
  const [pencarian, setPencarian] = useState("");
  const [saringProvinsi, setSaringProvinsi] = useState("semua");
  const [urutan, setUrutan] = useState<Urutan>("tinggi");
  const [kodeTerpilih, setKodeTerpilih] = useState<string | null>(null);
  const detailRef = useRef<HTMLElement | null>(null);

  const iTahun = siap.meta.tahun.indexOf(tahun);

  const daftarLengkap = useMemo(() => {
    const namaProv = new Map(
      siap.provinsi.map((p) => [p.kode, namaProvinsiRapi(p.nama)]),
    );
    return siap.wilayah.map((w) => ({
      wilayah: w,
      nilai: iTahun >= 0 ? (w.nilai[iTahun] ?? 0) : 0,
      namaProvinsi: namaProv.get(w.prov) ?? "Provinsi",
    }));
  }, [siap, iTahun]);

  const butirProvinsi = useMemo(() => {
    const jumlah = new Map<string, number>();
    for (const w of siap.wilayah) {
      jumlah.set(w.prov, (jumlah.get(w.prov) ?? 0) + 1);
    }
    return [
      { kode: "semua", nama: "Semua provinsi", sub: `${siap.wilayah.length} kabupaten/kota` },
      ...siap.provinsi
        .slice()
        .sort((a, b) => a.nama.localeCompare(b.nama, "id"))
        .map((p) => ({
          kode: p.kode,
          nama: namaProvinsiRapi(p.nama),
          sub: `${jumlah.get(p.kode) ?? 0} kabupaten/kota`,
        })),
    ];
  }, [siap]);

  const butirUrutan = useMemo(
    () => PILIHAN_URUTAN.map((u) => ({ kode: u.kode, nama: u.nama })),
    [],
  );

  const daftarTersaring = useMemo(() => {
    const q = pencarian.trim().toLowerCase();
    let hasil = daftarLengkap;

    if (q) {
      hasil = hasil.filter(
        (item) =>
          item.wilayah.nama.toLowerCase().includes(q) ||
          item.wilayah.kode.includes(q) ||
          item.namaProvinsi.toLowerCase().includes(q),
      );
    }
    if (saringProvinsi !== "semua") {
      hasil = hasil.filter((item) => item.wilayah.prov === saringProvinsi);
    }

    const disalin = [...hasil];
    if (urutan === "tinggi") disalin.sort((a, b) => b.nilai - a.nilai);
    else if (urutan === "rendah") disalin.sort((a, b) => a.nilai - b.nilai);
    else if (urutan === "nama") {
      disalin.sort((a, b) => a.wilayah.nama.localeCompare(b.wilayah.nama, "id"));
    } else disalin.sort((a, b) => a.wilayah.kode.localeCompare(b.wilayah.kode));

    return disalin;
  }, [daftarLengkap, pencarian, saringProvinsi, urutan]);

  // Wilayah yang ditampilkan di panel kanan: pilihan pengguna, atau yang
  // teratas pada daftar yang sedang tersaring.
  const barisTerpilih =
    daftarTersaring.find((item) => item.wilayah.kode === kodeTerpilih) ??
    daftarTersaring[0] ??
    null;

  const riwayat = useMemo(() => {
    if (!barisTerpilih) return [];
    return siap.meta.tahun.map((th, i) => ({
      tahun: th,
      nilai: barisTerpilih.wilayah.nilai[i] ?? 0,
    }));
  }, [barisTerpilih, siap]);

  const maksRiwayat = Math.max(1, ...riwayat.map((r) => r.nilai));

  return (
    <div
      className="halaman-daftar-wilayah"
      data-node-id="10:612"
      data-name="03 · Daftar wilayah"
    >
      <div className="daftar-wilayah-wadah">
        <p className="daftar-eyebrow">DAFTAR WILAYAH</p>
        <h1 className="daftar-judul">
          Pilih wilayah untuk melihat riwayatnya
        </h1>
        <p className="daftar-deskripsi">
          Angka kejadian resmi BNPB tahun {tahun}. Daftar di kiri, riwayat 15
          tahun wilayah terpilih di kanan.
        </p>

        <div className="dw-belah">
          {/* Kiri: penyaring dan daftar */}
          <div className="dw-kiri">
            <div className="dw-kendali">
              <div className="pencarian-daftar-kotak dw-cari">
                <img src={searchInputSvg} alt="" width="16" height="16" />
                <input
                  type="text"
                  placeholder="Cari nama atau kode BPS"
                  value={pencarian}
                  onChange={(e) => setPencarian(e.target.value)}
                  className="input-pencarian-daftar"
                  aria-label="Cari nama atau kode BPS"
                />
              </div>

              <div className="dw-pemilih">
                <PemilihWilayah
                  idAwalan="daftar-provinsi"
                  butir={butirProvinsi}
                  nilai={saringProvinsi}
                  onPilih={setSaringProvinsi}
                  placeholder="Semua provinsi"
                  label="Provinsi"
                />
              </div>

              <div className="dw-pemilih">
                <PemilihWilayah
                  idAwalan="daftar-urutan"
                  butir={butirUrutan}
                  nilai={urutan}
                  onPilih={(kode) => setUrutan(kode as Urutan)}
                  placeholder="Urutan"
                  label="Urutan"
                  tanpaCari
                />
              </div>

              <span className="dw-jumlah">{daftarTersaring.length} wilayah</span>
            </div>

            <div className="dw-gulir" role="listbox" aria-label="Daftar wilayah">
              {daftarTersaring.length === 0 && (
                <p className="dw-kosong">Tidak ada wilayah yang cocok.</p>
              )}
              {daftarTersaring.map((item) => {
                const aktif = barisTerpilih?.wilayah.kode === item.wilayah.kode;
                return (
                  <button
                    key={item.wilayah.kode}
                    type="button"
                    role="option"
                    aria-selected={aktif}
                    className={`dw-baris ${aktif ? "terpilih" : ""}`}
                    onClick={() => {
                      setKodeTerpilih(item.wilayah.kode);
                      // Di layar sempit panel detail ada di bawah daftar, jadi
                      // gulirkan ke sana supaya pilihan langsung terlihat.
                      if (window.innerWidth <= 980) {
                        const kurangiGerak = window.matchMedia(
                          "(prefers-reduced-motion: reduce)",
                        ).matches;
                        detailRef.current?.scrollIntoView({
                          behavior: kurangiGerak ? "auto" : "smooth",
                          block: "start",
                        });
                      }
                    }}
                  >
                    <span className="dw-baris-isi">
                      <b>{namaWilayahRapi(item.wilayah.nama)}</b>
                      <span>
                        {item.namaProvinsi} · {item.wilayah.kode}
                      </span>
                    </span>
                    <span className="dw-baris-angka">{fmt(item.nilai)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Kanan: riwayat wilayah terpilih */}
          <aside className="dw-detail" aria-live="polite" ref={detailRef}>
            {!barisTerpilih ? (
              <p className="dw-detail-kosong">Pilih satu wilayah di daftar.</p>
            ) : (
              <>
                <p className="dw-detail-eyebrow">Wilayah terpilih</p>
                <h2 className="dw-detail-nama">
                  {namaWilayahRapi(barisTerpilih.wilayah.nama)}
                </h2>
                <p className="dw-detail-meta">
                  {barisTerpilih.namaProvinsi} · kode BPS {barisTerpilih.wilayah.kode}
                </p>

                <p className="dw-detail-angka">{fmt(barisTerpilih.nilai)}</p>
                <p className="dw-detail-satuan">kejadian pada {tahun}</p>

                <div
                  className="dw-detail-grafik"
                  role="img"
                  aria-label={`Riwayat kejadian ${siap.meta.tahun[0]} sampai ${siap.meta.tahun[siap.meta.tahun.length - 1]}`}
                >
                  {riwayat.map((r) => (
                    <span
                      key={r.tahun}
                      className={`dw-batang ${r.tahun === tahun ? "aktif" : ""}`}
                      style={{
                        height: `${Math.max(2, Math.round((r.nilai / maksRiwayat) * 64))}px`,
                      }}
                      title={`${r.tahun}: ${fmt(r.nilai)} kejadian`}
                    />
                  ))}
                </div>
                <div className="dw-tahun">
                  <span>{siap.meta.tahun[0]}</span>
                  <span>{siap.meta.tahun[siap.meta.tahun.length - 1]}</span>
                </div>

                <button
                  type="button"
                  className="tombol-aksi-utama dw-tombol-peta"
                  onClick={() => onPilihWilayah(barisTerpilih.wilayah)}
                >
                  Buka wilayah di peta
                </button>

                <table className="dw-tabel">
                  <thead>
                    <tr>
                      <th scope="col">Tahun</th>
                      <th scope="col">Kejadian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riwayat.map((r) => (
                      <tr key={r.tahun} className={r.tahun === tahun ? "aktif" : undefined}>
                        <td>{r.tahun}</td>
                        <td>{fmt(r.nilai)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
