import { useMemo, useState } from "react";
import PemilihWilayah from "./PemilihWilayah";
import {
  fmt,
  ambilNilai,
  namaProvinsiRapi,
  namaWilayahRapi,
  type DataLentera,
  type Wilayah,
} from "../lib/data";

interface Props {
  siap: DataLentera | null;
}

export default function BandingkanWilayah({ siap }: Props) {
  const [kodeA, setKodeA] = useState("3201"); // Bogor
  const [kodeB, setKodeB] = useState("1610"); // Ogan Ilir
  const [tahunPilih, setTahunPilih] = useState(2024);

  const daftarTahun = useMemo(() => {
    return siap?.meta.tahun ?? [
      2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024
    ];
  }, [siap]);

  // Daftar 510 wilayah untuk pemilih. Nama dirapikan supaya tidak tampil
  // huruf besar semua di panel pencarian.
  const butirWilayah = useMemo(() => {
    if (!siap) return [];
    const namaProv = new Map(siap.provinsi.map((p) => [p.kode, namaProvinsiRapi(p.nama)]));
    return siap.wilayah.map((w) => ({
      kode: w.kode,
      nama: namaWilayahRapi(w.nama),
      sub: namaProv.get(w.prov) ?? "",
    }));
  }, [siap]);

  // Pilihan tahun untuk pemilih. Tanpa sub-baris, jadi barisnya ringkas.
  const butirTahun = useMemo(
    () => daftarTahun.map((th) => ({ kode: String(th), nama: String(th) })),
    [daftarTahun],
  );

  const wilayahA = useMemo<Wilayah | null>(() => {
    if (!siap) return null;
    return siap.perKode.get(kodeA) ?? null;
  }, [siap, kodeA]);

  const wilayahB = useMemo<Wilayah | null>(() => {
    if (!siap) return null;
    return siap.perKode.get(kodeB) ?? null;
  }, [siap, kodeB]);

  const provA = useMemo(() => {
    if (!siap || !wilayahA) return "Jawa Barat";
    return siap.provinsi.find((p) => p.kode === wilayahA.prov)?.nama ?? "Jawa Barat";
  }, [siap, wilayahA]);

  const provB = useMemo(() => {
    if (!siap || !wilayahB) return "Sumatera Selatan";
    return siap.provinsi.find((p) => p.kode === wilayahB.prov)?.nama ?? "Sumatera Selatan";
  }, [siap, wilayahB]);

  const namaA = wilayahA?.nama ?? "Bogor";
  const namaB = wilayahB?.nama ?? "Ogan Ilir";

  // Nilai pada tahun dipilih
  const nilaiA = useMemo(() => {
    if (siap && wilayahA) {
      const v = ambilNilai(siap, wilayahA.kode, tahunPilih, "kejadian");
      if (v !== null) return v;
    }
    return 128;
  }, [siap, wilayahA, tahunPilih]);

  const nilaiB = useMemo(() => {
    if (siap && wilayahB) {
      const v = ambilNilai(siap, wilayahB.kode, tahunPilih, "kejadian");
      if (v !== null) return v;
    }
    return 70;
  }, [siap, wilayahB, tahunPilih]);

  const selisihNilai = Math.abs(nilaiA - nilaiB);

  // Riwayat 15 tahun A
  const riwayatA = useMemo(() => {
    if (siap && wilayahA) {
      return siap.meta.tahun.map((th, i) => ({
        tahun: th,
        nilai: wilayahA.nilai[i] ?? 0,
      }));
    }
    return [
      { tahun: 2010, nilai: 8 }, { tahun: 2011, nilai: 7 }, { tahun: 2012, nilai: 37 },
      { tahun: 2013, nilai: 7 }, { tahun: 2014, nilai: 20 }, { tahun: 2015, nilai: 10 },
      { tahun: 2016, nilai: 12 }, { tahun: 2017, nilai: 26 }, { tahun: 2018, nilai: 27 },
      { tahun: 2019, nilai: 387 }, { tahun: 2020, nilai: 77 }, { tahun: 2021, nilai: 129 },
      { tahun: 2022, nilai: 73 }, { tahun: 2023, nilai: 88 }, { tahun: 2024, nilai: 128 },
    ];
  }, [siap, wilayahA]);

  // Riwayat 15 tahun B
  const riwayatB = useMemo(() => {
    if (siap && wilayahB) {
      return siap.meta.tahun.map((th, i) => ({
        tahun: th,
        nilai: wilayahB.nilai[i] ?? 0,
      }));
    }
    return [
      { tahun: 2010, nilai: 4 }, { tahun: 2011, nilai: 4 }, { tahun: 2012, nilai: 5 },
      { tahun: 2013, nilai: 4 }, { tahun: 2014, nilai: 4 }, { tahun: 2015, nilai: 4 },
      { tahun: 2016, nilai: 6 }, { tahun: 2017, nilai: 4 }, { tahun: 2018, nilai: 11 },
      { tahun: 2019, nilai: 21 }, { tahun: 2020, nilai: 8 }, { tahun: 2021, nilai: 19 },
      { tahun: 2022, nilai: 15 }, { tahun: 2023, nilai: 12 }, { tahun: 2024, nilai: 70 },
    ];
  }, [siap, wilayahB]);

  const maxSkala = useMemo(() => {
    const maxA = Math.max(...riwayatA.map((r) => r.nilai), 1);
    const maxB = Math.max(...riwayatB.map((r) => r.nilai), 1);
    return Math.max(maxA, maxB);
  }, [riwayatA, riwayatB]);

  // Puncak riwayat
  const puncakA = useMemo(() => {
    let pVal = 0;
    let pTh = 2019;
    for (const r of riwayatA) {
      if (r.nilai > pVal) {
        pVal = r.nilai;
        pTh = r.tahun;
      }
    }
    return { nilai: pVal || 387, tahun: pTh };
  }, [riwayatA]);

  const puncakB = useMemo(() => {
    let pVal = 0;
    let pTh = 2024;
    for (const r of riwayatB) {
      if (r.nilai > pVal) {
        pVal = r.nilai;
        pTh = r.tahun;
      }
    }
    return { nilai: pVal || 70, tahun: pTh };
  }, [riwayatB]);

  return (
    <div className="halaman-bandingkan-wilayah" data-node-id="16:565" data-name="18 · Bandingkan wilayah dan tahun">
      <div className="wadah-konten-lebar">
        <p className="remah-kategori">BANDINGKAN WILAYAH</p>
        <h1 className="judul-halaman-utama">
          {namaA} dan {namaB}, {tahunPilih}
        </h1>
        <p className="deskripsi-halaman-utama">
          Dua wilayah dengan tahun yang sama. Angka diambil dari tabel agregat BNPB dan tidak dijumlahkan menjadi satu total.
        </p>

        {/* 3 Baris Pemilih Dropdown */}
        <div className="baris-pemilih-komparasi">
          <div className="item-pemilih-komparasi">
            <span className="label-input-kapital">WILAYAH A</span>
            <PemilihWilayah
              idAwalan="bandingkan-a"
              butir={butirWilayah}
              nilai={kodeA}
              onPilih={setKodeA}
              placeholder="Pilih kabupaten atau kota"
              label="Wilayah A"
              petunjukCari="Cari kabupaten atau kota"
            />
          </div>

          <div className="item-pemilih-komparasi">
            <span className="label-input-kapital">WILAYAH B</span>
            <PemilihWilayah
              idAwalan="bandingkan-b"
              butir={butirWilayah}
              nilai={kodeB}
              onPilih={setKodeB}
              placeholder="Pilih kabupaten atau kota"
              label="Wilayah B"
              petunjukCari="Cari kabupaten atau kota"
            />
          </div>

          <div className="item-pemilih-komparasi">
            <span className="label-input-kapital">TAHUN</span>
            <PemilihWilayah
              idAwalan="bandingkan-tahun"
              butir={butirTahun}
              nilai={String(tahunPilih)}
              onPilih={(kode) => setTahunPilih(Number(kode))}
              placeholder="Pilih tahun"
              label="Tahun"
              tanpaCari
            />
          </div>
        </div>

        {/* Grid 2 Kartu Wilayah */}
        <div className="grid-dua-kartu-bandingkan">
          {/* Kartu Wilayah A */}
          <section className="kartu-wilayah-bandingkan" data-name="Wilayah">
            <h2 className="nama-wilayah-bandingkan">{namaA}</h2>
            <p className="sub-wilayah-bandingkan">
              {provA} · kode {wilayahA?.kode ?? "3201"}
            </p>

            <div className="kpi-hero-bandingkan">
              <p className="angka-kpi-bandingkan">{fmt(nilaiA)}</p>
              <p className="keterangan-kpi-bandingkan">kejadian pada {tahunPilih}</p>
            </div>

            {/* Histogram Riwayat 2010 - 2024 */}
            <div className="area-histogram-bandingkan">
              <div className="batang-histogram-baris">
                {riwayatA.map((r) => {
                  const tinggiPx = Math.max(3, Math.round((r.nilai / maxSkala) * 56));
                  const aktif = r.tahun === tahunPilih;
                  return (
                    <div
                      key={r.tahun}
                      className={`batang-mini ${aktif ? "aktif" : ""}`}
                      style={{ height: `${tinggiPx}px` }}
                      title={`${r.tahun}: ${fmt(r.nilai)} kejadian`}
                    />
                  );
                })}
              </div>
              <div className="sumbu-tahun-mini">
                <span>{daftarTahun[0]}</span>
                <span>{daftarTahun[daftarTahun.length - 1]}</span>
              </div>
              <p className="caption-riwayat-mini">
                Riwayat {daftarTahun[0]} sampai {daftarTahun[daftarTahun.length - 1]}
              </p>
            </div>
          </section>

          {/* Kartu Wilayah B */}
          <section className="kartu-wilayah-bandingkan" data-name="Wilayah">
            <h2 className="nama-wilayah-bandingkan">{namaB}</h2>
            <p className="sub-wilayah-bandingkan">
              {provB} · kode {wilayahB?.kode ?? "1610"}
            </p>

            <div className="kpi-hero-bandingkan">
              <p className="angka-kpi-bandingkan">{fmt(nilaiB)}</p>
              <p className="keterangan-kpi-bandingkan">kejadian pada {tahunPilih}</p>
            </div>

            {/* Histogram Riwayat 2010 - 2024 */}
            <div className="area-histogram-bandingkan">
              <div className="batang-histogram-baris">
                {riwayatB.map((r) => {
                  const tinggiPx = Math.max(3, Math.round((r.nilai / maxSkala) * 56));
                  const aktif = r.tahun === tahunPilih;
                  return (
                    <div
                      key={r.tahun}
                      className={`batang-mini ${aktif ? "aktif" : ""}`}
                      style={{ height: `${tinggiPx}px` }}
                      title={`${r.tahun}: ${fmt(r.nilai)} kejadian`}
                    />
                  );
                })}
              </div>
              <div className="sumbu-tahun-mini">
                <span>{daftarTahun[0]}</span>
                <span>{daftarTahun[daftarTahun.length - 1]}</span>
              </div>
              <p className="caption-riwayat-mini">
                Riwayat {daftarTahun[0]} sampai {daftarTahun[daftarTahun.length - 1]}
              </p>
            </div>
          </section>
        </div>

        {/* Kartu Selisih Komparasi */}
        <section className="kartu-selisih-komparasi" data-name="Selisih">
          <h2 className="judul-seksi-kartu">Selisih</h2>

          <div className="grid-empat-kolom-selisih">
            {/* Kolom 1 */}
            <div className="kolom-selisih">
              <span className="label-kolom-selisih">
                Kejadian {tahunPilih} · {namaA} / {namaB} / selisih
              </span>
              <p className="nilai-baris-selisih">{namaA} {fmt(nilaiA)}</p>
              <p className="nilai-baris-selisih">{namaB} {fmt(nilaiB)}</p>
              <p className="nilai-baris-selisih selisih-angka">Selisih {fmt(selisihNilai)}</p>
            </div>

            {/* Kolom 2 */}
            <div className="kolom-selisih">
              <span className="label-kolom-selisih">Puncak riwayat</span>
              <p className="nilai-baris-selisih">
                {fmt(puncakA.nilai)} ({puncakA.tahun})
              </p>
              <p className="nilai-baris-selisih">
                {fmt(puncakB.nilai)} ({puncakB.tahun})
              </p>
              <p className="nilai-baris-selisih">—</p>
            </div>

            {/* Kolom 3 */}
            <div className="kolom-selisih">
              <span className="label-kolom-selisih">Tahun pertama tercatat</span>
              <p className="nilai-baris-selisih">{daftarTahun[0]}</p>
              <p className="nilai-baris-selisih">{daftarTahun[0]}</p>
              <p className="nilai-baris-selisih">—</p>
            </div>

            {/* Kolom 4 */}
            <div className="kolom-selisih">
              <span className="label-kolom-selisih">Sumber</span>
              <p className="nilai-baris-selisih">Tabel agregat BNPB</p>
              <p className="nilai-baris-selisih">Tabel agregat BNPB</p>
              <p className="nilai-baris-selisih">—</p>
            </div>
          </div>
        </section>

        <p className="catatan-kaki-komparasi">
          Kolom pertama adalah {namaA}, kolom kedua {namaB}. Selisih hanya dihitung untuk ukuran yang bisa dibandingkan.
        </p>
      </div>
    </div>
  );
}
