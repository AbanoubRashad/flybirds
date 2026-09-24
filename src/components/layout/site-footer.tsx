export function SiteFooter() {
  return (
    <footer className="mt-24 bg-slate-950 text-bone-200">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="text-2xl font-semibold text-bone-50">Built for the long way round.</p>
          <p className="label-mono mt-4 text-slate-400">Flybirds is a portfolio project. No real orders are fulfilled.</p>
        </div>
        {[["Shop", ["Men", "Women", "Apparel", "Gear"]], ["Company", ["Materials", "Carbon report", "Careers"]]].map(([h, items]) => (
          <div key={h as string}>
            <p className="label-mono text-slate-400">{h as string}</p>
            <ul className="mt-4 space-y-2 text-sm">{(items as string[]).map((i) => <li key={i}>{i}</li>)}</ul>
          </div>
        ))}
      </div>
    </footer>
  );
}
