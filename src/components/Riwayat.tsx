/**
 * Halaman riwayat, dengan pemilih provinsi.
 *
 * Dua bentuk data yang memang berbeda tingkatannya:
 * 1. Ringkasan tahunan, dari tabel agregat BNPB. Tersedia untuk 38 provinsi.
 * 2. Daftar kejadian per tanggal, dari SMARTPB BPBD Jawa Timur. Hanya
 *    provinsi yang menerbitkannya, sekarang baru Jawa Timur.
 *
 * Pemisahan ini sengaja dibuat kelihatan: tab daftar kejadian hanya muncul
 * kalau provinsinya memang punya, dan alasannya ditulis apa adanya.
 */

import { useMemo, useState } from "react";
import DaftarKejadianJatim from "./DaftarKejadianJatim";
import PemilihWilayah from "./PemilihWilayah";
import {
  LABEL_UKURAN,
  cakupanProvinsi,
  dampakProvinsi,
  fmt,
  formatTanggal,
  jenisProvinsiUntuk,
  kejadianProvinsi,
  namaProvinsiRapi,
  type DataLentera,
} from "../lib/data";

interface Props {
  siap: DataLentera | null;
  provAwal?: string;
  onPilihKejadian?: (id: string) => void;
  /** Membuka tabel cakupan 38 provinsi di halaman Tentang. */
  onBukaCakupan?: () => void;
}

/** Ukuran dampak yang ditampilkan di tabel tahunan. */
const UKURAN_TABEL = [
  "meninggal",
  "hilang",
  "luka",
  "menderita",
  "mengungsi",
  "rumahRusakBerat",
];

export default function Riwayat({
  siap,
  provAwal = "35",
  onPilihKejadian,
  onBukaCakupan,
}: Props) {
  const [prov, setProv] = useState<string>(provAwal);
  const [tab, setTab] = useState<"tahunan" | "kejadian">("tahunan");

  const cakupan = siap
    ? cakupanProvinsi(siap, prov)
    : { status: "belum_diperiksa" as const };
  const adaRincian = cakupan.status === "rinci";

  // Tab daftar kejadian tidak berlaku untuk provinsi tanpa rincian, jadi tab
  // aktif diturunkan saat render, bukan disinkronkan lewat efek.
  const tabAktif = adaRincian ? tab : "tahunan";

  const butirProvinsi = useMemo(() => {
    if (!siap) return [];
    return [...siap.provinsi]
      .sort((a, b) => a.nama.localeCompare(b.nama, "id"))
      .map((p) => ({
        kode: p.kode,
        nama: namaProvinsiRapi(p.nama),
        sub: `${siap.perProvinsi.get(p.kode)?.length ?? 0} kabupaten/kota`,
      }));
  }, [siap]);

  const namaProvinsi = siap
    ? namaProvinsiRapi(siap.provinsi.find((p) => p.kode === prov)?.nama ?? "provinsi ini")
    : "";

  const seriKejadian = useMemo(
    () => (siap ? kejadianProvinsi(siap, prov) : []),
    [siap, prov],
  );

  const total = seriKejadian.reduce((jumlah, item) => jumlah + item.nilai, 0);
  const puncak = seriKejadian.reduce(
    (besar, item) => (item.nilai > besar.nilai ? item : besar),
    { tahun: 0, nilai: 0 },
  );
  const maksBatang = Math.max(1, ...seriKejadian.map((item) => item.nilai));
  const jumlahKabupaten = siap?.perProvinsi.get(prov)?.length ?? 0;
  const jenisProvinsi = siap ? jenisProvinsiUntuk(siap, prov) : null;

  const tabelDampak = useMemo(() => {
    if (!siap) return { kolom: [] as string[], baris: [] as Array<{ tahun: number; nilai: Array<number | null> }> };
    const kolom = UKURAN_TABEL.filter((id) => siap.dampak.ukuran.includes(id));
    const seri = kolom.map((id) => dampakProvinsi(siap, prov, id));
    const baris = (siap.dampak.tahun ?? []).map((tahun, i) => ({
      tahun,
      nilai: seri.map((s) => s[i]?.nilai ?? null),
    }));
    return { kolom, baris };
  }, [siap, prov]);

  return (
    <div className="halaman-riwayat" data-node-id="10:719" data-name="04 · Riwayat kejadian">
      <div className="riwayat-wadah">
        <p className="riwayat-eyebrow">RIWAYAT KEJADIAN</p>
        <h1 className="riwayat-judul">
          {namaProvinsi}
          {siap && seriKejadian.length > 0 ? `, ${fmt(total)} kejadian` : ""}
        </h1>
        <p className="riwayat-deskripsi">
          Angka tahunan berasal dari tabel agregat BNPB dan tersedia untuk seluruh Indonesia.
          Daftar kejadian per tanggal hanya ada untuk provinsi yang menerbitkannya secara terbuka.
        </p>

        <div className="riwayat-kepala-aksi">
          <div className="riwayat-pemilih-wadah">
            <span className="penyaring-label">PROVINSI</span>
            <PemilihWilayah
              idAwalan="riwayat-provinsi"
              butir={butirProvinsi}
              nilai={prov}
              onPilih={setProv}
              placeholder="Pilih provinsi"
              label="Provinsi"
            />
          </div>

          <div className="riwayat-tab-bar" role="tablist" aria-label="Jenis riwayat">
            <button
              type="button"
              role="tab"
              aria-selected={tabAktif === "tahunan"}
              className={`riwayat-tab-item ${tabAktif === "tahunan" ? "aktif" : ""}`}
              onClick={() => setTab("tahunan")}
            >
              Ringkasan tahunan
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tabAktif === "kejadian"}
              className={`riwayat-tab-item ${tabAktif === "kejadian" ? "aktif" : ""}`}
              onClick={() => setTab("kejadian")}
              disabled={!adaRincian}
              title={
                adaRincian
                  ? "Daftar kejadian per tanggal"
                  : `${namaProvinsi} belum menerbitkan daftar kejadian per tanggal`
              }
            >
              Daftar kejadian
              {!adaRincian && <span className="riwayat-tab-kunci">belum tersedia</span>}
            </button>
          </div>
        </div>

        {!siap && <p className="pesan-memuat">Memuat data wilayah...</p>}

        {siap && tabAktif === "tahunan" && (
          <>
            <div className="riwayat-stat-baris">
              <div className="riwayat-stat">
                <span className="riwayat-stat-label">KEJADIAN {siap.meta.tahun[0]}–{siap.meta.tahun[siap.meta.tahun.length - 1]}</span>
                <span className="riwayat-stat-nilai">{fmt(total)}</span>
              </div>
              <div className="riwayat-stat">
                <span className="riwayat-stat-label">TAHUN TERTINGGI</span>
                <span className="riwayat-stat-nilai">
                  {puncak.tahun || "—"}
                  <span className="riwayat-stat-kecil"> {puncak.nilai ? `${fmt(puncak.nilai)} kejadian` : ""}</span>
                </span>
              </div>
              <div className="riwayat-stat">
                <span className="riwayat-stat-label">KABUPATEN / KOTA</span>
                <span className="riwayat-stat-nilai">{jumlahKabupaten}</span>
              </div>
            </div>

            <div className="kartu-tabel-riwayat" data-name="Kejadian per tahun">
              <div className="riwayat-kartu-kepala">
                <h2 className="riwayat-kartu-judul">Kejadian per tahun</h2>
                <span className="riwayat-kartu-sumber">Tabel agregat BNPB</span>
              </div>

              <div className="wadah-batang-histogram riwayat-histogram" role="img" aria-label={`Grafik kejadian ${namaProvinsi} per tahun`}>
                {seriKejadian.map((item) => (
                  <span
                    key={item.tahun}
                    className="batang-histogram"
                    style={{ height: `${Math.max(4, Math.round((item.nilai / maksBatang) * 72))}px` }}
                    title={`${item.tahun}: ${fmt(item.nilai)} kejadian`}
                  />
                ))}
              </div>
              <div className="riwayat-histogram-label">
                <span>{seriKejadian[0]?.tahun}</span>
                <span>{seriKejadian[seriKejadian.length - 1]?.tahun}</span>
              </div>

              <div className="wadah-gulir-tabel">
                <table className="tabel-riwayat-entri tabel-riwayat-tahunan">
                  <thead>
                    <tr>
                      <th scope="col">TAHUN</th>
                      <th scope="col" className="kolom-angka">KEJADIAN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seriKejadian.map((item) => (
                      <tr key={item.tahun}>
                        <td>{item.tahun}</td>
                        <td className="kolom-angka">{fmt(item.nilai)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="kartu-tabel-riwayat" data-name="Korban dan kerusakan per tahun">
              <div className="riwayat-kartu-kepala">
                <h2 className="riwayat-kartu-judul">Korban dan kerusakan per tahun</h2>
                <span className="riwayat-kartu-sumber">Berkas statistik wilayah BNPB, {tabelDampak.baris[0]?.tahun}–{tabelDampak.baris[tabelDampak.baris.length - 1]?.tahun}</span>
              </div>

              <div className="wadah-gulir-tabel">
                <table className="tabel-riwayat-entri tabel-riwayat-tahunan">
                  <thead>
                    <tr>
                      <th scope="col">TAHUN</th>
                      {tabelDampak.kolom.map((id) => (
                        <th key={id} scope="col" className="kolom-angka">
                          {LABEL_UKURAN[id] ?? id}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tabelDampak.baris.map((baris) => (
                      <tr key={baris.tahun}>
                        <td>{baris.tahun}</td>
                        {baris.nilai.map((nilai, i) => (
                          <td key={i} className="kolom-angka">
                            {nilai === null ? "—" : fmt(nilai)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="kartu-tabel-riwayat" data-name="Jenis bencana provinsi">
              <div className="riwayat-kartu-kepala">
                <h2 className="riwayat-kartu-judul">Jenis bencana di {namaProvinsi}</h2>
                <span className="riwayat-kartu-sumber">
                  {jenisProvinsi
                    ? `${jenisProvinsi.sumber}, ${jenisProvinsi.periode[0]}–${jenisProvinsi.periode[1]}`
                    : "belum tersedia"}
                </span>
              </div>

              {jenisProvinsi ? (
                <ul className="daftar-jenis-provinsi">
                  {jenisProvinsi.jenis.map((item) => (
                    <li key={item.jenis} className="butir-jenis-provinsi">
                      <div className="baris-jenis-atas">
                        <span className="nama-jenis">{item.jenis}</span>
                        <span className="nilai-jenis">{fmt(item.total)}</span>
                      </div>
                      <div className="rel-bar-proporsi">
                        <div
                          className="bar-proporsi-aksen"
                          style={{
                            width: `${Math.max(2, Math.round((item.total / jenisProvinsi.jenis[0].total) * 100))}%`,
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="dw-kosong-jenis">
                  <p className="catatan-jenis" style={{ margin: 0 }}>
                    BNPB hanya menerbitkan sebaran jenis bencana pada tingkat nasional, bukan per
                    provinsi. {namaProvinsi} juga belum menerbitkan log kejadian per tanggal, jadi
                    sebaran jenisnya belum bisa dihitung.
                  </p>
                  <dl className="cakupan-jenis">
                    {cakupan.sumber && (
                      <div className="baris-cakupan-pendek">
                        <dt>Portal diperiksa</dt>
                        <dd>{cakupan.sumber}</dd>
                      </div>
                    )}
                    {cakupan.alasan && (
                      <div className="baris-cakupan-pendek">
                        <dt>Alasan</dt>
                        <dd>{cakupan.alasan}</dd>
                      </div>
                    )}
                    {siap.cakupan.diperiksa && (
                      <div className="baris-cakupan-pendek">
                        <dt>Diperiksa</dt>
                        <dd>{formatTanggal(siap.cakupan.diperiksa)}</dd>
                      </div>
                    )}
                  </dl>
                  {onBukaCakupan && (
                    <button
                      type="button"
                      className="tombol-tautan-aksen"
                      onClick={onBukaCakupan}
                    >
                      <span>Lihat tabel cakupan 38 provinsi →</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            <p className="keterangan-bawah-riwayat">
              Angka provinsi adalah penjumlahan kabupaten/kota, sama seperti yang dipakai di panel peta.
              Tanda — berarti tidak ada kabupaten yang melaporkan tahun itu, bukan nol.
            </p>
          </>
        )}

        {siap && tabAktif === "kejadian" && adaRincian && (
          <>
            <p className="keterangan-bawah-riwayat" style={{ marginBottom: 16 }}>
              Jumlah di daftar ini lebih besar dari angka tahunan karena sumbernya berbeda:
              BNPB menghitung satu kejadian per kabupaten, sedangkan SMARTPB mencatat tiap
              laporan per desa.
            </p>
            <DaftarKejadianJatim onPilihKejadian={onPilihKejadian} />
          </>
        )}
      </div>
    </div>
  );
}
