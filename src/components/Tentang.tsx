import { useEffect, useMemo, useRef, useState } from "react";
import arrowLeftSvg from "../assets/icons/arrow-left.svg";
import arrowUpRightSvg from "../assets/icons/arrow-up-right.svg";
import {
  labelStatusCakupan,
  namaProvinsiRapi,
  formatTanggal,
  ringkasCakupan,
  type DataLentera,
} from "../lib/data";

type SubHalamanTentang =
  | "utama"
  | "produk"
  | "sumber"
  | "integritas"
  | "keterbatasan"
  | "tim";

interface Props {
  subHalamanAwal?: SubHalamanTentang;
  siap?: DataLentera | null;
}

const URUTAN_STATUS: Record<string, number> = {
  rinci: 0,
  belum: 1,
  belum_diperiksa: 2,
};

export default function Tentang({ subHalamanAwal = "utama", siap }: Props) {
  const [subHalaman, setSubHalaman] = useState<SubHalamanTentang>(subHalamanAwal);
  // Bagian yang dituju di dalam sub-halaman, mis. kartu "Masalah yang dijawab".
  // Disimpan di ref supaya tidak memicu render tambahan.
  const jangkarRef = useRef<string | null>(null);

  function bukaBagian(tujuan: SubHalamanTentang, id: string | null = null) {
    jangkarRef.current = id;
    setSubHalaman(tujuan);
  }

  // Setelah sub-halaman terpasang, gulir ke bagian yang dituju.
  useEffect(() => {
    const id = jangkarRef.current;
    if (!id) return;
    jangkarRef.current = null;
    const el = document.getElementById(id);
    if (!el) return;
    const kurangiGerak = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: kurangiGerak ? "auto" : "smooth", block: "start" });
  }, [subHalaman]);

  // Tabel cakupan diurutkan menurut status, lalu kode provinsi, supaya
  // pembaca melihat lebih dulu mana yang sudah tersedia.
  const daftarCakupan = useMemo(() => {
    if (!siap) return [];
    return siap.provinsi
      .map((p) => ({
        kode: p.kode,
        nama: p.nama,
        cakupan: siap.cakupan.provinsi[p.kode] ?? { status: "belum_diperiksa" as const },
      }))
      .sort((a, b) => {
        const selisih =
          (URUTAN_STATUS[a.cakupan.status] ?? 3) - (URUTAN_STATUS[b.cakupan.status] ?? 3);
        return selisih !== 0 ? selisih : a.kode.localeCompare(b.kode);
      });
  }, [siap]);

  const ringkasan = useMemo(
    () => (siap ? ringkasCakupan(siap) : { rinci: 0, belum: 0, belumDiperiksa: 0, total: 0 }),
    [siap],
  );

  return (
    <div className="halaman-tentang-data">
      <div className="wadah-konten-lebar">
        {/* ==============================================================
            12 · Tentang dan sumber data — Tampilan Utama
            ============================================================== */}
        {subHalaman === "utama" && (
          <div data-node-id="12:412" data-name="12 · Tentang dan sumber data">
            <p className="remah-kategori">TENTANG</p>
            <h1 className="judul-halaman-utama">
              Peta dampak bencana yang selalu menyebut asal angkanya
            </h1>
            <p className="deskripsi-halaman-utama">
              Lentera menggabungkan data resmi BNPB, laporan warga, dan catatan bantuan dalam satu
              tampilan, dengan sumber dan status yang selalu terlihat. Dibuat untuk MIA 2026, tim
              miamiudua.
            </p>

            <div className="tt-kpi" data-name="Angka kunci">
              <div>
                <b>510</b>
                <span>kabupaten/kota dipetakan</span>
              </div>
              <div>
                <b>38</b>
                <span>provinsi tercatat</span>
              </div>
              <div>
                <b>22</b>
                <span>tahun data dampak, 2002–2023</span>
              </div>
              <div>
                <b>9</b>
                <span>jenis bencana, nasional</span>
              </div>
            </div>

            <div className="tt-kartu-grid" data-name="Isi halaman">
              <button
                type="button"
                className="tt-kartu"
                onClick={() => bukaBagian("produk", "t-apa")}
              >
                <span className="tt-kartu-nomor">01</span>
                <span className="tt-kartu-judul">Apa itu Lentera</span>
                <span className="tt-kartu-isi">Situs publik yang memetakan jumlah dan dampak bencana per kabupaten/kota, dengan sumber setiap angka selalu terlihat.</span>
                <span className="tt-kartu-panah">Buka bagian →</span>
              </button>

              <button
                type="button"
                className="tt-kartu"
                onClick={() => bukaBagian("produk", "t-masalah")}
              >
                <span className="tt-kartu-nomor">02</span>
                <span className="tt-kartu-judul">Masalah yang dijawab</span>
                <span className="tt-kartu-isi">Informasi bencana tidak kurang, tetapi sulit dibedakan mana yang resmi, mana yang belum diperiksa, dan mana yang usang.</span>
                <span className="tt-kartu-panah">Buka bagian →</span>
              </button>

              <button
                type="button"
                className="tt-kartu"
                onClick={() => bukaBagian("produk", "t-lapisan")}
              >
                <span className="tt-kartu-nomor">03</span>
                <span className="tt-kartu-judul">Tiga lapisan data</span>
                <span className="tt-kartu-isi">Data resmi BNPB, laporan warga yang dimoderasi, dan catatan bantuan. Tidak pernah dijumlahkan.</span>
                <span className="tt-kartu-panah">Buka bagian →</span>
              </button>

              <button
                type="button"
                className="tt-kartu"
                onClick={() => bukaBagian("sumber", null)}
              >
                <span className="tt-kartu-nomor">04</span>
                <span className="tt-kartu-judul">Sumber dan cakupan</span>
                <span className="tt-kartu-isi">Enam sumber resmi, 38 provinsi diperiksa satu per satu. Satu provinsi punya rincian per kejadian.</span>
                <span className="tt-kartu-panah">Buka bagian →</span>
              </button>

              <button
                type="button"
                className="tt-kartu"
                onClick={() => bukaBagian("integritas", null)}
              >
                <span className="tt-kartu-nomor">05</span>
                <span className="tt-kartu-judul">Aturan integritas</span>
                <span className="tt-kartu-isi">Empat aturan yang tidak dilanggar: tidak mencampur lapisan, menyebut sumber, tidak menggambar agregat sebagai titik.</span>
                <span className="tt-kartu-panah">Buka bagian →</span>
              </button>

              <button
                type="button"
                className="tt-kartu"
                onClick={() => bukaBagian("keterbatasan", null)}
              >
                <span className="tt-kartu-nomor">06</span>
                <span className="tt-kartu-judul">Keterbatasan</span>
                <span className="tt-kartu-isi">Selisih 46 kejadian di tabel BNPB 2024, empat wilayah tanpa data, cakupan yang tumbuh tiap tahun.</span>
                <span className="tt-kartu-panah">Buka bagian →</span>
              </button>

              <button
                type="button"
                className="tt-kartu"
                onClick={() => bukaBagian("tim", "t-teknologi")}
              >
                <span className="tt-kartu-nomor">07</span>
                <span className="tt-kartu-judul">Teknologi</span>
                <span className="tt-kartu-isi">React 19, Vite 8, Leaflet tanpa basemap, Supabase untuk laporan warga, DM Sans.</span>
                <span className="tt-kartu-panah">Buka bagian →</span>
              </button>

              <button
                type="button"
                className="tt-kartu"
                onClick={() => bukaBagian("tim", "t-tim")}
              >
                <span className="tt-kartu-nomor">08</span>
                <span className="tt-kartu-judul">Tim</span>
                <span className="tt-kartu-isi">Tiga orang: pipeline data, laporan warga dan moderasi, bantuan dan uji perangkat. MIA 2026.</span>
                <span className="tt-kartu-panah">Buka bagian →</span>
              </button>

              <button
                type="button"
                className="tt-kartu"
                onClick={() => bukaBagian("tim", "t-lisensi")}
              >
                <span className="tt-kartu-nomor">09</span>
                <span className="tt-kartu-judul">Lisensi dan kredit</span>
                <span className="tt-kartu-isi">Data BNPB ODC-BY, batas wilayah geoBoundaries CC-BY 4.0, kode terbuka di GitHub.</span>
                <span className="tt-kartu-panah">Buka bagian →</span>
              </button>
            </div>

            <section className="tt-blok tt-cara-membaca" data-name="Cara membaca">
              <p className="tt-tanda">CARA MEMBACA APLIKASI</p>
              <div className="tt-langkah">
                <div>
                  <b>1 · Pilih tahun</b>
                  <span>Angka di peta dan panel mengikuti tahun yang dipilih.</span>
                </div>
                <div>
                  <b>2 · Pilih wilayah</b>
                  <span>Panel kanan menampilkan angka, riwayat 15 tahun, dan asal datanya.</span>
                </div>
                <div>
                  <b>3 · Periksa sumber</b>
                  <span>Setiap bagian menyebut tabel BNPB mana yang dipakai.</span>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ==============================================================
            12a · Apa itu Lentera, masalah, dan cara kerja
            ============================================================== */}
        {subHalaman === "produk" && (
          <div data-name="12a · Tentang produk">
            <button
              type="button"
              className="tombol-kembali-teks"
              onClick={() => setSubHalaman("utama")}
            >
              <img src={arrowLeftSvg} alt="" width="14" height="14" />
              <span>Tentang</span>
            </button>

            <p className="remah-kategori">TENTANG PRODUK</p>
            <h1 className="judul-halaman-utama">Apa yang dikerjakan Lentera</h1>
            <p className="deskripsi-halaman-utama">
              Tiga bagian ini menjelaskan produknya: untuk siapa, masalah apa yang dijawab, dan
              bagaimana tiga lapisan data dijaga tetap terpisah.
            </p>

            <section className="tt-blok" id="t-apa" data-name="Apa itu Lentera">
              <p className="tt-tanda">APA ITU LENTERA</p>
              <h2 className="tt-judul">Peta dampak bencana dengan asal data yang bisa ditelusuri</h2>
              <p className="tt-teks">
                Lentera adalah situs publik yang memetakan jumlah dan dampak bencana per
                kabupaten/kota di Indonesia, memakai data resmi BNPB, dan menyebutkan sumber setiap
                angka. Selain peta, ada ruang laporan warga yang dimoderasi dan halaman transparansi
                bantuan.
              </p>
              <p className="tt-teks">
                Visinya: setiap warga bisa tahu apa yang terjadi di wilayahnya, dari mana
                informasinya, dan seberapa pasti informasi itu, tanpa menelusuri banyak kanal
                sendiri.
              </p>
            </section>

            <section className="tt-blok" id="t-masalah" data-name="Masalah">
              <p className="tt-tanda">MASALAH YANG DIJAWAB</p>
              <h2 className="tt-judul">Informasi bencana tidak kurang, tetapi sulit dipercaya</h2>
              <p className="tt-teks">
                Data resmi tersedia, tetapi berbentuk 38 berkas Excel per tahun dan dasbor teknis
                yang tidak dirancang untuk warga. Laporan warga beredar di media sosial tanpa
                status. Catatan bantuan sulit diperiksa. Warga pun tidak bisa membedakan mana yang
                resmi, mana yang belum diperiksa, dan mana yang sudah usang.
              </p>
              <p className="tt-teks">
                Lentera menjawab satu hal: <b>kejelasan asal</b>, bukan sekadar peta yang bagus.
              </p>
            </section>

            <section className="tt-blok" id="t-lapisan" data-name="Cara kerja">
              <p className="tt-tanda">CARA KERJA</p>
              <h2 className="tt-judul">Tiga lapisan, tidak pernah dicampur</h2>
              <div className="tt-lapisan">
                <div>
                  <span className="badge-lapisan resmi">Data resmi</span>
                  <b>Tabel dan berkas BNPB</b>
                  <span>
                    510 kabupaten 2010–2024 untuk jumlah kejadian, dan berkas statistik wilayah 22
                    tahun dengan 14 ukuran dampak.
                  </span>
                </div>
                <div>
                  <span className="badge-lapisan warga">Laporan warga</span>
                  <b>Akun pelapor terverifikasi</b>
                  <span>Masuk antrean moderasi, dan tidak pernah tampil di peta sebelum diperiksa.</span>
                </div>
                <div>
                  <span className="badge-lapisan komunitas">Catatan komunitas</span>
                  <b>Posko dan relawan</b>
                  <span>
                    Dua lapisan bantuan ditampilkan terpisah: alokasi pemerintah daerah dan catatan
                    lapangan.
                  </span>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ==============================================================
            13 · Daftar sumber
            ============================================================== */}
        {subHalaman === "sumber" && (
          <div data-node-id="12:462" data-name="13 · Daftar sumber">
            <button
              type="button"
              className="tombol-kembali-teks"
              onClick={() => setSubHalaman("utama")}
            >
              <img src={arrowLeftSvg} alt="" width="14" height="14" />
              <span>Tentang dan sumber data</span>
            </button>

            <p className="remah-kategori">DAFTAR SUMBER</p>
            <h1 className="judul-halaman-utama">Enam sumber, satu lisensi terbuka</h1>
            <p className="deskripsi-halaman-utama">
              Semua berkas diambil dari portal resmi dan disimpan bersama aplikasi, sehingga situs tetap berjalan tanpa memanggil server sumber.
            </p>

            <div className="kartu-tabel-lapisan" data-name="Tabel">
              <div className="wadah-gulir-tabel">
                <table className="tabel-bantuan-resmi">
                  <thead>
                    <tr>
                      <th scope="col" style={{ width: "25%" }}>DATA</th>
                      <th scope="col" style={{ width: "25%" }}>SUMBER</th>
                      <th scope="col" style={{ width: "24%" }}>CAKUPAN</th>
                      <th scope="col" style={{ width: "12%" }}>LISENSI</th>
                      <th scope="col" style={{ width: "14%" }}>TAUTAN</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="tebal-teks">Jumlah kejadian per kabupaten</td>
                      <td>Data Bencana Indonesia, BNPB</td>
                      <td>510 kabupaten/kota, 2010–2024</td>
                      <td>ODC-BY</td>
                      <td>
                        <a
                          href="https://data.bnpb.go.id/dataset/data-bencana-indonesia"
                          target="_blank"
                          rel="noreferrer"
                          className="tautan-tabel-dokumen"
                        >
                          <span>data.bnpb.go.id</span>
                          <img src={arrowUpRightSvg} alt="" width="12" height="12" />
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td className="tebal-teks">Korban dan kerusakan</td>
                      <td>Jumlah Kejadian dan Dampak Bencana, BNPB</td>
                      <td>22 tahun, 2002–2023, 836 berkas</td>
                      <td>ODC-BY</td>
                      <td>
                        <a
                          href="https://data.bnpb.go.id/dataset/jumlah-kejadian-dan-dampak-bencana-tahun-2023"
                          target="_blank"
                          rel="noreferrer"
                          className="tautan-tabel-dokumen"
                        >
                          <span>data.bnpb.go.id</span>
                          <img src={arrowUpRightSvg} alt="" width="12" height="12" />
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td className="tebal-teks">Batas wilayah kabupaten</td>
                      <td>geoBoundaries ADM2 Indonesia</td>
                      <td>514 bentuk, 510 berpasangan</td>
                      <td>CC-BY 4.0</td>
                      <td>
                        <a
                          href="https://www.geoboundaries.org/"
                          target="_blank"
                          rel="noreferrer"
                          className="tautan-tabel-dokumen"
                        >
                          <span>geoboundaries.org</span>
                          <img src={arrowUpRightSvg} alt="" width="12" height="12" />
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td className="tebal-teks">Riwayat kejadian Jawa Timur</td>
                      <td>SMARTPB, BPBD Provinsi Jawa Timur</td>
                      <td>24.190 kejadian, 2020–2025</td>
                      <td>Terbuka</td>
                      <td>
                        <a
                          href="https://smartpb.jatimprov.go.id/"
                          target="_blank"
                          rel="noreferrer"
                          className="tautan-tabel-dokumen"
                        >
                          <span>smartpb.jatimprov.go.id</span>
                          <img src={arrowUpRightSvg} alt="" width="12" height="12" />
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td className="tebal-teks">Bantuan pemerintah daerah</td>
                      <td>Pemerintah Kota Surabaya</td>
                      <td>Contoh isi, belum terhubung</td>
                      <td>Terbuka</td>
                      <td>
                        <a
                          href="https://surabaya.go.id"
                          target="_blank"
                          rel="noreferrer"
                          className="tautan-tabel-dokumen"
                        >
                          <span>surabaya.go.id</span>
                          <img src={arrowUpRightSvg} alt="" width="12" height="12" />
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td className="tebal-teks">Peta dasar</td>
                      <td>Tidak dipakai</td>
                      <td>Peta digambar dari batas wilayah sendiri</td>
                      <td>—</td>
                      <td>—</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <p className="catatan-kaki-tabel">
              Data BNPB dipakai apa adanya. Lentera tidak menambahkan, merata-ratakan, atau menebak angka yang tidak diterbitkan.
            </p>

            {siap && (
              <section className="kartu-tabel-lapisan kartu-cakupan-rincian" data-name="Cakupan rincian per provinsi">
                <div className="kepala-cakupan">
                  <h2 className="judul-seksi-kartu">Cakupan rincian per kejadian</h2>
                  <p className="deskripsi-cakupan">
                    <strong>{ringkasan.rinci} dari {ringkasan.total} provinsi</strong> menerbitkan
                    log kejadian per tanggal secara terbuka. Angka tahunan tersedia untuk seluruh
                    Indonesia; yang belum lengkap hanya rincian per kejadiannya.
                    {siap.cakupan.diperiksa && (
                      <> Seluruh portal diperiksa terakhir {formatTanggal(siap.cakupan.diperiksa)}.</>
                    )}
                  </p>
                </div>

                <div className="wadah-gulir-tabel">
                  <table className="tabel-bantuan-resmi tabel-cakupan-provinsi">
                    <thead>
                      <tr>
                        <th scope="col" style={{ width: "22%" }}>PROVINSI</th>
                        <th scope="col" style={{ width: "18%" }}>STATUS</th>
                        <th scope="col" style={{ width: "44%" }}>SUMBER ATAU ALASAN</th>
                        <th scope="col" style={{ width: "16%" }}>PERIODE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {daftarCakupan.map(({ kode, nama, cakupan }) => (
                        <tr key={kode}>
                          <td className="tebal-teks">{namaProvinsiRapi(nama)}</td>
                          <td>
                            <span className={`badge-cakupan ${cakupan.status}`}>
                              {labelStatusCakupan(cakupan.status)}
                            </span>
                          </td>
                          <td>
                            {cakupan.sumber && <span className="teks-sumber-cakupan">{cakupan.sumber}</span>}
                            {cakupan.alasan && (
                              <span className="teks-alasan-cakupan">{cakupan.alasan}</span>
                            )}
                            {!cakupan.sumber && !cakupan.alasan && (
                              <span className="teks-redup-cakupan">
                                Portal provinsi belum ditelusuri
                              </span>
                            )}
                          </td>
                          <td>{cakupan.periode ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="catatan-cakupan">
                  {siap.cakupan.catatan.map((teks, i) => (
                    <p key={i} className="catatan-cakupan-baris">
                      {teks}
                    </p>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* ==============================================================
            14 · Arti label dan integritas data
            ============================================================== */}
        {subHalaman === "integritas" && (
          <div data-node-id="12:535" data-name="14 · Arti label dan integritas data">
            <button
              type="button"
              className="tombol-kembali-teks"
              onClick={() => setSubHalaman("utama")}
            >
              <img src={arrowLeftSvg} alt="" width="14" height="14" />
              <span>Tentang dan sumber data</span>
            </button>

            <p className="remah-kategori">ARTI LABEL DAN INTEGRITAS DATA</p>
            <h1 className="judul-halaman-utama">Tiga lapisan, tiga arti yang berbeda</h1>
            <p className="deskripsi-halaman-utama">
              Label bukan hiasan. Ia menentukan apakah angka boleh dipakai untuk mengambil keputusan.
            </p>

            <div className="grid-formulir-dan-sidebar">
              {/* Kolom Kiri: 3 Lapisan */}
              <div className="kolom-tiga-lapisan-arti">
                <div className="kartu-arti-lapisan" data-name="Lapisan">
                  <div className="kepala-arti-lapisan">
                    <span className="badge-lapisan resmi">Data resmi</span>
                    <span className="sumber-lapisan-teks">BNPB, BPBD, pemerintah daerah</span>
                  </div>
                  <p className="isi-arti-lapisan">
                    Diterbitkan instansi dengan dokumen dan tanggal terbit. Boleh dipakai sebagai rujukan.
                  </p>
                </div>

                <div className="kartu-arti-lapisan" data-name="Lapisan">
                  <div className="kepala-arti-lapisan">
                    <span className="badge-lapisan warga">Laporan warga</span>
                    <span className="sumber-lapisan-teks">Formulir laporan, antrean moderasi</span>
                  </div>
                  <p className="isi-arti-lapisan">
                    Dikirim warga atau relawan, belum tentu diverifikasi. Dipakai sebagai petunjuk awal, bukan angka final.
                  </p>
                </div>

                <div className="kartu-arti-lapisan" data-name="Lapisan">
                  <div className="kepala-arti-lapisan">
                    <span className="badge-lapisan komunitas">Catatan komunitas</span>
                    <span className="sumber-lapisan-teks">Posko, relawan, warga</span>
                  </div>
                  <p className="isi-arti-lapisan">
                    Informasi lapangan tanpa kewenangan resmi. Selalu menyebut penulis dan status verifikasi.
                  </p>
                </div>
              </div>

              {/* Kolom Kanan: Aturan integritas */}
              <div className="kolom-sidebar-laporan">
                <section className="kartu-panduan-laporan" data-name="Integritas">
                  <h2 className="judul-seksi-kartu">Aturan integritas</h2>
                  <ul className="daftar-titik-panduan">
                    <li>
                      <span className="titik-simbol">•</span>
                      <span>Satu angka, satu sumber, satu tahun.</span>
                    </li>
                    <li>
                      <span className="titik-simbol">•</span>
                      <span>Tidak ada penggabungan antar lapisan.</span>
                    </li>
                    <li>
                      <span className="titik-simbol">•</span>
                      <span>Angka yang hilang dibiarkan kosong.</span>
                    </li>
                    <li>
                      <span className="titik-simbol">•</span>
                      <span>Setiap perubahan dicatat di halaman ini.</span>
                    </li>
                  </ul>
                </section>
              </div>
            </div>
          </div>
        )}

        {/* ==============================================================
            15 · Keterbatasan dan ketepatan data
            ============================================================== */}
        {subHalaman === "keterbatasan" && (
          <div data-node-id="12:590" data-name="15 · Keterbatasan dan ketepatan data">
            <button
              type="button"
              className="tombol-kembali-teks"
              onClick={() => setSubHalaman("utama")}
            >
              <img src={arrowLeftSvg} alt="" width="14" height="14" />
              <span>Tentang dan sumber data</span>
            </button>

            <p className="remah-kategori">KETERBATASAN DATA</p>
            <h1 className="judul-halaman-utama">Delapan hal yang perlu diketahui</h1>
            <p className="deskripsi-halaman-utama">
              Semua temuan ini muncul saat pengolahan dan sudah diperiksa ke berkas aslinya. Ditulis terbuka, bukan disembunyikan.
            </p>

            <div className="grid-delapan-temuan" data-name="Temuan">
              <div className="kartu-temuan-keterbatasan">
                <span className="nomor-temuan">01</span>
                <h2 className="judul-temuan">Dua tabel BNPB tidak selalu cocok</h2>
                <p className="deskripsi-temuan">
                  2024: selisih 46 kejadian di tujuh provinsi. Aplikasi memakai penjumlahan kabupaten.
                </p>
              </div>

              <div className="kartu-temuan-keterbatasan">
                <span className="nomor-temuan">02</span>
                <h2 className="judul-temuan">Kode 91 dan 92 mengikuti BNPB</h2>
                <p className="deskripsi-temuan">
                  BNPB menulis 91 untuk Papua dan 92 untuk Papua Barat, kebalikan konvensi BPS.
                </p>
              </div>

              <div className="kartu-temuan-keterbatasan">
                <span className="nomor-temuan">03</span>
                <h2 className="judul-temuan">Empat wilayah tanpa data</h2>
                <p className="deskripsi-temuan">
                  Kaimana, Konawe Kepulauan, Nduga, dan Yalimo tampil kosong, tidak dihilangkan.
                </p>
              </div>

              <div className="kartu-temuan-keterbatasan">
                <span className="nomor-temuan">04</span>
                <h2 className="judul-temuan">Cakupan dampak tumbuh</h2>
                <p className="deskripsi-temuan">
                  2002 hanya 98 kabupaten, 2023 sebanyak 451. Kosong bukan berarti nol.
                </p>
              </div>

              <div className="kartu-temuan-keterbatasan">
                <span className="nomor-temuan">05</span>
                <h2 className="judul-temuan">Dampak dan agregat beda sumber</h2>
                <p className="deskripsi-temuan">
                  2023: 5.388 dari berkas wilayah, 5.519 dari tabel agregat.
                </p>
              </div>

              <div className="kartu-temuan-keterbatasan">
                <span className="nomor-temuan">06</span>
                <h2 className="judul-temuan">31 kode tidak bisa digambar</h2>
                <p className="deskripsi-temuan">
                  Wilayah Papua sebelum pemekaran punya angka tetapi tidak punya bentuk.
                </p>
              </div>

              <div className="kartu-temuan-keterbatasan">
                <span className="nomor-temuan">07</span>
                <h2 className="judul-temuan">Lima entri batas bukan wilayah</h2>
                <p className="deskripsi-temuan">
                  Danau, Danau Toba, Hutan, Waduk Cirata, dan Kedungombo dibuang.
                </p>
              </div>

              <div className="kartu-temuan-keterbatasan">
                <span className="nomor-temuan">08</span>
                <h2 className="judul-temuan">Nol berbeda dari kosong</h2>
                <p className="deskripsi-temuan">
                  Nol berarti tidak ada kejadian. Kosong berarti tidak dilaporkan.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ==============================================================
            16 · Tim dan teknologi
            ============================================================== */}
        {subHalaman === "tim" && (
          <div data-name="16 · Tim dan teknologi">
            <button
              type="button"
              className="tombol-kembali-teks"
              onClick={() => setSubHalaman("utama")}
            >
              <img src={arrowLeftSvg} alt="" width="14" height="14" />
              <span>Tentang</span>
            </button>

            <p className="remah-kategori">TIM DAN TEKNOLOGI</p>
            <h1 className="judul-halaman-utama">Tiga orang, satu peta yang bisa ditelusuri</h1>
            <p className="deskripsi-halaman-utama">
              Lentera dikerjakan tim miamiudua untuk MIA 2026, tema Designing Digital Futures:
              Powering Public Transparency.
            </p>

            <div className="kartu-tabel-lapisan" id="t-tim" data-name="Tabel tim">
              <div className="wadah-gulir-tabel">
                <table className="tabel-bantuan-resmi">
                  <thead>
                    <tr>
                      <th scope="col" style={{ width: "34%" }}>NAMA</th>
                      <th scope="col" style={{ width: "30%" }}>PERAN</th>
                      <th scope="col" style={{ width: "36%" }}>BAGIAN YANG DIKERJAKAN</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="tebal-teks">Muhammad Zayyan Rizka</td>
                      <td>Data dan peta</td>
                      <td>Pipeline data, peta wilayah, panel detail, berkas submission</td>
                    </tr>
                    <tr>
                      <td className="tebal-teks">Muhammad Bagas Farshaldy</td>
                      <td>Ketua tim</td>
                      <td>Formulir laporan warga, penyimpanan laporan, halaman moderator</td>
                    </tr>
                    <tr>
                      <td className="tebal-teks">Muhammad Mumtaaz Raihaan Thaariq</td>
                      <td>Antarmuka dan pengujian</td>
                      <td>Halaman bantuan, halaman Tentang, uji perangkat ponsel</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="kartu-tabel-lapisan" id="t-teknologi" data-name="Tabel teknologi">
              <div className="wadah-gulir-tabel">
                <table className="tabel-bantuan-resmi">
                  <thead>
                    <tr>
                      <th scope="col" style={{ width: "26%" }}>BAGIAN</th>
                      <th scope="col" style={{ width: "74%" }}>DIPAKAI</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="tebal-teks">Antarmuka</td>
                      <td>React 19, Vite 8, TypeScript, DM Sans</td>
                    </tr>
                    <tr>
                      <td className="tebal-teks">Peta</td>
                      <td>Leaflet, tanpa ubin basemap, tetap berjalan tanpa jaringan</td>
                    </tr>
                    <tr>
                      <td className="tebal-teks">Data</td>
                      <td>Pipeline statis menjadi berkas JSON, bukan API saat halaman dibuka</td>
                    </tr>
                    <tr>
                      <td className="tebal-teks">Laporan warga</td>
                      <td>
                        Supabase untuk akun, tabel laporan, dan berkas bukti. Ada mode lokal supaya
                        demo tetap jalan tanpa jaringan.
                      </td>
                    </tr>
                    <tr>
                      <td className="tebal-teks">Lisensi</td>
                      <td>Data BNPB ODC-BY, batas wilayah geoBoundaries CC-BY 4.0</td>
                    </tr>
                    <tr>
                      <td className="tebal-teks">Kode sumber</td>
                      <td>github.com/rzayyanr/lentera</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <section className="tt-blok" id="t-lisensi" data-name="Lisensi dan kredit">
              <p className="tt-tanda">LISENSI DAN KREDIT</p>
              <h2 className="tt-judul">Data terbuka, kode terbuka</h2>
              <p className="tt-teks">
                Data BNPB dipakai sesuai lisensi <b>ODC-BY</b>. Batas wilayah dari geoBoundaries
                berlisensi <b>CC-BY 4.0</b>. Riwayat kejadian Jawa Timur berasal dari SMARTPB BPBD
                Jawa Timur. Kode sumber Lentera terbuka di GitHub dan bisa diperiksa siapa pun.
              </p>
              <div className="badge-wrapper-lisensi">
                <span className="badge-lapisan resmi">Data BNPB · ODC-BY</span>
                <span className="badge-lapisan komunitas">Batas wilayah · CC-BY 4.0</span>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
