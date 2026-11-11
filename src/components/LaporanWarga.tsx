import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import arrowLeftSvg from "../assets/icons/arrow-left.svg";
import {
  ambilSesiPelapor,
  masukPelapor,
  daftarPelapor,
  keluarPelapor,
  kirimLaporanKeServer,
  periksaStatusLaporan,
  ambilRiwayatLaporanSaya,
  buatKodeRujukan,
  type ItemLaporan,
  type PenggunaPelapor,
} from "../lib/layananLaporan";
import { apakahSupabaseAktif } from "../lib/supabase";
import Moderator from "./Moderator";
import PemilihWilayah, { type ButirWilayah } from "./PemilihWilayah";
import PemilihTanggal from "./PemilihTanggal";
import { isoLokal } from "../lib/tanggal";

export type { PenggunaPelapor };

interface OpsiWilayah {
  kode: string;
  nama: string;
  prov: string;
}

interface OpsiProvinsi {
  kode: string;
  nama: string;
}

const BULAN_PANJANG = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const TANGGAL_HARI_INI = isoLokal(new Date());

function formatTanggalLengkap(iso: string): string {
  if (!iso) return "";
  const parts = iso.split("-");
  if (parts.length < 3) return iso;
  const y = parts[0];
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  return `${d} ${BULAN_PANJANG[m - 1] ?? parts[1]} ${y}`;
}

interface Props {
  subHalamanAwal?: "beranda" | "masuk" | "kirim" | "status" | "riwayat";
  onKembaliKePeta?: () => void;
  penggunaSesi?: PenggunaPelapor | null;
  onKeluar?: () => void;
}

export default function LaporanWarga({
  subHalamanAwal = "beranda",
  onKembaliKePeta,
  penggunaSesi,
  onKeluar,
}: Props) {
  const [tampilan, setTampilan] = useState<
    "beranda" | "masuk" | "kirim" | "status" | "riwayat"
  >(subHalamanAwal);

  // Sesi Pengguna Pelapor (Auth State)
  const [pengguna, setPengguna] = useState<PenggunaPelapor | null>(null);
  const [memuatSesi, setMemuatSesi] = useState(true);
  const [tabAuth, setTabAuth] = useState<"masuk" | "daftar">("masuk");

  // Form Auth Input (Bersih, tanpa default dummy)
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authNama, setAuthNama] = useState("");
  const [authTelepon, setAuthTelepon] = useState("");
  const [galatAuth, setGalatAuth] = useState<string | null>(null);
  const [sedangAuth, setSedangAuth] = useState(false);

  // Data Master Wilayah & Kecamatan dari Sistem/Peta
  const [daftarWilayah, setDaftarWilayah] = useState<OpsiWilayah[]>([]);
  const [daftarProvinsi, setDaftarProvinsi] = useState<OpsiProvinsi[]>([]);
  const [petaKecamatan, setPetaKecamatan] = useState<Record<string, string[]>>({});
  const [modeKecamatanManual, setModeKecamatanManual] = useState(false);

  // State Formulir Laporan
  const [jenisKejadian, setJenisKejadian] = useState("Banjir");
  const [kabupaten, setKabupaten] = useState("");
  const [kecamatan, setKecamatan] = useState("");
  const [tanggalIso, setTanggalIso] = useState(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  });
  const [dampak, setDampak] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [setuju, setSetuju] = useState(true);
  const [berkasFoto, setBerkasFoto] = useState<File | null>(null);
  const [pratinjauFoto, setPratinjauFoto] = useState<string | null>(null);
  const [sedangSeretFoto, setSedangSeretFoto] = useState(false);
  const [sedangKirim, setSedangKirim] = useState(false);
  const [galatKirim, setGalatKirim] = useState<string | null>(null);
  const inputBerkasRef = useRef<HTMLInputElement | null>(null);

  // State Halaman Status
  const [kodeInput, setKodeInput] = useState("");
  const [laporanDitemukan, setLaporanDitemukan] = useState<ItemLaporan | null>(null);
  const [sedangCekStatus, setSedangCekStatus] = useState(false);
  const [statusDicari, setStatusDicari] = useState(false);

  // State Riwayat Laporan Saya
  const [daftarRiwayatSaya, setDaftarRiwayatSaya] = useState<ItemLaporan[]>([]);
  const [sedangMuatRiwayat, setSedangMuatRiwayat] = useState(false);

  const daftarJenis = [
    "Banjir",
    "Tanah longsor",
    "Angin kencang",
    "Gempa",
    "Lainnya",
  ];

  // Muat sesi pengguna saat komponen dimuat
  useEffect(() => {
    if (penggunaSesi !== undefined) {
      setPengguna(penggunaSesi);
      setMemuatSesi(false);
      return;
    }
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
  }, [penggunaSesi]);

  // Muat data master wilayah dari sistem peta dan kecamatan kejadian
  useEffect(() => {
    let batal = false;
    Promise.all([
      fetch("/data/wilayah.json").then((r) => r.json()).catch(() => []),
      fetch("/data/provinsi.json").then((r) => r.json()).catch(() => []),
      fetch("/data/kejadian-jatim.json").then((r) => r.json()).catch(() => null),
    ]).then(([wil, prov, jatim]) => {
      if (batal) return;
      if (Array.isArray(wil)) setDaftarWilayah(wil);
      if (Array.isArray(prov)) setDaftarProvinsi(prov);

      if (jatim && jatim.kejadian && jatim.kabupaten) {
        const map: Record<string, Set<string>> = {};
        for (const row of jatim.kejadian) {
          const kabNama = jatim.kabupaten[row[3]];
          const loc = row[4];
          if (!loc || typeof loc !== "string" || !loc.trim()) continue;
          if (!map[kabNama]) map[kabNama] = new Set();
          map[kabNama].add(loc.trim());
        }
        const finalMap: Record<string, string[]> = {};
        for (const [k, setVal] of Object.entries(map)) {
          finalMap[k] = Array.from(setVal).sort((a, b) => a.localeCompare(b));
        }
        setPetaKecamatan(finalMap);
      }
    });

    return () => {
      batal = true;
    };
  }, []);

  // Kelompokkan wilayah per provinsi (A-Z)
  const wilayahPerProvinsi = useMemo(() => {
    const map = new Map<string, OpsiWilayah[]>();
    for (const w of daftarWilayah) {
      const list = map.get(w.prov) || [];
      list.push(w);
      map.set(w.prov, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.nama.localeCompare(b.nama));
    }
    return map;
  }, [daftarWilayah]);

  const provinsiTerurut = useMemo(() => {
    return [...daftarProvinsi].sort((a, b) => a.nama.localeCompare(b.nama));
  }, [daftarProvinsi]);

  // Daftar kecamatan yang cocok dengan kabupaten terpilih
  const daftarKecamatanTersedia = useMemo(() => {
    if (!kabupaten) return [];
    const q = kabupaten.toLowerCase();
    const keys = Object.keys(petaKecamatan).filter((k) => {
      const lk = k.toLowerCase();
      const clean = lk.replace(" kabupaten", "").replace(" kota", "");
      return lk.includes(q) || q.includes(clean);
    });

    const unique = new Set<string>();
    for (const k of keys) {
      for (const item of petaKecamatan[k] || []) {
        unique.add(item);
      }
    }
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [kabupaten, petaKecamatan]);

  function handlePilihKabupaten(namaKab: string) {
    setKabupaten(namaKab);
    setKecamatan("");
    setModeKecamatanManual(false);
  }

  // 510 kabupaten/kota diratakan jadi satu daftar; nama provinsi dipakai
  // sebagai keterangan baris kedua supaya hasil cari tetap bisa dibedakan.
  const butirKabupaten = useMemo(() => {
    const hasil: ButirWilayah[] = [];
    for (const prov of provinsiTerurut) {
      for (const w of wilayahPerProvinsi.get(prov.kode) || []) {
        hasil.push({ kode: w.kode, nama: w.nama, sub: prov.nama });
      }
    }
    return hasil;
  }, [provinsiTerurut, wilayahPerProvinsi]);

  // Pemilih bekerja dengan kode BPS; formulir menyimpan nama wilayah.
  const kodeKabupatenTerpilih = useMemo(
    () => butirKabupaten.find((b) => b.nama === kabupaten)?.kode ?? "",
    [butirKabupaten, kabupaten],
  );

  const butirKecamatan = useMemo(() => {
    const hasil: ButirWilayah[] = daftarKecamatanTersedia.map((nama) => ({
      kode: nama,
      nama,
    }));
    hasil.push({ kode: "__manual__", nama: "Ketik kecamatan / desa lainnya" });
    return hasil;
  }, [daftarKecamatanTersedia]);

  function handlePilihKecamatan(nilaiPilihan: string) {
    if (nilaiPilihan === "__manual__") {
      setModeKecamatanManual(true);
      setKecamatan("");
      return;
    }
    setKecamatan(nilaiPilihan);
  }

  const muatRiwayat = useCallback(async (uid?: string) => {
    const targetUid = uid || pengguna?.id;
    if (!targetUid) return;
    queueMicrotask(() => setSedangMuatRiwayat(true));
    try {
      const items = await ambilRiwayatLaporanSaya(targetUid);
      setDaftarRiwayatSaya(items);
    } finally {
      setSedangMuatRiwayat(false);
    }
  }, [pengguna?.id]);

  useEffect(() => {
    if (tampilan === "riwayat" && pengguna?.id) {
      muatRiwayat(pengguna.id);
    }
  }, [tampilan, pengguna?.id, muatRiwayat]);

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

  // Periksa status otomatis jika membuka halaman status dengan kode
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
    setDaftarRiwayatSaya([]);
    setTampilan("beranda");
    if (onKeluar) onKeluar();
  }

  async function handleMasuk(e: React.FormEvent) {
    e.preventDefault();
    setSedangAuth(true);
    setGalatAuth(null);
    try {
      if (tabAuth === "masuk") {
        const res = await masukPelapor(authEmail, authPassword);
        setPengguna(res);
        setAuthPassword("");
        setTampilan("kirim");
      } else {
        const res = await daftarPelapor(authNama, authEmail, authPassword, authTelepon);
        setPengguna(res);
        setAuthPassword("");
        setTampilan("kirim");
      }
    } catch (err) {
      const pesan = err instanceof Error ? err.message : "Gagal memproses autentikasi";
      if (pesan.includes("rate limit") || pesan.includes("over_email_send_rate_limit")) {
        setGalatAuth(
          "Batas pengiriman email verifikasi tercapai. Matikan opsi 'Confirm email' di dashboard Supabase (Authentication -> Providers -> Email) agar pendaftaran langsung aktif tanpa verifikasi email."
        );
      } else if (pesan.includes("Invalid login credentials")) {
        setGalatAuth("Email atau kata sandi tidak cocok. Jika belum punya akun, silakan klik tab 'Daftar akun baru'.");
      } else if (pesan.includes("User already registered")) {
        setGalatAuth("Email ini sudah terdaftar. Silakan pilih tab 'Masuk (Sign in)'.");
      } else {
        setGalatAuth(pesan);
      }
    } finally {
      setSedangAuth(false);
    }
  }

  function terimaBerkasFoto(file: File | null | undefined) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setGalatKirim("Berkas bukti harus berupa gambar (JPG, PNG, atau WEBP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setGalatKirim("Ukuran foto bukti maksimal 5 MB.");
      return;
    }

    setGalatKirim(null);
    setBerkasFoto(file);
    setPratinjauFoto((sebelumnya) => {
      if (sebelumnya) URL.revokeObjectURL(sebelumnya);
      return URL.createObjectURL(file);
    });
  }

  function handlePilihBerkas(e: React.ChangeEvent<HTMLInputElement>) {
    terimaBerkasFoto(e.target.files?.[0]);
    // Reset supaya berkas yang sama tetap bisa dipilih ulang.
    e.target.value = "";
  }

  function handleSeretMasuk(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setSedangSeretFoto(true);
  }

  function handleSeretKeluar(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    // Jangan matikan penanda saat kursor hanya melewati anak elemen.
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
    setSedangSeretFoto(false);
  }

  function handleJatuhkanBerkas(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setSedangSeretFoto(false);
    terimaBerkasFoto(e.dataTransfer.files?.[0]);
  }

  async function handleKirimLaporan(e: React.FormEvent) {
    e.preventDefault();

    // Ketiga kolom ini memakai pemilih kustom, jadi aturan `required` bawaan
    // browser tidak berlaku lagi dan harus diperiksa di sini.
    if (!kabupaten) {
      setGalatKirim("Kabupaten / kota belum dipilih.");
      return;
    }
    if (!kecamatan.trim()) {
      setGalatKirim("Kecamatan / desa belum diisi.");
      return;
    }
    if (!tanggalIso) {
      setGalatKirim("Tanggal kejadian belum dipilih.");
      return;
    }

    if (!pengguna?.id) {
      setGalatKirim("Kamu wajib masuk ke akun terlebih dahulu sebelum mengirim laporan.");
      setTampilan("masuk");
      return;
    }

    setSedangKirim(true);
    setGalatKirim(null);

    const kodeBaru = buatKodeRujukan();

    try {
      const hasil = await kirimLaporanKeServer(
        {
          userId: pengguna.id,
          jenis: jenisKejadian,
          wilayah: kabupaten,
          desa: kecamatan,
          tanggalKejadian: formatTanggalLengkap(tanggalIso) || tanggalIso,
          dampak: dampak,
          deskripsi: deskripsi,
          pelapor: pengguna.nama,
          kontak: pengguna.telepon,
          email: pengguna.email,
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

  const adalahModerator =
    pengguna?.role === "moderator" || pengguna?.role === "admin";

  // Akun moderator/admin tidak memakai formulir warga. Menu Lapor milik mereka
  // langsung membuka pusat moderasi: cek kode dan antrean pengajuan.
  if (adalahModerator) {
    return (
      <Moderator
        varian="lapor"
        onKeluar={() => {
          setPengguna(null);
          setTampilan("beranda");
        }}
      />
    );
  }

  // Hindari kedipan formulir warga selagi role akun masih diperiksa.
  if (apakahSupabaseAktif && memuatSesi) {
    return (
      <div className="halaman-laporan-warga">
        <div className="wadah-konten-lebar">
          <p style={{ padding: "40px 0", color: "var(--warna-redup)" }}>
            Memeriksa sesi akun...
          </p>
        </div>
      </div>
    );
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
              Laporan warga tidak dicampur dengan data resmi. Setiap laporan wajib terhubung dengan akun warga yang sah agar ketertelusuran data terjaga dan dapat diverifikasi oleh moderator.
            </p>

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
                  Masuk sebagai <strong>{pengguna.nama}</strong> ({pengguna.email} · {pengguna.telepon || "No. Telepon belum disetel"})
                </p>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <button
                    type="button"
                    className="tombol-aksi-sekunder"
                    style={{ padding: "6px 12px", fontSize: "12.5px" }}
                    onClick={() => {
                      muatRiwayat(pengguna.id);
                      setTampilan("riwayat");
                    }}
                  >
                    Riwayat Laporan Saya
                  </button>
                  <button
                    type="button"
                    className="tombol-keluar-sesi"
                    onClick={handleKeluar}
                  >
                    Keluar
                  </button>
                </div>
              </div>
            )}

            {/* Grid Kartu Opsi */}
            <div className="grid-dua-kartu-laporan">
              {/* Card 1: Kirim laporan */}
              <div className="kartu-opsi-laporan" data-name="Kirim laporan">
                <h2 className="judul-opsi-laporan">Kirim laporan</h2>
                <p className="subjudul-opsi-laporan">
                  {pengguna
                    ? "Akun kamu siap. Laporkan dampak banjir, longsor, atau bencana lain di sekitarmu."
                    : "Warga wajib masuk atau mendaftar akun terlebih dahulu untuk mencegah manipulasi data."}
                </p>

                <ol className="daftar-langkah-laporan">
                  <li>
                    <span className="angka-langkah">1</span>
                    <span>{pengguna ? "Akun terverifikasi aktif" : "Masuk / Buat akun pelapor sah"}</span>
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
                    placeholder="Contoh: LNT-8A3F-9K2L"
                  />
                </div>

                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
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

                  {pengguna && (
                    <button
                      type="button"
                      className="tombol-batal-teks"
                      style={{ fontSize: "13px", color: "var(--warna-aksen)" }}
                      onClick={() => {
                        muatRiwayat(pengguna.id);
                        setTampilan("riwayat");
                      }}
                    >
                      Buka Riwayat Saya →
                    </button>
                  )}
                </div>

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
            06a · Masuk atau daftar pelapor (Autentikasi Nyata)
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
            <h1 className="judul-halaman-utama">
              {tabAuth === "masuk" ? "Masuk ke akun pelapor" : "Buat akun pelapor baru"}
            </h1>
            <p className="deskripsi-halaman-utama">
              Untuk menjaga integritas dan ketertelusuran data bencana, setiap laporan wajib dikirim oleh pelapor terdaftar.
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
                      border: "1px solid #fecaca",
                    }}
                  >
                    <strong>Gagal:</strong> {galatAuth}
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
                        placeholder="Contoh: Budi Santoso"
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
                      placeholder="nama@gmail.com, yahoo.com, dsb."
                      required
                    />
                    <p style={{ margin: "4px 0 0", fontSize: "11px", color: "var(--warna-redup)" }}>
                      Mendukung semua penyedia email: Gmail, Yahoo, Outlook, kampus, dll.
                    </p>
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
                  </div>

                  <button
                    type="submit"
                    className="tombol-aksi-utama tombol-panjang"
                    disabled={sedangAuth}
                  >
                    {sedangAuth
                      ? "Memproses autentikasi..."
                      : tabAuth === "masuk"
                      ? "Masuk dan Lanjutkan Lapor"
                      : "Daftar dan Lanjutkan Lapor"}
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

            <h1 className="judul-halaman-utama">Kirim laporan bencana</h1>
            <p className="deskripsi-halaman-utama">
              Laporan masuk ke antrean moderasi. Kamu akan menerima kode rujukan otomatis setelah mengirim.
            </p>

            {/* Banner Akun Pelapor Terverifikasi */}
            <div className="kartu-akun-pelapor-banner">
              <div className="kiri-akun-banner">
                <span className="badge-lapisan resmi">Pelapor Terverifikasi</span>
                <p className="nama-pelapor-terikat">
                  {pengguna?.nama || "Pelapor"} · {pengguna?.telepon || "-"} ({pengguna?.email})
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
                  border: "1px solid #fecaca",
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
                    <label htmlFor="kabupaten-pemicu" className="label-input-kapital">
                      KABUPATEN / KOTA
                    </label>
                    <PemilihWilayah
                      idAwalan="kabupaten"
                      label="Kabupaten atau kota"
                      placeholder="Pilih kabupaten / kota"
                      butir={butirKabupaten}
                      nilai={kodeKabupatenTerpilih}
                      petunjukCari="Cari kabupaten, kota, atau provinsi"
                      onPilih={(kode) => {
                        const b = butirKabupaten.find((x) => x.kode === kode);
                        if (b) handlePilihKabupaten(b.nama);
                      }}
                    />
                  </div>

                  <div className="kelompok-form">
                    <label
                      htmlFor={
                        daftarKecamatanTersedia.length > 0 && !modeKecamatanManual
                          ? "kecamatan-pemicu"
                          : "kecamatan-input-or-select"
                      }
                      className="label-input-kapital"
                    >
                      KECAMATAN / DESA
                    </label>
                    {daftarKecamatanTersedia.length > 0 && !modeKecamatanManual ? (
                      <PemilihWilayah
                        idAwalan="kecamatan"
                        label="Kecamatan atau desa"
                        placeholder="Pilih kecamatan / desa"
                        butir={butirKecamatan}
                        nilai={kecamatan}
                        tanpaCari={daftarKecamatanTersedia.length <= 7}
                        petunjukCari="Cari kecamatan atau desa"
                        onPilih={handlePilihKecamatan}
                      />
                    ) : (
                      <div>
                        <input
                          id="kecamatan-input-or-select"
                          type="text"
                          className="input-standar"
                          value={kecamatan}
                          onChange={(e) => setKecamatan(e.target.value)}
                          placeholder={
                            kabupaten
                              ? `Masukkan nama kecamatan di ${kabupaten}`
                              : "Pilih kabupaten terlebih dahulu atau tulis di sini"
                          }
                          required
                        />
                        {daftarKecamatanTersedia.length > 0 && (
                          <button
                            type="button"
                            className="tombol-batal-teks"
                            style={{
                              fontSize: "11.5px",
                              marginTop: "4px",
                              color: "var(--warna-aksen)",
                              padding: 0,
                              cursor: "pointer",
                            }}
                            onClick={() => {
                              setModeKecamatanManual(false);
                              setKecamatan("");
                            }}
                          >
                            ← Kembali pilih dari daftar sistem
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid-dua-kolom-input">
                  <div className="kelompok-form">
                    <label htmlFor="tanggal-input" className="label-input-kapital">
                      TANGGAL KEJADIAN
                    </label>
                    <PemilihTanggal
                      id="tanggal-input"
                      label="Tanggal kejadian"
                      nilai={tanggalIso}
                      maks={TANGGAL_HARI_INI}
                      onPilih={setTanggalIso}
                    />
                    {tanggalIso && (
                      <p style={{ margin: "4px 0 0", fontSize: "11.5px", color: "var(--warna-redup)" }}>
                        Terpilih: <strong>{formatTanggalLengkap(tanggalIso)}</strong>
                      </p>
                    )}
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
                      placeholder="Contoh: Jalan desa tertutup, 2 rumah rusak"
                    />
                  </div>
                </div>

                <div className="kelompok-form">
                  <label htmlFor="deskripsi-input" className="label-input-kapital">
                    DESKRIPSI LENGKAP
                  </label>
                  <textarea
                    id="deskripsi-input"
                    rows={4}
                    className="textarea-standar"
                    value={deskripsi}
                    onChange={(e) => setDeskripsi(e.target.value)}
                    placeholder="Ceritakan kondisi di lapangan, akses jalan, dan kebutuhan mendesak..."
                    required
                  />
                </div>

                {/* Bukti Foto Input */}
                <div className="kelompok-form">
                  <label className="label-input-kapital">BUKTI FOTO DOKUMENTASI</label>
                  <input
                    type="file"
                    ref={inputBerkasRef}
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handlePilihBerkas}
                  />
                  <div
                    className={`area-unggah-berkas${sedangSeretFoto ? " sedang-seret" : ""}`}
                    onClick={() => inputBerkasRef.current?.click()}
                    onDragEnter={handleSeretMasuk}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.dataTransfer.dropEffect = "copy";
                      if (!sedangSeretFoto) setSedangSeretFoto(true);
                    }}
                    onDragLeave={handleSeretKeluar}
                    onDrop={handleJatuhkanBerkas}
                    role="button"
                    tabIndex={0}
                    aria-label="Unggah bukti foto, bisa diklik atau dengan menyeret berkas"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        inputBerkasRef.current?.click();
                      }
                    }}
                  >
                    {berkasFoto ? (
                      <div>
                        <p className="teks-unggah" style={{ fontWeight: 600, color: "var(--warna-tinta)" }}>
                          ✓ {berkasFoto.name} ({(berkasFoto.size / 1024).toFixed(1)} KB)
                        </p>
                        <p className="teks-unggah" style={{ fontSize: 11, marginTop: 4 }}>
                          Klik atau seret foto lain untuk mengganti berkas
                        </p>
                        {pratinjauFoto && (
                          <img
                            src={pratinjauFoto}
                            alt="Pratinjau foto"
                            style={{
                              maxHeight: 140,
                              borderRadius: 4,
                              marginTop: 10,
                              border: "1px solid var(--warna-garis)",
                            }}
                          />
                        )}
                      </div>
                    ) : (
                      <p className="teks-unggah">
                        {sedangSeretFoto
                          ? "Lepaskan foto di sini untuk melampirkan bukti"
                          : "Tarik foto ke sini atau klik untuk memilih berkas gambar bukti"}
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
                    {sedangKirim ? "Mengunggah & menyimpan..." : "Kirim laporan"}
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
                      <span>Laporan terhubung dengan profil akun terverifikasi.</span>
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
                    Identitas nama dan nomor kontak pelapor tersimpan aman untuk audit verifikasi moderator dan tidak dipublikasikan ke peta umum.
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
            RIWAYAT LAPORAN SAYA (Fitur Akun Terautentikasi)
            ============================================================== */}
        {tampilan === "riwayat" && (
          <div data-name="Riwayat laporan saya">
            <button
              type="button"
              className="tombol-kembali-teks"
              onClick={() => setTampilan("beranda")}
            >
              <img src={arrowLeftSvg} alt="" width="14" height="14" />
              <span>Laporan warga</span>
            </button>

            <h1 className="judul-halaman-utama">Riwayat Laporan Saya</h1>
            <p className="deskripsi-halaman-utama">
              Daftar seluruh laporan yang pernah kamu kirimkan ke Lentera menggunakan akun ini.
            </p>

            <div style={{ marginBottom: 20 }}>
              <button
                type="button"
                className="tombol-aksi-utama"
                onClick={() => setTampilan("kirim")}
              >
                + Buat Laporan Baru
              </button>
            </div>

            {sedangMuatRiwayat ? (
              <div className="kartu-opsi-laporan">
                <p style={{ margin: 0, color: "var(--warna-redup)" }}>Memuat riwayat laporan...</p>
              </div>
            ) : daftarRiwayatSaya.length === 0 ? (
              <div className="kartu-opsi-laporan" style={{ textAlign: "center", padding: "36px 20px" }}>
                <h2 className="judul-opsi-laporan">Belum Ada Laporan</h2>
                <p className="subjudul-opsi-laporan" style={{ maxWidth: 440, margin: "8px auto 20px" }}>
                  Kamu belum pernah mengirim laporan bencana. Saat menemukan dampak bencana di sekitarmu, laporkan untuk membantu transparansi publik.
                </p>
                <button
                  type="button"
                  className="tombol-aksi-utama"
                  onClick={() => setTampilan("kirim")}
                >
                  Kirim Laporan Sekarang
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {daftarRiwayatSaya.map((item) => (
                  <article
                    key={item.kode}
                    className="kartu-opsi-laporan"
                    style={{ background: "var(--warna-kartu)", border: "1px solid var(--warna-garis)" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                      <div>
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontWeight: 700,
                            fontSize: 15,
                            color: "var(--warna-aksen)",
                          }}
                        >
                          {item.kode}
                        </span>
                        <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--warna-redup)" }}>
                          Dikirim {item.dikirim} WIB · {item.wilayah}
                          {item.desa ? `, ${item.desa}` : ""}
                        </p>
                      </div>
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
                    </div>

                    <div style={{ marginTop: 12, marginBottom: 12 }}>
                      <p style={{ fontSize: 13.5, margin: 0, color: "var(--warna-tinta)" }}>
                        <strong>{item.jenis}:</strong> {item.deskripsi}
                      </p>
                    </div>

                    {item.fotoUrl && (
                      <div style={{ marginBottom: 12 }}>
                        <img
                          src={item.fotoUrl}
                          alt="Foto bukti"
                          style={{
                            maxHeight: 120,
                            borderRadius: 4,
                            border: "1px solid var(--warna-garis)",
                          }}
                        />
                      </div>
                    )}

                    <div
                      style={{
                        padding: "8px 12px",
                        background: "var(--warna-panggung)",
                        borderRadius: 4,
                        fontSize: 12,
                        color: "var(--warna-tinta)",
                        marginBottom: 14,
                      }}
                    >
                      <strong style={{ color: "var(--warna-redup)" }}>Catatan Moderator:</strong>{" "}
                      {item.catatanModerator}
                    </div>

                    <button
                      type="button"
                      className="tombol-aksi-sekunder"
                      style={{ padding: "6px 14px", fontSize: "12.5px" }}
                      onClick={() => {
                        setKodeInput(item.kode);
                        setLaporanDitemukan(item);
                        setStatusDicari(true);
                        setTampilan("status");
                      }}
                    >
                      Lihat Timeline Status Lengkap →
                    </button>
                  </article>
                ))}
              </div>
            )}
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
                      placeholder="Contoh: LNT-8A3F-9K2L"
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
                          <a href={laporanDitemukan.fotoUrl} target="_blank" rel="noreferrer">
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
                          </a>
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
                      Laporan dengan kode <strong>{kodeInput}</strong> tidak ditemukan. Pastikan format penulisan sesuai (misalnya: <code>LNT-8A3F-9K2L</code>).
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
