import { useMemo } from "react";
import closeXSvg from "../assets/icons/close-x.svg";
import { fmt, type DataLentera, type Wilayah, sumberUntuk } from "../lib/data";

interface Props {
  siap: DataLentera;
  tahun: number;
  ukuran: string;
  onPilihWilayah: (w: Wilayah) => void;
  onTutup?: () => void;
}

export default function PanelRingkasan({
  siap,
  tahun,
  ukuran,
  onPilihWilayah,
  onTutup,
}: Props) {
  const iTahun = siap.meta.tahun.indexOf(tahun);

  // Hitung total kejadian nasional dan cari wilayah tertinggi
  const { totalNasional, wilayahTertinggi } = useMemo(() => {
    let total = 0;
    const daftarDenganNilai: Array<{ wilayah: Wilayah; nilai: number }> = [];

    for (const w of siap.wilayah) {
      const v = iTahun >= 0 ? w.nilai[iTahun] ?? 0 : 0;
      if (v > 0) {
        total += v;
        daftarDenganNilai.push({ wilayah: w, nilai: v });
      }
    }

    daftarDenganNilai.sort((a, b) => b.nilai - a.nilai);
    return {
      totalNasional: total,
      wilayahTertinggi: daftarDenganNilai.slice(0, 7),
    };
  }, [siap, iTahun]);

  const nilaiMaks = wilayahTertinggi[0]?.nilai ?? 1;

  return (
    <aside className="panel-ringkasan-nasional" data-node-id="5:167" data-name="Panel · Ringkasan">
      {/* Header baris atas */}
      <div className="panel-kepala">
        <p className="panel-eyebrow">RINGKASAN NASIONAL</p>
        {onTutup && (
          <button
            type="button"
            className="tombol-tutup-panel"
            onClick={onTutup}
            aria-label="Tutup panel ringkasan"
          >
            <img src={closeXSvg} alt="" width="18" height="18" />
          </button>
        )}
      </div>

      <h2 className="panel-judul-wilayah">Indonesia</h2>
      <p className="panel-subjudul">
        {siap.meta.jumlahWilayah} wilayah tercatat · {tahun}
      </p>

      <hr className="panel-garis" />

      {/* Hero KPI */}
      <div className="panel-kpi-wadah">
        <p className="panel-angka-hero">{fmt(totalNasional)}</p>
        <p className="panel-kpi-keterangan">kejadian pada {tahun}</p>
        <div className="badge-lapisan resmi">
          <span>Data resmi BNPB</span>
        </div>
      </div>

      <hr className="panel-garis" />

      {/* 7 Wilayah Tertinggi */}
      <div className="panel-seksi-peringkat">
        <div className="panel-seksi-judul-baris">
          <h3 className="panel-seksi-judul">Wilayah tertinggi</h3>
          <span className="panel-seksi-label-kanan">7 teratas</span>
        </div>

        <ul className="daftar-peringkat-wilayah">
          {wilayahTertinggi.map((item, index) => {
            const lebarPersen = Math.max(4, Math.round((item.nilai / nilaiMaks) * 100));
            return (
              <li
                key={item.wilayah.kode}
                className="butir-peringkat-wilayah"
                onClick={() => onPilihWilayah(item.wilayah)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onPilihWilayah(item.wilayah);
                }}
              >
                <div className="baris-peringkat-atas">
                  <span className="nomor-peringkat">{index + 1}</span>
                  <span className="nama-peringkat">{item.wilayah.nama}</span>
                  <span className="nilai-peringkat">{fmt(item.nilai)}</span>
                </div>
                <div className="rel-bar-proporsi">
                  <div
                    className="bar-proporsi-aksen"
                    style={{ width: `${lebarPersen}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <hr className="panel-garis" />

      {/* Metadata ringkasan */}
      <dl className="panel-meta-list">
        <div className="panel-meta-baris">
          <dt>Cakupan peta</dt>
          <dd>{siap.meta.jumlahWilayah} kabupaten/kota</dd>
        </div>
        <hr className="panel-garis-tipis" />
        <div className="panel-meta-baris">
          <dt>Provinsi</dt>
          <dd>{siap.meta.jumlahProvinsi}</dd>
        </div>
        <hr className="panel-garis-tipis" />
        <div className="panel-meta-baris">
          <dt>Tahun tersedia</dt>
          <dd>
            {siap.meta.tahun[0]} sampai {siap.meta.tahun[siap.meta.tahun.length - 1]}
          </dd>
        </div>
        <hr className="panel-garis-tipis" />
        <div className="panel-meta-baris">
          <dt>Sumber angka</dt>
          <dd>{sumberUntuk(ukuran)}</dd>
        </div>
      </dl>
    </aside>
  );
}
