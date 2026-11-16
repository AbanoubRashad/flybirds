import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { orderNumber } from "@/features/checkout/order-summary";
import { abandonCheckout } from "@/server/checkout/abandon";
import { getOrderForViewer } from "@/server/queries/orders";

export const metadata: Metadata = { title: "Checkout cancelled", robots: { index: false } };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ order?: string }> };

/** The customer backed out of payment. Their cart is untouched, so they can try again. */
export default async function CheckoutCancelledPage({ searchParams }: Props) {
  const { order: orderId } = await searchParams;
  const order = orderId ? await getOrderForViewer(orderId) : null;
  if (!order) notFound();
  if (order.status === "PENDING") await abandonCheckout(order.id, order.stripeCheckoutId);
  else if (order.status !== "CANCELLED") redirect(`/checkout/success?order=${order.id}`);

  return (
    <div className="container-page max-w-3xl py-12 md:py-20">
      <p className="label-mono text-forest">Order {orderNumber(order.id)}</p>
      <h1 className="display mt-4 text-[clamp(44px,7vw,84px)]">
        Checkout <em>cancelled</em>.
      </h1>
      <p role="status" className="mt-6 max-w-xl text-muted">
        Nothing was charged and your cart is still here. Pick up where you left off whenever you like.
      </p>
      <div className="mt-10 flex flex-wrap gap-3">
        <Button asChild size="lg" variant="forest">
          <Link href="/collections/mens-footwear">Keep browsing</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/">Back to the home page</Link>
        </Button>
      </div>
    </div>
  );
}
