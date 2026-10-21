/**
 * Penggeser tahun dengan tombol putar.
 *
 * Menggantikan daftar pilihan tahun. Alasan pemilihannya ada di design system:
 * peta dampak punya dimensi waktu yang berurutan, dan penggeser memperlihatkan
 * itu, sedangkan daftar pilihan hanya memperlihatkan lompatan.
 *
 * Syarat aksesibilitas yang dipenuhi: gagang minimal 44 piksel, fokus keyboard
 * terlihat, dan tahun aktif selalu tertulis sebagai angka, bukan hanya
 * ditunjukkan lewat posisi gagang.
 */

interface Props {
  tahun: number;
  daftarTahun: number[];
  onPilih: (tahun: number) => void;
  sedangMain: boolean;
  onPutar: () => void;
}

export default function PenggeserTahun({
  tahun,
  daftarTahun,
  onPilih,
  sedangMain,
  onPutar,
}: Props) {
  if (daftarTahun.length === 0) {
    return (
      <div className="penggeser">
        <span className="tahun-besar">-</span>
      </div>
    );
  }

  const indeks = Math.max(0, daftarTahun.indexOf(tahun));
  const awal = daftarTahun[0];
  const akhir = daftarTahun[daftarTahun.length - 1];

  return (
    <div className="penggeser">
      <button
        type="button"
        className="putar"
        onClick={onPutar}
        aria-label={sedangMain ? "Jeda putaran tahun" : "Putar tahun otomatis"}
        title={sedangMain ? "Jeda" : "Putar otomatis"}
      >
        {sedangMain ? (
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M8 5.5v13l11-6.5z" />
          </svg>
        )}
      </button>

      <div className="penggeser-isi">
        <div className="penggeser-kepala">
          <span className="tahun-besar">{tahun}</span>
          <span className="tahun-rentang">
            {awal} sampai {akhir}
          </span>
        </div>

        <div className="rel">
          <input
            type="range"
            min={0}
            max={daftarTahun.length - 1}
            step={1}
            value={indeks}
            onChange={(e) => onPilih(daftarTahun[Number(e.target.value)])}
            aria-label="Tahun yang ditampilkan"
            aria-valuetext={`Tahun ${tahun}`}
            aria-valuemin={awal}
            aria-valuemax={akhir}
            aria-valuenow={tahun}
          />
          <div className="gores" aria-hidden="true">
            {daftarTahun.map((t, i) => (
              <span
                key={t}
                className={i === indeks ? "gores-aktif" : undefined}
                style={{ left: `${(i / (daftarTahun.length - 1)) * 100}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
