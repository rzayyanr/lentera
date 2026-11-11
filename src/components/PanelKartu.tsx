import { useEffect, useRef, useState, type ReactNode } from "react";

interface Props {
  className: string;
  nodeId?: string;
  nama?: string;
  children: ReactNode;
}

/**
 * Kulit kartu panel kanan (ringkasan & detail).
 *
 * Scrollbar bawaan disembunyikan. Sebagai gantinya, tepi atas dan bawah isi
 * dibuat memudar ketika masih ada bagian yang belum terlihat, sehingga panel
 * tetap terbaca sebagai wadah yang bisa digulir tanpa batang abu-abu yang
 * memotong judul dan grafik.
 */
export default function PanelKartu({ className, nodeId, nama, children }: Props) {
  const isi = useRef<HTMLElement | null>(null);
  const [adaAtas, setAdaAtas] = useState(false);
  const [adaBawah, setAdaBawah] = useState(false);

  useEffect(() => {
    const el = isi.current;
    if (!el) return;

    const perbarui = () => {
      const sisa = el.scrollHeight - el.clientHeight - el.scrollTop;
      setAdaAtas(el.scrollTop > 8);
      setAdaBawah(sisa > 8);
    };

    perbarui();
    el.addEventListener("scroll", perbarui, { passive: true });
    window.addEventListener("resize", perbarui);

    // Isi panel berubah tinggi saat tab atau tahun berganti, sedangkan kotak
    // gulirnya berubah saat jendela diubah ukurannya.
    const pengamatUkuran = new ResizeObserver(perbarui);
    pengamatUkuran.observe(el);

    const pengamatIsi = new MutationObserver(perbarui);
    pengamatIsi.observe(el, { childList: true, subtree: true, characterData: true });

    return () => {
      el.removeEventListener("scroll", perbarui);
      window.removeEventListener("resize", perbarui);
      pengamatUkuran.disconnect();
      pengamatIsi.disconnect();
    };
  }, []);

  const tampilPetunjuk = adaBawah && !adaAtas;

  return (
    <div className={`bingkai-panel${adaAtas ? " ada-atas" : ""}${adaBawah ? " ada-bawah" : ""}`}>
      <aside ref={isi} className={className} data-node-id={nodeId} data-name={nama}>
        {children}
      </aside>

      <span
        className={`petunjuk-gulir-panel${tampilPetunjuk ? "" : " tersembunyi"}`}
        aria-hidden="true"
      >
        Gulir untuk selengkapnya ↓
      </span>
    </div>
  );
}
