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

export default function Page() {
  return <CorpusApp />
}
