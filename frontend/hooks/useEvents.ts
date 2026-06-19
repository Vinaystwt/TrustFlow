'use client'

import { useEffect, useState } from 'react'
import { usePublicClient } from 'wagmi'
import { decodeEventLog, type Address, type Hash } from 'viem'
import { TRUSTFLOW_ABI } from '@/lib/contracts'
import { useContracts } from '@/lib/useContracts'

export interface ProtocolEvent {
  eventName: string
  args: Record<string, unknown>
  blockNumber: bigint
  txHash: Hash
  logIndex: number
}

async function fetchLogs(
  client: ReturnType<typeof usePublicClient>,
  contractAddress: Address
): Promise<ProtocolEvent[]> {
  if (!client) return []
  const latest = await client.getBlockNumber()
  // Try full range first; fall back to a recent window if RPC rejects it.
  const ranges: { from: bigint; to: bigint }[] = [
    { from: 0n, to: latest },
    { from: latest > 50_000n ? latest - 50_000n : 0n, to: latest },
    { from: latest > 5_000n ? latest - 5_000n : 0n, to: latest },
  ]

  for (const range of ranges) {
    try {
      const logs = await client.getLogs({
        address: contractAddress,
        fromBlock: range.from,
        toBlock: range.to,
      })
      const parsed: ProtocolEvent[] = []
      for (const log of logs) {
        try {
          const decoded = decodeEventLog({
            abi: TRUSTFLOW_ABI,
            data: log.data,
            topics: log.topics,
          })
          parsed.push({
            eventName: decoded.eventName,
            args: (decoded.args as Record<string, unknown>) ?? {},
            blockNumber: log.blockNumber ?? 0n,
            txHash: log.transactionHash ?? ('0x' as Hash),
            logIndex: log.logIndex ?? 0,
          })
        } catch {
          /* unknown log */
        }
      }
      parsed.sort((a, b) =>
        a.blockNumber === b.blockNumber
          ? b.logIndex - a.logIndex
          : Number(b.blockNumber - a.blockNumber)
      )
      return parsed
    } catch {
      /* try next range */
    }
  }
  return []
}

export function useProtocolEvents(refetchMs?: number) {
  const { trustFlowAddress, chainId } = useContracts()
  const client = usePublicClient({ chainId })
  const [events, setEvents] = useState<ProtocolEvent[]>([])
  const [isLoading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    setEvents([])
    const run = async () => {
      const data = await fetchLogs(client, trustFlowAddress)
      if (active) {
        setEvents(data)
        setLoading(false)
      }
    }
    run()
    let timer: ReturnType<typeof setInterval> | undefined
    if (refetchMs) timer = setInterval(run, refetchMs)
    return () => {
      active = false
      if (timer) clearInterval(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, refetchMs, trustFlowAddress, chainId])

  return { events, isLoading }
}

/** Collect unique user addresses that appear in trust/agreement events. */
export function uniqueUsers(events: ProtocolEvent[]): Address[] {
  const set = new Set<string>()
  for (const e of events) {
    const a = e.args as Record<string, unknown>
    for (const key of ['user', 'creator', 'client', 'recipient']) {
      const v = a[key]
      if (typeof v === 'string' && v.startsWith('0x') && v.length === 42) {
        set.add(v.toLowerCase())
      }
    }
  }
  return Array.from(set) as Address[]
}
