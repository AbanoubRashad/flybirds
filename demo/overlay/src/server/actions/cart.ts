// Static demo: there is no server to reconcile against, so the optimistic
// client cart is the source of truth. Returning no lines leaves it untouched.

export type ReconciledLine = { variantId: string; quantity: number; unitPrice: number; available: number; removed: boolean };

export async function reconcileCart(_input: unknown): Promise<ReconciledLine[]> {
  return [];
}
