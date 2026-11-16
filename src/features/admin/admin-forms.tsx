"use client";

import type { OrderStatus } from "@prisma/client";
import { useActionState } from "react";
import { cn } from "@/lib/utils";
import { setVariantStock, updateOrderStatus, type AdminActionState } from "@/server/actions/admin";

const pill = "inline-flex h-9 items-center rounded-full px-4 text-sm font-semibold ring-1 ring-inset ring-line-strong transition-colors hover:bg-slate hover:text-bone disabled:pointer-events-none disabled:opacity-40";

function Result({ state }: { state: AdminActionState }) {
  if (!state) return null;
  return (
    <p role={state.ok ? "status" : "alert"} className={cn("text-xs", state.ok ? "text-forest" : "text-slate")}>
      {state.message}
    </p>
  );
}

/** The status changes an order allows right now. Refund asks for a second click, since it moves money. */
export function OrderActions({ orderId, status, number }: { orderId: string; status: OrderStatus; number: string }) {
  const [state, action, pending] = useActionState(updateOrderStatus, null);
  const canShip = status === "PAID";
  const canRefund = status === "PAID" || status === "SHIPPED";
  const canCancel = status === "PENDING";
  if (!canShip && !canRefund && !canCancel) return <Result state={state} />;

  return (
    <form action={action} className="flex flex-col items-end gap-2">
      <input type="hidden" name="order" value={orderId} />
      <div className="flex flex-wrap justify-end gap-2">
        {canShip && <button type="submit" name="action" value="ship" disabled={pending} className={pill} aria-label={`Mark ${number} as shipped`}>Mark shipped</button>}
        {canCancel && <button type="submit" name="action" value="cancel" disabled={pending} className={pill} aria-label={`Cancel ${number}`}>Cancel</button>}
        {canRefund && (
          <details className="relative">
            <summary className={cn(pill, "cursor-pointer list-none")} aria-label={`Refund ${number}`}>Refund…</summary>
            <div className="absolute right-0 z-10 mt-2 w-60 rounded-[14px] bg-bone p-4 text-left shadow-[0_20px_40px_-20px_rgba(28,34,38,.5)] ring-1 ring-inset ring-line-strong">
              <p className="text-sm">Refund the full amount and put the items back in stock?</p>
              <button type="submit" name="action" value="refund" disabled={pending} className={cn(pill, "mt-3 bg-slate text-bone")}>Yes, refund {number}</button>
            </div>
          </details>
        )}
      </div>
      <Result state={state} />
    </form>
  );
}

/** Inline stock editor for one variant. */
export function StockForm({ variantId, stock, label }: { variantId: string; stock: number; label: string }) {
  const [state, action, pending] = useActionState(setVariantStock, null);
  return (
    <form action={action} className="flex items-center justify-end gap-2">
      <input type="hidden" name="variant" value={variantId} />
      <label className="sr-only" htmlFor={`stock-${variantId}`}>Stock for {label}</label>
      <input
        id={`stock-${variantId}`}
        name="stock"
        type="number"
        min={0}
        max={9999}
        defaultValue={stock}
        className={cn("h-9 w-20 rounded-full bg-bone px-3 text-right tabular-nums ring-1 ring-inset ring-line-strong focus:outline-none focus:ring-2 focus:ring-forest", stock === 0 && "ring-ember")}
      />
      <button type="submit" disabled={pending} className={pill}>Save</button>
      <span className="w-20 text-left"><Result state={state} /></span>
    </form>
  );
}
