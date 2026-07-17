"use client";

const PRODUCTS = [
  {
    id: "tee",
    title: "Natal Chart Tee",
    subtitle: "Front wheel · back table",
    tone: "from-[#1a2740] to-[#0b1220]",
  },
  {
    id: "hoodie",
    title: "Cosmic Hoodie",
    subtitle: "Chest print · soft fleece",
    tone: "from-[#241428] to-[#0b1220]",
  },
  {
    id: "crew",
    title: "Birth Map Crewneck",
    subtitle: "Premium midweight",
    tone: "from-[#14243a] to-[#0b1220]",
  },
  {
    id: "poster",
    title: "Chart Poster",
    subtitle: "Museum print · 300 DPI",
    tone: "from-[#1e1830] to-[#0b1220]",
  },
] as const;

/** Landing gallery — professional product mockup cards (placeholders until Printify mocks). */
export function ProductShowcase() {
  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--color-electric-blue)]">
            Print-on-demand catalog
          </p>
          <h2 className="mt-1 text-2xl font-medium text-[var(--color-star)]">
            Your sky, on every product
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-[var(--color-muted)]">
            Example apparel and posters featuring Cosmographic natal designs.
            After you generate your chart, the same layout personalizes the full
            collection automatically.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PRODUCTS.map((p, i) => (
          <article
            key={p.id}
            className="group overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-panel-border)] bg-[rgba(3,7,18,0.45)]"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div
              className={`relative aspect-[4/5] bg-gradient-to-br ${p.tone} p-6`}
            >
              <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_30%_20%,rgba(30,224,255,0.25),transparent_45%),radial-gradient(circle_at_70%_80%,rgba(255,45,149,0.18),transparent_40%)]" />
              <div className="relative mx-auto mt-4 flex h-[72%] w-[78%] items-center justify-center rounded-lg border border-white/10 bg-black/35 shadow-[0_20px_50px_rgba(0,0,0,0.45)] backdrop-blur-[1px]">
                <div className="h-28 w-28 rounded-full border border-[var(--color-electric-blue)]/50 shadow-[0_0_24px_rgba(30,224,255,0.25)]" />
                <div className="absolute inset-[18%] rounded-full border border-[var(--color-neon-pink)]/30" />
                <div className="absolute inset-[32%] rounded-full border border-white/15" />
              </div>
              <p className="absolute bottom-3 left-3 font-mono text-[9px] uppercase tracking-[0.24em] text-[var(--color-muted)]">
                Sample mockup
              </p>
            </div>
            <div className="space-y-1 px-4 py-3">
              <h3 className="text-sm font-medium text-[var(--color-star)]">
                {p.title}
              </h3>
              <p className="text-xs text-[var(--color-muted)]">{p.subtitle}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
