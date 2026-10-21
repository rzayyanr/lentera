/**
 * Halaman Tentang dan sumber data.
 *
 * Halaman ini bukan pelengkap. Produk ini menjanjikan setiap angka bisa
 * ditelusuri, jadi tempat asal angkanya harus dijelaskan terbuka, termasuk
 * hal-hal yang belum sempurna.
 */

interface BarisSumber {
  data: string;
  sumber: string;
  cakupan: string;
  tautan?: string;
}

const SUMBER: BarisSumber[] = [
  {
    data: "Jumlah kejadian per kabupaten/kota",
    sumber: "Data Bencana Indonesia, BNPB",
    cakupan: "510 kabupaten/kota, 2010 sampai 2024",
    tautan: "https://data.bnpb.go.id/dataset/data-bencana-indonesia",
  },
  {
    data: "Korban dan kerusakan per kabupaten/kota",
    sumber: "Jumlah kejadian dan Dampak Bencana Tahun, BNPB",
    cakupan: "22 tahun, 2002 sampai 2023, 836 berkas",
    tautan: "https://data.bnpb.go.id/dataset/jumlah-kejadian-dan-dampak-bencana-tahun-2023",
  },
  {
    data: "Batas wilayah kabupaten/kota",
    sumber: "geoBoundaries, ADM2 Indonesia",
    cakupan: "514 bentuk, 510 berpasangan dengan data BNPB",
    tautan: "https://www.geoboundaries.org/",
  },
];

export default function Tentang() {
  return (
    <div className="halaman">
      <div className="kolom">
        <p className="remah">Tentang dan sumber data</p>
        <h1>Setiap angka di Lentera bisa ditelusuri</h1>
        <p className="pembuka">
          Lentera menampilkan dampak bencana di Indonesia pada tingkat
          kabupaten/kota. Halaman ini menjelaskan dari mana angkanya datang,
          bagaimana ia diolah, dan bagian mana yang belum sempurna.
        </p>

        <h2>Sumber data</h2>
        <table className="tabel-sumber">
          <thead>
            <tr>
              <th scope="col">Data</th>
              <th scope="col">Sumber</th>
              <th scope="col">Cakupan</th>
            </tr>
          </thead>
          <tbody>
            {SUMBER.map((s) => (
              <tr key={s.data}>
                <td>{s.data}</td>
                <td>
                  {s.tautan ? (
                    <a href={s.tautan} target="_blank" rel="noreferrer">
                      {s.sumber}
                    </a>
                  ) : (
                    s.sumber
                  )}
                </td>
                <td>{s.cakupan}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="catatan-kecil">
          Data BNPB dipakai dengan lisensi ODC-BY. Lentera tidak menambahkan
          angka apa pun ke dalamnya, dan tidak merata-ratakan data resmi dengan
          laporan warga.
        </p>

        <h2>Cara angka disusun</h2>
        <ol className="langkah">
          <li>
            Skrip menarik data dari portal BNPB, lalu menyimpannya sebagai berkas
            di dalam aplikasi. Pengguna tidak menunggu server BNPB saat membuka
            halaman.
          </li>
          <li>
            Nama wilayah dari BNPB dan nama wilayah pada data batas dicocokkan
            satu per satu, sebanyak 510 wilayah. Kode BPS yang menjadi kunci,
            bukan nama.
          </li>
          <li>
            Bentuk peta disederhanakan dan ditempeli kode wilayah, supaya
            pewarnaan tidak perlu menebak nama lagi.
          </li>
          <li>
            Hasilnya diperiksa sebelum dipakai. Pemeriksaan menolak data yang
            tahunnya kosong, jumlah ukurannya salah, atau totalnya berbeda dari
            hitungan manual.
          </li>
        </ol>

        <h2>Hal yang perlu diketahui tentang data ini</h2>
        <p>
          Bagian ini sengaja ditulis, bukan disembunyikan. Semuanya ditemukan
          saat mengolah data, dan sudah diperiksa langsung ke berkas aslinya.
        </p>

        <div className="temuan">
          <h3>Dua tabel BNPB tidak selalu cocok</h3>
          <p>
            Untuk tahun 2023, berkas per wilayah mencatat 5.388 kejadian,
            sedangkan tabel agregat mencatat 5.519. Selisihnya 131 kejadian.
            Penyebabnya, berkas per wilayah tidak memuat seluruh kabupaten.
            Sebagai contoh, Jawa Timur hanya memuat 30 baris dari 38
            kabupaten/kota yang seharusnya ada.
          </p>
          <p>
            Hal serupa terjadi pada 2024, ketika penjumlahan kabupaten berbeda
            dari tabel provinsi BNPB di tujuh provinsi, dengan total selisih 46
            kejadian. Aplikasi ini memakai penjumlahan kabupaten untuk angka
            provinsi, supaya angka di layar selalu konsisten.
          </p>
        </div>

        <div className="temuan">
          <h3>Wilayah yang tidak muncul bukan berarti nol</h3>
          <p>
            Berkas BNPB hanya memuat wilayah yang punya catatan pada tahun itu.
            Karena itu, wilayah tanpa catatan digambar dengan pola garis miring
            dan diberi keterangan tidak ada catatan, bukan diwarnai seperti nilai
            nol.
          </p>
          <p>
            Cakupan datanya juga tumbuh dari tahun ke tahun. Tahun 2002 hanya
            memuat 98 kabupaten, sedangkan tahun 2023 memuat 451. Kenaikan ini
            lebih menggambarkan membaiknya pelaporan daerah daripada naiknya
            jumlah bencana.
          </p>
        </div>

        <div className="temuan">
          <h3>Empat wilayah tidak ada di daftar BNPB</h3>
          <p>
            Kaimana, Konawe Kepulauan, Nduga, dan Yalimo ada di data batas
            wilayah, tetapi tidak ada di daftar kabupaten BNPB. Keempatnya tetap
            ditampilkan di peta sebagai wilayah tanpa data, bukan dihilangkan,
            supaya peta tidak berlubang.
          </p>
        </div>

        <div className="temuan">
          <h3>Sebagian wilayah lama tidak bisa digambar</h3>
          <p>
            31 kode wilayah pada berkas dampak adalah wilayah Papua sebelum
            pemekaran, dengan 411 kejadian sepanjang 22 tahun. Kode itu tidak
            punya bentuk di peta sekarang, jadi datanya tersimpan tetapi belum
            bisa ditampilkan. Sebaliknya, 16 kabupaten di provinsi Papua yang
            baru punya angka tetapi belum punya data dampak, total 104 kejadian.
          </p>
        </div>

        <div className="temuan">
          <h3>Kode 91 dan 92 mengikuti BNPB, bukan BPS</h3>
          <p>
            BNPB menulis kode 91 sebagai Papua dan 92 sebagai Papua Barat,
            kebalikan dari konvensi BPS. Lentera mengikuti penamaan BNPB supaya
            angkanya tetap bisa dicocokkan dengan sumber aslinya.
          </p>
        </div>

        <div className="temuan">
          <h3>Lima entri pada data batas bukan wilayah</h3>
          <p>
            Data batas memuat entri bernama Danau, Danau Toba, Hutan, Waduk
            Cirata, dan Wadung Kedungombo. Kelimanya bukan wilayah
            administratif, jadi dibuang supaya tidak muncul sebagai kabupaten di
            peta.
          </p>
        </div>

        <div className="temuan">
          <h3>Pencocokan nama pernah salah</h3>
          <p>
            Pencocokan otomatis pernah memasangkan TOBA ke Tuban, padahal
            keduanya kabupaten berbeda di provinsi berbeda. Karena itu 57 entri
            diputuskan manual, dan hasilnya diperiksa satu per satu. Aturannya,
            nama wilayah tidak pernah dipakai sebagai kunci tanpa pemeriksaan.
          </p>
        </div>

        <div className="temuan">
          <h3>DIBI tidak dipakai</h3>
          <p>
            DIBI adalah basis data bencana Indonesia milik BNPB. Saat diperiksa
            pada Oktober 2026, dasbor publiknya sudah diubah pihak lain dan
            menampilkan tulisan yang tidak semestinya. Karena itu Lentera tidak
            mengambil data dari sana.
          </p>
        </div>

        <h2>Tiga lapisan informasi</h2>
        <p>
          Lentera memisahkan informasi menurut asalnya, dan tidak pernah
          menggabungkannya menjadi satu angka.
        </p>
        <ul className="lapisan">
          <li>
            <span className="label-lapisan resmi">Data resmi</span>
            Berasal dari instansi. Setiap baris menyebut sumber dan tanggal
            pengambilannya.
          </li>
          <li>
            <span className="label-lapisan warga">Laporan warga</span>
            Dikirim masyarakat, belum diperiksa instansi. Selalu diberi label
            belum diverifikasi.
          </li>
          <li>
            <span className="label-lapisan komunitas">Catatan komunitas</span>
            Dicatat pengelola posko atau relawan, bukan angka resmi.
          </li>
        </ul>
        <p>
          Status laporan warga hanya sampai menunggu ditinjau atau ditinjau
          pengelola. Lentera tidak pernah menyatakan sebuah laporan sudah
          ditindaklanjuti instansi, karena itu bukan hal yang bisa dijamin.
        </p>

        <h2>Privasi</h2>
        <p>
          Formulir laporan tidak meminta nama, nomor telepon, atau alamat rumah.
          Lokasi laporan dipotong sampai kecamatan atau kelurahan, dan alamat
          lengkap tidak pernah ditampilkan. Laporan darurat tidak diterima di
          sini, melainkan diarahkan ke kanal darurat resmi.
        </p>

        <h2>Keadaan halaman ini</h2>
        <p>
          Lentera masih dalam pengerjaan untuk MIA 2026. Halaman peta, pemilih
          tahun dan ukuran, panel wilayah, serta halaman ini sudah berfungsi.
          Riwayat kejadian per tanggal, laporan warga, dan halaman bantuan
          sedang dikerjakan.
        </p>
      </div>
    </div>
  );
}
