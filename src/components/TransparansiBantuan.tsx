import { useState } from "react";
import arrowLeftSvg from "../assets/icons/arrow-left.svg";
import arrowUpRightSvg from "../assets/icons/arrow-up-right.svg";

interface Props {
  subHalamanAwal?: "ikhtisar" | "resmi" | "komunitas";
  onBukaLapor?: () => void;
}

export default function TransparansiBantuan({
  subHalamanAwal = "ikhtisar",
  onBukaLapor,
}: Props) {
  const [subHalaman, setSubHalaman] = useState<"ikhtisar" | "resmi" | "komunitas">(
    subHalamanAwal
  );

  return (
    <div className="halaman-transparansi-bantuan">
      <div className="wadah-konten-lebar">
        {/* ==============================================================
            09 · Transparansi bantuan — Ikhtisar
            ============================================================== */}
        {subHalaman === "ikhtisar" && (
          <div data-node-id="12:216" data-name="09 · Transparansi bantuan">
            <p className="remah-kategori">TRANSPARANSI BANTUAN</p>
            <h1 className="judul-halaman-utama">Dua lapisan bantuan, tidak pernah dicampur</h1>
            <p className="deskripsi-halaman-utama">
              Data bantuan pemerintah dan catatan komunitas ditampilkan terpisah. Setiap baris menyebut sumbernya, dan status verifikasi selalu terlihat.
            </p>

            {/* Grid 2 Kartu: Resmi vs Komunitas */}
            <div className="grid-dua-kartu-bantuan">
              {/* Card 1: Lapisan resmi */}
              <section className="kartu-opsi-bantuan" data-name="Lapisan resmi">
                <h2 className="judul-opsi-bantuan">Bantuan pemerintah daerah</h2>
                <p className="subjudul-opsi-bantuan">
                  Alokasi dan penyaluran bantuan yang diterbitkan pemerintah daerah. Angkanya tidak bisa diubah dan tidak digabung dengan catatan warga.
                </p>

                <ul className="daftar-titik-panduan">
                  <li>
                    <span className="titik-simbol">•</span>
                    <span>Program, wilayah, periode, dan jumlah penerima</span>
                  </li>
                  <li>
                    <span className="titik-simbol">•</span>
                    <span>Tautan ke dokumen asli di situs pemerintah</span>
                  </li>
                  <li>
                    <span className="titik-simbol">•</span>
                    <span>Pembaruan mengikuti terbitan resmi</span>
                  </li>
                </ul>

                <button
                  type="button"
                  className="tombol-aksi-sekunder tombol-buka-lapisan"
                  onClick={() => setSubHalaman("resmi")}
                >
                  Buka lapisan resmi
                </button>
              </section>

              {/* Card 2: Catatan komunitas */}
              <section className="kartu-opsi-bantuan" data-name="Catatan komunitas">
                <h2 className="judul-opsi-bantuan">Catatan dari warga dan relawan</h2>
                <p className="subjudul-opsi-bantuan">
                  Informasi lapangan yang belum tentu berasal dari instansi. Selalu diberi label dan status verifikasi.
                </p>

                <ul className="daftar-titik-panduan">
                  <li>
                    <span className="titik-simbol">•</span>
                    <span>Ditulis warga atau relawan, bukan pejabat</span>
                  </li>
                  <li>
                    <span className="titik-simbol">•</span>
                    <span>Status verifikasi terlihat di setiap entri</span>
                  </li>
                  <li>
                    <span className="titik-simbol">•</span>
                    <span>Tidak pernah dijumlahkan dengan data resmi</span>
                  </li>
                </ul>

                <button
                  type="button"
                  className="tombol-aksi-sekunder tombol-buka-lapisan"
                  onClick={() => setSubHalaman("komunitas")}
                >
                  Buka catatan komunitas
                </button>
              </section>
            </div>

            {/* Box: Kenapa dipisah */}
            <section className="kartu-kenapa-dipisah" data-name="Kenapa dipisah">
              <h2 className="judul-seksi-kartu">Kenapa dipisah</h2>
              <div className="grid-dua-kolom-penjelasan">
                <p>
                  Data resmi punya penerbit, nomor dokumen, dan tanggal terbit. Catatan komunitas punya penulis dan status verifikasi, tetapi tidak punya kewenangan resmi. Menjumlahkan keduanya membuat angka yang tidak bisa dipertanggungjawabkan.
                </p>
                <p>
                  Karena itu peta tidak pernah memakai catatan komunitas sebagai nilai wilayah, dan panel selalu menyebut lapisan mana yang sedang dibaca.
                </p>
              </div>
            </section>
          </div>
        )}

        {/* ==============================================================
            10 · Lapisan data resmi
            ============================================================== */}
        {subHalaman === "resmi" && (
          <div data-node-id="12:276" data-name="10 · Lapisan data resmi">
            <button
              type="button"
              className="tombol-kembali-teks"
              onClick={() => setSubHalaman("ikhtisar")}
            >
              <img src={arrowLeftSvg} alt="" width="14" height="14" />
              <span>Transparansi bantuan</span>
            </button>

            <p className="remah-kategori">LAPISAN DATA RESMI</p>
            <h1 className="judul-halaman-utama">Bantuan pemerintah daerah</h1>
            <p className="deskripsi-halaman-utama">
              Entri bantuan yang diterbitkan instansi, dengan tautan ke dokumen aslinya. Tampilan ini memakai contoh isi, bukan data terbit.
            </p>

            <div className="baris-badge-atas-tabel">
              <span className="badge-lapisan resmi">Data resmi · contoh isi</span>
            </div>

            <div className="kartu-tabel-lapisan" data-name="Tabel">
              <div className="wadah-gulir-tabel">
                <table className="tabel-bantuan-resmi">
                  <thead>
                    <tr>
                      <th scope="col" style={{ width: "26%" }}>PROGRAM</th>
                      <th scope="col" style={{ width: "18%" }}>WILAYAH</th>
                      <th scope="col" style={{ width: "18%" }}>PERIODE</th>
                      <th scope="col" style={{ width: "12%" }}>PENERIMA</th>
                      <th scope="col" style={{ width: "16%" }}>SUMBER</th>
                      <th scope="col" style={{ width: "10%" }}>TAUTAN</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="tebal-teks">Bantuan sosial tunai</td>
                      <td>Kota Surabaya</td>
                      <td>Jan–Jun 2025</td>
                      <td>1.240 KK</td>
                      <td>Pemkot Surabaya</td>
                      <td>
                        <a
                          href="https://surabaya.go.id"
                          target="_blank"
                          rel="noreferrer"
                          className="tautan-tabel-dokumen"
                        >
                          <span>Dokumen</span>
                          <img src={arrowUpRightSvg} alt="" width="12" height="12" />
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td className="tebal-teks">Bantuan pangan non-tunai</td>
                      <td>Kota Surabaya</td>
                      <td>Triwulan III 2025</td>
                      <td>860 KK</td>
                      <td>Pemkot Surabaya</td>
                      <td>
                        <a
                          href="https://surabaya.go.id"
                          target="_blank"
                          rel="noreferrer"
                          className="tautan-tabel-dokumen"
                        >
                          <span>Dokumen</span>
                          <img src={arrowUpRightSvg} alt="" width="12" height="12" />
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td className="tebal-teks">Renovasi rumah tidak layak</td>
                      <td>Kota Surabaya</td>
                      <td>2024</td>
                      <td>74 unit</td>
                      <td>Pemkot Surabaya</td>
                      <td>
                        <a
                          href="https://surabaya.go.id"
                          target="_blank"
                          rel="noreferrer"
                          className="tautan-tabel-dokumen"
                        >
                          <span>Dokumen</span>
                          <img src={arrowUpRightSvg} alt="" width="12" height="12" />
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td className="tebal-teks">Logistik posko bencana</td>
                      <td>Kota Surabaya</td>
                      <td>Desember 2025</td>
                      <td>12 posko</td>
                      <td>BPBD Kota Surabaya</td>
                      <td>
                        <a
                          href="https://surabaya.go.id"
                          target="_blank"
                          rel="noreferrer"
                          className="tautan-tabel-dokumen"
                        >
                          <span>Dokumen</span>
                          <img src={arrowUpRightSvg} alt="" width="12" height="12" />
                        </a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <p className="catatan-kaki-tabel">
              Setiap baris wajib punya dokumen sumber. Entri tanpa tautan tidak diterbitkan di lapisan ini.
            </p>
          </div>
        )}

        {/* ==============================================================
            11 · Catatan komunitas
            ============================================================== */}
        {subHalaman === "komunitas" && (
          <div data-node-id="12:344" data-name="11 · Catatan komunitas">
            <button
              type="button"
              className="tombol-kembali-teks"
              onClick={() => setSubHalaman("ikhtisar")}
            >
              <img src={arrowLeftSvg} alt="" width="14" height="14" />
              <span>Transparansi bantuan</span>
            </button>

            <p className="remah-kategori">CATATAN KOMUNITAS</p>
            <h1 className="judul-halaman-utama">Informasi lapangan dari warga</h1>
            <p className="deskripsi-halaman-utama">
              Catatan ini tidak diterbitkan instansi. Setiap entri menyebut penulis, tanggal, dan status verifikasi. Tampilan memakai contoh isi.
            </p>

            <div className="baris-badge-atas-tabel">
              <span className="badge-lapisan komunitas">Catatan komunitas · contoh isi</span>
            </div>

            <div className="grid-formulir-dan-sidebar">
              {/* Kolom Kiri: 3 Catatan */}
              <div className="kolom-daftar-catatan-komunitas">
                <article className="kartu-entri-komunitas" data-name="Catatan">
                  <h2 className="judul-entri-komunitas">
                    Posko pengungsi di Balai Desa Sukapura
                  </h2>
                  <p className="subjudul-entri-komunitas">
                    Probolinggo Kabupaten · 31 Desember 2025
                  </p>
                  <p className="isi-entri-komunitas">
                    Tenda sudah berdiri, kebutuhan air bersih masih kurang.
                  </p>
                  <div className="baris-kaki-komunitas">
                    <span className="badge-lapisan netral">Belum diverifikasi</span>
                    <span className="label-pengirim-komunitas">Dikirim warga</span>
                  </div>
                </article>

                <article className="kartu-entri-komunitas" data-name="Catatan">
                  <h2 className="judul-entri-komunitas">
                    Jalur evakuasi tertutup material
                  </h2>
                  <p className="subjudul-entri-komunitas">
                    Lumajang Kabupaten · 23 Desember 2025
                  </p>
                  <p className="isi-entri-komunitas">
                    Akses dari arah utara tidak bisa dilewati kendaraan roda empat.
                  </p>
                  <div className="baris-kaki-komunitas">
                    <span className="badge-lapisan resmi">Sudah diverifikasi moderator</span>
                    <span className="label-pengirim-komunitas">Dikirim relawan</span>
                  </div>
                </article>

                <article className="kartu-entri-komunitas" data-name="Catatan">
                  <h2 className="judul-entri-komunitas">
                    Dapur umum di Kecamatan Grati
                  </h2>
                  <p className="subjudul-entri-komunitas">
                    Pasuruan Kabupaten · 31 Desember 2025
                  </p>
                  <p className="isi-entri-komunitas">
                    Dapur umum mulai beroperasi pukul 15.00, menerima sumbangan beras.
                  </p>
                  <div className="baris-kaki-komunitas">
                    <span className="badge-lapisan netral">Belum diverifikasi</span>
                    <span className="label-pengirim-komunitas">Dikirim warga</span>
                  </div>
                </article>
              </div>

              {/* Kolom Kanan: Aturan & Kirim */}
              <div className="kolom-sidebar-laporan">
                <section className="kartu-panduan-laporan" data-name="Aturan catatan">
                  <h2 className="judul-seksi-kartu">Aturan catatan komunitas</h2>
                  <ul className="daftar-titik-panduan">
                    <li>
                      <span className="titik-simbol">•</span>
                      <span>Tidak memakai nama lengkap penulis.</span>
                    </li>
                    <li>
                      <span className="titik-simbol">•</span>
                      <span>Ditampilkan sampai tingkat desa saja.</span>
                    </li>
                    <li>
                      <span className="titik-simbol">•</span>
                      <span>Status verifikasi selalu terlihat.</span>
                    </li>
                    <li>
                      <span className="titik-simbol">•</span>
                      <span>Tidak pernah mengubah angka resmi di peta.</span>
                    </li>
                  </ul>
                </section>

                <section className="kartu-panduan-laporan" data-name="Kirim catatan">
                  <h2 className="judul-seksi-kartu">Punya informasi lapangan?</h2>
                  <p className="teks-privasi-laporan">
                    Kirim lewat formulir laporan. Catatan akan tampil setelah ditinjau moderator.
                  </p>
                  <button
                    type="button"
                    className="tombol-aksi-utama"
                    onClick={onBukaLapor}
                  >
                    Kirim laporan
                  </button>
                </section>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
