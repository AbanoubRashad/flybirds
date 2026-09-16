const MESSAGES = ["Free shipping over $75", "30-day wear test", "Carbon footprint printed on every box"];

/** Pure-CSS marquee: two identical tracks translate -50% on a loop, so there's no seam. */
export function AnnouncementBar() {
  const track = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {[...MESSAGES, ...MESSAGES].map((m, i) => (
        <li key={i} className="label-mono flex items-center whitespace-nowrap px-6 text-bone/85">
          {m}
          <span className="ml-12 text-sage" aria-hidden>·</span>
        </li>
      ))}
    </ul>
  );
  return (
    <div className="on-dark overflow-hidden bg-slate py-2.5">
      <p className="sr-only">{MESSAGES.join(" · ")}</p>
      <div className="flex w-max animate-marquee motion-reduce:animate-none" aria-hidden>
        {track(false)}
        {track(true)}
      </div>
    </div>
  );
}
