import type { OrderStatus } from "@prisma/client";
import { cn, formatPrice } from "@/lib/utils";
import type { ViewerOrder } from "@/server/queries/orders";

export const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Awaiting payment",
  PAID: "Paid",
  SHIPPED: "Shipped",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

const STATUS_TONE: Record<OrderStatus, string> = {
  PENDING: "bg-ember/20 text-slate",
  PAID: "bg-forest text-bone",
  SHIPPED: "bg-slate text-bone",
  CANCELLED: "bg-slate/10 text-muted",
  REFUNDED: "bg-slate/10 text-muted",
};

export function StatusPill({ status, className }: { status: OrderStatus; className?: string }) {
  return <span className={cn("label-mono inline-flex rounded-full px-3 py-1", STATUS_TONE[status], className)}>{STATUS_LABEL[status]}</span>;
}

/** Order number shown to customers: the last 8 characters of the id, upper-cased. */
export const orderNumber = (id: string) => `FB-${id.slice(-8).toUpperCase()}`;

/** Line items and totals, shared by the sandbox page, the confirmation and the order history. */
export function OrderSummary({ order, className }: { order: Pick<ViewerOrder, "items" | "subtotalAmount" | "shippingAmount" | "totalAmount">; className?: string }) {
  return (
    <div className={cn("rounded-[20px] bg-sand/60 p-5 sm:p-6", className)}>
      <ul className="divide-y divide-line">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-baseline justify-between gap-4 py-3 first:pt-0">
            <span className="min-w-0">
              <span className="block truncate font-semibold">{item.productName}</span>
              <span className="label-mono text-muted">{item.color} · {item.size} · ×{item.quantity}</span>
            </span>
            <span className="shrink-0 tabular-nums">{formatPrice(item.unitPrice * item.quantity)}</span>
          </li>
        ))}
      </ul>
      <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
        <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="tabular-nums">{formatPrice(order.subtotalAmount)}</dd></div>
        <div className="flex justify-between"><dt className="text-muted">Shipping</dt><dd className="tabular-nums">{order.shippingAmount === 0 ? "Free" : formatPrice(order.shippingAmount)}</dd></div>
        <div className="flex items-baseline justify-between pt-2"><dt className="label-mono text-muted">Total</dt><dd className="font-serif text-[30px] leading-none tabular-nums">{formatPrice(order.totalAmount)}</dd></div>
      </dl>
    </div>
  );
}
