import { useState } from "react";
import arrowLeftSvg from "../assets/icons/arrow-left.svg";

export interface PenggunaPelapor {
  nama: string;
  email: string;
  telepon: string;
  instansi?: string;
}

interface Props {
  subHalamanAwal?: "beranda" | "masuk" | "kirim" | "status";
  onKembaliKePeta?: () => void;
}

export default function LaporanWarga({
  subHalamanAwal = "beranda",
  onKembaliKePeta,
}: Props) {
  const [tampilan, setTampilan] = useState<"beranda" | "masuk" | "kirim" | "status">(
    subHalamanAwal
  );

  // Sesi Pengguna Pelapor (Auth State)
  const [pengguna, setPengguna] = useState<PenggunaPelapor | null>(() => {
    try {
      const saved = localStorage.getItem("lentera_pelapor");
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return null;
  });
  const [tabAuth, setTabAuth] = useState<"masuk" | "daftar">("masuk");

  // Form Auth Input
  const [authEmail, setAuthEmail] = useState("farshaldybagas@gmail.com");
  const [authPassword, setAuthPassword] = useState("••••••••••••");
  const [authNama, setAuthNama] = useState("Muhammad Bagas Farshaldy");
  const [authTelepon, setAuthTelepon] = useState("0812-3456-7890");

  // State Formulir Laporan
  const [jenisKejadian, setJenisKejadian] = useState("Tanah longsor");
  const [kabupaten, setKabupaten] = useState("Probolinggo Kabupaten");
  const [kecamatan, setKecamatan] = useState("Kec. Sukapura");
  const [tanggal, setTanggal] = useState("31 Desember 2025");
  const [dampak, setDampak] = useState("Rumah terdampak, jalan tertutup");
  const [deskripsi, setDeskripsi] = useState(
    "Tanah menutup jalan desa sepanjang sekitar 30 meter. Tidak ada korban jiwa, satu rumah terdampak."
  );
  const [setuju, setSetuju] = useState(true);
  const [kodeInput, setKodeInput] = useState("LNT-8F2K-4Q9D");

  const daftarJenis = [
    "Banjir",
    "Tanah longsor",
    "Angin kencang",
    "Gempa",
    "Lainnya",
  ];

  function simpanSesi(data: PenggunaPelapor) {
    setPengguna(data);
    try {
      localStorage.setItem("lentera_pelapor", JSON.stringify(data));
    } catch {
      // ignore
    }
  }

  function handleKeluar() {
    setPengguna(null);
    try {
      localStorage.removeItem("lentera_pelapor");
    } catch {
      // ignore
    }
  }

  function handleMasuk(e: React.FormEvent) {
    e.preventDefault();
    const data: PenggunaPelapor = {
      nama: authNama.trim() || "Muhammad Bagas Farshaldy",
      email: authEmail.trim() || "farshaldybagas@gmail.com",
      telepon: authTelepon.trim() || "0812-3456-7890",
      instansi: "Warga Terverifikasi",
    };
    simpanSesi(data);
    setTampilan("kirim");
  }

  function handleKirimLaporan(e: React.FormEvent) {
    e.preventDefault();
    const kodeBaru = kodeInput || `LNT-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    setKodeInput(kodeBaru);

    // Simpan ke antrean laporan tersinkronisasi
    try {
      const existingStr = localStorage.getItem("lentera_laporan_tambahan");
      const list = existingStr ? JSON.parse(existingStr) : [];
      list.unshift({
        kode: kodeBaru,
        dikirim: "Baru saja",
        wilayah: kabupaten,
        desa: kecamatan,
        jenis: jenisKejadian,
        status: "Butuh verifikasi",
        moderator: "Belum ditinjau",
        deskripsi: deskripsi,
        catatanModerator: "Laporan baru masuk, menunggu verifikasi awal dari moderator.",
        tanggalKejadian: tanggal,
        pelapor: pengguna?.nama || "Muhammad Bagas Farshaldy",
        kontak: pengguna?.telepon || "0812-3456-7890",
        email: pengguna?.email || "farshaldybagas@gmail.com",
      });
      localStorage.setItem("lentera_laporan_tambahan", JSON.stringify(list));
    } catch {
      // ignore
    }

    setTampilan("status");
  }

  function mulaiLapor() {
    if (pengguna) {
      setTampilan("kirim");
    } else {
      setTampilan("masuk");
    }
  }

  return (
    <div className="halaman-laporan-warga">
      <div className="wadah-konten-lebar">
        {/* ==============================================================
            06 · Laporan warga — Beranda
            ============================================================== */}
        {tampilan === "beranda" && (
          <div data-node-id="11:141" data-name="06 · Laporan warga">
            {onKembaliKePeta && (
              <button
                type="button"
                className="tombol-kembali-teks"
                onClick={onKembaliKePeta}
              >
                <img src={arrowLeftSvg} alt="" width="14" height="14" />
                <span>Peta</span>
              </button>
            )}
            <p className="remah-kategori">LAPORAN WARGA</p>
            <h1 className="judul-halaman-utama">Laporkan kejadian di sekitar kamu</h1>
            <p className="deskripsi-halaman-utama">
              Laporan warga tidak dicampur dengan data resmi. Setiap laporan diverifikasi oleh moderator dan terikat pada akun pelapor yang sah agar data dapat dipertanggungjawabkan.
            </p>

            {/* Banner Peringatan Bukan Kanal Darurat */}
            <div className="banner-peringatan-darurat">
              <span className="ikon-tanda-seru" aria-hidden="true">!</span>
              <p className="teks-peringatan-darurat">
                Bukan kanal darurat. Untuk keadaan darurat, hubungi 112 atau BPBD setempat.
              </p>
            </div>

            {/* Status Akun bila sudah login */}
            {pengguna && (
              <div className="kartu-sesi-pengguna">
                <span className="badge-lapisan resmi">Sesi Aktif</span>
                <p className="teks-sesi-aktif">
                  Masuk sebagai <strong>{pengguna.nama}</strong> ({pengguna.email} · {pengguna.telepon})
                </p>
                <button
                  type="button"
                  className="tombol-keluar-sesi"
                  onClick={handleKeluar}
                >
                  Keluar
                </button>
              </div>
            )}

            {/* Grid 2 Pilihan: Kirim vs Periksa */}
            <div className="grid-dua-kartu-laporan">
              {/* Card 1: Kirim laporan */}
              <div className="kartu-opsi-laporan" data-name="Kirim laporan">
                <h2 className="judul-opsi-laporan">Kirim laporan</h2>
                <p className="subjudul-opsi-laporan">
                  Pelapor wajib masuk atau mendaftar akun terlebih dahulu agar identitas terverifikasi dan ketertelusuran data terjaga.
                </p>

                <ol className="daftar-langkah-laporan">
                  <li>
                    <span className="angka-langkah">1</span>
                    <span>Masuk / Verifikasi identitas pelapor</span>
                  </li>
                  <li>
                    <span className="angka-langkah">2</span>
                    <span>Jenis kejadian dan tanggal</span>
                  </li>
                  <li>
                    <span className="angka-langkah">3</span>
                    <span>Kabupaten, kecamatan, atau desa</span>
                  </li>
                  <li>
                    <span className="angka-langkah">4</span>
                    <span>Deskripsi, bukti foto, dan rujukan status</span>
                  </li>
                </ol>

                <button
                  type="button"
                  className="tombol-aksi-utama"
                  onClick={mulaiLapor}
                >
                  {pengguna ? "Mulai kirim laporan" : "Masuk & Mulai Lapor"}
                </button>
              </div>

              {/* Card 2: Periksa status */}
              <div className="kartu-opsi-laporan" data-name="Periksa status">
                <h2 className="judul-opsi-laporan">Periksa status</h2>
                <p className="subjudul-opsi-laporan">
                  Masukkan kode rujukan yang kamu terima setelah mengirim laporan.
                </p>

                <div className="wadah-input-kode-rujukan">
                  <label htmlFor="input-kode-rujukan-beranda" className="label-input-kapital">
                    KODE RUJUKAN
                  </label>
                  <input
                    id="input-kode-rujukan-beranda"
                    type="text"
                    className="input-kode-teks"
                    value={kodeInput}
                    onChange={(e) => setKodeInput(e.target.value.toUpperCase())}
                    placeholder="LNT-8F2K-4Q9D"
                  />
                </div>

                <button
                  type="button"
                  className="tombol-aksi-sekunder"
                  onClick={() => setTampilan("status")}
                >
                  Periksa
                </button>

                <p className="catatan-privasi-kode">
                  Kode ini tidak memuat data pribadi dan hanya bisa dipakai untuk melihat status.
                </p>
              </div>
            </div>

            {/* Label Footer */}
            <div className="baris-penjelasan-label">
              <span className="badge-lapisan warga">Laporan warga</span>
              <p className="teks-penjelasan-label">
                Laporan warga selalu diberi label oranye dan tidak pernah digabung dengan angka resmi.
              </p>
            </div>
          </div>
        )}

        {/* ==============================================================
            06a · Masuk atau daftar pelapor (Autentikasi Pelapor)
            ============================================================== */}
        {tampilan === "masuk" && (
          <div data-node-id="11:auth" data-name="06a · Masuk atau daftar pelapor">
            <button
              type="button"
              className="tombol-kembali-teks"
              onClick={() => setTampilan("beranda")}
            >
              <img src={arrowLeftSvg} alt="" width="14" height="14" />
              <span>Laporan warga</span>
            </button>

            <p className="remah-kategori">AKUN PELAPOR</p>
            <h1 className="judul-halaman-utama">Masuk atau buat akun pelapor</h1>
            <p className="deskripsi-halaman-utama">
              Untuk menjaga integritas dan ketertelusuran laporan, pelapor wajib masuk menggunakan akun terverifikasi sebelum mengirim laporan.
            </p>

            <div className="grid-formulir-dan-sidebar">
              {/* Kolom Kiri: Form Sign In / Sign Up */}
              <div className="kartu-formulir-utama">
                {/* Tab Switcher */}
                <div className="baris-pilihan-tab-auth" role="tablist">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={tabAuth === "masuk"}
                    className={`tab-auth-item ${tabAuth === "masuk" ? "aktif" : ""}`}
                    onClick={() => setTabAuth("masuk")}
                  >
                    Masuk (Sign in)
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={tabAuth === "daftar"}
                    className={`tab-auth-item ${tabAuth === "daftar" ? "aktif" : ""}`}
                    onClick={() => setTabAuth("daftar")}
                  >
                    Daftar akun baru
                  </button>
                </div>

                <form onSubmit={handleMasuk} className="form-isi-auth">
                  {tabAuth === "daftar" && (
                    <div className="kelompok-form">
                      <label htmlFor="auth-nama-input" className="label-input-kapital">
                        NAMA LENGKAP PELAPOR
                      </label>
                      <input
                        id="auth-nama-input"
                        type="text"
                        className="input-standar"
                        value={authNama}
                        onChange={(e) => setAuthNama(e.target.value)}
                        placeholder="Masukkan nama lengkap"
                        required
                      />
                    </div>
                  )}

                  <div className="kelompok-form">
                    <label htmlFor="auth-email-input" className="label-input-kapital">
                      EMAIL ATAU NOMOR WHATSAPP
                    </label>
                    <input
                      id="auth-email-input"
                      type="text"
                      className="input-standar"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="nama@email.com atau 08123456789"
                      required
                    />
                  </div>

                  {tabAuth === "daftar" && (
                    <div className="kelompok-form">
                      <label htmlFor="auth-telepon-input" className="label-input-kapital">
                        NOMOR TELEPON / WHATSAPP AKTIF
                      </label>
                      <input
                        id="auth-telepon-input"
                        type="tel"
                        className="input-standar"
                        value={authTelepon}
                        onChange={(e) => setAuthTelepon(e.target.value)}
                        placeholder="Contoh: 0812-3456-7890"
                        required
                      />
                    </div>
                  )}

                  <div className="kelompok-form">
                    <label htmlFor="auth-password-input" className="label-input-kapital">
                      KATA SANDI
                    </label>
                    <input
                      id="auth-password-input"
                      type="password"
                      className="input-standar"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="baris-opsi-sandi">
                    <label className="label-ingat-saya">
                      <input type="checkbox" defaultChecked className="input-kotak-centang" />
                      <span>Ingat sesi masuk di perangkat ini</span>
                    </label>
                    {tabAuth === "masuk" && (
                      <span className="tautan-lupa-sandi">Lupa kata sandi?</span>
                    )}
                  </div>

                  <button type="submit" className="tombol-aksi-utama tombol-panjang">
                    {tabAuth === "masuk"
                      ? "Masuk dan Lanjutkan Lapor"
                      : "Daftar dan Lanjutkan Lapor"}
                  </button>

                  <div className="pemisah-auth-garis">
                    <span>— atau lanjutkan dengan —</span>
                  </div>

                  <button
                    type="button"
                    className="tombol-aksi-sekunder tombol-panjang"
                    onClick={() => {
                      const dataGoogle: PenggunaPelapor = {
                        nama: "Muhammad Bagas Farshaldy",
                        email: "farshaldybagas@gmail.com",
                        telepon: "0812-3456-7890",
                        instansi: "Akun Google Terverifikasi",
                      };
                      simpanSesi(dataGoogle);
                      setTampilan("kirim");
                    }}
                  >
                    Masuk dengan Akun Google
                  </button>
                </form>
              </div>

              {/* Kolom Kanan: Panduan Kenapa Harus Masuk */}
              <div className="kolom-sidebar-laporan">
                <section className="kartu-panduan-laporan" data-name="Kenapa Harus Masuk">
                  <h2 className="judul-seksi-kartu">Kenapa pelapor harus masuk?</h2>
                  <ul className="daftar-titik-panduan">
                    <li>
                      <span className="titik-simbol">•</span>
                      <span>Riwayat laporan kamu terlacak rapi di bawah akun sendiri.</span>
                    </li>
                    <li>
                      <span className="titik-simbol">•</span>
                      <span>Mencegah laporan palsu demi keakuratan peta bencana publik.</span>
                    </li>
                    <li>
                      <span className="titik-simbol">•</span>
                      <span>Memudahkan moderator memverifikasi dan meminta bukti tambahan.</span>
                    </li>
                    <li>
                      <span className="titik-simbol">•</span>
                      <span>Data pribadi disimpan aman dan tidak dipublikasikan ke peta umum.</span>
                    </li>
                  </ul>
                </section>

                <section className="kartu-panduan-laporan" data-name="Privasi Pelapor">
                  <h2 className="judul-seksi-kartu">Integritas & privasi data pelapor</h2>
                  <p className="teks-privasi-laporan">
                    Lentera memverifikasi data nomor dan email pelapor untuk mencegah spam dan sabotase data, namun identitas di peta publik hanya ditampilkan sampai tingkat desa tanpa menyebarkan nomor kontak.
                  </p>
                  <div className="badge-wrapper-privasi">
                    <span className="badge-lapisan resmi">Akun Terverifikasi</span>
                  </div>
                </section>
              </div>
            </div>
          </div>
        )}

        {/* ==============================================================
            07 · Formulir kirim laporan
            ============================================================== */}
        {tampilan === "kirim" && (
          <div data-node-id="11:199" data-name="07 · Formulir kirim laporan">
            <button
              type="button"
              className="tombol-kembali-teks"
              onClick={() => setTampilan("beranda")}
            >
              <img src={arrowLeftSvg} alt="" width="14" height="14" />
              <span>Laporan warga</span>
            </button>

            <h1 className="judul-halaman-utama">Kirim laporan</h1>
            <p className="deskripsi-halaman-utama">
              Laporan masuk ke antrean moderasi. Kamu akan menerima kode rujukan setelah mengirim.
            </p>

            {/* Banner Akun Pelapor Terverifikasi */}
            <div className="kartu-akun-pelapor-banner">
              <div className="kiri-akun-banner">
                <span className="badge-lapisan resmi">Pelapor Terverifikasi</span>
                <p className="nama-pelapor-terikat">
                  {pengguna?.nama || "Muhammad Bagas Farshaldy"} · {pengguna?.telepon || "0812-3456-7890"} ({pengguna?.email || "farshaldybagas@gmail.com"})
                </p>
              </div>
              <button
                type="button"
                className="tombol-ganti-akun-link"
                onClick={() => setTampilan("masuk")}
              >
                Ganti Akun
              </button>
            </div>

            <div className="grid-formulir-dan-sidebar">
              {/* Kolom Kiri: Formulir */}
              <form className="kartu-formulir-utama" onSubmit={handleKirimLaporan}>
                <div className="kelompok-form">
                  <label className="label-input-kapital">JENIS KEJADIAN</label>
                  <div className="baris-pilihan-chip" role="radiogroup">
                    {daftarJenis.map((j) => (
                      <button
                        key={j}
                        type="button"
                        role="radio"
                        aria-checked={jenisKejadian === j}
                        className={`chip-pilihan ${jenisKejadian === j ? "aktif" : ""}`}
                        onClick={() => setJenisKejadian(j)}
                      >
                        {j}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid-dua-kolom-input">
                  <div className="kelompok-form">
                    <label htmlFor="kabupaten-input" className="label-input-kapital">
                      KABUPATEN / KOTA
                    </label>
                    <input
                      id="kabupaten-input"
                      type="text"
                      className="input-standar"
                      value={kabupaten}
                      onChange={(e) => setKabupaten(e.target.value)}
                      required
                    />
                  </div>

                  <div className="kelompok-form">
                    <label htmlFor="kecamatan-input" className="label-input-kapital">
                      KECAMATAN / DESA
                    </label>
                    <input
                      id="kecamatan-input"
                      type="text"
                      className="input-standar"
                      value={kecamatan}
                      onChange={(e) => setKecamatan(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid-dua-kolom-input">
                  <div className="kelompok-form">
                    <label htmlFor="tanggal-input" className="label-input-kapital">
                      TANGGAL KEJADIAN
                    </label>
                    <input
                      id="tanggal-input"
                      type="text"
                      className="input-standar"
                      value={tanggal}
                      onChange={(e) => setTanggal(e.target.value)}
                      required
                    />
                  </div>

                  <div className="kelompok-form">
                    <label htmlFor="dampak-input" className="label-input-kapital">
                      PERKIRAAN DAMPAK
                    </label>
                    <input
                      id="dampak-input"
                      type="text"
                      className="input-standar"
                      value={dampak}
                      onChange={(e) => setDampak(e.target.value)}
                    />
                  </div>
                </div>

                <div className="kelompok-form">
                  <label htmlFor="deskripsi-input" className="label-input-kapital">
                    DESKRIPSI
                  </label>
                  <textarea
                    id="deskripsi-input"
                    rows={4}
                    className="textarea-standar"
                    value={deskripsi}
                    onChange={(e) => setDeskripsi(e.target.value)}
                    required
                  />
                </div>

                <div className="kelompok-form">
                  <label className="label-input-kapital">BUKTI FOTO</label>
                  <div className="area-unggah-berkas">
                    <p className="teks-unggah">Tarik foto ke sini atau pilih berkas</p>
                  </div>
                </div>

                <div className="baris-persetujuan-checkbox">
                  <input
                    id="pernyataan-benar"
                    type="checkbox"
                    checked={setuju}
                    onChange={(e) => setSetuju(e.target.checked)}
                    required
                    className="input-kotak-centang"
                  />
                  <label htmlFor="pernyataan-benar" className="label-persetujuan">
                    Saya menyatakan laporan ini benar dan bukan kanal darurat.
                  </label>
                </div>

                <div className="baris-tombol-formulir">
                  <button type="submit" className="tombol-aksi-utama">
                    Kirim laporan
                  </button>
                  <button
                    type="button"
                    className="tombol-batal-teks"
                    onClick={() => setTampilan("beranda")}
                  >
                    Batal
                  </button>
                </div>
              </form>

              {/* Kolom Kanan: Panduan & Privasi */}
              <div className="kolom-sidebar-laporan">
                <section className="kartu-panduan-laporan" data-name="Sebelum mengirim">
                  <h2 className="judul-seksi-kartu">Sebelum mengirim</h2>
                  <ul className="daftar-titik-panduan">
                    <li>
                      <span className="titik-simbol">•</span>
                      <span>Pastikan lokasi cukup spesifik, minimal kecamatan.</span>
                    </li>
                    <li>
                      <span className="titik-simbol">•</span>
                      <span>Sertakan foto bila ada, bukan tangkapan layar percakapan.</span>
                    </li>
                    <li>
                      <span className="titik-simbol">•</span>
                      <span>Laporan terhubung dengan profil pelapor terverifikasi.</span>
                    </li>
                    <li>
                      <span className="titik-simbol">•</span>
                      <span>Laporan palsu dapat menyebabkan akun diblokir.</span>
                    </li>
                  </ul>
                </section>

                <section className="kartu-panduan-laporan" data-name="Privasi">
                  <h2 className="judul-seksi-kartu">Privasi dan masa simpan</h2>
                  <p className="teks-privasi-laporan">
                    Identitas nama dan nomor kontak pelapor tersimpan aman untuk audit verifikasi moderator dan tidak dipublikasikan ke peta umum. Laporan tanpa perubahan status selama 90 hari ditutup otomatis.
                  </p>
                  <div className="badge-wrapper-privasi">
                    <span className="badge-lapisan warga">Laporan warga</span>
                  </div>
                </section>
              </div>
            </div>
          </div>
        )}

        {/* ==============================================================
            08 · Periksa status laporan
            ============================================================== */}
        {tampilan === "status" && (
          <div data-node-id="11:279" data-name="08 · Periksa status laporan">
            <button
              type="button"
              className="tombol-kembali-teks"
              onClick={() => setTampilan("beranda")}
            >
              <img src={arrowLeftSvg} alt="" width="14" height="14" />
              <span>Laporan warga</span>
            </button>

            <h1 className="judul-halaman-utama">Periksa status laporan</h1>
            <p className="deskripsi-halaman-utama">
              Masukkan kode rujukan yang kamu terima setelah mengirim laporan.
            </p>

            <div className="grid-formulir-dan-sidebar">
              {/* Kolom Kiri: Input Kode & Hasil */}
              <div className="kolom-kiri-status">
                {/* Kotak Input Kode */}
                <div className="kartu-input-status" data-name="Kode rujukan">
                  <label htmlFor="input-kode-rujukan-halaman" className="label-input-kapital">
                    KODE RUJUKAN
                  </label>
                  <div className="baris-input-dan-tombol">
                    <input
                      id="input-kode-rujukan-halaman"
                      type="text"
                      className="input-standar input-kode"
                      value={kodeInput}
                      onChange={(e) => setKodeInput(e.target.value.toUpperCase())}
                      placeholder="LNT-8F2K-4Q9D"
                    />
                    <button
                      type="button"
                      className="tombol-aksi-utama tombol-cek-status"
                      onClick={() => setKodeInput(kodeInput || "LNT-8F2K-4Q9D")}
                    >
                      Periksa status
                    </button>
                  </div>
                  <p className="catatan-kode-karakter">
                    Kode terdiri dari 12 karakter, ditulis dengan tanda hubung.
                  </p>
                </div>

                {/* Hasil Status Timeline */}
                <div className="kartu-hasil-status" data-name="Hasil status">
                  <div className="kepala-hasil-status">
                    <div>
                      <h2 className="judul-laporan-kode">Laporan {kodeInput || "LNT-8F2K-4Q9D"}</h2>
                      <p className="subjudul-laporan-waktu">
                        Dikirim 12 November 2025, 09.14 WIB · Probolinggo Kabupaten
                      </p>
                    </div>
                    <span className="badge-lapisan resmi">
                      Pelapor: {pengguna?.nama || "Muhammad Bagas Farshaldy"}
                    </span>
                  </div>

                  <div className="timeline-status-laporan">
                    {/* Tahap 1: Diterima */}
                    <div className="item-timeline-status selesai">
                      <div className="dot-timeline-status" />
                      <div className="konten-timeline-status">
                        <div className="kepala-status-timeline">
                          <span className="label-tahap-status">DITERIMA</span>
                          <span className="waktu-tahap-status">12 November 2025, 09.14</span>
                        </div>
                        <p className="deskripsi-tahap-status">
                          Laporan tercatat dan terikat dengan akun pelapor terverifikasi.
                        </p>
                      </div>
                    </div>

                    {/* Tahap 2: Butuh Verifikasi */}
                    <div className="item-timeline-status aktif-butuh">
                      <div className="dot-timeline-status" />
                      <div className="konten-timeline-status">
                        <div className="kepala-status-timeline">
                          <span className="label-tahap-status">BUTUH VERIFIKASI</span>
                          <span className="waktu-tahap-status">12 November 2025, 14.02</span>
                        </div>
                        <p className="deskripsi-tahap-status">
                          Moderator meminta foto lokasi yang lebih jelas dari pelapor.
                        </p>
                      </div>
                    </div>

                    {/* Tahap 3: Menunggu */}
                    <div className="item-timeline-status pending">
                      <div className="dot-timeline-status" />
                      <div className="konten-timeline-status">
                        <div className="kepala-status-timeline">
                          <span className="label-tahap-status redup">MENUNGGU</span>
                          <span className="waktu-tahap-status redup">—</span>
                        </div>
                        <p className="deskripsi-tahap-status redup">
                          Status berikutnya muncul setelah bukti tambahan diperiksa.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Kolom Kanan: Catatan Kode Rujukan */}
              <div className="kolom-sidebar-laporan">
                <section className="kartu-panduan-laporan" data-name="Catatan">
                  <h2 className="judul-seksi-kartu">Tentang akun pelapor & kode</h2>
                  <ul className="daftar-titik-panduan">
                    <li>
                      <span className="titik-simbol">•</span>
                      <span>Laporan terikat pada akun untuk memudahkan pelacakan histori.</span>
                    </li>
                    <li>
                      <span className="titik-simbol">•</span>
                      <span>Moderator dapat menghubungi pelapor langsung jika butuh klarifikasi.</span>
                    </li>
                    <li>
                      <span className="titik-simbol">•</span>
                      <span>Laporan tanpa perubahan status selama 90 hari ditutup otomatis.</span>
                    </li>
                    <li>
                      <span className="titik-simbol">•</span>
                      <span>Status Ditolak selalu disertai alasan tertulis dari tim verifikasi.</span>
                    </li>
                  </ul>
                  <div className="badge-wrapper-privasi">
                    <span className="badge-lapisan warga">Laporan warga</span>
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
