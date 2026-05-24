'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Transaction {
  id: number
  amount: number
  description: string
  type: string
  created_at: string
}

interface AppData {
  balance: number
  transactions: Transaction[]
  settings: {
    child_name: string
    weekly_amount: number
    topup_day: number
    last_topup_date: string
    has_pin: boolean
  }
}

function daysUntilTopup(topupDay: number, lastTopupDate: string): number {
  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]
  const currentDay = now.getUTCDay()

  let diff = (topupDay - currentDay + 7) % 7
  // If today is the day but already topped up, next one is in 7 days
  if (diff === 0 && lastTopupDate === todayStr) diff = 7
  return diff
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + (dateStr.includes('T') ? '' : 'Z'))
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / 86_400_000)
  if (diffDays === 0) return 'Idag'
  if (diffDays === 1) return 'Igår'
  if (diffDays < 7) return `${diffDays} dagar sedan`
  return date.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })
}

function txIcon(type: string, amount: number) {
  if (type === 'topup') return '🎁'
  if (amount > 0) return '💰'
  return '🛍️'
}

export default function Home() {
  const [data, setData] = useState<AppData | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/balance')
      .then((r) => r.json())
      .then(setData)
  }, [])

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-400 to-teal-600 flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">Laddar…</div>
      </div>
    )
  }

  const days = daysUntilTopup(data.settings.topup_day, data.settings.last_topup_date)
  const countdownText =
    days === 0
      ? '🎉 Veckopeng idag!'
      : days === 1
      ? '⏰ Veckopeng imorgon!'
      : `📅 Veckopeng om ${days} dagar`

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-400 to-teal-600 flex flex-col items-center px-4 pt-14 pb-10">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-7xl mb-2 drop-shadow">🐷</div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight">Veckis</h1>
        <p className="text-emerald-100 mt-1 text-base">
          {data.settings.child_name}s pengar
        </p>
      </div>

      {/* Balance card */}
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl px-8 py-8 mb-6 text-center">
        <p className="text-gray-400 text-sm uppercase tracking-widest mb-1">Saldo</p>
        <div className="flex items-end justify-center gap-2 mb-4">
          <span className="text-7xl font-black text-emerald-600 leading-none tabular-nums">
            {data.balance}
          </span>
          <span className="text-3xl font-bold text-emerald-400 mb-2">kr</span>
        </div>
        <div className="bg-emerald-50 rounded-2xl py-3 px-4">
          <p className="text-emerald-700 font-medium text-sm">{countdownText}</p>
          <p className="text-emerald-500 text-xs mt-0.5">
            {data.settings.weekly_amount} kr / vecka
          </p>
        </div>
      </div>

      {/* Transactions */}
      <div className="w-full max-w-sm">
        <h2 className="text-white font-semibold mb-3 px-1 text-sm uppercase tracking-wide opacity-80">
          Senaste händelser
        </h2>
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          {data.transactions.length === 0 ? (
            <p className="text-gray-400 text-center py-10 text-sm">Inga händelser ännu</p>
          ) : (
            data.transactions.map((t, i) => (
              <div
                key={t.id}
                className={`flex items-center px-4 py-3.5 ${
                  i > 0 ? 'border-t border-gray-50' : ''
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-xl mr-3 flex-shrink-0 ${
                    t.amount > 0 ? 'bg-emerald-50' : 'bg-rose-50'
                  }`}
                >
                  {txIcon(t.type, t.amount)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 text-sm truncate">
                    {t.description}
                  </p>
                  <p className="text-gray-400 text-xs mt-0.5">{formatDate(t.created_at)}</p>
                </div>
                <span
                  className={`font-bold ml-3 text-sm tabular-nums flex-shrink-0 ${
                    t.amount > 0 ? 'text-emerald-600' : 'text-rose-500'
                  }`}
                >
                  {t.amount > 0 ? '+' : ''}
                  {t.amount} kr
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Parent link */}
      <button
        onClick={() => router.push('/parent')}
        className="mt-10 text-emerald-200 text-xs opacity-40 hover:opacity-80 transition-opacity active:opacity-100"
      >
        🔒 Föräldravy
      </button>
    </div>
  )
}
