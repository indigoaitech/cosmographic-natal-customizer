"use client";

export type VisualDesignOption = "A" | "B";

type DesignPickerProps = {
  value: VisualDesignOption;
  onChange: (value: VisualDesignOption) => void;
};

const OPTIONS: Array<{
  id: VisualDesignOption;
  title: string;
  subtitle: string;
  badge: string;
}> = [
  {
    id: "A",
    title: "Klasik Astrolabe",
    subtitle:
      "Orijinal vektör harita — eşmerkezli çemberler, burçlar, evler, aspekt ağı",
    badge: "1. seçenek",
  },
  {
    id: "B",
    title: "Cosmographic",
    subtitle:
      "Aynı düz astrolabe — Maya/Aztek taş takvim zemini üzerinde, perspektif yok",
    badge: "2. seçenek",
  },
];

export function DesignPicker({ value, onChange }: DesignPickerProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {OPTIONS.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className="rounded-[var(--radius-md)] border p-4 text-left transition"
            style={{
              borderColor: active
                ? opt.id === "A"
                  ? "var(--color-electric-blue)"
                  : "var(--color-neon-pink)"
                : "var(--color-panel-border)",
              background: active
                ? "rgba(11, 31, 74, 0.75)"
                : "rgba(3, 7, 18, 0.35)",
              boxShadow: active
                ? opt.id === "A"
                  ? "var(--glow-blue)"
                  : "var(--glow-pink)"
                : "none",
            }}
            aria-pressed={active}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--color-muted)]">
              {opt.badge}
            </p>
            <h3
              className="mt-1 text-base font-medium"
              style={{
                color:
                  opt.id === "A"
                    ? "var(--color-electric-blue)"
                    : "var(--color-neon-pink-soft)",
              }}
            >
              {opt.title}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-[var(--color-muted)]">
              {opt.subtitle}
            </p>
          </button>
        );
      })}
    </div>
  );
}
