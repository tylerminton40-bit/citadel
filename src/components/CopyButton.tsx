"use client"

import { useState } from "react"

export default function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="text-xs px-3 py-1.5 rounded-lg bg-[#FF5C00]/15 text-[#FF5C00] hover:bg-[#FF5C00]/25 transition font-medium"
    >
      {copied ? "Copied!" : label}
    </button>
  )
}