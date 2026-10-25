"use client"

import { useEffect, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import {
  activeUsername, changeCredential, endSession, readSession, usesDefaultCredential, validateNewCredential,
  type ConsoleSession,
} from "@/lib/console-session"

/**
 * The profile screen changes the local console credential and states what that
 * credential is: a hash in this browser, not an account on a server. The default
 * `admin / admin` exists so a fresh clone can be opened at all; it is a starter
 * key, not a security posture.
 */
export default function ProfilePage() {
  const router = useRouter()
  const [session, setSession] = useState<ConsoleSession | null>(null)
  const [isDefault, setIsDefault] = useState(true)
  const [current, setCurrent] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [repeat, setRepeat] = useState("")
  const [error, setError] = useState("")
  const [done, setDone] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const active = readSession()
    setSession(active)
    setUsername(activeUsername())
    setIsDefault(usesDefaultCredential())
  }, [])

  const notices = validateNewCredential(username, password || "placeholder", repeat || "placeholder")

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(""); setDone("")
    setBusy(true)
    try {
      await changeCredential(current, username, password, repeat)
      setDone("Credential replaced in this browser. The next sign-in uses the new username and password.")
      setCurrent(""); setPassword(""); setRepeat("")
      setIsDefault(false)
      // The change rewrote the session identity; show the new one instead of the old name.
      setSession(readSession())
      router.refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The credential could not be changed")
    } finally {
      setBusy(false)
    }
  }

  return <div className="space-y-6">
    <header className="space-y-2">
      <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Profile</p>
      <h1 className="text-2xl font-medium">Credential and gate</h1>
      <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
        One credential per browser. Changing it requires the current password, replaces the stored hash and keeps no history.
      </p>
    </header>

    <dl className="divide-y divide-border/60 rounded-md border">
      {[
        ["signed in as", session?.username ?? "—"],
        ["session started", session ? new Date(session.startedAt).toLocaleString() : "—"],
        ["session expires", session ? new Date(session.expiresAt).toLocaleString() : "—"],
        ["credential state", isDefault ? "shipped default (admin / admin)" : "changed on this device"],
      ].map(([label, value]) => <div key={label} className="grid gap-1 p-3 sm:grid-cols-[minmax(9rem,14rem)_1fr]">
        <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</dt>
        <dd className="font-mono text-xs">{value}</dd>
      </div>)}
    </dl>

    {isDefault && <p className="rounded-md border border-dashed p-3 text-xs leading-relaxed">
      This console is still using the shipped <span className="font-mono">admin / admin</span>. Replace it before the device leaves
      your desk: the default is published in this repository and is not a secret.
    </p>}

    <section className="rounded-md border p-4" aria-labelledby="profile-change">
      <h2 id="profile-change" className="text-sm font-medium">Replace the credential</h2>
      <form onSubmit={submit} className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm sm:col-span-2" htmlFor="profile-current">Current password
          <input id="profile-current" type="password" autoComplete="current-password" value={current}
            onChange={event => setCurrent(event.target.value)} required
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 font-mono text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2" />
        </label>
        <label className="block text-sm" htmlFor="profile-username">New username
          <input id="profile-username" autoComplete="username" spellCheck={false} value={username}
            onChange={event => setUsername(event.target.value)} required
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 font-mono text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2" />
        </label>
        <label className="block text-sm" htmlFor="profile-password">New password
          <input id="profile-password" type="password" autoComplete="new-password" value={password}
            onChange={event => setPassword(event.target.value)} required
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 font-mono text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2" />
        </label>
        <label className="block text-sm sm:col-span-2" htmlFor="profile-repeat">Repeat new password
          <input id="profile-repeat" type="password" autoComplete="new-password" value={repeat}
            onChange={event => setRepeat(event.target.value)} required
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 font-mono text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2" />
        </label>
        <div className="sm:col-span-2 space-y-2">
          {(password || repeat) && notices.length > 0 && <ul className="list-inside list-disc text-xs text-muted-foreground">
            {notices.map(notice => <li key={notice}>{notice}</li>)}
          </ul>}
          {error && <p role="alert" className="rounded-md border p-3 text-sm">{error}</p>}
          {done && <p role="status" className="rounded-md border p-3 text-sm">{done}</p>}
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={busy}
              className="rounded-md border border-foreground/20 bg-foreground px-4 py-2 text-sm font-medium text-background motion-safe:transition-colors hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60">
              {busy ? "Replacing…" : "Replace credential"}
            </button>
            <button type="button" onClick={() => { endSession(); router.push("/admin") }}
              className="rounded-md border px-4 py-2 text-sm motion-safe:transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2">
              Sign out
            </button>
          </div>
        </div>
      </form>
    </section>

    <section className="rounded-md border border-dashed p-4" aria-labelledby="profile-limit">
      <h2 id="profile-limit" className="text-sm font-medium">What this credential is not</h2>
      <ul className="mt-2 list-inside list-disc space-y-1 text-xs leading-relaxed text-muted-foreground">
        <li>Not server authentication: the check runs in this browser against a salted SHA-256 hash in localStorage.</li>
        <li>Not portable: another browser, profile or device starts at the shipped default again.</li>
        <li>Not editorial authority: publishing a reviewed record still requires the sealed index and human review.</li>
        <li>Not protection: anyone who can read this browser profile can clear or replace it.</li>
      </ul>
    </section>
  </div>
}
