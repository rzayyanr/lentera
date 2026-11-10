import { useCallback, useEffect, useRef, useState } from "react";
import arrowLeftSvg from "../assets/icons/arrow-left.svg";
import {
  ambilSesiPelapor,
  masukPelapor,
  daftarPelapor,
  keluarPelapor,
  kirimLaporanKeServer,
  periksaStatusLaporan,
  buatKodeRujukan,
  type ItemLaporan,
  type PenggunaPelapor,
} from "../lib/layananLaporan";
import { apakahSupabaseAktif } from "../lib/supabase";

export type { PenggunaPelapor };

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
  const [pengguna, setPengguna] = useState<PenggunaPelapor | null>(null);
  const [memuatSesi, setMemuatSesi] = useState(true);
  const [tabAuth, setTabAuth] = useState<"masuk" | "daftar">("masuk");

  // Form Auth Input
  const [authEmail, setAuthEmail] = useState("farshaldybagas@gmail.com");
  const [authPassword, setAuthPassword] = useState("••••••••••••");
  const [authNama, setAuthNama] = useState("Muhammad Bagas Farshaldy");
  const [authTelepon, setAuthTelepon] = useState("0812-3456-7890");
  const [galatAuth, setGalatAuth] = useState<string | null>(null);
  const [sedangAuth, setSedangAuth] = useState(false);

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
  const [berkasFoto, setBerkasFoto] = useState<File | null>(null);
  const [pratinjauFoto, setPratinjauFoto] = useState<string | null>(null);
  const [sedangKirim, setSedangKirim] = useState(false);
  const [galatKirim, setGalatKirim] = useState<string | null>(null);
  const inputBerkasRef = useRef<HTMLInputElement | null>(null);

  // State Halaman Status
  const [kodeInput, setKodeInput] = useState("LNT-8F2K-4Q9D");
  const [laporanDitemukan, setLaporanDitemukan] = useState<ItemLaporan | null>(null);
  const [sedangCekStatus, setSedangCekStatus] = useState(false);
  const [statusDicari, setStatusDicari] = useState(false);

  const daftarJenis = [
    "Banjir",
    "Tanah longsor",
    "Angin kencang",
    "Gempa",
    "Lainnya",
  ];

  // Muat sesi pengguna saat komponen dimuat
  useEffect(() => {
    let batal = false;
    ambilSesiPelapor().then((sesi) => {
      if (!batal) {
        setPengguna(sesi);
        setMemuatSesi(false);
      }
    });
    return () => {
      batal = true;
    };
  }, []);

  const handleCariStatus = useCallback(async (targetKode?: string) => {
    const kodeCari = (targetKode || kodeInput).trim();
    if (!kodeCari) return;

    setSedangCekStatus(true);
    setStatusDicari(true);
    try {
      const data = await periksaStatusLaporan(kodeCari);
      setLaporanDitemukan(data);
    } finally {
      setSedangCekStatus(false);
    }
  }, [kodeInput]);

  // Periksa status otomatis jika membuka halaman status
  useEffect(() => {
    let aktif = true;
    if (tampilan === "status" && kodeInput.trim()) {
      queueMicrotask(() => {
        if (aktif) setSedangCekStatus(true);
      });
      periksaStatusLaporan(kodeInput)
        .then((data) => {
          if (aktif) {
            setLaporanDitemukan(data);
            setStatusDicari(true);
          }
        })
        .finally(() => {
          if (aktif) {
            setSedangCekStatus(false);
          }
        });
    }
    return () => {
      aktif = false;
    };
  }, [tampilan, kodeInput]);

  async function handleKeluar() {
    await keluarPelapor();
    setPengguna(null);
  }

  async function handleMasuk(e: React.FormEvent) {
    e.preventDefault();
    setSedangAuth(true);
    setGalatAuth(null);
    try {
      if (tabAuth === "masuk") {
        const res = await masukPelapor(authEmail, authPassword);
        setPengguna(res);
      } else {
        const res = await daftarPelapor(authNama, authEmail, authPassword, authTelepon);
        setPengguna(res);
      }
      setTampilan("kirim");
    } catch (err) {
      setGalatAuth(err instanceof Error ? err.message : "Gagal memproses autentikasi");
    } finally {
      setSedangAuth(false);
    }
  }

  function handlePilihBerkas(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setBerkasFoto(file);
      const url = URL.createObjectURL(file);
      setPratinjauFoto(url);
    }
  }

  async function handleKirimLaporan(e: React.FormEvent) {
    e.preventDefault();
    setSedangKirim(true);
    setGalatKirim(null);

    const kodeBaru = buatKodeRujukan();

    try {
      const hasil = await kirimLaporanKeServer(
        {
          jenis: jenisKejadian,
          wilayah: kabupaten,
          desa: kecamatan,
          tanggalKejadian: tanggal,
          dampak: dampak,
          deskripsi: deskripsi,
          pelapor: pengguna?.nama || "Muhammad Bagas Farshaldy",
          kontak: pengguna?.telepon || "0812-3456-7890",
          email: pengguna?.email || "farshaldybagas@gmail.com",
          kodeKustom: kodeBaru,
        },
        berkasFoto || undefined
      );

      setKodeInput(hasil.kode);
      setLaporanDitemukan(hasil);
      setStatusDicari(true);
      setBerkasFoto(null);
      setPratinjauFoto(null);
      setTampilan("status");
    } catch (err) {
      setGalatKirim(err instanceof Error ? err.message : "Gagal mengirim laporan");
    } finally {
      setSedangKirim(false);
    }
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

            {/* Indikator Penyimpanan Backend */}
            <div style={{ marginBottom: 16 }}>
              <span
                className="badge-lapisan"
                style={{
                  background: apakahSupabaseAktif ? "#e6f4ea" : "#fef3c7",
                  color: apakahSupabaseAktif ? "#137333" : "#92400e",
                  border: `1px solid ${apakahSupabaseAktif ? "#a8dab5" : "#fcd34d"}`,
                  fontSize: "11px",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontWeight: 600,
                }}
              >
                {apakahSupabaseAktif
                  ? "● Cloud Database Aktif (Supabase)"
                  : "○ Mode Lokal Terisolasi (LocalStorage)"}
              </span>
            </div>

            {/* Banner Peringatan Bukan Kanal Darurat */}
            <div className="banner-peringatan-darurat">
              <span className="ikon-tanda-seru" aria-hidden="true">!</span>
              <p className="teks-peringatan-darurat">
                Bukan kanal darurat. Untuk keadaan darurat, hubungi 112 atau BPBD setempat.
              </p>
            </div>

            {/* Status Akun bila sudah login */}
            {!memuatSesi && pengguna && (
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
                  onClick={() => {
                    handleCariStatus(kodeInput);
                    setTampilan("status");
                  }}
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
                    onClick={() => {
                      setTabAuth("masuk");
                      setGalatAuth(null);
                    }}
                  >
                    Masuk (Sign in)
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={tabAuth === "daftar"}
                    className={`tab-auth-item ${tabAuth === "daftar" ? "aktif" : ""}`}
                    onClick={() => {
                      setTabAuth("daftar");
                      setGalatAuth(null);
                    }}
                  >
                    Daftar akun baru
                  </button>
                </div>

                {galatAuth && (
                  <div
                    style={{
                      background: "#fee2e2",
                      color: "#991b1b",
                      padding: "10px 14px",
                      borderRadius: 6,
                      fontSize: 13,
                      marginBottom: 16,
                    }}
                  >
                    {galatAuth}
                  </div>
                )}

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
                      EMAIL PELAPOR
                    </label>
                    <input
                      id="auth-email-input"
                      type="email"
                      className="input-standar"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="nama@email.com"
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
                      placeholder="Minimal 6 karakter"
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

                  <button
                    type="submit"
                    className="tombol-aksi-utama tombol-panjang"
                    disabled={sedangAuth}
                  >
                    {sedangAuth
                      ? "Memproses..."
                      : tabAuth === "masuk"
                      ? "Masuk dan Lanjutkan Lapor"
                      : "Daftar dan Lanjutkan Lapor"}
                  </button>

                  <div className="pemisah-auth-garis">
                    <span>— atau gunakan sesi simulasi cepat —</span>
                  </div>

                  <button
                    type="button"
                    className="tombol-aksi-sekunder tombol-panjang"
                    onClick={() => {
                      const dataDemo: PenggunaPelapor = {
                        nama: authNama.trim() || "Muhammad Bagas Farshaldy",
                        email: authEmail.trim() || "farshaldybagas@gmail.com",
                        telepon: authTelepon.trim() || "0812-3456-7890",
                        instansi: "Warga Terverifikasi",
                        role: "warga",
                      };
                      setPengguna(dataDemo);
                      try {
                        localStorage.setItem("lentera_pelapor", JSON.stringify(dataDemo));
                      } catch {
                        // abaikan
                      }
                      setTampilan("kirim");
                    }}
                  >
                    Masuk Cepat sebagai Pelapor Terverifikasi
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

            {galatKirim && (
              <div
                style={{
                  background: "#fee2e2",
                  color: "#991b1b",
                  padding: "10px 14px",
                  borderRadius: 6,
                  fontSize: 13,
                  marginBottom: 16,
                }}
              >
                {galatKirim}
              </div>
            )}

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

                {/* Bukti Foto Input */}
                <div className="kelompok-form">
                  <label className="label-input-kapital">BUKTI FOTO</label>
                  <input
                    type="file"
                    ref={inputBerkasRef}
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handlePilihBerkas}
                  />
                  <div
                    className="area-unggah-berkas"
                    onClick={() => inputBerkasRef.current?.click()}
                  >
                    {berkasFoto ? (
                      <div>
                        <p className="teks-unggah" style={{ fontWeight: 600, color: "var(--warna-tinta)" }}>
                          ✓ {berkasFoto.name} ({(berkasFoto.size / 1024).toFixed(1)} KB)
                        </p>
                        <p className="teks-unggah" style={{ fontSize: 11, marginTop: 4 }}>
                          Klik untuk ganti berkas
                        </p>
                        {pratinjauFoto && (
                          <img
                            src={pratinjauFoto}
                            alt="Pratinjau foto"
                            style={{
                              maxHeight: 120,
                              borderRadius: 4,
                              marginTop: 10,
                              border: "1px solid var(--warna-garis)",
                            }}
                          />
                        )}
                      </div>
                    ) : (
                      <p className="teks-unggah">
                        Tarik foto ke sini atau klik untuk memilih berkas gambar
                      </p>
                    )}
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
                  <button
                    type="submit"
                    className="tombol-aksi-utama"
                    disabled={sedangKirim}
                  >
                    {sedangKirim ? "Mengirim laporan..." : "Kirim laporan"}
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
                      onClick={() => handleCariStatus(kodeInput)}
                      disabled={sedangCekStatus}
                    >
                      {sedangCekStatus ? "Memeriksa..." : "Periksa status"}
                    </button>
                  </div>
                  <p className="catatan-kode-karakter">
                    Kode terdiri dari 12 karakter, ditulis dengan tanda hubung.
                  </p>
                </div>

                {/* Hasil Status Timeline */}
                {laporanDitemukan ? (
                  <div className="kartu-hasil-status" data-name="Hasil status">
                    <div className="kepala-hasil-status">
                      <div>
                        <h2 className="judul-laporan-kode">Laporan {laporanDitemukan.kode}</h2>
                        <p className="subjudul-laporan-waktu">
                          Dikirim {laporanDitemukan.dikirim} WIB · {laporanDitemukan.wilayah}
                          {laporanDitemukan.desa ? `, ${laporanDitemukan.desa}` : ""}
                        </p>
                      </div>
                      <span className="badge-lapisan resmi">
                        Pelapor: {laporanDitemukan.pelapor}
                      </span>
                    </div>

                    <div style={{ marginTop: 12, marginBottom: 16 }}>
                      <p style={{ fontSize: "13.5px", color: "var(--warna-tinta)" }}>
                        <strong>Kejadian:</strong> {laporanDitemukan.jenis} — {laporanDitemukan.deskripsi}
                      </p>
                      {laporanDitemukan.fotoUrl && (
                        <div style={{ marginTop: 10 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--warna-redup)" }}>
                            BUKTI FOTO TERLAMPIR:
                          </span>
                          <img
                            src={laporanDitemukan.fotoUrl}
                            alt="Bukti foto laporan"
                            style={{
                              display: "block",
                              maxHeight: 180,
                              borderRadius: 4,
                              marginTop: 6,
                              border: "1px solid var(--warna-garis)",
                            }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="timeline-status-laporan">
                      {/* Tahap 1: Diterima */}
                      <div className="item-timeline-status selesai">
                        <div className="dot-timeline-status" />
                        <div className="konten-timeline-status">
                          <div className="kepala-status-timeline">
                            <span className="label-tahap-status">DITERIMA</span>
                            <span className="waktu-tahap-status">{laporanDitemukan.dikirim}</span>
                          </div>
                          <p className="deskripsi-tahap-status">
                            Laporan tercatat dan terikat dengan akun pelapor terverifikasi.
                          </p>
                        </div>
                      </div>

                      {/* Tahap 2: Moderasi */}
                      <div
                        className={`item-timeline-status ${
                          laporanDitemukan.status === "Butuh verifikasi"
                            ? "aktif-butuh"
                            : laporanDitemukan.status === "Menunggu"
                            ? "pending"
                            : "selesai"
                        }`}
                      >
                        <div className="dot-timeline-status" />
                        <div className="konten-timeline-status">
                          <div className="kepala-status-timeline">
                            <span className="label-tahap-status">
                              {laporanDitemukan.status.toUpperCase()}
                            </span>
                            <span className="waktu-tahap-status">
                              Moderator: {laporanDitemukan.moderator}
                            </span>
                          </div>
                          <p className="deskripsi-tahap-status">
                            {laporanDitemukan.catatanModerator}
                          </p>
                        </div>
                      </div>

                      {/* Tahap 3: Hasil Publikasi */}
                      <div
                        className={`item-timeline-status ${
                          laporanDitemukan.status === "Diterbitkan"
                            ? "selesai"
                            : laporanDitemukan.status === "Ditolak"
                            ? "aktif-butuh"
                            : "pending"
                        }`}
                      >
                        <div className="dot-timeline-status" />
                        <div className="konten-timeline-status">
                          <div className="kepala-status-timeline">
                            <span
                              className={`label-tahap-status ${
                                laporanDitemukan.status === "Diterbitkan" ||
                                laporanDitemukan.status === "Ditolak"
                                  ? ""
                                  : "redup"
                              }`}
                            >
                              {laporanDitemukan.status === "Diterbitkan"
                                ? "DITERBITKAN KE PETA"
                                : laporanDitemukan.status === "Ditolak"
                                ? "LAPORAN DITOLAK"
                                : "PENERBITAN"}
                            </span>
                            <span className="waktu-tahap-status redup">
                              {laporanDitemukan.status === "Diterbitkan"
                                ? "Aktif"
                                : "—"}
                            </span>
                          </div>
                          <p
                            className={`deskripsi-tahap-status ${
                              laporanDitemukan.status === "Diterbitkan" ||
                              laporanDitemukan.status === "Ditolak"
                                ? ""
                                : "redup"
                            }`}
                          >
                            {laporanDitemukan.status === "Diterbitkan"
                              ? "Laporan telah disetujui dan ditayangkan sebagai lapisan laporan warga di Lentera."
                              : laporanDitemukan.status === "Ditolak"
                              ? "Laporan diarsipkan dan tidak diterbitkan ke peta publik."
                              : "Status penayangan ke peta publik muncul setelah verifikasi tuntas."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : statusDicari ? (
                  <div className="kartu-hasil-status">
                    <p style={{ color: "#b91c1c", margin: 0, fontSize: "14px" }}>
                      Laporan dengan kode <strong>{kodeInput}</strong> tidak ditemukan. Pastikan format penulisan sesuai (misalnya: <code>LNT-8F2K-4Q9D</code>).
                    </p>
                  </div>
                ) : null}
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
                      <span>Pemeriksaan berkas foto berlangsung maksimal 1×24 jam kerja.</span>
                    </li>
                  </ul>
                </section>

                <section className="kartu-panduan-laporan" data-name="Kanal darurat">
                  <h2 className="judul-seksi-kartu">Butuh pertolongan darurat?</h2>
                  <p className="teks-privasi-laporan">
                    Lentera tidak memiliki unit tanggap darurat lapangan. Hubungi kontak darurat daerah:
                  </p>
                  <p className="teks-nomor-darurat">
                    <strong>112</strong> (Panggilan Darurat Bebas Pulsa)
                  </p>
                </section>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
