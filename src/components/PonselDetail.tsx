import { useMemo } from "react";
import {
  fmt,
  ambilNilai,
  type DataLentera,
  type Wilayah,
} from "../lib/data";

interface Props {
  wilayah: Wilayah;
  siap: DataLentera;
  tahun: number;
  ukuran: string;
  onPilihUkuran: (uk: string) => void;
  onPilihTahun: (th: number) => void;
  onTutup: () => void;
}

export default function PonselDetail({
  wilayah,
  siap,
  tahun,
  ukuran,
  onPilihUkuran,
  onPilihTahun,
  onTutup,
}: Props) {
  const provinsi = siap.provinsi.find((p) => p.kode === wilayah.prov);
  const nilaiTerkini = ambilNilai(siap, wilayah.kode, tahun, ukuran);

  // 15 tahun data
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

  const chipUkuran = [
    { id: "kejadian", label: "Kejadian" },
    { id: "menderita", label: "Terdampak" },
    { id: "rumahRusakBerat", label: "Rumah rusak" },
  ];

  return (
    <div className="lembar-bawah-ponsel detail" data-node-id="5:335" data-name="Lembar">
      <div className="gagang-seret-ponsel" onClick={onTutup} role="button" tabIndex={0} aria-label="Tutup detail wilayah" />

      <div className="ponsel-detail-baris-kepala">
        <div>
          <h2 className="ponsel-judul">{wilayah.nama}</h2>
          <p className="ponsel-subjudul">
            {provinsi?.nama ?? "PROVINSI"} · Kode BPS {wilayah.kode}
          </p>
        </div>
        <button type="button" className="tombol-tutup-ponsel" onClick={onTutup}>
          ✕
        </button>
      </div>

      <div className="ponsel-hero-wadah">
        <p className="ponsel-angka-hero">
          {nilaiTerkini !== null ? fmt(nilaiTerkini) : "—"}
        </p>
        <p className="ponsel-hero-keterangan">
          {ukuran === "kejadian" ? "kejadian" : "jiwa/unit"} pada {tahun}
        </p>
        <div className="badge-lapisan resmi">
          <span>Data resmi BNPB</span>
        </div>
      </div>

      {/* Chips Ukuran Bencana */}
      <div className="ponsel-grup-chips" role="group" aria-label="Pilih metrik">
        {chipUkuran.map((c) => {
          const aktif = ukuran === c.id;
          return (
            <button
              key={c.id}
              type="button"
              className={`chip-ukuran-ponsel ${aktif ? "aktif" : ""}`}
              onClick={() => onPilihUkuran(c.id)}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      {/* Histogram Riwayat */}
      <div className="ponsel-seksi-grafik">
        <p className="ponsel-grafik-label">
          Riwayat {siap.meta.tahun[0]} sampai {siap.meta.tahun[siap.meta.tahun.length - 1]}
        </p>

        <div className="ponsel-wadah-histogram">
          {riwayat15Tahun.map((item) => {
            const tinggiPx = Math.max(4, Math.round((item.nilai / maxRiwayat) * 52));
            const apakahAktif = item.tahun === tahun;
            return (
              <button
                key={item.tahun}
                type="button"
                className={`ponsel-batang-histogram ${apakahAktif ? "aktif" : ""}`}
                style={{ height: `${tinggiPx}px` }}
                onClick={() => onPilihTahun(item.tahun)}
                title={`${item.tahun}: ${fmt(item.nilai)}`}
                aria-label={`Tahun ${item.tahun}: ${fmt(item.nilai)}`}
              />
            );
          })}
        </div>

        <div className="ponsel-garis-bawah-histogram" aria-hidden="true" />

        <div className="ponsel-sumbu-tahun">
          <span>{siap.meta.tahun[0]}</span>
          <span>{siap.meta.tahun[siap.meta.tahun.length - 1]}</span>
        </div>
      </div>
    </div>
  );
}
