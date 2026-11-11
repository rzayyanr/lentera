import { useEffect, useState } from "react";
import arrowLeftSvg from "../assets/icons/arrow-left.svg";
import arrowUpRightSvg from "../assets/icons/arrow-up-right.svg";

interface Props {
  idKejadian?: string;
  onKembali: () => void;
}

interface DataKejadianDetail {
  id: string;
  tanggal: string;
  tanggalDisplay: string;
  jenis: string;
  kabupaten: string;
  wilayah: string;
  meninggal: number;
  hilang: number;
  lukaBerat: number;
  lukaRingan: number;
  status: string;
  tingkat: string;
}

const BULAN_PANJANG = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

function formatTanggalLengkap(iso: string): string {
  const parts = iso.split("-");
  if (parts.length < 3) return iso;
  const y = parts[0];
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  return `${d} ${BULAN_PANJANG[m - 1] ?? parts[1]} ${y}`;
}

export default function DetailKejadian({ idKejadian = "37410", onKembali }: Props) {
  const [detail, setDetail] = useState<DataKejadianDetail | null>(null);

  useEffect(() => {
    let batal = false;
    fetch(`${import.meta.env.BASE_URL}data/kejadian-jatim.json`)
      .then((r) => r.json())
      .then((d) => {
        if (batal) return;
        const targetId = idKejadian || "37410";
        const row = d.kejadian.find((k: Array<string | number>) => String(k[0]) === targetId) ||
                    d.kejadian.find((k: Array<string | number>) => String(k[0]) === "37410") ||
                    d.kejadian[0];

        if (row) {
          const tgl = String(row[1]);
          setDetail({
            id: String(row[0]),
            tanggal: tgl,
            tanggalDisplay: formatTanggalLengkap(tgl),
            jenis: d.jenis[Number(row[2])] ?? "Tanah Longsor",
            kabupaten: d.kabupaten[Number(row[3])] ?? "Probolinggo Kabupaten",
            wilayah: String(row[4] || "Kel./Ds. Kedasih, Kec. Sukapura"),
            meninggal: Number(row[5]) || 0,
            hilang: Number(row[6]) || 0,
            lukaBerat: Number(row[7]) || 0,
            lukaRingan: Number(row[8]) || 0,
            status: d.status[Number(row[9])] || "SELESAI",
            tingkat: d.tingkat[Number(row[10])] || "RENDAH",
          });
        }
      })
      .catch(() => {
        // Fallback default jika fetch gagal
        if (!batal) {
          setDetail({
            id: "37410",
            tanggal: "2025-12-31",
            tanggalDisplay: "31 Desember 2025",
            jenis: "Tanah Longsor",
            kabupaten: "Probolinggo Kabupaten",
            wilayah: "Kel./Ds. Kedasih, Kec. Sukapura",
            meninggal: 0,
            hilang: 0,
            lukaBerat: 0,
            lukaRingan: 0,
            status: "SELESAI",
            tingkat: "RENDAH",
          });
        }
      });
    return () => {
      batal = true;
    };
  }, [idKejadian]);

  const item = detail ?? {
    id: "37410",
    tanggal: "2025-12-31",
    tanggalDisplay: "31 Desember 2025",
    jenis: "Tanah Longsor",
    kabupaten: "Probolinggo Kabupaten",
    wilayah: "Kel./Ds. Kedasih, Kec. Sukapura",
    meninggal: 0,
    hilang: 0,
    lukaBerat: 0,
    lukaRingan: 0,
    status: "SELESAI",
    tingkat: "RENDAH",
  };

  return (
    <div className="halaman-detail-kejadian" data-node-id="10:824" data-name="05 · Detail kejadian">
      <div className="wadah-konten-lebar">
        {/* Tombol Kembali */}
        <button
          type="button"
          className="tombol-kembali-teks"
          onClick={onKembali}
          aria-label="Kembali ke riwayat kejadian"
        >
          <img src={arrowLeftSvg} alt="" width="14" height="14" />
          <span>Riwayat kejadian</span>
        </button>

        {/* Judul & Metadata */}
        <h1 className="judul-kejadian">
          {item.jenis} di {item.wilayah}
        </h1>
        <p className="subjudul-kejadian">
          {item.tanggalDisplay} · {item.kabupaten}, Jawa Timur · ID kejadian {item.id}
        </p>

        {/* Badges */}
        <div className="baris-badges-kejadian">
          <span className="badge-lapisan resmi">
            Data resmi BPBD Jawa Timur
          </span>
          <span className="badge-lapisan netral">
            Tingkat {item.tingkat.toUpperCase()}
          </span>
        </div>

        {/* Grid 2 Kolom Konten */}
        <div className="grid-detail-kejadian">
          {/* Kolom Kiri */}
          <div className="kolom-kiri-kejadian">
            {/* Card Data yang tercatat */}
            <section className="kartu-kejadian" data-name="Data kejadian">
              <h2 className="judul-seksi-kartu">Data yang tercatat</h2>
              <div className="grid-field-kejadian">
                <div className="item-field">
                  <span className="label-field">Tanggal</span>
                  <span className="nilai-field">{item.tanggalDisplay}</span>
                </div>
                <div className="item-field">
                  <span className="label-field">Jenis</span>
                  <span className="nilai-field">{item.jenis}</span>
                </div>
                <div className="item-field">
                  <span className="label-field">Kabupaten / kota</span>
                  <span className="nilai-field">{item.kabupaten}</span>
                </div>
                <div className="item-field">
                  <span className="label-field">Wilayah</span>
                  <span className="nilai-field">{item.wilayah}</span>
                </div>
                <div className="item-field">
                  <span className="label-field">Korban meninggal</span>
                  <span className="nilai-field">{item.meninggal}</span>
                </div>
                <div className="item-field">
                  <span className="label-field">Korban luka</span>
                  <span className="nilai-field">{item.lukaBerat + item.lukaRingan}</span>
                </div>
              </div>
            </section>

            {/* Card Kronologi dan respon */}
            <section className="kartu-kejadian" data-name="Kronologi">
              <h2 className="judul-seksi-kartu">Kronologi dan respon</h2>
              <div className="timeline-kejadian">
                <div className="timeline-item">
                  <div className="timeline-dot" />
                  <div className="timeline-isi">
                    <span className="timeline-waktu">{item.tanggalDisplay.toUpperCase()}</span>
                    <p className="timeline-teks">
                      Kejadian tercatat pada umpan BPBD Jawa Timur.
                    </p>
                  </div>
                </div>

                <div className="timeline-item">
                  <div className="timeline-dot" />
                  <div className="timeline-isi">
                    <span className="timeline-waktu">{item.tanggalDisplay.toUpperCase()}</span>
                    <p className="timeline-teks">
                      Status kejadian diperbarui menjadi {item.status}.
                    </p>
                  </div>
                </div>

                <div className="timeline-item">
                  <div className="timeline-dot" />
                  <div className="timeline-isi">
                    <span className="timeline-waktu">SUMBER</span>
                    <p className="timeline-teks">
                      BPBD Provinsi Jawa Timur, melalui portal SMARTPB.
                    </p>
                  </div>
                </div>
              </div>

              <div className="kotak-catatan-sumber">
                <p>
                  Umpan BPBD tidak memuat narasi kronologi. Lentera tidak menambahkan cerita yang tidak ada di sumber.
                </p>
              </div>
            </section>
          </div>

          {/* Kolom Kanan */}
          <div className="kolom-kanan-kejadian">
            {/* Card Korban */}
            <section className="kartu-kejadian" data-name="Korban">
              <h2 className="judul-seksi-kartu">Korban</h2>
              <div className="daftar-baris-korban">
                <div className="baris-korban">
                  <span className="label-korban">Meninggal</span>
                  <span className="nilai-korban">{item.meninggal}</span>
                </div>
                <div className="baris-korban">
                  <span className="label-korban">Hilang</span>
                  <span className="nilai-korban">{item.hilang}</span>
                </div>
                <div className="baris-korban">
                  <span className="label-korban">Luka berat</span>
                  <span className="nilai-korban">{item.lukaBerat}</span>
                </div>
                <div className="baris-korban">
                  <span className="label-korban">Luka ringan</span>
                  <span className="nilai-korban">{item.lukaRingan}</span>
                </div>
              </div>
            </section>

            {/* Card Status penanganan */}
            <section className="kartu-kejadian" data-name="Status">
              <h2 className="judul-seksi-kartu">Status penanganan</h2>
              <p className="status-hero-teks">{item.status}</p>
              <p className="status-keterangan">
                Status ini berasal dari sumber, bukan penilaian Lentera.
              </p>
            </section>

            {/* Card Sumber dan tindak lanjut */}
            <section className="kartu-kejadian" data-name="Sumber">
              <h2 className="judul-seksi-kartu">Sumber dan tindak lanjut</h2>
              <a
                href="https://smartpb.jatimprov.go.id/"
                target="_blank"
                rel="noreferrer"
                className="tautan-eksternal-sumber"
              >
                <span>Buka catatan BPBD Jawa Timur</span>
                <img src={arrowUpRightSvg} alt="" width="14" height="14" />
              </a>
              <p className="sumber-keterangan-tindaklanjut">
                Belum ada catatan tindak lanjut untuk kejadian ini. Lentera tidak mengisi kolom ini dengan asumsi.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
