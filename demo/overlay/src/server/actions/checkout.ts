// Static demo: there is no server to price the cart or take a payment.
export type StartCheckoutResult = { ok: true; url: string } | { ok: false; error: "invalid" | "cart_changed" | "payment_unavailable" | "demo" };

export async function startCheckout(_input: unknown): Promise<StartCheckoutResult> {
  return { ok: false, error: "demo" };
}
