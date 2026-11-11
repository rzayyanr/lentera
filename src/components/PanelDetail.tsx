import { useState, useMemo } from "react";
import PanelKartu from "./PanelKartu";
import arrowLeftSvg from "../assets/icons/arrow-left.svg";
import closeXSvg from "../assets/icons/close-x.svg";
import arrowUpRightSvg from "../assets/icons/arrow-up-right.svg";
import {
  fmt,
  ambilNilai,
  rincianDampak,
  cakupanProvinsi,
  labelStatusCakupan,
  namaProvinsiRapi,
  formatTanggal,
  UKURAN_UTAMA,
  type DataLentera,
  type Wilayah,
} from "../lib/data";

interface Props {
  wilayah: Wilayah;
  siap: DataLentera;
  tahun: number;
  ukuran: string;
  onPilihTahun: (th: number) => void;
  onKembali: () => void;
  onTutup: () => void;
  onBukaRiwayatJatim?: () => void;
  onBukaTransparansi?: () => void;
}

export default function PanelDetail({
  wilayah,
  siap,
  tahun,
  ukuran,
  onPilihTahun,
  onKembali,
  onTutup,
  onBukaRiwayatJatim,
  onBukaTransparansi,
}: Props) {
  const [tabAktif, setTabAktif] = useState<"dampak" | "riwayat" | "bantuan">("dampak");

  const provinsi = siap.provinsi.find((p) => p.kode === wilayah.prov);
  const nilaiTerkini = ambilNilai(siap, wilayah.kode, tahun, ukuran);
  const satuan = UKURAN_UTAMA.find((u) => u.id === ukuran)?.satuan ?? "kejadian";

  // Status rincian per kejadian diambil dari berkas cakupan, bukan ditulis
  // di dalam komponen, supaya penambahan provinsi cukup menambah data.
  const cakupan = cakupanProvinsi(siap, wilayah.prov);
  const rincianTersedia = cakupan.status === "rinci";
  const namaProvinsi = namaProvinsiRapi(provinsi?.nama ?? wilayah.prov);

  // Data 15 tahun (2010 - 2024) untuk grafik batang riwayat
  const riwayat15Tahun = useMemo(() => {
    return siap.meta.tahun.map((th) => {
      const i = siap.meta.tahun.indexOf(th);
      const val = i >= 0 ? wilayah.nilai[i] ?? 0 : 0;
      return { tahun: th, nilai: val };
    });
  }, [siap, wilayah]);

  const maxRiwayat = useMemo(() => {
    return Math.max(...riwayat15Tahun.map((r) => r.nilai), 1);
  }, [riwayat15Tahun]);

  // Rincian dampak tahun 2023 (atau tahun terpilih jika ada di data dampak)
  const tahunDampakTarget = siap.dampak.tahun.includes(tahun)
    ? tahun
    : siap.dampak.tahun[siap.dampak.tahun.length - 1] ?? 2023;

  const rincian = useMemo(() => {
    return rincianDampak(siap, wilayah.kode, tahunDampakTarget);
  }, [siap, wilayah.kode, tahunDampakTarget]);

  return (
    <PanelKartu className="panel-detail-wilayah" nodeId="5:168" nama="Panel · Detail">
      {/* Baris navigasi kembali & tutup */}
      <div className="panel-kepala">
        <button
          type="button"
          className="tombol-kembali-ringkasan"
          onClick={onKembali}
          aria-label="Kembali ke ringkasan nasional"
        >
          <img src={arrowLeftSvg} alt="" width="14" height="14" />
          <span>Ringkasan nasional</span>
        </button>

        <button
          type="button"
          className="tombol-tutup-panel"
          onClick={onTutup}
          aria-label="Tutup panel detail"
        >
          <img src={closeXSvg} alt="" width="18" height="18" />
        </button>
      </div>

      {/* Identitas Wilayah */}
      <h2 className="panel-judul-wilayah">{wilayah.nama}</h2>
      <p className="panel-subjudul">
        {provinsi?.nama ?? "PROVINSI"} · Kode BPS {wilayah.kode}
      </p>

      <a
        href="https://data.bnpb.go.id/dataset/data-bencana-indonesia"
        target="_blank"
        rel="noreferrer"
        className="tautan-sumber-bnpb"
      >
        <span>Lihat sumber BNPB</span>
        <img src={arrowUpRightSvg} alt="" width="12" height="12" />
      </a>

      <hr className="panel-garis" />

      {/* Hero KPI */}
      <div className="panel-kpi-wadah">
        <p className="panel-angka-hero">
          {nilaiTerkini !== null ? fmt(nilaiTerkini) : "—"}
        </p>
        <p className="panel-kpi-keterangan">
          {nilaiTerkini !== null ? `${satuan} pada ${tahun}` : `tidak ada catatan untuk ${tahun}`}
        </p>
        <div className="badge-lapisan resmi">
          <span>Data resmi BNPB</span>
        </div>
      </div>

      {/* Histogram Riwayat 2010 - 2024 */}
      <div className="panel-seksi-grafik">
        <p className="grafik-label-atas">
          Riwayat {siap.meta.tahun[0]} sampai {siap.meta.tahun[siap.meta.tahun.length - 1]}
        </p>

        <div className="wadah-batang-histogram" role="group" aria-label="Grafik tahunan">
          {riwayat15Tahun.map((item) => {
            const tinggiPersen = Math.max(5, Math.round((item.nilai / maxRiwayat) * 56));
            const apakahTahunAktif = item.tahun === tahun;
            return (
              <button
                key={item.tahun}
                type="button"
                className={`batang-histogram ${apakahTahunAktif ? "aktif" : ""}`}
                style={{ height: `${tinggiPersen}px` }}
                onClick={() => onPilihTahun(item.tahun)}
                title={`${item.tahun}: ${fmt(item.nilai)} ${satuan}`}
                aria-label={`Tahun ${item.tahun}: ${fmt(item.nilai)}`}
              />
            );
          })}
        </div>

        <div className="garis-bawah-histogram" aria-hidden="true" />

        <div className="sumbu-tahun-histogram">
          <span>{siap.meta.tahun[0]}</span>
          <span>{siap.meta.tahun[siap.meta.tahun.length - 1]}</span>
        </div>
      </div>

      {/* Tab Segment Controller */}
      <div className="panel-tab-segmen" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tabAktif === "dampak"}
          className={`tab-segmen-item ${tabAktif === "dampak" ? "aktif" : ""}`}
          onClick={() => setTabAktif("dampak")}
        >
          Dampak
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tabAktif === "riwayat"}
          className={`tab-segmen-item ${tabAktif === "riwayat" ? "aktif" : ""}`}
          onClick={() => setTabAktif("riwayat")}
        >
          Riwayat
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tabAktif === "bantuan"}
          className={`tab-segmen-item ${tabAktif === "bantuan" ? "aktif" : ""}`}
          onClick={() => setTabAktif("bantuan")}
        >
          Bantuan
        </button>
      </div>

      <hr className="panel-garis" />

      {/* Isi Tab Dampak: Grid 2 Kolom Rincian Dampak */}
      {tabAktif === "dampak" && (
        <div className="panel-isi-tab-dampak">
          <h3 className="tab-dampak-judul">Rincian dampak · {tahunDampakTarget}</h3>
          <p className="tab-dampak-subjudul">Dari berkas statistik wilayah BNPB</p>

          <div className="grid-dua-kolom-dampak">
            {rincian.slice(0, 8).map((r) => (
              <div key={r.id} className="kartu-metrik-dampak">
                <p className="metrik-label">{r.label}</p>
                <p className="metrik-nilai">{fmt(r.nilai)}</p>
              </div>
            ))}
            {rincian.length === 0 && (
              <p className="pesan-kosong-tab">Data rincian belum tercatat untuk tahun ini.</p>
            )}
          </div>
        </div>
      )}

      {/* Isi Tab Riwayat: Sesuai Frame 02a (16:672) */}
      {tabAktif === "riwayat" && (
        <div className="panel-isi-tab-riwayat" data-node-id="16:672" data-name="02a · Detail wilayah — Riwayat kejadian">
          <h3 className="tab-dampak-judul">Riwayat kejadian wilayah</h3>

          {rincianTersedia ? (
            <>
              <p className="tab-dampak-subjudul">
                {cakupan.sumber} menerbitkan {fmt(cakupan.jumlahKejadian ?? 0)} kejadian
                {cakupan.periode ? ` tahun ${cakupan.periode}` : ""}, lengkap dengan
                tanggal, desa, dan korban.
              </p>
              <button
                type="button"
                className="tombol-tautan-aksen"
                onClick={onBukaRiwayatJatim}
              >
                <span>Buka riwayat {namaProvinsi} →</span>
              </button>
            </>
          ) : (
            <>
              <p className="tab-dampak-subjudul">
                Rincian satu kejadian satu baris belum tersedia untuk {namaProvinsi}.
              </p>
              <div className="kotak-keadaan-kosong-tab" data-name="Keadaan kosong">
                <p className="judul-keadaan-kosong">Tidak ada daftar kejadian untuk wilayah ini</p>
                <p className="keterangan-keadaan-kosong">
                  Angka tahunan di tab Dampak tetap tersedia dan tetap bisa ditelusuri.
                  Yang tidak ada hanya rincian per kejadian.
                </p>
              </div>

              <dl className="daftar-cakupan-pendek">
                <div className="baris-cakupan-pendek">
                  <dt>Status</dt>
                  <dd>{labelStatusCakupan(cakupan.status)}</dd>
                </div>
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
            </>
          )}
        </div>
      )}

      {/* Isi Tab Bantuan: Sesuai Frame 02b (16:818) */}
      {tabAktif === "bantuan" && (
        <div className="panel-isi-tab-bantuan" data-node-id="16:818" data-name="02b · Detail wilayah — Catatan bantuan">
          <h3 className="tab-dampak-judul">Catatan bantuan wilayah</h3>
          <p className="tab-dampak-subjudul">
            Bantuan ditampilkan dalam dua lapisan terpisah. Tidak ada entri yang digabung menjadi satu angka.
          </p>

          <div className="kotak-lapisan-bantuan-tab" data-name="Lapisan">
            <span className="badge-lapisan resmi">Data resmi</span>
            <p className="teks-lapisan-status">
              Belum ada entri bantuan resmi yang lolos verifikasi untuk wilayah ini.
            </p>
          </div>

          <div className="kotak-lapisan-bantuan-tab" data-name="Lapisan">
            <span className="badge-lapisan komunitas">Catatan komunitas</span>
            <p className="teks-lapisan-status">
              Belum ada catatan warga yang ditinjau moderator untuk wilayah ini.
            </p>
          </div>

          <button
            type="button"
            className="tombol-tautan-aksen"
            onClick={onBukaTransparansi}
          >
            <span>Buka transparansi bantuan →</span>
          </button>
        </div>
      )}

      <hr className="panel-garis" />

      {/* Bagian Sumber Data */}
      <div className="panel-seksi-sumber">
        <h3 className="sumber-judul">Sumber data</h3>

        <a
          href="https://data.bnpb.go.id/dataset/data-bencana-indonesia"
          target="_blank"
          rel="noreferrer"
          className="baris-sumber-tautan"
        >
          <div className="teks-sumber">
            <p className="nama-sumber">Tabel agregat BNPB</p>
            <p className="cakupan-sumber">2010 sampai 2024</p>
          </div>
          <img src={arrowUpRightSvg} alt="" width="14" height="14" />
        </a>

        <hr className="panel-garis-tipis" />

        <a
          href="https://data.bnpb.go.id/dataset/jumlah-kejadian-dan-dampak-bencana-tahun-2023"
          target="_blank"
          rel="noreferrer"
          className="baris-sumber-tautan"
        >
          <div className="teks-sumber">
            <p className="nama-sumber">Berkas statistik wilayah</p>
            <p className="cakupan-sumber">2002 sampai 2023</p>
          </div>
          <img src={arrowUpRightSvg} alt="" width="14" height="14" />
        </a>
      </div>
    </PanelKartu>
  );
}
