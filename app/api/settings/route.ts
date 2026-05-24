import { getSettings, hashPin, updateSettings, verifyPin } from '@/lib/db'

export const dynamic = 'force-dynamic'

/** Public settings — no auth required */
export async function GET() {
  const s = getSettings()
  return Response.json({
    child_name: s.child_name,
    weekly_amount: s.weekly_amount,
    topup_day: s.topup_day,
    has_pin: s.parent_pin_hash !== '',
  })
}

/** Verify PIN — returns 200 or 401 */
export async function POST(request: Request) {
  const { pin } = await request.json()
  if (!verifyPin(pin)) {
    return Response.json({ error: 'Fel PIN-kod' }, { status: 401 })
  }
  return Response.json({ ok: true })
}

/** Update settings (requires PIN, or setup flag when no PIN exists yet) */
export async function PUT(request: Request) {
  const body = await request.json() as {
    pin?: string
    setup?: boolean
    new_pin?: string
    child_name?: string
    weekly_amount?: number
    topup_day?: number
  }

  const current = getSettings()
  const hasPin = current.parent_pin_hash !== ''

  // First-time setup — no PIN exists yet
  if (!hasPin && body.setup) {
    if (!body.new_pin || body.new_pin.length < 4) {
      return Response.json({ error: 'PIN måste vara minst 4 siffror' }, { status: 400 })
    }
    updateSettings({
      parent_pin_hash: hashPin(body.new_pin),
      child_name: body.child_name || 'Barnet',
      weekly_amount: body.weekly_amount ?? 50,
      topup_day: body.topup_day ?? 6,
    })
    return Response.json({ ok: true })
  }

  // Normal update — PIN required
  if (!verifyPin(body.pin ?? '')) {
    return Response.json({ error: 'Fel PIN-kod' }, { status: 401 })
  }

  const updates: Parameters<typeof updateSettings>[0] = {}
  if (body.child_name !== undefined) updates.child_name = body.child_name
  if (body.weekly_amount !== undefined) updates.weekly_amount = body.weekly_amount
  if (body.topup_day !== undefined) updates.topup_day = body.topup_day
  if (body.new_pin) {
    if (body.new_pin.length < 4) {
      return Response.json({ error: 'PIN måste vara minst 4 siffror' }, { status: 400 })
    }
    updates.parent_pin_hash = hashPin(body.new_pin)
  }

  updateSettings(updates)
  return Response.json({ ok: true })
}
