import { useEffect, useState } from "react";
import arrowLeftSvg from "../assets/icons/arrow-left.svg";
import {
  ambilDaftarModerator,
  ambilSesiPelapor,
  keluarPelapor,
  perbaruiStatusLaporan,
  type ItemLaporan as ItemAntrean,
  type PenggunaPelapor,
  DATA_AWAL_LAPORAN as DATA_AWAL_ANTEAN,
} from "../lib/layananLaporan";
import { apakahSupabaseAktif } from "../lib/supabase";

interface Props {
  /** "lapor" dipakai saat halaman ini menggantikan formulir warga di menu Lapor. */
  varian?: "internal" | "lapor";
  /** Dipanggil setelah moderator keluar, supaya halaman induk ikut diperbarui. */
  onKeluar?: () => void;
}

export default function Moderator({ varian = "internal", onKeluar }: Props) {
  const [subHalaman, setSubHalaman] = useState<"daftar" | "detail">("daftar");
  const [daftar, setDaftar] = useState<ItemAntrean[]>(() =>
    apakahSupabaseAktif ? [] : DATA_AWAL_ANTEAN
  );
  const [terpilih, setTerpilih] = useState<ItemAntrean>(DATA_AWAL_ANTEAN[0]!);
  const [kataKunci, setKataKunci] = useState("");
  const [kodeCek, setKodeCek] = useState("");
  const [pesanCek, setPesanCek] = useState<string | null>(null);
  const [sedangCek, setSedangCek] = useState(false);
  const [saringStatus, setSaringStatus] = useState<string>("semua");
  const [statusDipilih, setStatusDipilih] = useState<
    "Diterima" | "Butuh verifikasi" | "Ditolak"
  >("Butuh verifikasi");
  const [catatanInput, setCatatanInput] = useState("");
  const [pesanTersimpan, setPesanTersimpan] = useState(false);
  const [sedangSimpan, setSedangSimpan] = useState(false);
  const [sedangMuat, setSedangMuat] = useState(apakahSupabaseAktif);
  const [galat, setGalat] = useState<string | null>(null);
  const [sesi, setSesi] = useState<PenggunaPelapor | null>(null);

  const peranPengguna = sesi?.role ?? null;
  const punyaAksesModerator =
    !apakahSupabaseAktif ||
    peranPengguna === "moderator" ||
    peranPengguna === "admin";

  useEffect(() => {
    let batal = false;

    async function muat() {
      try {
        const sesiAktif = await ambilSesiPelapor();
        if (batal) return;
        setSesi(sesiAktif);

        const items = await ambilDaftarModerator();
        if (batal) return;

        setDaftar(items);
        if (items.length > 0) {
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
      } catch (err) {
        if (!batal) {
          setGalat(
            err instanceof Error ? err.message : "Gagal memuat antrean laporan."
          );
        }
      } finally {
        if (!batal) setSedangMuat(false);
      }
    }

    muat();
    return () => {
      batal = true;
    };
  }, []);

  async function handleKeluar() {
    await keluarPelapor();
    setSesi(null);
    if (onKeluar) onKeluar();
    else window.location.reload();
  }

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

  async function handleCekKode(e: React.FormEvent) {
    e.preventDefault();
    const bersih = kodeCek.trim().toUpperCase();

    if (!bersih) {
      setPesanCek("Masukkan kode rujukan terlebih dahulu.");
      return;
    }

    setSedangCek(true);
    setPesanCek(null);

    try {
      let ketemu = daftar.find((it) => it.kode.toUpperCase() === bersih);

      if (!ketemu) {
        // Muat ulang sekali, siapa tahu laporan masuk setelah halaman dibuka.
        const terbaru = await ambilDaftarModerator();
        setDaftar(terbaru);
        ketemu = terbaru.find((it) => it.kode.toUpperCase() === bersih);
      }

      if (!ketemu) {
        setPesanCek(
          `Laporan dengan kode ${bersih} tidak ditemukan. Periksa kembali kode rujukannya.`
        );
        return;
      }

      bukaDetail(ketemu);
    } catch (err) {
      setPesanCek(
        err instanceof Error ? err.message : "Gagal memeriksa kode laporan."
      );
    } finally {
      setSedangCek(false);
    }
  }

  function bukaDetail(item: ItemAntrean) {
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
  }

  async function handleSimpanKeputusan() {
    if (!punyaAksesModerator) {
      setGalat(
        "Akun ini belum punya role moderator/admin, jadi keputusan tidak bisa disimpan ke server. Minta admin menaikkan role akun di tabel profil_pengguna."
      );
      return;
    }

    setSedangSimpan(true);
    setGalat(null);
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

      // Ambil ulang dari server supaya yang tampil benar-benar data
      // yang tersimpan, bukan sekadar perubahan sementara di layar.
      try {
        const terbaru = await ambilDaftarModerator();
        const tersimpan = terbaru.find((it) => it.kode === terpilih.kode);
        if (tersimpan) {
          setDaftar(terbaru);
          setTerpilih(tersimpan);
          setCatatanInput(tersimpan.catatanModerator || "");
        }
      } catch {
        // Penyimpanan sudah berhasil; gagal memuat ulang tidak perlu
        // membatalkan tampilan.
      }

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
    } catch (err) {
      setGalat(
        err instanceof Error
          ? err.message
          : "Gagal menyimpan keputusan ke server."
      );
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
            <p className="remah-kategori">
              {varian === "lapor" ? "LAPORAN WARGA · MODERATOR" : "MODERATOR · INTERNAL"}
            </p>
            <h1 className="judul-halaman-utama">Pusat moderasi laporan</h1>
            <p className="deskripsi-halaman-utama">
              Akun moderator tidak mengirim laporan warga. Periksa laporan lewat kode
              rujukan, lalu tinjau pengajuan yang masuk dan tetapkan statusnya.
            </p>

            <div className="baris-badge-atas-tabel">
              <span className="badge-lapisan netral">
                {peranPengguna === "admin"
                  ? "Akses admin"
                  : peranPengguna === "moderator"
                  ? "Akses moderator"
                  : "Akses terbatas"}
              </span>
              <span className="badge-lapisan netral">Setiap perubahan status tercatat</span>
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

            {sesi && punyaAksesModerator && (
              <div className="kartu-sesi-pengguna">
                <span className="badge-lapisan resmi">
                  {peranPengguna === "admin" ? "Admin" : "Moderator"}
                </span>
                <p className="teks-sesi-aktif">
                  Masuk sebagai <strong>{sesi.nama}</strong> ({sesi.email})
                </p>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <button type="button" className="tombol-keluar-sesi" onClick={handleKeluar}>
                    Keluar
                  </button>
                </div>
              </div>
            )}

            {galat && (
              <div
                role="alert"
                style={{
                  background: "#fee2e2",
                  color: "#991b1b",
                  padding: "10px 14px",
                  borderRadius: 6,
                  fontSize: 13,
                  marginBottom: 16,
                  border: "1px solid #fecaca",
                }}
              >
                {galat}
              </div>
            )}

            {apakahSupabaseAktif && !sedangMuat && !punyaAksesModerator && (
              <div
                style={{
                  background: "#fef3c7",
                  color: "#92400e",
                  padding: "10px 14px",
                  borderRadius: 6,
                  fontSize: 12.5,
                  marginBottom: 16,
                  border: "1px solid #fcd34d",
                }}
              >
                {peranPengguna
                  ? `Akun ini masuk sebagai "${peranPengguna}". Perubahan status hanya bisa disimpan oleh akun dengan role moderator atau admin.`
                  : "Kamu belum masuk. Masuk dengan akun moderator untuk menyimpan perubahan status."}
              </div>
            )}

            {/* Container 1: cek laporan spesifik lewat kode rujukan */}
            <section className="kartu-moderator-beranda" data-name="Cek laporan dengan kode">
              <h2 className="judul-kartu-moderator">Cek laporan dengan kode</h2>
              <p className="deskripsi-kartu-moderator">
                Punya kode rujukan dari pelapor atau warga? Masukkan di sini untuk
                langsung membuka laporan itu, tanpa menelusuri antrean.
              </p>
              <form className="baris-cek-kode-moderator" onSubmit={handleCekKode}>
                <input
                  type="text"
                  className="input-standar"
                  placeholder="Contoh: LNT-8A3F-9K2L"
                  value={kodeCek}
                  onChange={(e) => {
                    setKodeCek(e.target.value);
                    if (pesanCek) setPesanCek(null);
                  }}
                  aria-label="Kode rujukan laporan"
                />
                <button type="submit" className="tombol-aksi-utama" disabled={sedangCek}>
                  {sedangCek ? "Memeriksa..." : "Cek laporan"}
                </button>
              </form>
              {pesanCek && <p className="pesan-cek-kode">{pesanCek}</p>}
            </section>

            {/* Container 2: pengajuan yang perlu diputuskan */}
            <section
              className="kartu-moderator-beranda kartu-moderator-antrean"
              data-name="Pengajuan laporan"
            >
              <div className="kepala-antrean-moderator">
                <div>
                  <h2 className="judul-kartu-moderator">Pengajuan laporan</h2>
                  <p className="deskripsi-kartu-moderator" style={{ marginBottom: 0 }}>
                    {jumlahMenunggu + jumlahButuh > 0
                      ? `${jumlahMenunggu + jumlahButuh} laporan menunggu keputusan. Klik satu baris untuk membaca detail dan menetapkan status.`
                      : "Belum ada pengajuan yang menunggu keputusan saat ini."}
                  </p>
                </div>

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

              <div className="baris-penyaring-antrean">
                <input
                  type="text"
                  placeholder="Cari kode, pelapor, atau wilayah"
                  className="input-cari-moderator"
                  value={kataKunci}
                  onChange={(e) => setKataKunci(e.target.value)}
                  aria-label="Cari kode, pelapor, atau wilayah"
                />
                <span className="jumlah-hasil-antrean">
                  Menampilkan {disaring.length} dari {daftar.length} laporan
                </span>
              </div>

              <div className="wadah-gulir-tabel" data-name="Tabel">
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
                        onClick={() => bukaDetail(item)}
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
                          {sedangMuat
                            ? "Memuat antrean laporan dari server..."
                            : "Tidak ada laporan yang sesuai dengan penyaring."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
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

            {galat && (
              <div
                role="alert"
                style={{
                  background: "#fee2e2",
                  color: "#991b1b",
                  padding: "10px 14px",
                  borderRadius: 6,
                  fontSize: 13,
                  marginBottom: 16,
                  border: "1px solid #fecaca",
                }}
              >
                {galat}
              </div>
            )}

            {apakahSupabaseAktif && !sedangMuat && !punyaAksesModerator && (
              <div
                style={{
                  background: "#fef3c7",
                  color: "#92400e",
                  padding: "10px 14px",
                  borderRadius: 6,
                  fontSize: 12.5,
                  marginBottom: 16,
                  border: "1px solid #fcd34d",
                }}
              >
                {peranPengguna
                  ? `Akun ini masuk sebagai "${peranPengguna}". Hanya akun dengan role moderator atau admin yang bisa menyimpan keputusan.`
                  : "Kamu belum masuk. Masuk dengan akun moderator untuk menyimpan keputusan."}
              </div>
            )}

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
                    disabled={sedangSimpan || !punyaAksesModerator}
                    title={
                      punyaAksesModerator
                        ? undefined
                        : "Akun ini belum punya role moderator/admin"
                    }
                  >
                    {sedangSimpan ? "Menyimpan..." : "Simpan keputusan"}
                  </button>

                  {pesanTersimpan && (
                    <p className="pesan-sukses-mod">Keputusan tersimpan di server.</p>
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
