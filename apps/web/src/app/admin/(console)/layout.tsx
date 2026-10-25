"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { consoleChanged, endSession, readSession, usesDefaultCredential, type ConsoleSession } from "@/lib/console-session"

/**
 * The console shell. It is intentionally a different surface from the reader
 * home: a narrow rail, mono data labels, hairline rules and a ledger rhythm
 * instead of a grid of decorative statistics cards.
 */
const NAV = [
  {href: "/admin/ledger", index: "01", label: "Sealed ledger", short: "Ledger", hint: "what is published"},
  {href: "/admin/balance", index: "02", label: "Key balance", short: "Balance", hint: "counts, never a verdict"},
  {href: "/admin/spectrum", index: "03", label: "Key spectrum", short: "Spectrum", hint: "filter the spread"},
  {href: "/admin/disagreement", index: "04", label: "Disagreement", short: "Disagree", hint: "alternate assessments"},
  {href: "/admin/profile", index: "05", label: "Profile", short: "Profile", hint: "credential and gate"},
] as const

export default function ConsoleLayout({children}:{children:React.ReactNode}) {
  const pathname = usePathname()
  const router = useRouter()
  // `undefined` means "not read yet", which is not the same as "signed out".
  const [session, setSession] = useState<ConsoleSession | null | undefined>(undefined)
  const [isDefault, setIsDefault] = useState(false)

  useEffect(() => {
    const reread = () => { setSession(readSession()); setIsDefault(usesDefaultCredential()) }
    reread()
    // A credential change happens in a child screen; the shell must not keep a stale identity.
    return consoleChanged(reread)
  }, [pathname])

  if (session === undefined) {
    return <main className="grid min-h-svh place-items-center bg-background text-foreground">
      <p role="status" className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Reading console state…</p>
    </main>
  }

  if (session === null) {
    return <main className="grid min-h-svh place-items-center bg-background px-6 text-foreground">
      <div className="w-full max-w-md space-y-4 rounded-md border p-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Console locked</p>
        <h1 className="text-2xl font-medium">This desk has no open session</h1>
        <p className="text-sm text-muted-foreground">Open the console entrance to start a session in this browser. Sessions end after eight hours or when you sign out.</p>
        <a href="/admin" className="inline-block rounded-md border px-4 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2">Go to the entrance</a>
      </div>
    </main>
  }

  const signOut = () => { endSession(); router.push("/admin") }
  return <div className="min-h-svh bg-background text-foreground">
    <div className="mx-auto flex min-h-svh max-w-[1680px]">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border/60 md:flex">
        <div className="border-b border-border/60 px-5 py-5">
          <a href="/" className="flex items-center gap-3">
            <span className="grid size-8 place-items-center rounded-sm border border-border/80 font-mono text-[10px] tracking-[0.16em]">MW</span>
            <span className="space-y-0.5">
              <span className="block text-sm font-medium">Research console</span>
              <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Key Witness v0</span>
            </span>
          </a>
        </div>
        <nav aria-label="Console sections" className="flex-1 py-3">
          {NAV.map(item => {
            const active = pathname === item.href
            return <a key={item.href} href={item.href} aria-current={active ? "page" : undefined}
              className={"flex items-baseline gap-3 border-l-2 px-5 py-3 text-sm motion-safe:transition-colors " +
                (active ? "border-foreground bg-accent/40 text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>
              <span className="font-mono text-[10px] tracking-[0.16em]">{item.index}</span>
              <span className="space-y-0.5">
                <span className="block">{item.label}</span>
                <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{item.hint}</span>
              </span>
            </a>
          })}
        </nav>
        <div className="space-y-3 border-t border-border/60 px-5 py-4">
          <div className="space-y-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Signed in</p>
            <p className="font-mono text-xs">{session.username}</p>
            <p className="text-[11px] text-muted-foreground">Session ends {new Date(session.expiresAt).toLocaleTimeString()}</p>
          </div>
          {isDefault && <p className="rounded-sm border border-dashed p-2 font-mono text-[10px] leading-relaxed text-muted-foreground">Default credential in use. Change it in Profile.</p>}
          <button type="button" onClick={signOut} className="w-full rounded-md border px-3 py-1.5 text-left text-xs motion-safe:transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2">Sign out</button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur md:px-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            workspace<span className="px-2 text-border">/</span><span className="text-foreground">{pathname.replace("/admin/", "") || "console"}</span>
          </p>
          <div className="flex items-center gap-2">
            <span className="rounded-sm border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Local gate · not server auth</span>
            <a href="/" className="rounded-sm border px-2 py-0.5 text-[11px] hover:bg-accent">Reader view</a>
          </div>
          <nav aria-label="Console sections" className="flex w-full gap-1 md:hidden">
            {NAV.map(item => <a key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined}
              className={"flex-1 rounded-sm border px-2 py-1 text-center font-mono text-[10px] uppercase tracking-[0.12em] " +
                (pathname === item.href ? "bg-accent text-foreground" : "text-muted-foreground")}>{item.short}</a>)}
          </nav>
        </header>
        <main className="min-w-0 flex-1 px-4 py-6 md:px-8">{children}</main>
        <footer className="border-t border-border/60 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground md:px-8">
          Counts of recorded research only · no score is exported · disagreement stays visible
        </footer>
      </div>
    </div>
  </div>
}
