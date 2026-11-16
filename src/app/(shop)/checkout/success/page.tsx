import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ClearCartOnPaid, RefreshWhilePending } from "@/features/checkout/after-checkout";
import { OrderSummary, StatusPill, orderNumber } from "@/features/checkout/order-summary";
import { getOrderForViewer, maskEmail } from "@/server/queries/orders";

export const metadata: Metadata = { title: "Order confirmation", robots: { index: false } };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ order?: string }> };
type Address = { name?: string | null; line1?: string | null; city?: string | null; postalCode?: string | null; country?: string | null };

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { order: orderId } = await searchParams;
  const order = orderId ? await getOrderForViewer(orderId) : null;
  if (!order) notFound();
  if (order.status === "CANCELLED") redirect(`/checkout/cancelled?order=${order.id}`);

  const pending = order.status === "PENDING";
  const address = (order.shippingAddress ?? null) as Address | null;

  return (
    <div className="container-page max-w-3xl py-12 md:py-20">
      {pending ? <RefreshWhilePending /> : <ClearCartOnPaid />}
      <p className="label-mono text-forest">Order {orderNumber(order.id)}</p>
      <h1 className="display mt-4 text-[clamp(44px,7vw,84px)]">
        {pending ? <>Confirming your <em>payment</em>…</> : order.status === "REFUNDED" ? <>This order was <em>refunded</em>.</> : <>Thank you. It&rsquo;s <em>on its way</em>.</>}
      </h1>
      <div role="status" className="mt-6 flex flex-wrap items-center gap-3 text-muted">
        <StatusPill status={order.status} />
        {pending ? (
          <span>This usually takes a few seconds. The page updates by itself.</span>
        ) : order.email ? (
          <span>A receipt is on its way to {maskEmail(order.email)}.</span>
        ) : null}
      </div>

      <OrderSummary order={order} className="mt-10" />

      {address?.line1 && (
        <section aria-labelledby="ship-to" className="mt-6 rounded-[20px] ring-1 ring-inset ring-line p-5 sm:p-6">
          <h2 id="ship-to" className="label-mono text-muted">Shipping to</h2>
          <p className="mt-3 leading-relaxed">
            {address.name}<br />
            {address.line1}<br />
            {[address.city, address.postalCode, address.country].filter(Boolean).join(", ")}
          </p>
        </section>
      )}

      <div className="mt-10 flex flex-wrap gap-3">
        <Button asChild size="lg" variant="forest"><Link href="/">Keep shopping</Link></Button>
        {order.userId && <Button asChild size="lg" variant="outline"><Link href="/account/orders">Your orders</Link></Button>}
      </div>
    </div>
  );
}
