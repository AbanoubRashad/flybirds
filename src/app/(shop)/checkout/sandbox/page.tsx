import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { OrderSummary, orderNumber } from "@/features/checkout/order-summary";
import { submitSandboxPayment } from "@/server/actions/sandbox-payment";
import { getOrderForViewer } from "@/server/queries/orders";
import { stripeMode } from "@/server/stripe";

export const metadata: Metadata = { title: "Checkout (sandbox)", robots: { index: false } };

type Props = { searchParams: Promise<{ order?: string; error?: string }> };

const field = "h-12 w-full rounded-full bg-bone px-5 ring-1 ring-inset ring-line-strong placeholder:text-muted transition-shadow focus:outline-none focus:ring-2 focus:ring-forest";
const label = "label-mono mb-2 block text-muted";

/**
 * Stands in for Stripe's hosted checkout when no Stripe key is configured.
 * Nothing is charged; submitting sends a signed event to the real webhook.
 */
export default async function SandboxCheckoutPage({ searchParams }: Props) {
  if (stripeMode !== "sandbox") notFound();
  const { order: orderId, error } = await searchParams;
  const order = orderId ? await getOrderForViewer(orderId) : null;
  if (!order) notFound();
  if (order.status !== "PENDING") redirect(order.status === "CANCELLED" ? `/checkout/cancelled?order=${order.id}` : `/checkout/success?order=${order.id}`);
  const session = await auth();

  return (
    <div className="container-page max-w-5xl py-12 md:py-16">
      <p role="note" className="label-mono inline-flex rounded-full bg-ember/20 px-4 py-2 text-slate">
        Sandbox checkout · no card is charged
      </p>
      <h1 className="display mt-5 text-[clamp(40px,6vw,68px)]">Pay for order {orderNumber(order.id)}</h1>
      <p className="mt-4 max-w-2xl text-muted">
        This page replaces Stripe&rsquo;s hosted checkout until a Stripe key is added. It sends the same signed
        webhook Stripe would, so the order, the stock and the confirmation behave exactly as in production.
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <form action={submitSandboxPayment} className="space-y-5">
          <input type="hidden" name="order" value={order.id} />
          {error && (
            <p role="alert" className="rounded-[14px] bg-ember/20 px-5 py-4 text-sm">
              {error === "webhook" ? "The payment could not be confirmed. Please try again." : "Please fill in your email, name and shipping address."}
            </p>
          )}
          <div>
            <label htmlFor="sb-email" className={label}>Email for the receipt</label>
            <input id="sb-email" name="email" type="email" autoComplete="email" required defaultValue={session?.user.email ?? order.email} className={field} />
          </div>
          <div>
            <label htmlFor="sb-name" className={label}>Full name</label>
            <input id="sb-name" name="name" autoComplete="name" required defaultValue={session?.user.name ?? ""} className={field} />
          </div>
          <div>
            <label htmlFor="sb-line1" className={label}>Address</label>
            <input id="sb-line1" name="line1" autoComplete="address-line1" required className={field} />
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <label htmlFor="sb-city" className={label}>City</label>
              <input id="sb-city" name="city" autoComplete="address-level2" required className={field} />
            </div>
            <div>
              <label htmlFor="sb-postal" className={label}>Postal code</label>
              <input id="sb-postal" name="postalCode" autoComplete="postal-code" required className={field} />
            </div>
            <div>
              <label htmlFor="sb-country" className={label}>Country</label>
              <select id="sb-country" name="country" autoComplete="country" defaultValue="US" className={field}>
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="GB">United Kingdom</option>
              </select>
            </div>
          </div>
          <div>
            <span className={label}>Card</span>
            <p className="flex h-12 items-center justify-between rounded-full bg-sand/60 px-5 font-mono text-sm text-muted ring-1 ring-inset ring-line">
              <span>4242 4242 4242 4242</span>
              <span>test card</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button type="submit" name="outcome" value="pay" size="lg" variant="forest">Pay now</Button>
            <Button type="submit" name="outcome" value="cancel" size="lg" variant="outline" formNoValidate>Cancel and go back</Button>
          </div>
        </form>

        <aside aria-label="Order summary">
          <OrderSummary order={order} />
        </aside>
      </div>
    </div>
  );
}
