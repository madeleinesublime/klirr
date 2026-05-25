'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Stage = 'loading' | 'setup' | 'pin' | 'dashboard'

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

const DAYS = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag']

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + (dateStr.includes('T') ? '' : 'Z'))
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86_400_000)
  if (diffDays === 0) return 'Idag'
  if (diffDays === 1) return 'Igår'
  if (diffDays < 7) return `${diffDays} dagar sedan`
  return date.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })
}

// ── Small reusable components ──────────────────────────────────────────────

function InputField({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
      <input
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
        {...props}
      />
    </div>
  )
}

function Btn({
  children,
  variant = 'primary',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'danger' | 'ghost'
}) {
  const base = 'w-full font-semibold py-3.5 rounded-xl transition-colors active:scale-[0.98] text-base'
  const styles = {
    primary: 'bg-emerald-500 text-white hover:bg-emerald-600',
    danger: 'bg-rose-500 text-white hover:bg-rose-600',
    ghost: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
  }
  return (
    <button className={`${base} ${styles[variant]}`} {...props}>
      {children}
    </button>
  )
}

function ErrorMsg({ msg }: { msg: string }) {
  if (!msg) return null
  return <p className="text-rose-500 text-sm text-center">{msg}</p>
}

// ── Setup screen (first-time) ───────────────────────────────────────────────

function SetupScreen({
  onDone,
}: {
  onDone: (pin: string) => void
}) {
  const [childName, setChildName] = useState('')
  const [weeklyAmount, setWeeklyAmount] = useState('50')
  const [topupDay, setTopupDay] = useState('6')
  const [pin1, setPin1] = useState('')
  const [pin2, setPin2] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!childName.trim()) { setError('Ange barnets namn'); return }
    if (pin1.length < 4) { setError('PIN måste vara minst 4 siffror'); return }
    if (pin1 !== pin2) { setError('PINkoderna matchar inte'); return }

    setLoading(true)
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        setup: true,
        new_pin: pin1,
        child_name: childName.trim(),
        weekly_amount: parseInt(weeklyAmount) || 50,
        topup_day: parseInt(topupDay),
      }),
    })
    setLoading(false)

    if (res.ok) {
      onDone(pin1)
    } else {
      setError('Något gick fel, försök igen')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8">
        <div className="text-center mb-7">
          <div className="text-6xl mb-3">🐷</div>
          <h1 className="text-2xl font-bold text-gray-800">Välkommen till Klirr!</h1>
          <p className="text-gray-500 text-sm mt-1">Ställ in appen första gången</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField
            label="Barnets namn"
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            placeholder="T.ex. Lina"
            required
          />

          <InputField
            label="Veckopeng (kr)"
            type="number"
            min="1"
            value={weeklyAmount}
            onChange={(e) => setWeeklyAmount(e.target.value)}
            placeholder="50"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Utbetalningsdag
            </label>
            <select
              value={topupDay}
              onChange={(e) => setTopupDay(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
            >
              {DAYS.map((d, i) => (
                <option key={i} value={i}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <InputField
            label="Välj PIN-kod (minst 4 siffror)"
            type="password"
            inputMode="numeric"
            value={pin1}
            onChange={(e) => setPin1(e.target.value)}
            placeholder="••••"
            required
          />

          <InputField
            label="Upprepa PIN-kod"
            type="password"
            inputMode="numeric"
            value={pin2}
            onChange={(e) => setPin2(e.target.value)}
            placeholder="••••"
            required
          />

          <ErrorMsg msg={error} />

          <Btn type="submit" disabled={loading}>
            {loading ? 'Sparar…' : 'Sätt igång 🚀'}
          </Btn>
        </form>
      </div>
    </div>
  )
}

// ── PIN entry screen ────────────────────────────────────────────────────────

function PinScreen({
  onSuccess,
  onBack,
}: {
  onSuccess: (pin: string) => void
  onBack: () => void
}) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    })
    setLoading(false)
    if (res.ok) {
      onSuccess(pin)
    } else {
      setError('Fel PIN-kod, försök igen')
      setPin('')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8">
        <button
          onClick={onBack}
          className="text-gray-400 text-sm mb-6 flex items-center gap-1 hover:text-gray-600 transition-colors"
        >
          ← Tillbaka
        </button>

        <div className="text-center mb-7">
          <div className="text-5xl mb-3">🔒</div>
          <h1 className="text-xl font-bold text-gray-800">Föräldravy</h1>
          <p className="text-gray-500 text-sm mt-1">Ange din PIN-kod</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-4 text-center text-3xl tracking-[0.5em] text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            placeholder="••••"
            autoFocus
            required
          />
          <ErrorMsg msg={error} />
          <Btn type="submit" disabled={loading}>
            {loading ? 'Kontrollerar…' : 'Logga in'}
          </Btn>
        </form>
      </div>
    </div>
  )
}

// ── Dashboard ───────────────────────────────────────────────────────────────

function Dashboard({
  data,
  sessionPin,
  onRefresh,
  onBack,
}: {
  data: AppData
  sessionPin: string
  onRefresh: () => Promise<void>
  onBack: () => void
}) {
  const [addAmount, setAddAmount] = useState('')
  const [addDesc, setAddDesc] = useState('')
  const [deductAmount, setDeductAmount] = useState('')
  const [deductDesc, setDeductDesc] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // Settings form state
  const [childName, setChildName] = useState(data.settings.child_name)
  const [weeklyAmount, setWeeklyAmount] = useState(String(data.settings.weekly_amount))
  const [topupDay, setTopupDay] = useState(String(data.settings.topup_day))
  const [newPin, setNewPin] = useState('')
  const [newPin2, setNewPin2] = useState('')

  function notify(msg: string, isError = false) {
    if (isError) { setError(msg); setSuccess('') }
    else { setSuccess(msg); setError('') }
    setTimeout(() => { setError(''); setSuccess('') }, 3000)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const amount = parseInt(addAmount)
    if (!amount || amount <= 0) { notify('Ange ett giltigt belopp', true); return }
    setLoading(true)
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pin: sessionPin,
        amount,
        description: addDesc.trim() || 'Insättning',
        type: 'credit',
      }),
    })
    setLoading(false)
    if (res.ok) {
      setAddAmount(''); setAddDesc('')
      notify(`+${amount} kr tillagt ✓`)
      await onRefresh()
    } else {
      notify('Kunde inte lägga till pengar', true)
    }
  }

  async function handleDeduct(e: React.FormEvent) {
    e.preventDefault()
    const amount = parseInt(deductAmount)
    if (!amount || amount <= 0) { notify('Ange ett giltigt belopp', true); return }
    if (amount > data.balance) { notify('Inte tillräckligt med pengar på kontot', true); return }
    setLoading(true)
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pin: sessionPin,
        amount: -amount,
        description: deductDesc.trim() || 'Köp',
        type: 'debit',
      }),
    })
    setLoading(false)
    if (res.ok) {
      setDeductAmount(''); setDeductDesc('')
      notify(`-${amount} kr draget ✓`)
      await onRefresh()
    } else {
      notify('Kunde inte dra av pengar', true)
    }
  }

  async function handleTopup() {
    setLoading(true)
    const res = await fetch('/api/topup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: sessionPin }),
    })
    setLoading(false)
    if (res.ok) {
      notify(`🎁 Veckopeng +${data.settings.weekly_amount} kr tillagd!`)
      await onRefresh()
    } else {
      notify('Något gick fel', true)
    }
  }

  async function handleSettingsSave(e: React.FormEvent) {
    e.preventDefault()
    if (newPin && newPin.length < 4) { notify('PIN måste vara minst 4 siffror', true); return }
    if (newPin && newPin !== newPin2) { notify('PINkoderna matchar inte', true); return }

    setLoading(true)
    const body: Record<string, unknown> = {
      pin: sessionPin,
      child_name: childName.trim(),
      weekly_amount: parseInt(weeklyAmount) || 50,
      topup_day: parseInt(topupDay),
    }
    if (newPin) body.new_pin = newPin

    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setLoading(false)
    if (res.ok) {
      setNewPin(''); setNewPin2('')
      setShowSettings(false)
      notify('Inställningar sparade ✓')
      await onRefresh()
    } else {
      notify('Kunde inte spara inställningar', true)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-gray-500 text-sm flex items-center gap-1 hover:text-gray-700 transition-colors"
        >
          ← Barnvy
        </button>
        <h1 className="text-base font-bold text-gray-800">Föräldravy</h1>
        <div className="w-16" />
      </div>

      <div className="max-w-sm mx-auto px-4 pt-6 space-y-4">

        {/* Balance overview */}
        <div className="bg-white rounded-2xl shadow-sm p-5 text-center">
          <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">
            {data.settings.child_name}s saldo
          </p>
          <div className="flex items-end justify-center gap-1.5">
            <span className="text-5xl font-black text-emerald-600 tabular-nums">
              {data.balance}
            </span>
            <span className="text-2xl font-bold text-emerald-400 mb-1">kr</span>
          </div>
        </div>

        {/* Notification bar */}
        {(error || success) && (
          <div
            className={`rounded-xl px-4 py-3 text-sm font-medium text-center ${
              error ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-700'
            }`}
          >
            {error || success}
          </div>
        )}

        {/* Add money */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-semibold text-gray-700 mb-3 text-sm">Ge pengar</h2>
          <form onSubmit={handleAdd} className="space-y-3">
            <input
              type="number"
              min="1"
              value={addAmount}
              onChange={(e) => setAddAmount(e.target.value)}
              placeholder="Belopp (kr)"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm"
              required
            />
            <input
              type="text"
              value={addDesc}
              onChange={(e) => setAddDesc(e.target.value)}
              placeholder="Beskrivning (valfri)"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 text-white font-semibold py-3 rounded-xl hover:bg-emerald-600 active:bg-emerald-700 transition-colors text-sm disabled:opacity-60"
            >
              + Ge pengar
            </button>
          </form>
        </div>

        {/* Deduct money */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-semibold text-gray-700 mb-3 text-sm">Dra av pengar (köp)</h2>
          <form onSubmit={handleDeduct} className="space-y-3">
            <input
              type="number"
              min="1"
              value={deductAmount}
              onChange={(e) => setDeductAmount(e.target.value)}
              placeholder="Belopp (kr)"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm"
              required
            />
            <input
              type="text"
              value={deductDesc}
              onChange={(e) => setDeductDesc(e.target.value)}
              placeholder="Vad köptes?"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-rose-500 text-white font-semibold py-3 rounded-xl hover:bg-rose-600 active:bg-rose-700 transition-colors text-sm disabled:opacity-60"
            >
              − Dra av pengar
            </button>
          </form>
        </div>

        {/* Manual topup */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-semibold text-gray-700 mb-1 text-sm">Manuell veckopeng</h2>
          <p className="text-gray-400 text-xs mb-3">
            Ge {data.settings.weekly_amount} kr nu utan att vänta på schemalagd dag
          </p>
          <button
            onClick={handleTopup}
            disabled={loading}
            className="w-full bg-amber-400 text-white font-semibold py-3 rounded-xl hover:bg-amber-500 active:bg-amber-600 transition-colors text-sm disabled:opacity-60"
          >
            🎁 Ge veckopeng nu ({data.settings.weekly_amount} kr)
          </button>
        </div>

        {/* Transaction history */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 pt-4 pb-2">
            <h2 className="font-semibold text-gray-700 text-sm">Transaktionshistorik</h2>
          </div>
          {data.transactions.length === 0 ? (
            <p className="text-gray-400 text-center py-8 text-sm">Inga transaktioner ännu</p>
          ) : (
            data.transactions.map((t, i) => (
              <div
                key={t.id}
                className={`flex items-center px-5 py-3 ${i > 0 ? 'border-t border-gray-50' : ''}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 truncate">{t.description}</p>
                  <p className="text-xs text-gray-400">{formatDate(t.created_at)}</p>
                </div>
                <span
                  className={`text-sm font-bold ml-3 tabular-nums flex-shrink-0 ${
                    t.amount > 0 ? 'text-emerald-600' : 'text-rose-500'
                  }`}
                >
                  {t.amount > 0 ? '+' : ''}{t.amount} kr
                </span>
                <button
                  onClick={async () => {
                    if (!confirm(`Ta bort "${t.description}"?`)) return
                    setLoading(true)
                    const res = await fetch('/api/transactions', {
                      method: 'DELETE',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ pin: sessionPin, id: t.id }),
                    })
                    setLoading(false)
                    if (res.ok) await onRefresh()
                    else notify('Kunde inte ta bort transaktionen', true)
                  }}
                  disabled={loading}
                  className="ml-3 text-gray-300 hover:text-rose-400 transition-colors flex-shrink-0 text-lg leading-none disabled:opacity-40"
                  title="Ta bort"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>

        {/* Settings */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <button
            onClick={() => setShowSettings((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
          >
            <span className="font-semibold text-gray-700 text-sm">⚙️ Inställningar</span>
            <span className="text-gray-400 text-sm">{showSettings ? '▲' : '▼'}</span>
          </button>

          {showSettings && (
            <form onSubmit={handleSettingsSave} className="px-5 pb-5 space-y-4 border-t border-gray-50 pt-4">
              <InputField
                label="Barnets namn"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                required
              />
              <InputField
                label="Veckopeng (kr)"
                type="number"
                min="1"
                value={weeklyAmount}
                onChange={(e) => setWeeklyAmount(e.target.value)}
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Utbetalningsdag
                </label>
                <select
                  value={topupDay}
                  onChange={(e) => setTopupDay(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white text-sm"
                >
                  {DAYS.map((d, i) => (
                    <option key={i} value={i}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs text-gray-400 mb-3">Lämna tom för att behålla befintlig PIN</p>
                <InputField
                  label="Ny PIN-kod"
                  type="password"
                  inputMode="numeric"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="Lämna tom = behåll nuvarande"
                />
              </div>
              {newPin && (
                <InputField
                  label="Upprepa ny PIN"
                  type="password"
                  inputMode="numeric"
                  value={newPin2}
                  onChange={(e) => setNewPin2(e.target.value)}
                  placeholder="••••"
                />
              )}
              <Btn type="submit" disabled={loading}>
                {loading ? 'Sparar…' : 'Spara inställningar'}
              </Btn>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main page component ─────────────────────────────────────────────────────

export default function ParentPage() {
  const [stage, setStage] = useState<Stage>('loading')
  const [data, setData] = useState<AppData | null>(null)
  const [sessionPin, setSessionPin] = useState('')
  const router = useRouter()

  async function loadData() {
    const res = await fetch('/api/balance')
    const d: AppData = await res.json()
    setData(d)
    return d
  }

  useEffect(() => {
    loadData().then((d) => {
      setStage(d.settings.has_pin ? 'pin' : 'setup')
    })
  }, [])

  async function handleSetupDone(pin: string) {
    setSessionPin(pin)
    await loadData()
    setStage('dashboard')
  }

  async function handlePinSuccess(pin: string) {
    setSessionPin(pin)
    await loadData()
    setStage('dashboard')
  }

  async function refresh() {
    await loadData()
  }

  if (stage === 'loading' || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 animate-pulse">Laddar…</div>
      </div>
    )
  }

  if (stage === 'setup') {
    return <SetupScreen onDone={handleSetupDone} />
  }

  if (stage === 'pin') {
    return (
      <PinScreen
        onSuccess={handlePinSuccess}
        onBack={() => router.push('/')}
      />
    )
  }

  return (
    <Dashboard
      data={data}
      sessionPin={sessionPin}
      onRefresh={refresh}
      onBack={() => router.push('/')}
    />
  )
}
