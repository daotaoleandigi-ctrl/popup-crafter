import type { VoucherItem } from "@/types";

export function getVoucherProbabilityTotal(vouchers: VoucherItem[]) {
  return vouchers.reduce(
    (total, voucher) => total + Math.max(0, Number(voucher.probability) || 0),
    0,
  );
}

export function pickRandomVoucher(
  vouchers: VoucherItem[],
  random: () => number = Math.random,
) {
  const eligible = vouchers.filter(
    (voucher) => Number.isFinite(Number(voucher.probability)) && Number(voucher.probability) > 0,
  );
  const total = getVoucherProbabilityTotal(eligible);
  if (!eligible.length || total <= 0) return vouchers[0];

  let cursor = Math.min(Math.max(random(), 0), 0.999999999999) * total;
  for (const voucher of eligible) {
    cursor -= Number(voucher.probability);
    if (cursor < 0) return voucher;
  }
  return eligible[eligible.length - 1];
}
