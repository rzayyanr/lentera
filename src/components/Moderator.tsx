import { useState } from "react";
import arrowLeftSvg from "../assets/icons/arrow-left.svg";

interface ItemAntrean {
  kode: string;
  dikirim: string;
  wilayah: string;
  desa: string;
  jenis: string;
  status: "Menunggu" | "Butuh verifikasi" | "Diterbitkan" | "Ditolak";
  moderator: string;
  deskripsi: string;
  catatanModerator: string;
  tanggalKejadian: string;
  pelapor: string;
  kontak: string;
  email: string;
}

const DATA_AWAL_ANTEAN: ItemAntrean[] = [
  {
    kode: "LNT-8F2K-4Q9D",
    dikirim: "12 Nov 2025, 09.14",
    wilayah: "Probolinggo Kabupaten",
    desa: "Kel./Ds. Kedasih, Kec. Sukapura",
    jenis: "Tanah longsor",
    status: "Butuh verifikasi",
    moderator: "Belum ditinjau",
    deskripsi:
      "Tanah menutup jalan desa sepanjang sekitar 30 meter. Tidak ada korban jiwa, satu rumah terdampak. Akses dari arah utara tidak bisa dilewati.",
    catatanModerator:
      "Foto belum menunjukkan titik lokasi yang jelas. Minta pelapor mengunggah foto dengan penanda jalan.",
    tanggalKejadian: "31 Desember 2025",
    pelapor: "Muhammad Bagas Farshaldy",
    kontak: "0812-3456-7890",
    email: "farshaldybagas@gmail.com",
  },
  {
    kode: "LNT-3M7P-1XCV",
    dikirim: "12 Nov 2025, 08.02",
    wilayah: "Lumajang Kabupaten",
    desa: "Kec. Pronojiwo",
    jenis: "Banjir",
    status: "Diterbitkan",
    moderator: "Raka",
    deskripsi: "Genangan air setinggi 40 cm di permukiman RT 02.",
    catatanModerator: "Laporan terverifikasi lewat kontak posko.",
    tanggalKejadian: "12 November 2025",
    pelapor: "Ahmad Fauzi",
    kontak: "0813-8821-4455",
    email: "fauzi.relawan@gmail.com",
  },
  {
    kode: "LNT-9Q4T-6BNM",
    dikirim: "11 Nov 2025, 21.40",
    wilayah: "Pasuruan Kabupaten",
    desa: "Kec. Grati",
    jenis: "Angin kencang",
    status: "Menunggu",
    moderator: "—",
    deskripsi: "Atap beberapa kios pasar terbawa angin saat hujan deras.",
    catatanModerator: "Menunggu pemeriksaan berkas foto.",
    tanggalKejadian: "11 November 2025",
    pelapor: "Dewi Lestari",
    kontak: "0857-1902-8831",
    email: "dewilestari@yahoo.com",
  },
  {
    kode: "LNT-2W8K-5JHD",
    dikirim: "11 Nov 2025, 17.11",
    wilayah: "Malang Kota",
    desa: "Kec. Klojen",
    jenis: "Gempa",
    status: "Menunggu",
    moderator: "—",
    deskripsi: "Getaran terasa kuat sekitar 5 detik, tidak ada retakan bangunan.",
    catatanModerator: "Menunggu data konfirmasi BMKG.",
    tanggalKejadian: "11 November 2025",
    pelapor: "Budi Santoso",
    kontak: "0821-7765-1290",
    email: "budi.malang@gmail.com",
  },
  {
    kode: "LNT-7C1V-3RTY",
    dikirim: "11 Nov 2025, 11.25",
    wilayah: "Sidoarjo Kabupaten",
    desa: "Kec. Porong",
    jenis: "Banjir",
    status: "Ditolak",
    moderator: "Nadia",
    deskripsi: "Foto yang dilampirkan adalah dokumentasi banjir tahun 2021.",
    catatanModerator: "Foto tidak sesuai waktu kejadian (duplikasi lama).",
    tanggalKejadian: "10 November 2025",
    pelapor: "Rian Hidayat",
    kontak: "0896-4432-8811",
    email: "rian.hid@outlook.com",
  },
  {
    kode: "LNT-5B6N-8KLP",
    dikirim: "10 Nov 2025, 19.03",
    wilayah: "Gresik Kabupaten",
    desa: "Kec. Manyar",
    jenis: "Kebakaran",
    status: "Diterbitkan",
    moderator: "Raka",
    deskripsi: "Kebakaran ilalang dekat kawasan industri, sudah ditangani damkar.",
    catatanModerator: "Terverifikasi dengan rilis damkar setempat.",
    tanggalKejadian: "10 November 2025",
    pelapor: "Siti Rahmawati",
    kontak: "0812-9988-7766",
    email: "siti.rahma@gmail.com",
  },
  {
    kode: "LNT-4H2S-9WQE",
    dikirim: "10 Nov 2025, 15.48",
    wilayah: "Jember Kabupaten",
    desa: "Kec. Silo",
    jenis: "Tanah longsor",
    status: "Butuh verifikasi",
    moderator: "Nadia",
    deskripsi: "Tebing jalan raya longsor menutup separuh lajur kendaraan.",
    catatanModerator: "Perlu konfirmasi status pembukaan jalan.",
    tanggalKejadian: "10 November 2025",
    pelapor: "Hendra Kusuma",
    kontak: "0878-1122-3344",
    email: "hendra.ksm@gmail.com",
  },
];

export default function Moderator() {
  const [subHalaman, setSubHalaman] = useState<"daftar" | "detail">("daftar");
  const [daftar, setDaftar] = useState<ItemAntrean[]>(() => {
    try {
      const extraStr = localStorage.getItem("lentera_laporan_tambahan");
      if (extraStr) {
        const extra: ItemAntrean[] = JSON.parse(extraStr);
        return [...extra, ...DATA_AWAL_ANTEAN];
      }
    } catch {
      // ignore
    }
    return DATA_AWAL_ANTEAN;
  });
  const [terpilih, setTerpilih] = useState<ItemAntrean>(() => {
    try {
      const extraStr = localStorage.getItem("lentera_laporan_tambahan");
      if (extraStr) {
        const extra: ItemAntrean[] = JSON.parse(extraStr);
        if (extra[0]) return extra[0];
      }
    } catch {
      // ignore
    }
    return DATA_AWAL_ANTEAN[0]!;
  });
  const [kataKunci, setKataKunci] = useState("");
  const [saringStatus, setSaringStatus] = useState<string>("semua");
  const [statusDipilih, setStatusDipilih] = useState<
    "Diterima" | "Butuh verifikasi" | "Ditolak"
  >("Butuh verifikasi");
  const [pesanTersimpan, setPesanTersimpan] = useState(false);

  const disaring = daftar.filter((item) => {
    if (saringStatus === "menunggu" && item.status !== "Menunggu") return false;
    if (saringStatus === "butuh" && item.status !== "Butuh verifikasi") return false;
    if (saringStatus === "diterbitkan" && item.status !== "Diterbitkan") return false;
    if (saringStatus === "ditolak" && item.status !== "Ditolak") return false;
    if (kataKunci.trim()) {
      const q = kataKunci.toLowerCase();
      return (
        item.kode.toLowerCase().includes(q) ||
        item.wilayah.toLowerCase().includes(q) ||
        item.jenis.toLowerCase().includes(q)
      );
    }
    return true;
  });

  function handleSimpanKeputusan() {
    const updatedStatus =
      statusDipilih === "Diterima"
        ? "Diterbitkan"
        : statusDipilih === "Butuh verifikasi"
        ? "Butuh verifikasi"
        : "Ditolak";

    setDaftar((prev) =>
      prev.map((it) =>
        it.kode === terpilih.kode
          ? { ...it, status: updatedStatus as ItemAntrean["status"], moderator: "Nadia" }
          : it
      )
    );
    setPesanTersimpan(true);
    setTimeout(() => setPesanTersimpan(false), 2500);
  }

  return (
    <div className="halaman-moderator-laporan">
      <div className="wadah-konten-lebar">
        {/* ==============================================================
            16 · Moderator — daftar laporan
            ============================================================== */}
        {subHalaman === "daftar" && (
          <div data-node-id="16:391" data-name="16 · Moderator — daftar laporan">
            <p className="remah-kategori">MODERATOR · INTERNAL</p>
            <h1 className="judul-halaman-utama">Antrean laporan masuk</h1>
            <p className="deskripsi-halaman-utama">
              Halaman ini tidak muncul di navigasi warga. Akses memakai kode pengelola dan setiap perubahan status tercatat.
            </p>

            <div className="baris-badge-atas-tabel">
              <span className="badge-lapisan netral">Akses terbatas</span>
              <span className="badge-lapisan netral">Di luar navigasi warga</span>
            </div>

            {/* Penyaring & Pencarian */}
            <div className="kartu-penyaring-moderator" data-name="Penyaring">
              <div className="baris-penyaring-moderator">
                <input
                  type="text"
                  placeholder="Cari kode atau wilayah"
                  className="input-cari-moderator"
                  value={kataKunci}
                  onChange={(e) => setKataKunci(e.target.value)}
                  aria-label="Cari kode atau wilayah"
                />

                <div className="baris-filter-status-chips">
                  <button
                    type="button"
                    className={`chip-filter-mod ${saringStatus === "semua" ? "aktif" : ""}`}
                    onClick={() => setSaringStatus("semua")}
                  >
                    Semua 24
                  </button>
                  <button
                    type="button"
                    className={`chip-filter-mod ${saringStatus === "menunggu" ? "aktif" : ""}`}
                    onClick={() => setSaringStatus("menunggu")}
                  >
                    Menunggu 12
                  </button>
                  <button
                    type="button"
                    className={`chip-filter-mod ${saringStatus === "butuh" ? "aktif" : ""}`}
                    onClick={() => setSaringStatus("butuh")}
                  >
                    Butuh bukti 7
                  </button>
                  <button
                    type="button"
                    className={`chip-filter-mod ${saringStatus === "diterbitkan" ? "aktif" : ""}`}
                    onClick={() => setSaringStatus("diterbitkan")}
                  >
                    Diterbitkan 4
                  </button>
                  <button
                    type="button"
                    className={`chip-filter-mod ${saringStatus === "ditolak" ? "aktif" : ""}`}
                    onClick={() => setSaringStatus("ditolak")}
                  >
                    Ditolak 1
                  </button>
                </div>
              </div>
            </div>

            {/* Tabel Antrean */}
            <div className="kartu-tabel-lapisan" data-name="Tabel">
              <div className="wadah-gulir-tabel">
                <table className="tabel-bantuan-resmi tabel-moderator">
                  <thead>
                    <tr>
                      <th scope="col" style={{ width: "16%" }}>KODE</th>
                      <th scope="col" style={{ width: "18%" }}>DIKIRIM</th>
                      <th scope="col" style={{ width: "24%" }}>WILAYAH</th>
                      <th scope="col" style={{ width: "16%" }}>JENIS</th>
                      <th scope="col" style={{ width: "14%" }}>STATUS</th>
                      <th scope="col" style={{ width: "12%" }}>MODERATOR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {disaring.map((item) => (
                      <tr
                        key={item.kode}
                        className="baris-dapat-diklik"
                        onClick={() => {
                          setTerpilih(item);
                          setSubHalaman("detail");
                        }}
                      >
                        <td className="tebal-teks kode-monokrom">{item.kode}</td>
                        <td>{item.dikirim}</td>
                        <td>{item.wilayah}</td>
                        <td>{item.jenis}</td>
                        <td>
                          <span
                            className={`badge-status-tabel ${
                              item.status === "Diterbitkan"
                                ? "hijau"
                                : item.status === "Butuh verifikasi"
                                ? "oranye"
                                : item.status === "Ditolak"
                                ? "merah"
                                : "abu"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td>{item.moderator}</td>
                      </tr>
                    ))}
                    {disaring.length === 0 && (
                      <tr>
                        <td colSpan={6} className="tabel-kosong">
                          Tidak ada laporan yang sesuai dengan penyaring.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==============================================================
            17 · Moderator — detail dan verifikasi
            ============================================================== */}
        {subHalaman === "detail" && (
          <div data-node-id="16:494" data-name="17 · Moderator — detail dan verifikasi">
            <button
              type="button"
              className="tombol-kembali-teks"
              onClick={() => setSubHalaman("daftar")}
            >
              <img src={arrowLeftSvg} alt="" width="14" height="14" />
              <span>Antrean laporan</span>
            </button>

            <h1 className="judul-halaman-utama">Laporan {terpilih.kode}</h1>
            <p className="deskripsi-halaman-utama">
              Dikirim {terpilih.dikirim} WIB · {terpilih.wilayah}, Jawa Timur
            </p>

            <div className="baris-badge-atas-tabel">
              <span className="badge-lapisan warga">{terpilih.status}</span>
              <span className="badge-lapisan warga">Laporan warga</span>
            </div>

            <div className="grid-detail-kejadian">
              {/* Kolom Kiri: Isi Laporan */}
              <div className="kolom-kiri-kejadian">
                <section className="kartu-kejadian" data-name="Isi laporan">
                  <h2 className="judul-seksi-kartu">Isi laporan</h2>
                  <div className="grid-field-kejadian">
                    <div className="item-field">
                      <span className="label-field">Jenis</span>
                      <span className="nilai-field">{terpilih.jenis}</span>
                    </div>
                    <div className="item-field">
                      <span className="label-field">Tanggal</span>
                      <span className="nilai-field">{terpilih.tanggalKejadian}</span>
                    </div>
                    <div className="item-field">
                      <span className="label-field">Kabupaten</span>
                      <span className="nilai-field">{terpilih.wilayah}</span>
                    </div>
                    <div className="item-field">
                      <span className="label-field">Desa</span>
                      <span className="nilai-field">{terpilih.desa}</span>
                    </div>
                    <div className="item-field">
                      <span className="label-field">Pelapor</span>
                      <span className="nilai-field">
                        {terpilih.pelapor} · {terpilih.kontak} ({terpilih.email})
                      </span>
                    </div>
                  </div>

                  <div className="seksi-deskripsi-pelapor">
                    <span className="label-field">Deskripsi pelapor</span>
                    <p className="nilai-deskripsi-teks">{terpilih.deskripsi}</p>
                  </div>

                  <div className="kotak-bukti-unggah" data-name="Bukti">
                    <p>1 foto lokasi · 1.842 × 1.036 · diunggah 09.14 WIB</p>
                  </div>

                  <div className="seksi-catatan-moderator">
                    <span className="label-field">
                      Catatan moderator · 12 Nov 2025, 14.02
                    </span>
                    <p className="nilai-catatan-teks">{terpilih.catatanModerator}</p>
                  </div>
                </section>
              </div>

              {/* Kolom Kanan: Ubah status & Riwayat */}
              <div className="kolom-kanan-kejadian">
                <section className="kartu-kejadian" data-name="Ubah status">
                  <h2 className="judul-seksi-kartu">Ubah status</h2>
                  <div className="daftar-opsi-ubah-status">
                    <label className="opsi-radio-status">
                      <input
                        type="radio"
                        name="status-mod"
                        checked={statusDipilih === "Diterima"}
                        onChange={() => setStatusDipilih("Diterima")}
                      />
                      <div className="teks-opsi-radio">
                        <span className="nama-opsi">Diterima</span>
                        <span className="keterangan-opsi">
                          Tampil di peta sebagai lapisan warga.
                        </span>
                      </div>
                    </label>

                    <label className="opsi-radio-status">
                      <input
                        type="radio"
                        name="status-mod"
                        checked={statusDipilih === "Butuh verifikasi"}
                        onChange={() => setStatusDipilih("Butuh verifikasi")}
                      />
                      <div className="teks-opsi-radio">
                        <span className="nama-opsi">Butuh verifikasi</span>
                        <span className="keterangan-opsi">
                          Minta bukti tambahan dari pelapor.
                        </span>
                      </div>
                    </label>

                    <label className="opsi-radio-status">
                      <input
                        type="radio"
                        name="status-mod"
                        checked={statusDipilih === "Ditolak"}
                        onChange={() => setStatusDipilih("Ditolak")}
                      />
                      <div className="teks-opsi-radio">
                        <span className="nama-opsi">Ditolak</span>
                        <span className="keterangan-opsi">
                          Sertakan alasan yang bisa dibaca pelapor.
                        </span>
                      </div>
                    </label>
                  </div>

                  <button
                    type="button"
                    className="tombol-aksi-utama"
                    onClick={handleSimpanKeputusan}
                  >
                    Simpan keputusan
                  </button>

                  {pesanTersimpan && (
                    <p className="pesan-sukses-mod">Keputusan berhasil diperbarui.</p>
                  )}
                </section>

                <section className="kartu-kejadian" data-name="Riwayat moderasi">
                  <h2 className="judul-seksi-kartu">Riwayat moderasi</h2>
                  <div className="daftar-riwayat-moderasi">
                    <div className="baris-riwayat-mod">
                      <span className="waktu-mod">12 Nov 14.02</span>
                      <span className="aksi-mod">Nadia · Butuh verifikasi</span>
                    </div>
                    <div className="baris-riwayat-mod">
                      <span className="waktu-mod">12 Nov 09.20</span>
                      <span className="aksi-mod">Sistem · Menunggu</span>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
