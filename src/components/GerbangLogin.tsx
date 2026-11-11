import { useState } from "react";
import {
  masukPelapor,
  daftarPelapor,
  type PenggunaPelapor,
} from "../lib/layananLaporan";
import logoSvg from "../assets/icons/logo.svg";

interface Props {
  onBerhasilMasuk: (pengguna: PenggunaPelapor) => void;
  onKembaliKePeta?: () => void;
}

// Akun contoh untuk mempercepat pengujian. Ganti kredensial warga dengan akun
// yang benar-benar terdaftar di Supabase Auth sebelum situs dipublikasikan.
const AKUN_DEMO = {
  warga: { email: "warga.demo@gmail.com", sandi: "warga12345" },
  moderator: { email: "admin@gmail.com", sandi: "admin123" },
} as const;

type PeranDemo = keyof typeof AKUN_DEMO;

export default function GerbangLogin({
  onBerhasilMasuk,
  onKembaliKePeta,
}: Props) {
  const [mode, setMode] = useState<"masuk" | "daftar">("masuk");
  const [email, setEmail] = useState("");
  const [sandi, setSandi] = useState("");
  const [lihatSandi, setLihatSandi] = useState(false);
  const [nama, setNama] = useState("");
  const [telepon, setTelepon] = useState("");
  const [ingatSaya, setIngatSaya] = useState(false);
  const [sedangProses, setSedangProses] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [demoAktif, setDemoAktif] = useState<PeranDemo | null>(null);

  function isiAkunDemo(peran: PeranDemo) {
    const akun = AKUN_DEMO[peran];
    setEmail(akun.email);
    setSandi(akun.sandi);
    setGalat(null);
    setDemoAktif(peran);
  }

  async function handleMasuk(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setGalat("Silakan masukkan alamat email.");
      return;
    }
    setSedangProses(true);
    setGalat(null);
    try {
      const res = await masukPelapor(email, sandi);
      onBerhasilMasuk(res);
    } catch (err) {
      const pesan = err instanceof Error ? err.message : "Gagal memproses masuk";
      if (pesan.includes("Invalid login credentials")) {
        setGalat("Email atau sandi tidak cocok. Gunakan admin@gmail.com untuk demo moderator, atau buat akun baru.");
      } else {
        setGalat(pesan);
      }
    } finally {
      setSedangProses(false);
    }
  }

  async function handleDaftar(e: React.FormEvent) {
    e.preventDefault();
    if (!nama.trim() || !email.trim() || !sandi.trim()) {
      setGalat("Nama, email, dan sandi wajib diisi.");
      return;
    }
    setSedangProses(true);
    setGalat(null);
    try {
      const res = await daftarPelapor(nama, email, sandi, telepon);
      onBerhasilMasuk(res);
    } catch (err) {
      const pesan = err instanceof Error ? err.message : "Gagal mendaftarkan akun";
      setGalat(pesan);
    } finally {
      setSedangProses(false);
    }
  }

  return (
    <main className="gate-wrap" id="gerbang">
      <div className="gate-kontainer">
        {onKembaliKePeta && (
          <button
            type="button"
            className="back"
            onClick={onKembaliKePeta}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            ← Kembali ke Peta
          </button>
        )}

        <div className="gate-kartu">
          <aside className="gate-visual">
            <svg
              className="pola pola-garis"
              viewBox="0 0 440 700"
              preserveAspectRatio="none"
              fill="none"
              aria-hidden="true"
            >
              <g stroke="#eaf2ef" strokeWidth="1.4">
                <path d="M-40 90 C 80 40, 150 160, 260 110 S 400 60, 500 130" />
                <path d="M-40 150 C 80 100, 150 220, 260 170 S 400 120, 500 190" />
                <path d="M-40 210 C 80 160, 150 280, 260 230 S 400 180, 500 250" />
                <path d="M-40 270 C 80 220, 150 340, 260 290 S 400 240, 500 310" />
                <path d="M-40 330 C 80 280, 150 400, 260 350 S 400 300, 500 370" />
                <path d="M-40 390 C 80 340, 150 460, 260 410 S 400 360, 500 430" />
                <path d="M-40 450 C 80 400, 150 520, 260 470 S 400 420, 500 490" />
                <path d="M-40 510 C 80 460, 150 580, 260 530 S 400 480, 500 550" />
                <path d="M-40 570 C 80 520, 150 640, 260 590 S 400 540, 500 610" />
                <path d="M-40 630 C 80 580, 150 700, 260 650 S 400 600, 500 670" />
              </g>
              <g fill="#eaf2ef">
                <circle cx="118" cy="164" r="4" />
                <circle cx="152" cy="286" r="3" />
                <circle cx="238" cy="224" r="5" />
                <circle cx="300" cy="412" r="3.5" />
                <circle cx="205" cy="512" r="4" />
                <circle cx="330" cy="566" r="3" />
              </g>
            </svg>

            <p className="label">Lentera · Laporan warga</p>
            <h2>Satu akun untuk melaporkan dampak bencana di sekitarmu.</h2>
            <div className="stat">
              <div>
                <b>1.284</b>
                <span>Laporan terverifikasi</span>
              </div>
              <div>
                <b>34</b>
                <span>Wilayah terjangkau</span>
              </div>
            </div>
          </aside>

          <section className="gate-form">
            <div className="brand-mini">
              <img
                src={logoSvg}
                alt="Logo Lentera"
                className="brand-mark"
                width="24"
                height="24"
              />
              <span>Lentera</span>
            </div>

            {galat && (
              <div className="pesan-galat-auth" role="alert">
                {galat}
              </div>
            )}

            {/* ------------------------------ MASUK ------------------------------ */}
            {mode === "masuk" && (
              <div id="panelMasuk">
                <h1>Masuk ke Lentera</h1>
                <p className="lede">
                  Menu Lapor hanya bisa dibuka setelah kamu masuk. Akun menentukan
                  apakah kamu diarahkan ke halaman warga atau halaman moderator.
                </p>

                <form id="formMasuk" onSubmit={handleMasuk}>
                  <div className={`field${demoAktif ? " terisi" : ""}`}>
                    <label htmlFor="emailMasuk">
                      EMAIL
                      {demoAktif && (
                        <span className="tanda-isi">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="m20 6-11 11-5-5" />
                          </svg>
                          terisi
                        </span>
                      )}
                    </label>
                    <input
                      id="emailMasuk"
                      type="email"
                      required
                      placeholder="nama@email.com"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setDemoAktif(null);
                      }}
                    />
                  </div>
                  <div className={`field${demoAktif ? " terisi" : ""}`}>
                    <label htmlFor="sandiMasuk">
                      SANDI
                      {demoAktif && (
                        <span className="tanda-isi">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="m20 6-11 11-5-5" />
                          </svg>
                          terisi
                        </span>
                      )}
                    </label>
                    <div className="kotak-input-sandi">
                      <input
                        id="sandiMasuk"
                        type={lihatSandi ? "text" : "password"}
                        required
                        placeholder="••••••••"
                        autoComplete="current-password"
                        value={sandi}
                        onChange={(e) => {
                          setSandi(e.target.value);
                          setDemoAktif(null);
                        }}
                      />
                      <button
                        type="button"
                        className="tombol-lihat-sandi"
                        onClick={() => setLihatSandi((v) => !v)}
                        title={lihatSandi ? "Sembunyikan sandi" : "Lihat sandi"}
                        aria-label={lihatSandi ? "Sembunyikan sandi" : "Lihat sandi"}
                      >
                        {lihatSandi ? (
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                            <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                            <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                            <line x1="2" x2="22" y1="2" y2="22" />
                          </svg>
                        ) : (
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="tautan-baris">
                    <label style={{ display: "flex", alignItems: "center", gap: 7, margin: 0, fontSize: 12, textTransform: "none", letterSpacing: 0, fontWeight: 400 }}>
                      <input
                        type="checkbox"
                        style={{ width: "auto", padding: 0 }}
                        checked={ingatSaya}
                        onChange={(e) => setIngatSaya(e.target.checked)}
                      />{" "}
                      Ingat saya
                    </label>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        alert("Silakan hubungi pengelola sistem untuk pengaturan ulang kata sandi.");
                      }}
                    >
                      Lupa sandi?
                    </a>
                  </div>
                  <button
                    className="btn btn-primary btn-block"
                    type="submit"
                    disabled={sedangProses}
                  >
                    {sedangProses ? "Memproses masuk..." : "Masuk"}
                  </button>
                </form>

                <div className="demo-gradien">
                  <div className="gradien-dalam">
                    <div className="gradien-kepala">
                      <div>
                        <span className="gradien-badge">Akun demo</span>
                        <b>Masuk sebagai</b>
                      </div>
                      <span className="gradien-catatan">Terisi otomatis</span>
                    </div>
                    <div className="gradien-segmen" role="group" aria-label="Pilih akun demo">
                      <button
                        type="button"
                        aria-pressed={demoAktif === "warga"}
                        onClick={() => isiAkunDemo("warga")}
                      >
                        <span>Warga</span>
                        <i>{AKUN_DEMO.warga.email}</i>
                      </button>
                      <button
                        type="button"
                        aria-pressed={demoAktif === "moderator"}
                        onClick={() => isiAkunDemo("moderator")}
                      >
                        <span>Moderator</span>
                        <i>{AKUN_DEMO.moderator.email}</i>
                      </button>
                    </div>
                    <p className={`demo-status${demoAktif ? " ok" : ""}`} aria-live="polite">
                      {demoAktif ? (
                        <>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="m20 6-11 11-5-5" />
                          </svg>
                          Email dan sandi {demoAktif} terisi. Tekan Masuk untuk membuka{" "}
                          {demoAktif === "warga" ? "halaman warga" : "pusat moderasi"}.
                        </>
                      ) : (
                        "Belum ada akun dipilih."
                      )}
                    </p>
                  </div>
                </div>

                <p className="tautan-tengah">
                  Belum punya akun?{" "}
                  <button
                    type="button"
                    className="tautan-aksen"
                    id="keDaftar"
                    style={{ background: "none", border: "none", padding: 0, font: "inherit" }}
                    onClick={() => {
                      setMode("daftar");
                      setGalat(null);
                      setDemoAktif(null);
                    }}
                  >
                    Daftar akun warga
                  </button>
                </p>

                <p className="catatan-privasi">
                  Data akun hanya dipakai untuk menautkan laporan dengan pelapor. Peran moderator ditetapkan oleh pengelola, bukan dipilih saat login.
                </p>
              </div>
            )}

            {/* ------------------------------ DAFTAR ------------------------------ */}
            {mode === "daftar" && (
              <div id="panelDaftar">
                <h1>Buat akun warga</h1>
                <p className="lede">
                  Akun baru otomatis berperan sebagai warga. Setelah daftar, kamu langsung masuk ke halaman warga.
                </p>

                <form id="formDaftar" onSubmit={handleDaftar}>
                  <div className="field">
                    <label htmlFor="namaDaftar">NAMA LENGKAP</label>
                    <input
                      id="namaDaftar"
                      type="text"
                      required
                      placeholder="Nama sesuai identitas"
                      autoComplete="name"
                      value={nama}
                      onChange={(e) => setNama(e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="emailDaftar">EMAIL</label>
                    <input
                      id="emailDaftar"
                      type="email"
                      required
                      placeholder="nama@email.com"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="teleponDaftar">
                      NOMOR TELEPON{" "}
                      <span
                        style={{
                          fontWeight: 400,
                          textTransform: "none",
                          letterSpacing: 0,
                          color: "var(--warna-redup)",
                        }}
                      >
                        (opsional)
                      </span>
                    </label>
                    <input
                      id="teleponDaftar"
                      type="tel"
                      placeholder="08xx xxxx xxxx"
                      autoComplete="tel"
                      value={telepon}
                      onChange={(e) => setTelepon(e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="sandiDaftar">SANDI</label>
                    <div className="kotak-input-sandi">
                      <input
                        id="sandiDaftar"
                        type={lihatSandi ? "text" : "password"}
                        required
                        placeholder="Minimal 8 karakter"
                        autoComplete="new-password"
                        value={sandi}
                        onChange={(e) => setSandi(e.target.value)}
                      />
                      <button
                        type="button"
                        className="tombol-lihat-sandi"
                        onClick={() => setLihatSandi((v) => !v)}
                        title={lihatSandi ? "Sembunyikan sandi" : "Lihat sandi"}
                        aria-label={lihatSandi ? "Sembunyikan sandi" : "Lihat sandi"}
                      >
                        {lihatSandi ? (
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                            <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                            <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                            <line x1="2" x2="22" y1="2" y2="22" />
                          </svg>
                        ) : (
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                  <button
                    className="btn btn-primary btn-block"
                    type="submit"
                    disabled={sedangProses}
                  >
                    {sedangProses ? "Membuat akun..." : "Buat akun warga"}
                  </button>
                </form>

                <p className="tautan-tengah">
                  Sudah punya akun?{" "}
                  <button
                    type="button"
                    className="tautan-aksen"
                    id="keMasuk"
                    style={{ background: "none", border: "none", padding: 0, font: "inherit" }}
                    onClick={() => {
                      setMode("masuk");
                      setGalat(null);
                      setDemoAktif(null);
                    }}
                  >
                    Masuk di sini
                  </button>
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
