'use client'

import { useEffect, useState } from 'react'
import { Copy, Check } from 'lucide-react'

const LANG_LABEL: Record<string, string> = {
  solidity: 'Solidity',
  typescript: 'TypeScript',
  tsx: 'TypeScript',
  bash: 'Bash',
  json: 'JSON',
}

export function CodeBlock({
  code,
  lang = 'typescript',
}: {
  code: string
  lang?: 'solidity' | 'typescript' | 'tsx' | 'bash' | 'json'
}) {
  const [html, setHtml] = useState<string>('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const { codeToHtml } = await import('shiki')
        const out = await codeToHtml(code.trim(), {
          lang,
          theme: 'github-dark-dimmed',
        })
        if (active) setHtml(out)
      } catch {
        /* fallback to plain pre */
      }
    })()
    return () => {
      active = false
    }
  }, [code, lang])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code.trim())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-bg-elevated">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <span className="font-mono text-xs uppercase tracking-wide text-text-dim">
          {LANG_LABEL[lang] ?? lang}
        </span>
        <button
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-xs text-text-secondary transition-colors hover:text-text"
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <Check size={13} className="text-success" /> Copied!
            </>
          ) : (
            <>
              <Copy size={13} /> Copy
            </>
          )}
        </button>
      </div>
      <div className="overflow-x-auto p-4 text-sm [&_pre]:!bg-transparent [&_pre]:!m-0 [&_code]:font-mono">
        {html ? (
          <div dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <pre className="font-mono text-text-secondary">
            <code>{code.trim()}</code>
          </pre>
        )}
      </div>
    </div>
  )
}
