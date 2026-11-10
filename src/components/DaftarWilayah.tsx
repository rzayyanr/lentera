import { useState, useMemo } from "react";
import searchInputSvg from "../assets/icons/search-input.svg";
import { fmt, type DataLentera, type Wilayah } from "../lib/data";

interface Props {
  siap: DataLentera;
  tahun: number;
  onPilihWilayah: (w: Wilayah) => void;
}

const PER_HALAMAN = 10;

export default function DaftarWilayah({ siap, tahun, onPilihWilayah }: Props) {
  const [pencarian, setPencarian] = useState("");
  const [saringProvinsi, setSaringProvinsi] = useState("semua");
  const [urutan, setUrutan] = useState<"tertinggi" | "terendah" | "nama" | "kode">("tertinggi");
  const [halaman, setHalaman] = useState(0);

  const iTahun = siap.meta.tahun.indexOf(tahun);

  // Buat daftar lengkap dengan nilai tahun ini
  const daftarLengkap = useMemo(() => {
    return siap.wilayah.map((w) => {
      const v = iTahun >= 0 ? w.nilai[iTahun] ?? 0 : 0;
      const prov = siap.provinsi.find((p) => p.kode === w.prov);
      return {
        wilayah: w,
        nilai: v,
        namaProvinsi: prov?.nama ?? "PROVINSI",
      };
    });
  }, [siap, iTahun]);

  // Saring berdasarkan pencarian dan provinsi
  const daftarTersaring = useMemo(() => {
    let hasil = daftarLengkap;

    if (pencarian.trim()) {
      const q = pencarian.toLowerCase();
      hasil = hasil.filter(
        (item) =>
          item.wilayah.nama.toLowerCase().includes(q) ||
          item.wilayah.kode.includes(q) ||
          item.namaProvinsi.toLowerCase().includes(q)
      );
    }

    if (saringProvinsi !== "semua") {
      hasil = hasil.filter((item) => item.wilayah.prov === saringProvinsi);
    }

    // Urutkan
    const disalin = [...hasil];
    if (urutan === "tertinggi") {
      disalin.sort((a, b) => b.nilai - a.nilai);
    } else if (urutan === "terendah") {
      disalin.sort((a, b) => a.nilai - b.nilai);
    } else if (urutan === "nama") {
      disalin.sort((a, b) => a.wilayah.nama.localeCompare(b.wilayah.nama));
    } else if (urutan === "kode") {
      disalin.sort((a, b) => a.wilayah.kode.localeCompare(b.wilayah.kode));
    }

    return disalin;
  }, [daftarLengkap, pencarian, saringProvinsi, urutan]);

  const totalHalaman = Math.max(1, Math.ceil(daftarTersaring.length / PER_HALAMAN));
  const dataHalaman = daftarTersaring.slice(
    halaman * PER_HALAMAN,
    (halaman + 1) * PER_HALAMAN
  );

  return (
    <div className="halaman-daftar-wilayah" data-node-id="10:612" data-name="03 · Daftar wilayah">
      <div className="daftar-wilayah-wadah">
        {/* Judul & Pengantar */}
        <p className="daftar-eyebrow">DAFTAR WILAYAH</p>
        <h1 className="daftar-judul">514 kabupaten dan kota</h1>
        <p className="daftar-deskripsi">
          Angka kejadian resmi BNPB tahun {tahun}, diurutkan dari yang tertinggi. Pilih satu baris untuk membuka detail wilayah.
        </p>

        {/* Toolbar Penyaring */}
        <div className="toolbar-penyaring-daftar" data-node-id="10:642" data-name="Penyaring">
          <div className="pencarian-daftar-kotak">
            <img src={searchInputSvg} alt="" width="16" height="16" />
            <input
              type="text"
              placeholder="Cari nama atau kode BPS"
              value={pencarian}
              onChange={(e) => {
                setPencarian(e.target.value);
                setHalaman(0);
              }}
              className="input-pencarian-daftar"
              aria-label="Cari nama atau kode BPS"
            />
          </div>

          <div className="grup-dropdown-daftar">
            {/* Dropdown Provinsi */}
            <div className="select-wadah">
              <select
                value={saringProvinsi}
                onChange={(e) => {
                  setSaringProvinsi(e.target.value);
                  setHalaman(0);
                }}
                className="select-penyaring"
                aria-label="Saring menurut provinsi"
              >
                <option value="semua">Semua provinsi</option>
                {siap.provinsi.map((p) => (
                  <option key={p.kode} value={p.kode}>
                    {p.nama}
                  </option>
                ))}
              </select>
              <span className="panah-select" aria-hidden="true">▾</span>
            </div>

            {/* Dropdown Urutan */}
            <div className="select-wadah">
              <select
                value={urutan}
                onChange={(e) => {
                  setUrutan(e.target.value as "tertinggi" | "terendah" | "nama" | "kode");
                  setHalaman(0);
                }}
                className="select-penyaring"
                aria-label="Urutan data"
              >
                <option value="tertinggi">Kejadian tertinggi</option>
                <option value="terendah">Kejadian terendah</option>
                <option value="nama">Nama (A–Z)</option>
                <option value="kode">Kode BPS</option>
              </select>
              <span className="panah-select" aria-hidden="true">▾</span>
            </div>
          </div>

          <p className="jumlah-temuan-daftar">
            {daftarTersaring.length} wilayah ditemukan
          </p>
        </div>

        {/* Kartu Tabel Wilayah */}
        <div className="kartu-tabel-daftar" data-node-id="10:653" data-name="Tabel">
          <div className="wadah-gulir-tabel">
            <table className="tabel-daftar-entri">
              <thead>
                <tr>
                  <th scope="col" style={{ width: "6%" }}>#</th>
                  <th scope="col" style={{ width: "14%" }}>KODE BPS</th>
                  <th scope="col" style={{ width: "38%" }}>KABUPATEN / KOTA</th>
                  <th scope="col" style={{ width: "26%" }}>PROVINSI</th>
                  <th scope="col" style={{ width: "16%", textAlign: "right" }}>
                    KEJADIAN {tahun}
                  </th>
                </tr>
              </thead>
              <tbody>
                {dataHalaman.map((item, index) => {
                  const nomorUrut = halaman * PER_HALAMAN + index + 1;
                  return (
                    <tr
                      key={item.wilayah.kode}
                      onClick={() => onPilihWilayah(item.wilayah)}
                      className="baris-tabel-interaktif"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") onPilihWilayah(item.wilayah);
                      }}
                    >
                      <td className="kolom-nomor">{nomorUrut}</td>
                      <td className="kolom-kode">{item.wilayah.kode}</td>
                      <td className="kolom-kabupaten">{item.wilayah.nama}</td>
                      <td className="kolom-provinsi">{item.namaProvinsi}</td>
                      <td className="kolom-kejadian">{fmt(item.nilai)}</td>
                    </tr>
                  );
                })}
                {dataHalaman.length === 0 && (
                  <tr>
                    <td colSpan={5} className="tabel-kosong">
                      Tidak ada kabupaten/kota yang cocok dengan filter yang dipilih.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Baris Paginasi */}
          {totalHalaman > 1 && (
            <div className="baris-paginasi-daftar">
              <button
                type="button"
                className="tombol-paginasi"
                disabled={halaman === 0}
                onClick={() => setHalaman((h) => Math.max(0, h - 1))}
              >
                ← Sebelumnya
              </button>

              <span className="teks-halaman-saat-ini">
                Halaman {halaman + 1} dari {totalHalaman}
              </span>

              <button
                type="button"
                className="tombol-paginasi"
                disabled={halaman >= totalHalaman - 1}
                onClick={() => setHalaman((h) => Math.min(totalHalaman - 1, h + 1))}
              >
                Berikutnya →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
