import { WARNA_KELAS, fmt } from "../lib/data";

interface Props {
  labelUkuran: string;
  tahun: number;
  ambang: number[];
  maxNilai: number;
}

export default function LegendaPeta({ labelUkuran, tahun, ambang, maxNilai }: Props) {
  return (
    <div className="legenda-kartu" data-node-id="5:139" data-name="Legenda">
      <p className="legenda-judul-atas">TINGKAT {labelUkuran.toUpperCase()}</p>
      <p className="legenda-subjudul">
        {labelUkuran} per tahun · {tahun}
      </p>

      {/* Skala 6 balok bertingkat */}
      <div className="legenda-skala-bar">
        {WARNA_KELAS.map((warna, i) => (
          <div
            key={warna}
            className="legenda-balok"
            style={{ backgroundColor: warna }}
            title={
              i === 0
                ? "0 kejadian"
                : i === 1
                ? `1 - ${fmt(ambang[0] ?? 1)}`
                : `${fmt((ambang[i - 2] ?? 0) + 1)} - ${fmt(ambang[i - 1] ?? ambang[ambang.length - 1])}`
            }
          />
        ))}
      </div>

      <div className="legenda-label-rentang">
        <span>Rendah</span>
        <span>Tinggi</span>
      </div>

      <div className="legenda-baris-tanpa-data">
        <span className="swatch-tanpa-data" aria-hidden="true" />
        <span className="teks-tanpa-data">Data tidak tersedia</span>
      </div>

      <p className="legenda-catatan-bawah">
        0 sampai {fmt(maxNilai > 0 ? maxNilai : 128)} kejadian per kabupaten/kota
      </p>
    </div>
  );
}
