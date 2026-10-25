import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "MoonWitness — Trace the Text",
  description:
    "A provenance-first corpus of scripture and revelation: witness identity, rights, evidence and derived research kept strictly apart.",
}

/**
 * The landing page. It is deliberately static and server-rendered: no corpus
 * query, no client state, no fabricated statistic. Its only job is to route a
 * reader to the right surface and to state the separation the project is built on.
 */
const LANES = [
  {
    index: "01",
    href: "/explorer",
    title: "Corpus explorer",
    detail: "Work → expression → edition → artifact → passage → content, with rights and evidence attached to every lane.",
    action: "Open the explorer",
  },
  {
    index: "02",
    href: "/research/srgbl",
    title: "Five-layer witness",
    detail: "Source trace first. Later stages stay UNKNOWN until a reviewed, evidence-backed analysis exists.",
    action: "Read the research view",
  },
  {
    index: "03",
    href: "/research/key-witness",
    title: "Titik tengah",
    detail: "The derived key, message and boundary for one passage — with the disagreement kept visible, not resolved.",
    action: "Open a key card",
  },
] as const

const PRINCIPLES = [
  ["Text", "What a witness actually says, under its own licence."],
  ["Claim", "What an analysis asserts, with method and evidence."],
  ["Interpretation", "What a frame reads into it — named, scoped, never universal."],
  ["Judgment", "What no surface here issues: no score, no rank, no verdict."],
] as const

export default function LandingPage() {
  return <main className="min-h-svh bg-background text-foreground">
    <header className="border-b border-border/60">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <a href="/" className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-sm border border-border/80 font-mono text-[11px] tracking-[0.2em]">MW</span>
          <span className="space-y-0.5">
            <span className="block text-sm font-medium">MoonWitness</span>
            <span className="block font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Corpus observatory</span>
          </span>
        </a>
        <nav aria-label="Primary" className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          <a href="/explorer" className="hover:text-foreground">Explorer</a>
          <a href="/research/srgbl" className="hover:text-foreground">Research</a>
          <a href="/research/key-witness" className="hover:text-foreground">Key card</a>
          <a href="/admin" className="rounded-sm border px-2 py-1 text-foreground hover:bg-accent">Console</a>
        </nav>
      </div>
    </header>

    <section className="mx-auto max-w-6xl px-6 pb-16 pt-16 sm:pt-24">
      <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted-foreground">Provenance before interpretation</p>
      <h1 className="mt-6 max-w-3xl text-4xl font-medium leading-[1.1] sm:text-6xl">
        Trace the text before you read it.
      </h1>
      <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">
        MoonWitness keeps the witness, the claim, the interpretation and the judgment in separate lanes. Every passage carries its
        edition, artifact, rights and evidence; every derived reading carries its method, its frame and its limit.
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <a href="/explorer" className="rounded-md border border-foreground/20 bg-foreground px-5 py-2.5 text-sm font-medium text-background motion-safe:transition-colors hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2">
          Open the corpus explorer
        </a>
        <a href="/research/srgbl" className="rounded-md border px-5 py-2.5 text-sm font-medium motion-safe:transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2">
          See how a reading is traced
        </a>
      </div>
      <p className="mt-10 border-l-2 border-border pl-4 font-mono text-[11px] uppercase leading-relaxed tracking-[0.16em] text-muted-foreground">
        No global score · no tradition ranking · missing evidence stays UNKNOWN
      </p>
    </section>

    <section className="border-y border-border/60" aria-labelledby="lanes">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <h2 id="lanes" className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Three surfaces</h2>
        <div className="mt-8 grid gap-px overflow-hidden rounded-md border bg-border/60 sm:grid-cols-3">
          {LANES.map(lane => <article key={lane.index} className="flex flex-col justify-between gap-6 bg-background p-6">
            <div className="space-y-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{lane.index}</p>
              <h3 className="text-lg font-medium">{lane.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{lane.detail}</p>
            </div>
            <a href={lane.href} className="font-mono text-[11px] uppercase tracking-[0.16em] underline underline-offset-4">{lane.action} →</a>
          </article>)}
        </div>
      </div>
    </section>

    <section className="mx-auto max-w-6xl px-6 py-14" aria-labelledby="separation">
      <h2 id="separation" className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">What stays separate</h2>
      <dl className="mt-8 divide-y divide-border/60 border-y border-border/60">
        {PRINCIPLES.map(([term, detail]) => <div key={term} className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr] sm:gap-6">
          <dt className="font-mono text-[11px] uppercase tracking-[0.18em]">{term}</dt>
          <dd className="text-sm leading-relaxed text-muted-foreground">{detail}</dd>
        </div>)}
      </dl>
      <div className="mt-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
          The research console is a working desk for sealed derived records: it reports what was published, counts what was
          recorded, and refuses to draft a reading that does not exist.
        </p>
        <a href="/admin" className="rounded-md border px-4 py-2 text-sm font-medium motion-safe:transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2">
          Enter the research console
        </a>
      </div>
    </section>

    <footer className="border-t border-border/60">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-6 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        <p>MoonWitness corpus · provenance-first</p>
        <div className="flex flex-wrap gap-4">
          <a href="/explorer" className="hover:text-foreground">Explorer</a>
          <a href="/research/srgbl" className="hover:text-foreground">Research</a>
          <a href="/research/key-witness" className="hover:text-foreground">Key card</a>
          <a href="https://github.com/bjo163/moonwitness-corpus/blob/dev/docs/KEY-WITNESS-V0.md" className="hover:text-foreground">Method</a>
        </div>
      </div>
    </footer>
  </main>
}
