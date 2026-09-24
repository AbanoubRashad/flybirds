import Link from "next/link";
export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-6 py-32 text-center">
      <p className="label-mono text-forest-500">404 / Off-trail</p>
      <h1 className="mt-3 text-4xl font-semibold">This path doesn&apos;t go anywhere.</h1>
      <Link href="/" className="label-mono mt-8 inline-block underline underline-offset-4">Back to base camp</Link>
    </div>
  );
}
