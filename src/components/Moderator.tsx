import { useEffect, useState } from "react";
import arrowLeftSvg from "../assets/icons/arrow-left.svg";
import {
  ambilDaftarModerator,
  perbaruiStatusLaporan,
  type ItemLaporan as ItemAntrean,
  DATA_AWAL_LAPORAN as DATA_AWAL_ANTEAN,
} from "../lib/layananLaporan";
import { apakahSupabaseAktif } from "../lib/supabase";

export default function Moderator() {
  const [subHalaman, setSubHalaman] = useState<"daftar" | "detail">("daftar");
  const [daftar, setDaftar] = useState<ItemAntrean[]>(DATA_AWAL_ANTEAN);
  const [terpilih, setTerpilih] = useState<ItemAntrean>(DATA_AWAL_ANTEAN[0]!);
  const [kataKunci, setKataKunci] = useState("");
  const [saringStatus, setSaringStatus] = useState<string>("semua");
  const [statusDipilih, setStatusDipilih] = useState<
    "Diterima" | "Butuh verifikasi" | "Ditolak"
  >("Butuh verifikasi");
  const [catatanInput, setCatatanInput] = useState("");
  const [pesanTersimpan, setPesanTersimpan] = useState(false);
  const [sedangSimpan, setSedangSimpan] = useState(false);

  useEffect(() => {
    let batal = false;
    ambilDaftarModerator().then((items) => {
      if (!batal && items.length > 0) {
        setDaftar(items);
        const awal = items[0]!;
        setTerpilih(awal);
        setStatusDipilih(
          awal.status === "Diterbitkan"
            ? "Diterima"
            : awal.status === "Ditolak"
            ? "Ditolak"
            : "Butuh verifikasi"
        );
        setCatatanInput(awal.catatanModerator || "");
      }
    });
    return () => {
      batal = true;
    };
  }, []);

  const jumlahMenunggu = daftar.filter((i) => i.status === "Menunggu").length;
  const jumlahButuh = daftar.filter((i) => i.status === "Butuh verifikasi").length;
  const jumlahDiterbitkan = daftar.filter((i) => i.status === "Diterbitkan").length;
  const jumlahDitolak = daftar.filter((i) => i.status === "Ditolak").length;

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
        item.jenis.toLowerCase().includes(q) ||
        item.pelapor.toLowerCase().includes(q)
      );
    }
    return true;
  });

  async function handleSimpanKeputusan() {
    setSedangSimpan(true);
    const updatedStatus: ItemAntrean["status"] =
      statusDipilih === "Diterima"
        ? "Diterbitkan"
        : statusDipilih === "Butuh verifikasi"
        ? "Butuh verifikasi"
        : "Ditolak";

    const catatanFinal =
      catatanInput.trim() ||
      (updatedStatus === "Diterbitkan"
        ? "Laporan telah diverifikasi dan disetujui."
        : updatedStatus === "Ditolak"
        ? "Laporan tidak memenuhi kriteria verifikasi lapangan."
        : "Menunggu bukti tambahan dari pelapor.");

    try {
      await perbaruiStatusLaporan(terpilih.kode, updatedStatus, catatanFinal, "Nadia");

      setDaftar((prev) =>
        prev.map((it) =>
          it.kode === terpilih.kode
            ? {
                ...it,
                status: updatedStatus,
                moderator: "Nadia",
                catatanModerator: catatanFinal,
              }
            : it
        )
      );

      setTerpilih((prev) => ({
        ...prev,
        status: updatedStatus,
        moderator: "Nadia",
        catatanModerator: catatanFinal,
      }));

      setPesanTersimpan(true);
      setTimeout(() => setPesanTersimpan(false), 2500);
    } finally {
      setSedangSimpan(false);
    }
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
              <span
                className="badge-lapisan"
                style={{
                  background: apakahSupabaseAktif ? "#e6f4ea" : "#fef3c7",
                  color: apakahSupabaseAktif ? "#137333" : "#92400e",
                  border: `1px solid ${apakahSupabaseAktif ? "#a8dab5" : "#fcd34d"}`,
                  fontSize: "11px",
                }}
              >
                {apakahSupabaseAktif ? "● Supabase Terkoneksi" : "○ Mode Penyimpanan Lokal"}
              </span>
            </div>

            {/* Penyaring & Pencarian */}
            <div className="kartu-penyaring-moderator" data-name="Penyaring">
              <div className="baris-penyaring-moderator">
                <input
                  type="text"
                  placeholder="Cari kode, pelapor, atau wilayah"
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
                    Semua {daftar.length}
                  </button>
                  <button
                    type="button"
                    className={`chip-filter-mod ${saringStatus === "menunggu" ? "aktif" : ""}`}
                    onClick={() => setSaringStatus("menunggu")}
                  >
                    Menunggu {jumlahMenunggu}
                  </button>
                  <button
                    type="button"
                    className={`chip-filter-mod ${saringStatus === "butuh" ? "aktif" : ""}`}
                    onClick={() => setSaringStatus("butuh")}
                  >
                    Butuh bukti {jumlahButuh}
                  </button>
                  <button
                    type="button"
                    className={`chip-filter-mod ${saringStatus === "diterbitkan" ? "aktif" : ""}`}
                    onClick={() => setSaringStatus("diterbitkan")}
                  >
                    Diterbitkan {jumlahDiterbitkan}
                  </button>
                  <button
                    type="button"
                    className={`chip-filter-mod ${saringStatus === "ditolak" ? "aktif" : ""}`}
                    onClick={() => setSaringStatus("ditolak")}
                  >
                    Ditolak {jumlahDitolak}
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
                          setStatusDipilih(
                            item.status === "Diterbitkan"
                              ? "Diterima"
                              : item.status === "Ditolak"
                              ? "Ditolak"
                              : "Butuh verifikasi"
                          );
                          setCatatanInput(item.catatanModerator || "");
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

                  {terpilih.fotoUrl ? (
                    <div className="kotak-bukti-unggah" data-name="Bukti" style={{ textAlign: "left" }}>
                      <p style={{ fontWeight: 600, marginBottom: 8 }}>Foto bukti dari pelapor:</p>
                      <a href={terpilih.fotoUrl} target="_blank" rel="noreferrer">
                        <img
                          src={terpilih.fotoUrl}
                          alt="Foto bukti dari pelapor"
                          style={{
                            maxWidth: "100%",
                            maxHeight: 280,
                            borderRadius: 4,
                            border: "1px solid var(--warna-garis)",
                          }}
                        />
                      </a>
                    </div>
                  ) : (
                    <div className="kotak-bukti-unggah" data-name="Bukti">
                      <p>Tidak ada berkas foto yang dilampirkan oleh pelapor.</p>
                    </div>
                  )}

                  <div className="seksi-catatan-moderator">
                    <span className="label-field">
                      Catatan moderator saat ini
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

                  <div style={{ marginTop: 14, marginBottom: 14 }}>
                    <label
                      htmlFor="catatan-moderator-input"
                      style={{
                        display: "block",
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.05em",
                        color: "var(--warna-tinta)",
                        marginBottom: 6,
                      }}
                    >
                      CATATAN / ALASAN MODERATOR
                    </label>
                    <textarea
                      id="catatan-moderator-input"
                      rows={3}
                      className="textarea-standar"
                      value={catatanInput}
                      onChange={(e) => setCatatanInput(e.target.value)}
                      placeholder="Tuliskan catatan tindak lanjut atau alasan penolakan..."
                    />
                  </div>

                  <button
                    type="button"
                    className="tombol-aksi-utama"
                    onClick={handleSimpanKeputusan}
                    disabled={sedangSimpan}
                  >
                    {sedangSimpan ? "Menyimpan..." : "Simpan keputusan"}
                  </button>

                  {pesanTersimpan && (
                    <p className="pesan-sukses-mod">Keputusan berhasil diperbarui.</p>
                  )}
                </section>

                <section className="kartu-kejadian" data-name="Riwayat moderasi">
                  <h2 className="judul-seksi-kartu">Riwayat moderasi</h2>
                  <div className="daftar-riwayat-moderasi">
                    <div className="baris-riwayat-mod">
                      <span className="waktu-mod">{terpilih.dikirim}</span>
                      <span className="aksi-mod">
                        {terpilih.moderator !== "Belum ditinjau" ? terpilih.moderator : "Sistem"} ·{" "}
                        {terpilih.status}
                      </span>
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
