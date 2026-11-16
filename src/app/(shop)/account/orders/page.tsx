import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { OrderSummary, StatusPill, orderNumber } from "@/features/checkout/order-summary";
import { getOrdersForUser } from "@/server/queries/orders";

export const metadata: Metadata = { title: "Your orders", robots: { index: false } };

const date = new Intl.DateTimeFormat("en-US", { dateStyle: "long" });

export default async function AccountOrdersPage() {
  const session = await auth();
  if (!session?.user.id) redirect("/sign-in?callbackUrl=/account/orders");
  const orders = await getOrdersForUser(session.user.id);

  return (
    <div className="container-page max-w-4xl py-12 md:py-16">
      <p className="label-mono text-forest">Account</p>
      <h1 className="display mt-4 text-[clamp(44px,6vw,72px)]">Your orders</h1>

      {orders.length === 0 ? (
        <div className="mt-10 rounded-[20px] bg-sand/60 p-8 text-center">
          <p className="text-muted">No orders yet. When you buy something, it shows up here.</p>
          <Button asChild className="mt-5" variant="forest">
            <Link href="/collections/mens-footwear">Start with the bestsellers</Link>
          </Button>
        </div>
      ) : (
        <ul className="mt-10 space-y-8">
          {orders.map((order) => (
            <li key={order.id}>
              <article aria-labelledby={`order-${order.id}`}>
                <header className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <h2 id={`order-${order.id}`} className="font-serif text-2xl">
                    <Link href={`/checkout/success?order=${order.id}`} className="hover:underline hover:underline-offset-4">
                      {orderNumber(order.id)}
                    </Link>
                  </h2>
                  <span className="flex items-center gap-3 text-sm text-muted">
                    <time dateTime={order.createdAt.toISOString()}>{date.format(order.createdAt)}</time>
                    <StatusPill status={order.status} />
                  </span>
                </header>
                <OrderSummary order={order} />
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
