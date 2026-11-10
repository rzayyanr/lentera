import { useState } from "react";
import arrowLeftSvg from "../assets/icons/arrow-left.svg";
import arrowUpRightSvg from "../assets/icons/arrow-up-right.svg";

interface Props {
  subHalamanAwal?: "utama" | "sumber" | "integritas" | "keterbatasan";
}

export default function Tentang({ subHalamanAwal = "utama" }: Props) {
  const [subHalaman, setSubHalaman] = useState<
    "utama" | "sumber" | "integritas" | "keterbatasan"
  >(subHalamanAwal);

  return (
    <div className="halaman-tentang-data">
      <div className="wadah-konten-lebar">
        {/* ==============================================================
            12 · Tentang dan sumber data — Tampilan Utama
            ============================================================== */}
        {subHalaman === "utama" && (
          <div data-node-id="12:412" data-name="12 · Tentang dan sumber data">
            <p className="remah-kategori">TENTANG DAN SUMBER DATA</p>
            <h1 className="judul-halaman-utama">Setiap angka di Lentera bisa ditelusuri</h1>
            <p className="deskripsi-halaman-utama">
              Halaman ini menjelaskan dari mana angkanya datang, bagaimana ia diolah, dan bagian mana yang belum sempurna.
            </p>

            {/* 3 Kartu Tautan Bagian */}
            <div className="grid-tiga-tautan-bagian">
              <div
                className="kartu-tautan-seksi"
                onClick={() => setSubHalaman("sumber")}
                role="button"
                tabIndex={0}
                data-name="Tautan bagian"
              >
                <h2 className="judul-kartu-tautan">Daftar sumber</h2>
                <p className="deskripsi-kartu-tautan">
                  Enam sumber data, lisensi, dan cakupannya.
                </p>
                <span className="tautan-aksi-panah">13 · Daftar sumber →</span>
              </div>

              <div
                className="kartu-tautan-seksi"
                onClick={() => setSubHalaman("integritas")}
                role="button"
                tabIndex={0}
                data-name="Tautan bagian"
              >
                <h2 className="judul-kartu-tautan">Arti label dan integritas</h2>
                <p className="deskripsi-kartu-tautan">
                  Apa yang dimaksud data resmi, laporan warga, dan catatan komunitas.
                </p>
                <span className="tautan-aksi-panah">14 · Arti label →</span>
              </div>

              <div
                className="kartu-tautan-seksi"
                onClick={() => setSubHalaman("keterbatasan")}
                role="button"
                tabIndex={0}
                data-name="Tautan bagian"
              >
                <h2 className="judul-kartu-tautan">Keterbatasan data</h2>
                <p className="deskripsi-kartu-tautan">
                  Delapan hal yang perlu diketahui sebelum memakai angka ini.
                </p>
                <span className="tautan-aksi-panah">15 · Keterbatasan →</span>
              </div>
            </div>

            {/* Seksi Prinsip: Tiga aturan yang tidak dilanggar */}
            <section className="kartu-prinsip-integritas" data-name="Prinsip">
              <h2 className="judul-seksi-kartu">Tiga aturan yang tidak dilanggar</h2>
              <div className="grid-dua-kolom-prinsip">
                <div className="kolom-prinsip">
                  <p className="item-prinsip">
                    Data resmi tidak pernah dicampur dengan laporan warga.
                  </p>
                  <p className="item-prinsip">
                    Angka agregat tidak digambarkan sebagai titik kejadian.
                  </p>
                </div>
                <div className="kolom-prinsip">
                  <p className="item-prinsip">
                    Setiap angka menyebut sumber dan tahunnya.
                  </p>
                  <p className="item-prinsip">
                    Wilayah tanpa catatan dibiarkan kosong, bukan diisi nol.
                  </p>
                </div>
              </div>

              <div className="badge-wrapper-prinsip">
                <span className="badge-lapisan resmi">Lisensi data BNPB: ODC-BY</span>
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
      </div>
    </div>
  );
}
