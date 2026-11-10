import { useMemo } from "react";
import { fmt, type DataLentera, type Wilayah } from "../lib/data";

interface Props {
  siap: DataLentera;
  tahun: number;
  onPilihWilayah: (w: Wilayah) => void;
}

export default function PonselRingkasan({ siap, tahun, onPilihWilayah }: Props) {
  const iTahun = siap.meta.tahun.indexOf(tahun);

  const { totalNasional, top3 } = useMemo(() => {
    let total = 0;
    const daftar: Array<{ wilayah: Wilayah; nilai: number }> = [];

    for (const w of siap.wilayah) {
      const v = iTahun >= 0 ? w.nilai[iTahun] ?? 0 : 0;
      if (v > 0) {
        total += v;
        daftar.push({ wilayah: w, nilai: v });
      }
    }

    daftar.sort((a, b) => b.nilai - a.nilai);
    return {
      totalNasional: total,
      top3: daftar.slice(0, 3),
    };
  }, [siap, iTahun]);

  return (
    <div className="lembar-bawah-ponsel" data-node-id="5:302" data-name="Lembar">
      <div className="gagang-seret-ponsel" aria-hidden="true" />

      <p className="ponsel-eyebrow">RINGKASAN NASIONAL</p>
      <h2 className="ponsel-judul">Indonesia</h2>
      <p className="ponsel-subjudul">
        {siap.meta.jumlahWilayah} wilayah tercatat · {tahun}
      </p>

      <div className="ponsel-hero-wadah">
        <p className="ponsel-angka-hero">{fmt(totalNasional)}</p>
        <p className="ponsel-hero-keterangan">kejadian pada {tahun}</p>
      </div>

      <hr className="ponsel-garis" />

      <div className="ponsel-seksi-peringkat">
        <h3 className="ponsel-seksi-judul">Wilayah tertinggi</h3>
        <ul className="ponsel-daftar-peringkat">
          {top3.map((item, idx) => (
            <li
              key={item.wilayah.kode}
              className="ponsel-butir-peringkat"
              onClick={() => onPilihWilayah(item.wilayah)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") onPilihWilayah(item.wilayah);
              }}
            >
              <div className="ponsel-baris-peringkat">
                <span className="ponsel-nomor">{idx + 1}</span>
                <span className="ponsel-nama">{item.wilayah.nama}</span>
                <span className="ponsel-nilai">{fmt(item.nilai)}</span>
              </div>
              {idx < top3.length - 1 && <hr className="ponsel-garis-tipis" />}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
