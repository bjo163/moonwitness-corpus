import type { Metadata, Viewport } from "next"

import "./globals.css"

export const metadata: Metadata = {
  title: "RGBL — Trace the Text",
  description:
    "RGBL — provenance-first scripture and revelation reference intelligence with exact text identity, rights, evidence and source trace.",
  icons: {
    icon: "https://raw.githubusercontent.com/bjo163/rocksoul-assets/4050b6b5ea88f187a31a304bf978abfe637db9ce/moonwitness/brand/favicon.svg",
  },
  openGraph: {
    title: "RGBL — Trace the Text",
    description: "Work → expression → edition → artifact → passage → content → provenance.",
  },
}

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  colorScheme: "dark light",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
