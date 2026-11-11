/** Tanggal lokal sebagai YYYY-MM-DD.
 *
 *  `Date.prototype.toISOString` memakai UTC, sehingga di WIB (UTC+7) pukul
 *  00.00–07.00 menghasilkan tanggal kemarin. Semua perbandingan tanggal di
 *  formulir memakai format ini. */
export function isoLokal(d: Date): string {
  const bulan = String(d.getMonth() + 1).padStart(2, "0");
  const tanggal = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${bulan}-${tanggal}`;
}
