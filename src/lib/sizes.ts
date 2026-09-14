const APPAREL_ORDER = ["XS", "S", "M", "L", "XL", "One Size"];

/** Numeric shoe sizes ascending, then apparel sizes in wearing order. */
export function compareSizes(a: string, b: string) {
  const na = Number(a), nb = Number(b);
  if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
  return APPAREL_ORDER.indexOf(a) - APPAREL_ORDER.indexOf(b);
}
