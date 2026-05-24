import { addTransaction, getBalance, getSettings, updateSettings, verifyPin } from '@/lib/db'

export async function POST(request: Request) {
  const body = await request.json() as { pin?: string; secret?: string }

  // Allow either parent PIN or a CRON_SECRET for automated cron jobs
  const cronSecret = process.env.CRON_SECRET
  const validCron = cronSecret && body.secret === cronSecret
  const validPin = body.pin ? verifyPin(body.pin) : false

  if (!validCron && !validPin) {
    return Response.json({ error: 'Ej behörig' }, { status: 401 })
  }

  const s = getSettings()
  if (!s.parent_pin_hash) {
    return Response.json({ error: 'Appen är inte konfigurerad ännu' }, { status: 400 })
  }

  const today = new Date().toISOString().split('T')[0]
  addTransaction(s.weekly_amount, 'Veckopeng 🎁', 'topup')
  updateSettings({ last_topup_date: today })

  const balance = getBalance()
  return Response.json({ ok: true, amount: s.weekly_amount, balance })
}
