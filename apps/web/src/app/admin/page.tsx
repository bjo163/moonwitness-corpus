"use client"

import { useEffect, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { activeUsername, DEFAULT_CONSOLE_USER, startSession, usesDefaultCredential } from "@/lib/console-session"

/**
 * The console entrance. It is a separate surface from the reader: no corpus
 * search, no marketing copy, just the local gate and the statement of what the
 * console is allowed to do.
 */
export default function ConsoleLoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState(DEFAULT_CONSOLE_USER)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  // Read the credential after hydration: the prerendered HTML cannot know it.
  const [isDefault, setIsDefault] = useState(true)

  useEffect(() => {
    // After hydration: prefill the username this device actually uses, not the shipped default.
    setUsername(activeUsername())
    setIsDefault(usesDefaultCredential())
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setBusy(true)
    try {
      await startSession(username, password)
      router.push("/admin/balance")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The console could not be opened")
    } finally {
      setBusy(false)
    }
  }

  return <main className="grid min-h-svh grid-cols-1 bg-background text-foreground lg:grid-cols-[1.15fr_1fr]">
    <section className="relative hidden flex-col justify-between border-r border-border/60 p-10 lg:flex">
      <div className="flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-sm border border-border/80 font-mono text-[11px] tracking-[0.2em]">MW</span>
        <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted-foreground">MoonWitness · Research console</span>
      </div>
      <div className="max-w-xl space-y-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Working notes, not scripture</p>
        <h1 className="text-4xl font-medium leading-tight">A desk for the middle layer between text and interpretation.</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          The console counts what annotators recorded, keeps every disagreement on the record, and never turns either into a
          verdict on a verse. Sealed exports only: if the index has not been published, the console shows nothing rather than
          drafting something.
        </p>
      </div>
      <dl className="grid grid-cols-2 gap-4 border-t border-border/60 pt-6 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        <div><dt>Layer</dt><dd className="mt-1 text-foreground">Key Witness v0</dd></div>
        <div><dt>Gate</dt><dd className="mt-1 text-foreground">Local device only</dd></div>
        <div><dt>Score</dt><dd className="mt-1 text-foreground">Not exported</dd></div>
        <div><dt>Formats</dt><dd className="mt-1 text-foreground">JSONL · no Parquet</dd></div>
      </dl>
    </section>

    <section className="flex flex-col justify-center px-6 py-12 sm:px-12">
      <div className="mx-auto w-full max-w-sm space-y-8">
        <div className="space-y-2">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Entrance</p>
          <h2 className="text-2xl font-medium">Open the console</h2>
          <p className="text-sm text-muted-foreground">Credentials are held in this browser only. The profile screen changes them.</p>
        </div>
        <form onSubmit={submit} className="space-y-4" aria-label="Console sign in">
          <label className="block text-sm" htmlFor="console-user">Username
            <input id="console-user" name="username" autoComplete="username" spellCheck={false}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 font-mono text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              value={username} onChange={event => setUsername(event.target.value)} required />
          </label>
          <label className="block text-sm" htmlFor="console-password">Password
            <input id="console-password" name="password" type="password" autoComplete="current-password"
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 font-mono text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              value={password} onChange={event => setPassword(event.target.value)} required />
          </label>
          {error && <p role="alert" className="rounded-md border p-3 text-sm">{error}</p>}
          <button type="submit" disabled={busy}
            className="w-full rounded-md border border-foreground/20 bg-foreground px-4 py-2 text-sm font-medium text-background motion-safe:transition-colors hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60">
            {busy ? "Checking…" : "Enter console"}
          </button>
        </form>
        {isDefault && <p className="rounded-md border border-dashed p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
          Shipped default is <span className="text-foreground">admin / admin</span>. Change it in Profile before this device leaves your desk.
        </p>}
        <p className="text-xs leading-relaxed text-muted-foreground">
          This gate separates the reader from the console on one device. It is not server authentication, it protects no corpus
          data, and it grants no editorial authority — the API still serves only sealed, reviewed records.
        </p>
        <a href="/" className="inline-block text-sm underline">← Back to the corpus</a>
      </div>
    </section>
  </main>
}
