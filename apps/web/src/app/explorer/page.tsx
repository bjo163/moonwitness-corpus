"use client"

import dynamic from "next/dynamic"

const CorpusApp = dynamic(() => import("@/corpus-app"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-svh items-center justify-center bg-background text-sm text-muted-foreground">
      Loading corpus…
    </div>
  ),
})

/**
 * The corpus workspace moved off `/` when the landing page took that route. The
 * application itself is unchanged: still browser-only, still reading the same
 * generated catalog and browser database.
 */
export default function ExplorerPage() {
  return <CorpusApp />
}
