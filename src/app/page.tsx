import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getCategoryTree } from "@/server/queries/products";

const SHAPE: Record<string, [string, string]> = {
  "mens-footwear": ["runner", "#2B3136"], "womens-footwear": ["sneaker", "#B4532A"], apparel: ["hoodie", "#3E5641"], accessories: ["bag", "#C8B08A"],
};

export default async function Home() {
  const departments = await getCategoryTree();
  return (
    <>
      <section className="relative overflow-hidden bg-slate-950 text-bone-50">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-24 md:grid-cols-2 md:py-32">
          <div>
            <p className="label-mono text-forest-300">FW26 / Field-tested collection</p>
            <h1 className="mt-4 text-5xl font-semibold leading-[1.02] tracking-tight md:text-7xl">Engineered<br />from the ground up.</h1>
            <p className="mt-6 max-w-md text-bone-200">Technical footwear built from merino, eucalyptus and sugarcane — measured by the kilogram of carbon, not the marketing slide.</p>
            <div className="mt-10 flex gap-3">
              <Button variant="signal" size="lg" asChild><Link href="/collections/mens-footwear">Shop men</Link></Button>
              <Button variant="secondary" size="lg" asChild><Link href="/collections/womens-footwear">Shop women</Link></Button>
            </div>
          </div>
          <div className="relative aspect-[4/3]">
            <Image src="/api/visual/runner?hex=%233E5641&angle=3" alt="Tempo Runner 2 in Fern" fill priority className="object-cover" unoptimized />
          </div>
        </div>
        <dl className="mx-auto grid max-w-7xl grid-cols-3 border-t border-bone-50/10 px-6 py-6">
          {[["Avg footprint", "7.2 kg CO₂e"], ["Natural inputs", "78%"], ["Wear-tested", "1,000+ km"]].map(([k, v]) => (
            <div key={k}><dt className="label-mono text-slate-400">{k}</dt><dd className="mt-1 font-mono text-lg">{v}</dd></div>
          ))}
        </dl>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <p className="label-mono text-forest-500">Departments</p>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {departments.map((d) => {
            const [shape, hex] = SHAPE[d.slug] ?? ["sneaker", "#2B3136"];
            return (
              <Link key={d.id} href={`/collections/${d.slug}`} className="group">
                <div className="relative aspect-square overflow-hidden bg-bone-100">
                  <Image src={`/api/visual/${shape}?hex=${encodeURIComponent(hex)}&angle=0`} alt="" fill className="object-cover transition-transform duration-700 ease-out-expo group-hover:scale-105" unoptimized />
                </div>
                <p className="mt-3 font-medium">{d.name}</p>
                <p className="label-mono text-slate-400">{d.children.map((c) => c.name).join(" · ")}</p>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}
