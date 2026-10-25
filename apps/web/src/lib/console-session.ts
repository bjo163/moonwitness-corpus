/**
 * Local console gate for the static build.
 *
 * This is deliberately *not* presented as authentication. The web app is a static
 * export with no server, so there is nobody to authenticate against: the check
 * runs in the browser, against a hash kept in this browser's localStorage. It
 * separates the reader surface from the research console on a shared laptop and
 * nothing more. It does not protect data from anyone holding this device, and it
 * grants no editorial authority — the API still refuses to serve anything that is
 * not sealed and reviewed.
 */
export const CONSOLE_CREDENTIAL_KEY = "mw.console.credential.v1"
export const CONSOLE_SESSION_KEY = "mw.console.session.v1"
/** Fired after any credential or session write, so the shell and forms re-read state. */
export const CONSOLE_CHANGE_EVENT = "mw:console-change"
export const DEFAULT_CONSOLE_USER = "admin"
const DEFAULT_CONSOLE_PASSWORD = "admin"
const SESSION_HOURS = 8
const CREDENTIAL_SALT = "mw:console:v1:"

export type ConsoleCredential = {username: string; hash: string; updatedAt: string}
export type ConsoleSession = {username: string; startedAt: string; expiresAt: string}

const digest = async (username: string, password: string): Promise<string> => {
  if (typeof crypto === "undefined" || !crypto.subtle) {
    throw new Error("This browser cannot hash the console credential, so the console stays locked")
  }
  const bytes = new TextEncoder().encode(CREDENTIAL_SALT + username.trim().toLowerCase() + ":" + password)
  const hash = await crypto.subtle.digest("SHA-256", bytes)
  return [...new Uint8Array(hash)].map(byte => byte.toString(16).padStart(2, "0")).join("")
}

const readJson = <T,>(key: string): T | null => {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch { return null }
}

export function readCredential(): ConsoleCredential | null {
  const stored = readJson<ConsoleCredential>(CONSOLE_CREDENTIAL_KEY)
  if (!stored || typeof stored.username !== "string" || typeof stored.hash !== "string") return null
  return stored
}

/** True while the console still uses the shipped default, which the profile warns about. */
export function usesDefaultCredential(): boolean {
  // A stored credential is one somebody deliberately set, whatever the username.
  return readCredential() === null
}

/** Subscribe to credential/session writes so a shell never shows a stale identity. */
export function consoleChanged(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {}
  window.addEventListener(CONSOLE_CHANGE_EVENT, listener)
  return () => window.removeEventListener(CONSOLE_CHANGE_EVENT, listener)
}

export async function verifyCredential(username: string, password: string): Promise<boolean> {
  const stored = readCredential()
  const expectedUser = stored?.username ?? DEFAULT_CONSOLE_USER
  if (username.trim().toLowerCase() !== expectedUser.trim().toLowerCase()) return false
  const expectedHash = stored?.hash ?? await digest(DEFAULT_CONSOLE_USER, DEFAULT_CONSOLE_PASSWORD)
  return (await digest(expectedUser, password)) === expectedHash
}

export function readSession(): ConsoleSession | null {
  if (typeof window === "undefined") return null
  let stored: ConsoleSession | null = null
  try {
    const raw = window.sessionStorage.getItem(CONSOLE_SESSION_KEY)
    stored = raw ? (JSON.parse(raw) as ConsoleSession) : null
  } catch { return null }
  if (!stored || typeof stored.expiresAt !== "string") return null
  // An expired session is no session, rather than a session with a stale claim.
  if (Date.parse(stored.expiresAt) <= Date.now()) { endSession(); return null }
  return stored
}

export async function startSession(username: string, password: string): Promise<ConsoleSession> {
  if (!(await verifyCredential(username, password))) throw new Error("That username and password do not match this console")
  const startedAt = new Date()
  const session: ConsoleSession = {
    username: readCredential()?.username ?? DEFAULT_CONSOLE_USER,
    startedAt: startedAt.toISOString(),
    expiresAt: new Date(startedAt.getTime() + SESSION_HOURS * 60 * 60 * 1000).toISOString(),
  }
  window.sessionStorage.setItem(CONSOLE_SESSION_KEY, JSON.stringify(session))
  window.dispatchEvent(new Event(CONSOLE_CHANGE_EVENT))
  return session
}

export function endSession(): void {
  if (typeof window === "undefined") return
  window.sessionStorage.removeItem(CONSOLE_SESSION_KEY)
  window.dispatchEvent(new Event(CONSOLE_CHANGE_EVENT))
}

export function validateNewCredential(username: string, password: string, repeat: string): string[] {
  const errors: string[] = []
  if (username.trim().length < 3) errors.push("The username needs at least 3 characters")
  if (/\s/.test(username.trim())) errors.push("The username may not contain spaces")
  if (password.length < 6) errors.push("The password needs at least 6 characters")
  if (password !== repeat) errors.push("The two passwords do not match")
  if (password.trim().length === 0) errors.push("The password may not be blank")
  return errors
}

/**
 * Changing the credential requires the current password: a stranger at an
 * unlocked console should not be able to take it over silently. The previous hash
 * is replaced rather than kept, so there is exactly one active credential.
 */
export async function changeCredential(currentPassword: string, username: string, password: string, repeat: string): Promise<void> {
  const active = readCredential()?.username ?? DEFAULT_CONSOLE_USER
  if (!(await verifyCredential(active, currentPassword))) throw new Error("The current password is wrong, so nothing was changed")
  const errors = validateNewCredential(username, password, repeat)
  if (errors.length) throw new Error(errors.join("; "))
  const credential: ConsoleCredential = {
    username: username.trim(),
    hash: await digest(username.trim(), password),
    updatedAt: new Date().toISOString(),
  }
  window.localStorage.setItem(CONSOLE_CREDENTIAL_KEY, JSON.stringify(credential))
  // The session keeps the new username so the shell does not show a stale identity.
  const session = readSession()
  if (session) {
    window.sessionStorage.setItem(CONSOLE_SESSION_KEY, JSON.stringify({...session, username: credential.username}))
  }
  window.dispatchEvent(new Event(CONSOLE_CHANGE_EVENT))
}

/** Local state assumed by credential changes, used by the profile screen. */
export function activeUsername(): string {
  return readSession()?.username ?? readCredential()?.username ?? DEFAULT_CONSOLE_USER
}
