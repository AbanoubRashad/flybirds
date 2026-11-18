"use client";

import { Star } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { submitReview } from "@/server/actions/reviews";

/** Star rating + comment. The server decides whether the reviewer is a verified buyer. */
export function ReviewForm({ productId, productName }: { productId: string; productName: string }) {
  const [state, action, pending] = useActionState(submitReview, null);
  const [rating, setRating] = useState(0);
  const pathname = usePathname();

  if (state?.ok) {
    return (
      <p role="status" className="mt-6 rounded-[20px] bg-forest px-5 py-4 text-bone">
        {state.updated ? "Your review was updated." : "Thanks — your review is live."}{" "}
        {state.verified ? "It carries the verified buyer badge." : "Buy this product to earn the verified buyer badge."}
      </p>
    );
  }

  return (
    <form action={action} className="mt-6 rounded-[20px] p-5 ring-1 ring-inset ring-line sm:p-6">
      <input type="hidden" name="product" value={productId} />
      <fieldset>
        <legend className="label-mono text-muted">Your rating for {productName}</legend>
        <div className="mt-3 flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer rounded-full p-1.5 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-forest">
              <input type="radio" name="rating" value={n} required checked={rating === n} onChange={() => setRating(n)} className="sr-only" />
              <Star className={cn("size-7 stroke-none transition-colors", n <= rating ? "fill-slate" : "fill-slate/15")} aria-hidden />
              <span className="sr-only">{n} star{n === 1 ? "" : "s"}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <label htmlFor="review-comment" className="label-mono mt-5 block text-muted">Your review</label>
      <textarea
        id="review-comment"
        name="comment"
        required
        minLength={10}
        maxLength={1200}
        rows={4}
        placeholder="Fit, comfort, how they held up…"
        className="mt-2 w-full rounded-[14px] bg-bone px-4 py-3 ring-1 ring-inset ring-line-strong placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-forest"
      />
      {state && !state.ok && (
        <p role="alert" className="mt-3 text-sm">
          {state.message}{" "}
          {state.error === "signin" && <Link href={`/sign-in?callbackUrl=${encodeURIComponent(pathname)}`} className="font-semibold underline underline-offset-4">Sign in</Link>}
        </p>
      )}
      <Button type="submit" variant="forest" className="mt-4" disabled={pending}>{pending ? "Posting…" : "Post review"}</Button>
    </form>
  );
}
